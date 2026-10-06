import { describe, expect, it } from 'vitest'
import { ownTenantTestimonials } from '@/lib/cms-content'

describe('ownTenantTestimonials', () => {
  it('drops testimonials from other workspaces and rows without an owner', () => {
    const rows = [
      { customerName: 'Mine', tenantId: 'aaaaaaaaaaaaaaaaaaaaaaaa' },
      { customerName: 'Other store', tenantId: 'bbbbbbbbbbbbbbbbbbbbbbbb' },
      { customerName: 'Legacy, no owner' },
    ]
    expect(ownTenantTestimonials(rows, 'aaaaaaaaaaaaaaaaaaaaaaaa').map((r) => r.customerName)).toEqual(['Mine'])
  })
})
