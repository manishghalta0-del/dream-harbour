import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  root: 'public',
  build: {
    outDir: '../dist',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'public/index.html'),
        dashboard: resolve(__dirname, 'public/dashboard.html'),
        invoices: resolve(__dirname, 'public/invoices.html'),
        settings: resolve(__dirname, 'public/settings.html')
      }
    }
  }
});
