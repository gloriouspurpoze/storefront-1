import { describe, expect, it } from 'vitest'
import { MAX_TITLE_LENGTH, pageMetadata, skipTitleSuffix } from '../seo'

describe('skipTitleSuffix', () => {
  it('keeps the brand suffix on short titles', () => {
    expect(skipTitleSuffix('Pricing — plans in INR')).toBe(false)
  })

  it('drops the suffix when the title already names the brand', () => {
    expect(skipTitleSuffix('Pricing — Torq Studio')).toBe(true)
  })

  it('drops the suffix when it would push the title past what Google shows', () => {
    const title = 'Marketplace (multi-vendor) software — bookings, CRM & billing'
    expect(title.length).toBeLessThanOrEqual(MAX_TITLE_LENGTH + 5)
    expect(skipTitleSuffix(title)).toBe(true)
  })
})

describe('pageMetadata', () => {
  it('emits an absolute title for long titles and a canonical URL', () => {
    const meta = pageMetadata({
      title: 'GST-ready invoicing for small businesses: what your invoice must show',
      description: 'd',
      path: '/blog/gst',
    })
    expect(meta.title).toEqual({ absolute: 'GST-ready invoicing for small businesses: what your invoice must show' })
    expect(String(meta.alternates?.canonical)).toMatch(/\/blog\/gst$/)
  })

  it('lets the layout template add the suffix for short titles', () => {
    expect(pageMetadata({ title: 'Blog', description: 'd', path: '/blog' }).title).toBe('Blog')
  })
})
