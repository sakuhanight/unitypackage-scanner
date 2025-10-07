import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  root: 'src/renderer',
  base: './',
  build: {
    outDir: '../../dist/renderer',
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@/shared': resolve(__dirname, 'src/shared'),
      '@/renderer': resolve(__dirname, 'src/renderer'),
      '@/main': resolve(__dirname, 'src/main'),
    },
  },
  server: {
    port: 3000,
  },
});