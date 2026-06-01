import Link from 'next/link'
import type { ThemeTenant } from './types'

export function SiteHeader({ tenant }: { tenant: ThemeTenant }) {
  return (
    <header className="sticky top-0 z-40 border-b border-amber-100/80 bg-white/95 backdrop-blur">
      <nav className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5 text-stone-900" aria-label={`${tenant.name} home`}>
          {tenant.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={tenant.logoUrl} alt="" className="h-9 w-9 rounded-full object-cover" />
          ) : (
            <span
              className="flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold text-white"
              style={{ backgroundColor: 'var(--site-brand)' }}
            >
              {tenant.name.charAt(0).toUpperCase()}
            </span>
          )}
          <span className="font-serif text-lg font-semibold tracking-tight">{tenant.name}</span>
        </Link>

        <div className="hidden items-center gap-7 text-sm text-stone-600 md:flex">
          <Link className="hover:text-stone-950" href="/menu">
            Menu
          </Link>
          <Link className="hover:text-stone-950" href="/about">
            About
          </Link>
          <Link className="hover:text-stone-950" href="/contact">
            Contact
          </Link>
        </div>

        <Link
          href="/reserve"
          className="inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:opacity-90"
          style={{ backgroundColor: 'var(--site-brand)' }}
        >
          Reserve a table
        </Link>
      </nav>
    </header>
  )
}
