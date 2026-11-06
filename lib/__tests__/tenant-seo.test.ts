import { afterEach, describe, expect, it, vi } from 'vitest'
import { seoOverridable, withTenantSeoOverride } from '../tenant-seo'

function mockRow(row: Record<string, unknown> | null) {
  const fetchMock = vi.fn(async () => new Response(JSON.stringify({ success: true, data: row }), { status: 200 }))
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

afterEach(() => vi.unstubAllGlobals())

describe('tenant Page-titles overrides', () => {
  it('applies title, description, og and noindex from the tenant entry', async () => {
    mockRow({ title: 'Thick NYC Cookie', description: 'Slow-baked.', robots: 'noindex, follow', isActive: true })
    const meta = await withTenantSeoOverride('t1', '/products/x', { title: 'Default', openGraph: { siteName: 'BB' } })
    expect(meta.title).toEqual({ absolute: 'Thick NYC Cookie' })
    expect(meta.description).toBe('Slow-baked.')
    expect(meta.openGraph).toMatchObject({ siteName: 'BB', title: 'Thick NYC Cookie' })
    expect(meta.robots).toEqual({ index: false, follow: true })
  })

  it('keeps built-in metadata when there is no entry or it is inactive', async () => {
    mockRow(null)
    expect(await withTenantSeoOverride('t1', '/menu', { title: 'Menu' })).toEqual({ title: 'Menu' })
    mockRow({ title: 'Off', isActive: false })
    expect(await withTenantSeoOverride('t1', '/menu', { title: 'Menu' })).toEqual({ title: 'Menu' })
  })

  it('looks up the public path for the route with the tenant header', async () => {
    const fetchMock = mockRow({ title: 'Cookie' })
    const gen = seoOverridable((p) => `/products/${p.slug}`, async () => ({ title: 'Default' }))
    const meta = await gen({ params: Promise.resolve({ tenantId: 't1', slug: 'classic-og-nyc-cookie' }) })
    expect(meta.title).toEqual({ absolute: 'Cookie' })
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, { headers: Record<string, string> }]
    expect(url).toContain(encodeURIComponent('/products/classic-og-nyc-cookie'))
    expect(JSON.stringify(init.headers)).toContain('t1')
  })
})
