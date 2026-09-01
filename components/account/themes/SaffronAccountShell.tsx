import Link from 'next/link'
import { Playfair_Display, DM_Sans } from 'next/font/google'
import { createAccountShell, type AccountShellBrandProps } from '@/theme-kit/account/GenericAccountShell'
import '@/themes/restaurant/saffron/saffron-account.css'

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
  weight: ['400', '500'],
})

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
  display: 'swap',
  weight: ['300', '400', '500'],
})

function renderBrand({ tenantName }: AccountShellBrandProps) {
  return (
    <Link href="/" className="saf-account-brand">
      {tenantName}
    </Link>
  )
}

export const SaffronAccountShell = createAccountShell({
  classPrefix: 'saf',
  rootClassName: `theme-saffron saf-account-page ${playfair.variable} ${dmSans.variable}`,
  containerTag: 'header',
  containerClassName: 'saf-account-header',
  headerLayout: 'flat',
  backLinkLabel: 'Menu',
  renderBrand,
})
