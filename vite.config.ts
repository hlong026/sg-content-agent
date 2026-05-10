import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  root: resolve(__dirname, 'packages/client'),
  plugins: [vue()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'packages/client/src'),
    },
  },
  server: {
    port: 8649,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8649',
        changeOrigin: true,
      },
      '/health': {
        target: 'http://127.0.0.1:8649',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: resolve(__dirname, 'dist/client'),
    emptyOutDir: true,
  },
})
