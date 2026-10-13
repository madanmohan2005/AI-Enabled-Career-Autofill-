import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    outDir: 'dist',
    emptyOutDir: false,
    lib: {
      entry: resolve(__dirname, 'src/content/content.ts'),
      name: 'CareerFillContent',
      formats: ['iife'],
      fileName: () => 'content/content.js'
    }
  }
});
