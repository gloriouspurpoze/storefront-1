import Link from 'next/link'
import type { ThemeTenant } from './types'

export function SiteHeader({ tenant }: { tenant: ThemeTenant }) {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/70">
      <nav className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link
          href="/"
          className="flex items-center gap-2.5 text-slate-900"
          aria-label={`${tenant.name} home`}
        >
          {tenant.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={tenant.logoUrl} alt="" className="h-8 w-8 rounded-lg object-cover" />
          ) : (
            <span
              className="flex h-8 w-8 items-center justify-center rounded-lg text-sm font-bold text-white"
              style={{ backgroundColor: 'var(--site-brand)' }}
            >
              {tenant.name.charAt(0).toUpperCase()}
            </span>
          )}
          <span className="text-base font-semibold tracking-tight">{tenant.name}</span>
        </Link>

        <div className="hidden items-center gap-7 text-sm text-slate-700 md:flex">
          <Link className="hover:text-slate-950" href="/services">
            Services
          </Link>
          <Link className="hover:text-slate-950" href="/about">
            About
          </Link>
          <Link className="hover:text-slate-950" href="/contact">
            Contact
          </Link>
        </div>

        <Link
          href="/book"
          className="inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:opacity-90"
          style={{ backgroundColor: 'var(--site-brand)' }}
        >
          Book now
        </Link>
      </nav>
    </header>
  )
}
