import React from 'react'
import { GitCompareArrows } from 'lucide-react'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '../ui/accordion'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { Label } from '../ui/label'
import { Textarea } from '../ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select'
import { IndustryLandingEditorPreview } from './IndustryLandingEditorPreview'
import type { CategoryMarketingConfig } from '../../types/categoryMarketing'

type DiffRow = { path: string; industry: string; locality: string }

type Props = {
  config: CategoryMarketingConfig
  effectiveKey: string
  selectedCategory: string
  industryLabel: string
  localityDisplayLabel: string
  normalizedLocalitySlug: string
  publicSiteOrigin: string
  industryRobotsMeta: string
  data: Record<string, CategoryMarketingConfig>
  duplicateSourceKey: string
  importJsonText: string
  localityDiff: { rows: DiffRow[]; hasSavedIndustryKey: boolean } | null
  localityDiffExpanded: boolean
  onDuplicateSourceChange: (key: string) => void
  onImportTextChange: (text: string) => void
  onToggleDiffExpanded: () => void
  onFullReplace: () => void
  onMergeLocality: () => void
  onMergeLocalSeo: () => void
  onApplyJsonMerge: () => void
  onClearImport: () => void
}

export function CategoryMarketingAdvancedTools({
  config,
  effectiveKey,
  selectedCategory,
  industryLabel,
  localityDisplayLabel,
  normalizedLocalitySlug,
  publicSiteOrigin,
  industryRobotsMeta,
  data,
  duplicateSourceKey,
  importJsonText,
  localityDiff,
  localityDiffExpanded,
  onDuplicateSourceChange,
  onImportTextChange,
  onToggleDiffExpanded,
  onFullReplace,
  onMergeLocality,
  onMergeLocalSeo,
  onApplyJsonMerge,
  onClearImport,
}: Props) {
  const otherKeys = Object.keys(data).filter((k) => k !== effectiveKey).sort()

  return (
    <Accordion type="single" collapsible className="rounded-lg border border-border/70 bg-card/40">
      <AccordionItem value="advanced" className="border-0">
        <AccordionTrigger className="px-3 py-2.5 text-sm font-medium hover:no-underline">
          Preview, import &amp; developer tools
        </AccordionTrigger>
        <AccordionContent className="space-y-4 px-3 pb-4">
          <IndustryLandingEditorPreview
            config={config}
            effectiveKey={effectiveKey}
            industryLabel={industryLabel}
            localityDisplayLabel={localityDisplayLabel}
            publicOrigin={publicSiteOrigin}
            catalogStorageSlug={selectedCategory}
            industryRobotsMeta={industryRobotsMeta}
          />

          {normalizedLocalitySlug && localityDiff ? (
            <div className="rounded-lg border border-border/60 p-3">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <GitCompareArrows className="h-4 w-4 text-muted-foreground" aria-hidden />
                <span className="text-sm font-medium">Locality diff vs industry base</span>
                <Badge variant={localityDiff.rows.length ? 'secondary' : 'success'}>
                  {localityDiff.rows.length ? `${localityDiff.rows.length} overrides` : 'No overrides'}
                </Badge>
              </div>
              {localityDiff.rows.length > 0 ? (
                <div className="max-h-48 overflow-auto rounded border text-[11px]">
                  <table className="w-full border-collapse">
                    <thead className="sticky top-0 bg-muted">
                      <tr>
                        <th className="px-2 py-1 text-left">Path</th>
                        <th className="px-2 py-1 text-left">Locality</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(localityDiffExpanded ? localityDiff.rows : localityDiff.rows.slice(0, 40)).map((row) => (
                        <tr key={row.path} className="border-t align-top">
                          <td className="px-2 py-1 font-mono text-muted-foreground">{row.path}</td>
                          <td className="px-2 py-1">{row.locality}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">Matches industry-wide defaults.</p>
              )}
              {localityDiff.rows.length > 40 ? (
                <Button type="button" size="sm" variant="ghost" className="mt-2 h-7" onClick={onToggleDiffExpanded}>
                  {localityDiffExpanded ? 'Show fewer' : 'Show all'}
                </Button>
              ) : null}
            </div>
          ) : null}

          <div className="rounded-lg border border-border/60 p-3 space-y-3">
            <p className="text-sm font-medium">Clone or import</p>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
              <div className="min-w-[180px] flex-1 space-y-1">
                <Label className="text-xs text-muted-foreground">Copy from key</Label>
                <Select
                  value={duplicateSourceKey || '__empty__'}
                  onValueChange={(v) => onDuplicateSourceChange(v === '__empty__' ? '' : v)}
                >
                  <SelectTrigger className="h-8">
                    <SelectValue placeholder="Select key…" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__empty__">Select key…</SelectItem>
                    {otherKeys.map((k) => (
                      <SelectItem key={k} value={k}>
                        {k}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-wrap gap-1.5">
                <Button type="button" size="sm" variant="outline" disabled={!duplicateSourceKey} onClick={onFullReplace}>
                  Full replace
                </Button>
                <Button type="button" size="sm" variant="secondary" disabled={!duplicateSourceKey} onClick={onMergeLocality}>
                  Guide only
                </Button>
                <Button type="button" size="sm" variant="secondary" disabled={!duplicateSourceKey} onClick={onMergeLocalSeo}>
                  Local SEO only
                </Button>
              </div>
            </div>
            <Textarea
              className="font-mono text-xs"
              rows={4}
              placeholder='Paste partial JSON to merge…'
              value={importJsonText}
              onChange={(e) => onImportTextChange(e.target.value)}
            />
            <div className="flex gap-2">
              <Button type="button" size="sm" onClick={onApplyJsonMerge}>
                Merge JSON
              </Button>
              <Button type="button" size="sm" variant="ghost" onClick={onClearImport}>
                Clear
              </Button>
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  )
}
