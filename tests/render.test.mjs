import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { serializeScene } from '../server/scene.mjs';
const scene = () => ({ width: 160, samples: 4, ground: '#889977', camera: { from: [7, 3, 7], at: [0, 1, 0], fov: 40 }, spheres: ['diffuse', 'metal', 'glass'].map((material, i) => ({ position: [(i - 1) * 2.1, 1, 0], radius: 1, material, color: '#ddaa88', fuzz: 0.1, ior: 1.5 })) });
let server, base;
before(async () => {
  server = spawn(process.execPath, ['server/index.mjs'], { env: { ...process.env, PORT: '0', HOST: '127.0.0.1' }, stdio: ['ignore', 'pipe', 'pipe'] });
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
  for (const patch of [{ width: 4000 }, { samples: 500 }, { spheres: Array(17).fill(scene().spheres[0]) }, { ground: 'red' }, { camera: { from: [0, 3, 0], at: [0, 0, 0], fov: 40 } }]) assert.throws(() => serializeScene({ ...scene(), ...patch }));
  const bad = scene(); bad.spheres[0].radius = -1; assert.throws(() => serializeScene(bad));
  bad.spheres[0].radius = 1; bad.spheres[0].position[0] = NaN; assert.throws(() => serializeScene(bad));
});
test('serves the editor and blocks unknown paths', async () => {
  const response = await fetch(base); assert.equal(response.status, 200); assert.match(await response.text(), /Ray Studio/);
  assert.equal((await fetch(`${base}/package.json`)).status, 404);
});
test('API enforces limits and same-origin requests', async () => {
  assert.equal((await post({ ...scene(), width: 8000 })).status, 400);
  assert.equal((await post(scene(), { headers: { origin: 'https://example.com' } })).status, 403);
  assert.equal((await fetch(`${base}/api/render`, { method: 'POST', body: 'x'.repeat(17000) })).status, 413);
});
test('actual C++ render returns complete RGB data and progress', async () => {
  const response = await post(scene()); assert.equal(response.status, 200);
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
