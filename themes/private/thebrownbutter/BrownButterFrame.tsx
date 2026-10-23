'use client'

import Link from 'next/link'
import { useMemo, useState, type ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import type { StorefrontNavLink } from '@/lib/cms-content'
import type { StorefrontConfig } from '@/lib/storefront-api'
import { AccountProfileLink } from '@/components/account/AccountProfileLink'
import { StorefrontHeaderBar, StorefrontMenuDrawer } from '@/components/StorefrontMenuDrawer'
import { resolveBrownButterHeaderLinks } from './brownButterNav'
import { BrownButterFooter } from './BrownButterFooter'
import './brown-butter.css'

function isCurrent(pathname: string, href: string): boolean {
  if (/^(https?:|mailto:|tel:)/i.test(href)) return false
  if (href === '/') return pathname === '/'
  return pathname === href || pathname.startsWith(`${href}/`)
}

function PageNav({ links }: { links: StorefrontNavLink[] }) {
  const pathname = usePathname() || '/'
  if (links.length === 0) return null
  return (
    <nav className="bb-bar-nav" aria-label="Store pages">
      {links.map((link) => {
        const external = /^(https?:|mailto:|tel:)/i.test(link.href)
        const current = isCurrent(pathname, link.href)
        const className = `bb-bar-nav__link${current ? ' is-active' : ''}`
        if (external) {
          return (
            <a
              key={`${link.href}-${link.label}`}
              href={link.href}
              className={className}
              target={link.href.startsWith('http') ? '_blank' : undefined}
              rel={link.href.startsWith('http') ? 'noopener noreferrer' : undefined}
            >
              {link.label}
            </a>
          )
        }
        return (
          <Link
            key={`${link.href}-${link.label}`}
            href={link.href}
            className={className}
            aria-current={current ? 'page' : undefined}
          >
            {link.label}
          </Link>
        )
      })}
    </nav>
  )
}

export function BrownButterFrame({
  config,
  navLinks,
  headerTitle,
  contactPhone,
  children,
}: {
  config: StorefrontConfig | null
  navLinks?: StorefrontNavLink[]
  headerTitle: string
  contactPhone?: string
  children: ReactNode
}) {
  const links = useMemo(() => resolveBrownButterHeaderLinks(config, navLinks), [config, navLinks])
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <>
      <StorefrontMenuDrawer
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        config={config}
        navLinks={links}
        navPresentation="list"
        shippingPolicyHref="/shipping-policy"
        hoursAlwaysOpen
      />
      <div className="bb-root bb-page">
        <StorefrontHeaderBar
          title={headerTitle}
          homeHref="/"
          onMenuOpen={() => setMenuOpen(true)}
          actions={<AccountProfileLink className="action-profile-btn" iconClassName="h-4 w-4" />}
          center={<PageNav links={links} />}
        />
        <div className="bb-store-wrap">
          {children}
          <BrownButterFooter config={config} contactPhone={contactPhone} />
        </div>
      </div>
    </>
  )
}
