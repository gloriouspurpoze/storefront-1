import React, { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Loader2, ChevronDown, Trash2, Plus, Megaphone, Image as ImageIconLucide } from 'lucide-react'
import { Button } from '../../components/ui/button'
import { Card, CardContent } from '../../components/ui/card'
import { Checkbox } from '../../components/ui/checkbox'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { Textarea } from '../../components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs'
import { Switch } from '../../components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '../../components/ui/accordion'
import { cn } from '../../lib/utils'
import { CMSService } from '../../services/api'
import { PageHeader } from '../../components/common/PageHeader'
import ImageUploadField from '../../components/forms/ImageUploadField'
import type { ImageFile } from '../../components/forms/ImageUploadField'
import { CMS_DEFAULT_FALLBACK_SLUG } from '../../constants/cmsCatalogCategories'
import { useCmsCatalogCategories } from '../../hooks/useCmsCatalogCategories'
import {
  META_DESC_HARD_MAX_CHARS,
  META_DESC_MIN_CHARS,
  META_DESC_OPTIMAL_MAX_CHARS,
  SEO_TITLE_HARD_MAX_CHARS,
  SEO_TITLE_MIN_CHARS,
  SEO_TITLE_OPTIMAL_MAX_CHARS,
} from '../../components/blog/blog-seo-guidelines'
import {
  type CategoryMarketingConfig,
  type LocalityGuideCmsFields,
  type LocalityGuideSectionBlock,
  type LocalSeoCmsFields,
  type RelatedLinkBlock,
  type TechnicalSeoCmsFields,
  type ServiceTypeBlock,
  emptyCategoryMarketingConfig,
  emptyLocalityGuideSection,
  emptyBookingStep,
  emptyComparisonRow,
  emptyFaq,
  emptyRelatedLink,
  emptyServiceCard,
  emptyServiceTypeBlock,
  emptySparePart,
  emptyTrustBenefit,
  mergeCategoryConfig,
  normalizeCategoryMarketingRecord,
} from '../../types/categoryMarketing'
import { appToast } from '../../lib/appToast'
import { useIndustryServicePagesCatalog } from './IndustryServicePagesContext'
import { useServiceCatalogLocalities } from '../../hooks/useServiceCatalogLocalities'

type TabKey =
  | 'metadata'
  | 'localSeo'
  | 'hero'
  | 'cards'
  | 'detailed'
  | 'trust'
  | 'areas'
  | 'pricing'
  | 'faqs'
  | 'localityGuide'
  | 'closing'

function charCountColor(len: number, min: number, optimal: number, hard: number): string {
  if (len > hard) return 'text-destructive'
  if (len > optimal) return 'text-amber-600'
  if (len >= min) return 'text-emerald-600'
  return 'text-muted-foreground'
}

export default function CategoryMarketingManagement() {
  const industryHub = useIndustryServicePagesCatalog()
  const { options: catalogOptions, loading: catalogOptionsLoading, defaultSlug } = useCmsCatalogCategories()
  const {
    rows: managedLocalities,
    loading: managedLocalitiesLoading,
    error: managedLocalitiesError,
  } = useServiceCatalogLocalities()
  const [standaloneCategory, setStandaloneCategory] = useState<string>('')
  const selectedCategory: string =
    industryHub?.catalogKey ?? (standaloneCategory || defaultSlug) ?? CMS_DEFAULT_FALLBACK_SLUG
  const setSelectedCategory = (v: string) => {
    if (industryHub) industryHub.setCatalogKey(v)
    else setStandaloneCategory(v)
  }

  const [data, setData] = useState<Record<string, CategoryMarketingConfig>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  /** URL locality slug for composite CMS keys, e.g. `mira-road` + industry `electric` → `electric__mira-road` (`__` = delimiter). */
  const [localitySlugForKey, setLocalitySlugForKey] = useState('')
  /** True after user chooses “Custom slug” while the field is still empty (avoid Select snapping back to “Industry-wide”). */
  const [emptyCustomSlugMode, setEmptyCustomSlugMode] = useState(false)
  const [duplicateSourceKey, setDuplicateSourceKey] = useState('')
  const [importJsonText, setImportJsonText] = useState('')
  const [tab, setTab] = useState<TabKey>('metadata')

  const effectiveKey = useMemo(() => {
    const loc = localitySlugForKey.trim().toLowerCase().replace(/[^a-z0-9-]+/g, '-')
    if (!loc) return selectedCategory
    return `${selectedCategory}__${loc}`
  }, [selectedCategory, localitySlugForKey])

  const sortedManagedLocalities = useMemo(
    () =>
      [...managedLocalities].sort(
        (a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }),
      ),
    [managedLocalities],
  )

  const localitySelectValue = useMemo(() => {
    const raw = localitySlugForKey.trim().toLowerCase().replace(/[^a-z0-9-]+/g, '-')
    if (!raw) return emptyCustomSlugMode ? '__custom__' : '__none__'
    if (sortedManagedLocalities.some((l) => l.slug === raw)) return raw
    return '__custom__'
  }, [localitySlugForKey, sortedManagedLocalities, emptyCustomSlugMode])

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const result = await CMSService.getCategoryMarketing()
      const raw = typeof result === 'object' && result !== null ? result : {}
      setData(normalizeCategoryMarketingRecord(raw as Record<string, unknown>))
    } catch (error: unknown) {
      console.error('Error fetching category marketing:', error)
      const msg =
        error && typeof error === 'object' && 'response' in error
          ? (error as { response?: { data?: { error?: string } } }).response?.data?.error
          : undefined
      const fallback = error instanceof Error ? error.message : 'Failed to load'
      appToast('Error: ' + (msg || fallback), 'error')
      setData({})
    } finally {
      setLoading(false)
    }
  }

  const config = data[effectiveKey] ?? emptyCategoryMarketingConfig()

  const updateConfig = (updates: Partial<CategoryMarketingConfig>) => {
    setData((prev) => {
      const base = prev[effectiveKey] ?? emptyCategoryMarketingConfig()
      const next: CategoryMarketingConfig = {
        ...base,
        ...updates,
        leadMagnet: updates.leadMagnet
          ? { ...base.leadMagnet, ...updates.leadMagnet }
          : base.leadMagnet,
        localityGuide: updates.localityGuide
          ? { ...base.localityGuide, ...updates.localityGuide }
          : base.localityGuide,
        localSeo: updates.localSeo ? { ...base.localSeo, ...updates.localSeo } : base.localSeo,
        technicalSeo: updates.technicalSeo
          ? {
              ...base.technicalSeo,
              ...updates.technicalSeo,
              aggregateRating: updates.technicalSeo.aggregateRating
                ? { ...base.technicalSeo.aggregateRating, ...updates.technicalSeo.aggregateRating }
                : base.technicalSeo.aggregateRating,
            }
          : base.technicalSeo,
      }
      return { ...prev, [effectiveKey]: next }
    })
  }

  const updateLocalityGuide = (updates: Partial<LocalityGuideCmsFields>) => {
    updateConfig({ localityGuide: { ...config.localityGuide, ...updates } })
  }

  const updateLocalSeo = (updates: Partial<LocalSeoCmsFields>) => {
    updateConfig({ localSeo: { ...config.localSeo, ...updates } })
  }

  const updateTechnicalSeo = (updates: Partial<TechnicalSeoCmsFields>) => {
    updateConfig({
      technicalSeo: {
        ...config.technicalSeo,
        ...updates,
        aggregateRating: updates.aggregateRating
          ? { ...config.technicalSeo.aggregateRating, ...updates.aggregateRating }
          : config.technicalSeo.aggregateRating,
      },
    })
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      const payload = { ...data, [effectiveKey]: config }
      await CMSService.updateCategoryMarketing(payload)
      appToast('Category marketing saved.', 'success')
      fetchData()
    } catch (error: unknown) {
      const msg =
        error && typeof error === 'object' && 'response' in error
          ? (error as { response?: { data?: { error?: string } } }).response?.data?.error
          : undefined
      appToast('Error: ' + (msg || 'Failed to save'), 'error')
    } finally {
      setSaving(false)
    }
  }

  const addServiceType = () => {
    updateConfig({
      serviceTypes: [...config.serviceTypes, emptyServiceTypeBlock()],
    })
  }

  const updateServiceType = (index: number, field: keyof ServiceTypeBlock, value: string | string[]) => {
    const next = [...config.serviceTypes]
    next[index] = { ...next[index], [field]: value as never }
    updateConfig({ serviceTypes: next })
  }

  const removeServiceType = (index: number) => {
    updateConfig({ serviceTypes: config.serviceTypes.filter((_, i) => i !== index) })
  }

  const updateBullet = (typeIndex: number, bulletIndex: number, value: string) => {
    const next = [...config.serviceTypes]
    const bullets = [...(next[typeIndex].bullets || [])]
    bullets[bulletIndex] = value
    next[typeIndex] = { ...next[typeIndex], bullets }
    updateConfig({ serviceTypes: next })
  }

  const addBullet = (typeIndex: number) => {
    const next = [...config.serviceTypes]
    next[typeIndex] = {
      ...next[typeIndex],
      bullets: [...(next[typeIndex].bullets || []), ''],
    }
    updateConfig({ serviceTypes: next })
  }

  const removeBullet = (typeIndex: number, bulletIndex: number) => {
    const next = [...config.serviceTypes]
    next[typeIndex] = {
      ...next[typeIndex],
      bullets: next[typeIndex].bullets.filter((_, i) => i !== bulletIndex),
    }
    updateConfig({ serviceTypes: next })
  }

  const updateStringList = (key: keyof CategoryMarketingConfig, index: number, value: string) => {
    const arr = [...(config[key] as string[])]
    arr[index] = value
    updateConfig({ [key]: arr } as Partial<CategoryMarketingConfig>)
  }

  const removeStringListItem = (key: keyof CategoryMarketingConfig, index: number) => {
    const arr = (config[key] as string[]).filter((_, j) => j !== index)
    updateConfig({ [key]: arr } as Partial<CategoryMarketingConfig>)
  }

  const addStringListItem = (key: keyof CategoryMarketingConfig) => {
    const arr = [...(config[key] as string[]), '']
    updateConfig({ [key]: arr } as Partial<CategoryMarketingConfig>)
  }

  return (
    <div className="space-y-4 pb-8">
      {!industryHub && (
        <PageHeader
          title="Industry service pages"
          subtitle="Industry landing CMS: meta through FAQs, schema toggles, and locality overrides. Tokens: [City], [Location], [ServiceName]. Composite keys: industry__locality slug."
          action={
            <Button
              variant="default"
              leftIcon={saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Megaphone className="h-4 w-4" />}
              onClick={handleSave}
              disabled={saving}
            >
              Save
            </Button>
          }
        />
      )}

      {industryHub ? (
        <div className="flex justify-end">
          <Button
            variant="default"
            size="sm"
            leftIcon={saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Megaphone className="h-4 w-4" />}
            onClick={handleSave}
            disabled={saving}
          >
            Save landing template
          </Button>
        </div>
      ) : null}

      <Card className="border-border/80 shadow-sm">
        <CardContent className="space-y-4 py-4">
          <div className="grid gap-4 md:grid-cols-12 md:items-end">
            {!industryHub ? (
              <div className="space-y-1.5 md:col-span-5">
                <Label htmlFor="catalog-category-select" className="text-xs font-medium text-muted-foreground">
                  Industry
                </Label>
                <Select
                  value={selectedCategory}
                  onValueChange={(v) => {
                    setSelectedCategory(v)
                    setLocalitySlugForKey('')
                    setEmptyCustomSlugMode(false)
                  }}
                  disabled={catalogOptionsLoading || catalogOptions.length === 0}
                >
                  <SelectTrigger id="catalog-category-select" className="h-9 w-full">
                    <SelectValue placeholder="Select industry" />
                  </SelectTrigger>
                  <SelectContent>
                    {catalogOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : null}
            <div className={cn('space-y-1.5', !industryHub ? 'md:col-span-4' : 'md:col-span-6')}>
              <Label htmlFor="cmm-locality-picker" className="text-xs font-medium text-muted-foreground">
                Locality (optional)
              </Label>
              <Select
                value={localitySelectValue}
                onValueChange={(v) => {
                  if (v === '__none__') {
                    setLocalitySlugForKey('')
                    setEmptyCustomSlugMode(false)
                  } else if (v === '__custom__') {
                    setEmptyCustomSlugMode(true)
                  } else {
                    setLocalitySlugForKey(v)
                    setEmptyCustomSlugMode(false)
                  }
                }}
                disabled={managedLocalitiesLoading}
              >
                <SelectTrigger id="cmm-locality-picker" className="h-9 w-full">
                  <SelectValue placeholder={managedLocalitiesLoading ? 'Loading areas…' : 'Pick a service area'} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Industry-wide (no locality)</SelectItem>
                  {sortedManagedLocalities.map((loc) => (
                    <SelectItem key={loc._id} value={loc.slug}>
                      {`${loc.name} (${loc.slug})${!loc.isActive ? ' — inactive' : ''}`}
                    </SelectItem>
                  ))}
                  <SelectItem value="__custom__">Custom slug (advanced)…</SelectItem>
                </SelectContent>
              </Select>
              {localitySelectValue === '__custom__' ? (
                <Input
                  id="cmm-f-1-custom"
                  className="h-9 font-mono text-sm"
                  value={localitySlugForKey}
                  onChange={(e) => setLocalitySlugForKey(e.target.value)}
                  onBlur={() => {
                    setLocalitySlugForKey((s) =>
                      s
                        .trim()
                        .toLowerCase()
                        .replace(/[^a-z0-9-]+/g, '-')
                        .replace(/^-|-$/g, ''),
                    )
                    setEmptyCustomSlugMode(false)
                  }}
                  placeholder="legacy-or-imported-slug"
                  aria-label="Custom locality slug"
                />
              ) : null}
              {managedLocalitiesError ? (
                <p className="text-[11px] text-amber-700 dark:text-amber-400">
                  Could not load managed areas — use Custom slug or open{' '}
                  <Link to="/cms/category-marketing?tab=service-areas" className="underline">
                    Service areas
                  </Link>
                  .
                </p>
              ) : (
                <p className="text-[11px] leading-snug text-muted-foreground">
                  Manage the list under{' '}
                  <Link to="/cms/category-marketing?tab=service-areas" className="font-medium underline">
                    Service areas
                  </Link>
                  . Empty = industry-wide. With locality → CMS key{' '}
                  <span className="font-mono">{selectedCategory}__{'{slug}'}</span> (separator{' '}
                  <span className="font-mono">__</span>).
                </p>
              )}
            </div>
            <div className="flex flex-col justify-end md:col-span-3 md:text-right">
              <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">CMS key</span>
              <code className="mt-1 break-all rounded-md bg-muted px-2 py-1 text-left text-xs font-semibold md:text-right">
                {effectiveKey}
              </code>
            </div>
          </div>
        </CardContent>
      </Card>

      <Accordion type="single" collapsible className="rounded-lg border border-border/80 bg-card px-1 shadow-sm">
        <AccordionItem value="clone-import" className="border-0">
          <AccordionTrigger className="px-3 py-3 text-sm font-semibold hover:no-underline">
            Clone from another key · JSON import
          </AccordionTrigger>
          <AccordionContent className="space-y-4 px-3 pb-4">
            <p className="text-sm text-muted-foreground">
              Duplicate into <strong className="text-foreground">{effectiveKey}</strong> (staged until Save). Typical flow:
              industry template → add locality slug → merge locality or local SEO only.
            </p>
            {Object.keys(data).filter((k) => k !== effectiveKey).length === 0 ? (
              <div
                role="alert"
                className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950 dark:border-amber-900 dark:bg-amber-950/30"
              >
                No other keys loaded yet — save a template once, or use JSON import below.
              </div>
            ) : null}
            <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-end">
              <div className="min-w-[200px] flex-1 space-y-1.5">
                <Label htmlFor="duplicate-source-select" className="text-xs text-muted-foreground">
                  Source key
                </Label>
                <Select
                  value={duplicateSourceKey || '__empty__'}
                  onValueChange={(v) => setDuplicateSourceKey(v === '__empty__' ? '' : v)}
                >
                  <SelectTrigger id="duplicate-source-select" className="h-9 w-full lg:max-w-xs">
                    <SelectValue placeholder="Select a key…" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__empty__">Select a key…</SelectItem>
                    {Object.keys(data)
                      .sort((a, b) => a.localeCompare(b))
                      .filter((k) => k !== effectiveKey)
                      .map((k) => (
                        <SelectItem key={k} value={k}>
                          {k}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!duplicateSourceKey || !data[duplicateSourceKey]}
                  onClick={() => {
                    const src = data[duplicateSourceKey]
                    if (!src) return
                    const full = mergeCategoryConfig(src)
                    setData((prev) => ({
                      ...prev,
                      [effectiveKey]: JSON.parse(JSON.stringify(full)) as CategoryMarketingConfig,
                    }))
                    appToast(
                      `Replaced "${effectiveKey}" with a full copy from "${duplicateSourceKey}". Click Save to persist.`,
                      'success',
                    )
                  }}
                >
                  Full replace
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={!duplicateSourceKey || !data[duplicateSourceKey]}
                  onClick={() => {
                    const src = data[duplicateSourceKey]
                    if (!src) return
                    const full = mergeCategoryConfig(src)
                    updateConfig({
                      localityGuide: JSON.parse(JSON.stringify(full.localityGuide)) as LocalityGuideCmsFields,
                    })
                    appToast(`Merged locality guide from "${duplicateSourceKey}". Save to persist.`, 'success')
                  }}
                >
                  Locality only
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={!duplicateSourceKey || !data[duplicateSourceKey]}
                  onClick={() => {
                    const src = data[duplicateSourceKey]
                    if (!src) return
                    const full = mergeCategoryConfig(src)
                    updateConfig({
                      localSeo: JSON.parse(JSON.stringify(full.localSeo)) as LocalSeoCmsFields,
                    })
                    appToast(`Merged local SEO from "${duplicateSourceKey}". Save to persist.`, 'success')
                  }}
                >
                  Local SEO only
                </Button>
              </div>
            </div>
            <div className="rounded-md border border-border/70 bg-muted/20 p-3">
              <Label className="text-xs text-muted-foreground">Import JSON (merge into current key)</Label>
              <p className="mt-1 text-xs text-muted-foreground">
                Partial or full object; merges nested <code className="text-[11px]">leadMagnet</code>,{' '}
                <code className="text-[11px]">localityGuide</code>, <code className="text-[11px]">localSeo</code>,{' '}
                <code className="text-[11px]">technicalSeo</code>.
              </p>
              <Textarea
                className="mt-2 w-full font-mono text-[13px]"
                rows={6}
                value={importJsonText}
                onChange={(e) => setImportJsonText(e.target.value)}
              />
              <div className="mt-2 flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="default"
                  onClick={() => {
                    try {
                      const parsed = JSON.parse(importJsonText) as Record<string, unknown>
                      const patch = mergeCategoryConfig(parsed)
                      setData((prev) => {
                        const base = mergeCategoryConfig(prev[effectiveKey] ?? emptyCategoryMarketingConfig())
                        const combined = mergeCategoryConfig({
                          ...base,
                          ...patch,
                          leadMagnet: { ...base.leadMagnet, ...patch.leadMagnet },
                          localityGuide: { ...base.localityGuide, ...patch.localityGuide },
                          localSeo: { ...base.localSeo, ...patch.localSeo },
                          technicalSeo: {
                            ...base.technicalSeo,
                            ...patch.technicalSeo,
                            aggregateRating: {
                              ...base.technicalSeo.aggregateRating,
                              ...patch.technicalSeo?.aggregateRating,
                            },
                          },
                        })
                        return { ...prev, [effectiveKey]: combined }
                      })
                      appToast(`Merged JSON into "${effectiveKey}". Save to persist.`, 'success')
                    } catch (e) {
                      appToast(e instanceof Error ? e.message : 'Invalid JSON', 'error')
                    }
                  }}
                >
                  Apply merge
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setImportJsonText('')}>
                  Clear
                </Button>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {loading ? (
        <div className="flex min-h-[280px] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <Tabs value={tab} onValueChange={(v) => setTab(v as TabKey)} className="w-full">
            <div className="overflow-x-auto rounded-lg border border-border/80 bg-muted/20">
              <TabsList className="mb-0 inline-flex h-auto min-h-9 w-max min-w-full justify-start gap-0.5 rounded-none border-0 bg-transparent p-1">
                <TabsTrigger value="metadata" className="shrink-0 rounded-md px-2.5 py-1.5 text-xs sm:text-sm">
                  Metadata &amp; SEO
                </TabsTrigger>
                <TabsTrigger value="localSeo" className="shrink-0 rounded-md px-2.5 py-1.5 text-xs sm:text-sm">
                  Local SEO
                </TabsTrigger>
                <TabsTrigger value="hero" className="shrink-0 rounded-md px-2.5 py-1.5 text-xs sm:text-sm">
                  Hero &amp; intro
                </TabsTrigger>
                <TabsTrigger value="cards" className="shrink-0 rounded-md px-2.5 py-1.5 text-xs sm:text-sm">
                  Service cards
                </TabsTrigger>
                <TabsTrigger value="detailed" className="shrink-0 rounded-md px-2.5 py-1.5 text-xs sm:text-sm">
                  Detailed options
                </TabsTrigger>
                <TabsTrigger value="trust" className="shrink-0 rounded-md px-2.5 py-1.5 text-xs sm:text-sm">
                  Trust
                </TabsTrigger>
                <TabsTrigger value="areas" className="shrink-0 rounded-md px-2.5 py-1.5 text-xs sm:text-sm">
                  Areas &amp; booking
                </TabsTrigger>
                <TabsTrigger value="pricing" className="shrink-0 rounded-md px-2.5 py-1.5 text-xs sm:text-sm">
                  Pricing
                </TabsTrigger>
                <TabsTrigger value="faqs" className="shrink-0 rounded-md px-2.5 py-1.5 text-xs sm:text-sm">
                  FAQs &amp; links
                </TabsTrigger>
                <TabsTrigger value="localityGuide" className="shrink-0 rounded-md px-2.5 py-1.5 text-xs sm:text-sm">
                  Locality guide
                </TabsTrigger>
                <TabsTrigger value="closing" className="shrink-0 rounded-md px-2.5 py-1.5 text-xs sm:text-sm">
                  Closing
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="metadata" className="mt-3 px-0 outline-none">
              <div className="flex flex-col gap-3">
                <div
                  role="alert"
                  className="rounded-md border border-blue-200/80 bg-blue-50/70 px-3 py-2 text-xs leading-relaxed dark:border-blue-900 dark:bg-blue-950/30 sm:text-sm"
                >
                  <span className="font-medium text-foreground">Editorial flow:</span> one H1 (Hero tab). H2 → sections, H3 →
                  subsections; no skipped levels. Primary keyword in H1, intro, and ≥2 headings. Use [City] / [Location] where
                  the site substitutes area.
                </div>
                <Card>
                  <CardContent>
                    <div className="flex flex-col gap-4">
                      <div className="space-y-2">
                      <Label htmlFor="cmm-f-3">SEO title</Label>
                      <Input id="cmm-f-3" className="w-full" value={config.seoTitle} onChange={(e) => updateConfig({ seoTitle: e.target.value })} maxLength={SEO_TITLE_HARD_MAX_CHARS + 10} placeholder="AC Repair Near Me [City] – Same-Day, Transparent Pricing" />
                    </div>
                      <p
                        className={cn(
                          'text-xs',
                          charCountColor(
                            config.seoTitle.length,
                            SEO_TITLE_MIN_CHARS,
                            SEO_TITLE_OPTIMAL_MAX_CHARS,
                            SEO_TITLE_HARD_MAX_CHARS,
                          ),
                        )}
                      >
                        {config.seoTitle.length} characters — target {SEO_TITLE_MIN_CHARS}–{SEO_TITLE_OPTIMAL_MAX_CHARS}{' '}
                        (hard max ~{SEO_TITLE_HARD_MAX_CHARS})
                      </p>
                      <div className="space-y-2">
                      <Label htmlFor="cmm-f-4">Meta description</Label>
                      <Textarea id="cmm-f-4" className="w-full" rows={3} value={config.metaDescription} onChange={(e) => updateConfig({ metaDescription: e.target.value })} maxLength={META_DESC_HARD_MAX_CHARS + 20} />
                    </div>
                      <p
                        className={cn(
                          'text-xs',
                          charCountColor(
                            config.metaDescription.length,
                            META_DESC_MIN_CHARS,
                            META_DESC_OPTIMAL_MAX_CHARS,
                            META_DESC_HARD_MAX_CHARS,
                          ),
                        )}
                      >
                        {config.metaDescription.length} characters — target {META_DESC_MIN_CHARS}–
                        {META_DESC_OPTIMAL_MAX_CHARS} (hard max {META_DESC_HARD_MAX_CHARS})
                      </p>
                      <div className="space-y-2">
                      <Label htmlFor="cmm-f-5">URL slug pattern</Label>
                      <Input id="cmm-f-5" className="w-full" value={config.urlSlugPattern} onChange={(e) => updateConfig({ urlSlugPattern: e.target.value })} placeholder="services/ac-repair-[city-slug]" />
                      <p className="text-xs text-muted-foreground">Pattern for the consumer site; actual routing may use params.</p>
                    </div>
                      <div className="space-y-2">
                      <Label htmlFor="cmm-f-6">Primary keyword</Label>
                      <Input id="cmm-f-6" className="w-full" value={config.primaryKeyword} onChange={(e) => updateConfig({ primaryKeyword: e.target.value })} />
                    </div>
                      <div className="space-y-2">
                      <Label htmlFor="cmm-f-7">Hero trust badge (pill beside H1)</Label>
                      <Input id="cmm-f-7" className="w-full" value={(config as any).heroTrustBadge ?? ''} onChange={(e) => updateConfig({ heroTrustBadge: e.target.value } as any)} placeholder="e.g. 30-day warranty · Verified pros" />
                      <p className="text-xs text-muted-foreground">Shows in the hero as a small trust pill. Supports [City], [Location], [ServiceName].</p>
                    </div>
                      <div className="space-y-2">
                      <Label htmlFor="cmm-f-8">Hero chip (highlight line)</Label>
                      <Input id="cmm-f-8" className="w-full" value={(config as any).heroChip ?? ''} onChange={(e) => updateConfig({ heroChip: e.target.value } as any)} placeholder="e.g. Same-day slots · Transparent pricing" />
                      <p className="text-xs text-muted-foreground">Short non-spam line under the hero intro. Supports [City], [Location], [ServiceName].</p>
                    </div>
                      <p className="text-sm text-muted-foreground">
                        Hero proof points (3 cards)
                      </p>
                      {(
                        (Array.isArray((config as any).heroProofPoints) ? (config as any).heroProofPoints : ['']) as string[]
                      ).map((line, i) => (
                        <div key={`hero-proof-${i}`} className="flex flex-row items-center gap-2">
                          <div className="space-y-2"><Input className="w-full h-9 text-sm" value={line} onChange={(e) => {
                              const base = Array.isArray((config as any).heroProofPoints)
                                ? ([...(config as any).heroProofPoints] as string[])
                                : ['']
                              const next = [...base]
                              next[i] = e.target.value
                              updateConfig({ heroProofPoints: next } as any)
                            }} placeholder="e.g. Background-verified technicians" />
                    </div>
                          <Button type="button" variant="ghost" size="icon" className="h-9 w-9 shrink-0 text-destructive hover:text-destructive" onClick={() => {
                              const base = Array.isArray((config as any).heroProofPoints)
                                ? ([...(config as any).heroProofPoints] as string[])
                                : ['']
                              updateConfig({ heroProofPoints: base.filter((_, j) => j !== i) } as any)
                            }} ><Trash2 className="h-4 w-4" /></Button>
                        </div>
                      ))}
                      <Button
                        size="sm"
                        leftIcon={<Plus className="h-4 w-4" />}
                        onClick={() =>
                          updateConfig({
                            heroProofPoints: [
                              ...(((config as any).heroProofPoints ?? []) as string[]),
                              '',
                            ],
                          } as any)
                        }
                      >
                        Add proof point
                      </Button>
                      <p className="text-xs text-muted-foreground">
                        If empty, consumer will derive proof points from Trust benefits / Ways / Secondary keywords.
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Topic chips (replaces static semantic labels)
                      </p>
                      {(
                        (Array.isArray((config as any).topicChips) ? (config as any).topicChips : ['']) as string[]
                      ).map((line, i) => (
                        <div key={`topic-chip-${i}`} className="flex flex-row items-center gap-2">
                          <div className="space-y-2"><Input className="w-full h-9 text-sm" value={line} onChange={(e) => {
                              const base = Array.isArray((config as any).topicChips)
                                ? ([...(config as any).topicChips] as string[])
                                : ['']
                              const next = [...base]
                              next[i] = e.target.value
                              updateConfig({ topicChips: next } as any)
                            }} placeholder="e.g. fan installation · switch repair" />
                    </div>
                          <Button type="button" variant="ghost" size="icon" className="h-9 w-9 shrink-0 text-destructive hover:text-destructive" onClick={() => {
                              const base = Array.isArray((config as any).topicChips)
                                ? ([...(config as any).topicChips] as string[])
                                : ['']
                              updateConfig({ topicChips: base.filter((_, j) => j !== i) } as any)
                            }} ><Trash2 className="h-4 w-4" /></Button>
                        </div>
                      ))}
                      <Button
                        size="sm"
                        leftIcon={<Plus className="h-4 w-4" />}
                        onClick={() =>
                          updateConfig({
                            topicChips: [
                              ...(((config as any).topicChips ?? []) as string[]),
                              '',
                            ],
                          } as any)
                        }
                      >
                        Add chip
                      </Button>
                      <p className="text-xs text-muted-foreground">
                        Consumer uses Topic chips first; if empty, it falls back to Secondary keywords.
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Secondary keywords
                      </p>
                      {(config.secondaryKeywords.length ? config.secondaryKeywords : ['']).map((kw, i) => (
                        <div key={i} className="flex flex-row items-center gap-2">
                          <div className="space-y-2"><Input className="w-full h-9 text-sm" value={kw} onChange={(e) => {
                              const base = config.secondaryKeywords.length ? config.secondaryKeywords : ['']
                              const next = [...base]
                              next[i] = e.target.value
                              updateConfig({ secondaryKeywords: next })
                            }} placeholder="e.g. gas filling, installation" />
                    </div>
                          <Button type="button" variant="ghost" size="icon" className="h-9 w-9 shrink-0 text-destructive hover:text-destructive" onClick={() =>
                              updateConfig({
                                secondaryKeywords: config.secondaryKeywords.filter((_, j) => j !== i),
                              })
                            } ><Trash2 className="h-4 w-4" /></Button>
                        </div>
                      ))}
                      <Button
                        size="sm"
                        leftIcon={<Plus className="h-4 w-4" />}
                        onClick={() => updateConfig({ secondaryKeywords: [...config.secondaryKeywords, ''] })}
                      >
                        Add keyword
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <div role="alert" className="rounded-md border border-blue-200 bg-blue-50/80 p-3 text-sm dark:border-blue-900 dark:bg-blue-950/30">
                  <strong>Technical SEO:</strong> the consumer app should map <code>technicalSeo</code> to{' '}
                  <code>rel=&quot;canonical&quot;</code>, Open Graph / Twitter meta, robots, hreflang{' '}
                  <code>&lt;link&gt;</code>s, and JSON-LD (WebPage, Service, HowTo, BreadcrumbList, Speakable, VideoObject
                  when enabled). Pair <strong>OG image alt</strong> with the absolute image under Local SEO → Social
                  preview.
                </div>

                <Card>
                  <CardContent>
                    <p className="mb-2 text-base font-semibold">
                      Canonical, Open Graph &amp; Twitter
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Overrides are optional: when empty, the live site should fall back to SEO title / meta description.
                      Use absolute URLs for canonical and share images.
                    </p>
                    <div className="flex flex-col gap-4">
                      <div className="space-y-2">
                      <Label htmlFor="cmm-f-12">Canonical URL</Label>
                      <Input id="cmm-f-12" className="w-full" value={config.technicalSeo.canonicalUrl} onChange={(e) => updateTechnicalSeo({ canonicalUrl: e.target.value })} placeholder="https://example.com/services/ac-repair/mumbai" />
                      <p className="text-xs text-muted-foreground">One preferred URL for this landing; reduces duplicate signals across params or UTM variants.</p>
                    </div>
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-2">
                        <div className="space-y-2">
                      <Label htmlFor="cmm-f-13">Open Graph title (override)</Label>
                      <Input id="cmm-f-13" className="w-full" value={config.technicalSeo.ogTitle} onChange={(e) => updateTechnicalSeo({ ogTitle: e.target.value })} placeholder="Same as SEO title if blank" />
                    </div>
                        <div className="space-y-2">
                      <Label htmlFor="cmm-f-14">Open Graph type</Label>
                      <Input id="cmm-f-14" className="w-full" value={config.technicalSeo.ogType} onChange={(e) => updateTechnicalSeo({ ogType: e.target.value })} placeholder="website" />
                      <p className="text-xs text-muted-foreground">Usually website or article.</p>
                    </div>
                      </div>
                      <div className="space-y-2">
                      <Label htmlFor="cmm-f-15">Open Graph description (override)</Label>
                      <Textarea id="cmm-f-15" className="w-full" rows={2} value={config.technicalSeo.ogDescription} onChange={(e) => updateTechnicalSeo({ ogDescription: e.target.value })} placeholder="Same as meta description if blank" />
                    </div>
                      <div className="space-y-2">
                      <Label htmlFor="cmm-f-16">OG / Twitter image alt text</Label>
                      <Input id="cmm-f-16" className="w-full" value={config.technicalSeo.ogImageAlt} onChange={(e) => updateTechnicalSeo({ ogImageAlt: e.target.value })} placeholder="Technician servicing an AC outdoor unit in Mumbai – ProFixer" />
                      <p className="text-xs text-muted-foreground">Accessibility and clearer social/AI context for the share image.</p>
                    </div>
                      <div className="w-full space-y-2 sm:max-w-md">
                        <Label htmlFor="twitter-card-select">Twitter card type</Label>
                        <Select
                          value={config.technicalSeo.twitterCard ? config.technicalSeo.twitterCard : '__unset__'}
                          onValueChange={(v) =>
                            updateTechnicalSeo({
                              twitterCard: (v === '__unset__' ? '' : v) as TechnicalSeoCmsFields['twitterCard'],
                            })
                          }
                        >
                          <SelectTrigger id="twitter-card-select" className="h-9 w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="summary_large_image">summary_large_image (recommended)</SelectItem>
                            <SelectItem value="summary">summary</SelectItem>
                            <SelectItem value="__unset__">Default / unset</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-2">
                        <div className="space-y-2">
                      <Label htmlFor="cmm-f-17">Twitter site (@handle optional)</Label>
                      <Input id="cmm-f-17" className="w-full" value={config.technicalSeo.twitterSite} onChange={(e) => updateTechnicalSeo({ twitterSite: e.target.value.replace(/^@/, '') })} placeholder="yourbrand" />
                    </div>
                        <div className="space-y-2">
                      <Label htmlFor="cmm-f-18">Twitter creator (@handle optional)</Label>
                      <Input id="cmm-f-18" className="w-full" value={config.technicalSeo.twitterCreator} onChange={(e) => updateTechnicalSeo({ twitterCreator: e.target.value.replace(/^@/, '') })} placeholder="founder_handle" />
                    </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent>
                    <p className="mb-2 text-base font-semibold">
                      Robots, hreflang &amp; breadcrumbs
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Robots string is passed through to <code>&lt;meta name=&quot;robots&quot;&gt;</code> when set.
                      Hreflang rows power <code>link rel=&quot;alternate&quot;</code> for multilingual / regional
                      variants.
                    </p>
                    <div className="flex flex-col gap-4">
                      <div className="space-y-2">
                      <Label htmlFor="cmm-f-19">Robots meta content</Label>
                      <Input id="cmm-f-19" className="w-full" value={config.technicalSeo.robotsMeta} onChange={(e) => updateTechnicalSeo({ robotsMeta: e.target.value })} placeholder="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
                      <p className="text-xs text-muted-foreground">Use noindex for thin or duplicate landings only. Rich-result-friendly previews often include max-image-preview:large.</p>
                    </div>
                      <p className="text-sm text-muted-foreground">
                        Hreflang alternates
                      </p>
                      {(config.technicalSeo.hreflangAlternates.length
                        ? config.technicalSeo.hreflangAlternates
                        : [{ hreflang: '', href: '' }]
                      ).map((row, i) => (
                        <div key={i} className="flex flex-col gap-2 sm:flex-row sm:gap-4">
                          <div className="space-y-2">
                      <Label htmlFor="cmm-f-20">hreflang</Label>
                      <Input id="cmm-f-20" className="h-9 text-sm" value={row.hreflang} onChange={(e) => {
                              const base = config.technicalSeo.hreflangAlternates.length
                                ? [...config.technicalSeo.hreflangAlternates]
                                : [{ hreflang: '', href: '' }]
                              const next = [...base]
                              next[i] = { ...next[i], hreflang: e.target.value }
                              updateTechnicalSeo({ hreflangAlternates: next })
                            }} placeholder="en-IN" />
                    </div>
                          <div className="space-y-2">
                      <Label htmlFor="cmm-f-21">Absolute URL</Label>
                      <Input id="cmm-f-21" className="w-full h-9 text-sm" value={row.href} onChange={(e) => {
                              const base = config.technicalSeo.hreflangAlternates.length
                                ? [...config.technicalSeo.hreflangAlternates]
                                : [{ hreflang: '', href: '' }]
                              const next = [...base]
                              next[i] = { ...next[i], href: e.target.value }
                              updateTechnicalSeo({ hreflangAlternates: next })
                            }} placeholder="https://…" />
                    </div>
                          <Button type="button" variant="ghost" size="icon" className="h-9 w-9 shrink-0 text-destructive hover:text-destructive" onClick={() =>
                              updateTechnicalSeo({
                                hreflangAlternates: config.technicalSeo.hreflangAlternates.filter((_, j) => j !== i),
                              })
                            } ><Trash2 className="h-4 w-4" /></Button>
                        </div>
                      ))}
                      <Button
                        size="sm"
                        leftIcon={<Plus className="h-4 w-4" />}
                        onClick={() =>
                          updateTechnicalSeo({
                            hreflangAlternates: [
                              ...config.technicalSeo.hreflangAlternates,
                              { hreflang: '', href: '' },
                            ],
                          })
                        }
                      >
                        Add hreflang row
                      </Button>

                      <div className="flex items-start gap-3">
                        <Checkbox
                          id="fcl-breadcrumb-schema"
                          className="mt-0.5"
                          checked={config.technicalSeo.enableBreadcrumbSchema}
                          onCheckedChange={(c) =>
                            updateTechnicalSeo({ enableBreadcrumbSchema: c === true })
                          }
                        />
                        <Label htmlFor="fcl-breadcrumb-schema" className="text-sm font-normal leading-snug">
                          Emit BreadcrumbList JSON-LD (use manual trail below if paths are not inferable)
                        </Label>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Breadcrumb trail (name + URL per item)
                      </p>
                      {(config.technicalSeo.breadcrumbItems.length
                        ? config.technicalSeo.breadcrumbItems
                        : [{ name: '', url: '' }]
                      ).map((row, i) => (
                        <div key={i} className="flex flex-col gap-2 sm:flex-row sm:gap-4">
                          <div className="space-y-2">
                      <Label htmlFor="cmm-f-22">Name</Label>
                      <Input id="cmm-f-22" className="h-9 text-sm" value={row.name} onChange={(e) => {
                              const next = [...config.technicalSeo.breadcrumbItems]
                              if (!config.technicalSeo.breadcrumbItems.length) next.push({ name: '', url: '' })
                              next[i] = { ...next[i], name: e.target.value }
                              updateTechnicalSeo({ breadcrumbItems: next })
                            }} placeholder="AC repair" />
                    </div>
                          <div className="space-y-2">
                      <Label htmlFor="cmm-f-23">URL</Label>
                      <Input id="cmm-f-23" className="w-full h-9 text-sm" value={row.url} onChange={(e) => {
                              const next = [...config.technicalSeo.breadcrumbItems]
                              if (!config.technicalSeo.breadcrumbItems.length) next.push({ name: '', url: '' })
                              next[i] = { ...next[i], url: e.target.value }
                              updateTechnicalSeo({ breadcrumbItems: next })
                            }} placeholder="https://…" />
                    </div>
                          <Button type="button" variant="ghost" size="icon" className="h-9 w-9 shrink-0 text-destructive hover:text-destructive" onClick={() =>
                              updateTechnicalSeo({
                                breadcrumbItems: config.technicalSeo.breadcrumbItems.filter((_, j) => j !== i),
                              })
                            } ><Trash2 className="h-4 w-4" /></Button>
                        </div>
                      ))}
                      <Button
                        size="sm"
                        leftIcon={<Plus className="h-4 w-4" />}
                        onClick={() =>
                          updateTechnicalSeo({
                            breadcrumbItems: [...config.technicalSeo.breadcrumbItems, { name: '', url: '' }],
                          })
                        }
                      >
                        Add breadcrumb item
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent>
                    <p className="mb-2 text-base font-semibold">
                      Structured data, entities &amp; answer engines
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Clear entities and factual summaries help Google and LLM-based search cite you accurately. Only use
                      aggregate rating when it matches visible, genuine reviews.
                    </p>
                    <div className="flex flex-col gap-4">
                      <div className="space-y-2">
                      <Label htmlFor="cmm-f-24">Primary schema.org @type hint</Label>
                      <Input id="cmm-f-24" className="w-full" value={config.technicalSeo.schemaPrimaryType} onChange={(e) => updateTechnicalSeo({ schemaPrimaryType: e.target.value })} placeholder="ProfessionalService or HomeAndConstructionBusiness" />
                      <p className="text-xs text-muted-foreground">Consumer maps this to Service / LocalBusiness typing, not a substitute for valid NAP.</p>
                    </div>
                      <div className="flex items-start gap-3">
                        <Checkbox
                          id="fcl-webpage-schema"
                          className="mt-0.5"
                          checked={config.technicalSeo.enableWebPageSchema}
                          onCheckedChange={(c) =>
                            updateTechnicalSeo({ enableWebPageSchema: c === true })
                          }
                        />
                        <Label htmlFor="fcl-webpage-schema" className="text-sm font-normal leading-snug">
                          Emit WebPage (or CollectionPage) JSON-LD with name, description, URL
                        </Label>
                      </div>
                      <div className="flex items-start gap-3">
                        <Checkbox
                          id="fcl-service-offer-schema"
                          className="mt-0.5"
                          checked={config.technicalSeo.enableServiceOfferSchema}
                          onCheckedChange={(c) =>
                            updateTechnicalSeo({ enableServiceOfferSchema: c === true })
                          }
                        />
                        <Label htmlFor="fcl-service-offer-schema" className="text-sm font-normal leading-snug">
                          Emit Service / hasOfferCatalog style JSON-LD from cards &amp; pricing blocks
                        </Label>
                      </div>
                      <div className="flex items-start gap-3">
                        <Checkbox
                          id="fcl-howto-schema"
                          className="mt-0.5"
                          checked={config.technicalSeo.enableHowToSchema}
                          onCheckedChange={(c) =>
                            updateTechnicalSeo({ enableHowToSchema: c === true })
                          }
                        />
                        <Label htmlFor="fcl-howto-schema" className="text-sm font-normal leading-snug">
                          Emit HowTo JSON-LD from booking steps (Areas & booking tab)
                        </Label>
                      </div>
                      <div className="space-y-2">
                      <Label htmlFor="cmm-f-25">Answer-engine summary</Label>
                      <Textarea id="cmm-f-25" className="w-full" rows={3} value={config.technicalSeo.answerEngineSummary} onChange={(e) => updateTechnicalSeo({ answerEngineSummary: e.target.value })} placeholder="2–4 factual sentences: who you serve, what’s included, pricing stance, same-day policy." />
                      <p className="text-xs text-muted-foreground">Use for a visible “In brief” block and/or speakable text — avoid keyword stuffing.</p>
                    </div>
                      <div className="space-y-2">
                      <Label htmlFor="cmm-f-26">Content modified date (ISO)</Label>
                      <Input id="cmm-f-26" className="w-full" value={config.technicalSeo.contentModifiedDate} onChange={(e) => updateTechnicalSeo({ contentModifiedDate: e.target.value })} placeholder="2026-05-01 or 2026-05-01T12:00:00+05:30" />
                      <p className="text-xs text-muted-foreground">Optional dateModified for WebPage when you materially refresh this landing.</p>
                    </div>
                      <p className="text-sm text-muted-foreground">
                        knowsAbout / topic entities
                      </p>
                      {(config.technicalSeo.knowsAbout.length ? config.technicalSeo.knowsAbout : ['']).map((topic, i) => (
                        <div key={i} className="flex flex-row items-center gap-2">
                          <div className="space-y-2"><Input className="w-full h-9 text-sm" value={topic} onChange={(e) => {
                              const base = config.technicalSeo.knowsAbout.length
                                ? [...config.technicalSeo.knowsAbout]
                                : ['']
                              const next = [...base]
                              next[i] = e.target.value
                              updateTechnicalSeo({ knowsAbout: next })
                            }} placeholder="Air conditioning maintenance or https://en.wikipedia.org/wiki/Air_conditioning" />
                    </div>
                          <Button type="button" variant="ghost" size="icon" className="h-9 w-9 shrink-0 text-destructive hover:text-destructive" onClick={() =>
                              updateTechnicalSeo({
                                knowsAbout: config.technicalSeo.knowsAbout.filter((_, j) => j !== i),
                              })
                            } ><Trash2 className="h-4 w-4" /></Button>
                        </div>
                      ))}
                      <Button
                        size="sm"
                        leftIcon={<Plus className="h-4 w-4" />}
                        onClick={() => updateTechnicalSeo({ knowsAbout: [...config.technicalSeo.knowsAbout, ''] })}
                      >
                        Add topic
                      </Button>
                      <p className="text-sm text-muted-foreground">
                        Speakable CSS selectors
                      </p>
                      {(config.technicalSeo.speakableSelectors.length
                        ? config.technicalSeo.speakableSelectors
                        : ['']
                      ).map((sel, i) => (
                        <div key={i} className="flex flex-row items-center gap-2">
                          <div className="space-y-2"><Input className="w-full h-9 text-sm" value={sel} onChange={(e) => {
                              const base = config.technicalSeo.speakableSelectors.length
                                ? [...config.technicalSeo.speakableSelectors]
                                : ['']
                              const next = [...base]
                              next[i] = e.target.value
                              updateTechnicalSeo({ speakableSelectors: next })
                            }} placeholder=".service-answer-summary, article h1" />
                    </div>
                          <Button type="button" variant="ghost" size="icon" className="h-9 w-9 shrink-0 text-destructive hover:text-destructive" onClick={() =>
                              updateTechnicalSeo({
                                speakableSelectors: config.technicalSeo.speakableSelectors.filter((_, j) => j !== i),
                              })
                            } ><Trash2 className="h-4 w-4" /></Button>
                        </div>
                      ))}
                      <Button
                        size="sm"
                        leftIcon={<Plus className="h-4 w-4" />}
                        onClick={() =>
                          updateTechnicalSeo({
                            speakableSelectors: [...config.technicalSeo.speakableSelectors, ''],
                          })
                        }
                      >
                        Add selector
                      </Button>
                      <p className="text-sm text-muted-foreground">
                        Aggregate rating (JSON-LD) — honest values only
                      </p>
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-2">
                        <div className="space-y-2">
                      <Label htmlFor="cmm-f-29">Rating value</Label>
                      <Input id="cmm-f-29" className="w-full" value={config.technicalSeo.aggregateRating.ratingValue} onChange={(e) =>
                            updateTechnicalSeo({
                              aggregateRating: {
                                ...config.technicalSeo.aggregateRating,
                                ratingValue: e.target.value,
                              },
                            })
                          } placeholder="4.8" />
                    </div>
                        <div className="space-y-2">
                      <Label htmlFor="cmm-f-30">Review count</Label>
                      <Input id="cmm-f-30" className="w-full" value={config.technicalSeo.aggregateRating.reviewCount} onChange={(e) =>
                            updateTechnicalSeo({
                              aggregateRating: {
                                ...config.technicalSeo.aggregateRating,
                                reviewCount: e.target.value,
                              },
                            })
                          } placeholder="1200" />
                    </div>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Video URLs (VideoObject / embed URLs)
                      </p>
                      {(config.technicalSeo.videoEmbedUrls.length
                        ? config.technicalSeo.videoEmbedUrls
                        : ['']
                      ).map((u, i) => (
                        <div key={i} className="flex flex-row items-center gap-2">
                          <div className="space-y-2"><Input className="w-full h-9 text-sm" value={u} onChange={(e) => {
                              const base = config.technicalSeo.videoEmbedUrls.length
                                ? [...config.technicalSeo.videoEmbedUrls]
                                : ['']
                              const next = [...base]
                              next[i] = e.target.value
                              updateTechnicalSeo({ videoEmbedUrls: next })
                            }} placeholder="https://www.youtube.com/watch?v=…" />
                    </div>
                          <Button type="button" variant="ghost" size="icon" className="h-9 w-9 shrink-0 text-destructive hover:text-destructive" onClick={() =>
                              updateTechnicalSeo({
                                videoEmbedUrls: config.technicalSeo.videoEmbedUrls.filter((_, j) => j !== i),
                              })
                            } ><Trash2 className="h-4 w-4" /></Button>
                        </div>
                      ))}
                      <Button
                        size="sm"
                        leftIcon={<Plus className="h-4 w-4" />}
                        onClick={() =>
                          updateTechnicalSeo({ videoEmbedUrls: [...config.technicalSeo.videoEmbedUrls, ''] })
                        }
                      >
                        Add video URL
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="localSeo" className="mt-2 px-0 outline-none">
              <div className="flex flex-col gap-4">
                <div role="alert" className="rounded-md border border-blue-200 bg-blue-50/80 p-3 text-sm dark:border-blue-900 dark:bg-blue-950/30">
                  <strong>Consumer app contract:</strong> map-pack style data should be read only from this CMS record
                  (<code>localSeo</code> and related fields). Avoid hardcoding service areas, NAP, or GBP URLs in the
                  public bundle so hyperlocal pages stay editable from admin.
                </div>
                <Card>
                  <CardContent>
                    <p className="mb-2 text-base font-semibold">
                      Structured data &amp; profile
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Toggle LocalBusiness-oriented JSON-LD on the consumer site when you have a consistent NAP and
                      service-area story for this key.
                    </p>
                    <div className="flex flex-col gap-4">
                      <div className="flex items-start gap-3">
                        <Checkbox
                          id="fcl-local-business-schema"
                          className="mt-0.5"
                          checked={config.localSeo.enableLocalBusinessSchema}
                          onCheckedChange={(c) =>
                            updateLocalSeo({ enableLocalBusinessSchema: c === true })
                          }
                        />
                        <Label htmlFor="fcl-local-business-schema" className="text-sm font-normal leading-snug">
                          Enable LocalBusiness / local schema (consumer reads this flag)
                        </Label>
                      </div>
                      <div className="space-y-2">
                      <Label htmlFor="cmm-f-32">Local profile name (schema / visible)</Label>
                      <Input id="cmm-f-32" className="w-full" value={config.localSeo.localProfileName} onChange={(e) => updateLocalSeo({ localProfileName: e.target.value })} placeholder="e.g. ProFixer AC Repair – Mira Road" />
                      <p className="text-xs text-muted-foreground">Optional override for JSON-LD name on this URL; use locality keys for true hyperlocal profiles.</p>
                    </div>
                      <div className="space-y-2">
                      <Label htmlFor="cmm-f-33">Opening hours summary</Label>
                      <Input id="cmm-f-33" className="w-full" value={config.localSeo.openingHoursSummary} onChange={(e) => updateLocalSeo({ openingHoursSummary: e.target.value })} placeholder="Mon–Sat 8:00–20:00 · Sun 9:00–18:00" />
                    </div>
                      <div className="space-y-2">
                      <Label htmlFor="cmm-f-34">Price range hint</Label>
                      <Input id="cmm-f-34" className="w-full" value={config.localSeo.priceRange} onChange={(e) => updateLocalSeo({ priceRange: e.target.value })} placeholder="e.g. ₹₹ or Inexpensive–Moderate" />
                    </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent>
                    <p className="mb-2 text-base font-semibold">
                      Service area (local SEO)
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Lists and narrative power “near me” relevance and internal linking to locality URLs.
                    </p>
                    <div className="flex flex-col gap-4">
                      <div className="space-y-2">
                      <Label htmlFor="cmm-f-35">Service area headline</Label>
                      <Input id="cmm-f-35" className="w-full" value={config.localSeo.serviceAreaHeadline} onChange={(e) => updateLocalSeo({ serviceAreaHeadline: e.target.value })} placeholder="Same-day AC repair across [Location] and surrounding suburbs" />
                    </div>
                      <div className="space-y-2">
                      <Label htmlFor="cmm-f-36">Service area narrative</Label>
                      <Textarea id="cmm-f-36" className="w-full" rows={4} value={config.localSeo.serviceAreaNarrative} onChange={(e) => updateLocalSeo({ serviceAreaNarrative: e.target.value })} placeholder="Unique paragraph describing coverage, dispatch times, and why you win locally." />
                    </div>
                      <p className="text-sm text-muted-foreground">
                        Places served (suburbs / neighborhoods)
                      </p>
                      {(config.localSeo.serviceAreaPlaceNames.length
                        ? config.localSeo.serviceAreaPlaceNames
                        : ['']
                      ).map((place, i) => (
                        <div key={i} className="flex flex-row items-center gap-2">
                          <div className="space-y-2"><Input className="w-full h-9 text-sm" value={place} onChange={(e) => {
                              const base = config.localSeo.serviceAreaPlaceNames.length
                                ? [...config.localSeo.serviceAreaPlaceNames]
                                : ['']
                              const next = [...base]
                              next[i] = e.target.value
                              updateLocalSeo({ serviceAreaPlaceNames: next })
                            }} placeholder="e.g. Mira Road, Bhayandar East" />
                    </div>
                          <Button type="button" variant="ghost" size="icon" className="h-9 w-9 shrink-0 text-destructive hover:text-destructive" onClick={() =>
                              updateLocalSeo({
                                serviceAreaPlaceNames: config.localSeo.serviceAreaPlaceNames.filter((_, j) => j !== i),
                              })
                            } ><Trash2 className="h-4 w-4" /></Button>
                        </div>
                      ))}
                      <Button
                        size="sm"
                        leftIcon={<Plus className="h-4 w-4" />}
                        onClick={() =>
                          updateLocalSeo({
                            serviceAreaPlaceNames: [...config.localSeo.serviceAreaPlaceNames, ''],
                          })
                        }
                      >
                        Add place
                      </Button>
                      <p className="text-sm text-muted-foreground">
                        Local intent keywords
                      </p>
                      {(config.localSeo.localIntentKeywords.length
                        ? config.localSeo.localIntentKeywords
                        : ['']
                      ).map((kw, i) => (
                        <div key={i} className="flex flex-row items-center gap-2">
                          <div className="space-y-2"><Input className="w-full h-9 text-sm" value={kw} onChange={(e) => {
                              const base = config.localSeo.localIntentKeywords.length
                                ? [...config.localSeo.localIntentKeywords]
                                : ['']
                              const next = [...base]
                              next[i] = e.target.value
                              updateLocalSeo({ localIntentKeywords: next })
                            }} placeholder="e.g. AC repair near me in Mira Road" />
                    </div>
                          <Button type="button" variant="ghost" size="icon" className="h-9 w-9 shrink-0 text-destructive hover:text-destructive" onClick={() =>
                              updateLocalSeo({
                                localIntentKeywords: config.localSeo.localIntentKeywords.filter((_, j) => j !== i),
                              })
                            } ><Trash2 className="h-4 w-4" /></Button>
                        </div>
                      ))}
                      <Button
                        size="sm"
                        leftIcon={<Plus className="h-4 w-4" />}
                        onClick={() =>
                          updateLocalSeo({
                            localIntentKeywords: [...config.localSeo.localIntentKeywords, ''],
                          })
                        }
                      >
                        Add local keyword
                      </Button>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent>
                    <p className="mb-2 text-base font-semibold">
                      NAP &amp; citations
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Keep consistent with Google Business Profile for trust and schema quality.
                    </p>
                    <div className="flex flex-col gap-4">
                      <div className="space-y-2">
                      <Label htmlFor="cmm-f-39">Street address</Label>
                      <Input id="cmm-f-39" className="w-full" value={config.localSeo.streetAddress} onChange={(e) => updateLocalSeo({ streetAddress: e.target.value })} />
                    </div>
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-2">
                        <div className="space-y-2">
                      <Label htmlFor="cmm-f-40">City / locality</Label>
                      <Input id="cmm-f-40" className="w-full" value={config.localSeo.addressLocality} onChange={(e) => updateLocalSeo({ addressLocality: e.target.value })} />
                    </div>
                        <div className="space-y-2">
                      <Label htmlFor="cmm-f-41">Region / state</Label>
                      <Input id="cmm-f-41" className="w-full" value={config.localSeo.addressRegion} onChange={(e) => updateLocalSeo({ addressRegion: e.target.value })} />
                    </div>
                      </div>
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-2">
                        <div className="space-y-2">
                      <Label htmlFor="cmm-f-42">Postal code</Label>
                      <Input id="cmm-f-42" className="w-full" value={config.localSeo.postalCode} onChange={(e) => updateLocalSeo({ postalCode: e.target.value })} />
                    </div>
                        <div className="space-y-2">
                      <Label htmlFor="cmm-f-43">Country code (ISO)</Label>
                      <Input id="cmm-f-43" className="w-full" value={config.localSeo.addressCountryCode} onChange={(e) => updateLocalSeo({ addressCountryCode: e.target.value.toUpperCase() })} maxLength={2} placeholder="IN" />
                    </div>
                      </div>
                      <div className="space-y-2">
                      <Label htmlFor="cmm-f-44">Geo coordinates (optional)</Label>
                      <Input id="cmm-f-44" className="w-full" value={config.localSeo.geoLatLng} onChange={(e) => updateLocalSeo({ geoLatLng: e.target.value })} placeholder="19.2856,72.8691" />
                      <p className="text-xs text-muted-foreground">Latitude,longitude for JSON-LD geo — use the verified storefront or service center.</p>
                    </div>
                      <div className="space-y-2">
                      <Label htmlFor="cmm-f-45">Google Business Profile URL</Label>
                      <Input id="cmm-f-45" className="w-full" value={config.localSeo.googleBusinessProfileUrl} onChange={(e) => updateLocalSeo({ googleBusinessProfileUrl: e.target.value })} placeholder="https://maps.google.com/?cid=…" />
                    </div>
                      <p className="text-sm text-muted-foreground">
                        sameAs URLs
                      </p>
                      {(config.localSeo.sameAsUrls.length ? config.localSeo.sameAsUrls : ['']).map((url, i) => (
                        <div key={i} className="flex flex-row items-center gap-2">
                          <div className="space-y-2"><Input className="w-full h-9 text-sm" value={url} onChange={(e) => {
                              const base = config.localSeo.sameAsUrls.length ? [...config.localSeo.sameAsUrls] : ['']
                              const next = [...base]
                              next[i] = e.target.value
                              updateLocalSeo({ sameAsUrls: next })
                            }} placeholder="https://" />
                    </div>
                          <Button type="button" variant="ghost" size="icon" className="h-9 w-9 shrink-0 text-destructive hover:text-destructive" onClick={() =>
                              updateLocalSeo({
                                sameAsUrls: config.localSeo.sameAsUrls.filter((_, j) => j !== i),
                              })
                            } ><Trash2 className="h-4 w-4" /></Button>
                        </div>
                      ))}
                      <Button
                        size="sm"
                        leftIcon={<Plus className="h-4 w-4" />}
                        onClick={() => updateLocalSeo({ sameAsUrls: [...config.localSeo.sameAsUrls, ''] })}
                      >
                        Add URL
                      </Button>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent>
                    <p className="mb-2 text-base font-semibold">
                      Social preview
                    </p>
                    <div className="space-y-2">
                      <Label htmlFor="cmm-f-47">Open Graph image override (absolute URL)</Label>
                      <Input id="cmm-f-47" className="w-full" value={config.localSeo.ogImageOverride} onChange={(e) => updateLocalSeo({ ogImageOverride: e.target.value })} placeholder="https://…" />
                      <p className="text-xs text-muted-foreground">Optional; consumer should prefer this for og:image on this service URL when set.</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="hero" className="mt-2 px-0 outline-none">
              <div className="flex flex-col gap-4">
                <Card>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      H1 and intro (no heading for intro on the live page)
                    </p>
                    <div className="space-y-2">
                      <Label htmlFor="cmm-f-48">Main heading (H1)</Label>
                      <Input id="cmm-f-48" className="w-full" value={config.mainHeading} onChange={(e) => updateConfig({ mainHeading: e.target.value })} placeholder="AC Repair & Service in [City] – Same-Day, Transparent Pricing" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cmm-f-49">Intro paragraph</Label>
                      <Textarea id="cmm-f-49" className="w-full" rows={5} value={config.intro} onChange={(e) => updateConfig({ intro: e.target.value })} />
                    </div>
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-2">
                      <div className="space-y-2">
                      <Label htmlFor="cmm-f-50">Intro lead magnet label (optional)</Label>
                      <Input id="cmm-f-50" className="w-full" value={config.introLeadMagnetLabel} onChange={(e) => updateConfig({ introLeadMagnetLabel: e.target.value })} placeholder="Free AC health check" />
                    </div>
                      <div className="space-y-2">
                      <Label htmlFor="cmm-f-51">Intro lead magnet URL (optional)</Label>
                      <Input id="cmm-f-51" className="w-full" value={config.introLeadMagnetUrl} onChange={(e) => updateConfig({ introLeadMagnetUrl: e.target.value })} />
                    </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent>
                    <div className="flex items-center gap-1">
                      <ImageIconLucide className="h-4 w-4 text-primary" />
                      <p className="text-base font-semibold">
                        Images
                      </p>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Hero and secondary images for this industry block.
                    </p>
                    <div className="flex flex-col gap-4">
                      <ImageUploadField
                        label="Image 1 (Hero / main)"
                        value={
                          config.image1
                            ? [{ id: 'img1', url: config.image1, alt: 'Image 1', isPrimary: true, order: 0 }]
                            : []
                        }
                        onChange={(images: ImageFile[]) => updateConfig({ image1: images[0]?.url })}
                        maxFiles={1}
                        maxSize={5}
                        folder="homeservice"
                        allowFromCloudinary
                        helperText="Recommended: 1200×630px or similar. Max 5MB."
                      />
                      <ImageUploadField
                        label="Image 2 (Secondary)"
                        value={
                          config.image2
                            ? [{ id: 'img2', url: config.image2, alt: 'Image 2', isPrimary: true, order: 0 }]
                            : []
                        }
                        onChange={(images: ImageFile[]) => updateConfig({ image2: images[0]?.url })}
                        maxFiles={1}
                        maxSize={5}
                        folder="homeservice"
                        allowFromCloudinary
                        helperText="Secondary image. Max 5MB."
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="cards" className="mt-2 px-0 outline-none">
              <Card>
                <CardContent>
                  <div className="flex flex-wrap items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      Our Services grid (card per row in CMS; site renders as grid)
                    </p>
                    <Button
                      size="sm"
                      leftIcon={<Plus className="h-4 w-4" />}
                      onClick={() => updateConfig({ serviceCards: [...config.serviceCards, emptyServiceCard()] })}
                    >
                      Add card
                    </Button>
                  </div>
                  {config.serviceCards.map((card, i) => (
                    <Accordion key={i} type="single" collapsible defaultValue={`svc-card-${i}`} className="mb-2 rounded-md border">
                      <AccordionItem value={`svc-card-${i}`} className="border-0">
                        <div className="flex items-stretch gap-1 border-b px-2">
                          <AccordionTrigger className="flex-1 py-3 text-left text-sm font-medium hover:no-underline">
                            {card.title || `Card ${i + 1}`}
                          </AccordionTrigger>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 shrink-0 text-destructive hover:text-destructive"
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              updateConfig({ serviceCards: config.serviceCards.filter((_, j) => j !== i) })
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <AccordionContent className="px-2 pb-4 pt-2">
                        <div className="flex flex-col gap-4">
                          <div className="space-y-2">
                      <Label htmlFor="cmm-f-52">Service name (H3)</Label>
                      <Input id="cmm-f-52" className="w-full" value={card.title} onChange={(e) => {
                              const next = [...config.serviceCards]
                              next[i] = { ...next[i], title: e.target.value }
                              updateConfig({ serviceCards: next })
                            }} />
                    </div>
                          <div className="space-y-2">
                      <Label htmlFor="cmm-f-53">Short description</Label>
                      <Textarea id="cmm-f-53" className="w-full" rows={2} value={card.description} onChange={(e) => {
                              const next = [...config.serviceCards]
                              next[i] = { ...next[i], description: e.target.value }
                              updateConfig({ serviceCards: next })
                            }} />
                    </div>
                          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-2">
                            <div className="space-y-2">
                      <Label htmlFor="cmm-f-54">Price</Label>
                      <Input id="cmm-f-54" className="w-full" value={card.price} onChange={(e) => {
                                const next = [...config.serviceCards]
                                next[i] = { ...next[i], price: e.target.value }
                                updateConfig({ serviceCards: next })
                              }} />
                    </div>
                            <div className="space-y-2">
                      <Label htmlFor="cmm-f-55">Rating</Label>
                      <Input id="cmm-f-55" className="w-full" value={card.rating} onChange={(e) => {
                                const next = [...config.serviceCards]
                                next[i] = { ...next[i], rating: e.target.value }
                                updateConfig({ serviceCards: next })
                              }} />
                    </div>
                          </div>
                          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-2">
                            <div className="space-y-2">
                      <Label htmlFor="cmm-f-56">Duration</Label>
                      <Input id="cmm-f-56" className="w-full" value={card.duration} onChange={(e) => {
                                const next = [...config.serviceCards]
                                next[i] = { ...next[i], duration: e.target.value }
                                updateConfig({ serviceCards: next })
                              }} />
                    </div>
                            <div className="space-y-2">
                      <Label htmlFor="cmm-f-57">Warranty badge</Label>
                      <Input id="cmm-f-57" className="w-full" value={card.warranty} onChange={(e) => {
                                const next = [...config.serviceCards]
                                next[i] = { ...next[i], warranty: e.target.value }
                                updateConfig({ serviceCards: next })
                              }} />
                    </div>
                          </div>
                          <div className="space-y-2">
                      <Label htmlFor="cmm-f-58">Book now URL</Label>
                      <Input id="cmm-f-58" className="w-full" value={card.bookUrl} onChange={(e) => {
                              const next = [...config.serviceCards]
                              next[i] = { ...next[i], bookUrl: e.target.value }
                              updateConfig({ serviceCards: next })
                            }} />
                    </div>
                        </div>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="detailed" className="mt-2 px-0 outline-none">
              <Card>
                <CardContent>
                  <div className="flex flex-wrap items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      Detailed service options (H3 + bullets)
                    </p>
                    <Button size="sm" leftIcon={<Plus className="h-4 w-4" />} onClick={addServiceType}>
                      Add block
                    </Button>
                  </div>
                  {config.serviceTypes.map((block, typeIndex) => (
                    <Accordion
                      key={typeIndex}
                      type="single"
                      collapsible
                      defaultValue={`svc-type-${typeIndex}`}
                      className="mb-2 rounded-md border"
                    >
                      <AccordionItem value={`svc-type-${typeIndex}`} className="border-0">
                        <div className="flex items-stretch gap-1 border-b px-2">
                          <AccordionTrigger className="flex-1 py-3 text-left text-sm font-medium hover:no-underline">
                            {block.title || `Block ${typeIndex + 1}`}
                          </AccordionTrigger>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 shrink-0 text-destructive hover:text-destructive"
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              removeServiceType(typeIndex)
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <AccordionContent className="px-2 pb-4 pt-2">
                        <div className="flex flex-col gap-4">
                          <div className="space-y-2">
                      <Label htmlFor="cmm-f-59">Title (H3)</Label>
                      <Input id="cmm-f-59" className="w-full" value={block.title} onChange={(e) => updateServiceType(typeIndex, 'title', e.target.value)} placeholder="Foam & power jet AC service" />
                    </div>
                          <div className="space-y-2">
                      <Label htmlFor="cmm-f-60">Description</Label>
                      <Textarea id="cmm-f-60" className="w-full" rows={2} value={block.description} onChange={(e) => updateServiceType(typeIndex, 'description', e.target.value)} />
                    </div>
                          <div>
                            <p className="text-xs text-muted-foreground">
                              What&apos;s included (bullets)
                            </p>
                            {(block.bullets || []).map((b, bi) => (
                              <div key={bi} className="flex flex-row items-center gap-2">
                                <div className="space-y-2"><Input className="w-full h-9 text-sm" value={b} onChange={(e) => updateBullet(typeIndex, bi, e.target.value)} placeholder="Bullet point" />
                    </div>
                                <Button type="button" variant="ghost" size="icon" className="h-9 w-9 shrink-0 text-destructive hover:text-destructive" onClick={() => removeBullet(typeIndex, bi)} ><Trash2 className="h-4 w-4" /></Button>
                              </div>
                            ))}
                            <Button size="sm" onClick={() => addBullet(typeIndex)}>
                              + Bullet
                            </Button>
                          </div>
                        </div>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="trust" className="mt-2 px-0 outline-none">
              <div className="flex flex-col gap-4">
                <Card>
                  <CardContent>
                    <div className="flex flex-wrap items-center justify-between">
                      <p className="text-sm text-muted-foreground">
                        Why homeowners book ProFixer (bold subheading + paragraph)
                      </p>
                      <Button
                        size="sm"
                        leftIcon={<Plus className="h-4 w-4" />}
                        onClick={() =>
                          updateConfig({ trustBenefits: [...config.trustBenefits, emptyTrustBenefit()] })
                        }
                      >
                        Add benefit
                      </Button>
                    </div>
                    {config.trustBenefits.map((row, i) => (
                      <div key={i} className="flex flex-row items-start gap-2">
                        <div className="flex min-w-0 flex-1 flex-col gap-4">
                          <div className="space-y-2">
                      <Label htmlFor="cmm-f-62">Subheading</Label>
                      <Input id="cmm-f-62" className="w-full h-9 text-sm" value={row.heading} onChange={(e) => {
                              const next = [...config.trustBenefits]
                              next[i] = { ...next[i], heading: e.target.value }
                              updateConfig({ trustBenefits: next })
                            }} />
                    </div>
                          <div className="space-y-2">
                      <Label htmlFor="cmm-f-63">Paragraph</Label>
                      <Textarea id="cmm-f-63" className="w-full" rows={2} value={row.body} onChange={(e) => {
                              const next = [...config.trustBenefits]
                              next[i] = { ...next[i], body: e.target.value }
                              updateConfig({ trustBenefits: next })
                            }} />
                    </div>
                        </div>
                        <Button type="button" variant="ghost" size="icon" className="h-10 w-10 shrink-0 text-destructive hover:text-destructive" onClick={() =>
                            updateConfig({ trustBenefits: config.trustBenefits.filter((_, j) => j !== i) })
                          } ><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    ))}
                  </CardContent>
                </Card>
                <Card>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Legacy &quot;4 ways&quot; block (optional; use if the site still reads this section)
                    </p>
                    <div className="space-y-2">
                      <Label htmlFor="cmm-f-64">Ways heading</Label>
                      <Input id="cmm-f-64" className="w-full" value={config.waysHeading} onChange={(e) => updateConfig({ waysHeading: e.target.value })} />
                    </div>
                    {(config.waysBullets || []).map((b, i) => (
                      <div key={i} className="flex flex-row items-center gap-2">
                        <div className="space-y-2"><Input className="w-full h-9 text-sm" value={b} onChange={(e) => {
                            const next = [...(config.waysBullets || [])]
                            next[i] = e.target.value
                            updateConfig({ waysBullets: next })
                          }} />
                    </div>
                        <Button type="button" variant="ghost" size="icon" className="h-9 w-9 shrink-0 text-destructive hover:text-destructive" onClick={() =>
                            updateConfig({ waysBullets: (config.waysBullets || []).filter((_, j) => j !== i) })
                          } ><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    ))}
                    <Button
                      size="sm"
                      leftIcon={<Plus className="h-4 w-4" />}
                      onClick={() => updateConfig({ waysBullets: [...(config.waysBullets || []), ''] })}
                    >
                      Add way
                    </Button>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      What&apos;s included in our service experience
                    </p>
                    {(config.experienceIncluded.length ? config.experienceIncluded : ['']).map((line, i) => (
                      <div key={i} className="flex flex-row items-center gap-2">
                        <div className="space-y-2"><Input className="w-full h-9 text-sm" value={line} onChange={(e) => updateStringList('experienceIncluded', i, e.target.value)} placeholder="e.g. Skilled technicians, clear approvals" />
                    </div>
                        <Button type="button" variant="ghost" size="icon" className="h-9 w-9 shrink-0 text-destructive hover:text-destructive" onClick={() => removeStringListItem('experienceIncluded', i)} ><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    ))}
                    <Button size="sm" leftIcon={<Plus className="h-4 w-4" />} onClick={() => addStringListItem('experienceIncluded')}>
                      Add line
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="areas" className="mt-2 px-0 outline-none">
              <div className="flex flex-col gap-4">
                <Card>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Areas we serve
                    </p>
                    <div className="space-y-2">
                      <Label htmlFor="cmm-f-67">Optional intro copy</Label>
                      <Textarea id="cmm-f-67" className="w-full" rows={2} value={config.areasCopy} onChange={(e) => updateConfig({ areasCopy: e.target.value })} />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Localities (one per line)
                    </p>
                    {(config.areasList.length ? config.areasList : ['']).map((line, i) => (
                      <div key={i} className="flex flex-row items-center gap-2">
                        <div className="space-y-2"><Input className="w-full h-9 text-sm" value={line} onChange={(e) => updateStringList('areasList', i, e.target.value)} />
                    </div>
                        <Button type="button" variant="ghost" size="icon" className="h-9 w-9 shrink-0 text-destructive hover:text-destructive" onClick={() => removeStringListItem('areasList', i)} ><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    ))}
                    <Button size="sm" leftIcon={<Plus className="h-4 w-4" />} onClick={() => addStringListItem('areasList')}>
                      Add locality
                    </Button>
                    <div className="space-y-2">
                      <Label htmlFor="cmm-f-69">CTA after areas (e.g. check availability)</Label>
                      <Input id="cmm-f-69" className="w-full" value={config.areasCta} onChange={(e) => updateConfig({ areasCta: e.target.value })} />
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent>
                    <div className="flex flex-wrap items-center justify-between">
                      <p className="text-sm text-muted-foreground">
                        How to book (numbered steps)
                      </p>
                      <Button
                        size="sm"
                        leftIcon={<Plus className="h-4 w-4" />}
                        onClick={() => updateConfig({ bookingSteps: [...config.bookingSteps, emptyBookingStep()] })}
                      >
                        Add step
                      </Button>
                    </div>
                    {config.bookingSteps.map((step, i) => (
                      <div key={i} className="flex flex-row items-start gap-2">
                        <div className="flex min-w-0 flex-1 flex-col gap-4">
                          <div className="space-y-2">
                      <Label htmlFor="cmm-f-70">Step number (optional)</Label>
                      <Input id="cmm-f-70" className="h-9 text-sm" value={step.stepNumber} onChange={(e) => {
                              const next = [...config.bookingSteps]
                              next[i] = { ...next[i], stepNumber: e.target.value }
                              updateConfig({ bookingSteps: next })
                            }} />
                    </div>
                          <div className="space-y-2">
                      <Label htmlFor="cmm-f-71">Title</Label>
                      <Input id="cmm-f-71" className="w-full h-9 text-sm" value={step.title} onChange={(e) => {
                              const next = [...config.bookingSteps]
                              next[i] = { ...next[i], title: e.target.value }
                              updateConfig({ bookingSteps: next })
                            }} />
                    </div>
                          <div className="space-y-2">
                      <Label htmlFor="cmm-f-72">Description</Label>
                      <Textarea id="cmm-f-72" className="w-full" rows={2} value={step.description} onChange={(e) => {
                              const next = [...config.bookingSteps]
                              next[i] = { ...next[i], description: e.target.value }
                              updateConfig({ bookingSteps: next })
                            }} />
                    </div>
                        </div>
                        <Button type="button" variant="ghost" size="icon" className="h-10 w-10 shrink-0 text-destructive hover:text-destructive" onClick={() =>
                            updateConfig({ bookingSteps: config.bookingSteps.filter((_, j) => j !== i) })
                          } ><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    ))}
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-2">
                      <div className="space-y-2">
                      <Label htmlFor="cmm-f-73">Phone</Label>
                      <Input id="cmm-f-73" className="w-full" value={config.contactPhone} onChange={(e) => updateConfig({ contactPhone: e.target.value })} />
                    </div>
                      <div className="space-y-2">
                      <Label htmlFor="cmm-f-74">WhatsApp</Label>
                      <Input id="cmm-f-74" className="w-full" value={config.contactWhatsapp} onChange={(e) => updateConfig({ contactWhatsapp: e.target.value })} />
                    </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="pricing" className="mt-2 px-0 outline-none">
              <div className="flex flex-col gap-4">
                <div role="alert" className="rounded-md border border-blue-200 bg-blue-50/80 p-3 text-sm dark:border-blue-900 dark:bg-blue-950/30">
                  <p className="text-sm">
                    <strong>Service charges</strong> for this industry are maintained in{' '}
                    <Link to="/cms/category-marketing?tab=rate-card">Rate card</Link> (same catalog category key). Use spare parts and
                    included/excluded lists here so the consumer page can show a full pricing section without duplicating
                    labour/service rows.
                  </p>
                </div>
                <Card>
                  <CardContent>
                    <div className="flex flex-wrap items-center justify-between">
                      <p className="text-sm text-muted-foreground">
                        Spare parts (item + price range)
                      </p>
                      <Button
                        size="sm"
                        leftIcon={<Plus className="h-4 w-4" />}
                        onClick={() => updateConfig({ spareParts: [...config.spareParts, emptySparePart()] })}
                      >
                        Add row
                      </Button>
                    </div>
                    {config.spareParts.map((row, i) => (
                      <div key={i} className="flex flex-row items-center gap-2">
                        <div className="space-y-2">
                      <Label htmlFor="cmm-f-75">Item</Label>
                      <Input id="cmm-f-75" className="w-full h-9 text-sm" value={row.name} onChange={(e) => {
                            const next = [...config.spareParts]
                            next[i] = { ...next[i], name: e.target.value }
                            updateConfig({ spareParts: next })
                          }} />
                    </div>
                        <div className="space-y-2">
                      <Label htmlFor="cmm-f-76">Price range</Label>
                      <Input id="cmm-f-76" className="w-full h-9 text-sm" value={row.priceRange} onChange={(e) => {
                            const next = [...config.spareParts]
                            next[i] = { ...next[i], priceRange: e.target.value }
                            updateConfig({ spareParts: next })
                          }} />
                    </div>
                        <Button type="button" variant="ghost" size="icon" className="h-10 w-10 shrink-0 text-destructive hover:text-destructive" onClick={() => updateConfig({ spareParts: config.spareParts.filter((_, j) => j !== i) })} ><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    ))}
                  </CardContent>
                </Card>
                <Card>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      What&apos;s included vs not included (pricing section)
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Included
                    </p>
                    {(config.pricingIncluded.length ? config.pricingIncluded : ['']).map((line, i) => (
                      <div key={i} className="flex flex-row items-center gap-2">
                        <div className="space-y-2"><Input className="w-full h-9 text-sm" value={line} onChange={(e) => updateStringList('pricingIncluded', i, e.target.value)} />
                    </div>
                        <Button type="button" variant="ghost" size="icon" className="h-9 w-9 shrink-0 text-destructive hover:text-destructive" onClick={() => removeStringListItem('pricingIncluded', i)} ><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    ))}
                    <Button size="sm" leftIcon={<Plus className="h-4 w-4" />} onClick={() => addStringListItem('pricingIncluded')}>
                      Add included
                    </Button>
                    <p className="text-xs text-muted-foreground">
                      Not included
                    </p>
                    {(config.pricingExcluded.length ? config.pricingExcluded : ['']).map((line, i) => (
                      <div key={i} className="flex flex-row items-center gap-2">
                        <div className="space-y-2"><Input className="w-full h-9 text-sm" value={line} onChange={(e) => updateStringList('pricingExcluded', i, e.target.value)} />
                    </div>
                        <Button type="button" variant="ghost" size="icon" className="h-9 w-9 shrink-0 text-destructive hover:text-destructive" onClick={() => removeStringListItem('pricingExcluded', i)} ><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    ))}
                    <Button size="sm" leftIcon={<Plus className="h-4 w-4" />} onClick={() => addStringListItem('pricingExcluded')}>
                      Add excluded
                    </Button>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent>
                    <div className="flex flex-wrap items-center justify-between">
                      <p className="text-sm text-muted-foreground">
                        ProFixer vs local providers
                      </p>
                      <Button
                        size="sm"
                        leftIcon={<Plus className="h-4 w-4" />}
                        onClick={() =>
                          updateConfig({ comparisonRows: [...config.comparisonRows, emptyComparisonRow()] })
                        }
                      >
                        Add row
                      </Button>
                    </div>
                    {config.comparisonRows.map((row, i) => (
                      <div className="flex flex-col gap-4" key={i}>
                        <div className="flex flex-row items-start gap-2">
                          <div className="flex min-w-0 flex-1 flex-col gap-4">
                            <div className="space-y-2">
                      <Label htmlFor="cmm-f-79">Dimension</Label>
                      <Input id="cmm-f-79" className="w-full h-9 text-sm" value={row.label} onChange={(e) => {
                                const next = [...config.comparisonRows]
                                next[i] = { ...next[i], label: e.target.value }
                                updateConfig({ comparisonRows: next })
                              }} />
                    </div>
                            <div className="space-y-2">
                      <Label htmlFor="cmm-f-80">ProFixer</Label>
                      <Input id="cmm-f-80" className="w-full h-9 text-sm" value={row.profixer} onChange={(e) => {
                                const next = [...config.comparisonRows]
                                next[i] = { ...next[i], profixer: e.target.value }
                                updateConfig({ comparisonRows: next })
                              }} />
                    </div>
                            <div className="space-y-2">
                      <Label htmlFor="cmm-f-81">Typical local</Label>
                      <Input id="cmm-f-81" className="w-full h-9 text-sm" value={row.others} onChange={(e) => {
                                const next = [...config.comparisonRows]
                                next[i] = { ...next[i], others: e.target.value }
                                updateConfig({ comparisonRows: next })
                              }} />
                    </div>
                          </div>
                          <Button type="button" variant="ghost" size="icon" className="h-10 w-10 shrink-0 text-destructive hover:text-destructive" onClick={() =>
                              updateConfig({ comparisonRows: config.comparisonRows.filter((_, j) => j !== i) })
                            } ><Trash2 className="h-4 w-4" /></Button>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="faqs" className="mt-2 px-0 outline-none">
              <div className="flex flex-col gap-4">
                <Card>
                  <CardContent>
                    <div className="flex flex-wrap items-center justify-between">
                      <p className="text-sm text-muted-foreground">
                        FAQs (H3 + answer — industry-specific)
                      </p>
                      <Button
                        size="sm"
                        leftIcon={<Plus className="h-4 w-4" />}
                        onClick={() => updateConfig({ faqs: [...config.faqs, emptyFaq()] })}
                      >
                        Add FAQ
                      </Button>
                    </div>
                    {config.faqs.map((faq, i) => (
                      <Accordion key={i} type="single" collapsible defaultValue={`faq-${i}`} className="mb-2 rounded-md border">
                        <AccordionItem value={`faq-${i}`} className="border-0">
                          <div className="flex items-stretch gap-1 border-b px-2">
                            <AccordionTrigger className="flex-1 py-3 text-left text-sm font-medium hover:no-underline">
                              {faq.question || `FAQ ${i + 1}`}
                            </AccordionTrigger>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-9 w-9 shrink-0 text-destructive hover:text-destructive"
                              onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                updateConfig({ faqs: config.faqs.filter((_, j) => j !== i) })
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                          <AccordionContent className="px-2 pb-4 pt-2">
                          <div className="flex flex-col gap-4">
                            <div className="space-y-2">
                      <Label htmlFor="cmm-f-82">Question</Label>
                      <Input id="cmm-f-82" className="w-full" value={faq.question} onChange={(e) => {
                                const next = [...config.faqs]
                                next[i] = { ...next[i], question: e.target.value }
                                updateConfig({ faqs: next })
                              }} />
                    </div>
                            <div className="space-y-2">
                      <Label htmlFor="cmm-f-83">Answer</Label>
                      <Textarea id="cmm-f-83" className="w-full" rows={3} value={faq.answer} onChange={(e) => {
                                const next = [...config.faqs]
                                next[i] = { ...next[i], answer: e.target.value }
                                updateConfig({ faqs: next })
                              }} />
                    </div>
                          </div>
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>
                    ))}
                  </CardContent>
                </Card>
                <Card>
                  <CardContent>
                    <div className="flex flex-wrap items-center justify-between">
                      <p className="text-sm text-muted-foreground">
                        Related resources (internal links)
                      </p>
                      <Button
                        size="sm"
                        leftIcon={<Plus className="h-4 w-4" />}
                        onClick={() => updateConfig({ relatedLinks: [...config.relatedLinks, emptyRelatedLink()] })}
                      >
                        Add link
                      </Button>
                    </div>
                    {config.relatedLinks.map((link: RelatedLinkBlock, i: number) => (
                      <div key={i} className="flex flex-row items-center gap-2">
                        <div className="space-y-2">
                      <Label htmlFor="cmm-f-84">Label</Label>
                      <Input id="cmm-f-84" className="h-9 text-sm" value={link.label} onChange={(e) => {
                            const next = [...config.relatedLinks]
                            next[i] = { ...next[i], label: e.target.value }
                            updateConfig({ relatedLinks: next })
                          }} />
                    </div>
                        <div className="space-y-2">
                      <Label htmlFor="cmm-f-85">URL</Label>
                      <Input id="cmm-f-85" className="w-full h-9 text-sm" value={link.url} onChange={(e) => {
                            const next = [...config.relatedLinks]
                            next[i] = { ...next[i], url: e.target.value }
                            updateConfig({ relatedLinks: next })
                          }} />
                    </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-10 w-10 shrink-0 text-destructive hover:text-destructive"
                          onClick={() =>
                            updateConfig({
                              relatedLinks: config.relatedLinks.filter((_x: RelatedLinkBlock, j: number) => j !== i),
                            })
                          }
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="localityGuide" className="mt-2 px-0 outline-none">
              <div className="flex flex-col gap-4">
                <div role="alert" className="rounded-md border border-blue-200 bg-blue-50/80 p-3 text-sm dark:border-blue-900 dark:bg-blue-950/30">
                  For hyperlocal landings, choose the root service category (slug drives the key). Set Locality slug to
                  the path segment (example <code>mira-road</code>). The CMS key is{' '}
                  <code>
                    {selectedCategory}__mira-road
                  </code>{' '}
                  with your real locality instead of <code>mira-road</code>. The separator is{' '}
                  <strong className="font-mono font-normal">__</strong> (two underscores), e.g.{' '}
                  <code>electric__mira-road</code>, not a single <code>_</code>. Fill Metadata + FAQs, then enable the
                  article here.
                </div>
                <Card>
                  <CardContent>
                    <div className="flex flex-col gap-4">
                      <div className="flex items-start gap-3">
                        <Checkbox
                          id="fcl-locality-enabled"
                          className="mt-0.5"
                          checked={config.localityGuide.enabled}
                          onCheckedChange={(c) => updateLocalityGuide({ enabled: c === true })}
                        />
                        <Label htmlFor="fcl-locality-enabled" className="text-sm font-normal leading-snug">
                          Enable CMS locality article (replaces auto-generated guide body)
                        </Label>
                      </div>
                      <div className="flex items-start gap-3">
                        <Checkbox
                          id="fcl-locality-expand"
                          className="mt-0.5"
                          checked={config.localityGuide.expandDetailsByDefault}
                          onCheckedChange={(c) =>
                            updateLocalityGuide({ expandDetailsByDefault: c === true })
                          }
                        />
                        <Label htmlFor="fcl-locality-expand" className="text-sm font-normal leading-snug">
                          Expand long-form sections by default (better for crawlers)
                        </Label>
                      </div>
                      <div className="space-y-2">
                      <Label htmlFor="cmm-f-86">Article H2 (section under the catalogue)</Label>
                      <Input id="cmm-f-86" className="w-full" value={config.localityGuide.articleH2} onChange={(e) => updateLocalityGuide({ articleH2: e.target.value })} />
                    </div>
                      <div className="space-y-2">
                      <Label htmlFor="cmm-f-87">Summary lead (visible under H2)</Label>
                      <Textarea id="cmm-f-87" className="w-full" rows={3} value={config.localityGuide.summaryLead} onChange={(e) => updateLocalityGuide({ summaryLead: e.target.value })} />
                    </div>
                      <p className="text-sm text-muted-foreground">
                        Lead paragraphs (main article body)
                      </p>
                      {(config.localityGuide.leadParagraphs.length
                        ? config.localityGuide.leadParagraphs
                        : ['']
                      ).map((para: string, i: number) => (
                        <div key={i} className="flex flex-row items-start gap-2">
                          <div className="space-y-2">
                      <Label htmlFor="cmm-f-88">{`Paragraph ${i + 1}`}</Label>
                      <Textarea id="cmm-f-88" className="w-full" rows={3} value={para} onChange={(e) => {
                              const base = config.localityGuide.leadParagraphs.length
                                ? [...config.localityGuide.leadParagraphs]
                                : ['']
                              base[i] = e.target.value
                              updateLocalityGuide({ leadParagraphs: base })
                            }} />
                    </div>
                          <Button type="button" variant="ghost" size="icon" className="h-10 w-10 shrink-0 text-destructive hover:text-destructive" onClick={() => {
                              const base = [...config.localityGuide.leadParagraphs]
                              base.splice(i, 1)
                              updateLocalityGuide({ leadParagraphs: base.length ? base : [''] })
                            }}  aria-label="Remove paragraph"><Trash2 className="h-4 w-4" /></Button>
                        </div>
                      ))}
                      <Button
                        size="sm"
                        leftIcon={<Plus className="h-4 w-4" />}
                        onClick={() =>
                          updateLocalityGuide({
                            leadParagraphs: [...config.localityGuide.leadParagraphs, ''],
                          })
                        }
                      >
                        Add lead paragraph
                      </Button>
                      <p className="text-sm text-muted-foreground">
                        Depth sections (optional H2 blocks)
                      </p>
                      {config.localityGuide.sections.map((sec: LocalityGuideSectionBlock, si: number) => (
                        <Accordion
                          key={si}
                          type="single"
                          collapsible
                          defaultValue={si === 0 ? `loc-sec-${si}` : undefined}
                          className="mb-2 rounded-md border"
                        >
                          <AccordionItem value={`loc-sec-${si}`} className="border-0">
                            <AccordionTrigger className="px-2 py-3 text-left text-sm hover:no-underline">
                              Section {si + 1}: {sec.h2.trim() || '(untitled)'}
                            </AccordionTrigger>
                            <AccordionContent className="px-2 pb-4 pt-0">
                            <div className="flex flex-col gap-4">
                              <div className="space-y-2">
                      <Label htmlFor="cmm-f-89">Section H2</Label>
                      <Input id="cmm-f-89" className="w-full h-9 text-sm" value={sec.h2} onChange={(e) => {
                                  const next = [...config.localityGuide.sections]
                                  next[si] = { ...next[si], h2: e.target.value }
                                  updateLocalityGuide({ sections: next })
                                }} />
                    </div>
                              {(sec.paragraphs.length ? sec.paragraphs : ['']).map((p: string, pi: number) => (
                                <div className="space-y-2">
                      <Label htmlFor="cmm-f-90">{`Paragraph ${pi + 1}`}</Label>
                      <Textarea id="cmm-f-90" className="w-full h-9 text-sm" rows={2} value={p} onChange={(e) => {
                                    const next = [...config.localityGuide.sections]
                                    const paras = [...(next[si].paragraphs.length ? next[si].paragraphs : [''])]
                                    paras[pi] = e.target.value
                                    next[si] = { ...next[si], paragraphs: paras }
                                    updateLocalityGuide({ sections: next })
                                  }} />
                    </div>
                              ))}
                              <div className="flex flex-row gap-2">
                                <Button
                                  size="sm"
                                  onClick={() => {
                                    const next = [...config.localityGuide.sections]
                                    next[si] = {
                                      ...next[si],
                                      paragraphs: [...next[si].paragraphs, ''],
                                    }
                                    updateLocalityGuide({ sections: next })
                                  }}
                                >
                                  Add paragraph in section
                                </Button>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => {
                                    const next = config.localityGuide.sections.filter(
                                      (_s: LocalityGuideSectionBlock, j: number) => j !== si,
                                    )
                                    updateLocalityGuide({ sections: next.length ? next : [emptyLocalityGuideSection()] })
                                  }}
                                >
                                  Remove section
                                </Button>
                              </div>
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>
                      ))}
                      <Button
                        size="sm"
                        leftIcon={<Plus className="h-4 w-4" />}
                        onClick={() =>
                          updateLocalityGuide({
                            sections: [...config.localityGuide.sections, emptyLocalityGuideSection()],
                          })
                        }
                      >
                        Add section
                      </Button>
                      <p className="text-sm text-muted-foreground">
                        Key takeaways (bullets)
                      </p>
                      {(config.localityGuide.takeaways.length ? config.localityGuide.takeaways : ['']).map(
                        (t: string, i: number) => (
                        <div className="space-y-2"><Input className="w-full h-9 text-sm" value={t} onChange={(e) => {
                            const base = config.localityGuide.takeaways.length
                              ? [...config.localityGuide.takeaways]
                              : ['']
                            base[i] = e.target.value
                            updateLocalityGuide({ takeaways: base })
                          }} />
                    </div>
                      ))}
                      <Button
                        size="sm"
                        leftIcon={<Plus className="h-4 w-4" />}
                        onClick={() => updateLocalityGuide({ takeaways: [...config.localityGuide.takeaways, ''] })}
                      >
                        Add takeaway
                      </Button>
                      <div className="space-y-2">
                      <Label htmlFor="cmm-f-92">JSON-LD primary name (optional)</Label>
                      <Input id="cmm-f-92" className="w-full" value={config.localityGuide.jsonLdBrandServiceName} onChange={(e) => updateLocalityGuide({ jsonLdBrandServiceName: e.target.value })} />
                      <p className="text-xs text-muted-foreground">Overrides Service/LocalBusiness name in structured data when set.</p>
                    </div>
                      <div className="flex items-start gap-3">
                        <Checkbox
                          id="fcl-locality-faq-schema"
                          className="mt-0.5"
                          checked={config.localityGuide.useFaqsForSchema}
                          onCheckedChange={(c) =>
                            updateLocalityGuide({ useFaqsForSchema: c === true })
                          }
                        />
                        <Label htmlFor="fcl-locality-faq-schema" className="text-sm font-normal leading-snug">
                          Emit FAQPage schema from the FAQs tab on this record
                        </Label>
                      </div>
                      <div className="flex items-start gap-3">
                        <Checkbox
                          id="fcl-locality-inbound-links"
                          className="mt-0.5"
                          checked={config.localityGuide.showInboundLinkStrip}
                          onCheckedChange={(c) =>
                            updateLocalityGuide({ showInboundLinkStrip: c === true })
                          }
                        />
                        <Label htmlFor="fcl-locality-inbound-links" className="text-sm font-normal leading-snug">
                          Show Related links (FAQs tab → related links) above the guide
                        </Label>
                      </div>
                      <div className="flex items-start gap-3">
                        <Checkbox
                          id="fcl-locality-booking-cta"
                          className="mt-0.5"
                          checked={config.localityGuide.showBookingCtaStrip}
                          onCheckedChange={(c) =>
                            updateLocalityGuide({ showBookingCtaStrip: c === true })
                          }
                        />
                        <Label htmlFor="fcl-locality-booking-cta" className="text-sm font-normal leading-snug">
                          Show call + book CTA strip
                        </Label>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="closing" className="mt-2 px-0 outline-none">
              <div className="flex flex-col gap-4">
                <Card>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Closing content
                    </p>
                    <div className="space-y-2">
                      <Label htmlFor="cmm-f-93">Closing paragraph(s)</Label>
                      <Textarea id="cmm-f-93" className="w-full" rows={5} value={config.closingParagraph} onChange={(e) => updateConfig({ closingParagraph: e.target.value })} />
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Lead magnet (footer / aside — URL often configured on consumer app)
                    </p>
                    <div className="space-y-2">
                      <Label htmlFor="cmm-f-94">Headline</Label>
                      <Input id="cmm-f-94" className="w-full" value={config.leadMagnet.headline} onChange={(e) =>
                        updateConfig({ leadMagnet: { ...config.leadMagnet, headline: e.target.value } })
                      } />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cmm-f-95">Description</Label>
                      <Textarea id="cmm-f-95" className="w-full" rows={2} value={config.leadMagnet.description} onChange={(e) =>
                        updateConfig({ leadMagnet: { ...config.leadMagnet, description: e.target.value } })
                      } />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cmm-f-96">CTA label</Label>
                      <Input id="cmm-f-96" className="w-full" value={config.leadMagnet.ctaLabel} onChange={(e) =>
                        updateConfig({ leadMagnet: { ...config.leadMagnet, ctaLabel: e.target.value } })
                      } />
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      JSON-LD (optional)
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Prefer generating FAQPage / LocalBusiness on the consumer site from structured fields. Use this
                      only if you need a fixed snippet; validate JSON before publishing.
                    </p>
                    <div className="space-y-2"><Textarea className="w-full" rows={8} value={config.jsonLdExtra} onChange={(e) => updateConfig({ jsonLdExtra: e.target.value })} />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>

          <Button
            variant="default"
            leftIcon={saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Megaphone className="h-4 w-4" />}
            onClick={handleSave}
            disabled={saving}
          >
            Save all
          </Button>
        </div>
      )}
    </div>
  )
}
