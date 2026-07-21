import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const clientPath = join(__dirname, '..', 'dist', 'src', 'generated', 'prisma', 'client.js');

try {
  let content = readFileSync(clientPath, 'utf-8');
  const original = 'import.meta.url';
  const replacement = 'require("url").pathToFileURL(__filename).href';

  if (content.includes(original)) {
    content = content.replace(original, replacement);
    writeFileSync(clientPath, content, 'utf-8');
    console.log('Patched Prisma Client for CJS compatibility');
  } else {
    console.log('Prisma Client already patched or pattern not found');
  }
} catch (err) {
  console.log('Prisma Client not found, skipping patch:', err.message);
}
