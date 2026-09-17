import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { serializeScene, LIMITS } from './scene.mjs';
const root = fileURLToPath(new URL('../', import.meta.url));
const assets = { '/': ['index.html', 'text/html'], '/app.js': ['app.js', 'text/javascript'], '/presets.js': ['presets.js', 'text/javascript'], '/style.css': ['style.css', 'text/css'] };
let active = null;
function json(res, status, message) { res.writeHead(status, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ error: message })); }
const server = http.createServer(async (req, res) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Cache-Control', 'no-store');
  if (req.method === 'POST' && req.url === '/api/render') {
    // Reject cross-origin browser submissions; requests stay on this app's origin.
    if (req.headers.origin && req.headers.origin !== `http://${req.headers.host}` && req.headers.origin !== `https://${req.headers.host}`) return json(res, 403, 'Cross-origin renders are not allowed.');
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
    const send = data => { if (!res.destroyed) res.write(JSON.stringify(data) + '\n'); };
    const child = spawn(`${root}/build/web-render`, [], { stdio: ['pipe', 'pipe', 'pipe'] });
    active = child;
    const chunks = [];
    let size = 0, errorMessage = '', progressBuffer = '';
    const timer = setTimeout(() => { errorMessage = 'Render reached the 2-minute limit. Try fewer samples or a smaller image.'; child.kill('SIGKILL'); }, LIMITS.timeoutMs);
    res.on('close', () => { if (!res.writableEnded) child.kill('SIGKILL'); });
    child.stdout.on('data', chunk => {
      size += chunk.length;
      if (size > scene.width * scene.height * 12 + 64) { errorMessage = 'Render output exceeded its limit.'; child.kill('SIGKILL'); }
      else chunks.push(chunk);
    });
    child.stderr.on('data', chunk => {
      progressBuffer += chunk.toString();
      const matches = [...progressBuffer.matchAll(/Scanlines remaining: (\d+) /g)];
      if (matches.length) {
        const match = matches.at(-1);
        send({ progress: Math.round((1 - Number(match[1]) / scene.height) * 100) });
        progressBuffer = progressBuffer.slice(match.index + match[0].length);
      }
      if (progressBuffer.length > 1024) progressBuffer = progressBuffer.slice(-100);
    });
    child.on('error', () => { errorMessage = 'Could not start the C++ renderer. Run npm run build and try again.'; });
    child.stdin.on('error', () => {}); // Process may exit before consuming input.
    child.on('close', code => {
      clearTimeout(timer);
      active = null;
      if (res.destroyed) return;
      if (code !== 0 || errorMessage) send({ error: errorMessage || 'The renderer exited unexpectedly.' });
      else {
        const tokens = Buffer.concat(chunks).toString().trim().split(/\s+/);
        if (tokens[0] !== 'P3' || Number(tokens[1]) !== scene.width || Number(tokens[2]) !== scene.height || tokens.length !== 4 + scene.width * scene.height * 3) send({ error: 'The renderer returned an incomplete image.' });
        else send({ progress: 100, width: scene.width, height: scene.height, pixels: Buffer.from(tokens.slice(4).map(Number)).toString('base64') });
      }
      res.end();
    });
    child.stdin.end(scene.input);
    return;
  }
  if (req.method === 'GET' && assets[req.url]) {
    const [file, type] = assets[req.url];
    try { res.writeHead(200, { 'Content-Type': `${type}; charset=utf-8` }); res.end(await readFile(`${root}/web/${file}`)); }
    catch { res.end('Unable to load application.'); }
    return;
  }
  json(res, 404, 'Not found.');
});
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
