import { defineConfig } from 'vite';

export default defineConfig({
  base: '/dxf-view/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
  },
});
