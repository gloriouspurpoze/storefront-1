import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { CircleDollarSign, Loader2, Plus, Trash2, Wand2 } from 'lucide-react'
import { Card, CardContent } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { Textarea } from '../../components/ui/textarea'
import { Switch } from '../../components/ui/switch'
import { Badge } from '../../components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select'
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from '../../components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table'
import { CMSService } from '../../services/api'
import { PageHeader } from '../../components/common/PageHeader'
import { useCmsCatalogCategories } from '../../hooks/useCmsCatalogCategories'
import { usePermissions } from '../../hooks/usePermissions'
import { appToast } from '../../lib/appToast'
import { CMS_DEFAULT_FALLBACK_SLUG } from '../../constants/cmsCatalogCategories'
import type {
  PricingCategoryMetaConfig,
  PricingFaqItem,
  PricingRateCardRow,
} from '../../types/pricingCategoryMeta'

/**
 * Pricing category meta — editorial CMS for `/pricing/{categorySlug}` on the
 * consumer site. Drives the answer-engine summary that Google AI Overviews
 * and Perplexity lift verbatim. See `docs/seo/CMS_PROMPT_PRICING.md` in the
 * consumer repo for the editorial brief.
 */

function emptyConfig(slug: string): PricingCategoryMetaConfig {
  return {
    categorySlug: slug,
    displayName: '',
    shortName: '',
    metaTitle: '',
    metaDescription: '',
    priceFrom: undefined,
    priceTo: undefined,
    currency: 'INR',
    heroIntro: '',
    answerEngineSummary: '',
    rateCardCommentary: '',
    mumbaiContext: '',
    comparisonNarrative: '',
    callToActionParagraph: '',
    faq: [],
    rateCardRows: [],
    structuredData: { schemaPrimaryType: 'Service', knowsAbout: [] },
    isIndexable: true,
    internalNote: '',
  }
}

function wordCount(s: string): number {
  return s.trim().split(/\s+/).filter(Boolean).length
}

function charCount(s: string): number {
  return s.trim().length
}

export default function PricingCategoryMetaManagement() {
  const { checkPermission } = usePermissions()
  const canMutate =
    checkPermission('manage_system_settings') || checkPermission('manage_rate_cards')
  const { options: catalogOptions, loading: catalogOptionsLoading, defaultSlug, getLabel } =
    useCmsCatalogCategories()

  const [data, setData] = useState<Record<string, PricingCategoryMetaConfig>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [selectedSlug, setSelectedSlug] = useState<string>('')
  const [tab, setTab] = useState<'meta' | 'narrative' | 'rate' | 'faq' | 'structured'>(
    'meta',
  )

  const effectiveSlug = useMemo(() => {
    if (selectedSlug && catalogOptions.some((o) => o.value === selectedSlug)) return selectedSlug
    return defaultSlug ?? CMS_DEFAULT_FALLBACK_SLUG
  }, [selectedSlug, catalogOptions, defaultSlug])

  const current: PricingCategoryMetaConfig = useMemo(
    () => data[effectiveSlug] ?? emptyConfig(effectiveSlug),
    [data, effectiveSlug],
  )

  const updateCurrent = useCallback(
    (patch: Partial<PricingCategoryMetaConfig>) => {
      setData((prev) => ({
        ...prev,
        [effectiveSlug]: {
          ...emptyConfig(effectiveSlug),
          ...(prev[effectiveSlug] ?? {}),
          ...patch,
          categorySlug: effectiveSlug,
        },
      }))
    },
    [effectiveSlug],
  )

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      const result = await CMSService.getPricingCategoryMeta()
      setData(typeof result === 'object' && result !== null ? result : {})
    } catch (error: unknown) {
      const err = error as { response?: { status?: number; data?: { error?: string } } }
      // 404 on a missing endpoint is fine — backend hasn't been provisioned yet.
      // Treat it as "no data" so the editor still works locally.
      if (err.response?.status === 404) {
        setData({})
      } else {
        appToast(
          'Error: ' + (err.response?.data?.error || 'Failed to load pricing meta'),
          'error',
        )
        setData({})
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchData()
  }, [fetchData])

  const handleSave = async () => {
    if (!canMutate) return
    try {
      setSaving(true)
      await CMSService.updatePricingCategoryMeta(data)
      appToast('Pricing meta saved.', 'success')
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } }
      appToast(
        'Error: ' + (err.response?.data?.error || 'Failed to save pricing meta'),
        'error',
      )
    } finally {
      setSaving(false)
    }
  }

  /** Add an empty rate-card row to the current slug. */
  const addRateRow = () => {
    const next: PricingRateCardRow[] = [
      ...(current.rateCardRows ?? []),
      { service: '', profixer: '', others: '' },
    ]
    updateCurrent({ rateCardRows: next })
  }

  const updateRateRow = (idx: number, patch: Partial<PricingRateCardRow>) => {
    const next = (current.rateCardRows ?? []).map((row, i) =>
      i === idx ? { ...row, ...patch } : row,
    )
    updateCurrent({ rateCardRows: next })
  }

  const removeRateRow = (idx: number) => {
    const next = (current.rateCardRows ?? []).filter((_, i) => i !== idx)
    updateCurrent({ rateCardRows: next })
  }

  const addFaqRow = () => {
    const next: PricingFaqItem[] = [
      ...(current.faq ?? []),
      { question: '', answer: '' },
    ]
    updateCurrent({ faq: next })
  }

  const updateFaqRow = (idx: number, patch: Partial<PricingFaqItem>) => {
    const next = (current.faq ?? []).map((row, i) => (i === idx ? { ...row, ...patch } : row))
    updateCurrent({ faq: next })
  }

  const removeFaqRow = (idx: number) => {
    const next = (current.faq ?? []).filter((_, i) => i !== idx)
    updateCurrent({ faq: next })
  }

  const answerEngineWords = wordCount(current.answerEngineSummary ?? '')
  const metaDescriptionChars = charCount(current.metaDescription ?? '')
  const metaTitleChars = charCount(current.metaTitle ?? '')

  const summaryWordBadgeClass =
    answerEngineWords >= 60 && answerEngineWords <= 110
      ? 'bg-storm-deep hover:bg-storm-deep'
      : answerEngineWords > 0
        ? 'bg-bloom-coral hover:bg-bloom-coral'
        : ''

  return (
    <div className="p-4 sm:p-6 md:p-8">
      <PageHeader
        title="Pricing category meta"
        subtitle="Editorial narrative + 3-column rate rows surrounding /pricing/{category} on the consumer site. Drives the answer-engine summary lifted by Google AI Overviews and Perplexity."
        icon={<CircleDollarSign className="h-7 w-7" aria-hidden />}
      />

      <Card className="border-border/80 shadow-sm">
        <CardContent className="space-y-5 pt-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="grid gap-2 sm:max-w-md sm:flex-1">
              <Label htmlFor="pricing-meta-catalog" className="text-sm font-semibold">
                Pricing category
              </Label>
              <Select
                value={effectiveSlug}
                onValueChange={setSelectedSlug}
                disabled={catalogOptionsLoading || catalogOptions.length === 0}
              >
                <SelectTrigger id="pricing-meta-catalog" className="h-10 w-full">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  {catalogOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Same key as rate-card / category-marketing. Saved under{' '}
                <code className="rounded bg-muted px-1 text-[11px]">{effectiveSlug}</code>.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="text-[11px]">
                {Object.keys(data).length} categories configured
              </Badge>
              <Button
                type="button"
                variant="outline"
                onClick={() => void fetchData()}
                disabled={loading || saving}
              >
                Reload
              </Button>
              <Button type="button" onClick={() => void handleSave()} disabled={!canMutate || saving}>
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving
                  </>
                ) : (
                  'Save all'
                )}
              </Button>
            </div>
          </div>

          <div className="rounded-md border border-bloom-coral/60 bg-bloom-rose px-3 py-2 text-xs text-bloom-coral">
            <strong>Editorial brief:</strong> follow{' '}
            <code className="font-mono">docs/seo/CMS_PROMPT_PRICING.md</code> on the consumer
            repo. The <em>answer-engine summary</em> is the single most important field —
            Google AI Overviews lift it verbatim. Encyclopaedia tone, 60–110 words, must cite
            the price band and at least one rate-card row by name.
          </div>

          {loading ? (
            <div className="flex items-center gap-2 py-12 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" /> Loading…
            </div>
          ) : (
            <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
              <TabsList className="w-full justify-start">
                <TabsTrigger value="meta">Meta</TabsTrigger>
                <TabsTrigger value="narrative">
                  Narrative
                  {answerEngineWords > 0 ? (
                    <Badge
                      variant="secondary"
                      className={`ml-2 text-[10px] ${summaryWordBadgeClass}`}
                    >
                      {answerEngineWords}w
                    </Badge>
                  ) : null}
                </TabsTrigger>
                <TabsTrigger value="rate">
                  Rate card
                  {(current.rateCardRows?.length ?? 0) > 0 ? (
                    <Badge variant="secondary" className="ml-2 text-[10px]">
                      {current.rateCardRows?.length}
                    </Badge>
                  ) : null}
                </TabsTrigger>
                <TabsTrigger value="faq">
                  FAQ
                  {(current.faq?.length ?? 0) > 0 ? (
                    <Badge variant="secondary" className="ml-2 text-[10px]">
                      {current.faq?.length}
                    </Badge>
                  ) : null}
                </TabsTrigger>
                <TabsTrigger value="structured">Structured data</TabsTrigger>
              </TabsList>

              <TabsContent value="meta" className="space-y-4 pt-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="pm-display-name">Display name</Label>
                    <Input
                      id="pm-display-name"
                      value={current.displayName ?? ''}
                      onChange={(e) => updateCurrent({ displayName: e.target.value })}
                      placeholder={getLabel(effectiveSlug) || 'AC repair'}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="pm-short-name">Short name</Label>
                    <Input
                      id="pm-short-name"
                      value={current.shortName ?? ''}
                      onChange={(e) => updateCurrent({ shortName: e.target.value })}
                      placeholder="AC repair"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="pm-meta-title">Meta title (≤60 chars)</Label>
                    <Input
                      id="pm-meta-title"
                      value={current.metaTitle ?? ''}
                      onChange={(e) => updateCurrent({ metaTitle: e.target.value })}
                      placeholder="AC repair cost in Mumbai 2026 | Price guide"
                      maxLength={80}
                    />
                    <p
                      className={`text-[11px] ${
                        metaTitleChars > 60 ? 'text-bloom-coral' : 'text-muted-foreground'
                      }`}
                    >
                      {metaTitleChars} / 60 chars
                    </p>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="pm-meta-description">
                      Meta description (140–160 chars)
                    </Label>
                    <Textarea
                      id="pm-meta-description"
                      rows={3}
                      value={current.metaDescription ?? ''}
                      onChange={(e) => updateCurrent({ metaDescription: e.target.value })}
                      placeholder="Transparent AC repair rates in Mumbai. ProFixer charges ₹499 visit, ₹2,200 gas refill. 30-day labour warranty. Same-day slots."
                    />
                    <p
                      className={`text-[11px] ${
                        metaDescriptionChars < 140 || metaDescriptionChars > 160
                          ? 'text-bloom-coral'
                          : 'text-storm-deep'
                      }`}
                    >
                      {metaDescriptionChars} / 160 chars
                    </p>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="pm-price-from">Price floor (₹)</Label>
                    <Input
                      id="pm-price-from"
                      type="number"
                      value={current.priceFrom ?? ''}
                      onChange={(e) => {
                        const v = e.target.value
                        updateCurrent({
                          priceFrom: v === '' ? undefined : Number(v),
                        })
                      }}
                      placeholder="499"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="pm-price-to">Price ceiling (₹)</Label>
                    <Input
                      id="pm-price-to"
                      type="number"
                      value={current.priceTo ?? ''}
                      onChange={(e) => {
                        const v = e.target.value
                        updateCurrent({
                          priceTo: v === '' ? undefined : Number(v),
                        })
                      }}
                      placeholder="12000"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="pm-currency">Currency</Label>
                    <Input
                      id="pm-currency"
                      value={current.currency ?? 'INR'}
                      onChange={(e) => updateCurrent({ currency: e.target.value })}
                    />
                  </div>
                </div>

                <div className="flex items-start gap-3 rounded-lg border bg-muted/30 px-3 py-2">
                  <Switch
                    id="pm-indexable"
                    checked={current.isIndexable !== false}
                    onCheckedChange={(v) => updateCurrent({ isIndexable: v })}
                  />
                  <div className="text-sm">
                    <Label htmlFor="pm-indexable" className="font-medium">
                      Include in /sitemaps/pricing.xml
                    </Label>
                    <p className="text-[11px] text-muted-foreground">
                      Turn off to soft-prune the slug from the pricing sitemap without
                      removing the page itself.
                    </p>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="pm-internal-note">Internal note (editors only)</Label>
                  <Textarea
                    id="pm-internal-note"
                    rows={2}
                    value={current.internalNote ?? ''}
                    onChange={(e) => updateCurrent({ internalNote: e.target.value })}
                    placeholder="e.g. Rates audited 2026-05-28 vs Urban Company + JustDial"
                  />
                </div>
              </TabsContent>

              <TabsContent value="narrative" className="space-y-4 pt-4">
                <NarrativeField
                  id="pm-hero-intro"
                  label="Hero intro (60–90 words)"
                  hint="Opens with the price band. Names Mumbai. Reads like a Consumer Reports lead."
                  value={current.heroIntro ?? ''}
                  onChange={(v) => updateCurrent({ heroIntro: v })}
                  min={60}
                  max={90}
                  rows={4}
                />
                <NarrativeField
                  id="pm-answer-engine"
                  label="Answer-engine summary (70–110 words) — AI lifts this VERBATIM"
                  hint="Encyclopaedia tone, no marketing. MUST cite priceFrom-priceTo and at least one rate-card row by name."
                  value={current.answerEngineSummary ?? ''}
                  onChange={(v) => updateCurrent({ answerEngineSummary: v })}
                  min={70}
                  max={110}
                  rows={5}
                  emphasize
                />
                <NarrativeField
                  id="pm-rate-card-commentary"
                  label="Rate-card commentary (120–180 words)"
                  hint="Interprets the rate card. Why is there a range? What factors push a job to the top vs the bottom? Names most-expensive + cheapest rows."
                  value={current.rateCardCommentary ?? ''}
                  onChange={(v) => updateCurrent({ rateCardCommentary: v })}
                  min={120}
                  max={180}
                  rows={6}
                />
                <NarrativeField
                  id="pm-mumbai-context"
                  label="Mumbai context (~220 words, 2 paragraphs)"
                  hint="Seasonal/demand patterns. Monsoon, summer peak, post-festive. Where ProFixer holds prices firm in peak season."
                  value={current.mumbaiContext ?? ''}
                  onChange={(v) => updateCurrent({ mumbaiContext: v })}
                  min={180}
                  max={260}
                  rows={6}
                />
                <NarrativeField
                  id="pm-comparison"
                  label="ProFixer vs local market (100–140 words)"
                  hint="Why ProFixer is 15–35% below typical local market. Source-of-savings (verified pros, no middleman, GST invoice)."
                  value={current.comparisonNarrative ?? ''}
                  onChange={(v) => updateCurrent({ comparisonNarrative: v })}
                  min={100}
                  max={140}
                  rows={5}
                />
                <NarrativeField
                  id="pm-cta"
                  label="Call-to-action paragraph (40–70 words)"
                  hint="Soft CTA. Explains booking flow, GST invoice, response time, payment after work. NOT shouty."
                  value={current.callToActionParagraph ?? ''}
                  onChange={(v) => updateCurrent({ callToActionParagraph: v })}
                  min={40}
                  max={70}
                  rows={3}
                />
              </TabsContent>

              <TabsContent value="rate" className="space-y-4 pt-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">
                    3-column rate rows: <em>service</em> · <em>profixer</em> · <em>typical local market</em>.
                    Replaces the legacy 2-column rate card for the pricing comparison table on the
                    consumer site.
                  </p>
                  <Button type="button" variant="outline" size="sm" onClick={addRateRow}>
                    <Plus className="mr-1.5 h-4 w-4" />
                    Add row
                  </Button>
                </div>

                {(current.rateCardRows ?? []).length === 0 ? (
                  <p className="rounded-lg border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
                    No rate rows yet. Add the most common 5–10 sub-services for this category.
                  </p>
                ) : (
                  <div className="overflow-x-auto rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[32%]">Service / line item</TableHead>
                          <TableHead className="w-[22%]">ProFixer</TableHead>
                          <TableHead className="w-[22%]">Typical local market</TableHead>
                          <TableHead>Note (optional)</TableHead>
                          <TableHead className="w-[60px]"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(current.rateCardRows ?? []).map((row, idx) => (
                          <TableRow key={idx}>
                            <TableCell>
                              <Input
                                value={row.service}
                                onChange={(e) =>
                                  updateRateRow(idx, { service: e.target.value })
                                }
                                placeholder="Gas refill (1.5 ton split)"
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                value={row.profixer}
                                onChange={(e) =>
                                  updateRateRow(idx, { profixer: e.target.value })
                                }
                                placeholder="₹2,200–₹2,800"
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                value={row.others}
                                onChange={(e) => updateRateRow(idx, { others: e.target.value })}
                                placeholder="₹2,500–₹4,500"
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                value={row.note ?? ''}
                                onChange={(e) => updateRateRow(idx, { note: e.target.value })}
                                placeholder="optional caption"
                              />
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive hover:text-destructive"
                                onClick={() => removeRateRow(idx)}
                                title="Remove row"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="faq" className="space-y-4 pt-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">
                    Minimum 8 FAQs. Each answer 50–90 words, factual, must reference at least one
                    number from the rate card or price band.
                  </p>
                  <Button type="button" variant="outline" size="sm" onClick={addFaqRow}>
                    <Plus className="mr-1.5 h-4 w-4" />
                    Add FAQ
                  </Button>
                </div>

                {(current.faq ?? []).length === 0 ? (
                  <p className="rounded-lg border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
                    No FAQs yet. Add the 8 standard pricing FAQs from CMS_PROMPT_PRICING.md.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {(current.faq ?? []).map((row, idx) => {
                      const answerWords = wordCount(row.answer)
                      const answerOk = answerWords >= 50 && answerWords <= 90
                      return (
                        <Card key={idx} className="border-border/70">
                          <CardContent className="space-y-2 py-3">
                            <div className="flex items-start justify-between gap-3">
                              <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                                FAQ #{idx + 1}
                              </Label>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-destructive hover:text-destructive"
                                onClick={() => removeFaqRow(idx)}
                                title="Remove FAQ"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                            <Input
                              value={row.question}
                              onChange={(e) =>
                                updateFaqRow(idx, { question: e.target.value })
                              }
                              placeholder="How much does AC repair cost in Mumbai?"
                            />
                            <Textarea
                              rows={3}
                              value={row.answer}
                              onChange={(e) => updateFaqRow(idx, { answer: e.target.value })}
                              placeholder="50–90 word factual answer with at least one number…"
                            />
                            <p
                              className={`text-[11px] ${
                                answerWords === 0
                                  ? 'text-muted-foreground'
                                  : answerOk
                                    ? 'text-storm-deep'
                                    : 'text-bloom-coral'
                              }`}
                            >
                              {answerWords} words · target 50–90
                            </p>
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="structured" className="space-y-4 pt-4">
                <div className="space-y-1.5">
                  <Label htmlFor="pm-schema-type">Schema.org primary type</Label>
                  <Select
                    value={current.structuredData?.schemaPrimaryType ?? 'Service'}
                    onValueChange={(v) =>
                      updateCurrent({
                        structuredData: {
                          ...(current.structuredData ?? {}),
                          schemaPrimaryType: v as 'Service' | 'WebPage' | 'PriceSpecification',
                        },
                      })
                    }
                  >
                    <SelectTrigger id="pm-schema-type" className="h-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Service">Service (recommended)</SelectItem>
                      <SelectItem value="WebPage">WebPage</SelectItem>
                      <SelectItem value="PriceSpecification">PriceSpecification</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="pm-knows-about">
                    knowsAbout entities (one per line or comma-separated)
                  </Label>
                  <Textarea
                    id="pm-knows-about"
                    rows={5}
                    value={(current.structuredData?.knowsAbout ?? []).join('\n')}
                    onChange={(e) => {
                      const items = e.target.value
                        .split(/[\n,]+/g)
                        .map((s) => s.trim())
                        .filter(Boolean)
                      updateCurrent({
                        structuredData: {
                          ...(current.structuredData ?? {}),
                          knowsAbout: items,
                        },
                      })
                    }}
                    placeholder={
                      'AC repair Mumbai\nAC gas refill 1.5 ton\nAC servicing humidity coastal city\nSplit AC installation Andheri'
                    }
                  />
                  <p className="text-[11px] text-muted-foreground">
                    6–10 entities combining category + Mumbai + sub-services. Drives JSON-LD on
                    the consumer site for AI-engine entity grounding.
                  </p>
                </div>

                <div className="rounded-md border bg-muted/30 px-3 py-3 text-xs">
                  <div className="mb-1 flex items-center gap-1 font-semibold">
                    <Wand2 className="h-3.5 w-3.5" />
                    Tip
                  </div>
                  The consumer site already builds JSON-LD from this record — you don't need to
                  edit any code there. The <em>answer-engine summary</em> becomes the Service
                  description, the <em>rate rows</em> drive priceRange + offers, and{' '}
                  <em>FAQs</em> become FAQPage schema.
                </div>
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function NarrativeField({
  id,
  label,
  hint,
  value,
  onChange,
  min,
  max,
  rows,
  emphasize,
}: {
  id: string
  label: string
  hint: string
  value: string
  onChange: (next: string) => void
  min: number
  max: number
  rows: number
  emphasize?: boolean
}) {
  const words = wordCount(value)
  const tone =
    words === 0
      ? 'text-muted-foreground'
      : words >= min && words <= max
        ? 'text-storm-deep'
        : 'text-bloom-coral'
  return (
    <div
      className={`space-y-1.5 rounded-lg border p-3 ${
        emphasize ? 'border-primary bg-primary-soft/40' : ''
      }`}
    >
      <Label htmlFor={id} className="text-sm font-semibold">
        {label}
      </Label>
      <p className="text-[11px] text-muted-foreground">{hint}</p>
      <Textarea id={id} rows={rows} value={value} onChange={(e) => onChange(e.target.value)} />
      <p className={`text-[11px] ${tone}`}>
        {words} words · target {min}–{max}
      </p>
    </div>
  )
}
