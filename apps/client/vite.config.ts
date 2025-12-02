import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Vendor chunks for large libraries
          if (id.includes('node_modules')) {
            // React and React DOM
            if (
              id.includes('react') ||
              id.includes('react-dom') ||
              id.includes('scheduler')
            ) {
              return 'vendor-react';
            }
            // React Router
            if (id.includes('react-router')) {
              return 'vendor-router';
            }
            // TanStack Query
            if (id.includes('@tanstack/react-query')) {
              return 'vendor-query';
            }
            // Clerk
            if (id.includes('@clerk')) {
              return 'vendor-clerk';
            }
            // Markdown libraries
            if (
              id.includes('react-markdown') ||
              id.includes('remark-') ||
              id.includes('rehype-')
            ) {
              return 'vendor-markdown';
            }
            // Other node_modules
            return 'vendor';
          }
          // Application chunks
          if (id.includes('/src/pages/chat/')) {
            return 'page-chat';
          }
          if (id.includes('/src/pages/config/')) {
            return 'page-config';
          }
          if (id.includes('/src/pages/profile/')) {
            return 'page-profile';
          }
          if (id.includes('/src/services/')) {
            return 'services';
          }
          if (id.includes('/src/components/ui/')) {
            return 'ui-components';
          }
        },
      },
    },
    chunkSizeWarningLimit: 600,
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    css: true,
    testTimeout: 5000, // 5 second timeout per test (allows for async operations)
    hookTimeout: 5000,
    teardownTimeout: 1000,
  },
});
