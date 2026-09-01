'use client'

import Link from 'next/link'
import type { ReactNode } from 'react'
import { AccountShellNav } from '@/components/account/AccountShellNav'
import { useAccountShellAuth, type AccountShellAuthState } from './useAccountShellAuth'
import { AccountShellSignedInFooter } from './AccountShellSignedInFooter'

export interface AccountShellBrandProps {
  tenantName: string
  logoUrl?: string
  tagline?: string
}

export interface AccountShellProps extends AccountShellBrandProps {
  children: ReactNode
}

export interface AccountShellConfig {
  classPrefix: string
  /** Full root `className` string (themes' existing root classes vary — some include `{prefix}-root`, some don't). */
  rootClassName: string
  containerTag: 'header' | 'nav'
  /** Class on the outer header/nav container element (class-naming conventions vary per theme). */
  containerClassName: string
  /** 'nested': brand+back-link share a header-top wrapper, nav renders below it. 'flat': brand, nav, back-link are direct siblings. */
  headerLayout: 'flat' | 'nested'
  backLinkLabel: ReactNode
  /** Class on the back-link. Defaults to `{prefix}-account-store-link`. */
  backLinkClassName?: string
  /** Defaults to always-visible when omitted. */
  showNav?: (ctx: AccountShellAuthState) => boolean
  /** Class on the rendered `AccountShellNav` itself. Defaults to `{prefix}-account-nav`. */
  navClassName?: string
  renderBrand: (props: AccountShellBrandProps) => ReactNode
  /** Defaults to true ("Signed in as X" footer when authenticated and not on the login page). */
  showFooter?: boolean
  /** Extra `<main>` class applied only on the login page. Omit if the theme has no auth-specific main styling. */
  mainAuthModifierClassName?: string
}

/**
 * Shared shell for the themes whose account page follows the same
 * brand/nav/back-link + main + optional-footer shape (LuxeEssence, MenuFast,
 * Saffron, SoftStudio). BrownButter and MenuFastCards have structurally
 * different layouts (phone-frame chrome, hero/avatar/user-card) and stay
 * bespoke rather than being forced through this shell.
 */
export function createAccountShell(config: AccountShellConfig) {
  return function AccountShell({ tenantName, logoUrl, tagline, children }: AccountShellProps) {
    const auth = useAccountShellAuth()
    const showNav = config.showNav ? config.showNav(auth) : true
    const p = config.classPrefix
    const Container = config.containerTag

    const brand = config.renderBrand({ tenantName, logoUrl, tagline })
    const backLink = (
      <Link href="/" className={config.backLinkClassName ?? `${p}-account-store-link`}>
        {config.backLinkLabel}
      </Link>
    )
    const nav = showNav ? (
      <AccountShellNav
        className={config.navClassName ?? `${p}-account-nav`}
        linkClassName={`${p}-account-nav-link`}
        activeClassName={`${p}-account-nav-link ${p}-account-nav-link--active`}
      />
    ) : null

    return (
      <div className={config.rootClassName}>
        <Container className={config.containerClassName}>
          {config.headerLayout === 'nested' ? (
            <>
              <div className={`${p}-account-header-top`}>
                {brand}
                {backLink}
              </div>
              {nav}
            </>
          ) : (
            <>
              {brand}
              {nav}
              {backLink}
            </>
          )}
        </Container>

        <main
          className={`${p}-account-main${
            auth.isLogin && config.mainAuthModifierClassName ? ` ${config.mainAuthModifierClassName}` : ''
          }`}
        >
          {children}
        </main>

        {config.showFooter !== false ? (
          <AccountShellSignedInFooter auth={auth} className={`${p}-account-footer`} />
        ) : null}
      </div>
    )
  }
}
