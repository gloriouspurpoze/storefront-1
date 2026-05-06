/** Design tokens for the **public** consumer site (profixer.in). Consumed by storefront when backend exposes them. */

export type SiteRadiusPreset = 'sm' | 'md' | 'lg'
export type SiteSpacingDensity = 'compact' | 'comfortable' | 'spacious'

export interface PublicSiteThemeTokens {
  /** Primary brand (buttons, links emphasis) */
  primaryColor: string
  /** Secondary accent (badges, highlights) */
  accentColor: string
  /** Page background */
  backgroundColor: string
  /** Cards / surfaces */
  surfaceColor: string
  /** Main body text */
  textColor: string
  /** Muted / secondary text */
  mutedTextColor: string
  /** CSS font-family stack for headings */
  fontHeading: string
  /** CSS font-family stack for body */
  fontBody: string
  borderRadius: SiteRadiusPreset
  sectionSpacing: SiteSpacingDensity
}

export const DEFAULT_PUBLIC_SITE_THEME: PublicSiteThemeTokens = {
  primaryColor: '#1976d2',
  accentColor: '#00897b',
  backgroundColor: '#fafafa',
  surfaceColor: '#ffffff',
  textColor: '#1a1a1a',
  mutedTextColor: '#616161',
  fontHeading: '"DM Sans", system-ui, sans-serif',
  fontBody: '"Inter", system-ui, sans-serif',
  borderRadius: 'md',
  sectionSpacing: 'comfortable',
}
