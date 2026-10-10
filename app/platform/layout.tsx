import type { Metadata, Viewport } from 'next'
import type { ReactNode } from 'react'
import { Inter } from 'next/font/google'
import '../globals.css'
import { PLATFORM_BRAND, PLATFORM_CONTACT_EMAIL, PLATFORM_SAME_AS, PLATFORM_SITE_URL, siteUrl } from '@/platform/config'
import { HOME_DESCRIPTION, HOME_TITLE } from '@/platform/content/home'
import { AttributionCapture } from '@/platform/components/AttributionLink'
import { DemoRequestProvider } from '@/platform/components/DemoRequest'
import { Footer } from '@/platform/components/Footer'
import { JsonLd } from '@/platform/components/JsonLd'

const inter = Inter({ subsets: ['latin'], display: 'swap', variable: '--font-inter' })

/**
 * Torq Studio marketing site (torqstudio.com). Reached only through the platform hosts —
 * `middleware.ts` rewrites `torqstudio.com/<path>` to `/platform/<path>`.
 *
 * A root layout of its own (tenant stores use `components/root/StoreRootLayout.tsx`), so the
 * page language is a static `en-IN` — matching the INR pricing and `en_IN` Open Graph locale.
 */
export const metadata: Metadata = {
  metadataBase: new URL(PLATFORM_SITE_URL),
  title: { default: HOME_TITLE, template: `%s | ${PLATFORM_BRAND}` },
  description: HOME_DESCRIPTION,
  applicationName: PLATFORM_BRAND,
  // The root layout defaults to noindex for unresolved hosts; the marketing site must be indexable.
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 } },
  // Search Console + Bing Webmaster Tools (Bing also feeds ChatGPT search and Copilot).
  verification: {
    google: process.env.PLATFORM_GOOGLE_SITE_VERIFICATION || undefined,
    other: process.env.PLATFORM_BING_SITE_VERIFICATION ? { 'msvalidate.01': process.env.PLATFORM_BING_SITE_VERIFICATION } : undefined,
  },
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
  logo: { '@type': 'ImageObject', url: siteUrl('/brand-logo'), width: 512, height: 512 },
  email: PLATFORM_CONTACT_EMAIL,
  description: HOME_DESCRIPTION,
  ...(PLATFORM_SAME_AS.length ? { sameAs: PLATFORM_SAME_AS } : {}),
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
    <html lang="en-IN" className={inter.variable}>
      <body className="min-h-screen bg-white font-tq text-tq-ink antialiased">
        <JsonLd data={[ORGANIZATION, WEBSITE]} />
        <AttributionCapture />
        <DemoRequestProvider>
          {children}
          <Footer />
        </DemoRequestProvider>
      </body>
    </html>
  )
}
