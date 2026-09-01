import Link from 'next/link'
import { createAccountShell, type AccountShellBrandProps } from '@/theme-kit/account/GenericAccountShell'
import '@/themes/retail/soft-studio/soft-studio.css'

function renderBrand({ tenantName, tagline }: AccountShellBrandProps) {
  return (
    <Link href="/" className="ss-account-brand">
      <span className="ss-account-logo">{tenantName}</span>
      {tagline ? <span className="ss-account-tagline">{tagline}</span> : null}
    </Link>
  )
}

export const SoftStudioAccountShell = createAccountShell({
  classPrefix: 'ss',
  rootClassName: 'ss-root ss-account-page',
  containerTag: 'nav',
  containerClassName: 'ss-account-nav',
  navClassName: 'ss-account-nav-links',
  headerLayout: 'flat',
  mainAuthModifierClassName: 'ss-account-main--auth',
  backLinkClassName: 'ss-account-store-btn',
  backLinkLabel: (
    <>
      <span aria-hidden>←</span> Back to store
    </>
  ),
  renderBrand,
})
