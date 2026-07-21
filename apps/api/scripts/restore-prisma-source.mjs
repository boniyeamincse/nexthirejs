import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const clientSourcePath = join(__dirname, '..', 'src', 'generated', 'prisma', 'client.ts');

try {
  let content = readFileSync(clientSourcePath, 'utf-8');

  const originalPatched = `globalThis['__dirname'] = __dirname`;
  const replacement = `import * as process from 'node:process'
import * as path from 'node:path'
import { fileURLToPath } from 'node:url'
globalThis['__dirname'] = path.dirname(fileURLToPath(import.meta.url))`;

  if (!content.includes('import.meta.url')) {
    content = content.replace(originalPatched, replacement);
    writeFileSync(clientSourcePath, content, 'utf-8');
    console.log('Restored Prisma Client source to original ESM format');
  } else {
    console.log('Prisma Client source already in ESM format');
  }
} catch (err) {
  console.log('Prisma Client source not found, skipping restore:', err.message);
}
