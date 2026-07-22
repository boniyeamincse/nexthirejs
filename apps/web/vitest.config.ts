import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'css-module-mock',
      enforce: 'pre',
      resolveId(id) {
        if (id.endsWith('.module.css')) {
          return '\0css-module:' + id;
        }
      },
      load(id) {
        if (id.startsWith('\0css-module:')) {
          return 'export default new Proxy({}, { get: (_, prop) => prop })';
        }
      },
    },
  ],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/**/*.test.tsx', 'src/**/*.test.tsx'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
