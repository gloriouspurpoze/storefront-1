import { describe, expect, it } from 'vitest'
import {
  isBrownButterNavEnabled,
  resolveBrownButterHeaderLinks,
} from './brownButterNav'

describe('resolveBrownButterHeaderLinks', () => {
  it('shows About, The Cookie Journal, and Talk to us when nothing is saved', () => {
    expect(resolveBrownButterHeaderLinks(null, [])).toEqual([
      { href: '/about', label: 'About' },
      { href: '/blog', label: 'The Cookie Journal' },
      { href: '/contact', label: 'Talk to us' },
    ])
  })

  it('hides a page the tenant turned off and drops a CMS link to that path', () => {
    const links = resolveBrownButterHeaderLinks(
      { templateSettings: { 'private-thebrownbutter': { showJournalNav: false } } },
      [
        { href: '/blog', label: 'Journal' },
        { href: '/shipping-policy', label: 'Delivery' },
      ],
    )
    expect(links.map((link) => link.href)).toEqual(['/about', '/contact', '/shipping-policy'])
    expect(isBrownButterNavEnabled(
      { templateSettings: { 'private-thebrownbutter': { showJournalNav: false } } },
      'showJournalNav',
    )).toBe(false)
  })

  it('keeps a CMS label for a visible theme page', () => {
    const links = resolveBrownButterHeaderLinks(undefined, [
      { href: '/about/', label: 'Our kitchen' },
    ])
    expect(links[0]).toEqual({ href: '/about', label: 'Our kitchen' })
  })
})
