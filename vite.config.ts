import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    // Only generate bundle analysis in development
    mode === 'development' &&
      visualizer({
        filename: 'bundle-analysis.html',
        open: false,
        gzipSize: true,
        brotliSize: true,
      }),
  ].filter(Boolean),

  // Environment variables that start with VITE_ will be exposed to client
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
  },

  build: {
    outDir: 'dist',
    sourcemap: false, // Disable source maps for smaller bundle
    minify: 'esbuild', // Faster minification
    target: 'esnext', // Modern browsers only for smaller bundle
    rollupOptions: {
      output: {
        manualChunks: {
          // Split vendor libraries into separate chunks
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          charts: ['recharts'],
          utils: ['papaparse', 'lucide-react'],
        },
        // Optimize chunk names for caching
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },
    chunkSizeWarningLimit: 500, // Set warning limit to 500KB
  },

  // Development server options
  server: {
    host: true, // Needed for Docker/containers
    port: 5173,
  },

  // Preview server options
  preview: {
    host: true,
    port: 4173,
  },
}));
