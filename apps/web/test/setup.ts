import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, vi } from 'vitest'

const localStorageStore = new Map<string, string>()

const localStorageMock: Storage = {
  get length() {
    return localStorageStore.size
  },
  clear: vi.fn(() => {
    localStorageStore.clear()
  }),
  getItem: vi.fn((key: string) => localStorageStore.get(key) ?? null),
  key: vi.fn((index: number) => [...localStorageStore.keys()][index] ?? null),
  removeItem: vi.fn((key: string) => {
    localStorageStore.delete(key)
  }),
  setItem: vi.fn((key: string, value: string) => {
    localStorageStore.set(key, value)
  }),
}

vi.stubGlobal('fetch', vi.fn<typeof fetch>())

Object.defineProperty(window, 'localStorage', {
  configurable: true,
  value: localStorageMock,
})

afterEach(() => {
  cleanup()
  localStorageMock.clear()
  vi.clearAllMocks()
  vi.mocked(globalThis.fetch).mockReset()
})