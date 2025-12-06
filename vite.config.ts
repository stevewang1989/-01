import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Proxying API requests to bypass CORS during local development
      '/api-proxy': {
        target: 'https://api3.binance.com', // Attempting api3
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api-proxy/, ''),
        secure: false, 
        timeout: 15000,
        proxyTimeout: 15000,
        configure: (proxy, _options) => {
          (proxy as any).on('error', (err: any, _req: any, _res: any) => {
            console.log('Proxy Error:', err.message);
          });
        },
      },
    },
  },
});
