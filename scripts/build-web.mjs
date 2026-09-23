import { cp, mkdir, writeFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const configured = process.env.BACKEND_URL?.trim() || '';
if (process.env.VERCEL && !configured) throw new Error('Set BACKEND_URL to your Render service URL before deploying.');
let backendUrl = '';
if (configured) {
  const url = new URL(configured);
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.pathname !== '/' || url.search || url.hash) {
    throw new Error('BACKEND_URL must be an HTTP(S) origin, such as https://ray-studio.onrender.com.');
  }
  backendUrl = url.origin;
}
await mkdir(new URL('dist/', root), { recursive: true });
await cp(new URL('web/', root), new URL('dist/', root), { recursive: true });
await writeFile(new URL('dist/config.js', root), `export const backendUrl = ${JSON.stringify(backendUrl)};\n`);
console.log(`Frontend built in dist/ (API: ${backendUrl || 'same origin'}).`);
