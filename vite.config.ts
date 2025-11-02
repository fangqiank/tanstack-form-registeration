import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    global: 'globalThis',
    'process.env': {},
    Buffer: 'globalThis.Buffer || { allocUnsafe: () => new Uint8Array(0) }',
  },
  optimizeDeps: {
    include: ['buffer', 'process'],
    exclude: ['postgres'],
  },
  resolve: {
    alias: {
      'perf_hooks': 'empty-module',
      'crypto': 'empty-module',
      'stream': 'empty-module',
      'util': 'empty-module',
      'path': 'empty-module',
      'fs': 'empty-module',
      'os': 'empty-module',
    },
  },
  server: {
    fs: {
      allow: ['..'],
    },
  },
})
