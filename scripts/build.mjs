import { mkdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../', import.meta.url));
mkdirSync(`${root}/build`, { recursive: true });
const result = spawnSync(process.env.CXX || 'c++', ['-std=c++11', '-O2', 'src/web_render.cc', '-o', 'build/web-render'], { cwd: root, stdio: 'inherit' });
if (result.error) console.error('A C++ compiler is required. Install Xcode Command Line Tools (macOS) or g++ (Linux).', result.error.message);
process.exit(result.status ?? 1);
