import { ServiceHeader } from '@/components/chrome/ServiceHeader'
import { fetchStorefrontNavLinks } from '@/lib/cms-content'
import type { ThemeTenant } from './types'
import { bookingCta, resolveBookingAddon, withoutBookingLinks } from './bookingAddon'

const DEFAULT_LINKS = [
  { href: '/services', label: 'Services' },
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
]

export async function SiteHeader({
  tenant,
  navLinks,
  bookingEnabled,
}: {
  tenant: ThemeTenant
  navLinks?: { href: string; label: string }[]
  /** Service booking add-on; resolved from the storefront config when omitted. */
  bookingEnabled?: boolean
}) {
  const [booking, cmsLinks] = await Promise.all([
    resolveBookingAddon(tenant.id, bookingEnabled),
    navLinks ?? fetchStorefrontNavLinks(tenant.id, 'header', 'home_services'),
  ])
  const links = withoutBookingLinks(cmsLinks.length ? cmsLinks : DEFAULT_LINKS, booking)
  const cta = bookingCta(booking, 'Book now')

  return <ServiceHeader name={tenant.name} logoUrl={tenant.logoUrl} links={links} cta={cta} />
}
