import { vi } from 'vitest'

// Unit tests must explicitly mock HTTP. No developer/CI environment may charge a real account.
vi.stubGlobal('fetch', vi.fn(() => { throw new Error('Unmocked network request blocked in unit tests') }))
