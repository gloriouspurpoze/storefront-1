import Link from 'next/link'
import type { ThemeTenant } from './types'

const DEFAULT_LINKS = [
  { href: '/services', label: 'Browse all' },
  { href: '/book', label: 'Book now' },
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
]

export function SiteFooter({
  tenant,
  navLinks,
}: {
  tenant: ThemeTenant
  navLinks?: { href: string; label: string }[]
}) {
  const year = new Date().getFullYear()
  const links = navLinks?.length ? navLinks : DEFAULT_LINKS
  const mid = Math.ceil(links.length / 2)
  const colA = links.slice(0, mid)
  const colB = links.slice(mid)

  return (
    <footer className="border-t border-slate-200 bg-slate-50">
      <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-12 sm:grid-cols-2 sm:px-6 md:grid-cols-4">
        <div>
          <p className="text-base font-semibold text-slate-900">{tenant.name}</p>
          <p className="mt-2 max-w-xs text-sm text-slate-600">{tenant.tagline}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Explore</p>
          <ul className="mt-3 space-y-2 text-sm text-slate-700">
            {colA.map((link) => (
              <li key={`${link.href}-${link.label}`}>
                <Link href={link.href} className="hover:text-slate-950">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">More</p>
          <ul className="mt-3 space-y-2 text-sm text-slate-700">
            {colB.map((link) => (
              <li key={`${link.href}-${link.label}`}>
                <Link href={link.href} className="hover:text-slate-950">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Powered by
          </p>
          <p className="mt-3 text-sm text-slate-700">
            <a
              href="https://torqstudio.com"
              className="underline-offset-4 hover:underline"
            >
              Torq Studio
            </a>
          </p>
        </div>
      </div>
      <div className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4 text-xs text-slate-500 sm:px-6">
          <span>
            © {year} {tenant.name}. All rights reserved.
          </span>
          <span className="hidden sm:block">{tenant.slug}.torqstudio.com</span>
        </div>
      </div>
    </footer>
  )
}
