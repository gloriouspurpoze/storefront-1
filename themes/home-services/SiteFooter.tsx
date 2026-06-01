import Link from 'next/link'
import type { ThemeTenant } from './types'

export function SiteFooter({ tenant }: { tenant: ThemeTenant }) {
  const year = new Date().getFullYear()
  return (
    <footer className="border-t border-slate-200 bg-slate-50">
      <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-12 sm:grid-cols-2 sm:px-6 md:grid-cols-4">
        <div>
          <p className="text-base font-semibold text-slate-900">{tenant.name}</p>
          <p className="mt-2 max-w-xs text-sm text-slate-600">{tenant.tagline}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Services
          </p>
          <ul className="mt-3 space-y-2 text-sm text-slate-700">
            <li>
              <Link href="/services" className="hover:text-slate-950">
                Browse all
              </Link>
            </li>
            <li>
              <Link href="/book" className="hover:text-slate-950">
                Book now
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Company
          </p>
          <ul className="mt-3 space-y-2 text-sm text-slate-700">
            <li>
              <Link href="/about" className="hover:text-slate-950">
                About
              </Link>
            </li>
            <li>
              <Link href="/contact" className="hover:text-slate-950">
                Contact
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Powered by
          </p>
          <p className="mt-3 text-sm text-slate-700">
            <a
              href="https://profixer.app"
              className="underline-offset-4 hover:underline"
            >
              Profixer
            </a>
          </p>
        </div>
      </div>
      <div className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4 text-xs text-slate-500 sm:px-6">
          <span>
            © {year} {tenant.name}. All rights reserved.
          </span>
          <span className="hidden sm:block">{tenant.slug}.profixer.app</span>
        </div>
      </div>
    </footer>
  )
}
