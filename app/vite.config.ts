import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api/off-search': {
        target: 'https://search.openfoodfacts.org',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/off-search/, '/search'),
        headers: {
          'User-Agent': 'SmartcaleESP32 - Web - Version 1.1.0 (https://github.com/AtaCanYmc/SmartcaleESP32)',
        },
      },
      '/api/off-product': {
        target: 'https://world.openfoodfacts.org',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/off-product/, '/api/v2/product'),
        headers: {
          'User-Agent': 'SmartcaleESP32 - Web - Version 1.1.0 (https://github.com/AtaCanYmc/SmartcaleESP32)',
        },
      },
    },
  },
});
