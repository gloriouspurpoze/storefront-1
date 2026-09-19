import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import Script from 'next/script'
import { fetchStorefrontConfig, type StorefrontConfig } from '@/lib/storefront-api'
import { assertRouteTenant } from '@/lib/load-tenant'
import type { ResolvedTenant } from '@/lib/types'
import { contrastTextOn, colorsTooSimilar } from '@/lib/brandContrast'
import { themeRootClass } from '@/lib/theme-classes'
import { AccountAuthProvider } from '@/components/account/AccountAuthProvider'
import { TradeProThemeStyles } from '@/themes/home-services/trade-pro/TradeProThemeStyles'

const TRADE_PRO_PRIMARY = '#00142F'
const TRADE_PRO_SECONDARY = '#FE9D16'
const INK_700 = '#4B5563'
interface RouteParams {
  params: Promise<{ tenantId: string }>
}

export async function generateMetadata({ params }: RouteParams): Promise<Metadata> {
  const { tenantId } = await params
  const tenant = await assertRouteTenant(tenantId)

  const cfg = await fetchStorefrontConfig(tenant.id)
  const seo = cfg?.seo ?? {}
  const branding = cfg?.branding ?? {}

  const siteName = branding.siteName || tenant.name
  const defaultTitle = seo.defaultTitle || siteName
  const description =
    seo.defaultDescription ||
    branding.tagline ||
    `Welcome to ${siteName} — powered by Profixer.`
  const ogImage = seo.ogImageUrl
  const robotsIndex = seo.robots?.indexable !== false
  const robotsFollow = seo.robots?.followLinks !== false
  const verification = seo.analytics?.googleSiteVerification

  return {
    title: { default: defaultTitle, template: seo.titleTemplate || `%s · ${siteName}` },
    description,
    keywords: seo.defaultKeywords,
    icons: branding.faviconUrl ? [{ rel: 'icon', url: branding.faviconUrl }] : undefined,
    openGraph: {
      title: defaultTitle,
      description,
      type: 'website',
      images: ogImage ? [{ url: ogImage }] : undefined,
      siteName,
    },
    twitter: seo.twitterHandle
      ? {
          card: 'summary_large_image',
          site: seo.twitterHandle,
          title: defaultTitle,
          description,
          images: ogImage ? [ogImage] : undefined,
        }
      : undefined,
    robots: { index: robotsIndex, follow: robotsFollow },
    verification: verification ? { google: verification } : undefined,
    alternates: seo.canonicalDomain ? { canonical: seo.canonicalDomain } : undefined,
  }
}

/**
 * Build a CSS variables object that themes can use via `var(--site-brand)`,
 * `var(--site-accent)`, etc. Storefront config overrides the legacy
 * `publicSiteTheme.brandColor`.
 *
 * trade-pro (home-services default): primary + secondary are distinct roles
 * per DESIGN.md — primary = money CTAs, secondary = accents/badges.
 */
function brandStyle(tenant: ResolvedTenant, cfg: StorefrontConfig | null): React.CSSProperties {
  const isTradePro = cfg?.themeKey === 'trade-pro'
  const defaultBrand = isTradePro ? TRADE_PRO_PRIMARY : '#0f172a'
  const brand =
    cfg?.branding?.primaryColor ||
    (tenant.publicSiteTheme?.brandColor as string | undefined) ||
    defaultBrand
  const accent = cfg?.branding?.accentColor || brand
  let secondary =
    cfg?.branding?.secondaryColor || (isTradePro ? TRADE_PRO_SECONDARY : brand)
  // If secondary ≈ primary, fall back to a neutral so outline/ghost actions stay distinct.
  if (isTradePro && colorsTooSimilar(brand, secondary)) {
    secondary = INK_700
  }
  const brandContrast = contrastTextOn(brand)
  const secondaryContrast = contrastTextOn(secondary)
  return {
    ['--site-brand' as never]: brand,
    ['--site-accent' as never]: accent,
    ['--site-secondary' as never]: secondary,
    ['--brand-primary' as never]: brand,
    ['--brand-secondary' as never]: secondary,
    ['--brand-primary-contrast' as never]: brandContrast,
    ['--brand-secondary-contrast' as never]: secondaryContrast,
  }
}

/** Build JSON-LD blocks (Organization, LocalBusiness, etc.). */
function structuredData(tenant: ResolvedTenant, cfg: StorefrontConfig | null): Array<Record<string, unknown>> {
  const blocks: Array<Record<string, unknown>> = []
  const sd = cfg?.seo?.structuredData ?? {}
  const siteName = cfg?.branding?.siteName || tenant.name
  const description = cfg?.seo?.defaultDescription || cfg?.branding?.tagline || `Welcome to ${siteName}.`
  const url = cfg?.seo?.canonicalDomain
  const logo = cfg?.branding?.logoUrl
  const phone = cfg?.branding?.contactPhone
  const address = cfg?.branding?.address
  const socials = Object.values(cfg?.branding?.socials ?? {}).filter((s): s is string => Boolean(s))

  if (sd.organization) {
    blocks.push({
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: siteName,
      url,
      logo,
      sameAs: socials.length ? socials : undefined,
      description,
    })
  }
  if (sd.localBusiness) {
    blocks.push({
      '@context': 'https://schema.org',
      '@type': 'LocalBusiness',
      name: siteName,
      url,
      telephone: phone,
      image: logo,
      address: address ? { '@type': 'PostalAddress', streetAddress: address } : undefined,
      description,
    })
  }
  return blocks
}

export default async function TenantLayout({
  children,
  params,
}: {
  children: ReactNode
  params: Promise<{ tenantId: string }>
}) {
  const { tenantId } = await params
  const tenant = await assertRouteTenant(tenantId)
  const cfg = await fetchStorefrontConfig(tenant.id)
  const jsonLd = structuredData(tenant, cfg)
  const analytics = cfg?.seo?.analytics ?? {}
  const themeClass = themeRootClass(cfg?.themeKey)

  return (
    <div
      className={`min-h-screen ${themeClass}`}
      style={brandStyle(tenant, cfg)}
      data-tenant={tenant.slug}
      data-theme={cfg?.themeKey ?? 'classic'}
    >
      {jsonLd.map((block, i) => (
        <Script
          key={`jsonld-${i}`}
          id={`jsonld-${i}`}
          type="application/ld+json"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(block) }}
        />
      ))}
      {analytics.googleTagManagerId && (
        <Script
          id="gtm"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${analytics.googleTagManagerId}');`,
          }}
        />
      )}
      {analytics.googleAnalyticsId && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${analytics.googleAnalyticsId}`}
            strategy="afterInteractive"
          />
          <Script
            id="gtag-init"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${analytics.googleAnalyticsId}');`,
            }}
          />
        </>
      )}
      {analytics.metaPixelId && (
        <Script
          id="meta-pixel"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${analytics.metaPixelId}');fbq('track','PageView');`,
          }}
        />
      )}
      {cfg?.customCss && <style dangerouslySetInnerHTML={{ __html: cfg.customCss }} />}
      {cfg?.themeKey === 'trade-pro' ? <TradeProThemeStyles /> : null}
      <AccountAuthProvider tenantId={tenant.id}>{children}</AccountAuthProvider>
    </div>
  )
}
