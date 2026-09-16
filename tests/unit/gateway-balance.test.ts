import { afterEach, describe, expect, it, vi } from 'vitest'
import { SnippePaymentAdapter } from '@/lib/providers/snippe'

afterEach(() => {
  vi.stubGlobal('fetch', vi.fn(() => { throw new Error('Unmocked network request blocked in unit tests') }))
})

const testAdapter = new SnippePaymentAdapter({ apiKey: 'test_api_key' })

describe('Gateway balance provenance', () => {
  it('preserves a real zero balance', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ status: 'success', data: { available: { value: 0 }, balance: { currency: 'TZS', value: 0 } } })))
    expect(await testAdapter.getAccountBalance()).toEqual({ currency: 'TZS', available: 0, balance: 0 })
  })
  it('reports missing balance fields as unavailable rather than zero', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ status: 'success', data: {} })))
    await expect(testAdapter.getAccountBalance()).rejects.toThrow('unavailable')
  })
  it('rejects failed provider responses', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ status: 'error' }, { status: 502 })))
    await expect(testAdapter.getAccountBalance()).rejects.toThrow()
  })
})
