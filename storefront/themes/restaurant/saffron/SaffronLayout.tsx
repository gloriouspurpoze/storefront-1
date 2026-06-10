import { Playfair_Display, DM_Sans } from 'next/font/google'
import type { ReactNode } from 'react'

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
  weight: ['400', '500'],
  style: ['normal', 'italic'],
})

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
  display: 'swap',
  weight: ['300', '400', '500'],
})

/**
 * Root wrapper for the Saffron & Salt theme.
 * Injects Google Font CSS variables and the theme-saffron class
 * (which defines --cream, --ink, --terracotta etc. in globals.css).
 * Must be a Server Component so next/font/google optimisation fires at build time.
 */
export function SaffronLayout({ children }: { children: ReactNode }) {
  return (
    <div className={`theme-saffron ${playfair.variable} ${dmSans.variable}`}>
      {children}
    </div>
  )
}
