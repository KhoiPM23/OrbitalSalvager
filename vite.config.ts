import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  server: {
    port: 7004,
    strictPort: true,
    open: false
  },
  preview: {
    port: 7004,
    strictPort: true
  }
});
