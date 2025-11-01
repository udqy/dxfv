import { defineConfig } from 'vite';

export default defineConfig({
  base: '/dxfv/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
  },
});
