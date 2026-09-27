import path from 'node:path'
import { fileURLToPath } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

const rootDir = fileURLToPath(new URL('.', import.meta.url))

export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    environment: 'jsdom',
    setupFiles: './src/tests/setup.ts',
    globals: false,
  },
  resolve: {
    alias: {
      '@': path.resolve(rootDir, 'src'),
    },
    dedupe: ['react', 'react-dom'],
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-redux', '@reduxjs/toolkit', 'redux-persist'],
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
        cookieDomainRewrite: 'localhost',
      },
    },
  },
})
