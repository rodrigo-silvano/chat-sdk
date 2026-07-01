import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  build: {
    lib: {
      entry: resolve(__dirname, 'src/loader.ts'),
      name: 'ChatSDKLoader',
      formats: ['iife'],
      fileName: () => 'loader.js',
    },
    rollupOptions: {
      output: {
        extend: true,
        entryFileNames: 'loader.js',
      },
    },
    emptyOutDir: false,
  },
});
