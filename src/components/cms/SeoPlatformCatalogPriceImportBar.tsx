import React from 'react'
import { Loader2, Sparkles } from 'lucide-react'
import { Button } from '../ui/button'
import { normalizeSeoCategorySlug } from '../../lib/seoLandingCatalogSlugs'

type Props = {
  serviceSlug: string
  categoryLabelMap: Record<string, string>
  canMutate: boolean
  loading: boolean
  onImport: (mode: 'replace' | 'merge') => void
}

export function SeoPlatformCatalogPriceImportBar({
  serviceSlug,
  categoryLabelMap,
  canMutate,
  loading,
  onImport,
}: Props) {
  if (!serviceSlug) {
    return (
      <p className="mb-3 text-xs text-amber-600 dark:text-amber-400">
        Pick a service category in Setup to load charge rows from the platform catalog.
      </p>
    )
  }

  const label = catalogLabelMap[normalizeSeoCategorySlug(serviceSlug)] ?? serviceSlug

  return (
    <div className="mb-4 flex flex-wrap items-center gap-2 rounded-md border border-border/60 bg-muted/30 px-3 py-2">
      <Button
        type="button"
        size="sm"
        variant="secondary"
        disabled={!canMutate || loading}
        onClick={() => onImport('replace')}
      >
        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
        Load from platform catalog
      </Button>
      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={!canMutate || loading}
        onClick={() => onImport('merge')}
      >
        Add missing services
      </Button>
      <span className="text-xs text-muted-foreground">
        Industry-level prices from Platform Services for <strong>{label}</strong> — base / hourly / consultation
        rates.
      </span>
    </div>
  )
}
