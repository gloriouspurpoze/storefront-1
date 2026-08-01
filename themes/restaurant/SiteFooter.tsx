import Link from 'next/link'
import type { ThemeTenant } from './types'

const DEFAULT_LINKS = [
  { href: '/menu', label: 'Menu' },
  { href: '/reserve', label: 'Reservations' },
  { href: '/contact', label: 'Contact' },
]

export function SiteFooter({
  tenant,
  navLinks,
}: {
  tenant: ThemeTenant
  navLinks?: { href: string; label: string }[]
}) {
  const links = navLinks?.length ? navLinks : DEFAULT_LINKS

  return (
    <footer className="border-t border-amber-100 bg-stone-50">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-12 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div>
          <p className="font-serif text-lg font-semibold text-stone-900">{tenant.name}</p>
          <p className="mt-1 text-sm text-stone-500">{tenant.tagline}</p>
        </div>
        <div className="flex flex-wrap gap-6 text-sm text-stone-600">
          {links.map((link) => (
            <Link key={`${link.href}-${link.label}`} href={link.href} className="hover:text-stone-900">
              {link.label}
            </Link>
          ))}
        </div>
      </div>
      <div className="border-t border-amber-100/80 py-4 text-center text-xs text-stone-400">
        Powered by{' '}
        <a href="https://torqstudio.com" className="font-medium text-stone-500 hover:underline">
          Torq Studio
        </a>
      </div>
    </footer>
  )
}
