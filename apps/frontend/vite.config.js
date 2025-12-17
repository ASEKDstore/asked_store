import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:4000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  // Production build settings
  build: {
    outDir: 'dist',
    sourcemap: false, // Disable sourcemaps in production
    minify: 'esbuild',
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Only split node_modules
          if (!id.includes('node_modules')) {
            return undefined
          }

          // react-vendor: react, react-dom, react-router, react-router-dom
          if (/[\\/]node_modules[\\/](react|react-dom|react-router|react-router-dom)[\\/]/.test(id)) {
            return 'react-vendor'
          }

          // OPTIONAL: UI libraries chunk (uncomment if you use these)
          // if (/[\\/]node_modules[\\/](framer-motion|lucide-react|@radix-ui|clsx|tailwind-merge)[\\/]/.test(id)) {
          //   return 'ui'
          // }

          // All other node_modules go to vendor
          return 'vendor'
        },
      },
    },
    // Optimize chunk size
    chunkSizeWarningLimit: 1000,
  },
})





