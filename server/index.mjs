import http from 'node:http';
import { PpmStream } from './ppm-stream.mjs';
import { readFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { serializeScene } from './scene.mjs';
const root = fileURLToPath(new URL('../', import.meta.url));
const assets = { '/': ['index.html', 'text/html'], '/app.js': ['app.js', 'text/javascript'], '/backend.js': ['backend.js', 'text/javascript'], '/config.js': ['config.js', 'text/javascript'], '/presets.js': ['presets.js', 'text/javascript'], '/style.css': ['style.css', 'text/css'], '/placeholder.png': ['placeholder.png', 'image/png'] };
const allowedOrigins = new Set((process.env.ALLOWED_ORIGINS || '').split(',').map(origin => origin.trim()).filter(Boolean));
let active = null;
function json(res, status, message) { res.writeHead(status, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ error: message })); }
const server = http.createServer(async (req, res) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Cache-Control', 'no-store, no-transform');
  if (req.url === '/api/health' || req.url === '/api/render') {
    const origin = req.headers.origin;
    res.setHeader('Vary', 'Origin');
    if (origin) {
      const sameOrigin = origin === `http://${req.headers.host}` || origin === `https://${req.headers.host}`;
      if (!sameOrigin && !allowedOrigins.has(origin)) return json(res, 403, 'This frontend origin is not allowed.');
      res.setHeader('Access-Control-Allow-Origin', origin);
    }
    if (req.method === 'OPTIONS') {
      res.writeHead(204, { 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type', 'Access-Control-Max-Age': '600' });
      res.end();
      return;
    }
  }
  if (req.method === 'GET' && req.url === '/api/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok' }));
    return;
  }
  if (req.method === 'POST' && req.url === '/api/render') {
    let scene;
    try {
      let body = '';
      for await (const chunk of req) {
        body += chunk;
        if (Buffer.byteLength(body) > 16384) { json(res, 413, 'Scene is too large.'); return; }
      }
      scene = serializeScene(JSON.parse(body));
    } catch (error) { return json(res, 400, error.message); }
    if (active) return json(res, 429, 'The renderer is busy. Please try again shortly.');
    res.writeHead(200, { 'Content-Type': 'application/x-ndjson', 'X-Accel-Buffering': 'no' });
    const send = data => !res.destroyed && res.write(JSON.stringify(data) + '\n');
    const child = spawn(`${root}/build/web-render`, [], { stdio: ['pipe', 'pipe', 'pipe'] });
    active = child;
    send({ type: 'start', width: scene.width, height: scene.height, progress: 0 });
    let size = 0, errorMessage = '';
    const parser = new PpmStream(scene.width, scene.height, (row, pixels) => {
      if (!send({ type: 'row', row, pixels, progress: Math.floor((row + 1) / scene.height * 100) })) child.stdout.pause();
    });
    res.on('drain', () => child.stdout.resume());
    const stop = message => {
      errorMessage = message;
      child.kill('SIGKILL');
      // Drain a paused pipe so the child can close even if the client disconnected.
      child.stdout.resume();
    };
    res.on('close', () => { if (!res.writableEnded) stop('Render cancelled.'); });
    child.stdout.on('data', chunk => {
      size += chunk.length;
      if (size > scene.width * scene.height * 12 + 64) stop('Render output exceeded its limit.');
      else if (!errorMessage) {
        try { parser.push(chunk); }
        catch (error) { stop(error.message); }
      }
    });
    child.stderr.resume(); // Progress comes from rows actually sent to the browser.
    child.on('error', () => { errorMessage = 'Could not start the C++ renderer. Run npm run build and try again.'; });
    child.stdin.on('error', () => {}); // Process may exit before consuming input.
    child.on('close', code => {
      active = null;
      if (res.destroyed) return;
      if (code !== 0 || errorMessage) send({ error: errorMessage || 'The renderer exited unexpectedly.' });
      else {
        try { parser.finish(); send({ type: 'done', progress: 100 }); }
        catch (error) { send({ error: error.message }); }
      }
      res.end();
    });
    child.stdin.end(scene.input);
    return;
  }
  if (process.env.SERVE_FRONTEND !== 'false' && req.method === 'GET' && assets[req.url]) {
    const [file, type] = assets[req.url];
    try { res.writeHead(200, { 'Content-Type': `${type}; charset=utf-8` }); res.end(await readFile(`${root}/web/${file}`)); }
    catch { res.end('Unable to load application.'); }
    return;
  }
  json(res, 404, 'Not found.');
});
// Limit request uploads, not the duration of the streamed render response.
server.requestTimeout = 10000;
const host = process.env.HOST || '127.0.0.1';
let port = Number(process.env.PORT || 5173);
server.on('error', error => {
  if (error.code === 'EADDRINUSE' && !process.env.PORT && port < 5183) {
    console.log(`Port ${port} is busy; trying ${port + 1}.`);
    server.listen(++port, host);
  } else { console.error(`Could not start server: ${error.message}`); process.exit(1); }
});
server.on('listening', () => console.log(`Ray Tracer Studio → http://${host}:${server.address().port}`));
server.listen(port, host);
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => { active?.kill('SIGKILL'); server.close(); process.exit(0); });
