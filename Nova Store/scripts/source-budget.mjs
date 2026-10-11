import { readdir, stat, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';
const root = fileURLToPath(new URL('../', import.meta.url));
const files = [];
for (const file of await readdir(join(root, 'assets'))) if (/\.(css|js)$/.test(file)) { const bytes = await readFile(join(root, 'assets', file)); files.push({ file, rawBytes: bytes.length, gzipBytes: gzipSync(bytes).length }); }
console.log(JSON.stringify({ files, totalRawBytes: files.reduce((sum, file) => sum + file.rawBytes, 0), totalGzipBytes: files.reduce((sum, file) => sum + file.gzipBytes, 0), note: 'Static local assets only. Not a network transfer or Core Web Vitals measurement.' }, null, 2));
