import { fetch } from 'lib/fetch'

describe('wrapped fetch', () => {
  it('should export fetch', () => {
    expect(typeof fetch === 'function').toBe(true)
  })
})
