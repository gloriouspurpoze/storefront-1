/**
 * CMS `category-marketing` / rate-card keys the consumer merges for a catalog slug.
 * Keep aligned with fixer-client `src/shared/lib/catalogCms.ts`.
 */
import { getTreeSlugFromCatalogStorageSlug } from './serviceCatalogUrlSlugs'

export const ELECTRIC_TRADE_CATEGORY_MARKETING_KEY = 'electrician' as const

const TREE_SLUG_TO_CMS_MARKETING_BASE_KEYS: Record<string, readonly string[]> = {
  ac: ['ac', 'ac-repair', 'ac-services'],
  electrician: [ELECTRIC_TRADE_CATEGORY_MARKETING_KEY, 'electrical', 'electric'],
  plumber: ['plumb', 'plumber', 'plumbing'],
  appliance: ['appliance', 'appliance-repair'],
  'appliance-repair': ['appliance', 'appliance-repair'],
  painting: ['painting', 'painter'],
  painter: ['painting', 'painter'],
  carpentry: ['carpentry', 'carpenter'],
  carpenter: ['carpentry', 'carpenter'],
  cleaning: ['cleaning'],
  'pest-control': ['pest-control'],
  'home-repair': ['default'],
  default: ['default'],
}

function cmsMarketingBaseKeysFallbackFromSlug(normalizedSlug: string): string[] {
  const s = normalizedSlug
  if (s.includes('ac')) return ['ac']
  if (s.includes('plumb')) return ['plumb', 'plumber']
  if (s.includes('electrician') || s.includes('electric')) return [ELECTRIC_TRADE_CATEGORY_MARKETING_KEY]
  if (s.includes('appliance')) return ['appliance', 'appliance-repair']
  if (s.includes('paint')) return ['painting']
  if (s.includes('carpent')) return ['carpentry']
  if (s.includes('pest')) return ['pest-control']
  if (s.includes('clean')) return ['cleaning']
  return ['default']
}

/** Base CMS keys to read/write for this admin catalog slug (deduped, stable order). */
export function cmsMarketingBaseKeysForCatalogSlug(catalogSlug: string | undefined): string[] {
  const slug = typeof catalogSlug === 'string' ? catalogSlug.trim() : ''
  if (!slug) return ['default']
  const raw = slug.toLowerCase()
  const tree = getTreeSlugFromCatalogStorageSlug(slug).trim().toLowerCase()
  const fromExplicit =
    TREE_SLUG_TO_CMS_MARKETING_BASE_KEYS[raw] ?? TREE_SLUG_TO_CMS_MARKETING_BASE_KEYS[tree]
  if (fromExplicit) return [...new Set(fromExplicit)]
  return cmsMarketingBaseKeysFallbackFromSlug(tree || raw)
}

/** Primary key — first alias the consumer tries. */
export function primaryCatalogMarketingKey(catalogSlug: string | undefined): string {
  const keys = cmsMarketingBaseKeysForCatalogSlug(catalogSlug)
  return keys[0] ?? 'default'
}

export function cmsMarketingCompositeKey(baseKey: string, localitySlug: string): string {
  const cat = baseKey.trim().toLowerCase() || 'default'
  const loc = localitySlug.trim().toLowerCase().replace(/\s+/g, '-')
  return `${cat}__${loc}`
}

/** Keys under which pricing should be mirrored so consumer merge always finds rows. */
export function cmsMarketingPricingMirrorKeys(catalogSlug: string, localitySlug?: string | null): string[] {
  const bases = cmsMarketingBaseKeysForCatalogSlug(catalogSlug)
  const loc = typeof localitySlug === 'string' ? localitySlug.trim().toLowerCase() : ''
  const keys = new Set<string>()
  for (const base of bases) keys.add(base)
  keys.add(catalogSlug.trim().toLowerCase())
  if (loc) {
    for (const base of bases) keys.add(cmsMarketingCompositeKey(base, loc))
    keys.add(cmsMarketingCompositeKey(catalogSlug, loc))
  }
  return [...keys]
}
