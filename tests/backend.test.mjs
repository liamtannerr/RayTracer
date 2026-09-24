import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Backend } from '../web/backend.js';

const healthy = () => Response.json({ status: 'ok' });
test('the default fetcher preserves the native browser fetch receiver', async () => {
  const originalFetch = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = function () {
    calls++;
    if (this !== undefined && this !== globalThis) throw new TypeError('Illegal invocation');
    return Promise.resolve(healthy());
  };
  try {
    const backend = new Backend('https://renderer.example', () => {}, { attempts: 1 });
    assert.equal(await backend.wake(), true);
    assert.equal(backend.ready, true);
    assert.equal(calls, 1);
  } finally { globalThis.fetch = originalFetch; }
});

test('wake retries cold-start HTML and network errors, shares a pending check, and stops once healthy', async () => {
  const states = [], requests = [];
  const backend = new Backend('https://renderer.example', state => states.push(state), {
    retryMs: 0,
    fetcher: async (url, options) => {
      requests.push(url);
      assert.equal(options.cache, 'no-store');
      assert.ok(options.signal);
      if (requests.length === 1) return new Response('<html>Starting up</html>', { headers: { 'content-type': 'text/html' } });
      if (requests.length === 2) throw new TypeError('Failed to fetch');
      return healthy();
    }
  });
  const first = backend.wake();
  assert.equal(backend.wake(), first);
  assert.equal(backend.ready, false);
  assert.equal(await first, true);
  assert.equal(backend.ready, true);
  assert.deepEqual(states, ['warming', 'ready']);
  assert.deepEqual(requests, Array(3).fill('https://renderer.example/api/health'));
});
test('failed checks stop after the retry budget and can be retried by the user', async () => {
  let available = false, calls = 0;
  const backend = new Backend('', () => {}, { retryMs: 0, attempts: 2, fetcher: async () => {
    calls++;
    return available ? healthy() : Response.json({ status: 'starting' });
  } });
  assert.equal(await backend.wake(), false);
  assert.equal(backend.state, 'unavailable');
  assert.equal(calls, 2);
  available = true;
  assert.equal(await backend.wake(), true);
  assert.equal(calls, 3);
});
test('an idle tab checks readiness again instead of trusting an old successful check', async () => {
  let time = 0;
  const backend = new Backend('', () => {}, { fetcher: async () => healthy(), now: () => time });
  await backend.wake();
  assert.equal(backend.ready, true);
  time = 60001;
  assert.equal(backend.ready, false);
  await backend.wake();
  assert.equal(backend.ready, true);
});
test('a stalled health request times out and finishes the warm-up attempt', async () => {
  const keepAlive = setInterval(() => {}, 1000);
  try {
    const backend = new Backend('', () => {}, { timeoutMs: 10, attempts: 1, fetcher: (url, { signal }) => new Promise((resolve, reject) => {
      signal.addEventListener('abort', () => reject(signal.reason), { once: true });
    }) });
    assert.equal(await backend.wake(), false);
    assert.equal(backend.state, 'unavailable');
  } finally { clearInterval(keepAlive); }
});
