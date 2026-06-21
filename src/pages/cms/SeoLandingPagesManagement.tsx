import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ExternalLink,
  FileSearch,
  Loader2,
  Plus,
  Save,
  Search,
  Trash2,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { Textarea } from '../../components/ui/textarea'
import { Switch } from '../../components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs'
import { Badge } from '../../components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select'
import { PageHeader } from '../../components/common/PageHeader'
import { CMSService } from '../../services/api'
import { CategoriesService } from '../../services/api/categories.service'
import { useCmsCatalogCategories } from '../../hooks/useCmsCatalogCategories'
import { useServiceCatalogLocalities } from '../../hooks/useServiceCatalogLocalities'
import { usePermissions } from '../../hooks/usePermissions'
import { appToast } from '../../lib/appToast'
import { cn } from '../../lib/utils'
import { SeoSectionsEditor } from '../../components/cms/SeoSectionsEditor'
import { SeoLandingFaqEditor } from '../../components/cms/SeoLandingFaqEditor'
import { SeoLandingPriceTableEditor } from '../../components/cms/SeoLandingPriceTableEditor'
import { SeoLandingInternalLinksEditor } from '../../components/cms/SeoLandingInternalLinksEditor'
import { SeoCompactRichTextField } from '../../components/cms/SeoCompactRichTextField'
import { SeoLandingKeyTakeawaysEditor } from '../../components/cms/SeoLandingKeyTakeawaysEditor'
import { SeoCuratedMultiSelect, SeoCuratedSingleSelect } from '../../components/cms/SeoCuratedPickers'
import { SeoLandingPageHealthPanel } from '../../components/cms/SeoLandingPageHealthPanel'
import { SeoPlatformCatalogPriceImportBar } from '../../components/cms/SeoPlatformCatalogPriceImportBar'
import { SeoLandingSerpPreview } from '../../components/cms/SeoLandingSerpPreview'
import {
  buildCanonicalPresets,
  buildSeoYearOptions,
  SEO_AREA_CITY_OPTIONS,
} from '../../lib/seoLandingCuratedOptions'
import {
  buildSeoLandingSchemaPreview,
  SCHEMA_INDUSTRY_NOTES,
} from '../../lib/buildSeoLandingPreviewJsonLd'
import { isValidSeoLandingSlug, normalizeSeoLandingSlug } from '../../lib/seoLandingSlug'
import {
  buildNearMeLocalityPublicPath,
  buildNearMeCategoryPublicPath,
} from '../../lib/nearMeSeo'
import {
  buildServiceLocalityPublicPath,
  getPreferredServiceCategoryUrlSlug,
} from '../../lib/serviceCatalogUrlSlugs'
import {
  kindMeta,
  pageListTitle,
  publicUrlForKind,
  estimateSeoLandingWordCount,
  SEO_LANDING_KINDS,
  SEO_LANDING_MIN_WORDS,
  SEO_LANDING_OPTIMAL_WORDS,
  SEO_LANDING_MIN_INTERNAL_LINKS,
  type SeoLandingEntityKind,
} from '../../lib/seoLandingPageKinds'
import {
  mergeSuggestedInternalLinks,
  suggestSeoLandingInternalLinks,
} from '../../lib/seoLandingSuggestLinks'
import {
  buildSeoCategoryPickerOptions,
  fetchPlatformServicesForSeoCategory,
  filterKnownSeoCategorySlugs,
  getSeoPageCategorySlugs,
  isValidSeoCategorySlug,
  normalizeSeoCategorySlug,
  seoLandingKindHasCategoryFilter,
  seoPageMatchesCategoryFilter,
} from '../../lib/seoLandingCatalogSlugs'
import {
  buildPriceTableFromPlatformServices,
  buildPriceTablePatch,
  mergePriceTableWithCatalog,
  readPriceTableRows,
  suggestPriceTableCaption,
  usesTopLevelPriceTable,
} from '../../lib/platformServicesPriceGuide'
import {
  buildSeoLandingQualityReport,
  quickSeoLandingPageStatus,
} from '../../lib/seoLandingContentQuality'
import {
  effectiveSeoLandingMetaDescription,
  effectiveSeoLandingMetaTitle,
  suggestSeoLandingMetaDescription,
  suggestSeoLandingMetaTitle,
} from '../../lib/seoLandingEffectiveMeta'
import {
  SEO_LANDING_LENGTH_RULES,
  analyzeSeoLandingLengthWarnings,
  evaluateLength,
  lengthWarningsNeedAttention,
} from '../../lib/seoLandingContentLengthRules'
import { SeoContentLengthHint } from '../../components/cms/SeoContentLengthHint'
import type { ContentSection } from '../../types/seoLandingSections'
import type { Category } from '../../types'

type EntityDraft = Record<string, unknown>
type EditorTab = 'setup' | 'content' | 'links' | 'seo'

function stripHtmlPlain(s?: string): string {
  return (s ?? '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
}

function prepareRecordsForSave(
  kind: SeoLandingEntityKind,
  records: Record<string, EntityDraft>,
  catalogOptions: { value: string; label: string }[],
  validLocalities: Set<string>,
): { ok: true; payload: Record<string, EntityDraft> } | { ok: false; message: string } {
  const payload: Record<string, EntityDraft> = {}
  for (const [key, row] of Object.entries(records)) {
    const desired = normalizeSeoLandingSlug(String(row.slug ?? key))
    if (!isValidSeoLandingSlug(desired)) {
      return { ok: false, message: `Invalid URL slug “${desired || key}” — use lowercase letters, numbers, and hyphens.` }
    }
    if (payload[desired]) {
      return { ok: false, message: `Duplicate slug “${desired}” — each page needs a unique URL.` }
    }
    const entity: EntityDraft = { ...row, slug: desired }

    if (entity.serviceSlug && !isValidSeoCategorySlug(String(entity.serviceSlug), catalogOptions)) {
      return {
        ok: false,
        message: `Invalid service category “${entity.serviceSlug}” on “${desired}” — pick from the catalog dropdown.`,
      }
    }
    if (entity.serviceSlug) {
      entity.serviceSlug = normalizeSeoCategorySlug(String(entity.serviceSlug))
    }
    if (entity.locationSlug && !validLocalities.has(String(entity.locationSlug).trim().toLowerCase())) {
      return {
        ok: false,
        message: `Invalid service area “${entity.locationSlug}” on “${desired}” — pick from Service areas.`,
      }
    }
    if (Array.isArray(entity.servicesOffered)) {
      entity.servicesOffered = filterKnownSeoCategorySlugs(
        entity.servicesOffered.map(String),
        catalogOptions,
      )
    }
    if (Array.isArray(entity.areasServed)) {
      entity.areasServed = entity.areasServed.map(String).filter((s) => validLocalities.has(s))
    }
    if (Array.isArray(entity.neighbours)) {
      entity.neighbours = entity.neighbours.map(String).filter((s) => validLocalities.has(s) && s !== desired)
    }
    if (kind === 'locations' && !validLocalities.has(desired)) {
      return {
        ok: false,
        message: `Area page slug “${desired}” must match a Service areas catalog entry.`,
      }
    }

    if (kind === 'landing-pages') {
      const seo = (entity.seo as Record<string, unknown> | undefined) ?? {}
      const canonical = String(seo.canonicalPath ?? '').trim()
      if (!canonical || canonical === `/${key}`) {
        entity.seo = { ...seo, canonicalPath: `/${desired}` }
      }
    }
    payload[desired] = entity
  }
  return { ok: true, payload }
}

function emptyDraft(kind: SeoLandingEntityKind, slug: string): EntityDraft {
  const base: EntityDraft = {
    slug,
    title: '',
    quickAnswer: '',
    keyTakeaways: [],
    body: '',
    sections: [],
    faqs: [],
    relatedLinks: [],
    seo: { noindex: false },
  }
  if (kind === 'problems' || kind === 'cost-guides' || kind === 'guides' || kind === 'landing-pages') {
    base.serviceSlug = 'ac-repair'
  }
  if (kind === 'cost-guides') {
    base.year = new Date().getFullYear()
    base.priceTable = []
  }
  if (kind === 'guides') {
    base.howToSteps = []
  }
  if (kind === 'providers') {
    return {
      slug,
      name: '',
      bio: '',
      servicesOffered: ['electrician'],
      areasServed: ['mira-road'],
      reviews: [],
      faqs: [],
      relatedLinks: [],
      seo: { noindex: false },
    }
  }
  if (kind === 'locations') {
    return {
      slug,
      name: '',
      city: 'Mumbai',
      region: 'Maharashtra',
      subtitle: '',
      quickAnswer: '',
      neighbours: [],
      stats: { providers: 45, jobsCompleted: 1200, avgRating: 4.8 },
      sections: [],
      faqs: [],
      relatedLinks: [],
      seo: { noindex: false },
    }
  }
  if (kind === 'landing-pages') {
    return {
      slug,
      title: '',
      serviceSlug: 'ac-repair',
      locationSlug: 'mira-road',
      locationName: '',
      quickAnswer: '',
      keyTakeaways: [],
      priceTable: [],
      priceTableCaption: '',
      sections: [],
      faqs: [],
      relatedLinks: [],
      seo: { noindex: false, canonicalPath: slug ? `/${slug}` : '' },
    }
  }
  return base
}

async function fetchKindRecord(kind: SeoLandingEntityKind): Promise<Record<string, unknown>> {
  switch (kind) {
    case 'problems':
      return CMSService.getSeoProblems()
    case 'cost-guides':
      return CMSService.getSeoCostGuides()
    case 'guides':
      return CMSService.getSeoGuides()
    case 'providers':
      return CMSService.getSeoProviders()
    case 'locations':
      return CMSService.getSeoLocations()
    case 'landing-pages':
      return CMSService.getSeoLandingPages()
  }
}

async function saveKindRecord(kind: SeoLandingEntityKind, data: Record<string, unknown>) {
  switch (kind) {
    case 'problems':
      return CMSService.updateSeoProblems(data)
    case 'cost-guides':
      return CMSService.updateSeoCostGuides(data)
    case 'guides':
      return CMSService.updateSeoGuides(data)
    case 'providers':
      return CMSService.updateSeoProviders(data)
    case 'locations':
      return CMSService.updateSeoLocations(data)
    case 'landing-pages':
      return CMSService.updateSeoLandingPages(data)
  }
}

function FieldHint({ children }: { children: React.ReactNode }) {
  return <p className="text-xs text-muted-foreground leading-relaxed">{children}</p>
}

function SectionCard({
  title,
  description,
  children,
}: {
  title: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <Card className="overflow-hidden border-border/70 shadow-sm">
      <CardHeader className="border-b border-border/50 bg-muted/25 py-4">
        <CardTitle className="text-base font-semibold">{title}</CardTitle>
        {description ? <CardDescription className="text-sm">{description}</CardDescription> : null}
      </CardHeader>
      <CardContent className="space-y-4 pt-5">{children}</CardContent>
    </Card>
  )
}

export default function SeoLandingPagesManagement() {
  const { checkPermission } = usePermissions()
  const canMutate = checkPermission('manage_system_settings')
  const { options: catalogOptions, loading: catalogOptionsLoading } = useCmsCatalogCategories()
  const { rows: managedLocalities, loading: localitiesLoading } = useServiceCatalogLocalities()

  const sortedLocalities = useMemo(
    () =>
      [...managedLocalities]
        .filter((l) => l.isActive !== false)
        .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name)),
    [managedLocalities],
  )

  const [kind, setKind] = useState<SeoLandingEntityKind>('problems')
  const [editorTab, setEditorTab] = useState<EditorTab>('setup')
  const [records, setRecords] = useState<Record<string, EntityDraft>>({})
  const [selectedSlug, setSelectedSlug] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [newSlug, setNewSlug] = useState('')
  const [pageSearch, setPageSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [categoryRecords, setCategoryRecords] = useState<Category[]>([])
  const [priceGuideImporting, setPriceGuideImporting] = useState(false)

  const meta = kindMeta(kind)
  const slugs = useMemo(() => Object.keys(records).sort(), [records])

  const catalogLabelMap = useMemo(() => {
    const map: Record<string, string> = {}
    for (const o of catalogOptions) {
      map[o.value] = o.label
      const preferred = normalizeSeoCategorySlug(o.value)
      if (!map[preferred]) map[preferred] = o.label
    }
    return map
  }, [catalogOptions])

  const catalogCuratedOptions = useMemo(
    () => buildSeoCategoryPickerOptions(catalogOptions),
    [catalogOptions],
  )

  const sidebarCategoryFilterOptions = useMemo(() => {
    const counts = new Map<string, number>()
    let uncategorized = 0
    for (const s of slugs) {
      const cats = getSeoPageCategorySlugs(kind, records[s] ?? {})
      if (cats.length === 0) {
        uncategorized++
      } else {
        const seen = new Set<string>()
        for (const c of cats) {
          if (seen.has(c)) continue
          seen.add(c)
          counts.set(c, (counts.get(c) ?? 0) + 1)
        }
      }
    }
    const opts: { value: string; label: string; hint?: string }[] = []
    for (const o of catalogCuratedOptions) {
      const n = counts.get(o.value)
      if (n && n > 0) {
        opts.push({ value: o.value, label: o.label, hint: `${n}` })
      }
    }
    for (const [c, n] of counts) {
      if (!opts.some((o) => o.value === c)) {
        opts.push({ value: c, label: catalogLabelMap[c] ?? c, hint: `${n}` })
      }
    }
    opts.sort((a, b) => a.label.localeCompare(b.label))
    if (uncategorized > 0) {
      opts.push({ value: '__uncategorized__', label: 'Uncategorized', hint: `${uncategorized}` })
    }
    return opts
  }, [slugs, records, kind, catalogCuratedOptions, catalogLabelMap])

  const filteredSlugs = useMemo(() => {
    const q = pageSearch.trim().toLowerCase()
    return slugs.filter((s) => {
      const d = records[s] ?? {}
      if (categoryFilter && !seoPageMatchesCategoryFilter(kind, d, categoryFilter)) {
        return false
      }
      if (!q) return true
      const title = pageListTitle(kind, d).toLowerCase()
      const catLabels = getSeoPageCategorySlugs(kind, d)
        .map((c) => (catalogLabelMap[c] ?? c).toLowerCase())
        .join(' ')
      const serviceSlug = String(d.serviceSlug ?? d.service ?? '').toLowerCase()
      return s.includes(q) || title.includes(q) || catLabels.includes(q) || serviceSlug.includes(q)
    })
  }, [slugs, pageSearch, categoryFilter, records, kind, catalogLabelMap])

  const listFilterActive = Boolean(pageSearch.trim() || categoryFilter)

  const draft: EntityDraft = useMemo(
    () => (selectedSlug ? records[selectedSlug] ?? emptyDraft(kind, selectedSlug) : emptyDraft(kind, '')),
    [records, selectedSlug, kind],
  )

  const wordCount = useMemo(() => estimateSeoLandingWordCount(kind, draft), [kind, draft])
  const qualityReport = useMemo(
    () => buildSeoLandingQualityReport(kind, draft, catalogLabelMap),
    [kind, draft, catalogLabelMap],
  )
  const lengthWarnings = useMemo(
    () => analyzeSeoLandingLengthWarnings(kind, draft, catalogLabelMap),
    [kind, draft, catalogLabelMap],
  )
  const lengthIssueCount = lengthWarningsNeedAttention(lengthWarnings).length
  const readyToIndex = qualityReport.statusLabel === 'Publish ready'
  const metaPreview = useMemo(() => {
    const slug = normalizeSeoLandingSlug(String(draft.slug ?? selectedSlug))
    const title = effectiveSeoLandingMetaTitle(kind, draft, catalogLabelMap)
    const description = effectiveSeoLandingMetaDescription(kind, draft, catalogLabelMap)
    const canonical = String((draft.seo as Record<string, unknown> | undefined)?.canonicalPath ?? '').trim()
    const origin = 'https://www.profixer.in'
    const path = publicUrlForKind(kind, slug)
    const url = canonical
      ? canonical.startsWith('http')
        ? canonical
        : `${origin}${canonical.startsWith('/') ? canonical : `/${canonical}`}`
      : `${origin}${path}`
    return {
      title: title.value,
      description: description.value,
      url,
      titleSource:
        title.source === 'seo'
          ? 'Custom SEO title'
          : title.source === 'page'
            ? 'Auto from H1'
            : title.source === 'name'
              ? 'Auto from name'
              : undefined,
      descriptionSource:
        description.source === 'seo'
          ? 'Custom meta description'
          : description.source === 'quickAnswer'
            ? 'Auto from quick answer'
            : description.source === 'bio'
              ? 'Auto from bio'
              : description.source === 'location'
                ? 'Auto area template'
                : undefined,
    }
  }, [kind, draft, selectedSlug, catalogLabelMap])
  const tabNeedsAttention = useCallback(
    (tab: EditorTab) =>
      qualityReport.items.some((i) => i.tab === tab && !i.ok && i.priority === 'required') ||
      lengthWarnings.some((w) => w.tab === tab && w.severity !== 'ok'),
    [qualityReport.items, lengthWarnings],
  )
  const sectionsHaveInlinePriceTable = useMemo(() => {
    const sections = Array.isArray(draft.sections) ? (draft.sections as ContentSection[]) : []
    return sections.some((s) => s.type === 'price_table')
  }, [draft.sections])

  const load = useCallback(async () => {
    try {
      setLoading(true)
      const raw = await fetchKindRecord(kind)
      const map: Record<string, EntityDraft> = {}
      if (raw && typeof raw === 'object') {
        for (const [key, value] of Object.entries(raw)) {
          if (value && typeof value === 'object') {
            map[key] = { ...(value as EntityDraft), slug: key }
          }
        }
      }
      setRecords(map)
      const first = Object.keys(map).sort()[0] ?? ''
      setSelectedSlug((prev) => (prev && map[prev] ? prev : first))
      setEditorTab('setup')
    } catch (e: unknown) {
      console.error(e)
      appToast('Failed to load SEO landing pages', 'error')
      setRecords({})
      setSelectedSlug('')
    } finally {
      setLoading(false)
    }
  }, [kind])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    setCategoryFilter('')
    setPageSearch('')
  }, [kind])

  useEffect(() => {
    let cancelled = false
    CategoriesService.getCategoriesForServiceUIs({ page: 1, limit: 500, is_active: true })
      .then((list) => {
        if (!cancelled) setCategoryRecords(Array.isArray(list) ? list : [])
      })
      .catch(() => {
        if (!cancelled) setCategoryRecords([])
      })
    return () => {
      cancelled = true
    }
  }, [])

  const patchDraft = (patch: Partial<EntityDraft>) => {
    if (!selectedSlug) return
    setRecords((prev) => {
      const current = prev[selectedSlug] ?? emptyDraft(kind, selectedSlug)
      const nextSlug =
        patch.slug !== undefined ? normalizeSeoLandingSlug(String(patch.slug)) : String(current.slug ?? selectedSlug)
      return {
        ...prev,
        [selectedSlug]: {
          ...emptyDraft(kind, selectedSlug),
          ...current,
          ...patch,
          slug: nextSlug || selectedSlug,
        },
      }
    })
  }

  const handleSave = async () => {
    if (!canMutate) return
    const prepared = prepareRecordsForSave(kind, records, catalogOptions, validLocalitySlugs)
    if (!prepared.ok) {
      appToast(prepared.message, 'error')
      return
    }
    const oldKey = selectedSlug
    const newKey = oldKey ? normalizeSeoLandingSlug(String(records[oldKey]?.slug ?? oldKey)) : ''
    try {
      setSaving(true)
      await saveKindRecord(kind, prepared.payload)
      setRecords(prepared.payload)
      if (newKey) setSelectedSlug(newKey)
      appToast(`${meta.label} saved.`, 'success')
    } catch (e: unknown) {
      console.error(e)
      appToast('Save failed — check API static-content route is provisioned.', 'error')
    } finally {
      setSaving(false)
    }
  }

  const addSlug = () => {
    const slug = normalizeSeoLandingSlug(newSlug)
    if (!slug) return
    if (!isValidSeoLandingSlug(slug)) {
      appToast('Slug must be 2–120 chars: lowercase letters, numbers, hyphens only.', 'error')
      return
    }
    if (kind === 'locations' && !validLocalitySlugs.has(slug)) {
      appToast('Area pages must use a slug from Service areas catalog.', 'error')
      return
    }
    if (records[slug]) {
      appToast('Slug already exists', 'error')
      return
    }
    setRecords((prev) => {
      const draftRow =
        kind === 'locations'
          ? (() => {
              const hit = sortedLocalities.find((l) => l.slug === slug)
              return hit
                ? {
                    ...emptyDraft(kind, slug),
                    name: hit.name,
                    city: SEO_AREA_CITY_OPTIONS.some((c) => c.value === hit.parentCity)
                      ? hit.parentCity!
                      : 'Mumbai',
                  }
                : emptyDraft(kind, slug)
            })()
          : emptyDraft(kind, slug)
      return { ...prev, [slug]: draftRow }
    })
    setSelectedSlug(slug)
    setNewSlug('')
    setEditorTab('setup')
  }

  const removeSlug = () => {
    if (!selectedSlug) return
    const next = { ...records }
    delete next[selectedSlug]
    setRecords(next)
    setSelectedSlug(Object.keys(next).sort()[0] ?? '')
  }

  const serviceSlug = String(draft.serviceSlug ?? '')
  const locationSlug = String(draft.locationSlug ?? '').trim().toLowerCase()
  const draftSlug = normalizeSeoLandingSlug(String(draft.slug ?? selectedSlug))
  const slugPendingRename = Boolean(selectedSlug && draftSlug && draftSlug !== selectedSlug)
  const schemaPreview = useMemo(
    () => (selectedSlug ? buildSeoLandingSchemaPreview(kind, draftSlug || selectedSlug, draft) : null),
    [kind, selectedSlug, draftSlug, draft],
  )
  const preferredCategory = serviceSlug ? getPreferredServiceCategoryUrlSlug(serviceSlug) : ''
  const localityName =
    String(draft.locationName ?? '').trim() ||
    sortedLocalities.find((l) => l.slug === locationSlug)?.name ||
    ''

  const derivedServiceUrl =
    serviceSlug && locationSlug
      ? buildServiceLocalityPublicPath(serviceSlug, locationSlug)
      : serviceSlug
        ? `/services/${preferredCategory}`
        : ''
  const derivedNearMeUrl =
    serviceSlug && locationSlug
      ? buildNearMeLocalityPublicPath(serviceSlug, locationSlug)
      : serviceSlug
        ? buildNearMeCategoryPublicPath(serviceSlug)
        : ''

  const patchLocationSlug = (slug: string) => {
    const normalized = slug.trim().toLowerCase()
    const hit = sortedLocalities.find((l) => l.slug === normalized)
    if (!hit) return
    patchDraft({
      locationSlug: normalized,
      locationName: hit.name,
    })
  }

  const importPriceGuideFromCatalog = useCallback(
    async (mode: 'replace' | 'merge') => {
      const slug = String(draft.serviceSlug ?? '').trim()
      if (!slug) {
        appToast('Pick a service category in Setup first', 'error')
        return
      }
      const existing = readPriceTableRows(draft, kind)
      if (mode === 'replace' && existing.length > 0) {
        const ok = window.confirm(
          `Replace ${existing.length} charge row(s) with industry catalog prices from Platform Services?`,
        )
        if (!ok) return
      }
      setPriceGuideImporting(true)
      try {
        const services = await fetchPlatformServicesForSeoCategory(slug, catalogOptions, categoryRecords)
        const catalogRows = buildPriceTableFromPlatformServices(services)
        if (catalogRows.length === 0) {
          appToast('No priced platform services found for this category', 'error')
          return
        }
        const rows = mode === 'merge' ? mergePriceTableWithCatalog(existing, catalogRows) : catalogRows
        const categoryLabel = catalogLabelMap[normalizeSeoCategorySlug(slug)] ?? slug
        const patch: Partial<EntityDraft> = buildPriceTablePatch(kind, draft, rows)
        if (kind === 'landing-pages' && !String(draft.priceTableCaption ?? '').trim()) {
          patch.priceTableCaption = suggestPriceTableCaption({
            categoryLabel,
            locationName: localityName || undefined,
            year: Number(draft.year) || new Date().getFullYear(),
            kind,
          })
        }
        patchDraft(patch)
        const added = mode === 'merge' ? Math.max(0, rows.length - existing.length) : catalogRows.length
        appToast(
          mode === 'merge'
            ? added > 0
              ? `Added ${added} charge row(s) from platform catalog`
              : 'All catalog services are already in the charge table'
            : `Loaded ${catalogRows.length} charge row(s) from platform catalog`,
          'success',
        )
      } catch (e: unknown) {
        appToast(e instanceof Error ? e.message : 'Failed to load platform services', 'error')
      } finally {
        setPriceGuideImporting(false)
      }
    },
    [
      draft,
      kind,
      catalogOptions,
      categoryRecords,
      catalogLabelMap,
      localityName,
    ],
  )

  const priceTableRows = useMemo(() => readPriceTableRows(draft, kind), [draft, kind])

  const localityCuratedOptions = useMemo(
    () => sortedLocalities.map((l) => ({ value: l.slug, label: l.name, hint: l.slug })),
    [sortedLocalities],
  )
  const neighbourOptions = useMemo(
    () => localityCuratedOptions.filter((o) => o.value !== draftSlug),
    [localityCuratedOptions, draftSlug],
  )
  const yearOptions = useMemo(() => buildSeoYearOptions(), [])
  const validLocalitySlugs = useMemo(() => new Set(sortedLocalities.map((l) => l.slug)), [sortedLocalities])
  const canonicalPresets = useMemo(
    () =>
      buildCanonicalPresets({
        slug: draftSlug || selectedSlug,
        pathPrefix: meta.pathPrefix,
        derivedServiceUrl,
        derivedNearMeUrl,
      }),
    [draftSlug, selectedSlug, meta.pathPrefix, derivedServiceUrl, derivedNearMeUrl],
  )
  const canonicalPath = String((draft.seo as Record<string, unknown> | undefined)?.canonicalPath ?? '').trim()
  const canonicalPresetValue = canonicalPresets.some((p) => p.value === canonicalPath && p.value !== '__custom__')
    ? canonicalPath
    : canonicalPath
      ? '__custom__'
      : ''

  const applyLocationFromCatalog = (areaSlug: string) => {
    const hit = sortedLocalities.find((l) => l.slug === areaSlug)
    if (!hit) return
    const city =
      SEO_AREA_CITY_OPTIONS.some((c) => c.value === hit.parentCity) ? hit.parentCity! : 'Mumbai'
    patchDraft({
      slug: areaSlug,
      name: hit.name,
      city,
    })
  }

  const publicUrl = draftSlug || selectedSlug ? publicUrlForKind(kind, draftSlug || selectedSlug) : ''
  const listTitle = pageListTitle(kind, draft)

  const showCategoryLocation =
    kind === 'problems' || kind === 'cost-guides' || kind === 'guides' || kind === 'landing-pages'

  const categoryLocationBlock = showCategoryLocation ? (
    <SectionCard
      title="Category & location"
      description="Pick from the live service catalog — slugs must match Categories and Service areas admin."
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <SeoCuratedSingleSelect
          label="Service category"
          value={serviceSlug ? normalizeSeoCategorySlug(serviceSlug) : ''}
          onChange={(v) => patchDraft({ serviceSlug: v })}
          options={catalogCuratedOptions}
          loading={catalogOptionsLoading}
          placeholder="Pick category"
          disabled={!canMutate}
          invalidHint="Unknown category — choose from the service catalog list."
        />
        <SeoCuratedSingleSelect
          label="Service area"
          value={locationSlug}
          onChange={patchLocationSlug}
          options={localityCuratedOptions}
          loading={localitiesLoading}
          placeholder="Pick area"
          allowEmpty
          emptyLabel="— No area —"
          disabled={!canMutate}
          invalidHint="Unknown area slug — choose from Service areas catalog."
        />
      </div>
      {(derivedServiceUrl || derivedNearMeUrl) && (
        <div className="rounded-md border border-border/60 bg-background px-3 py-2 text-xs space-y-1">
          <p>
            <span className="text-muted-foreground">Booking →</span>{' '}
            <code className="text-foreground">{derivedServiceUrl || '—'}</code>
          </p>
          <p>
            <span className="text-muted-foreground">Near-me →</span>{' '}
            <code className="text-foreground">{derivedNearMeUrl || '—'}</code>
          </p>
          {localityName ? (
            <p>
              <span className="text-muted-foreground">Display name →</span> {localityName}
            </p>
          ) : null}
        </div>
      )}
    </SectionCard>
  ) : null

  const seoBlock = (
    <>
      <SectionCard
        title="Structured data (JSON-LD)"
        description={SCHEMA_INDUSTRY_NOTES[kind]}
      >
        {schemaPreview ? (
          <div className="space-y-3">
            <div className="flex flex-wrap gap-1.5">
              {schemaPreview.nodes.map((node) => (
                <Badge key={node.type} variant={node.ready ? 'success' : 'warning'} title={node.note}>
                  {node.type}
                </Badge>
              ))}
            </div>
            <p className="text-xs text-muted-foreground font-mono break-all">{schemaPreview.pageUrl}</p>
            <ul className="list-disc space-y-1 pl-4 text-xs text-muted-foreground">
              {schemaPreview.footnotes.map((n) => (
                <li key={n}>{n}</li>
              ))}
            </ul>
            <pre className="max-h-[min(320px,40vh)] overflow-auto rounded-lg border border-border/70 bg-muted/30 p-3 text-[11px] leading-relaxed font-mono">
              {JSON.stringify(schemaPreview.document, null, 2)}
            </pre>
          </div>
        ) : null}
      </SectionCard>
      <SectionCard
        title="Search appearance"
        description="Matches profixer.in — leave blank to auto-generate from H1, area & quick answer. Use Suggest to lock in publish-ready copy."
      >
      <SeoLandingSerpPreview
        title={metaPreview.title}
        description={metaPreview.description}
        url={metaPreview.url}
        titleSource={metaPreview.titleSource}
        descriptionSource={metaPreview.descriptionSource}
        className="mb-4 rounded-lg border border-border/60 bg-muted/20 p-4"
      />
      <div className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Label>SEO title</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={!canMutate}
            onClick={() => {
              const suggested = suggestSeoLandingMetaTitle(kind, draft, catalogLabelMap)
              if (!suggested) {
                appToast('Add a page title (H1) in Setup first', 'error')
                return
              }
              patchDraft({ seo: { ...(draft.seo as object), title: suggested } })
            }}
          >
            Suggest from page
          </Button>
        </div>
        <Input
          value={String((draft.seo as Record<string, unknown>)?.title ?? '')}
          onChange={(e) => patchDraft({ seo: { ...(draft.seo as object), title: e.target.value } })}
          placeholder={metaPreview.title || 'AC Repair Cost in Mira Bhayandar (2026) | ProFixer'}
        />
        <FieldHint>
          Aim 50–60 chars · custom{' '}
          {String((draft.seo as Record<string, unknown>)?.title ?? '').length}/60
          {!String((draft.seo as Record<string, unknown>)?.title ?? '').trim() ? (
            <>
              {' '}
              · live preview {metaPreview.title.length} chars
            </>
          ) : null}
        </FieldHint>
        <SeoContentLengthHint
          warning={
            (() => {
              const custom = String((draft.seo as Record<string, unknown>)?.title ?? '').trim()
              const value = custom || metaPreview.title
              return value
                ? evaluateLength(
                    'meta-title',
                    custom ? 'SEO title' : 'Meta title (live)',
                    value,
                    SEO_LANDING_LENGTH_RULES.metaTitle,
                  )
                : null
            })()
          }
          compact
        />
      </div>
      <div className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Label>Meta description</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={!canMutate}
            onClick={() => {
              const suggested = suggestSeoLandingMetaDescription(kind, draft, catalogLabelMap)
              if (!suggested) {
                appToast('Add a quick answer in Content first', 'error')
                return
              }
              patchDraft({ seo: { ...(draft.seo as object), description: suggested } })
            }}
          >
            Suggest from quick answer
          </Button>
        </div>
        <Textarea
          rows={3}
          value={String((draft.seo as Record<string, unknown>)?.description ?? '')}
          onChange={(e) => patchDraft({ seo: { ...(draft.seo as object), description: e.target.value } })}
          placeholder={metaPreview.description || 'Indicative charges, verified pros, same-day slots…'}
        />
        <FieldHint>
          Aim 150–160 chars · custom{' '}
          {String((draft.seo as Record<string, unknown>)?.description ?? '').length}/160
          {!String((draft.seo as Record<string, unknown>)?.description ?? '').trim() ? (
            <>
              {' '}
              · live preview {metaPreview.description.length} chars
            </>
          ) : null}
        </FieldHint>
        <SeoContentLengthHint
          warning={
            (() => {
              const custom = String((draft.seo as Record<string, unknown>)?.description ?? '').trim()
              const value = custom || metaPreview.description
              return value
                ? evaluateLength(
                    'meta-description',
                    custom ? 'Meta description' : 'Meta description (live)',
                    value,
                    SEO_LANDING_LENGTH_RULES.metaDescription,
                  )
                : null
            })()
          }
          compact
        />
      </div>
      <div className="space-y-2">
        <Label>Keywords</Label>
        <Input
          value={
            Array.isArray((draft.seo as Record<string, unknown>)?.keywords)
              ? ((draft.seo as Record<string, unknown>).keywords as string[]).join(', ')
              : ''
          }
          onChange={(e) =>
            patchDraft({
              seo: {
                ...(draft.seo as object),
                keywords: e.target.value.split(',').map((kw) => kw.trim()).filter(Boolean),
              },
            })
          }
          placeholder="comma, separated, keywords"
        />
      </div>
      <div className="space-y-2">
        <SeoCuratedSingleSelect
          label="Canonical preset"
          value={canonicalPresetValue || '__none__'}
          onChange={(v) => {
            if (v === '__custom__' || v === '__none__') {
              if (v === '__none__') {
                patchDraft({ seo: { ...(draft.seo as object), canonicalPath: '' } })
              }
              return
            }
            patchDraft({ seo: { ...(draft.seo as object), canonicalPath: v } })
          }}
          options={[
            { value: '__none__', label: 'Auto (consumer default)' },
            ...canonicalPresets.filter((p) => p.value !== '__custom__'),
            { value: '__custom__', label: 'Custom path (advanced)…' },
          ]}
          disabled={!canMutate}
          placeholder="Choose canonical target"
        />
        {canonicalPresetValue === '__custom__' || (canonicalPath && !canonicalPresets.some((p) => p.value === canonicalPath)) ? (
          <Input
            className="font-mono text-sm"
            value={canonicalPath}
            onChange={(e) =>
              patchDraft({ seo: { ...(draft.seo as object), canonicalPath: e.target.value } })
            }
            placeholder={
              kind === 'landing-pages'
                ? derivedServiceUrl || `/${selectedSlug}`
                : `${meta.pathPrefix}/${selectedSlug}`
            }
          />
        ) : null}
        <FieldHint>
          Self-canonical for indexable money pages. Point to <code>/services/…</code> if this page overlaps an industry landing.
        </FieldHint>
      </div>
      <div className="flex items-center justify-between rounded-lg border border-border/70 px-3 py-3">
        <div>
          <p className="text-sm font-medium">Hide from Google (noindex)</p>
          <p className="text-xs text-muted-foreground">Use while drafting or for thin variants.</p>
        </div>
        <Switch
          checked={Boolean((draft.seo as Record<string, unknown>)?.noindex)}
          onCheckedChange={(checked) =>
            patchDraft({ seo: { ...(draft.seo as object), noindex: checked } })
          }
        />
      </div>
    </SectionCard>
    </>
  )

  const renderUrlSlugCard = () => (
    <SectionCard
      title="Public URL slug"
      description={`Record key in CMS JSON → ${meta.pathPrefix || 'top-level'}/{slug}`}
    >
      <div className="space-y-2">
        <Label>URL slug</Label>
        <Input
          value={draftSlug}
          onChange={(e) => patchDraft({ slug: normalizeSeoLandingSlug(e.target.value) })}
          className="font-mono text-sm"
          placeholder={meta.exampleSlug}
          disabled={!canMutate}
        />
        <FieldHint>
          Live path:{' '}
          <code className="text-foreground">{publicUrl || '—'}</code>
          {slugPendingRename ? (
            <span className="text-amber-600 dark:text-amber-400">
              {' '}
              — save to apply rename (set up a 301 redirect from the old URL in production).
            </span>
          ) : null}
        </FieldHint>
        {draftSlug && !isValidSeoLandingSlug(draftSlug) ? (
          <p className="text-xs text-destructive">Use lowercase letters, numbers, and hyphens (2–120 chars).</p>
        ) : null}
      </div>
    </SectionCard>
  )

  const renderSetupTab = () => {
    if (kind === 'locations') {
      return (
        <div className="space-y-4">
          <SectionCard
            title="Area from catalog"
            description="URL slug must match a row in Service areas — prevents broken /areas/ links."
          >
            <SeoCuratedSingleSelect
              label="Service area"
              value={draftSlug}
              onChange={applyLocationFromCatalog}
              options={localityCuratedOptions}
              loading={localitiesLoading}
              placeholder="Pick area"
              disabled={!canMutate}
              invalidHint="This slug is not in Service areas — pick a catalog area to fix the URL."
            />
            <FieldHint>
              Public URL: <code className="text-foreground">{publicUrl || '—'}</code>
              {slugPendingRename ? (
                <span className="text-amber-600 dark:text-amber-400"> — save to apply slug change.</span>
              ) : null}
            </FieldHint>
          </SectionCard>
          <SectionCard title="Area identity" description="Display fields — name and city sync from the catalog picker.">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Display name</Label>
                <Input
                  value={String(draft.name ?? '')}
                  readOnly
                  className="bg-muted/40"
                  placeholder="Pick an area above"
                />
              </div>
              <SeoCuratedSingleSelect
                label="City / metro"
                value={String(draft.city ?? 'Mumbai')}
                onChange={(v) => patchDraft({ city: v })}
                options={[...SEO_AREA_CITY_OPTIONS]}
                disabled={!canMutate}
              />
            </div>
            <div className="space-y-2">
              <Label>Hero subtitle</Label>
              <Textarea rows={2} value={String(draft.subtitle ?? '')} onChange={(e) => patchDraft({ subtitle: e.target.value })} />
            </div>
            <SeoCuratedMultiSelect
              label="Neighbour areas"
              description="Internal links to nearby area hubs — catalog slugs only."
              value={Array.isArray(draft.neighbours) ? draft.neighbours.map(String) : []}
              onChange={(neighbours) => patchDraft({ neighbours })}
              options={neighbourOptions}
              loading={localitiesLoading}
              disabled={!canMutate}
              maxItems={8}
              emptyHint="Add neighbouring service areas from the dropdown."
            />
          </SectionCard>
          <SectionCard title="Trust stats" description="Shown on the area hub — keep numbers realistic.">
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label>Providers</Label>
                <Input
                  type="number"
                  value={String((draft.stats as Record<string, unknown>)?.providers ?? '')}
                  onChange={(e) =>
                    patchDraft({ stats: { ...((draft.stats as object) ?? {}), providers: Number(e.target.value) } })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Jobs done</Label>
                <Input
                  type="number"
                  value={String((draft.stats as Record<string, unknown>)?.jobsCompleted ?? '')}
                  onChange={(e) =>
                    patchDraft({ stats: { ...((draft.stats as object) ?? {}), jobsCompleted: Number(e.target.value) } })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Avg rating</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={String((draft.stats as Record<string, unknown>)?.avgRating ?? '')}
                  onChange={(e) =>
                    patchDraft({ stats: { ...((draft.stats as object) ?? {}), avgRating: Number(e.target.value) } })
                  }
                />
              </div>
            </div>
          </SectionCard>
        </div>
      )
    }

    if (kind === 'providers') {
      return (
        <div className="space-y-4">
          {renderUrlSlugCard()}
          <SectionCard title="Provider profile" description="Public URL: /provider/{slug}">
          <div className="space-y-2">
            <Label>Name</Label>
            <Input value={String(draft.name ?? '')} onChange={(e) => patchDraft({ name: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Bio</Label>
            <Textarea rows={4} value={String(draft.bio ?? '')} onChange={(e) => patchDraft({ bio: e.target.value })} />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <SeoCuratedMultiSelect
              label="Services offered"
              description="Category slugs from the service catalog."
              value={Array.isArray(draft.servicesOffered) ? draft.servicesOffered.map(String) : []}
              onChange={(servicesOffered) => patchDraft({ servicesOffered })}
              options={catalogCuratedOptions}
              loading={catalogOptionsLoading}
              disabled={!canMutate}
              maxItems={6}
            />
            <SeoCuratedMultiSelect
              label="Areas served"
              description="Locality slugs from Service areas."
              value={Array.isArray(draft.areasServed) ? draft.areasServed.map(String) : []}
              onChange={(areasServed) => patchDraft({ areasServed })}
              options={localityCuratedOptions}
              loading={localitiesLoading}
              disabled={!canMutate}
              maxItems={8}
            />
          </div>
        </SectionCard>
        </div>
      )
    }

    return (
      <div className="space-y-4">
        {renderUrlSlugCard()}
        <SectionCard title="Page headline" description="Becomes H1 and default meta title when SEO title is empty.">
          <div className="space-y-2">
            <Label>Title</Label>
            <Input value={String(draft.title ?? '')} onChange={(e) => patchDraft({ title: e.target.value })} />
            <SeoContentLengthHint
              warning={evaluateLength(
                'page-title',
                'Page title',
                String(draft.title ?? ''),
                SEO_LANDING_LENGTH_RULES.pageTitle,
              )}
              compact
            />
          </div>
          {(kind === 'problems' || kind === 'cost-guides' || kind === 'guides') && (
            <div className="space-y-2">
              <Label>Subtitle (under H1)</Label>
              <Input
                value={String(draft.subtitle ?? '')}
                onChange={(e) => patchDraft({ subtitle: e.target.value })}
                placeholder="Common causes, fixes & what it costs"
              />
              {String(draft.subtitle ?? '').trim() ? (
                <SeoContentLengthHint
                  warning={evaluateLength(
                    'subtitle',
                    'Subtitle',
                    String(draft.subtitle ?? ''),
                    SEO_LANDING_LENGTH_RULES.subtitle,
                  )}
                  compact
                />
              ) : null}
            </div>
          )}
          {kind === 'landing-pages' && (
            <div className="space-y-2">
              <Label>Location display name</Label>
              <Input value={localityName} readOnly className="bg-muted/40" placeholder="Pick service area above" />
              <FieldHint>Synced from Service areas catalog. Change the area picker to update.</FieldHint>
            </div>
          )}
          {kind === 'cost-guides' && (
            <SeoCuratedSingleSelect
              label="Price guide year"
              value={String(draft.year ?? new Date().getFullYear())}
              onChange={(v) => patchDraft({ year: Number(v) })}
              options={yearOptions}
              disabled={!canMutate}
            />
          )}
        </SectionCard>
        {categoryLocationBlock}
      </div>
    )
  }

  const renderContentTab = () => (
    <div className="space-y-4">
      {kind !== 'providers' && (
        <SectionCard
          title="AI Overview & summary"
          description="Quick answer is required (40+ chars) before Google will index the page."
        >
          <SeoCompactRichTextField
            label="Quick answer"
            value={String(draft.quickAnswer ?? '')}
            onChange={(html) => patchDraft({ quickAnswer: html })}
            disabled={!canMutate}
            placeholder="Direct answer for AI Overviews — 40+ characters of plain text minimum."
            helperText={`${stripHtmlPlain(String(draft.quickAnswer ?? '')).length}/40 characters minimum (HTML tags excluded). Use image or ☁ for diagrams/photos.`}
            height={160}
            showCharCount
            enableImages
          />
          <SeoContentLengthHint
            warning={evaluateLength(
              'quick-answer',
              'Quick answer',
              String(draft.quickAnswer ?? ''),
              SEO_LANDING_LENGTH_RULES.quickAnswer,
            )}
          />
          {kind !== 'locations' && (
            <SeoLandingKeyTakeawaysEditor
              takeaways={draft.keyTakeaways}
              onChange={(keyTakeaways) => patchDraft({ keyTakeaways })}
              disabled={!canMutate}
            />
          )}
        </SectionCard>
      )}

      {kind === 'providers' ? (
        <SectionCard title="FAQs" description="Optional Q&A on the provider profile.">
          <SeoLandingFaqEditor faqs={draft.faqs} onChange={(faqs) => patchDraft({ faqs })} disabled={!canMutate} />
        </SectionCard>
      ) : (
        <SectionCard title="Page sections" description="Drag to reorder. Add rich text, FAQs, price tables, how-to steps, and more.">
          <SeoSectionsEditor
            sections={Array.isArray(draft.sections) ? (draft.sections as ContentSection[]) : []}
            onChange={(sections) => patchDraft({ sections })}
            disabled={!canMutate}
          />
          <FieldHint>
            Word count: <strong className="text-foreground">{wordCount}</strong> / {SEO_LANDING_MIN_WORDS} minimum
            {wordCount >= SEO_LANDING_OPTIMAL_WORDS
              ? ' (optimal band ✓)'
              : wordCount >= SEO_LANDING_MIN_WORDS
                ? ` — aim for ${SEO_LANDING_OPTIMAL_WORDS}+ words`
                : ' — thin pages stay draft (noindex)'}
          </FieldHint>
        </SectionCard>
      )}

      {kind !== 'providers' && (
        <SectionCard title="FAQs" description="Visible on-page and eligible for FAQ rich results when complete.">
          <SeoLandingFaqEditor faqs={draft.faqs} onChange={(faqs) => patchDraft({ faqs })} disabled={!canMutate} />
        </SectionCard>
      )}

      {(kind === 'problems' || kind === 'cost-guides' || kind === 'guides' || kind === 'landing-pages') && (
        <SectionCard
          title={
            kind === 'cost-guides' ? 'Charge table' : kind === 'landing-pages' ? 'Price table' : 'Price guide'
          }
          description={
            kind === 'cost-guides'
              ? 'Primary pricing block for /charges pages — this is what visitors see as the main price list.'
              : kind === 'landing-pages'
                ? 'Optional top-level prices for flat local money pages. Use this OR a “Price table” block inside Page sections — not both.'
                : kind === 'problems'
                  ? 'Typical repair charges for this category. Saved as a Price table block in Page sections on the live site.'
                  : 'Industry service charges for this guide. Saved as a Price table block in Page sections on the live site.'
          }
        >
          {usesTopLevelPriceTable(kind) && sectionsHaveInlinePriceTable ? (
            <div className="rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-foreground">
              You already added a <strong>Price table</strong> block under Page sections. The live site will show
              that inline table and <strong>ignore</strong> this standalone list — clear one or the other to avoid
              confusion.
            </div>
          ) : null}
          <SeoPlatformCatalogPriceImportBar
            serviceSlug={serviceSlug}
            categoryLabelMap={catalogLabelMap}
            canMutate={canMutate}
            loading={priceGuideImporting}
            onImport={(mode) => void importPriceGuideFromCatalog(mode)}
          />
          <SeoLandingPriceTableEditor
            rows={priceTableRows}
            caption={kind === 'landing-pages' ? String(draft.priceTableCaption ?? '') : undefined}
            onChange={(rows) => patchDraft(buildPriceTablePatch(kind, draft, rows))}
            onCaptionChange={kind === 'landing-pages' ? (caption) => patchDraft({ priceTableCaption: caption }) : undefined}
            disabled={!canMutate}
          />
          {kind === 'cost-guides' ? (
            <FieldHint>
              Year in Setup tab is appended to the caption on-site (e.g. “AC charges (2026)”).
            </FieldHint>
          ) : kind === 'problems' || kind === 'guides' ? (
            <FieldHint>
              Rows sync to the <strong>Price table</strong> section below — add one manually under Page sections if
              you prefer a custom heading order.
            </FieldHint>
          ) : null}
        </SectionCard>
      )}
    </div>
  )

  const renderLinksTab = () => (
    <SectionCard
      title="Internal links"
      description="Editorial links shown first in the Related links block on the live site. Aim for 3+ contextual paths."
    >
      <SeoLandingInternalLinksEditor
        links={draft.relatedLinks}
        minRecommended={SEO_LANDING_MIN_INTERNAL_LINKS}
        onChange={(relatedLinks) => patchDraft({ relatedLinks })}
        onSuggest={() => {
          const suggested = suggestSeoLandingInternalLinks(kind, draft, catalogLabelMap)
          patchDraft({
            relatedLinks: mergeSuggestedInternalLinks(draft.relatedLinks, suggested),
          })
        }}
        disabled={!canMutate}
      />
    </SectionCard>
  )

  return (
    <div className="flex min-h-0 flex-col p-4 sm:p-6 md:p-8">
      <PageHeader
        title="SEO landing pages"
        subtitle="Programmatic content for problems, charges, guides, areas, providers & local money pages — synced to profixer.in via CMS blobs."
        action={
          <Button onClick={handleSave} disabled={saving || !canMutate || loading}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save {meta.shortLabel}
          </Button>
        }
      />

      {/* Page type picker */}
      <div className="mt-6 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {SEO_LANDING_KINDS.map((k) => {
          const Icon = k.icon
          const active = kind === k.id
          return (
            <button
              key={k.id}
              type="button"
              onClick={() => setKind(k.id)}
              className={cn(
                'rounded-xl border p-4 text-left transition hover:border-primary/40 hover:bg-muted/40',
                active ? 'border-primary bg-primary/5 ring-1 ring-primary/20' : 'border-border bg-card',
              )}
            >
              <div className="flex items-start gap-3">
                <div
                  className={cn(
                    'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg',
                    active ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground',
                  )}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0 space-y-1">
                  <p className="font-semibold text-foreground">{k.label}</p>
                  <p className="font-mono text-xs text-muted-foreground">{k.pathPrefix || '/{slug}'}</p>
                  <p className="line-clamp-2 text-xs text-muted-foreground">{k.intent}</p>
                </div>
              </div>
            </button>
          )
        })}
      </div>

      {/* Kind context banner */}
      <Card className="mt-4 border-primary/15 bg-primary-soft/30 dark:bg-primary/10">
        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-foreground">{meta.description}</p>
            <p className="text-xs text-muted-foreground">
              Example:{' '}
              <a
                href={meta.exampleUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-primary underline-offset-2 hover:underline"
              >
                {meta.exampleUrl.replace('https://www.profixer.in', '')}
              </a>
            </p>
          </div>
          <Badge variant={slugs.length > 0 ? 'success' : 'secondary'}>
            {listFilterActive ? `${filteredSlugs.length} of ${slugs.length}` : slugs.length} page
            {(listFilterActive ? filteredSlugs.length : slugs.length) === 1 ? '' : 's'}
          </Badge>
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex min-h-[360px] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-[minmax(220px,260px)_1fr_minmax(260px,300px)]">
          {/* Sidebar */}
          <Card className="h-fit lg:sticky lg:top-4">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Pages</CardTitle>
              <CardDescription className="text-xs">URL slug = record key in CMS JSON</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 pt-0">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search slug, title or category…"
                  value={pageSearch}
                  onChange={(e) => setPageSearch(e.target.value)}
                  className="pl-8 text-sm"
                />
              </div>
              {seoLandingKindHasCategoryFilter(kind) && sidebarCategoryFilterOptions.length > 0 ? (
                <Select
                  value={categoryFilter || '__all__'}
                  onValueChange={(v) => setCategoryFilter(v === '__all__' ? '' : v)}
                  disabled={catalogOptionsLoading}
                >
                  <SelectTrigger className="text-sm">
                    <SelectValue placeholder="Filter by service category…" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">All service categories</SelectItem>
                    {sidebarCategoryFilterOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        <span>{opt.label}</span>
                        <span className="ml-2 font-mono text-xs text-muted-foreground">({opt.hint})</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : null}
              {listFilterActive ? (
                <p className="text-xs text-muted-foreground">
                  Showing {filteredSlugs.length} of {slugs.length} pages
                  {categoryFilter ? (
                    <>
                      {' '}
                      in{' '}
                      <strong className="text-foreground">
                        {categoryFilter === '__uncategorized__'
                          ? 'Uncategorized'
                          : catalogLabelMap[normalizeSeoCategorySlug(categoryFilter)] ?? categoryFilter}
                      </strong>
                    </>
                  ) : null}
                </p>
              ) : null}
              <ul className="max-h-[min(420px,50vh)] space-y-1 overflow-y-auto">
                {filteredSlugs.length === 0 ? (
                  <li className="rounded-md px-2 py-6 text-center text-sm text-muted-foreground">
                    {slugs.length === 0 ? 'No pages — create a slug below.' : 'No matches.'}
                  </li>
                ) : (
                  filteredSlugs.map((s) => {
                    const row = records[s]
                    const title = pageListTitle(kind, row ?? {})
                    const active = selectedSlug === s
                    const status = quickSeoLandingPageStatus(kind, row ?? {})
                    const pageCategories = getSeoPageCategorySlugs(kind, row ?? {})
                    const categoryLine = pageCategories
                      .map((c) => catalogLabelMap[c] ?? c)
                      .join(' · ')
                    const statusDot =
                      status === 'success'
                        ? 'bg-emerald-500'
                        : status === 'info'
                          ? 'bg-primary'
                          : status === 'warning'
                            ? 'bg-amber-500'
                            : 'bg-muted-foreground/40'
                    return (
                      <li key={s}>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedSlug(s)
                            setEditorTab('setup')
                          }}
                          className={cn(
                            'w-full rounded-lg border px-2.5 py-2 text-left transition',
                            active
                              ? 'border-primary/40 bg-primary/10'
                              : 'border-transparent hover:border-border hover:bg-muted/50',
                          )}
                        >
                          <div className="flex items-start gap-2">
                            <span
                              className={cn('mt-1.5 h-2 w-2 shrink-0 rounded-full', statusDot)}
                              title={`Status: ${buildSeoLandingQualityReport(kind, row ?? {}).statusLabel}`}
                            />
                            <div className="min-w-0 flex-1">
                              <p className="truncate font-mono text-xs text-foreground">{s}</p>
                              {title ? (
                                <p className="truncate text-xs text-muted-foreground">{title}</p>
                              ) : (
                                <p className="text-xs italic text-muted-foreground">No title yet</p>
                              )}
                              {categoryLine ? (
                                <p className="truncate text-[11px] text-primary/80">{categoryLine}</p>
                              ) : seoLandingKindHasCategoryFilter(kind) ? (
                                <p className="text-[11px] italic text-muted-foreground/70">No category</p>
                              ) : null}
                            </div>
                          </div>
                        </button>
                      </li>
                    )
                  })
                )}
              </ul>
              <div className="flex gap-2 border-t border-border pt-3">
                {kind === 'locations' ? (
                  <Select
                    value={newSlug || undefined}
                    onValueChange={setNewSlug}
                    disabled={localitiesLoading || !canMutate}
                  >
                    <SelectTrigger className="flex-1 text-sm">
                      <SelectValue placeholder="Pick area to add…" />
                    </SelectTrigger>
                    <SelectContent>
                      {localityCuratedOptions
                        .filter((o) => !records[o.value])
                        .map((o) => (
                          <SelectItem key={o.value} value={o.value}>
                            {o.label}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    placeholder="new-page-slug"
                    value={newSlug}
                    onChange={(e) => setNewSlug(normalizeSeoLandingSlug(e.target.value))}
                    className="text-sm font-mono"
                    onKeyDown={(e) => e.key === 'Enter' && addSlug()}
                  />
                )}
                <Button type="button" size="icon" variant="outline" onClick={addSlug} title="Add page" disabled={!canMutate}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Editor */}
          <div className="min-w-0 space-y-4">
            {!selectedSlug ? (
              <Card className="min-h-[280px]">
                <CardContent className="flex flex-col items-center justify-center gap-2 py-16 text-center">
                  <FileSearch className="h-10 w-10 text-muted-foreground/60" />
                  <p className="text-sm font-medium">Select or create a page</p>
                  <p className="max-w-sm text-xs text-muted-foreground">
                    Pick a slug from the left, or type a new one (e.g. <code>{meta.exampleSlug}</code>).
                  </p>
                </CardContent>
              </Card>
            ) : (
              <>
                <Card>
                  <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="truncate font-mono text-lg font-semibold">{selectedSlug}</h2>
                        {listTitle ? (
                          <Badge variant="outline" className="max-w-[200px] truncate font-normal">
                            {listTitle}
                          </Badge>
                        ) : null}
                      </div>
                      <a
                        href={`https://www.profixer.in${publicUrl}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 font-mono text-sm text-primary hover:underline"
                      >
                        {publicUrl}
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                      <div className="flex flex-wrap gap-1.5">
                        <Badge variant={qualityReport.statusVariant}>{qualityReport.statusLabel}</Badge>
                        <Badge variant="outline">{qualityReport.score}% health</Badge>
                        {lengthIssueCount > 0 ? (
                          <Badge variant="warning">{lengthIssueCount} length issue{lengthIssueCount === 1 ? '' : 's'}</Badge>
                        ) : null}
                        <Badge variant={readyToIndex ? 'success' : 'secondary'}>
                          {readyToIndex ? 'Ready to index' : 'Draft / gated'}
                        </Badge>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="shrink-0 text-destructive hover:text-destructive"
                      onClick={removeSlug}
                      disabled={!canMutate}
                    >
                      <Trash2 className="mr-1 h-4 w-4" />
                      Delete
                    </Button>
                  </CardContent>
                </Card>

                <div className="xl:hidden">
                  <SeoLandingPageHealthPanel
                    report={qualityReport}
                    lengthWarnings={lengthWarnings}
                    onNavigateTab={setEditorTab}
                  />
                </div>

                <Tabs value={editorTab} onValueChange={(v) => setEditorTab(v as EditorTab)}>
                  <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 sm:w-auto sm:inline-flex">
                    {(
                      [
                        ['setup', 'Setup'],
                        ['content', 'Content'],
                        ['links', 'Internal links'],
                        ['seo', 'SEO & publish'],
                      ] as const
                    ).map(([value, label]) => (
                      <TabsTrigger key={value} value={value} className="relative gap-1.5">
                        {label}
                        {tabNeedsAttention(value) ? (
                          <span className="h-1.5 w-1.5 rounded-full bg-amber-500" aria-label="Required items open" />
                        ) : null}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                  <TabsContent value="setup" className="mt-4 space-y-4">
                    {renderSetupTab()}
                  </TabsContent>
                  <TabsContent value="content" className="mt-4 space-y-4">
                    {renderContentTab()}
                  </TabsContent>
                  <TabsContent value="links" className="mt-4 space-y-4">
                    {renderLinksTab()}
                  </TabsContent>
                  <TabsContent value="seo" className="mt-4 space-y-4">
                    {seoBlock}
                  </TabsContent>
                </Tabs>

                <div className="sticky bottom-0 z-10 flex justify-end border-t border-border bg-background/95 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/80">
                  <Button onClick={handleSave} disabled={saving || !canMutate}>
                    {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Save changes
                  </Button>
                </div>
              </>
            )}
          </div>

          {selectedSlug ? (
            <SeoLandingPageHealthPanel
              report={qualityReport}
              lengthWarnings={lengthWarnings}
              onNavigateTab={setEditorTab}
              className="hidden xl:block xl:sticky xl:top-4 xl:max-h-[calc(100vh-2rem)] xl:overflow-y-auto"
            />
          ) : null}
        </div>
      )}
    </div>
  )
}
