// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [
    tailwindcss(),
    react()
  ],
  server: {
    proxy: {
      '/api': {
        target: 'https://ckzy.me',
        changeOrigin: true,
        rewrite: path => path.replace(/^\/api/, '/api.php'), // /api -> /api.php
      }
    }
  }
});
