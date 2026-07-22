import { cpSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const distDir = new URL('../dist', import.meta.url);

function visit(directory) {
  for (const entry of readdirSync(directory)) {
    const entryPath = join(directory, entry);
    const stats = statSync(entryPath);

    if (stats.isDirectory()) {
      visit(entryPath);
      continue;
    }

    if (entry.endsWith('.d.ts')) {
      cpSync(entryPath, entryPath.replace(/\.d\.ts$/, '.d.mts'));
      continue;
    }

    if (entry.endsWith('.d.ts.map')) {
      cpSync(entryPath, entryPath.replace(/\.d\.ts\.map$/, '.d.mts.map'));
    }
  }
}

visit(distDir.pathname);
