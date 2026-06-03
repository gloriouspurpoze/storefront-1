'use client'

import Link from 'next/link'
import type { ThemeTenant } from './types'
import { useCart } from './cart'

export function SiteHeader({ tenant }: { tenant: ThemeTenant }) {
  const { itemCount } = useCart()

  return (
    <header className="sticky top-0 z-40 border-b border-indigo-100/80 bg-white/95 backdrop-blur">
      <nav className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5 text-slate-900" aria-label={`${tenant.name} home`}>
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

        <div className="hidden items-center gap-7 text-sm text-slate-600 md:flex">
          <Link className="hover:text-slate-950" href="/products">
            Shop
          </Link>
          <Link className="hover:text-slate-950" href="/about">
            About
          </Link>
          <Link className="hover:text-slate-950" href="/contact">
            Contact
          </Link>
          <Link className="hover:text-slate-950" href="/orders/track">
            Track order
          </Link>
        </div>

        <Link
          href="/checkout"
          className="relative inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:opacity-90"
          style={{ backgroundColor: 'var(--site-brand)' }}
        >
          Cart
          {itemCount > 0 ? (
            <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-fuchsia-500 px-1 text-[10px] font-bold text-white">
              {itemCount > 99 ? '99+' : itemCount}
            </span>
          ) : null}
        </Link>
      </nav>
    </header>
  )
}
