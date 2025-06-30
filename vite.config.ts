import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  build: {
    // Production optimizations
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ui: ['framer-motion', 'lucide-react'],
          stripe: ['@stripe/stripe-js'],
        },
      },
    },
    // Enable source maps for production debugging
    sourcemap: true,
  },
  server: {
    // Development server optimizations
    hmr: {
      overlay: false,
    },
  },
  // PWA and performance optimizations
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
  },
});