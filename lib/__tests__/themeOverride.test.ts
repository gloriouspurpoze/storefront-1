import { describe, expect, it } from 'vitest'
import {
  applyThemeOverride,
  decideThemeOverride,
  isThemeOverrideEnabled,
  parseThemeKey,
  themeFitsVertical,
  themesForVertical,
} from '../themeOverride'

describe('isThemeOverrideEnabled', () => {
  it('is on in development', () => {
    expect(isThemeOverrideEnabled({ NODE_ENV: 'development' })).toBe(true)
  })
  it('is on for Vercel preview builds', () => {
    expect(isThemeOverrideEnabled({ NODE_ENV: 'production', VERCEL_ENV: 'preview' })).toBe(true)
  })
  it('is off for production builds by default', () => {
    expect(isThemeOverrideEnabled({ NODE_ENV: 'production' })).toBe(false)
  })
  it('can be opted in on a non-Vercel production build (staging)', () => {
    expect(isThemeOverrideEnabled({ NODE_ENV: 'production', STOREFRONT_THEME_OVERRIDE: 'on' })).toBe(true)
  })
  it('is never on for Vercel production, even when opted in', () => {
    expect(
      isThemeOverrideEnabled({ NODE_ENV: 'production', VERCEL_ENV: 'production', STOREFRONT_THEME_OVERRIDE: 'on' }),
    ).toBe(false)
  })
  it('can be forced off in dev', () => {
    expect(isThemeOverrideEnabled({ NODE_ENV: 'development', STOREFRONT_THEME_OVERRIDE: 'off' })).toBe(false)
  })
})

describe('parseThemeKey / vertical fit', () => {
  it('accepts known keys case-insensitively', () => {
    expect(parseThemeKey(' Saffron ')).toBe('saffron')
    expect(parseThemeKey('nope')).toBeNull()
    expect(parseThemeKey('__proto__')).toBeNull()
    expect(parseThemeKey(null)).toBeNull()
  })
  it('matches themes to their vertical; classic fits all', () => {
    expect(themeFitsVertical('saffron', 'restaurant')).toBe(true)
    expect(themeFitsVertical('saffron', 'retail')).toBe(false)
    expect(themeFitsVertical('classic', 'salon')).toBe(true)
    expect(themesForVertical('retail')).toEqual(['classic', 'luxe-essence', 'soft-studio'])
  })
})

describe('decideThemeOverride', () => {
  const restaurant = { verticalKey: 'restaurant' }
  it('sets and persists a valid param', () => {
    expect(decideThemeOverride({ ...restaurant, param: 'saffron', cookie: null })).toEqual({
      action: 'set',
      themeKey: 'saffron',
      persist: true,
    })
  })
  it('param overrides cookie', () => {
    expect(decideThemeOverride({ ...restaurant, param: 'menufast-cards', cookie: 'saffron' })).toMatchObject({
      themeKey: 'menufast-cards',
    })
  })
  it('clears on ?theme=off or empty', () => {
    expect(decideThemeOverride({ ...restaurant, param: 'off', cookie: 'saffron' })).toEqual({ action: 'clear' })
    expect(decideThemeOverride({ ...restaurant, param: '', cookie: 'saffron' })).toEqual({ action: 'clear' })
  })
  it('ignores unknown or wrong-vertical params, keeping a saved override', () => {
    expect(decideThemeOverride({ ...restaurant, param: 'luxe-essence', cookie: 'saffron' })).toEqual({
      action: 'set',
      themeKey: 'saffron',
      persist: false,
    })
    expect(decideThemeOverride({ ...restaurant, param: 'luxe-essence', cookie: null })).toEqual({ action: 'none' })
    expect(decideThemeOverride({ ...restaurant, param: 'bogus', cookie: null })).toEqual({ action: 'none' })
  })
  it('uses the cookie without re-persisting', () => {
    expect(decideThemeOverride({ ...restaurant, param: null, cookie: 'saffron' })).toEqual({
      action: 'set',
      themeKey: 'saffron',
      persist: false,
    })
  })
  it('clears a cookie left over from another vertical', () => {
    expect(decideThemeOverride({ verticalKey: 'retail', param: null, cookie: 'saffron' })).toEqual({ action: 'clear' })
  })
})

describe('applyThemeOverride', () => {
  const cfg = { themeKey: 'saffron', effectiveSections: [{ type: 'hero', enabled: true }] }
  it('swaps the theme and drops server-resolved sections', () => {
    expect(applyThemeOverride(cfg, 'menufast-cards')).toEqual({
      themeKey: 'menufast-cards',
      effectiveSections: undefined,
      themeOverride: 'menufast-cards',
    })
  })
  it('is a no-op without an override or when it matches the saved theme', () => {
    expect(applyThemeOverride(cfg, null)).toBe(cfg)
    expect(applyThemeOverride(cfg, 'saffron')).toBe(cfg)
  })
})
