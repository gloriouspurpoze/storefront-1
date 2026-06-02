import { extractTenantFromAuthPayload } from '../extractTenantFromAuth'

describe('extractTenantFromAuthPayload', () => {
  it('returns null when no tenant info is present', () => {
    expect(extractTenantFromAuthPayload({ user: { id: 'u1' } })).toBeNull()
  })

  it('extracts id/name/slug from a top-level tenant', () => {
    const ref = extractTenantFromAuthPayload({
      tenant: { id: 't1', name: 'Brown Butter', slug: 'brown-butter' },
    })
    expect(ref).toMatchObject({ id: 't1', name: 'Brown Butter', slug: 'brown-butter' })
  })

  it('forwards featureModules allowlist from a nested user.tenant payload (sidebar gate input)', () => {
    const ref = extractTenantFromAuthPayload({
      user: {
        id: 'u1',
        tenant: {
          id: 't1',
          name: 'Brown Butter',
          featureModules: ['cms', 'ecommerce'],
          verticalKey: 'home_services',
          planKey: 'rest_starter',
          billingStatus: 'active',
        },
      },
    })
    expect(ref).toEqual({
      id: 't1',
      name: 'Brown Butter',
      featureModules: ['cms', 'ecommerce'],
      verticalKey: 'home_services',
      planKey: 'rest_starter',
      billingStatus: 'active',
    })
  })

  it('preserves null featureModules (full access) distinct from an empty allowlist', () => {
    const refNull = extractTenantFromAuthPayload({
      tenant: { id: 't1', featureModules: null },
    })
    const refEmpty = extractTenantFromAuthPayload({
      tenant: { id: 't1', featureModules: [] },
    })
    expect(refNull?.featureModules).toBeNull()
    expect(refEmpty?.featureModules).toEqual([])
  })

  it('strips non-string entries from featureModules', () => {
    const ref = extractTenantFromAuthPayload({
      tenant: {
        id: 't1',
        featureModules: ['cms', 42, null, 'crm'],
      },
    })
    expect(ref?.featureModules).toEqual(['cms', 'crm'])
  })

  it('accepts snake_case feature_modules / vertical_key (legacy / public payload)', () => {
    const ref = extractTenantFromAuthPayload({
      tenant: {
        id: 't1',
        feature_modules: ['finance'],
        vertical_key: 'home_services',
        plan_key: 'rest_starter',
        billing_status: 'active',
      },
    })
    expect(ref).toMatchObject({
      id: 't1',
      featureModules: ['finance'],
      verticalKey: 'home_services',
      planKey: 'rest_starter',
      billingStatus: 'active',
    })
  })
})
