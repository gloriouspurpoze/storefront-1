import type { PlatformService } from '../../services/api/platformServices.service'
import type { Subcategory } from '../../services/api/subcategories.service'

export type CatalogSubgroup = {
  subKey: string
  subLabel: string
  subcategoryId?: string
  sortOrder?: number
  services: PlatformService[]
}

export type CatalogCategoryGroup = {
  categoryKey: string
  categoryLabel: string
  serviceCount: number
  subgroups: CatalogSubgroup[]
}

export function formatSubcategoryLabel(rawKey: string): string {
  if (rawKey === '__general__') return 'No subcategory assigned'
  return rawKey
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim()
}

export function getCategoryDisplayName(categoryNameById: Record<string, string>, categoryId: string | undefined) {
  if (!categoryId) return 'Uncategorized'
  const name = categoryNameById[String(categoryId).toLowerCase()]
  return name || categoryId
}

export type SubcategoryLookup = {
  resolve: (categoryKey: string, subKey: string) => { id: string; sortOrder: number; label: string } | null
}

function subcategoryAliasKeys(raw: string): string[] {
  const key = raw.trim().toLowerCase()
  if (!key || key === '__general__') return []
  const hyphen = key.replace(/_/g, '-')
  const underscore = key.replace(/-/g, '_')
  const compact = key.replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
  const compactUnderscore = compact.replace(/-/g, '_')
  return Array.from(new Set([key, hyphen, underscore, compact, compactUnderscore].filter(Boolean)))
}

function categoryAliasKeys(
  categoryRef: string,
  categoryNameById: Record<string, string>,
  categorySlugById: Record<string, string>,
): string[] {
  const aliases = new Set<string>()
  for (const key of subcategoryAliasKeys(categoryRef)) aliases.add(key)

  const ref = categoryRef.toLowerCase()
  const displayName = categoryNameById[ref]
  if (displayName) {
    for (const key of subcategoryAliasKeys(displayName)) aliases.add(key)
  }

  for (const [id, slug] of Object.entries(categorySlugById)) {
    const idLower = id.toLowerCase()
    const slugLower = slug.toLowerCase()
    if (ref === idLower || ref === slugLower) {
      for (const key of subcategoryAliasKeys(idLower)) aliases.add(key)
      for (const key of subcategoryAliasKeys(slugLower)) aliases.add(key)
      const name = categoryNameById[idLower]
      if (name) {
        for (const k of subcategoryAliasKeys(name)) aliases.add(k)
      }
    }
  }

  for (const [id, name] of Object.entries(categoryNameById)) {
    if (id.toLowerCase() === ref) {
      for (const key of subcategoryAliasKeys(id)) aliases.add(key)
      for (const key of subcategoryAliasKeys(name)) aliases.add(key)
      const slug = categorySlugById[id]
      if (slug) {
        for (const key of subcategoryAliasKeys(slug)) aliases.add(key)
      }
    }
  }

  return Array.from(aliases)
}

export function buildSubcategoryLookup(
  subcategories: Subcategory[],
  categoryNameById: Record<string, string> = {},
  categorySlugById: Record<string, string> = {},
): SubcategoryLookup {
  const map = new Map<string, { id: string; sortOrder: number; label: string }>()

  const register = (cat: string, alias: string, entry: { id: string; sortOrder: number; label: string }) => {
    if (!alias) return
    map.set(`${cat}::${alias}`, entry)
  }

  for (const sub of subcategories) {
    const catId = String(sub.categoryId ?? '').toLowerCase()
    if (!catId) continue
    const mongoId = String(sub.id ?? sub._id ?? '').toLowerCase()
    if (!mongoId) continue
    const slug = (sub.slug ?? '').toLowerCase()
    const name = (sub.name ?? '').trim().toLowerCase()
    const displayName = (sub.displayName ?? '').trim().toLowerCase()
    const label = (sub.displayName ?? sub.name ?? '').trim() || formatSubcategoryLabel(slug || mongoId)
    const entry = { id: String(sub.id ?? sub._id), sortOrder: sub.sortOrder ?? 0, label }

    const cats = categoryAliasKeys(catId, categoryNameById, categorySlugById)
    for (const cat of cats) {
      for (const alias of subcategoryAliasKeys(mongoId)) register(cat, alias, entry)
      for (const alias of subcategoryAliasKeys(slug)) register(cat, alias, entry)
      for (const alias of subcategoryAliasKeys(name)) register(cat, alias, entry)
      for (const alias of subcategoryAliasKeys(displayName)) register(cat, alias, entry)
    }
  }

  return {
    resolve(categoryKey: string, subKey: string) {
      if (subKey === '__general__') return null
      const cats = categoryAliasKeys(categoryKey, categoryNameById, categorySlugById)
      for (const cat of cats) {
        for (const alias of subcategoryAliasKeys(subKey)) {
          const hit = map.get(`${cat}::${alias}`)
          if (hit) return hit
        }
      }
      return null
    },
  }
}

function resolveSubgroupMeta(
  categoryKey: string,
  subKey: string,
  sample: PlatformService,
  subcategoryLookup?: SubcategoryLookup,
) {
  if (!subcategoryLookup) return null
  const catId = String(sample.category_id ?? '').trim().toLowerCase()
  const subId = String(sample.subcategory_id ?? '').trim().toLowerCase()
  return (
    subcategoryLookup.resolve(categoryKey, subKey) ??
    (catId ? subcategoryLookup.resolve(catId, subKey) : null) ??
    (subId ? subcategoryLookup.resolve(categoryKey, subId) : null) ??
    (catId && subId ? subcategoryLookup.resolve(catId, subId) : null)
  )
}

function compareSubgroups(a: CatalogSubgroup, b: CatalogSubgroup): number {
  if (a.subKey === '__general__') return 1
  if (b.subKey === '__general__') return -1
  const ao = a.sortOrder ?? 9999
  const bo = b.sortOrder ?? 9999
  if (ao !== bo) return ao - bo
  return a.subLabel.localeCompare(b.subLabel, undefined, { sensitivity: 'base' })
}

export function groupServicesIntoCatalog(
  list: PlatformService[],
  categoryNameById: Record<string, string>,
  subcategoryLookup?: SubcategoryLookup,
): CatalogCategoryGroup[] {
  const byCat = new Map<string, Map<string, PlatformService[]>>()
  for (const s of list) {
    const catKey = String(s.category ?? 'uncategorized').toLowerCase()
    const rawSub = (s.subcategory ?? '').trim()
    const subKey = rawSub ? rawSub.toLowerCase() : '__general__'
    if (!byCat.has(catKey)) byCat.set(catKey, new Map())
    const subMap = byCat.get(catKey)!
    if (!subMap.has(subKey)) subMap.set(subKey, [])
    subMap.get(subKey)!.push(s)
  }

  const groups: CatalogCategoryGroup[] = []

  for (const [categoryKey, subMap] of Array.from(byCat.entries())) {
    const subgroups: CatalogSubgroup[] = []
    for (const [subKey, svcs] of Array.from(subMap.entries())) {
      const sample = svcs[0]
      const meta = sample ? resolveSubgroupMeta(categoryKey, subKey, sample, subcategoryLookup) : null
      subgroups.push({
        subKey,
        subLabel: meta?.label ?? formatSubcategoryLabel(subKey),
        subcategoryId: meta?.id ?? sample?.subcategory_id,
        sortOrder: meta?.sortOrder,
        services: [...svcs].sort(
          (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0) || a.name.localeCompare(b.name),
        ),
      })
    }
    subgroups.sort(compareSubgroups)
    const serviceCount = subgroups.reduce((n, sg) => n + sg.services.length, 0)
    groups.push({
      categoryKey,
      categoryLabel: getCategoryDisplayName(categoryNameById, categoryKey),
      serviceCount,
      subgroups,
    })
  }

  groups.sort((a, b) => a.categoryLabel.localeCompare(b.categoryLabel, undefined, { sensitivity: 'base' }))
  return groups
}

export function reorderCatalogServices(
  groups: CatalogCategoryGroup[],
  categoryKey: string,
  subKey: string,
  activeId: string,
  overId: string,
): CatalogCategoryGroup[] {
  return groups.map((cat) => {
    if (cat.categoryKey !== categoryKey) return cat
    return {
      ...cat,
      subgroups: cat.subgroups.map((sub) => {
        if (sub.subKey !== subKey) return sub
        const oldIndex = sub.services.findIndex((s) => s.id === activeId)
        const newIndex = sub.services.findIndex((s) => s.id === overId)
        if (oldIndex < 0 || newIndex < 0 || oldIndex === newIndex) return sub
        const services = [...sub.services]
        const [moved] = services.splice(oldIndex, 1)
        services.splice(newIndex, 0, moved)
        return { ...sub, services }
      }),
    }
  })
}

export function reorderCatalogSubgroups(
  groups: CatalogCategoryGroup[],
  categoryKey: string,
  activeSubKey: string,
  overSubKey: string,
): CatalogCategoryGroup[] {
  return groups.map((cat) => {
    if (cat.categoryKey !== categoryKey) return cat
    const sortable = cat.subgroups.filter((s) => s.subKey !== '__general__' && s.subcategoryId)
    const general = cat.subgroups.filter((s) => s.subKey === '__general__')
    const oldIndex = sortable.findIndex((s) => s.subKey === activeSubKey)
    const newIndex = sortable.findIndex((s) => s.subKey === overSubKey)
    if (oldIndex < 0 || newIndex < 0 || oldIndex === newIndex) return cat
    const next = [...sortable]
    const [moved] = next.splice(oldIndex, 1)
    next.splice(newIndex, 0, moved)
    return { ...cat, subgroups: [...next, ...general] }
  })
}
