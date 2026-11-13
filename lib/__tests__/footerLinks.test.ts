import { describe, expect, it } from 'vitest'
import { dedupeFooterColumns, isLegalFooterLink, splitFooterLinks } from '../footerLinks'

// Real CMS footer menu from a home-services tenant.
const CMS = [
  { href: '/about-us', label: 'About Us' },
  { href: '/how-it-works', label: 'How It Works' },
  { href: '/terms-and-conditions', label: 'Terms & Conditions' },
  { href: '/privacy-policy', label: 'Privacy Policy' },
  { href: '/cancellation-refund-policy', label: 'Cancellation & Refunds' },
  { href: '/membership', label: 'Membership' },
  { href: '/safety-trust', label: 'Safety & Trust' },
  { href: '/contact', label: 'Contact Us' },
  { href: '/grievance-redressal', label: 'Grievance Redressal' },
]

describe('isLegalFooterLink', () => {
  it('matches policy pages by label or slug', () => {
    expect(isLegalFooterLink({ href: '/x', label: 'Terms & Conditions' })).toBe(true)
    expect(isLegalFooterLink({ href: '/privacy-policy', label: 'Your data' })).toBe(true)
    expect(isLegalFooterLink({ href: '/grievance-redressal', label: 'Grievance Redressal' })).toBe(true)
    expect(isLegalFooterLink({ href: '/cancellation-refund-policy', label: 'Cancellation & Refunds' })).toBe(true)
  })
  it('leaves ordinary pages alone', () => {
    for (const l of [CMS[0], CMS[1], CMS[5], CMS[6], CMS[7]]) expect(isLegalFooterLink(l)).toBe(false)
  })
})

describe('splitFooterLinks', () => {
  it('moves legal pages to a Policies column, keeping CMS order', () => {
    expect(splitFooterLinks(CMS, ['Company', 'More'])).toEqual([
      { title: 'Company', links: [CMS[0], CMS[1], CMS[5], CMS[6], CMS[7]] },
      { title: 'Policies', links: [CMS[2], CMS[3], CMS[4], CMS[8]] },
    ])
  })
  it('splits long site-page lists into two columns', () => {
    const many = Array.from({ length: 9 }, (_, i) => ({ href: `/p${i}`, label: `Page ${i}` }))
    const cols = splitFooterLinks(many, ['Explore', 'More'])
    expect(cols.map((c) => [c.title, c.links.length])).toEqual([
      ['Explore', 5],
      ['More', 4],
    ])
  })
  it('handles empty and legal-only menus', () => {
    expect(splitFooterLinks([], ['Explore'])).toEqual([])
    expect(splitFooterLinks([CMS[3]], ['Explore'])).toEqual([{ title: 'Policies', links: [CMS[3]] }])
  })
})

describe('dedupeFooterColumns', () => {
  it('drops links repeated in later columns and empty columns', () => {
    const cols = dedupeFooterColumns([
      { title: 'Company', links: [{ href: '/contact', label: 'Contact Us' }] },
      { title: 'Help', links: [{ href: '/contact/', label: 'Contact us' }, { href: '/account', label: 'My account' }] },
      { title: 'Empty', links: [{ href: '/CONTACT', label: 'Contact' }] },
    ])
    expect(cols).toEqual([
      { title: 'Company', links: [{ href: '/contact', label: 'Contact Us' }] },
      { title: 'Help', links: [{ href: '/account', label: 'My account' }] },
    ])
  })
})
