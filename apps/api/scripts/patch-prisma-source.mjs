import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const clientSourcePath = join(__dirname, '..', 'src', 'generated', 'prisma', 'client.ts');

try {
  let content = readFileSync(clientSourcePath, 'utf-8');

  const original = `import * as process from 'node:process'
import * as path from 'node:path'
import { fileURLToPath } from 'node:url'
globalThis['__dirname'] = path.dirname(fileURLToPath(import.meta.url))`;

  const replacement = `globalThis['__dirname'] = __dirname`;

  if (content.includes('import.meta.url')) {
    content = content.replace(original, replacement);
    writeFileSync(clientSourcePath, content, 'utf-8');
    console.log('Patched Prisma Client source for CJS compatibility');
  } else {
    console.log('Prisma Client source already patched or pattern not found');
  }
} catch (err) {
  console.log('Prisma Client source not found, skipping patch:', err.message);
}
