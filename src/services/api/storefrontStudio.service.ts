import { api } from './base'

export interface StorefrontConfigBranding {
  siteName?: string
  tagline?: string
  logoUrl?: string
  faviconUrl?: string
  primaryColor?: string
  secondaryColor?: string
  accentColor?: string
  fontHeading?: string
  fontBody?: string
  contactEmail?: string
  contactPhone?: string
  address?: string
  socials?: Record<string, string>
}

export interface StorefrontConfigSeo {
  titleTemplate?: string
  defaultTitle?: string
  defaultDescription?: string
  defaultKeywords?: string[]
  ogImageUrl?: string
  twitterHandle?: string
  canonicalDomain?: string
  robots?: {
    indexable: boolean
    followLinks: boolean
    noArchive?: boolean
    noSnippet?: boolean
  }
  sitemapEnabled?: boolean
  rssEnabled?: boolean
  structuredData?: Record<string, boolean>
  analytics?: Record<string, string>
  pages?: Record<
    string,
    {
      title?: string
      description?: string
      ogImageUrl?: string
      noindex?: boolean
    }
  >
}

export interface StorefrontSection {
  id: string
  type: string
  enabled: boolean
  order: number
}

export interface StorefrontContent {
  heroHeadline?: string
  heroSubcopy?: string
  aboutTitle?: string
  aboutBody?: string
  faqItems?: Array<{ question: string; answer: string }>
}

export interface StorefrontConfigFeatureFlags {
  showHero?: boolean
  showProducts?: boolean
  showMenu?: boolean
  showServices?: boolean
  showReservations?: boolean
  showBooking?: boolean
  showWishlist?: boolean
  showReviews?: boolean
  showTestimonials?: boolean
  showBlog?: boolean
  showFaq?: boolean
  showLiveChat?: boolean
  showWhatsAppButton?: boolean
  showAmcOffers?: boolean
  showB2bPortal?: boolean
  showLocations?: boolean
  showCareers?: boolean
  showLoyaltyProgram?: boolean
  showCustomCss?: boolean
  showCustomScripts?: boolean
  extras?: Record<string, boolean>
}

export interface StorefrontThemeCatalogItem {
  key: string
  name: string
  description: string
  previewGradient: string
  verticals: string[]
  tier: 'free' | 'pro'
  priceInr?: number
}

export interface StorefrontAddonCatalogItem {
  flagKey: string
  sku: string
  label: string
  description: string
  priceInr: number
  verticals?: string[]
}

export interface StorefrontSectionCatalogItem {
  type: string
  label: string
  description: string
}

export interface StorefrontConfig {
  _id?: string
  tenantId: string
  branding: StorefrontConfigBranding
  seo: StorefrontConfigSeo
  featureFlags: StorefrontConfigFeatureFlags
  themeKey?: string
  sections?: StorefrontSection[]
  content?: StorefrontContent
  featureAddons?: Record<string, { sku: string; purchased?: boolean; purchasedAt?: string }>
  customCss?: string
  customHeadScripts?: string
  customBodyScripts?: string
  superAdminLocks?: string[]
  createdAt?: string
  updatedAt?: string
}

export interface StorefrontConfigMeta {
  tenantId: string
  isSuperAdmin: boolean
  verticalKey?: string
  catalog?: {
    themes: StorefrontThemeCatalogItem[]
    addons: StorefrontAddonCatalogItem[]
    sections: StorefrontSectionCatalogItem[]
  }
}

export type StorefrontConfigPatch = Partial<
  Pick<
    StorefrontConfig,
    | 'branding'
    | 'seo'
    | 'featureFlags'
    | 'themeKey'
    | 'sections'
    | 'content'
    | 'customCss'
    | 'customHeadScripts'
    | 'customBodyScripts'
    | 'superAdminLocks'
  >
>

export const SEO_ROUTE_PRESETS = ['/', '/services', '/menu', '/products', '/reserve', '/contact', '/about'] as const

export const storefrontStudioService = {
  getForTenant(tenantId: string) {
    return api.get<StorefrontConfig>(
      `/platform/tenants/${tenantId}/storefront-config`,
      { showLoading: false, showErrorToast: false, showSuccessToast: false },
    )
  },

  patchForTenant(tenantId: string, patch: StorefrontConfigPatch) {
    return api.patch<StorefrontConfig>(
      `/platform/tenants/${tenantId}/storefront-config`,
      patch,
      { showLoading: true, showSuccessToast: true, successMessage: 'Storefront config saved' },
    )
  },

  generateCopyForTenant(tenantId: string, body: { siteName?: string; tone?: string }) {
    return api.post<{ copy: StorefrontContent; config: StorefrontConfig }>(
      `/platform/tenants/${tenantId}/storefront-config/generate-copy`,
      body,
      { showLoading: true, showSuccessToast: true, successMessage: 'AI copy applied' },
    )
  },

  grantAddon(tenantId: string, flagKey: string, sku: string) {
    return api.post<StorefrontConfig>(
      `/platform/tenants/${tenantId}/storefront-config/addons/grant`,
      { flagKey, sku },
      { showLoading: true, showSuccessToast: true, successMessage: 'Add-on granted' },
    )
  },

  revokeAddon(tenantId: string, flagKey: string) {
    return api.delete<StorefrontConfig>(
      `/platform/tenants/${tenantId}/storefront-config/addons/${encodeURIComponent(flagKey)}`,
      { showLoading: true, showSuccessToast: true, successMessage: 'Add-on revoked' },
    )
  },

  getMine() {
    return api.get<StorefrontConfig>('/storefront-studio/config', {
      showLoading: false,
      showErrorToast: false,
      showSuccessToast: false,
    })
  },

  patchMine(patch: StorefrontConfigPatch) {
    return api.patch<StorefrontConfig>('/storefront-studio/config', patch, {
      showLoading: true,
      showSuccessToast: true,
      successMessage: 'Storefront updated',
    })
  },

  generateCopyMine(body: { siteName?: string; tone?: string }) {
    return api.post<{ copy: StorefrontContent; config: StorefrontConfig }>(
      '/storefront-studio/generate-copy',
      body,
      { showLoading: true, showSuccessToast: true, successMessage: 'AI copy applied' },
    )
  },
}
