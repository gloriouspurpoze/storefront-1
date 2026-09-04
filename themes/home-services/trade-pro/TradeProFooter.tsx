import Link from 'next/link'
import type { StorefrontNavLink } from '@/lib/cms-content'
import type { ThemeTenant } from '../types'
import { MapPinIcon, PhoneIcon } from './icons'
import './trade-pro.css'

const DEFAULT_LINKS: StorefrontNavLink[] = [
  { href: '/services', label: 'Browse all services' },
  { href: '/book', label: 'Get a free quote' },
  { href: '/about', label: 'About us' },
  { href: '/contact', label: 'Contact' },
]

export function TradeProFooter({
  tenant,
  navLinks,
  phone,
  email,
  address,
}: {
  tenant: ThemeTenant
  navLinks?: StorefrontNavLink[]
  phone?: string
  email?: string
  address?: string
}) {
  const year = new Date().getFullYear()
  const links = navLinks?.length ? navLinks : DEFAULT_LINKS

  return (
    <footer className="border-t border-white/10 bg-[var(--tp-ink)] text-white">
      <div className="tp-container grid gap-10 py-14 sm:grid-cols-2 md:grid-cols-4">
        <div>
          <div className="flex items-center gap-2.5">
            {tenant.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={tenant.logoUrl} alt="" className="h-8 w-8 rounded object-cover" />
            ) : (
              <span
                className="flex h-8 w-8 items-center justify-center rounded text-sm font-black text-[var(--tp-ink)]"
                style={{ backgroundColor: 'var(--tp-accent)' }}
              >
                {tenant.name.charAt(0).toUpperCase()}
              </span>
            )}
            <span className="text-base font-black uppercase tracking-tight">{tenant.name}</span>
          </div>
          <p className="mt-3 max-w-xs text-sm text-white/60">{tenant.tagline}</p>
        </div>

        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-white/40">Explore</p>
          <ul className="mt-3 space-y-2.5 text-sm text-white/75">
            {links.map((link) => (
              <li key={`${link.href}-${link.label}`}>
                <Link href={link.href} className="hover:text-white">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {(phone || email || address) && (
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-white/40">Contact</p>
            <ul className="mt-3 space-y-2.5 text-sm text-white/75">
              {phone && (
                <li>
                  <a href={`tel:${phone}`} className="flex items-center gap-2 hover:text-white">
                    <PhoneIcon className="h-4 w-4 shrink-0" /> {phone}
                  </a>
                </li>
              )}
              {email && (
                <li>
                  <a href={`mailto:${email}`} className="hover:text-white">
                    {email}
                  </a>
                </li>
              )}
              {address && (
                <li className="flex items-start gap-2 text-white/60">
                  <MapPinIcon className="mt-0.5 h-4 w-4 shrink-0" /> {address}
                </li>
              )}
            </ul>
          </div>
        )}

        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-white/40">Licensed &amp; insured</p>
          <p className="mt-3 text-sm text-white/60">
            Every pro on {tenant.name} is background-checked and verified before their first job.
          </p>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="tp-container flex flex-col gap-2 py-4 text-xs text-white/45 sm:flex-row sm:items-center sm:justify-between">
          <span>
            © {year} {tenant.name}. All rights reserved.
          </span>
          <span>
            Powered by{' '}
            <a href="https://torqstudio.com" className="underline-offset-4 hover:underline hover:text-white/70">
              Torq Studio
            </a>
          </span>
        </div>
      </div>
    </footer>
  )
}
