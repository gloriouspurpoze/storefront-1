import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Loader2, RefreshCw, Sparkles } from 'lucide-react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Badge } from '../ui/badge'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '../ui/accordion'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table'
import { CMSService } from '../../services/api'
import { appToast } from '../../lib/appToast'
import type { CategoryMarketingConfig } from '../../types/categoryMarketing'
import { emptyComparisonRow, emptySparePart } from '../../types/categoryMarketing'
import {
  buildPricingTableFromSources,
  getIndustryComparisonRows,
  getIndustryPricingLists,
  summarizePricingSources,
  type RateCardPartRow,
} from '../../lib/categoryMarketingPricingAutofill'
import { cmsMarketingBaseKeysForCatalogSlug } from '../../lib/categoryMarketingCatalogKeys'
import type { CategoryMarketingPricingPatch } from '../../lib/categoryMarketingApiSave'
import {
  fetchPlatformServicesForSeoCategory,
} from '../../lib/seoLandingCatalogSlugs'
import type { CmsCatalogCategoryOption } from '../../constants/cmsCatalogCategories'
import { CategoryMarketingWriterSection } from './CategoryMarketingWriterSection'
import type { PlatformService } from '../../services/api/platformServices.service'

type Props = {
  selectedCategory: string
  industryLabel: string
  effectiveKey: string
  config: CategoryMarketingConfig
  catalogOptions: CmsCatalogCategoryOption[]
  onUpdate: (patch: Partial<CategoryMarketingConfig>) => void
  /** Persists pricing fields to category-marketing API (mirrors consumer CMS keys). */
  onApplyAndSave: (patch: CategoryMarketingPricingPatch) => Promise<void>
  saving?: boolean
}

export function CategoryMarketingPricingPanel({
  selectedCategory,
  industryLabel,
  effectiveKey,
  config,
  catalogOptions,
  onUpdate,
  onApplyAndSave,
  saving = false,
}: Props) {
  const [loading, setLoading] = useState(true)
  const [rateCardParts, setRateCardParts] = useState<RateCardPartRow[]>([])
  const [platformServices, setPlatformServices] = useState<PlatformService[]>([])
  const [persisting, setPersisting] = useState(false)

  const marketingKeys = useMemo(
    () => cmsMarketingBaseKeysForCatalogSlug(selectedCategory),
    [selectedCategory],
  )

  const refreshSources = useCallback(async () => {
    setLoading(true)
    try {
      const [rateCardsRaw, services] = await Promise.all([
        CMSService.getRateCards(),
        fetchPlatformServicesForSeoCategory(selectedCategory, catalogOptions),
      ])
      const rateMap =
        typeof rateCardsRaw === 'object' && rateCardsRaw !== null
          ? (rateCardsRaw as Record<string, RateCardPartRow[]>)
          : {}
      const mergedRate: RateCardPartRow[] = []
      const seen = new Set<string>()
      for (const k of [...marketingKeys, selectedCategory]) {
        const parts = rateMap[k] ?? []
        for (const part of parts) {
          const name = part.name?.trim()
          if (!name) continue
          const key = name.toLowerCase()
          if (seen.has(key)) continue
          seen.add(key)
          mergedRate.push({ name, price: part.price?.trim() || '' })
        }
      }
      setRateCardParts(mergedRate)
      setPlatformServices(services)
    } catch {
      appToast('Could not load catalog prices — try again.', 'error')
      setRateCardParts([])
      setPlatformServices([])
    } finally {
      setLoading(false)
    }
  }, [selectedCategory, catalogOptions, marketingKeys])

  useEffect(() => {
    void refreshSources()
  }, [refreshSources])

  const previewRows = useMemo(
    () =>
      buildPricingTableFromSources({
        rateCardParts,
        platformServices,
      }),
    [rateCardParts, platformServices],
  )

  const sourceSummary = useMemo(
    () =>
      summarizePricingSources({
        rateCardParts,
        platformServices,
        merged: previewRows,
      }),
    [rateCardParts, platformServices, previewRows],
  )

  const persistPatch = async (patch: CategoryMarketingPricingPatch, toastMsg: string) => {
    setPersisting(true)
    try {
      onUpdate(patch)
      await onApplyAndSave(patch)
      appToast(toastMsg, 'success')
    } catch {
      appToast('Could not save pricing — try Save in the toolbar or check API.', 'error')
    } finally {
      setPersisting(false)
    }
  }

  const applyPricingTable = () => {
    if (previewRows.length === 0) {
      appToast('No bookable services or rate-card lines for this industry yet.', 'warning')
      return
    }
    onUpdate({ spareParts: previewRows })
    appToast(`Pricing table updated — ${previewRows.length} row(s). Click “Apply & save” to publish.`, 'success')
  }

  const applyAndSavePricingTable = () => {
    if (previewRows.length === 0) {
      appToast('No bookable services or rate-card lines for this industry yet.', 'warning')
      return
    }
    void persistPatch({ spareParts: previewRows }, `Pricing saved to API — ${previewRows.length} row(s).`)
  }

  const applyAndSaveIndustryExtras = () => {
    const { pricingIncluded, pricingExcluded } = getIndustryPricingLists(selectedCategory)
    const comparisonRows = getIndustryComparisonRows(selectedCategory)
    const patch: CategoryMarketingPricingPatch = {
      spareParts: previewRows.length ? previewRows : config.spareParts,
      comparisonRows,
      pricingIncluded,
      pricingExcluded,
    }
    void persistPatch(patch, 'Industry pricing pack saved to API.')
  }

  const busy = loading || saving || persisting

  const sourceBadge =
    sourceSummary.primarySource === 'mixed'
      ? 'Catalog + rate card'
      : sourceSummary.primarySource === 'rate-card'
        ? 'Rate card'
        : sourceSummary.primarySource === 'catalog'
          ? 'Live catalog'
          : 'No prices yet'

  return (
    <div className="flex flex-col gap-3">
      <CategoryMarketingWriterSection
        title="Pricing table"
        hint={`Auto-built from ${industryLabel} services. Rate-card lines override catalog prices when names match.`}
        actions={
          <div className="flex flex-wrap gap-1.5">
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={busy}
              onClick={() => void refreshSources()}
            >
              {loading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <RefreshCw className="h-3.5 w-3.5" />
              )}
            </Button>
            <Button type="button" size="sm" variant="outline" disabled={busy} onClick={applyPricingTable}>
              Preview in editor
            </Button>
            <Button type="button" size="sm" variant="default" disabled={busy} onClick={applyAndSavePricingTable}>
              {persisting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
              Apply &amp; save
            </Button>
          </div>
        }
      >
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <Badge variant="secondary">{sourceBadge}</Badge>
          <span>
            CMS key: <code className="font-mono text-[10px] text-foreground">{effectiveKey}</code>
          </span>
          <span aria-hidden>·</span>
          <span>
            Consumer also reads: {marketingKeys.map((k) => k).join(', ')}
          </span>
          <span aria-hidden>·</span>
          <span>
            {sourceSummary.catalogCount} catalog service{sourceSummary.catalogCount === 1 ? '' : 's'}
          </span>
          <span aria-hidden>·</span>
          <span>
            {sourceSummary.rateCardCount} rate-card line{sourceSummary.rateCardCount === 1 ? '' : 's'}
          </span>
          <span aria-hidden>·</span>
          <span>{sourceSummary.mergedCount} row{sourceSummary.mergedCount === 1 ? '' : 's'} ready</span>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            variant="secondary"
            className="gap-1.5"
            disabled={busy}
            onClick={applyAndSaveIndustryExtras}
          >
            {persisting ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden /> : <Sparkles className="h-3.5 w-3.5" aria-hidden />}
            Apply &amp; save pack
          </Button>
          <Button type="button" size="sm" variant="outline" asChild>
            <Link to="/cms/category-marketing?tab=rate-card">Edit rate card</Link>
          </Button>
          <Button type="button" size="sm" variant="outline" asChild>
            <Link to="/rate-cards/catalog">Catalog prices</Link>
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            Loading services…
          </div>
        ) : previewRows.length === 0 ? (
          <p className="rounded-md border border-dashed border-border/80 bg-muted/20 px-3 py-4 text-sm text-muted-foreground">
            No active services found for this industry. Add services in the platform catalog or lines on the{' '}
            <Link to="/cms/category-marketing?tab=rate-card" className="underline">
              rate card
            </Link>{' '}
            tab, then click <strong className="font-medium text-foreground">Apply &amp; save</strong>.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-md border border-border/70">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[220px]">Service / item</TableHead>
                  <TableHead className="min-w-[140px]">ProFixer price</TableHead>
                  <TableHead className="w-[80px] text-right">Saved</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {previewRows.map((row) => {
                  const saved = config.spareParts.some(
                    (p) => p.name.trim().toLowerCase() === row.name.trim().toLowerCase(),
                  )
                  return (
                    <TableRow key={row.name}>
                      <TableCell className="font-medium">{row.name}</TableCell>
                      <TableCell className="tabular-nums text-muted-foreground">{row.priceRange}</TableCell>
                      <TableCell className="text-right">
                        {saved ? (
                          <Badge variant="success" className="text-[10px]">
                            Yes
                          </Badge>
                        ) : (
                          <span className="text-[10px] text-muted-foreground">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        )}

        {config.spareParts.length > 0 ? (
          <p className="text-[11px] text-muted-foreground">
            Saved on this page: {config.spareParts.filter((p) => p.name.trim()).length} row(s). Consumer shows saved
            rows first; empty saved table falls back to rate card on the live site.
          </p>
        ) : null}

        <Accordion type="single" collapsible className="rounded-md border border-border/60">
          <AccordionItem value="manual-pricing" className="border-0">
            <AccordionTrigger className="px-3 py-2 text-xs hover:no-underline">
              Edit pricing rows manually
            </AccordionTrigger>
            <AccordionContent className="space-y-2 px-3 pb-3">
              {config.spareParts.map((row, i) => (
                <div key={`sp-${i}`} className="flex flex-col gap-2 sm:flex-row sm:items-end">
                  <div className="min-w-0 flex-1 space-y-1">
                    <Label className="text-[10px]">Item</Label>
                    <Input
                      className="h-8 text-sm"
                      value={row.name}
                      onChange={(e) => {
                        const next = [...config.spareParts]
                        next[i] = { ...next[i], name: e.target.value }
                        onUpdate({ spareParts: next })
                      }}
                    />
                  </div>
                  <div className="min-w-0 flex-1 space-y-1">
                    <Label className="text-[10px]">Price</Label>
                    <Input
                      className="h-8 text-sm"
                      value={row.priceRange}
                      onChange={(e) => {
                        const next = [...config.spareParts]
                        next[i] = { ...next[i], priceRange: e.target.value }
                        onUpdate({ spareParts: next })
                      }}
                    />
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="text-destructive"
                    onClick={() => onUpdate({ spareParts: config.spareParts.filter((_, j) => j !== i) })}
                  >
                    Remove
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => onUpdate({ spareParts: [...config.spareParts, emptySparePart()] })}
              >
                Add row
              </Button>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CategoryMarketingWriterSection>

      <CategoryMarketingWriterSection title="What's included in the visit charge">
        {(config.pricingIncluded.length ? config.pricingIncluded : ['']).map((line, i) => (
          <div key={`pi-${i}`} className="flex gap-2">
            <Input
              className="h-8 text-sm"
              value={line}
              onChange={(e) => {
                const base = config.pricingIncluded.length ? [...config.pricingIncluded] : ['']
                base[i] = e.target.value
                onUpdate({ pricingIncluded: base })
              }}
              placeholder="Diagnosis within quoted window"
            />
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="shrink-0 text-destructive"
              onClick={() => onUpdate({ pricingIncluded: config.pricingIncluded.filter((_, j) => j !== i) })}
            >
              Remove
            </Button>
          </div>
        ))}
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => onUpdate({ pricingIncluded: [...config.pricingIncluded, ''] })}
        >
          Add included line
        </Button>
      </CategoryMarketingWriterSection>

      <CategoryMarketingWriterSection title="Not included (quoted separately)">
        {(config.pricingExcluded.length ? config.pricingExcluded : ['']).map((line, i) => (
          <div key={`pe-${i}`} className="flex gap-2">
            <Input
              className="h-8 text-sm"
              value={line}
              onChange={(e) => {
                const base = config.pricingExcluded.length ? [...config.pricingExcluded] : ['']
                base[i] = e.target.value
                onUpdate({ pricingExcluded: base })
              }}
              placeholder="Major parts unless pre-approved"
            />
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="shrink-0 text-destructive"
              onClick={() => onUpdate({ pricingExcluded: config.pricingExcluded.filter((_, j) => j !== i) })}
            >
              Remove
            </Button>
          </div>
        ))}
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => onUpdate({ pricingExcluded: [...config.pricingExcluded, ''] })}
        >
          Add excluded line
        </Button>
      </CategoryMarketingWriterSection>

      <CategoryMarketingWriterSection
        title="ProFixer vs local market"
        hint="Industry template — edit after generating."
        actions={
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => onUpdate({ comparisonRows: getIndustryComparisonRows(selectedCategory) })}
          >
            Reset template
          </Button>
        }
      >
        {config.comparisonRows.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            Click <strong className="font-medium text-foreground">Full industry pack</strong> or{' '}
            <strong className="font-medium text-foreground">Reset template</strong> to fill the comparison table.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-md border border-border/70">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Topic</TableHead>
                  <TableHead>ProFixer</TableHead>
                  <TableHead>Others</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {config.comparisonRows.map((row, i) => (
                  <TableRow key={`cmp-${i}`}>
                    <TableCell>
                      <Input
                        className="h-8 text-sm"
                        value={row.label}
                        onChange={(e) => {
                          const next = [...config.comparisonRows]
                          next[i] = { ...next[i], label: e.target.value }
                          onUpdate({ comparisonRows: next })
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        className="h-8 text-sm"
                        value={row.profixer}
                        onChange={(e) => {
                          const next = [...config.comparisonRows]
                          next[i] = { ...next[i], profixer: e.target.value }
                          onUpdate({ comparisonRows: next })
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        className="h-8 text-sm"
                        value={row.others}
                        onChange={(e) => {
                          const next = [...config.comparisonRows]
                          next[i] = { ...next[i], others: e.target.value }
                          onUpdate({ comparisonRows: next })
                        }}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => onUpdate({ comparisonRows: [...config.comparisonRows, emptyComparisonRow()] })}
        >
          Add comparison row
        </Button>
      </CategoryMarketingWriterSection>
    </div>
  )
}
