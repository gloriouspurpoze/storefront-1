import type { StorefrontNavLink } from '@/lib/cms-content'

/**
 * Footer page links for restaurant layout themes (saffron, menufast) when the tenant
 * has no CMS footer menu. Client-safe (no server imports) — MenuFastCardsFooter is a
 * client component. Every route here exists for all restaurant tenants.
 */
export const RESTAURANT_FALLBACK_FOOTER_LINKS: StorefrontNavLink[] = [
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
  { href: '/shipping-policy', label: 'Delivery policy' },
]

export function restaurantFooterLinks(footerLinks?: StorefrontNavLink[] | null): StorefrontNavLink[] {
  return footerLinks?.length ? footerLinks : RESTAURANT_FALLBACK_FOOTER_LINKS
}
