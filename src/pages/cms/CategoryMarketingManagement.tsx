import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  Loader2,
  Trash2,
  Plus,
  Megaphone,
  Image as ImageIconLucide,
  CheckCircle2,
  AlertTriangle,
  Info,
  GitCompareArrows,
  Sparkles,
} from 'lucide-react'
import { Button } from '../../components/ui/button'
import { Badge } from '../../components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
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
import { IndustryLandingWorkspaceOverview } from '../../components/cms/IndustryLandingWorkspaceOverview'
import { IndustryLandingEditorPreview } from '../../components/cms/IndustryLandingEditorPreview'
import { CategoryMarketingPageHealthPanel } from '../../components/cms/CategoryMarketingPageHealthPanel'
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
      const configToSave: CategoryMarketingConfig = {
        ...config,
        technicalSeo: {
          ...config.technicalSeo,
          breadcrumbItems: filterValidBreadcrumbItems(config.technicalSeo.breadcrumbItems),
        },
      }
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
          subtitle="Structure: pick Industry → Location → edit page content in tabs. Save per storage key. Industry-wide defaults merge with each location on the live site. Tokens: [City], [Location], [ServiceName]."
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
          <div className="border-b border-border/60 pb-3">
            <p className="text-sm font-semibold text-foreground">1 · Industry &amp; location</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Pick the vertical and the area (or &quot;All areas&quot; for defaults). Then use{' '}
              <strong className="font-medium text-foreground">section tabs</strong> below for page content — the panel
              under this card shows what&apos;s already filled for this pair.
            </p>
            {industryHub ? (
              <p className="mt-2 text-xs text-muted-foreground">
                Catalog industry: <span className="font-semibold text-foreground">{industryLabel}</span>{' '}
                <span className="font-mono text-[11px] text-muted-foreground">({selectedCategory})</span>
              </p>
            ) : null}
          </div>
          <div className="grid gap-4 md:grid-cols-12 md:items-end">
            {!industryHub ? (
              <div className="space-y-1.5 md:col-span-5">
                <Label htmlFor="catalog-category-select" className="text-xs font-medium text-muted-foreground">
                  Industry (catalog)
                </Label>
                <Select
                  value={catalogSelectValue}
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
                Location (service area)
              </Label>
              <Select
                value={safeLocalitySelectValue}
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
                  <SelectItem value="__none__">All areas — industry default template</SelectItem>
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
                <p className="text-[11px] text-bloom-coral dark:text-bloom-coral">
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
              <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                Saved storage key
              </span>
              <code className="mt-1 break-all rounded-md bg-muted px-2 py-1 text-left text-xs font-semibold md:text-right">
                {effectiveKey}
              </code>
            </div>
          </div>
          {normalizedLocalitySlug ? (
            <div className="flex flex-col gap-2 border-t border-border/60 pt-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0 space-y-1">
                <p className="text-xs font-semibold text-foreground">Technical SEO automation</p>
                <p className="text-[11px] leading-snug text-muted-foreground">
                  One pass uses your <strong className="font-medium text-foreground">category</strong> and{' '}
                  <strong className="font-medium text-foreground">location</strong> to prefill every tab with a realistic starter:
                  metadata (length-checked title and description), URL slug pattern, hero and intro,{' '}
                  <strong className="font-medium text-foreground">service cards</strong> and detailed options, trust and areas
                  copy, booking steps, pricing and comparison blocks, FAQs (FAQPage-ready), locality guide (base plus
                  category-specific sections where defined), related links, technical and local SEO shells, closing copy, and
                  JSON-LD notes. <strong className="font-medium text-foreground">LocalBusiness</strong> stays off until NAP is
                  verified. Expect to tune numbers, hours, and brand voice before publish.
                </p>
              </div>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="h-9 shrink-0 gap-2 self-start sm:self-center"
                leftIcon={<Sparkles className="h-4 w-4" aria-hidden />}
                onClick={() => setSeoAutofillConfirmOpen(true)}
              >
                Fill all tabs — starter pack
              </Button>
            </div>
          ) : (
            <p className="border-t border-border/60 pt-4 text-[11px] leading-snug text-muted-foreground">
              Choose a <strong className="text-foreground">location</strong> (not &quot;All areas&quot;) to enable the full-tab starter autofill for this
              storage key.
            </p>
          )}
        </CardContent>
      </Card>

      {!loading && normalizedLocalitySlug && localityVersusIndustryDiff ? (
        <Card className="overflow-hidden border-border/80 shadow-sm">
          <Accordion type="single" collapsible defaultValue="locality-diff">
            <AccordionItem value="locality-diff" className="border-0">
              <AccordionTrigger className="px-4 py-3 hover:no-underline sm:px-5">
                <div className="flex w-full flex-col gap-2 text-left sm:flex-row sm:items-center sm:justify-between sm:gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <GitCompareArrows className="hidden h-4 w-4 shrink-0 text-muted-foreground sm:block" aria-hidden />
                    <span className="text-sm font-semibold text-foreground">Diff vs industry-wide template</span>
                    {localityVersusIndustryDiff.rows.length === 0 ? (
                      <Badge variant="success">No field overrides</Badge>
                    ) : (
                      <Badge variant="secondary">{localityVersusIndustryDiff.rows.length} changed path(s)</Badge>
                    )}
                  </div>
                  <span className="text-[11px] text-muted-foreground">
                    <span className="font-mono">{selectedCategory}</span> → <span className="font-mono">{effectiveKey}</span>
                  </span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="border-t border-border/60 px-4 pb-4 pt-2 sm:px-5">
                <div className="mb-4 rounded-lg border border-border/70 bg-gradient-to-br from-muted/35 via-background to-background p-4 shadow-sm sm:p-5">
                  <p className="text-sm font-semibold tracking-tight text-foreground">What this diff shows</p>
                  <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                    Each row is a JSON <span className="font-mono text-[11px]">path</span>: values from the saved{' '}
                    <strong className="font-medium text-foreground">industry-wide</strong> key versus this{' '}
                    <strong className="font-medium text-foreground">locality</strong> record, including staged edits before Save.
                    Snippets are truncated; use the <strong className="text-foreground">Live preview → Visual page</strong> tab for
                    a consumer-style layout (desktop/mobile). Rich-text fields support inline images with required alt text.
                  </p>
                </div>
                {!localityVersusIndustryDiff.hasSavedIndustryKey ? (
                  <div
                    role="status"
                    className="mb-3 rounded-md border border-bloom-coral/90 bg-bloom-rose/70 px-3 py-2 text-xs text-bloom-coral dark:border-bloom-coral dark:bg-bloom-coral/30 dark:text-bloom-deep"
                  >
                    There is no saved CMS row for{' '}
                    <code className="rounded bg-muted px-1 py-0.5 font-mono text-[11px]">{selectedCategory}</code> in this
                    payload yet — the baseline below is the merged <strong>empty template</strong>, not necessarily what the
                    consumer shows (the live site may still merge static fallbacks). Save an industry-wide template first for
                    a meaningful diff.
                  </div>
                ) : null}
                {localityVersusIndustryDiff.rows.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Every normalized field matches the industry-wide key — the locality record does not override JSON at the
                    leaf level. You can still add locality-only copy later; remember to <strong>Save</strong> this key.
                  </p>
                ) : (
                  <>
                    <p className="mb-3 text-xs text-muted-foreground">
                      Staged edits are included. Values are truncated; hover or copy from the editor tabs for full text.
                    </p>
                    <div className="max-h-[min(420px,50vh)] overflow-auto rounded-md border border-border/80">
                      <table className="w-full min-w-[640px] border-collapse text-left text-[11px] sm:text-xs">
                        <thead className="sticky top-0 z-[1] bg-muted/95 backdrop-blur-sm">
                          <tr className="border-b border-border/80">
                            <th className="px-2 py-2 font-semibold sm:px-3">Path</th>
                            <th className="px-2 py-2 font-semibold sm:px-3">Industry ({selectedCategory})</th>
                            <th className="px-2 py-2 font-semibold sm:px-3">This locality</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(localityDiffExpanded
                            ? localityVersusIndustryDiff.rows
                            : localityVersusIndustryDiff.rows.slice(0, 100)
                          ).map((row) => (
                            <tr key={row.path} className="border-b border-border/40 align-top last:border-0 hover:bg-muted/30">
                              <td className="max-w-[200px] whitespace-normal break-all px-2 py-1.5 font-mono text-[10px] text-muted-foreground sm:max-w-none sm:px-3 sm:text-[11px]">
                                {row.path}
                              </td>
                              <td className="whitespace-pre-wrap break-words px-2 py-1.5 text-muted-foreground sm:px-3">
                                {row.industry}
                              </td>
                              <td className="whitespace-pre-wrap break-words px-2 py-1.5 text-foreground sm:px-3">
                                {row.locality}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {localityVersusIndustryDiff.rows.length > 100 ? (
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          Showing {localityDiffExpanded ? localityVersusIndustryDiff.rows.length : 100} of{' '}
                          {localityVersusIndustryDiff.rows.length} paths.
                        </span>
                        <Button type="button" size="sm" variant="outline" onClick={() => setLocalityDiffExpanded((v) => !v)}>
                          {localityDiffExpanded ? 'Show fewer' : 'Show all'}
                        </Button>
                      </div>
                    ) : null}
                  </>
                )}
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </Card>
      ) : null}

      {!loading ? (
        <>
          <IndustryLandingEditorPreview
            config={config}
            effectiveKey={effectiveKey}
            industryLabel={industryLabel}
            localityDisplayLabel={localityDisplayLabel}
            publicOrigin={publicSiteOrigin}
            catalogStorageSlug={selectedCategory}
            industryRobotsMeta={industryRobotsMeta}
          />
          {showElectricianSeoChecklist && normalizedLocalitySlug ? (
            <Card className="border-primary/20 bg-primary/[0.03]">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Electrician SEO checklist (2026)</CardTitle>
                <CardDescription>
                  Align this locality with your organic growth plan — technical, content depth, and local signals.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3 sm:grid-cols-2">
                {ELECTRICIAN_SERVICE_SEO_CHECKLIST.map((item) => (
                  <div key={item.id} className="rounded-lg border border-border/60 bg-card/80 p-3 text-sm">
                    <p className="font-medium text-foreground">{item.title}</p>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{item.detail}</p>
                    {item.tab ? (
                      <Badge variant="outline" className="mt-2 text-[10px]">
                        Tab: {item.tab}
                      </Badge>
                    ) : null}
                  </div>
                ))}
              </CardContent>
            </Card>
          ) : null}
          <IndustryLandingWorkspaceOverview
            industrySlug={selectedCategory}
            industryLabel={industryLabel}
            localitySlug={normalizedLocalitySlug}
            localityDisplayLabel={localityDisplayLabel}
            effectiveStorageKey={effectiveKey}
            config={config}
            allData={data}
            onOpenSavedKey={openSavedStorageKey}
          />
        </>
      ) : null}

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
                className="rounded-md border border-bloom-coral/40 bg-bloom-rose p-3 text-sm text-bloom-coral dark:border-bloom-coral dark:bg-bloom-coral/30"
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
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_minmax(260px,300px)]">
          <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs font-semibold text-muted-foreground">
              2 · Page content — tabs apply to <span className="font-mono text-foreground">{effectiveKey}</span>
            </p>
            <div className="flex flex-wrap gap-1.5">
              <Badge variant={qualityReport.statusVariant}>{qualityReport.statusLabel}</Badge>
              <Badge variant="outline">{qualityReport.score}% health</Badge>
              {lengthIssueCount > 0 ? (
                <Badge variant="warning">
                  {lengthIssueCount} length issue{lengthIssueCount === 1 ? '' : 's'}
                </Badge>
              ) : null}
            </div>
          </div>

          <div className="xl:hidden">
            <CategoryMarketingPageHealthPanel
              report={qualityReport}
              lengthWarnings={lengthWarnings}
              onNavigateTab={setTab}
            />
          </div>

          <Tabs value={tab} onValueChange={(v) => setTab(v as TabKey)} className="w-full">
            <div className="overflow-x-auto rounded-lg border border-border/80 bg-muted/25 shadow-sm">
              <TabsList className="mb-0 inline-flex h-auto min-h-9 w-max min-w-full justify-start gap-0.5 rounded-none border-0 bg-transparent p-1.5">
                {(
                  [
                    ['metadata', 'Metadata & SEO'],
                    ['localSeo', 'Local SEO'],
                    ['hero', 'Hero & intro'],
                    ['cards', 'Service cards'],
                    ['detailed', 'Detailed options'],
                    ['trust', 'Trust'],
                    ['areas', 'Areas & booking'],
                    ['pricing', 'Pricing'],
                    ['faqs', 'FAQs & links'],
                    ['localityGuide', 'Locality guide'],
                    ['closing', 'Closing'],
                  ] as const
                ).map(([value, label]) => (
                  <TabsTrigger key={value} value={value} className="relative shrink-0 gap-1.5 rounded-md px-2.5 py-1.5 text-xs sm:text-sm">
                    {label}
                    {tabNeedsAttention(value) ? (
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-500" aria-label="Items need attention" />
                    ) : null}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            <TabsContent value="metadata" className="mt-3 px-0 outline-none">
              <div className="flex flex-col gap-4">
                <Card className="overflow-hidden border-primary/20 bg-gradient-to-br from-primary/[0.06] via-transparent to-transparent">
                  <CardHeader className="pb-2">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0 space-y-1">
                        <CardTitle className="text-lg font-semibold tracking-tight">SEO readiness</CardTitle>
                        <CardDescription>
                          Quick checks for <span className="font-mono text-foreground">{effectiveKey}</span> ·{' '}
                          {industryLabel}. Public pages merge this JSON on{' '}
                          <span className="font-medium text-foreground">{PROFIXER_PUBLIC_ORIGIN}</span> — also run Search
                          Console, sitemaps, and internal links (Cross-linking tab).
                        </CardDescription>
                      </div>
                      <div className="flex shrink-0 flex-wrap gap-2">
                        <Badge variant="success">{seoReadinessRows.okCount} OK</Badge>
                        {seoReadinessRows.warnCount > 0 ? (
                          <Badge variant="warning">{seoReadinessRows.warnCount} needs work</Badge>
                        ) : (
                          <Badge variant="secondary">No blockers flagged</Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="grid gap-2 pt-0 sm:grid-cols-2">
                    {seoReadinessRows.rows.map((row, idx) => (
                      <div
                        key={`${row.title}-${idx}`}
                        className={cn(
                          'flex gap-2.5 rounded-lg border p-3 text-sm',
                          row.tone === 'ok' &&
                            'border-storm-mist/90 bg-storm-mist/50 dark:border-storm-deep/60 dark:bg-storm-deep/25',
                          row.tone === 'warn' &&
                            'border-bloom-coral/90 bg-bloom-rose/55 dark:border-bloom-coral/55 dark:bg-bloom-coral/25',
                          row.tone === 'info' && 'border-border/80 bg-muted/25',
                        )}
                      >
                        {row.tone === 'ok' ? (
                          <CheckCircle2
                            className="mt-0.5 h-4 w-4 shrink-0 text-storm-deep dark:text-storm-sea"
                            aria-hidden
                          />
                        ) : row.tone === 'warn' ? (
                          <AlertTriangle
                            className="mt-0.5 h-4 w-4 shrink-0 text-bloom-coral dark:text-bloom-coral"
                            aria-hidden
                          />
                        ) : (
                          <Info className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                        )}
                        <div className="min-w-0">
                          <p className="font-medium text-foreground">{row.title}</p>
                          <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{row.detail}</p>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <div
                  role="alert"
                  className="rounded-md border border-primary/80 bg-primary-soft/70 px-3 py-2.5 text-xs leading-relaxed dark:border-primary dark:bg-primary/30 sm:text-sm"
                >
                  <span className="font-medium text-foreground">Editorial flow:</span> one H1 (Hero tab). H2 → sections, H3 →
                  subsections; no skipped levels. Primary keyword in H1, intro, and ≥2 headings. Use [City] / [Location] where
                  the site substitutes area.
                </div>
                <Card className="overflow-hidden">
                  <CardHeader className="border-b border-border/60 bg-muted/20 pb-4">
                    <CardTitle className="text-lg font-semibold tracking-tight">SERP snippet &amp; intent</CardTitle>
                    <CardDescription>
                      Title, meta, URL pattern, and primary query — these drive the blue link and snippet on Google for{' '}
                      {PROFIXER_PUBLIC_ORIGIN} service URLs.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4 pt-6">
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
                  </CardContent>
                </Card>

                <Card className="overflow-hidden">
                  <CardHeader className="border-b border-border/60 bg-muted/20 pb-4">
                    <CardTitle className="text-lg font-semibold tracking-tight">Hero microcopy &amp; chips</CardTitle>
                    <CardDescription>
                      Trust pill, highlight line, proof points, and topic chips above the fold. Supports [City], [Location],
                      [ServiceName].
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4 pt-6">
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
                  </CardContent>
                </Card>

                <div role="alert" className="rounded-md border border-primary/20 bg-primary-soft/80 p-3 text-sm dark:border-primary dark:bg-primary/30">
                  <strong>Technical SEO:</strong> the consumer app maps <code>technicalSeo</code> to{' '}
                  <code>rel=&quot;canonical&quot;</code>, Open Graph / Twitter, robots, hreflang, and JSON-LD (WebPage, Service,
                  HowTo, BreadcrumbList, Speakable, VideoObject when enabled). Use absolute URLs on{' '}
                  <span className="font-medium">{PROFIXER_PUBLIC_ORIGIN}</span>. Pair <strong>OG image alt</strong> with the
                  image URL under Local SEO → Social preview.
                </div>

                <Card className="overflow-hidden">
                  <CardHeader className="border-b border-border/60 bg-muted/20 pb-4">
                    <CardTitle className="text-lg font-semibold tracking-tight">Canonical, Open Graph &amp; Twitter</CardTitle>
                    <CardDescription>
                      Overrides are optional: when empty, the live site falls back to SEO title and meta description. Always use
                      absolute URLs for canonical and share images.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4 pt-6">
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
                  </CardContent>
                </Card>

                <Card className="overflow-hidden">
                  <CardHeader className="border-b border-border/60 bg-muted/20 pb-4">
                    <CardTitle className="text-lg font-semibold tracking-tight">Robots, hreflang &amp; breadcrumbs</CardTitle>
                    <CardDescription>
                      Robots string maps to <code className="text-xs">&lt;meta name=&quot;robots&quot;&gt;</code> when set.
                      Hreflang rows become <code className="text-xs">link rel=&quot;alternate&quot;</code> for regional
                      variants.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4 pt-6">
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
                  </CardContent>
                </Card>

                <Card className="overflow-hidden">
                  <CardHeader className="border-b border-border/60 bg-muted/20 pb-4">
                    <CardTitle className="text-lg font-semibold tracking-tight">
                      Structured data, entities &amp; answer engines
                    </CardTitle>
                    <CardDescription>
                      Clear entities and factual summaries help Google and LLM-based search cite you accurately. Only use
                      aggregate rating when it matches visible, genuine reviews.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4 pt-6">
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
                  </CardContent>
                </Card>

                <Card id="near-me-seo-section" className="overflow-hidden scroll-mt-24">
                  <CardHeader className="border-b border-border/60 bg-muted/20 pb-4">
                    <CardTitle className="text-lg font-semibold tracking-tight">
                      Near-me pages (`/near-me/…`)
                    </CardTitle>
                    <CardDescription>
                      Optional overrides for auto-generated near-me landing pages. Leave blank to use smart defaults
                      from the catalog industry. For hyperlocal copy, save under a composite key (e.g.{' '}
                      <code className="text-xs">ac-repair__mira-bhayandar</code>). Body content (intro, takeaways,
                      FAQs) renders on the live near-me URL when filled.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4 pt-6">
                    <div className="rounded-md border border-border/60 bg-muted/30 px-3 py-2 text-sm">
                      <p className="text-muted-foreground">
                        Live URL:{' '}
                        <a
                          href={nearMePreviewUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-mono text-foreground underline-offset-2 hover:underline"
                        >
                          {nearMePreviewUrl.replace(publicSiteOrigin, '') || nearMePreviewUrl}
                        </a>
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Pairs with service page{' '}
                        <span className="font-mono">{servicesPreviewUrl.replace(publicSiteOrigin, '')}</span> — set
                        canonical below if you want Google to consolidate on /services/ instead.
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button type="button" size="sm" variant="outline" onClick={applyNearMeDefaults}>
                        Apply near-me defaults
                      </Button>
                    </div>
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
                              <div className="flex flex-col gap-4">
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
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="localSeo" className="mt-2 px-0 outline-none">
              <div className="flex flex-col gap-4">
                <div role="alert" className="rounded-md border border-primary/20 bg-primary-soft/80 p-3 text-sm dark:border-primary dark:bg-primary/30">
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
                      <Input id="cmm-f-34" className="w-full" value={config.localSeo.priceRange} onChange={(e) => updateLocalSeo({ priceRange: e.target.value })} placeholder="₹149 – ₹5000 (or ₹ / ₹₹ / ₹₹₹)" aria-invalid={napPriceRangeError(config.localSeo.priceRange) ? true : undefined} />
                      {napPriceRangeError(config.localSeo.priceRange) ? (
                        <p className="text-xs text-destructive">{napPriceRangeError(config.localSeo.priceRange)}</p>
                      ) : null}
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
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Hero &amp; lead copy</CardTitle>
                    <CardDescription>
                      The H1 is plain text for SERP consistency. Use the rich editor for the intro: links, bullets, and emphasis
                      render on the consumer site when the template supports HTML.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6 pt-0">
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
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
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
                        <div className="flex flex-col gap-4">
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
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
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
                        <div className="flex flex-col gap-4">
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
                    <div className="mt-4 grid gap-4 sm:grid-cols-2">
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
                    <div className="grid gap-4 sm:grid-cols-2">
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
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="pricing" className="mt-2 px-0 outline-none">
              <div className="flex flex-col gap-4">
                <div role="alert" className="rounded-md border border-primary/20 bg-primary-soft/80 p-3 text-sm dark:border-primary dark:bg-primary/30">
                  <p className="text-sm">
                    <strong>Service charges</strong> for this industry are maintained in{' '}
                    <Link to="/cms/category-marketing?tab=rate-card">Rate card</Link> (same catalog category key). Use spare parts and
                    included/excluded lists here so the consumer page can show a full pricing section without duplicating
                    labour/service rows.
                  </p>
                </div>
                <Card>
                  <CardContent>
                    <div className="space-y-2">
                      <Label htmlFor="cmm-f-pricing-heading">Pricing section heading (H2)</Label>
                      <Input
                        id="cmm-f-pricing-heading"
                        className="w-full"
                        placeholder="[ServiceName] charges — indicative rates in [Location]"
                        value={config.pricingHeading}
                        onChange={(e) => updateConfig({ pricingHeading: e.target.value })}
                      />
                      <p className="text-xs text-muted-foreground">
                        Title above the rate table. Leave blank to auto-build “[ServiceName] charges — indicative rates in [Location]”.
                        Supports [City], [Location], [ServiceName] tokens.
                      </p>
                    </div>
                  </CardContent>
                </Card>
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
                  <CardHeader className="border-b border-border/60 bg-muted/20 pb-4">
                    <CardTitle className="text-lg font-semibold tracking-tight">Locality aside card</CardTitle>
                    <CardDescription>
                      Sidebar beside FAQs on locality service pages — title, intro, breadcrumb eyebrow. Breadcrumb trail
                      uses the Technical SEO → Breadcrumb trail when filled. Supports [City], [Location], [ServiceName].
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4 pt-6">
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
                  </CardContent>
                </Card>
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
                <Card className="overflow-hidden border-border/80 shadow-sm">
                  <CardHeader className="border-b border-border/60 bg-muted/15 pb-4">
                    <CardTitle className="text-base">Locality article</CardTitle>
                    <CardDescription className="text-sm leading-relaxed">
                      Hyperlocal guide body for this CMS key. Use headings and lists for scanability; the consumer site should
                      render this HTML safely (same allowlist as other rich fields).
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6 pt-6">
                    <div
                      role="note"
                      className="rounded-lg border border-primary/20 bg-primary/[0.04] p-4 text-sm leading-snug text-foreground dark:bg-primary/10"
                    >
                      <p className="font-medium text-foreground">Key format</p>
                      <p className="mt-1.5 text-xs text-muted-foreground">
                        Slug drives storage: <code className="rounded bg-muted px-1 py-0.5 font-mono text-[11px]">{selectedCategory}__mira-road</code>{' '}
                        (replace <code className="font-mono">mira-road</code> with your segment). Separator is{' '}
                        <strong className="font-mono font-normal text-foreground">__</strong> (two underscores), e.g.{' '}
                        <code className="font-mono">electric__mira-road</code> — not a single underscore.
                      </p>
                    </div>
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
                      <div className="rounded-lg border border-border/70 bg-muted/10 p-4">
                        <div className="flex items-center gap-1">
                          <ImageIconLucide className="h-4 w-4 text-primary" />
                          <p className="text-sm font-semibold">Guide images</p>
                        </div>
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
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="closing" className="mt-2 px-0 outline-none">
              <div className="flex flex-col gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Closing content</CardTitle>
                    <CardDescription>Final persuasive block before the footer; same rich formatting as the hero intro.</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <CategoryMarketingRichTextField
                      label="Closing paragraph(s)"
                      value={config.closingParagraph}
                      onChange={(html) => updateConfig({ closingParagraph: html })}
                      height={220}
                    />
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

          <CategoryMarketingPageHealthPanel
            report={qualityReport}
            lengthWarnings={lengthWarnings}
            onNavigateTab={setTab}
            className="hidden xl:block xl:sticky xl:top-4 xl:max-h-[calc(100vh-2rem)] xl:overflow-y-auto"
          />
        </div>
      )}

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
