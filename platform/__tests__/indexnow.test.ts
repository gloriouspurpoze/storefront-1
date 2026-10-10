import { describe, expect, it } from 'vitest'
import { touchesPlatformContent } from '../indexnow'

describe('touchesPlatformContent', () => {
  const id = '6ac6255b41cdb1f55fc4390c'

  it('matches the platform tenant tag and its sub-tags only', () => {
    expect(touchesPlatformContent([`tenant:${id}`], id)).toBe(true)
    expect(touchesPlatformContent([`tenant:${id}:cms-faqs`], id)).toBe(true)
    expect(touchesPlatformContent(['tenant:aaaaaaaaaaaaaaaaaaaaaaaa'], id)).toBe(false)
    expect(touchesPlatformContent([`tenant:${id}x`], id)).toBe(false)
  })

  it('never matches when no platform tenant is configured', () => {
    expect(touchesPlatformContent(['tenant:'], '')).toBe(false)
  })
})
