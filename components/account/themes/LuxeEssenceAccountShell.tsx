import Link from 'next/link'
import { createAccountShell, type AccountShellBrandProps } from '@/theme-kit/account/GenericAccountShell'
import '@/themes/retail/luxe-essence/luxe-essence.css'

function splitBrandTitle(siteName: string): { primary: string; secondary?: string } {
  if (!siteName.includes('|')) return { primary: siteName }
  const [primary, ...rest] = siteName.split('|').map((part) => part.trim())
  const secondary = rest.join(' | ').trim()
  return secondary ? { primary, secondary } : { primary: siteName }
}

function renderBrand({ tenantName, logoUrl, tagline }: AccountShellBrandProps) {
  const brand = splitBrandTitle(tenantName)
  const trimmedTagline = tagline?.trim()
  return (
    <Link href="/" className={`le-logo le-account-brand${logoUrl ? ' le-logo--has-image' : ''}`}>
      {logoUrl ? (
        <div className="le-logo-mark">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={logoUrl} alt="" />
        </div>
      ) : null}
      <div className="le-logo-text">
        <h1>
          {brand.primary}
          {brand.secondary ? (
            <>
              {' '}
              <span>| {brand.secondary}</span>
            </>
          ) : null}
        </h1>
        {trimmedTagline ? <p className="le-tagline">{trimmedTagline}</p> : null}
      </div>
    </Link>
  )
}

export const LuxeEssenceAccountShell = createAccountShell({
  classPrefix: 'le',
  rootClassName: 'le-root theme-luxe-essence le-account-page',
  containerTag: 'header',
  containerClassName: 'le-account-header',
  headerLayout: 'nested',
  backLinkLabel: 'Back to store',
  mainAuthModifierClassName: 'le-account-main--auth',
  showNav: ({ isLogin, isAuthenticated, pathname }) => {
    const isAccountDashboard = Boolean(pathname?.includes('/account') && !isLogin)
    return !isAuthenticated || isLogin || !isAccountDashboard
  },
  renderBrand,
})
