import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    exclude: process.env.RUN_QUESTBOARD
      ? []
      : ['**/QuestBoard.test.tsx'],
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    testTimeout: 10000,
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/_tests_/**', 'src/test/**', '**/*.test.{ts,tsx}', '**/*.d.ts'],
    },
  },
})