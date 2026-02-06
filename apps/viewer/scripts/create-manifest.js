import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const manifestPath = resolve(__dirname, '../.svelte-kit/output/server/manifest.js');

mkdirSync(dirname(manifestPath), { recursive: true });
writeFileSync(manifestPath, "export { manifest } from './manifest-full.js';\n", 'utf-8');
