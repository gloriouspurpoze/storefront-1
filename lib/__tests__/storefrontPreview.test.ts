import { describe, expect, it } from 'vitest'
import {
  buildPreviewCookieValue,
  isValidPreviewToken,
  isValidPreviewVersionId,
  parsePreviewCookie,
} from '../storefrontPreview'

const V = '0123456789abcdef01234567'
const T = 'abcDEF_123-xyz7890'

describe('preview param validation', () => {
  it('accepts 24-hex version ids only', () => {
    expect(isValidPreviewVersionId(V)).toBe(true)
    expect(isValidPreviewVersionId(V.toUpperCase())).toBe(false)
    expect(isValidPreviewVersionId(V.slice(1))).toBe(false)
    expect(isValidPreviewVersionId(undefined)).toBe(false)
  })

  it('accepts url-safe tokens of 16-128 chars', () => {
    expect(isValidPreviewToken(T)).toBe(true)
    expect(isValidPreviewToken('a'.repeat(15))).toBe(false)
    expect(isValidPreviewToken('a'.repeat(128))).toBe(true)
    expect(isValidPreviewToken('a'.repeat(129))).toBe(false)
    expect(isValidPreviewToken('abcdefghijklmnop.')).toBe(false)
  })
})

describe('preview cookie value', () => {
  it('round-trips build → parse', () => {
    const value = buildPreviewCookieValue(V, T)
    expect(value).toBe(`${V}.${T}`)
    expect(parsePreviewCookie(value)).toEqual({ versionId: V, token: T })
  })

  it('refuses to build from invalid params', () => {
    expect(buildPreviewCookieValue('nope', T)).toBeNull()
    expect(buildPreviewCookieValue(V, 'short')).toBeNull()
  })

  it('rejects malformed cookie values', () => {
    expect(parsePreviewCookie(undefined)).toBeNull()
    expect(parsePreviewCookie('')).toBeNull()
    expect(parsePreviewCookie(V)).toBeNull()
    expect(parsePreviewCookie(`.${T}`)).toBeNull()
    expect(parsePreviewCookie(`${V}.${T}.extra`)).toBeNull()
    expect(parsePreviewCookie(`${V}.`)).toBeNull()
  })
})
