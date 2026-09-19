'use client'

import Link from 'next/link'
import { useState } from 'react'
import type { StorefrontNavLink } from '@/lib/cms-content'
import { AccountProfileLink } from '@/components/account/AccountProfileLink'
import type { ThemeTenant } from '../types'
import { ClockIcon, CloseIcon, MenuIcon, PhoneIcon } from './icons'
import { TradeProCartButton } from './TradeProCartButton'
import { TradeProMobileStickyCta } from './TradeProMobileStickyCta'
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
  serviceArea,
}: {
  tenant: ThemeTenant
  navLinks?: StorefrontNavLink[]
  phone?: string
  hours?: string
  serviceArea?: string
}) {
  const [open, setOpen] = useState(false)
  const links = navLinks?.length ? navLinks : DEFAULT_LINKS
  const topLeft = [serviceArea, hours].filter(Boolean).join(' · ')
  const showTopBar = Boolean(topLeft || phone)

  return (
    <>
      {showTopBar ? (
        <div className="hidden bg-[var(--tp-ink)] text-white/70 lg:block">
          <div className="tp-container flex items-center justify-between py-2 text-xs">
            <span className="flex min-w-0 items-center gap-1.5 truncate">
              {hours ? <ClockIcon className="h-3.5 w-3.5 shrink-0" /> : null}
              {topLeft || null}
            </span>
            {phone ? (
              <a
                href={`tel:${phone}`}
                className="flex shrink-0 items-center gap-1.5 font-medium text-white transition hover:text-[var(--tp-accent)]"
              >
                <PhoneIcon className="h-3.5 w-3.5" /> {phone}
              </a>
            ) : null}
          </div>
        </div>
      ) : null}

      <header className="sticky top-0 z-40 border-b border-[var(--tp-hairline)] bg-[var(--tp-canvas)]/95 backdrop-blur supports-[backdrop-filter]:bg-[var(--tp-canvas)]/90">
        <nav className="tp-container flex h-16 items-center justify-between gap-3">
          <Link href="/" className="flex min-w-0 items-center gap-2.5" aria-label={`${tenant.name} home`}>
            {tenant.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={tenant.logoUrl} alt="" className="h-9 w-9 shrink-0 rounded-xl object-cover" />
            ) : (
              <span
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-bold"
                style={{
                  backgroundColor: 'var(--tp-accent)',
                  color: 'var(--tp-accent-contrast)',
                }}
              >
                {tenant.name.charAt(0).toUpperCase()}
              </span>
            )}
            <span className="truncate text-base font-semibold tracking-tight text-[var(--tp-ink)]">
              {tenant.name}
            </span>
          </Link>

          <div className="hidden items-center gap-7 text-sm font-medium text-[var(--tp-body)] lg:flex">
            {links.map((link) => (
              <Link
                key={`${link.href}-${link.label}`}
                className="transition hover:text-[var(--tp-cta)]"
                href={link.href}
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <AccountProfileLink
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--tp-hairline)] text-[var(--tp-ink)] transition hover:bg-[var(--tp-canvas-soft)]"
              iconClassName="h-5 w-5"
            />
            <TradeProCartButton />
            {phone ? (
              <a
                href={`tel:${phone}`}
                className="inline-flex h-10 items-center gap-1.5 rounded-full px-2.5 text-sm font-semibold text-[var(--tp-ink)] transition hover:bg-[var(--tp-canvas-soft)] sm:px-3"
                aria-label={`Call ${phone}`}
              >
                <PhoneIcon className="h-4 w-4 shrink-0" />
                <span className="max-w-[9rem] truncate sm:max-w-none">{phone}</span>
              </a>
            ) : null}
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--tp-hairline)] text-[var(--tp-ink)] lg:hidden"
              aria-expanded={open}
              aria-controls="tp-mobile-nav"
              aria-label={open ? 'Close menu' : 'Open menu'}
            >
              {open ? <CloseIcon className="h-5 w-5" /> : <MenuIcon className="h-5 w-5" />}
            </button>
          </div>
        </nav>

        {open ? (
          <div id="tp-mobile-nav" className="border-t border-[var(--tp-hairline)] bg-[var(--tp-canvas)] px-4 py-4 lg:hidden">
            <div className="flex flex-col gap-1 text-sm font-medium text-[var(--tp-body)]">
              {links.map((link) => (
                <Link
                  key={`m-${link.href}-${link.label}`}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="rounded-lg px-2 py-2.5 transition hover:bg-[var(--tp-canvas-soft)] hover:text-[var(--tp-cta)]"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        ) : null}
      </header>

      <div data-tp-mobile-cta-sentinel className="pointer-events-none h-px w-full" aria-hidden />
      <TradeProMobileStickyCta phone={phone} menuOpen={open} />
    </>
  )
}
