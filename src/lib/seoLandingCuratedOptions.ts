/** Curated enums for SEO landing CMS — prevents typos in structured fields. */

export const SEO_AREA_CITY_OPTIONS = [
  { value: 'Mumbai', label: 'Mumbai' },
  { value: 'Thane', label: 'Thane' },
  { value: 'Navi Mumbai', label: 'Navi Mumbai' },
  { value: 'Mira Bhayandar', label: 'Mira Bhayandar' },
  { value: 'Palghar', label: 'Palghar' },
] as const

export function buildSeoYearOptions(yearsBack = 2, yearsForward = 1): { value: string; label: string }[] {
  const now = new Date().getFullYear()
  const out: { value: string; label: string }[] = []
  for (let y = now + yearsForward; y >= now - yearsBack; y--) {
    out.push({ value: String(y), label: String(y) })
  }
  return out
}

export type CanonicalPreset = { value: string; label: string; hint?: string }

export function buildCanonicalPresets(input: {
  slug: string
  pathPrefix: string
  derivedServiceUrl?: string
  derivedNearMeUrl?: string
}): CanonicalPreset[] {
  const { slug, pathPrefix, derivedServiceUrl, derivedNearMeUrl } = input
  const presets: CanonicalPreset[] = []
  if (slug) {
    if (pathPrefix && pathPrefix !== '/') {
      presets.push({
        value: `${pathPrefix}/${slug}`,
        label: 'Self-canonical (this page)',
        hint: `${pathPrefix}/${slug}`,
      })
    } else {
      presets.push({ value: `/${slug}`, label: 'Self-canonical (money page)', hint: `/${slug}` })
    }
  }
  if (derivedServiceUrl) {
    presets.push({
      value: derivedServiceUrl,
      label: 'Funnel → industry service page',
      hint: derivedServiceUrl,
    })
  }
  if (derivedNearMeUrl) {
    presets.push({
      value: derivedNearMeUrl,
      label: 'Funnel → near-me page',
      hint: derivedNearMeUrl,
    })
  }
  presets.push({ value: '__custom__', label: 'Custom path (advanced)…' })
  return presets
}
