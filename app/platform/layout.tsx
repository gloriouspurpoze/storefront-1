import type { Metadata, Viewport } from 'next'
import type { ReactNode } from 'react'
import { Inter } from 'next/font/google'
import { PLATFORM_BRAND, PLATFORM_CONTACT_EMAIL, PLATFORM_SITE_URL, siteUrl } from '@/platform/config'
import { HOME_DESCRIPTION, HOME_TITLE } from '@/platform/content/home'
import { AttributionCapture } from '@/platform/components/AttributionLink'
import { DemoRequestProvider } from '@/platform/components/DemoRequest'
import { Footer } from '@/platform/components/Footer'
import { JsonLd } from '@/platform/components/JsonLd'

const inter = Inter({ subsets: ['latin'], display: 'swap', variable: '--font-inter' })

/**
 * torqERP marketing site (torqerp.com). Reached only through the platform hosts —
 * `middleware.ts` rewrites `torqerp.com/<path>` to `/platform/<path>`.
 */
export const metadata: Metadata = {
  metadataBase: new URL(PLATFORM_SITE_URL),
  title: { default: HOME_TITLE, template: `%s | ${PLATFORM_BRAND}` },
  description: HOME_DESCRIPTION,
  applicationName: PLATFORM_BRAND,
  // The root layout defaults to noindex for unresolved hosts; the marketing site must be indexable.
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 } },
  verification: process.env.PLATFORM_GOOGLE_SITE_VERIFICATION
    ? { google: process.env.PLATFORM_GOOGLE_SITE_VERIFICATION }
    : undefined,
}

export const viewport: Viewport = {
  themeColor: '#024ad8',
}

const ORGANIZATION = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  '@id': siteUrl('/#organization'),
  name: PLATFORM_BRAND,
  url: siteUrl('/'),
  email: PLATFORM_CONTACT_EMAIL,
  description: HOME_DESCRIPTION,
}

const WEBSITE = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  '@id': siteUrl('/#website'),
  name: PLATFORM_BRAND,
  url: siteUrl('/'),
  inLanguage: 'en-IN',
  publisher: { '@id': siteUrl('/#organization') },
}

export default function PlatformLayout({ children }: { children: ReactNode }) {
  return (
    <div className={`${inter.variable} min-h-screen bg-white font-tq text-tq-ink antialiased`}>
      <JsonLd data={[ORGANIZATION, WEBSITE]} />
      <AttributionCapture />
      <DemoRequestProvider>
        {children}
        <Footer />
      </DemoRequestProvider>
    </div>
  )
}
