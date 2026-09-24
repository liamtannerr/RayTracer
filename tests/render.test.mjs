import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { serializeScene } from '../server/scene.mjs';
const scene = () => ({ width: 160, samples: 4, ground: '#889977', camera: { from: [7, 3, 7], at: [0, 1, 0], fov: 40 }, spheres: ['diffuse', 'metal', 'glass'].map((material, i) => ({ position: [(i - 1) * 2.1, 1, 0], radius: 1, material, color: '#ddaa88', fuzz: 0.1, ior: 1.5 })) });
let server, base;
before(async () => {
  server = spawn(process.execPath, ['server/index.mjs'], { env: { ...process.env, PORT: '0', HOST: '127.0.0.1', SERVE_FRONTEND: 'true', ALLOWED_ORIGINS: 'https://ray-studio.vercel.app, https://studio.example.com' }, stdio: ['ignore', 'pipe', 'pipe'] });
  base = await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Server failed to start')), 5000);
    server.stdout.on('data', data => { const match = data.toString().match(/http:\/\/[^\s]+/); if (match) { clearTimeout(timer); resolve(match[0]); } });
    server.stderr.on('data', data => { clearTimeout(timer); reject(new Error(data.toString())); });
    server.once('exit', code => { clearTimeout(timer); reject(new Error(`Server exited: ${code}`)); });
  });
});
after(async () => { if (server && server.exitCode === null) { const exited = once(server, 'exit'); server.kill(); await exited; } });
const post = (body, options = {}) => fetch(`${base}/api/render`, { method: 'POST', body: JSON.stringify(body), ...options });
test('rejects expensive and malformed scenes before rendering', () => {
  for (const patch of [{ width: 4000 }, { samples: 500 }, { spheres: Array(17).fill(scene().spheres[0]) }, { ground: 'red' }, { camera: { from: [0, 3, 0], at: [0, 3, 0], fov: 40 } }]) assert.throws(() => serializeScene({ ...scene(), ...patch }));
  const bad = scene(); bad.spheres[0].radius = -1; assert.throws(() => serializeScene(bad));
  bad.spheres[0].radius = 1; bad.spheres[0].position[0] = NaN; assert.throws(() => serializeScene(bad));
});
test('serves the editor and blocks unknown paths', async () => {
  const response = await fetch(base); assert.equal(response.status, 200); assert.match(await response.text(), /Ray Studio/);
  assert.equal((await fetch(`${base}/package.json`)).status, 404);
});
test('health and preflight support only configured frontend origins', async () => {
  for (const origin of ['https://ray-studio.vercel.app', 'https://studio.example.com']) {
    const health = await fetch(`${base}/api/health`, { headers: { origin } });
    assert.equal(health.status, 200);
    assert.deepEqual(await health.json(), { status: 'ok' });
    assert.equal(health.headers.get('access-control-allow-origin'), origin);
    assert.equal(health.headers.get('vary'), 'Origin');
    assert.match(health.headers.get('cache-control'), /no-store/);
    const preflight = await fetch(`${base}/api/render`, { method: 'OPTIONS', headers: { origin, 'Access-Control-Request-Method': 'POST', 'Access-Control-Request-Headers': 'content-type' } });
    assert.equal(preflight.status, 204);
    assert.equal(preflight.headers.get('access-control-allow-origin'), origin);
    assert.match(preflight.headers.get('access-control-allow-methods'), /POST/);
    assert.match(preflight.headers.get('access-control-allow-headers'), /Content-Type/i);
  }
  for (const method of ['GET', 'OPTIONS']) {
    const denied = await fetch(`${base}/api/health`, { method, headers: { origin: 'https://ray-studio.vercel.app.evil.example' } });
    assert.equal(denied.status, 403);
    assert.equal(denied.headers.get('access-control-allow-origin'), null);
  }
  const invalid = await post({}, { headers: { origin: 'https://ray-studio.vercel.app', 'content-type': 'application/json' } });
  assert.equal(invalid.status, 400);
  assert.equal(invalid.headers.get('access-control-allow-origin'), 'https://ray-studio.vercel.app');
});
test('API enforces limits and same-origin requests', async () => {
  assert.equal((await post({ ...scene(), width: 8000 })).status, 400);
  assert.equal((await post(scene(), { headers: { origin: 'https://example.com' } })).status, 403);
  assert.equal((await fetch(`${base}/api/render`, { method: 'POST', body: 'x'.repeat(17000) })).status, 413);
});
test('actual C++ render streams across an allowed frontend origin', async () => {
  const response = await post(scene(), { headers: { origin: 'https://ray-studio.vercel.app', 'content-type': 'application/json' } }); assert.equal(response.status, 200);
  assert.equal(response.headers.get('access-control-allow-origin'), 'https://ray-studio.vercel.app');
  const messages = (await response.text()).trim().split('\n').map(JSON.parse);
  assert.ok(messages.some(message => message.progress < 100));
  const result = messages.at(-1); assert.equal(result.error, undefined);
  assert.equal(result.type, 'done');
  assert.equal(messages[0].width, 160); assert.equal(messages[0].height, 90);
  const rows = messages.filter(message => message.type === 'row');
  assert.deepEqual(rows.map(row => row.row), Array.from({ length: 90 }, (_, i) => i));
  const pixels = Buffer.concat(rows.map(row => Buffer.from(row.pixels, 'base64'))); assert.equal(pixels.length, 160 * 90 * 3);
  assert.ok(new Set(pixels).size > 100, 'image should contain a range of shaded colors');
});
test('vertical and near-vertical cameras render complete, nondegenerate images', async () => {
  const views = [
    { from: [0, 10, 0], at: [0, 1, 0], fov: 38 },
    { from: [0, 0.5, 0], at: [0, 8, 0], fov: 38 },
    { from: [1e-10, 10, 0], at: [0, 1, 0], fov: 38 }
  ];
  for (const camera of views) {
    const body = { ...scene(), camera, spheres: [{ ...scene().spheres[0], position: camera.at, color: '#ff2222' }] };
    const response = await post(body);
    assert.equal(response.status, 200);
    const messages = (await response.text()).trim().split('\n').map(JSON.parse);
    assert.equal(messages.at(-1).type, 'done');
    const rows = messages.filter(message => message.type === 'row');
    assert.deepEqual(rows.map(row => row.row), Array.from({ length: 90 }, (_, i) => i));
    const pixels = Buffer.concat(rows.map(row => Buffer.from(row.pixels, 'base64')));
    assert.equal(pixels.length, 160 * 90 * 3);
    assert.ok(new Set(pixels).size > 32, 'the image must contain shaded colors, not a collapsed camera frame');
    const center = (45 * 160 + 80) * 3;
    assert.ok(pixels[center] > pixels[center + 1] * 2, 'the red sphere at the camera target must be visible in the center');
  }
});
test('coincident camera position and target are rejected with a useful error', async () => {
  const response = await post({ ...scene(), camera: { from: [0, 1, 0], at: [0, 1, 0], fov: 38 } });
  assert.equal(response.status, 400);
  assert.match((await response.json()).error, /viewing direction/);
});
test('busy renderer rejects additional jobs and cancellation releases it', async () => {
  const heavy = scene(); heavy.width = 640; heavy.samples = 32;
  heavy.spheres = Array.from({ length: 16 }, (_, i) => ({ ...scene().spheres[i % 3], position: [(i % 4) - 2, 1, Math.floor(i / 4)] }));
  const controller = new AbortController();
  const response = await post(heavy, { signal: controller.signal });
  assert.equal(response.status, 200);
  const reader = response.body.getReader();
  let partial = '';
  while (!partial.includes('"type":"row"')) {
    const chunk = await reader.read();
    assert.equal(chunk.done, false, 'a row should arrive while the render is running');
    partial += new TextDecoder().decode(chunk.value);
  }
  assert.ok(!partial.includes('"type":"done"'), 'pixels should arrive before completion');
  assert.equal((await post(scene())).status, 429);
  controller.abort();
  let next;
  for (let i = 0; i < 30; i++) {
    await new Promise(resolve => setTimeout(resolve, 50));
    next = await post(scene());
    if (next.status !== 429) break;
    await next.text();
  }
  assert.equal(next.status, 200); assert.ok((await next.text()).includes('"pixels"'));
});

test('high-detail render supports 720p at 128 samples without truncating the image', async () => {
  const response = await post({ ...scene(), width: 1280, samples: 128 });
  assert.equal(response.status, 200);
  const messages = (await response.text()).trim().split('\n').map(JSON.parse);
  const result = messages.at(-1);
  assert.equal(result.error, undefined);
  assert.equal(result.type, 'done');
  assert.equal(messages[0].width, 1280);
  assert.equal(messages[0].height, 720);
  const rows = messages.filter(message => message.type === 'row');
  assert.equal(rows.length, 720);
  assert.ok(rows.every((row, index) => row.row === index && Buffer.from(row.pixels, 'base64').length === 1280 * 3));
});
