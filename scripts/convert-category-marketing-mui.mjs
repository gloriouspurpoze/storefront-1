/**
 * One-shot helper: strip MUI from CategoryMarketingManagement.tsx → shadcn/Tailwind.
 * Run: node scripts/convert-category-marketing-mui.mjs
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const target = path.join(__dirname, '../src/pages/cms/CategoryMarketingManagement.tsx')

let s = fs.readFileSync(target, 'utf8')

const newImports = `import React, { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  Loader2,
  ChevronDown,
  Trash2,
  Plus,
  Megaphone,
  Image as ImageIcon,
} from 'lucide-react'
import {
  Button,
  Card,
  CardContent,
  Input,
  Label,
  Textarea,
  Checkbox,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '../../components/ui'
import { cn } from '../../lib/utils'
`

s = s.replace(
  /^import React[\s\S]*?from '\.\/IndustryServicePagesContext'\n/m,
  `${newImports}import { CMSService } from '../../services/api'
import { PageHeader } from '../../components/common/PageHeader'
import ImageUploadField from '../../components/forms/ImageUploadField'
import type { ImageFile } from '../../components/forms/ImageUploadField'
import { CMS_CATALOG_CATEGORIES } from '../../constants/cmsCatalogCategories'
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
  type LocalSeoCmsFields,
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

`,
)

s = s.replace(
  /function charCountColor\(len: number, min: number, optimal: number, hard: number\): string \{\n  if \(len > hard\) return 'error\.main'\n  if \(len > optimal\) return 'warning\.main'\n  if \(len >= min\) return 'success\.main'\n  return 'text\.secondary'\n\}/,
  `function charCountColor(len: number, min: number, optimal: number, hard: number): string {
  if (len > hard) return 'text-destructive'
  if (len > optimal) return 'text-amber-600'
  if (len >= min) return 'text-emerald-600'
  return 'text-muted-foreground'
}`,
)

function alertInfo(inner) {
  return `<div role="status" className="rounded-lg border border-border bg-muted/50 p-3 text-sm text-foreground">${inner}</div>`
}

s = s.replace(
  /<Alert severity="info" sx=\{\{ borderRadius: 2 \}\}>\s*([\s\S]*?)<\/Alert>/g,
  (_, body) => alertInfo(body.trim()),
)
s = s.replace(
  /<Alert severity="warning" sx=\{\{ mb: 2 \}\}>\s*([\s\S]*?)<\/Alert>/g,
  (_, body) =>
    `<div role="alert" className="mb-2 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-amber-900 dark:text-amber-100">${body.trim()}</div>`,
)
s = s.replace(
  /<Alert severity="info">\s*([\s\S]*?)<\/Alert>/g,
  (_, body) => alertInfo(body.trim()),
)

// Tab shell
s = s.replace(
  `<Stack spacing={2}>
          <TabContext value={tab}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider', overflowX: 'auto' }}>
              <TabList
                onChange={(_, v) => setTab(v as TabKey)}
                variant="scrollable"
                scrollButtons="auto"
                allowScrollButtonsMobile
              >
                <Tab label="Metadata & SEO" value="metadata" />
                <Tab label="Local SEO" value="localSeo" />
                <Tab label="Hero & intro" value="hero" />
                <Tab label="Service cards" value="cards" />
                <Tab label="Detailed options" value="detailed" />
                <Tab label="Trust & experience" value="trust" />
                <Tab label="Areas & booking" value="areas" />
                <Tab label="Pricing & comparison" value="pricing" />
                <Tab label="FAQs & links" value="faqs" />
                <Tab label="Locality guide (SEO)" value="localityGuide" />
                <Tab label="Closing & advanced" value="closing" />
              </TabList>
            </Box>

            <TabPanel value="metadata" sx={{ px: 0 }}>`,
  `<div className="flex flex-col gap-2">
          <Tabs value={tab} onValueChange={(v) => setTab(v as TabKey)} className="w-full">
            <div className="overflow-x-auto border-b border-border">
              <TabsList className="inline-flex h-auto min-h-10 w-max min-w-full max-w-none flex-wrap justify-start gap-1 rounded-none bg-transparent p-1">
                <TabsTrigger value="metadata" className="shrink-0">Metadata & SEO</TabsTrigger>
                <TabsTrigger value="localSeo" className="shrink-0">Local SEO</TabsTrigger>
                <TabsTrigger value="hero" className="shrink-0">Hero & intro</TabsTrigger>
                <TabsTrigger value="cards" className="shrink-0">Service cards</TabsTrigger>
                <TabsTrigger value="detailed" className="shrink-0">Detailed options</TabsTrigger>
                <TabsTrigger value="trust" className="shrink-0">Trust & experience</TabsTrigger>
                <TabsTrigger value="areas" className="shrink-0">Areas & booking</TabsTrigger>
                <TabsTrigger value="pricing" className="shrink-0">Pricing & comparison</TabsTrigger>
                <TabsTrigger value="faqs" className="shrink-0">FAQs & links</TabsTrigger>
                <TabsTrigger value="localityGuide" className="shrink-0">Locality guide (SEO)</TabsTrigger>
                <TabsTrigger value="closing" className="shrink-0">Closing & advanced</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="metadata" className="mt-4 px-0 outline-none focus-visible:ring-0">`,
)

s = s.replace(/<TabPanel value="([^"]+)" sx=\{\{ px: 0 \}\}>/g, '<TabsContent value="$1" className="mt-4 px-0 outline-none focus-visible:ring-0">')
s = s.replace(/<\/TabPanel>/g, '</TabsContent>')
s = s.replace('          </TabContext>', '          </Tabs>')

// Root layout
s = s.replace(
  /return \(\n    <Box sx=\{\{ p: industryHub \? 0 : \{ xs: 2, sm: 3, md: 4 \} \}\}>/,
  `return (
    <div className={cn(!industryHub && 'p-4 sm:p-6 md:p-8')}>`,
)
s = s.replace(/\s*<\/Box>\n  \)\n\}/, '\n    </div>\n  )\n}')

// Loading
s = s.replace(
  `<Box display="flex" justifyContent="center" alignItems="center" minHeight="280px">
          <CircularProgress />
        </Box>`,
  `<div className="flex min-h-[280px] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" aria-hidden />
        </div>`,
)

// Save buttons icons
s = s.replace(/startIcon=\{saving \? <CircularProgress size=\{18\} \/> : <CampaignIcon \/>\}/g, '')
s = s.replace(
  /<Button\n\s*variant="contained"\n\s*onClick=\{handleSave\}/g,
  `<Button
              disabled={saving}
              onClick={handleSave}`,
)
s = s.replace(
  /<Button\n\s*variant="contained"\n\s*onClick=\{handleSave\}\n\s*disabled=\{saving\}/g,
  `<Button onClick={handleSave}
            disabled={saving}`,
)

// Generic replacements — order matters
s = s.replace(/<Box /g, '<div ')
s = s.replace(/<\/Box>/g, '</div>')
s = s.replace(/<Stack /g, '<div ')
s = s.replace(/<\/Stack>/g, '</div>')

fs.writeFileSync(target, s)
console.log('Pass 1 written. Review and run follow-up script or fix manually.')
