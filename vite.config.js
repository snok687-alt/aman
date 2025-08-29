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
        rewrite: path => path.replace(/^\/api/, '/api.php'),
        // เพิ่ม headers เพื่อป้องกัน CORS issues
        headers: {
          'Referer': 'https://ckzy.me',
          'Origin': 'https://ckzy.me'
        }
      }
    }
  },
  // เพิ่ม optimizeDeps เพื่อปรับปรุง performance
  optimizeDeps: {
    include: ['axios']
  }
});

