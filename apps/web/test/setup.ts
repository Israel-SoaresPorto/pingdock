import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, vi } from 'vitest'

vi.stubGlobal('fetch', vi.fn<typeof fetch>())

afterEach(() => {
  cleanup()
  vi.resetAllMocks()
})