import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  Loader2,
  Trash2,
  Plus,
  Megaphone,
  AlertTriangle,
  Info,
} from 'lucide-react'
import { Button } from '../../components/ui/button'
import { Badge } from '../../components/ui/badge'
import { Checkbox } from '../../components/ui/checkbox'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { Textarea } from '../../components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs'
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
import { selectValueWhenListed } from '../../lib/selectValueGuard'
import { CMSService } from '../../services/api'
import { PageHeader } from '../../components/common/PageHeader'
import { ConfirmDialog } from '../../components/common/ConfirmDialog'
import ImageUploadField from '../../components/forms/ImageUploadField'
import type { ImageFile } from '../../components/forms/ImageUploadField'
import { CategoryMarketingRichTextField } from '../../components/cms/CategoryMarketingRichTextField'
import { ConsumerPreviewRichHtml } from '../../components/cms/CmsConsumerVisualPreview'
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
  type NearMeSeoCmsFields,
  type RelatedLinkBlock,
  type TechnicalSeoCmsFields,
  type ServiceTypeBlock,
  emptyCategoryMarketingConfig,
  emptyLocalityGuideSection,
  emptyBookingStep,
  emptyFaq,
  emptyRelatedLink,
  emptyServiceCard,
  emptyServiceTypeBlock,
  emptyTrustBenefit,
  mergeCategoryConfig,
  normalizeCategoryMarketingRecord,
} from '../../types/categoryMarketing'
import { appToast } from '../../lib/appToast'
import { useIndustryServicePagesCatalog } from './IndustryServicePagesContext'
import { useServiceCatalogLocalities } from '../../hooks/useServiceCatalogLocalities'
import { CategoryMarketingPageHealthPanel } from '../../components/cms/CategoryMarketingPageHealthPanel'
import { CategoryMarketingWriterToolbar } from '../../components/cms/CategoryMarketingWriterToolbar'
import { CategoryMarketingWriterSection } from '../../components/cms/CategoryMarketingWriterSection'
import { CategoryMarketingCompactTabsList } from '../../components/cms/CategoryMarketingCompactTabs'
import { CategoryMarketingAdvancedTools } from '../../components/cms/CategoryMarketingAdvancedTools'
import { CategoryMarketingPricingPanel } from '../../components/cms/CategoryMarketingPricingPanel'
import {
  applyPricingPatchToCategoryMarketingBlob,
  prepareCategoryMarketingSliceForApi,
  type CategoryMarketingPricingPatch,
} from '../../lib/categoryMarketingApiSave'
import { SeoContentLengthHint } from '../../components/cms/SeoContentLengthHint'
import { localitySlugFromCompositeKey } from '../../lib/categoryMarketingCoverageOverview'
import { diffCategoryMarketingConfigs } from '../../lib/categoryMarketingConfigDiff'
import { buildLocalitySeoAutofillPack } from '../../lib/categoryMarketingSeoAutofill'
import { detectSeoTitleIssue } from '../../lib/seoTitleQuality'
import {
  PRODUCTION_INDEXABLE_ROBOTS_META,
  resolveConsumerRobotsPreview,
} from '../../lib/consumerRobotsPreview'
import { filterValidBreadcrumbItems } from '../../lib/breadcrumbSchema'
import { ELECTRICIAN_SERVICE_SEO_CHECKLIST } from '../../lib/electricalCategorySeoChecklist'
import { resolveMarketingVerticalKey } from '../../lib/categoryMarketingVerticalPrefill'
import {
  buildServiceLocalityPublicPath,
  getPreferredServiceCategoryUrlSlug,
} from '../../lib/serviceCatalogUrlSlugs'
import {
  assessNapCitationsReadiness,
  assessNearMeSeoReadiness,
  buildDefaultNearMeSeoCopy,
  resolveNearMePreviewUrl,
} from '../../lib/nearMeSeo'
import {
  analyzeCategoryMarketingLengthWarnings,
  buildCategoryMarketingQualityReport,
  CATEGORY_MARKETING_LENGTH,
  lengthWarningsNeedAttention,
} from '../../lib/categoryMarketingContentQuality'
import { evaluateLength } from '../../lib/seoLandingContentLengthRules'
import type { TabKey } from './categoryMarketingTabConfig'

/** Consumer site origin — placeholders and checklist copy only. */
const PROFIXER_PUBLIC_ORIGIN = 'https://www.profixer.in/'

function charCountColor(len: number, min: number, optimal: number, hard: number): string {
  if (len > hard) return 'text-destructive'
  if (len > optimal) return 'text-bloom-coral'
  if (len >= min) return 'text-storm-deep'
  return 'text-muted-foreground'
}

/**
 * NAP field validators. Each returns `null` when valid (including empty, since blank falls back to
 * the registered-office NAP in schema) or a short error string to show inline. Format-only checks —
 * Google's Rich Results test remains the source of truth for the rendered JSON-LD.
 */
function napPhoneError(v: string): string | null {
  const t = v.trim()
  if (!t) return null
  // Accept E.164 (+91…) or a 10-digit Indian mobile; tolerate spaces / hyphens between digits.
  const digits = t.replace(/[\s-]/g, '')
  if (!/^\+?[0-9]{8,15}$/.test(digits)) return 'Use digits only, e.g. +919812345678 or 9812345678.'
  return null
}

function napPostalCodeError(v: string, countryCode: string): string | null {
  const t = v.trim()
  if (!t) return null
  const cc = countryCode.trim().toUpperCase()
  if (cc === '' || cc === 'IN') {
    if (!/^[1-9][0-9]{5}$/.test(t)) return 'Indian PIN is 6 digits (no leading zero), e.g. 401107.'
  }
  return null
}

function napCountryCodeError(v: string): string | null {
  const t = v.trim()
  if (!t) return null
  if (!/^[A-Z]{2}$/.test(t.toUpperCase())) return 'Use a 2-letter ISO country code, e.g. IN.'
  return null
}

function napPriceRangeError(v: string): string | null {
  const t = v.trim()
  if (!t) return null
  // Qualitative form: 1–4 currency symbols only, e.g. ₹ / ₹₹ / ₹₹₹.
  if (/^[₹$€£]{1,4}$/.test(t)) return null
  if (/\d/.test(t)) {
    // "₹₹99" style — repeated symbol glued to a number is neither a clean band nor a range.
    if (/[₹$€£]{2,}/.test(t)) return 'Use symbols only (₹₹) OR a numeric range (₹149 – ₹5000), not both.'
    // A number with no range reads ambiguously; nudge toward a band.
    if (!/[-–—+]|to/i.test(t)) return 'Give a range, e.g. ₹149 – ₹5000 (or just ₹ / ₹₹ / ₹₹₹).'
  }
  return null
}

function napGeoError(v: string): string | null {
  const t = v.trim()
  if (!t) return null
  const parts = t.split(',').map((s) => s.trim())
  if (parts.length !== 2) return 'Format is "lat,lng", e.g. 19.2856,72.8691.'
  const lat = Number(parts[0])
  const lng = Number(parts[1])
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return 'Latitude and longitude must be numbers.'
  if (Math.abs(lat) > 90) return 'Latitude must be between -90 and 90.'
  if (Math.abs(lng) > 180) return 'Longitude must be between -180 and 180.'
  return null
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
  const [localityDiffExpanded, setLocalityDiffExpanded] = useState(false)
  const [seoAutofillConfirmOpen, setSeoAutofillConfirmOpen] = useState(false)
  const [advancedToolsOpen, setAdvancedToolsOpen] = useState(false)
  const [searchParams] = useSearchParams()

  const normalizedLocalitySlug = useMemo(
    () =>
      localitySlugForKey
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9-]+/g, '-')
        .replace(/^-|-$/g, ''),
    [localitySlugForKey],
  )

  const effectiveKey = useMemo(() => {
    if (!normalizedLocalitySlug) return selectedCategory
    return `${selectedCategory}__${normalizedLocalitySlug}`
  }, [selectedCategory, normalizedLocalitySlug])

  useEffect(() => {
    setLocalityDiffExpanded(false)
  }, [effectiveKey])

  const sortedManagedLocalities = useMemo(
    () =>
      [...managedLocalities].sort(
        (a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }),
      ),
    [managedLocalities],
  )

  const localitySelectValue = useMemo(() => {
    if (!normalizedLocalitySlug) return emptyCustomSlugMode ? '__custom__' : '__none__'
    if (sortedManagedLocalities.some((l) => l.slug === normalizedLocalitySlug)) return normalizedLocalitySlug
    return '__custom__'
  }, [normalizedLocalitySlug, sortedManagedLocalities, emptyCustomSlugMode])

  const catalogSelectAllowed = useMemo(() => catalogOptions.map((o) => o.value), [catalogOptions])
  const catalogSelectValue = useMemo(
    () => selectValueWhenListed(selectedCategory, catalogSelectAllowed),
    [selectedCategory, catalogSelectAllowed],
  )

  const localitySelectAllowed = useMemo(
    () => ['__none__', '__custom__', ...sortedManagedLocalities.map((l) => l.slug)] as const,
    [sortedManagedLocalities],
  )
  const safeLocalitySelectValue = useMemo(
    () => selectValueWhenListed(localitySelectValue, localitySelectAllowed),
    [localitySelectValue, localitySelectAllowed],
  )

  const industryLabel = useMemo(
    () => catalogOptions.find((o) => o.value === selectedCategory)?.label ?? selectedCategory,
    [catalogOptions, selectedCategory],
  )

  const localityDisplayLabel = useMemo(() => {
    if (!normalizedLocalitySlug) return 'All areas (default)'
    const hit = sortedManagedLocalities.find((l) => l.slug === normalizedLocalitySlug)
    if (hit) return hit.name
    return normalizedLocalitySlug
      .split('-')
      .filter(Boolean)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ')
  }, [normalizedLocalitySlug, sortedManagedLocalities])

  const publicSiteOrigin = useMemo(
    () =>
      (typeof process !== 'undefined' && process.env.REACT_APP_PUBLIC_SITE_ORIGIN
        ? String(process.env.REACT_APP_PUBLIC_SITE_ORIGIN).replace(/\/$/, '')
        : '') || PROFIXER_PUBLIC_ORIGIN.replace(/\/$/, ''),
    [],
  )

  const openSavedStorageKey = useCallback(
    (storageKey: string) => {
      const locSuffix = localitySlugFromCompositeKey(selectedCategory, storageKey)
      if (locSuffix === null) return
      if (locSuffix === '') {
        setLocalitySlugForKey('')
        setEmptyCustomSlugMode(false)
      } else {
        setLocalitySlugForKey(locSuffix)
        setEmptyCustomSlugMode(false)
      }
      window.scrollTo({ top: 0, behavior: 'smooth' })
    },
    [selectedCategory],
  )

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    const loc = searchParams.get('locality')?.trim()
    if (loc) {
      setLocalitySlugForKey(loc)
      setEmptyCustomSlugMode(false)
    }
    if (searchParams.get('section') === 'near-me') {
      setTab('metadata')
      const timer = window.setTimeout(() => {
        document.getElementById('near-me-seo-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, loading ? 600 : 200)
      return () => window.clearTimeout(timer)
    }
    return undefined
  }, [searchParams, loading])

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

  /** Always merged so API/import quirks never leave `.map`/`.filter` targets undefined at runtime. */
  const config = useMemo(() => mergeCategoryConfig(data[effectiveKey] ?? {}), [data, effectiveKey])

  const qualityCtx = useMemo(
    () => ({
      isLocalKey: Boolean(normalizedLocalitySlug),
      industryLabel,
      localityDisplayLabel,
      effectiveKey,
    }),
    [normalizedLocalitySlug, industryLabel, localityDisplayLabel, effectiveKey],
  )

  const qualityReport = useMemo(
    () => buildCategoryMarketingQualityReport(config, qualityCtx),
    [config, qualityCtx],
  )
  const lengthWarnings = useMemo(
    () => analyzeCategoryMarketingLengthWarnings(config, qualityCtx),
    [config, qualityCtx],
  )
  const lengthIssueCount = lengthWarningsNeedAttention(lengthWarnings).length

  const tabNeedsAttention = useCallback(
    (t: TabKey) =>
      qualityReport.items.some((i) => i.tab === t && !i.ok && i.priority === 'required') ||
      lengthWarnings.some((w) => w.tab === t && w.severity !== 'ok'),
    [qualityReport.items, lengthWarnings],
  )

  const updateConfig = (updates: Partial<CategoryMarketingConfig>) => {
    setData((prev) => {
      const base = mergeCategoryConfig(prev[effectiveKey] ?? {})
      const nextRaw: CategoryMarketingConfig = {
        ...base,
        ...updates,
        leadMagnet: updates.leadMagnet
          ? { ...base.leadMagnet, ...updates.leadMagnet }
          : base.leadMagnet,
        localityGuide: updates.localityGuide
          ? { ...base.localityGuide, ...updates.localityGuide }
          : base.localityGuide,
        localSeo: updates.localSeo ? { ...base.localSeo, ...updates.localSeo } : base.localSeo,
        nearMeSeo: updates.nearMeSeo ? { ...base.nearMeSeo, ...updates.nearMeSeo } : base.nearMeSeo,
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
      const next = mergeCategoryConfig(nextRaw)
      return { ...prev, [effectiveKey]: next }
    })
  }

  const updateLocalityGuide = (updates: Partial<LocalityGuideCmsFields>) => {
    updateConfig({ localityGuide: { ...config.localityGuide, ...updates } })
  }

  const updateLocalSeo = (updates: Partial<LocalSeoCmsFields>) => {
    updateConfig({ localSeo: { ...config.localSeo, ...updates } })
  }

  const updateNearMeSeo = (updates: Partial<NearMeSeoCmsFields>) => {
    updateConfig({ nearMeSeo: { ...config.nearMeSeo, ...updates } })
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

  const industryRobotsMeta = useMemo(
    () => mergeCategoryConfig(data[selectedCategory] ?? emptyCategoryMarketingConfig()).technicalSeo.robotsMeta,
    [data, selectedCategory],
  )

  const showElectricianSeoChecklist = resolveMarketingVerticalKey(selectedCategory) === 'electrician'

  const applyProductionIndexableRobots = () => {
    updateTechnicalSeo({ robotsMeta: PRODUCTION_INDEXABLE_ROBOTS_META })
    appToast('Set production indexable robots on this key. Save to publish.', 'success')
  }

  const fixAllLocalityNoindexKeys = () => {
    const prefix = `${selectedCategory}__`
    let touched = 0
    const next: Record<string, CategoryMarketingConfig> = { ...data }
    for (const key of Object.keys(next)) {
      if (!key.startsWith(prefix)) continue
      const row = mergeCategoryConfig(next[key] ?? emptyCategoryMarketingConfig())
      if (!row.technicalSeo.robotsMeta.toLowerCase().includes('noindex')) continue
      next[key] = mergeCategoryConfig({
        ...row,
        technicalSeo: { ...row.technicalSeo, robotsMeta: PRODUCTION_INDEXABLE_ROBOTS_META },
      })
      touched += 1
    }
    setData(next)
    if (normalizedLocalitySlug) {
      updateTechnicalSeo({ robotsMeta: PRODUCTION_INDEXABLE_ROBOTS_META })
    }
    appToast(
      touched > 0
        ? `Updated robots on ${touched} locality key(s). Review and Save.`
        : 'No locality keys with noindex found for this industry.',
      touched > 0 ? 'success' : 'info',
    )
  }

  const applySeoAutofillPack = () => {
    if (!normalizedLocalitySlug) return
    const pack = buildLocalitySeoAutofillPack({
      industrySlug: selectedCategory,
      industryLabel,
      localitySlug: normalizedLocalitySlug,
      localityLabel: localityDisplayLabel,
      publicOrigin: publicSiteOrigin,
    })
    updateConfig(pack)
    appToast(
      'Starter pack applied across tabs — review and replace placeholders (hours, NAP, images, prices), then Save.',
      'success',
    )
    setTab('metadata')
    setSeoAutofillConfirmOpen(false)
  }

  const applyNearMeDefaults = () => {
    const defaults = buildDefaultNearMeSeoCopy({
      industryLabel,
      localityLabel: normalizedLocalitySlug ? localityDisplayLabel : undefined,
      localitySlug: normalizedLocalitySlug || undefined,
      publicOrigin: publicSiteOrigin,
      storageSlug: selectedCategory,
    })
    updateNearMeSeo(defaults)
    appToast('Near-me SEO defaults applied — review canonical strategy, then Save.', 'success')
  }

  const nearMePreviewUrl = useMemo(
    () => resolveNearMePreviewUrl(selectedCategory, normalizedLocalitySlug, publicSiteOrigin),
    [selectedCategory, normalizedLocalitySlug, publicSiteOrigin],
  )

  const servicesPreviewUrl = useMemo(() => {
    const o = publicSiteOrigin.replace(/\/$/, '')
    if (normalizedLocalitySlug) {
      return `${o}${buildServiceLocalityPublicPath(selectedCategory, normalizedLocalitySlug)}`
    }
    return `${o}/services/${getPreferredServiceCategoryUrlSlug(selectedCategory)}`
  }, [publicSiteOrigin, selectedCategory, normalizedLocalitySlug])

  const seoReadinessRows = useMemo(() => {
    type Tone = 'ok' | 'warn' | 'info'
    const rows: { tone: Tone; title: string; detail: string }[] = []
    const tLen = config.seoTitle.trim().length
    const mLen = config.metaDescription.trim().length
    const isLocalKey = Boolean(normalizedLocalitySlug)
    const can = config.technicalSeo.canonicalUrl.trim()
    const faqFilled = config.faqs.filter((f) => f.question.trim() && f.answer.trim()).length
    const sumLen = config.technicalSeo.answerEngineSummary.trim()

    if (tLen === 0) {
      rows.push({
        tone: 'warn',
        title: 'SEO title',
        detail: 'Empty — the live site may fall back to a generic title.',
      })
    } else if (tLen < SEO_TITLE_MIN_CHARS) {
      rows.push({
        tone: 'warn',
        title: 'SEO title',
        detail: `Short (${tLen} chars). Aim for at least ${SEO_TITLE_MIN_CHARS} so the SERP snippet states offer + area.`,
      })
    } else if (tLen > SEO_TITLE_HARD_MAX_CHARS) {
      rows.push({
        tone: 'warn',
        title: 'SEO title',
        detail: `Likely truncated (${tLen} chars). Stay near or below ~${SEO_TITLE_HARD_MAX_CHARS} visible characters.`,
      })
    } else {
      rows.push({
        tone: tLen > SEO_TITLE_OPTIMAL_MAX_CHARS ? 'info' : 'ok',
        title: 'SEO title',
        detail:
          tLen > SEO_TITLE_OPTIMAL_MAX_CHARS
            ? `Within limits; may still truncate on narrow devices (${tLen} chars).`
            : `Length in a healthy band (${tLen} chars).`,
      })
    }

    /*
     * Structural guardrail (mirrors the live site's `isUsableCmsDocumentTitle`).
     * Validates the title AS THE LIVE SITE WILL RENDER IT — after [City]/
     * [Location]/[ServiceName] tokens resolve. Catches the production bug where
     * "Electrician in [City]" on a non-locality key collapsed to "Electrician in"
     * and shipped "…— Electrician in | ProFixer.in" to search results.
     */
    if (tLen > 0) {
      const titleIssue = detectSeoTitleIssue(config.seoTitle, {
        city: isLocalKey ? localityDisplayLabel : '',
        location: isLocalKey ? localityDisplayLabel : '',
        serviceName: industryLabel,
      })
      if (titleIssue) {
        rows.push({
          tone: 'warn',
          title: 'SEO title structure',
          detail: titleIssue.detail,
        })
      }
    }

    if (mLen === 0) {
      rows.push({
        tone: 'warn',
        title: 'Meta description',
        detail: 'Empty — you lose control of the snippet; add a benefit-led line with a soft CTA.',
      })
    } else if (mLen < META_DESC_MIN_CHARS) {
      rows.push({
        tone: 'warn',
        title: 'Meta description',
        detail: `Thin (${mLen} chars). Aim for ~${META_DESC_MIN_CHARS}–${META_DESC_OPTIMAL_MAX_CHARS} to use the full snippet.`,
      })
    } else if (mLen > META_DESC_HARD_MAX_CHARS) {
      rows.push({
        tone: 'warn',
        title: 'Meta description',
        detail: `Often truncated (${mLen} chars). Target ≤ ~${META_DESC_HARD_MAX_CHARS} characters.`,
      })
    } else {
      rows.push({
        tone: mLen > META_DESC_OPTIMAL_MAX_CHARS ? 'info' : 'ok',
        title: 'Meta description',
        detail:
          mLen > META_DESC_OPTIMAL_MAX_CHARS
            ? `Long but acceptable; check preview (${mLen} chars).`
            : `Good use of snippet space (${mLen} chars).`,
      })
    }

    if (!config.primaryKeyword.trim()) {
      rows.push({
        tone: 'warn',
        title: 'Primary keyword',
        detail: 'Set one head term so H1, intro, and internal language match the query you want to win.',
      })
    } else {
      rows.push({
        tone: 'ok',
        title: 'Primary keyword',
        detail: `“${config.primaryKeyword.trim()}” is set.`,
      })
    }

    if (isLocalKey) {
      if (!/^https?:\/\//i.test(can)) {
        rows.push({
          tone: 'warn',
          title: 'Canonical URL',
          detail: `Hyperlocal key “${effectiveKey}”: set one absolute URL (e.g. ${PROFIXER_PUBLIC_ORIGIN}/services/...) so Google merges signals.`,
        })
      } else {
        rows.push({
          tone: 'ok',
          title: 'Canonical URL',
          detail: 'Absolute canonical — helps consolidate locality variants and tracking params.',
        })
      }
    } else {
      rows.push({
        tone: 'info',
        title: 'Canonical URL',
        detail: `Industry-wide template: optional here; locality overrides should almost always set canonical on ${PROFIXER_PUBLIC_ORIGIN}.`,
      })
    }

    if (sumLen.length < 40) {
      rows.push({
        tone: 'warn',
        title: 'Answer-engine summary',
        detail: 'Technical SEO: add 2–4 factual sentences (who, where, what is included). Helps AI overviews and SERP clarity.',
      })
    } else {
      rows.push({
        tone: 'ok',
        title: 'Answer-engine summary',
        detail: `~${sumLen.length} characters of answer-first copy.`,
      })
    }

    if (faqFilled === 0) {
      rows.push({
        tone: 'warn',
        title: 'FAQ content',
        detail: 'No complete Q&A pairs in this record — use the FAQs tab (rich results + long-tail coverage).',
      })
    } else {
      rows.push({
        tone: 'ok',
        title: 'FAQ content',
        detail: `${faqFilled} complete FAQ(s); pair with consumer FAQPage schema when enabled.`,
      })
    }

    const ogOverride = config.localSeo.ogImageOverride.trim()
    const ogAlt = config.technicalSeo.ogImageAlt.trim()
    if (ogOverride && !ogAlt) {
      rows.push({
        tone: 'warn',
        title: 'Social preview image',
        detail: 'Local SEO has a share image URL but OG image alt is empty — add descriptive alt text under Technical SEO.',
      })
    } else if (ogOverride && ogAlt) {
      rows.push({
        tone: 'ok',
        title: 'Social preview image',
        detail: 'Image URL and alt are set — better for accessibility, shares, and image-related signals.',
      })
    }

    const ar = config.technicalSeo.aggregateRating
    if (ar.ratingValue.trim() || ar.reviewCount.trim()) {
      rows.push({
        tone: 'info',
        title: 'Aggregate rating',
        detail: 'Schema fields are filled — only keep if the same numbers appear visibly on this URL (Google structured-data policy).',
      })
    }

    const industryRobots = mergeCategoryConfig(data[selectedCategory] ?? emptyCategoryMarketingConfig())
      .technicalSeo.robotsMeta
    const consumerRobots = resolveConsumerRobotsPreview({
      isLocalityKey: isLocalKey,
      catalogStorageSlug: selectedCategory,
      localityRobotsMeta: config.technicalSeo.robotsMeta,
      industryRobotsMeta: industryRobots,
    })
    if (consumerRobots.tone === 'ok') {
      rows.push({
        tone: 'ok',
        title: 'Robots (live site)',
        detail: consumerRobots.effectiveLabel,
      })
    } else {
      rows.push({
        tone: 'warn',
        title: 'Robots (live site)',
        detail: consumerRobots.detail,
      })
    }
    const preferredSlug = getPreferredServiceCategoryUrlSlug(selectedCategory)
    if (isLocalKey && config.technicalSeo.canonicalUrl.trim()) {
      const expected = `${publicSiteOrigin}${buildServiceLocalityPublicPath(selectedCategory, normalizedLocalitySlug)}`
      if (config.technicalSeo.canonicalUrl.trim() !== expected) {
        rows.push({
          tone: 'warn',
          title: 'Canonical URL',
          detail: `Prefer ${expected} (public path uses /services/${preferredSlug}/…, not the raw CMS catalog slug).`,
        })
      }
    }

    for (const nm of assessNearMeSeoReadiness(config, {
      industryLabel,
      localityLabel: localityDisplayLabel,
      nearMeUrl: nearMePreviewUrl,
      servicesUrl: servicesPreviewUrl,
    })) {
      rows.push(nm)
    }

    for (const nap of assessNapCitationsReadiness(config)) {
      rows.push(nap)
    }

    const warnCount = rows.filter((r) => r.tone === 'warn').length
    const okCount = rows.filter((r) => r.tone === 'ok').length
    return { rows, warnCount, okCount }
  }, [config, data, normalizedLocalitySlug, effectiveKey, publicSiteOrigin, selectedCategory, industryLabel, localityDisplayLabel, nearMePreviewUrl, servicesPreviewUrl])

  const localityVersusIndustryDiff = useMemo(() => {
    if (!normalizedLocalitySlug || loading) return null
    const industry = mergeCategoryConfig(data[selectedCategory] ?? emptyCategoryMarketingConfig())
    const locality = mergeCategoryConfig(config)
    const rows = diffCategoryMarketingConfigs(industry, locality)
    const hasSavedIndustryKey = selectedCategory in data
    return { rows, hasSavedIndustryKey }
  }, [config, data, loading, normalizedLocalitySlug, selectedCategory])

  const handleSave = async () => {
    try {
      setSaving(true)
      const configToSave = prepareCategoryMarketingSliceForApi({
        ...config,
        technicalSeo: {
          ...config.technicalSeo,
          breadcrumbItems: filterValidBreadcrumbItems(config.technicalSeo.breadcrumbItems),
        },
      })
      const payload = { ...data, [effectiveKey]: configToSave }
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

  const persistPricingToApi = useCallback(
    async (patch: CategoryMarketingPricingPatch) => {
      const mergedLocal = prepareCategoryMarketingSliceForApi(
        mergeCategoryConfig({ ...config, ...patch }),
      )
      const payload = applyPricingPatchToCategoryMarketingBlob(
        { ...data, [effectiveKey]: mergedLocal },
        selectedCategory,
        patch,
        normalizedLocalitySlug || null,
      )
      await CMSService.updateCategoryMarketing(payload)
      setData(payload)
    },
    [config, data, effectiveKey, normalizedLocalitySlug, selectedCategory],
  )

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
    <div className="space-y-3 pb-8">
      {!industryHub && (
        <PageHeader
          title="Industry service pages"
          subtitle="Write landing copy per industry and location. Use [City], [Location], [ServiceName] in text fields."
          action={
            <Button
              variant="default"
              size="sm"
              leftIcon={saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Megaphone className="h-4 w-4" />}
              onClick={handleSave}
              disabled={saving}
            >
              Save
            </Button>
          }
        />
      )}

      <CategoryMarketingWriterToolbar
        industryLabel={industryLabel}
        selectedCategory={selectedCategory}
        effectiveKey={effectiveKey}
        localityDisplayLabel={localityDisplayLabel}
        normalizedLocalitySlug={normalizedLocalitySlug}
        localitySlugForKey={localitySlugForKey}
        localitySelectValue={localitySelectValue}
        safeLocalitySelectValue={safeLocalitySelectValue}
        sortedManagedLocalities={sortedManagedLocalities}
        managedLocalitiesLoading={managedLocalitiesLoading}
        managedLocalitiesError={managedLocalitiesError}
        emptyCustomSlugMode={emptyCustomSlugMode}
        industryHub={Boolean(industryHub)}
        catalogSelectValue={catalogSelectValue}
        catalogOptions={catalogOptions}
        catalogOptionsLoading={catalogOptionsLoading}
        saving={saving}
        qualityScore={qualityReport.score}
        qualityLabel={qualityReport.statusLabel}
        qualityVariant={qualityReport.statusVariant}
        lengthIssueCount={lengthIssueCount}
        onSave={() => void handleSave()}
        onAutofill={() => setSeoAutofillConfirmOpen(true)}
        onCategoryChange={(v) => {
          setSelectedCategory(v)
          setLocalitySlugForKey('')
          setEmptyCustomSlugMode(false)
        }}
        onLocalitySelect={(v) => {
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
        onLocalitySlugChange={setLocalitySlugForKey}
        onLocalitySlugBlur={() => {
          setLocalitySlugForKey((s) =>
            s
              .trim()
              .toLowerCase()
              .replace(/[^a-z0-9-]+/g, '-')
              .replace(/^-|-$/g, ''),
          )
          setEmptyCustomSlugMode(false)
        }}
      />

      {!normalizedLocalitySlug ? (
        <p className="text-xs text-muted-foreground">
          Pick a <strong className="font-medium text-foreground">location</strong> to unlock locality starter pack and hyperlocal fields.
        </p>
      ) : null}

      {loading ? (
        <div className="flex min-h-[280px] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 xl:grid-cols-[minmax(0,1fr)_240px]">
          <div className="flex min-w-0 flex-col gap-2">
          <div className="xl:hidden">
            <CategoryMarketingPageHealthPanel
              report={qualityReport}
              lengthWarnings={lengthWarnings}
              onNavigateTab={setTab}
              compact
            />
          </div>
          <Tabs value={tab} onValueChange={(v) => setTab(v as TabKey)} className="w-full">
            <CategoryMarketingCompactTabsList tabNeedsAttention={tabNeedsAttention} />

            <TabsContent value="metadata" className="mt-2 space-y-3 px-0 outline-none">
              <div className="flex flex-col gap-3">
                {(seoReadinessRows.warnCount > 0 || seoReadinessRows.rows.some((r) => r.tone === 'info')) ? (
                  <Accordion type="single" collapsible className="rounded-lg border border-border/70">
                    <AccordionItem value="seo-checks" className="border-0">
                      <AccordionTrigger className="px-3 py-2 text-sm hover:no-underline">
                        <span className="flex items-center gap-2">
                          SEO checks
                          {seoReadinessRows.warnCount > 0 ? (
                            <Badge variant="warning">{seoReadinessRows.warnCount} to fix</Badge>
                          ) : (
                            <Badge variant="secondary">Optional tips</Badge>
                          )}
                        </span>
                      </AccordionTrigger>
                      <AccordionContent className="space-y-2 px-3 pb-3">
                        {seoReadinessRows.rows
                          .filter((r) => r.tone !== 'ok')
                          .map((row, idx) => (
                            <div key={`${row.title}-${idx}`} className="flex gap-2 rounded-md border border-border/60 bg-muted/20 p-2 text-xs">
                              {row.tone === 'warn' ? (
                                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600" aria-hidden />
                              ) : (
                                <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden />
                              )}
                              <div>
                                <p className="font-medium text-foreground">{row.title}</p>
                                <p className="mt-0.5 text-muted-foreground">{row.detail}</p>
                              </div>
                            </div>
                          ))}
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                ) : null}

                <CategoryMarketingWriterSection
                  title="Search snippet"
                  hint="Title and description for Google. Tokens: [City], [Location], [ServiceName]."
                >
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
                      <SeoContentLengthHint
                        warning={evaluateLength(
                          'cm-seo-title-inline',
                          'SEO title',
                          config.seoTitle,
                          CATEGORY_MARKETING_LENGTH.metaTitle,
                        )}
                        compact
                      />
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
                      <SeoContentLengthHint
                        warning={evaluateLength(
                          'cm-meta-desc-inline',
                          'Meta description',
                          config.metaDescription,
                          CATEGORY_MARKETING_LENGTH.metaDescription,
                        )}
                        compact
                      />
                      <div className="space-y-2">
                      <Label htmlFor="cmm-f-5">URL slug pattern</Label>
                      <Input
                        id="cmm-f-5"
                        className="w-full"
                        value={config.urlSlugPattern}
                        onChange={(e) => updateConfig({ urlSlugPattern: e.target.value })}
                        placeholder={`${PROFIXER_PUBLIC_ORIGIN.replace(/^https:\/\//, '')}/services/ac-repair/[city-slug]`}
                      />
                      <p className="text-xs text-muted-foreground">Pattern for the consumer site; actual routing may use params.</p>
                    </div>
                      <div className="space-y-2">
                      <Label htmlFor="cmm-f-6">Primary keyword</Label>
                      <Input id="cmm-f-6" className="w-full" value={config.primaryKeyword} onChange={(e) => updateConfig({ primaryKeyword: e.target.value })} />
                    </div>
                </CategoryMarketingWriterSection>

                <CategoryMarketingWriterSection title="Hero microcopy" hint="Trust pill, highlight line, and proof points above the fold.">
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
                </CategoryMarketingWriterSection>

                <Accordion type="single" collapsible className="rounded-lg border border-border/70">
                  <AccordionItem value="technical-seo" className="border-0">
                    <AccordionTrigger className="px-3 py-2 text-sm hover:no-underline">
                      Technical SEO <span className="ml-2 text-xs font-normal text-muted-foreground">(canonical, OG, schema — optional)</span>
                    </AccordionTrigger>
                    <AccordionContent className="space-y-3 px-1 pb-3">
                <CategoryMarketingWriterSection title="Canonical & social tags" hint="Leave blank to fall back to SEO title and meta description.">
                      <div className="space-y-2">
                      <Label htmlFor="cmm-f-12">Canonical URL</Label>
                      <Input
                        id="cmm-f-12"
                        className="w-full"
                        value={config.technicalSeo.canonicalUrl}
                        onChange={(e) => updateTechnicalSeo({ canonicalUrl: e.target.value })}
                        placeholder={`${PROFIXER_PUBLIC_ORIGIN}/services/ac-repair/mumbai`}
                      />
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
                      <Input id="cmm-f-17" className="w-full" value={config.technicalSeo.twitterSite} onChange={(e) => updateTechnicalSeo({ twitterSite: e.target.value.replace(/^@/, '') })} placeholder="profixer_in" />
                    </div>
                        <div className="space-y-2">
                      <Label htmlFor="cmm-f-18">Twitter creator (@handle optional)</Label>
                      <Input id="cmm-f-18" className="w-full" value={config.technicalSeo.twitterCreator} onChange={(e) => updateTechnicalSeo({ twitterCreator: e.target.value.replace(/^@/, '') })} placeholder="founder_handle" />
                    </div>
                      </div>
                </CategoryMarketingWriterSection>

                <CategoryMarketingWriterSection title="Robots & breadcrumbs" hint="Production pages: index, follow.">
                      <div className="space-y-2">
                      <Label htmlFor="cmm-f-19">Robots meta content</Label>
                      <Input
                        id="cmm-f-19"
                        className="w-full"
                        value={config.technicalSeo.robotsMeta}
                        onChange={(e) => updateTechnicalSeo({ robotsMeta: e.target.value })}
                        placeholder={PRODUCTION_INDEXABLE_ROBOTS_META}
                      />
                      <p className="text-xs text-muted-foreground">
                        Production locality pages should use <strong>index, follow</strong> (recommended string above).
                        fixer-client ignores accidental <code className="text-[11px]">noindex</code> on canonical URLs like{' '}
                        <code className="text-[11px]">/services/electrician/mumbai</code> — but clear it here to avoid duplicate meta tags.
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <Button type="button" variant="secondary" size="sm" onClick={applyProductionIndexableRobots}>
                          Apply indexable robots (this key)
                        </Button>
                        <Button type="button" variant="outline" size="sm" onClick={fixAllLocalityNoindexKeys}>
                          Fix all locality keys with noindex
                        </Button>
                      </div>
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
                            }} placeholder={`${PROFIXER_PUBLIC_ORIGIN}/services/ac-repair/mumbai`} />
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
                        Breadcrumb trail (name + absolute URL per item). Incomplete rows are stripped on save.
                        Leave empty to use the consumer&apos;s default trail (Home → Services → hub → locality).
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
                            }} placeholder={`${PROFIXER_PUBLIC_ORIGIN}/services/ac-repair/mumbai`} />
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
                </CategoryMarketingWriterSection>

                <CategoryMarketingWriterSection title="Structured data & answer engines" hint="Schema toggles and entity hints for JSON-LD.">
                      <div className="space-y-2">
                      <Label htmlFor="cmm-f-24">Primary schema.org @type hint</Label>
                      <Input id="cmm-f-24" className="w-full" value={config.technicalSeo.schemaPrimaryType} onChange={(e) => updateTechnicalSeo({ schemaPrimaryType: e.target.value })} placeholder="ProfessionalService or HomeAndConstructionBusiness" />
                      <p className="text-xs text-muted-foreground">Consumer maps this to Service / LocalBusiness typing. Choosing a LocalBusiness type (e.g. HomeAndConstructionBusiness) auto-fills telephone, price range, address &amp; image from the Local SEO fields below (registered-office NAP when blank).</p>
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
                      <SeoContentLengthHint
                        warning={evaluateLength(
                          'cm-answer-inline',
                          'Answer-engine summary',
                          config.technicalSeo.answerEngineSummary,
                          CATEGORY_MARKETING_LENGTH.answerSummary,
                        )}
                        compact
                      />
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
                </CategoryMarketingWriterSection>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>

                <CategoryMarketingWriterSection
                  id="near-me-seo-section"
                  title="Near-me page"
                  hint="Overrides for /near-me/ URLs. Hyperlocal copy needs a composite storage key (industry__locality)."
                  actions={
                    <Button type="button" size="sm" variant="outline" onClick={applyNearMeDefaults}>
                      Defaults
                    </Button>
                  }
                >
                    <p className="text-xs text-muted-foreground">
                      Live:{' '}
                      <a href={nearMePreviewUrl} target="_blank" rel="noopener noreferrer" className="font-mono text-foreground underline-offset-2 hover:underline">
                        {nearMePreviewUrl.replace(publicSiteOrigin, '') || nearMePreviewUrl}
                      </a>
                      {' · '}
                      Service: <span className="font-mono">{servicesPreviewUrl.replace(publicSiteOrigin, '')}</span>
                    </p>
                    <div className="space-y-2">
                      <Label htmlFor="cmm-nearme-title">Near-me page title (H1 / meta title)</Label>
                      <Input
                        id="cmm-nearme-title"
                        className="w-full"
                        value={config.nearMeSeo.title}
                        onChange={(e) => updateNearMeSeo({ title: e.target.value })}
                        placeholder="AC service near me in Mira Bhayandar"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cmm-nearme-desc">Near-me meta description</Label>
                      <Textarea
                        id="cmm-nearme-desc"
                        className="w-full"
                        rows={2}
                        value={config.nearMeSeo.description}
                        onChange={(e) => updateNearMeSeo({ description: e.target.value })}
                        placeholder="Book verified AC technicians near you in Mira Bhayandar with transparent pricing…"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cmm-nearme-kw">Near-me keywords (comma separated)</Label>
                      <Input
                        id="cmm-nearme-kw"
                        className="w-full"
                        value={config.nearMeSeo.keywords.join(', ')}
                        onChange={(e) =>
                          updateNearMeSeo({
                            keywords: e.target.value
                              .split(',')
                              .map((s) => s.trim())
                              .filter(Boolean),
                          })
                        }
                        placeholder="ac service near me, ac repair near mira bhayandar"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cmm-nearme-canonical">Canonical path (near-me URL)</Label>
                      <Input
                        id="cmm-nearme-canonical"
                        className="w-full font-mono text-sm"
                        value={config.nearMeSeo.canonicalPath}
                        onChange={(e) => updateNearMeSeo({ canonicalPath: e.target.value })}
                        placeholder={nearMePreviewUrl.replace(publicSiteOrigin, '')}
                      />
                      <p className="text-xs text-muted-foreground">
                        Blank = self-canonical. To avoid cannibalization with the service page, set{' '}
                        <code className="text-xs">
                          {buildServiceLocalityPublicPath(
                            selectedCategory,
                            normalizedLocalitySlug || 'mira-bhayandar',
                          )}
                        </code>
                        .
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cmm-nearme-robots">Robots override (near-me only)</Label>
                      <Input
                        id="cmm-nearme-robots"
                        className="w-full font-mono text-sm"
                        value={config.nearMeSeo.robotsMeta}
                        onChange={(e) => updateNearMeSeo({ robotsMeta: e.target.value })}
                        placeholder="index, follow"
                      />
                    </div>
                    <CategoryMarketingRichTextField
                      label="Near-me intro (body HTML — renders below hero on live page)"
                      value={config.nearMeSeo.introHtml}
                      onChange={(html) => updateNearMeSeo({ introHtml: html })}
                      height={180}
                    />
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <Label>Key takeaways (near-me page)</Label>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          leftIcon={<Plus className="h-4 w-4" />}
                          onClick={() =>
                            updateNearMeSeo({
                              keyTakeaways: [...config.nearMeSeo.keyTakeaways, ''],
                            })
                          }
                        >
                          Add takeaway
                        </Button>
                      </div>
                      {(config.nearMeSeo.keyTakeaways.length ? config.nearMeSeo.keyTakeaways : ['']).map(
                        (point, i) => (
                          <div key={i} className="flex flex-row items-center gap-2">
                            <Input
                              className="w-full h-9 text-sm"
                              value={point}
                              onChange={(e) => {
                                const base = config.nearMeSeo.keyTakeaways.length
                                  ? [...config.nearMeSeo.keyTakeaways]
                                  : ['']
                                const next = [...base]
                                next[i] = e.target.value
                                updateNearMeSeo({ keyTakeaways: next })
                              }}
                              placeholder="Same-day booking when slots allow"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-9 w-9 shrink-0 text-destructive hover:text-destructive"
                              onClick={() =>
                                updateNearMeSeo({
                                  keyTakeaways: config.nearMeSeo.keyTakeaways.filter((_, j) => j !== i),
                                })
                              }
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ),
                      )}
                    </div>
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <Label>Near-me FAQs (FAQPage JSON-LD when both Q+A filled)</Label>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          leftIcon={<Plus className="h-4 w-4" />}
                          onClick={() =>
                            updateNearMeSeo({ faqs: [...config.nearMeSeo.faqs, emptyFaq()] })
                          }
                        >
                          Add FAQ
                        </Button>
                      </div>
                      {config.nearMeSeo.faqs.map((faq, i) => (
                        <Accordion
                          key={i}
                          type="single"
                          collapsible
                          defaultValue={`nearme-faq-${i}`}
                          className="rounded-md border"
                        >
                          <AccordionItem value={`nearme-faq-${i}`} className="border-0">
                            <div className="flex items-stretch gap-1 border-b px-2">
                              <AccordionTrigger className="flex-1 py-3 text-left text-sm font-medium hover:no-underline">
                                {faq.question || `Near-me FAQ ${i + 1}`}
                              </AccordionTrigger>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-9 w-9 shrink-0 text-destructive hover:text-destructive"
                                onClick={(e) => {
                                  e.preventDefault()
                                  e.stopPropagation()
                                  updateNearMeSeo({
                                    faqs: config.nearMeSeo.faqs.filter((_, j) => j !== i),
                                  })
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                            <AccordionContent className="px-2 pb-4 pt-2">
                              <div className="flex flex-col gap-3">
                                <div className="space-y-2">
                                  <Label htmlFor={`cmm-nearme-faq-q-${i}`}>Question</Label>
                                  <Input
                                    id={`cmm-nearme-faq-q-${i}`}
                                    className="w-full"
                                    value={faq.question}
                                    onChange={(e) => {
                                      const next = [...config.nearMeSeo.faqs]
                                      next[i] = { ...next[i], question: e.target.value }
                                      updateNearMeSeo({ faqs: next })
                                    }}
                                  />
                                </div>
                                <CategoryMarketingRichTextField
                                  label="Answer"
                                  value={faq.answer}
                                  onChange={(html) => {
                                    const next = [...config.nearMeSeo.faqs]
                                    next[i] = { ...next[i], answer: html }
                                    updateNearMeSeo({ faqs: next })
                                  }}
                                  height={160}
                                />
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        </Accordion>
                      ))}
                    </div>
                </CategoryMarketingWriterSection>
              </div>
            </TabsContent>

            <TabsContent value="localSeo" className="mt-2 px-0 outline-none">
              <div className="flex flex-col gap-3">
                <CategoryMarketingWriterSection title="Local profile" hint="Enable LocalBusiness schema when NAP is verified.">
                    <div className="flex flex-col gap-3">
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
                      <Input id="cmm-f-34" className="w-full" value={config.localSeo.priceRange} onChange={(e) => updateLocalSeo({ priceRange: e.target.value })} placeholder="₹149 – ₹5000 (or ₹ / ₹₹ / ₹₹₹)" aria-invalid={napPriceRangeError(config.localSeo.priceRange) ? true : undefined} />
                      {napPriceRangeError(config.localSeo.priceRange) ? (
                        <p className="text-xs text-destructive">{napPriceRangeError(config.localSeo.priceRange)}</p>
                      ) : null}
                    </div>
                    </div>
                </CategoryMarketingWriterSection>
                <CategoryMarketingWriterSection title="Service area" hint="Neighborhoods and local-intent keywords.">
                    <div className="flex flex-col gap-3">
                      <div className="space-y-2">
                      <Label htmlFor="cmm-f-35">Service area headline</Label>
                      <Input id="cmm-f-35" className="w-full" value={config.localSeo.serviceAreaHeadline} onChange={(e) => updateLocalSeo({ serviceAreaHeadline: e.target.value })} placeholder="Same-day AC repair across [Location] and surrounding suburbs" />
                    </div>
                      <CategoryMarketingRichTextField
                        label="Service area narrative"
                        value={config.localSeo.serviceAreaNarrative}
                        onChange={(html) => updateLocalSeo({ serviceAreaNarrative: html })}
                        height={200}
                        placeholder="Coverage, dispatch, and why you win locally — links and lists supported."
                        helperText="Used for local context and schema-adjacent copy; keep facts accurate."
                      />
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
                </CategoryMarketingWriterSection>
                <CategoryMarketingWriterSection title="NAP & citations" hint="Match Google Business Profile.">
                    <div className="flex flex-col gap-3">
                      <div className="space-y-2">
                      <Label htmlFor="cmm-f-nap-phone">Business phone</Label>
                      <Input id="cmm-f-nap-phone" className="w-full" value={config.contactPhone} onChange={(e) => updateConfig({ contactPhone: e.target.value })} placeholder="+919812345678" aria-invalid={napPhoneError(config.contactPhone) ? true : undefined} />
                      {napPhoneError(config.contactPhone) ? (
                        <p className="text-xs text-destructive">{napPhoneError(config.contactPhone)}</p>
                      ) : (
                        <p className="text-xs text-muted-foreground">The "P" in NAP — feeds LocalBusiness <code>telephone</code>. Same value as the Contact phone field. Blank uses the registered-office number.</p>
                      )}
                    </div>
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
                      <Input id="cmm-f-42" className="w-full" value={config.localSeo.postalCode} onChange={(e) => updateLocalSeo({ postalCode: e.target.value })} aria-invalid={napPostalCodeError(config.localSeo.postalCode, config.localSeo.addressCountryCode) ? true : undefined} />
                      {napPostalCodeError(config.localSeo.postalCode, config.localSeo.addressCountryCode) ? (
                        <p className="text-xs text-destructive">{napPostalCodeError(config.localSeo.postalCode, config.localSeo.addressCountryCode)}</p>
                      ) : null}
                    </div>
                        <div className="space-y-2">
                      <Label htmlFor="cmm-f-43">Country code (ISO)</Label>
                      <Input id="cmm-f-43" className="w-full" value={config.localSeo.addressCountryCode} onChange={(e) => updateLocalSeo({ addressCountryCode: e.target.value.toUpperCase() })} maxLength={2} placeholder="IN" aria-invalid={napCountryCodeError(config.localSeo.addressCountryCode) ? true : undefined} />
                      {napCountryCodeError(config.localSeo.addressCountryCode) ? (
                        <p className="text-xs text-destructive">{napCountryCodeError(config.localSeo.addressCountryCode)}</p>
                      ) : null}
                    </div>
                      </div>
                      <div className="space-y-2">
                      <Label htmlFor="cmm-f-44">Geo coordinates (optional)</Label>
                      <Input id="cmm-f-44" className="w-full" value={config.localSeo.geoLatLng} onChange={(e) => updateLocalSeo({ geoLatLng: e.target.value })} placeholder="19.2856,72.8691" aria-invalid={napGeoError(config.localSeo.geoLatLng) ? true : undefined} />
                      {napGeoError(config.localSeo.geoLatLng) ? (
                        <p className="text-xs text-destructive">{napGeoError(config.localSeo.geoLatLng)}</p>
                      ) : (
                        <p className="text-xs text-muted-foreground">Latitude,longitude for JSON-LD geo — use the verified storefront or service center.</p>
                      )}
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
                </CategoryMarketingWriterSection>
                <CategoryMarketingWriterSection title="Social preview image">
                    <div className="space-y-2">
                      <Label htmlFor="cmm-f-47">Open Graph image override (absolute URL)</Label>
                      <Input id="cmm-f-47" className="w-full" value={config.localSeo.ogImageOverride} onChange={(e) => updateLocalSeo({ ogImageOverride: e.target.value })} placeholder="https://…" />
                      <p className="text-xs text-muted-foreground">Optional; consumer should prefer this for og:image on this service URL when set.</p>
                    </div>
                </CategoryMarketingWriterSection>
              </div>
            </TabsContent>

            <TabsContent value="hero" className="mt-2 px-0 outline-none">
              <div className="flex flex-col gap-3">
                <CategoryMarketingWriterSection
                  title="Hero & lead copy"
                  hint="H1 is plain text; intro supports rich HTML on the live site."
                >
                    <div className="space-y-2">
                      <Label htmlFor="cmm-f-48">Main heading (H1)</Label>
                      <Input id="cmm-f-48" className="w-full" value={config.mainHeading} onChange={(e) => updateConfig({ mainHeading: e.target.value })} placeholder="AC Repair & Service in [City] – Same-Day, Transparent Pricing" />
                      <SeoContentLengthHint
                        warning={evaluateLength('cm-h1-inline', 'Page H1', config.mainHeading, CATEGORY_MARKETING_LENGTH.pageH1)}
                        compact
                      />
                    </div>
                    <CategoryMarketingRichTextField
                      label="Intro (rich text)"
                      value={config.intro}
                      onChange={(html) => updateConfig({ intro: html })}
                      height={240}
                      placeholder="Two short paragraphs: who you serve in this area and what happens after booking."
                      helperText="Tip: keep the primary keyword in the first paragraph; use lists and images for skimmable trust points."
                      previewContext={
                        config.intro.trim() ? (
                          <>
                            {config.mainHeading.trim() ? (
                              <h2 className="mb-2 text-lg font-bold text-foreground">{config.mainHeading}</h2>
                            ) : null}
                          </>
                        ) : undefined
                      }
                    />
                    <SeoContentLengthHint
                      warning={evaluateLength('cm-intro-inline', 'Hero intro', config.intro, CATEGORY_MARKETING_LENGTH.intro)}
                    />
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="cmm-f-50">Intro lead magnet label (optional)</Label>
                        <Input id="cmm-f-50" className="w-full" value={config.introLeadMagnetLabel} onChange={(e) => updateConfig({ introLeadMagnetLabel: e.target.value })} placeholder="Free AC health check" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="cmm-f-51">Intro lead magnet URL (optional)</Label>
                        <Input id="cmm-f-51" className="w-full" value={config.introLeadMagnetUrl} onChange={(e) => updateConfig({ introLeadMagnetUrl: e.target.value })} />
                      </div>
                    </div>
                </CategoryMarketingWriterSection>
                <CategoryMarketingWriterSection title="Hero images" hint="Primary beside copy; secondary stacks below.">
                    <div className="flex flex-col gap-3">
                      <ImageUploadField
                        label="Image 1 (Hero — right of lead copy)"
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
                        helperText="Shown beside the hero lead copy (right column on desktop, below it on mobile). Recommended 1200×630px / 16:10. Max 5MB."
                      />
                      <ImageUploadField
                        label="Image 2 (Secondary — stacks under hero)"
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
                        helperText="Optional. Stacks beneath Image 1 in the hero's right column. Max 5MB."
                      />
                    </div>
                </CategoryMarketingWriterSection>
              </div>
            </TabsContent>

            <TabsContent value="cards" className="mt-2 px-0 outline-none">
              <CategoryMarketingWriterSection
                title="Service cards grid"
                hint="Bookable options shown on the landing page."
                actions={
                  <Button
                    size="sm"
                    variant="outline"
                    leftIcon={<Plus className="h-4 w-4" />}
                    onClick={() => updateConfig({ serviceCards: [...config.serviceCards, emptyServiceCard()] })}
                  >
                    Add card
                  </Button>
                }
              >
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="cmm-f-svccards-eyebrow">Section eyebrow</Label>
                      <Input
                        id="cmm-f-svccards-eyebrow"
                        className="w-full"
                        placeholder="Popular options"
                        value={config.serviceCardsEyebrow}
                        onChange={(e) => updateConfig({ serviceCardsEyebrow: e.target.value })}
                      />
                      <p className="text-xs text-muted-foreground">Small label above the heading. Defaults to “Popular options”.</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cmm-f-svccards-heading">Section heading (H2)</Label>
                      <Input
                        id="cmm-f-svccards-heading"
                        className="w-full"
                        placeholder="Services you can book"
                        value={config.serviceCardsHeading}
                        onChange={(e) => updateConfig({ serviceCardsHeading: e.target.value })}
                      />
                      <p className="text-xs text-muted-foreground">Leave blank to use “Services you can book”.</p>
                    </div>
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
                        <div className="flex flex-col gap-3">
                          <div className="space-y-2">
                      <Label htmlFor="cmm-f-52">Service name (H3)</Label>
                      <Input id="cmm-f-52" className="w-full" value={card.title} onChange={(e) => {
                              const next = [...config.serviceCards]
                              next[i] = { ...next[i], title: e.target.value }
                              updateConfig({ serviceCards: next })
                            }} />
                    </div>
                          <CategoryMarketingRichTextField
                            label="Short description"
                            value={card.description}
                            onChange={(html) => {
                              const next = [...config.serviceCards]
                              next[i] = { ...next[i], description: html }
                              updateConfig({ serviceCards: next })
                            }}
                            height={150}
                            placeholder="One or two lines with optional link to detail page."
                          />
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
              </CategoryMarketingWriterSection>
            </TabsContent>

            <TabsContent value="detailed" className="mt-2 px-0 outline-none">
              <CategoryMarketingWriterSection
                title="Detailed service options"
                hint="H3 blocks with bullet lists."
                actions={
                  <Button size="sm" variant="outline" leftIcon={<Plus className="h-4 w-4" />} onClick={addServiceType}>
                    Add block
                  </Button>
                }
              >
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="cmm-f-svctypes-eyebrow">Section eyebrow</Label>
                      <Input
                        id="cmm-f-svctypes-eyebrow"
                        className="w-full"
                        placeholder="Service detail"
                        value={config.serviceTypesEyebrow}
                        onChange={(e) => updateConfig({ serviceTypesEyebrow: e.target.value })}
                      />
                      <p className="text-xs text-muted-foreground">Small label above the heading. Defaults to “Service detail”.</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cmm-f-svctypes-heading">Section heading (H2)</Label>
                      <Input
                        id="cmm-f-svctypes-heading"
                        className="w-full"
                        placeholder="What we cover in [Location]"
                        value={config.serviceTypesHeading}
                        onChange={(e) => updateConfig({ serviceTypesHeading: e.target.value })}
                      />
                      <p className="text-xs text-muted-foreground">
                        Leave blank to use “What we cover in [Location]”. Don’t repeat the page H1 (main heading).
                      </p>
                    </div>
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
                        <div className="flex flex-col gap-3">
                          <div className="space-y-2">
                      <Label htmlFor="cmm-f-59">Title (H3)</Label>
                      <Input id="cmm-f-59" className="w-full" value={block.title} onChange={(e) => updateServiceType(typeIndex, 'title', e.target.value)} placeholder="Foam & power jet AC service" />
                    </div>
                          <CategoryMarketingRichTextField
                            label="Description"
                            value={block.description}
                            onChange={(html) => updateServiceType(typeIndex, 'description', html)}
                            height={160}
                          />
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
              </CategoryMarketingWriterSection>
            </TabsContent>

            <TabsContent value="trust" className="mt-2 px-0 outline-none">
              <div className="flex flex-col gap-3">
                <CategoryMarketingWriterSection
                  title="Why book ProFixer"
                  hint="Bold subheading + supporting copy per benefit."
                  actions={
                    <Button
                      size="sm"
                      variant="outline"
                      leftIcon={<Plus className="h-4 w-4" />}
                      onClick={() =>
                        updateConfig({ trustBenefits: [...config.trustBenefits, emptyTrustBenefit()] })
                      }
                    >
                      Add
                    </Button>
                  }
                >
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="cmm-f-trust-eyebrow">Section eyebrow</Label>
                        <Input
                          id="cmm-f-trust-eyebrow"
                          className="w-full"
                          placeholder="Why us"
                          value={config.trustBenefitsEyebrow}
                          onChange={(e) => updateConfig({ trustBenefitsEyebrow: e.target.value })}
                        />
                        <p className="text-xs text-muted-foreground">Small label above the heading. Defaults to “Why us”.</p>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="cmm-f-trust-heading">Section heading (H2)</Label>
                        <Input
                          id="cmm-f-trust-heading"
                          className="w-full"
                          placeholder="Why ProFixer for [ServiceName] in [Location]"
                          value={config.trustBenefitsHeading}
                          onChange={(e) => updateConfig({ trustBenefitsHeading: e.target.value })}
                        />
                        <p className="text-xs text-muted-foreground">Leave blank to auto-build “Why ProFixer for [ServiceName] in [Location]”.</p>
                      </div>
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
                          <CategoryMarketingRichTextField
                            label="Supporting copy"
                            value={row.body}
                            onChange={(html) => {
                              const next = [...config.trustBenefits]
                              next[i] = { ...next[i], body: html }
                              updateConfig({ trustBenefits: next })
                            }}
                            height={160}
                          />
                        </div>
                        <Button type="button" variant="ghost" size="icon" className="h-10 w-10 shrink-0 text-destructive hover:text-destructive" onClick={() =>
                            updateConfig({ trustBenefits: config.trustBenefits.filter((_, j) => j !== i) })
                          } ><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    ))}
                </CategoryMarketingWriterSection>
                <CategoryMarketingWriterSection title="4 ways block (legacy)" hint="Optional — only if the live template still reads this.">
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
                </CategoryMarketingWriterSection>
                <CategoryMarketingWriterSection title="What's included">
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
                </CategoryMarketingWriterSection>
              </div>
            </TabsContent>

            <TabsContent value="areas" className="mt-2 px-0 outline-none">
              <div className="flex flex-col gap-3">
                <CategoryMarketingWriterSection title="Areas we serve" hint="Locality list and coverage copy.">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="cmm-f-areas-eyebrow">Section eyebrow</Label>
                        <Input
                          id="cmm-f-areas-eyebrow"
                          className="w-full"
                          placeholder="Service area"
                          value={config.areasEyebrow}
                          onChange={(e) => updateConfig({ areasEyebrow: e.target.value })}
                        />
                        <p className="text-xs text-muted-foreground">Small label above the heading. Defaults to “Service area”.</p>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="cmm-f-areas-heading">Section heading (H2)</Label>
                        <Input
                          id="cmm-f-areas-heading"
                          className="w-full"
                          placeholder="Coverage in [Location]"
                          value={config.areasHeading}
                          onChange={(e) => updateConfig({ areasHeading: e.target.value })}
                        />
                        <p className="text-xs text-muted-foreground">Leave blank to use “Coverage in [Location]”.</p>
                      </div>
                    </div>
                    <CategoryMarketingRichTextField
                      label="Optional intro copy"
                      value={config.areasCopy}
                      onChange={(html) => updateConfig({ areasCopy: html })}
                      height={150}
                      helperText="Shown above the locality list; supports links and short lists."
                    />
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
                </CategoryMarketingWriterSection>
                <CategoryMarketingWriterSection
                  title="How to book"
                  hint="Numbered steps — powers HowTo schema when enabled."
                  actions={
                    <Button
                      size="sm"
                      variant="outline"
                      leftIcon={<Plus className="h-4 w-4" />}
                      onClick={() => updateConfig({ bookingSteps: [...config.bookingSteps, emptyBookingStep()] })}
                    >
                      Add step
                    </Button>
                  }
                >
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
                          <CategoryMarketingRichTextField
                            label="Step description"
                            value={step.description}
                            onChange={(html) => {
                              const next = [...config.bookingSteps]
                              next[i] = { ...next[i], description: html }
                              updateConfig({ bookingSteps: next })
                            }}
                            height={130}
                          />
                        </div>
                        <Button type="button" variant="ghost" size="icon" className="h-10 w-10 shrink-0 text-destructive hover:text-destructive" onClick={() =>
                            updateConfig({ bookingSteps: config.bookingSteps.filter((_, j) => j !== i) })
                          } ><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    ))}
                    <div className="flex flex-col gap-4 rounded-md border border-border/60 p-3">
                      <ImageUploadField
                        label="Booking steps image (shown beside the numbered steps)"
                        value={
                          config.bookingStepsImage
                            ? [{ id: 'bookimg', url: config.bookingStepsImage, alt: config.bookingStepsImageAlt || 'How to book', isPrimary: true, order: 0 }]
                            : []
                        }
                        onChange={(images: ImageFile[]) => updateConfig({ bookingStepsImage: images[0]?.url })}
                        maxFiles={1}
                        maxSize={5}
                        folder="homeservice"
                        allowFromCloudinary
                        helperText="Optional. Replaces the text placeholder next to the booking steps. Recommended 4:3, max 5MB."
                      />
                      <div className="space-y-2">
                        <Label htmlFor="cmm-f-booking-img-alt">Booking image alt text (SEO)</Label>
                        <Input
                          id="cmm-f-booking-img-alt"
                          className="w-full"
                          value={config.bookingStepsImageAlt ?? ''}
                          onChange={(e) => updateConfig({ bookingStepsImageAlt: e.target.value })}
                          placeholder="e.g. Booking an electrician in Mira Road on the ProFixer app"
                        />
                      </div>
                    </div>
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
                </CategoryMarketingWriterSection>
              </div>
            </TabsContent>

            <TabsContent value="pricing" className="mt-2 px-0 outline-none">
              <div className="flex flex-col gap-3">
                <CategoryMarketingWriterSection title="Pricing heading">
                  <div className="space-y-2">
                    <Label htmlFor="cmm-f-pricing-heading">Section heading (H2)</Label>
                    <Input
                      id="cmm-f-pricing-heading"
                      className="w-full"
                      placeholder="[ServiceName] charges — indicative rates in [Location]"
                      value={config.pricingHeading}
                      onChange={(e) => updateConfig({ pricingHeading: e.target.value })}
                    />
                    <p className="text-xs text-muted-foreground">
                      Blank = auto “[ServiceName] charges — indicative rates in [Location]”.
                    </p>
                  </div>
                </CategoryMarketingWriterSection>
                <CategoryMarketingPricingPanel
                  selectedCategory={selectedCategory}
                  industryLabel={industryLabel}
                  effectiveKey={effectiveKey}
                  config={config}
                  catalogOptions={catalogOptions}
                  onUpdate={updateConfig}
                  onApplyAndSave={persistPricingToApi}
                  saving={saving}
                />
              </div>
            </TabsContent>

            <TabsContent value="faqs" className="mt-2 px-0 outline-none">
              <div className="flex flex-col gap-3">
                <CategoryMarketingWriterSection
                  title="FAQ sidebar"
                  hint="Optional aside beside FAQs on locality pages. Tokens: [City], [Location], [ServiceName]."
                >
                    <div className="space-y-2">
                      <Label htmlFor="cmm-aside-title">Aside title</Label>
                      <Input
                        id="cmm-aside-title"
                        className="w-full"
                        value={config.localityAsideTitle}
                        onChange={(e) => updateConfig({ localityAsideTitle: e.target.value })}
                        placeholder="Electrician in [Location] — leave empty to use Hero main heading"
                      />
                    </div>
                    <CategoryMarketingRichTextField
                      label="Aside intro (optional — overrides truncated page intro)"
                      value={config.localityAsideIntro}
                      onChange={(html) => updateConfig({ localityAsideIntro: html })}
                      height={120}
                    />
                    <div className="space-y-2">
                      <Label htmlFor="cmm-aside-bc-label">Breadcrumb eyebrow</Label>
                      <Input
                        id="cmm-aside-bc-label"
                        className="w-full"
                        value={config.localityAsideBreadcrumbLabel}
                        onChange={(e) => updateConfig({ localityAsideBreadcrumbLabel: e.target.value })}
                        placeholder="You are here"
                      />
                    </div>
                </CategoryMarketingWriterSection>
                <CategoryMarketingWriterSection
                  title="FAQs"
                  hint="Question + answer pairs — used for FAQPage schema when enabled."
                  actions={
                    <Button
                      size="sm"
                      variant="outline"
                      leftIcon={<Plus className="h-4 w-4" />}
                      onClick={() => updateConfig({ faqs: [...config.faqs, emptyFaq()] })}
                    >
                      Add
                    </Button>
                  }
                >
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
                          <div className="flex flex-col gap-3">
                            <div className="space-y-2">
                      <Label htmlFor="cmm-f-82">Question</Label>
                      <Input id="cmm-f-82" className="w-full" value={faq.question} onChange={(e) => {
                                const next = [...config.faqs]
                                next[i] = { ...next[i], question: e.target.value }
                                updateConfig({ faqs: next })
                              }} />
                    </div>
                            <CategoryMarketingRichTextField
                              label="Answer (rich text — good for FAQPage links)"
                              value={faq.answer}
                              onChange={(html) => {
                                const next = [...config.faqs]
                                next[i] = { ...next[i], answer: html }
                                updateConfig({ faqs: next })
                              }}
                              height={200}
                            />
                          </div>
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>
                    ))}
                </CategoryMarketingWriterSection>
                <CategoryMarketingWriterSection
                  title="Related links"
                  hint="Internal links shown near FAQs."
                  actions={
                    <Button
                      size="sm"
                      variant="outline"
                      leftIcon={<Plus className="h-4 w-4" />}
                      onClick={() => updateConfig({ relatedLinks: [...config.relatedLinks, emptyRelatedLink()] })}
                    >
                      Add
                    </Button>
                  }
                >
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
                </CategoryMarketingWriterSection>
              </div>
            </TabsContent>

            <TabsContent value="localityGuide" className="mt-2 px-0 outline-none">
              <div className="flex flex-col gap-3">
                <CategoryMarketingWriterSection
                  title="Locality article"
                  hint={`Long-form guide for this key. Storage: ${selectedCategory}__{area-slug} (double underscore).`}
                >
                    <div className="flex flex-col gap-3">
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
                      <div className="rounded-lg border border-border/70 bg-muted/10 p-4">
                        <p className="text-sm font-semibold">Guide images</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Shown at the top of this locality guide. These are the same Image 1 / Image 2 as the
                          industry hero block — editing here updates both.
                        </p>
                        <div className="mt-3 flex flex-col gap-4">
                          <ImageUploadField
                            label="Image 1 (Hero — top of guide)"
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
                            helperText="Recommended 1200×630px / 16:10. Max 5MB."
                          />
                          <ImageUploadField
                            label="Image 2 (Secondary — pairs beside Image 1)"
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
                            helperText="Optional. Displays next to Image 1 as a two-up media row. Max 5MB."
                          />
                        </div>
                      </div>
                      <CategoryMarketingRichTextField
                        label="Summary lead (visible under H2)"
                        value={config.localityGuide.summaryLead}
                        onChange={(html) => updateLocalityGuide({ summaryLead: html })}
                        height={160}
                        helperText="One tight value proposition; readers see this before they expand depth sections."
                      />
                      <div className="space-y-3">
                        <div>
                          <p className="text-sm font-medium text-foreground">Lead paragraphs</p>
                          <p className="text-xs text-muted-foreground">Main article body — add as many blocks as you need.</p>
                        </div>
                      {(config.localityGuide.leadParagraphs.length
                        ? config.localityGuide.leadParagraphs
                        : ['']
                      ).map((para: string, i: number) => (
                        <div
                          key={i}
                          className="flex flex-col gap-2 rounded-lg border border-border/70 bg-muted/10 p-3 sm:flex-row sm:items-start"
                        >
                          <div className="min-w-0 flex-1">
                            <CategoryMarketingRichTextField
                              label={`Lead paragraph ${i + 1}`}
                              value={para}
                              onChange={(html) => {
                                const base = config.localityGuide.leadParagraphs.length
                                  ? [...config.localityGuide.leadParagraphs]
                                  : ['']
                                base[i] = html
                                updateLocalityGuide({ leadParagraphs: base })
                              }}
                              height={180}
                            />
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-10 w-10 shrink-0 self-end text-destructive hover:text-destructive sm:self-start"
                            onClick={() => {
                              const base = [...config.localityGuide.leadParagraphs]
                              base.splice(i, 1)
                              updateLocalityGuide({ leadParagraphs: base.length ? base : [''] })
                            }}
                            aria-label="Remove paragraph"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                      <Button
                        size="sm"
                        variant="secondary"
                        className="w-full sm:w-auto"
                        leftIcon={<Plus className="h-4 w-4" />}
                        onClick={() =>
                          updateLocalityGuide({
                            leadParagraphs: [...config.localityGuide.leadParagraphs, ''],
                          })
                        }
                      >
                        Add lead paragraph
                      </Button>
                      </div>
                      <div className="border-t border-border/60 pt-4">
                        <p className="text-sm font-medium text-foreground">Depth sections</p>
                        <p className="text-xs text-muted-foreground">Optional H2 blocks for long-tail topics (pricing quirks, access, seasonality).</p>
                      </div>
                      {config.localityGuide.sections.map((sec: LocalityGuideSectionBlock, si: number) => (
                        <Accordion
                          key={si}
                          type="single"
                          collapsible
                          defaultValue={si === 0 ? `loc-sec-${si}` : undefined}
                          className="mb-2 overflow-hidden rounded-lg border border-border/80 bg-card shadow-sm"
                        >
                          <AccordionItem value={`loc-sec-${si}`} className="border-0">
                            <AccordionTrigger className="px-2 py-3 text-left text-sm hover:no-underline">
                              Section {si + 1}: {sec.h2.trim() || '(untitled)'}
                            </AccordionTrigger>
                            <AccordionContent className="px-2 pb-4 pt-0">
                            <div className="flex flex-col gap-3">
                              <div className="space-y-2">
                      <Label htmlFor="cmm-f-89">Section H2</Label>
                      <Input id="cmm-f-89" className="w-full h-9 text-sm" value={sec.h2} onChange={(e) => {
                                  const next = [...config.localityGuide.sections]
                                  next[si] = { ...next[si], h2: e.target.value }
                                  updateLocalityGuide({ sections: next })
                                }} />
                    </div>
                              {(sec.paragraphs.length ? sec.paragraphs : ['']).map((p: string, pi: number) => (
                                <div key={pi} className="rounded-md border border-border/50 bg-muted/10 p-2">
                                  <CategoryMarketingRichTextField
                                    label={`Section paragraph ${pi + 1}`}
                                    value={p}
                                    onChange={(html) => {
                                      const next = [...config.localityGuide.sections]
                                      const paras = [...(next[si].paragraphs.length ? next[si].paragraphs : [''])]
                                      paras[pi] = html
                                      next[si] = { ...next[si], paragraphs: paras }
                                      updateLocalityGuide({ sections: next })
                                    }}
                                    height={170}
                                  />
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
                </CategoryMarketingWriterSection>
              </div>
            </TabsContent>

            <TabsContent value="closing" className="mt-2 px-0 outline-none">
              <div className="flex flex-col gap-3">
                <CategoryMarketingWriterSection title="Closing copy" hint="Final persuasive block before the footer.">
                    <CategoryMarketingRichTextField
                      label="Closing paragraph(s)"
                      value={config.closingParagraph}
                      onChange={(html) => updateConfig({ closingParagraph: html })}
                      height={220}
                    />
                </CategoryMarketingWriterSection>
                <CategoryMarketingWriterSection title="Lead magnet" hint="Optional footer / aside CTA.">
                    <div className="space-y-2">
                      <Label htmlFor="cmm-f-94">Headline</Label>
                      <Input id="cmm-f-94" className="w-full" value={config.leadMagnet.headline} onChange={(e) =>
                        updateConfig({ leadMagnet: { ...config.leadMagnet, headline: e.target.value } })
                      } />
                    </div>
                    <CategoryMarketingRichTextField
                      label="Description"
                      value={config.leadMagnet.description}
                      onChange={(html) =>
                        updateConfig({ leadMagnet: { ...config.leadMagnet, description: html } })
                      }
                      height={140}
                    />
                    <div className="space-y-2">
                      <Label htmlFor="cmm-f-96">CTA label</Label>
                      <Input id="cmm-f-96" className="w-full" value={config.leadMagnet.ctaLabel} onChange={(e) =>
                        updateConfig({ leadMagnet: { ...config.leadMagnet, ctaLabel: e.target.value } })
                      } />
                    </div>
                </CategoryMarketingWriterSection>
                <Accordion type="single" collapsible className="rounded-lg border border-border/70">
                  <AccordionItem value="jsonld-extra" className="border-0">
                    <AccordionTrigger className="px-3 py-2 text-sm hover:no-underline">
                      Custom JSON-LD snippet <span className="ml-2 text-xs font-normal text-muted-foreground">(advanced)</span>
                    </AccordionTrigger>
                    <AccordionContent className="px-3 pb-3">
                      <p className="mb-2 text-xs text-muted-foreground">
                        Prefer structured fields elsewhere. Validate JSON before publish.
                      </p>
                      <Textarea className="w-full font-mono text-xs" rows={6} value={config.jsonLdExtra} onChange={(e) => updateConfig({ jsonLdExtra: e.target.value })} />
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </div>
            </TabsContent>
          </Tabs>
          </div>

          <CategoryMarketingPageHealthPanel
            report={qualityReport}
            lengthWarnings={lengthWarnings}
            onNavigateTab={setTab}
            compact
            className="hidden xl:block xl:sticky xl:top-[5.5rem] xl:max-h-[calc(100vh-6rem)] xl:overflow-y-auto"
          />
        </div>
      )}

      {!loading ? (
        <CategoryMarketingAdvancedTools
          config={config}
          effectiveKey={effectiveKey}
          selectedCategory={selectedCategory}
          industryLabel={industryLabel}
          localityDisplayLabel={localityDisplayLabel}
          normalizedLocalitySlug={normalizedLocalitySlug}
          publicSiteOrigin={publicSiteOrigin}
          industryRobotsMeta={industryRobotsMeta}
          data={data}
          duplicateSourceKey={duplicateSourceKey}
          importJsonText={importJsonText}
          localityDiff={localityVersusIndustryDiff}
          localityDiffExpanded={localityDiffExpanded}
          onDuplicateSourceChange={setDuplicateSourceKey}
          onImportTextChange={setImportJsonText}
          onToggleDiffExpanded={() => setLocalityDiffExpanded((v) => !v)}
          onFullReplace={() => {
            const src = data[duplicateSourceKey]
            if (!src) return
            const full = mergeCategoryConfig(src)
            setData((prev) => ({
              ...prev,
              [effectiveKey]: JSON.parse(JSON.stringify(full)) as CategoryMarketingConfig,
            }))
            appToast(`Replaced "${effectiveKey}" from "${duplicateSourceKey}". Save to persist.`, 'success')
          }}
          onMergeLocality={() => {
            const src = data[duplicateSourceKey]
            if (!src) return
            const full = mergeCategoryConfig(src)
            updateConfig({
              localityGuide: JSON.parse(JSON.stringify(full.localityGuide)) as LocalityGuideCmsFields,
            })
            appToast(`Merged locality guide from "${duplicateSourceKey}". Save to persist.`, 'success')
          }}
          onMergeLocalSeo={() => {
            const src = data[duplicateSourceKey]
            if (!src) return
            const full = mergeCategoryConfig(src)
            updateConfig({
              localSeo: JSON.parse(JSON.stringify(full.localSeo)) as LocalSeoCmsFields,
            })
            appToast(`Merged local SEO from "${duplicateSourceKey}". Save to persist.`, 'success')
          }}
          onApplyJsonMerge={() => {
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
          onClearImport={() => setImportJsonText('')}
        />
      ) : null}

      <ConfirmDialog
        open={seoAutofillConfirmOpen}
        title="Apply full-tab starter pack?"
        message={`This will overwrite many fields for key “${effectiveKey}” using your selected category and location: metadata and keywords, hero and intro, service cards and detailed options, trust and areas, booking and pricing blocks, FAQs, locality guide (including any extra category-specific sections), related links, local and technical SEO shells, closing copy, and JSON-LD notes. Review hours, NAP, prices, and ratings before publish. Set REACT_APP_PUBLIC_SITE_ORIGIN for correct URLs (currently ${publicSiteOrigin}).`}
        confirmText="Apply starter pack"
        cancelText="Cancel"
        severity="warning"
        onCancel={() => setSeoAutofillConfirmOpen(false)}
        onConfirm={applySeoAutofillPack}
      />
    </div>
  )
}
