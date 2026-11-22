import react from '@vitejs/plugin-react'
import { defineProject } from 'vitest/config'
import path from 'path'

export default defineProject({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, 'src'),
    },
  },
  test: {
    name: 'web',
    environment: 'jsdom',
    setupFiles: ['./test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
  },
})