import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { readFileSync } from 'fs'
import { execSync } from 'child_process'

// Read package.json for version
const pkg = JSON.parse(readFileSync('./package.json', 'utf-8'))

// Get git commit hash (fallback to 'dev' if git is not available)
let gitCommit = 'dev'
try {
  gitCommit = execSync('git rev-parse --short HEAD', { encoding: 'utf-8' }).trim()
} catch {
  // Fallback: try environment variables (Render, Vercel, etc.)
  gitCommit = process.env.RENDER_GIT_COMMIT || 
              process.env.COMMIT_SHA || 
              process.env.VERCEL_GIT_COMMIT_SHA ||
              'dev'
}

export default defineConfig({
  plugins: [react()],
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
    __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
    __GIT_COMMIT__: JSON.stringify(gitCommit),
  },
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





