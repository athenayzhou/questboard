import { vi } from 'vitest'
import '@testing-library/jest-dom'

const storage: Record<string, string> = {}
const localStorageMock = {
  getItem: vi.fn((key: string) => storage[key] ?? null),
  setItem: vi.fn((key: string, value: string) => {
    storage[key] = value
  }),
  removeItem: vi.fn((key: string) => {
    delete storage[key]
  }),
  clear: vi.fn(() => {
    Object.keys(storage).forEach((k) => delete storage[k])
  }),
}

;(globalThis as any).localStorage = localStorageMock

let uuidCounter = 0
Object.defineProperty(globalThis, 'crypto', {
  value: {
    randomUUID: () => `test-uuid-${++uuidCounter}`,
  },
})