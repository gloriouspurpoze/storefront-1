import { describe, expect, it } from 'vitest'
import { PRODUCTIZED_VERTICAL_KEYS } from '@profixer/marketing-data'
import { previewFor } from '../content/previews'

describe('marketing previews', () => {
  it('gives every productized industry its own sample data', () => {
    const businesses = PRODUCTIZED_VERTICAL_KEYS.map((key) => previewFor(key).business)
    expect(new Set(businesses).size).toBe(businesses.length)
    expect(previewFor('salon').business).not.toBe(previewFor('fitness').business)
  })

  it('falls back to the shared default for early-access industries', () => {
    expect(previewFor('fitness')).toBe(previewFor('education'))
  })

  it('keeps the data the mocks index into', () => {
    for (const key of ['home_services', 'salon', 'restaurant', 'retail', 'fitness'] as const) {
      const p = previewFor(key)
      expect(p.kpis).toHaveLength(4)
      expect(p.today.length).toBeGreaterThanOrEqual(3)
      expect(p.items.length).toBeGreaterThanOrEqual(2)
      expect(p.toasts).toHaveLength(2)
    }
  })
})
