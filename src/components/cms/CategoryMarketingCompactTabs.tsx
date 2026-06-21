import React from 'react'
import { TabsList, TabsTrigger } from '../ui/tabs'
import { cn } from '../../lib/utils'
import type { TabKey } from '../../pages/cms/categoryMarketingTabConfig'

const TAB_ITEMS: { value: TabKey; label: string; short: string }[] = [
  { value: 'metadata', label: 'Metadata & SEO', short: 'SEO' },
  { value: 'localSeo', label: 'Local SEO', short: 'Local' },
  { value: 'hero', label: 'Hero & intro', short: 'Hero' },
  { value: 'cards', label: 'Service cards', short: 'Cards' },
  { value: 'detailed', label: 'Detailed options', short: 'Options' },
  { value: 'trust', label: 'Trust', short: 'Trust' },
  { value: 'areas', label: 'Areas & booking', short: 'Areas' },
  { value: 'pricing', label: 'Pricing', short: 'Pricing' },
  { value: 'faqs', label: 'FAQs & links', short: 'FAQs' },
  { value: 'localityGuide', label: 'Locality guide', short: 'Guide' },
  { value: 'closing', label: 'Closing', short: 'Close' },
]

type Props = {
  tabNeedsAttention: (tab: TabKey) => boolean
  className?: string
}

export function CategoryMarketingCompactTabsList({ tabNeedsAttention, className }: Props) {
  return (
    <div className={cn('sticky top-[4.25rem] z-10 -mx-0.5 overflow-x-auto rounded-lg border border-border/70 bg-muted/40', className)}>
      <TabsList className="mb-0 inline-flex h-auto min-h-8 w-max min-w-full justify-start gap-0 rounded-none border-0 bg-transparent p-1">
        {TAB_ITEMS.map(({ value, label, short }) => (
          <TabsTrigger
            key={value}
            value={value}
            title={label}
            className="relative shrink-0 rounded-md px-2.5 py-1 text-xs font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm sm:px-3"
          >
            <span className="sm:hidden">{short}</span>
            <span className="hidden sm:inline">{label}</span>
            {tabNeedsAttention(value) ? (
              <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-amber-500" aria-label="Needs attention" />
            ) : null}
          </TabsTrigger>
        ))}
      </TabsList>
    </div>
  )
}

export { TAB_ITEMS }
