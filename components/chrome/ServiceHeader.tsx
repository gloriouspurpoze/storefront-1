'use client'

import Link from 'next/link'
import { useState } from 'react'
import { AccountNavLink } from '@/components/account/AccountNavLink'
import { AccountProfileLink } from '@/components/account/AccountProfileLink'
import { Drawer, IconButton, IconMenu, cx } from '@/ui'
import { useScrolled } from './useScrolled'
import './store-header.css'

/**
 * Header for booking-led verticals (home services): no cart; a primary
 * "Book" CTA instead. Same sticky/shrink behaviour and drawer as the shop header.
 */
export function ServiceHeader({
  name,
  logoUrl,
  links,
  cta,
}: {
  name: string
  logoUrl?: string | null
  links: { href: string; label: string }[]
  cta: { href: string; label: string }
}) {
  const [open, setOpen] = useState(false)
  const scrolled = useScrolled()

  return (
    <>
      <Drawer open={open} onClose={() => setOpen(false)} side="left" title={name}>
        <nav aria-label="Mobile">
          <ul className="sf-service-drawer__links">
            {links.map((l) => (
              <li key={`${l.href}-${l.label}`}>
                <Link href={l.href} onClick={() => setOpen(false)}>
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="sf-service-drawer__account">
          <AccountNavLink />
        </div>
        <Link href={cta.href} className="sf-btn sf-btn--block sf-btn--lg" onClick={() => setOpen(false)}>
          {cta.label}
        </Link>
      </Drawer>
      <header className={cx('sf-header', 'sf-header--services')} data-scrolled={scrolled || undefined}>
        <nav className="sf-header__bar sf-container" aria-label="Main">
          <div className="sf-header__start">
            <IconButton label="Open menu" aria-expanded={open} className="sf-header__menu-btn" onClick={() => setOpen(true)}>
              <IconMenu />
            </IconButton>
            <Link href="/" className="sf-header__brand" aria-label={`${name} home`}>
              {logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logoUrl} alt="" className="sf-header__logo" />
              ) : (
                <span className="sf-header__logo-fallback" style={{ backgroundColor: 'var(--site-brand)' }}>
                  {name.charAt(0).toUpperCase()}
                </span>
              )}
              <span className="sf-header__name">{name}</span>
            </Link>
          </div>
          <ul className="sf-header__nav">
            {links.map((l) => (
              <li key={`${l.href}-${l.label}`} className="sf-header__nav-item">
                <Link href={l.href} className="sf-header__nav-link">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
          <div className="sf-header__end">
            <AccountProfileLink className="sf-icon-btn sf-header__account" iconClassName="sf-icon" />
            <Link href={cta.href} className="sf-btn sf-btn--sm sf-btn--pill sf-header__cta">
              {cta.label}
            </Link>
          </div>
        </nav>
      </header>
    </>
  )
}
