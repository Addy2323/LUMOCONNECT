import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    setupFiles: ['./tests/block-network.ts'],
  },
  resolve: {
    alias: {
      'server-only': path.resolve(__dirname, './tests/server-only.ts'),
      '@/app': path.resolve(__dirname, './app'),
      '@': path.resolve(__dirname, './src'),
    },
  },
})
