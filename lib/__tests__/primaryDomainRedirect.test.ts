import { describe, expect, it } from 'vitest'
import { primaryRedirectUrl } from '../primaryDomainRedirect'

const base = {
  host: 'acme.torqstudio.com',
  primaryHost: 'acme.com',
  method: 'GET',
  pathname: '/menu',
  search: '?x=1',
  hasPreview: false,
}

describe('primaryRedirectUrl', () => {
  it('redirects other hosts to the primary, keeping path and query', () => {
    expect(primaryRedirectUrl(base)).toBe('https://acme.com/menu?x=1')
    expect(primaryRedirectUrl({ ...base, host: 'www.acme.com:443' })).toBe('https://acme.com/menu?x=1')
  })

  it('does nothing on the primary itself or without a primary', () => {
    expect(primaryRedirectUrl({ ...base, host: 'ACME.com' })).toBeNull()
    expect(primaryRedirectUrl({ ...base, primaryHost: null })).toBeNull()
  })

  it('skips local dev, writes, previews, and the kill switch', () => {
    expect(primaryRedirectUrl({ ...base, host: 'acme.lvh.me:3001' })).toBeNull()
    expect(primaryRedirectUrl({ ...base, host: 'acme.torqstudio.localhost' })).toBeNull()
    expect(primaryRedirectUrl({ ...base, host: 'localhost:3001' })).toBeNull()
    expect(primaryRedirectUrl({ ...base, method: 'POST' })).toBeNull()
    expect(primaryRedirectUrl({ ...base, hasPreview: true })).toBeNull()
    expect(primaryRedirectUrl({ ...base, disabled: true })).toBeNull()
  })
})
