import Link from 'next/link'
import { createAccountShell, type AccountShellBrandProps } from '@/theme-kit/account/GenericAccountShell'
import '@/themes/restaurant/menufast/menufast.css'

function renderBrand({ tenantName }: AccountShellBrandProps) {
  return (
    <Link href="/" className="mf-account-brand">
      {tenantName}
    </Link>
  )
}

export const MenuFastAccountShell = createAccountShell({
  classPrefix: 'mf',
  rootClassName: 'theme-menufast-minimal mf-account-page',
  containerTag: 'header',
  containerClassName: 'mf-account-header',
  headerLayout: 'flat',
  backLinkLabel: 'Menu',
  renderBrand,
})
