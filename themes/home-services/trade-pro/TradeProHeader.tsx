'use client'

import Link from 'next/link'
import { useState } from 'react'
import type { StorefrontNavLink } from '@/lib/cms-content'
import { AccountNavLink } from '@/components/account/AccountNavLink'
import type { ThemeTenant } from '../types'
import { ClockIcon, CloseIcon, MenuIcon, PhoneIcon } from './icons'
import './trade-pro.css'

const DEFAULT_LINKS: StorefrontNavLink[] = [
  { href: '/services', label: 'Services' },
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
]

export function TradeProHeader({
  tenant,
  navLinks,
  phone,
  hours,
}: {
  tenant: ThemeTenant
  navLinks?: StorefrontNavLink[]
  phone?: string
  hours?: string
}) {
  const [open, setOpen] = useState(false)
  const links = navLinks?.length ? navLinks : DEFAULT_LINKS

  return (
    <>
      {(phone || hours) && (
        <div className="hidden bg-[var(--tp-ink)] text-white/70 sm:block">
          <div className="tp-container flex items-center justify-between py-2 text-xs">
            <span className="flex items-center gap-1.5">
              {hours && (
                <>
                  <ClockIcon className="h-3.5 w-3.5" /> {hours}
                </>
              )}
            </span>
            {phone && (
              <a href={`tel:${phone}`} className="flex items-center gap-1.5 font-medium text-white hover:text-[var(--tp-accent)]">
                <PhoneIcon className="h-3.5 w-3.5" /> {phone}
              </a>
            )}
          </div>
        </div>
      )}

      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/85">
        <nav className="tp-container flex h-16 items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2.5" aria-label={`${tenant.name} home`}>
            {tenant.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={tenant.logoUrl} alt="" className="h-9 w-9 rounded object-cover" />
            ) : (
              <span
                className="flex h-9 w-9 items-center justify-center rounded text-sm font-black text-[var(--tp-ink)]"
                style={{ backgroundColor: 'var(--tp-accent)' }}
              >
                {tenant.name.charAt(0).toUpperCase()}
              </span>
            )}
            <span className="text-base font-black uppercase tracking-tight text-[var(--tp-ink)]">
              {tenant.name}
            </span>
          </Link>

          <div className="hidden items-center gap-7 text-sm font-semibold text-slate-700 md:flex">
            {links.map((link) => (
              <Link key={`${link.href}-${link.label}`} className="hover:text-[var(--tp-ink)]" href={link.href}>
                {link.label}
              </Link>
            ))}
            <AccountNavLink className="hover:text-[var(--tp-ink)]" />
          </div>

          <div className="flex items-center gap-2">
            {phone && (
              <a
                href={`tel:${phone}`}
                className="hidden items-center gap-1.5 text-sm font-bold text-[var(--tp-ink)] sm:flex"
              >
                <PhoneIcon className="h-4 w-4" /> {phone}
              </a>
            )}
            <Link
              href="/book"
              className="hidden items-center justify-center rounded px-4 py-2 text-sm font-bold uppercase tracking-wide text-[var(--tp-ink)] shadow-sm transition hover:brightness-95 sm:inline-flex"
              style={{ backgroundColor: 'var(--tp-accent)' }}
            >
              Get free quote
            </Link>
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              className="inline-flex h-10 w-10 items-center justify-center rounded border border-slate-200 text-[var(--tp-ink)] md:hidden"
              aria-expanded={open}
              aria-label={open ? 'Close menu' : 'Open menu'}
            >
              {open ? <CloseIcon className="h-5 w-5" /> : <MenuIcon className="h-5 w-5" />}
            </button>
          </div>
        </nav>

        {open && (
          <div className="border-t border-slate-200 bg-white px-4 py-4 md:hidden">
            <div className="flex flex-col gap-3 text-sm font-semibold text-slate-700">
              {links.map((link) => (
                <Link
                  key={`m-${link.href}-${link.label}`}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="py-1.5"
                >
                  {link.label}
                </Link>
              ))}
              <AccountNavLink />
            </div>
            <Link
              href="/book"
              onClick={() => setOpen(false)}
              className="mt-4 flex items-center justify-center rounded px-4 py-3 text-sm font-bold uppercase tracking-wide text-[var(--tp-ink)]"
              style={{ backgroundColor: 'var(--tp-accent)' }}
            >
              Get free quote
            </Link>
          </div>
        )}
      </header>
    </>
  )
}
