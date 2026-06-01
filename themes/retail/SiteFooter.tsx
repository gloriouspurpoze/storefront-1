import Link from 'next/link'
import type { ThemeTenant } from './types'

export function SiteFooter({ tenant }: { tenant: ThemeTenant }) {
  return (
    <footer className="border-t border-indigo-100 bg-slate-50">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-12 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div>
          <p className="text-lg font-semibold text-slate-900">{tenant.name}</p>
          <p className="mt-1 text-sm text-slate-500">{tenant.tagline}</p>
        </div>
        <div className="flex flex-wrap gap-6 text-sm text-slate-600">
          <Link href="/products" className="hover:text-slate-900">
            Shop all
          </Link>
          <Link href="/checkout" className="hover:text-slate-900">
            Checkout
          </Link>
        </div>
      </div>
      <div className="border-t border-indigo-100/80 py-4 text-center text-xs text-slate-400">
        Secure checkout · Powered by{' '}
        <a href="https://profixer.app" className="font-medium text-slate-500 hover:underline">
          Profixer
        </a>
      </div>
    </footer>
  )
}
