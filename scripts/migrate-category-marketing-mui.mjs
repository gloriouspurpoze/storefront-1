/**
 * One-off: strip MUI from CategoryMarketingManagement.tsx
 * Run: node scripts/migrate-category-marketing-mui.mjs
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const file = path.join(__dirname, '../src/pages/cms/CategoryMarketingManagement.tsx')
let s = fs.readFileSync(file, 'utf8')

function stripSx(str) {
  let out = ''
  let i = 0
  while (i < str.length) {
    const slice = str.slice(i)
    if (slice.startsWith(' sx=')) {
      let j = i + 4
      while (j < str.length && /\s/.test(str[j])) j++
      if (str[j] === '{') {
        let depth = 0
        let k = j
        for (; k < str.length; k++) {
          if (str[k] === '{') depth++
          else if (str[k] === '}') {
            depth--
            if (depth === 0) {
              k++
              break
            }
          }
        }
        i = k
        continue
      }
    }
    out += str[i]
    i++
  }
  return out
}

const newImports = `import React, { useState, useEffect, useMemo } from 'react'
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
`

s = s.replace(
  /^import React[\s\S]*?from '@mui\/icons-material'\n/m,
  `${newImports}import { cn } from '../../lib/utils'\n`,
)

// stripSx before tag renames (sx may nest complex objects)
s = stripSx(s)

// Tabs lab → shadcn (structure)
s = s.replace(
  /<TabContext value=\{tab\}>[\s\S]*?<\/TabList>\s*<\/Box>/,
  `<Tabs value={tab} onValueChange={(v) => setTab(v as TabKey)} className="w-full">
            <div className="overflow-x-auto border-b">
              <TabsList className="mb-0 inline-flex h-auto min-h-10 w-max min-w-full justify-start gap-0 rounded-none border-0 bg-transparent p-1">
                <TabsTrigger value="metadata" className="shrink-0">Metadata &amp; SEO</TabsTrigger>
                <TabsTrigger value="localSeo" className="shrink-0">Local SEO</TabsTrigger>
                <TabsTrigger value="hero" className="shrink-0">Hero &amp; intro</TabsTrigger>
                <TabsTrigger value="cards" className="shrink-0">Service cards</TabsTrigger>
                <TabsTrigger value="detailed" className="shrink-0">Detailed options</TabsTrigger>
                <TabsTrigger value="trust" className="shrink-0">Trust &amp; experience</TabsTrigger>
                <TabsTrigger value="areas" className="shrink-0">Areas &amp; booking</TabsTrigger>
                <TabsTrigger value="pricing" className="shrink-0">Pricing &amp; comparison</TabsTrigger>
                <TabsTrigger value="faqs" className="shrink-0">FAQs &amp; links</TabsTrigger>
                <TabsTrigger value="localityGuide" className="shrink-0">Locality guide (SEO)</TabsTrigger>
                <TabsTrigger value="closing" className="shrink-0">Closing &amp; advanced</TabsTrigger>
              </TabsList>
            </div>`,
)

s = s.replace(/<\/TabContext>/g, '</Tabs>')

s = s.replace(/<TabPanel value="([^"]+)"[^>]*>/g, '<TabsContent value="$1" className="mt-2 px-0 outline-none">')
s = s.replace(/<\/TabPanel>/g, '</TabsContent>')

// Box, Stack
s = s.replace(/<Box/g, '<div')
s = s.replace(/<\/Box>/g, '</div>')
s = s.replace(/<Stack /g, '<div className="flex flex-col gap-4" ')
s = s.replace(/<Stack>/g, '<div className="flex flex-col gap-4">')
// Stack with direction — rough
s = s.replace(
  /<div className="flex flex-col gap-4" direction=\{\{ xs: 'column', sm: 'row' \}\} spacing=\{2\}/g,
  '<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-2"'
)
s = s.replace(
  /<div className="flex flex-col gap-4" direction=\{\{ xs: 'column', sm: 'row' \}\} spacing=\{2\} alignItems=\{\{ sm: 'center' \}\}/g,
  '<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-2"'
)
s = s.replace(/<div className="flex flex-col gap-4" direction="row" spacing=\{1\} flexWrap="wrap">/g, '<div className="flex flex-row flex-wrap gap-2">')
s = s.replace(/<\/Stack>/g, '</div>')

// Typography → elements
s = s.replace(/<Typography variant="h6"([^>]*)>/g, '<h3 className="text-lg font-semibold"$1>')
s = s.replace(/<Typography variant="subtitle1" fontWeight=\{600\} gutterBottom>/g, '<p className="mb-2 text-base font-semibold">')
s = s.replace(
  /<Typography variant="subtitle2" color="text\.secondary">/g,
  '<p className="text-sm text-muted-foreground">',
)
s = s.replace(
  /<Typography variant="subtitle2">/g,
  '<p className="text-sm font-medium">',
)
s = s.replace(
  /<Typography variant="body2" color="text\.secondary"([^>]*)>/g,
  '<p className="text-sm text-muted-foreground"$1>',
)
s = s.replace(/<Typography variant="body2"([^>]*)>/g, '<p className="text-sm"$1>')
s = s.replace(
  /<Typography variant="caption"([^>]*)>/g,
  '<p className="text-xs text-muted-foreground"$1>',
)

s = s.replace(/<\/Typography>/g, '</p>')

s = s.replace(
  /if \(len > hard\) return 'error\.main'\s*\n\s*if \(len > optimal\) return 'warning\.main'\s*\n\s*if \(len >= min\) return 'success\.main'\s*\n\s*return 'text\.secondary'/,
  `if (len > hard) return 'text-destructive'
  if (len > optimal) return 'text-amber-600'
  if (len >= min) return 'text-emerald-600'
  return 'text-muted-foreground'`,
)

s = s.replace(
  /<Alert severity="warning"[^>]*>/g,
  '<div role="alert" className="mb-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950 dark:border-amber-900 dark:bg-amber-950/30">',
)
s = s.replace(
  /<Alert severity="info"[^>]*>/g,
  '<div role="alert" className="rounded-md border border-blue-200 bg-blue-50/80 p-3 text-sm dark:border-blue-900 dark:bg-blue-950/30">',
)
s = s.replace(/<\/Alert>/g, '</div>')

// Button MUI → shadcn
s = s.replace(/variant="contained"/g, 'variant="default"')
s = s.replace(/variant="outlined"/g, 'variant="outline"')
s = s.replace(/color="secondary"/g, 'variant="secondary"')
s = s.replace(/startIcon=\{/g, 'leftIcon={')
s = s.replace(/<CircularProgress size=\{18\} \/>/g, '<Loader2 className="h-4 w-4 animate-spin" />')
s = s.replace(/<CircularProgress size=\{16\} \/>/g, '<Loader2 className="h-4 w-4 animate-spin" />')
s = s.replace(/<CircularProgress \/>/g, '<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />')
s = s.replace(/<CircularProgress size=\{[^}]+\} \/>/g, '<Loader2 className="h-5 w-5 animate-spin" />')

// Icons
s = s.replace(/<ExpandMoreIcon \/>/g, '<ChevronDown className="h-4 w-4 shrink-0" />')
s = s.replace(/<DeleteIcon/g, '<Trash2 className="h-4 w-4"')
s = s.replace(/<AddIcon/g, '<Plus className="h-4 w-4"')
s = s.replace(/<CampaignIcon/g, '<Megaphone className="h-4 w-4"')
s = s.replace(/<ImageIcon/g, '<ImageIconLucide className="h-4 w-4"')

s = s.replace(/<Trash2 className="h-4 w-4" fontSize="small" \/>/g, '<Trash2 className="h-4 w-4" />')

// Card — already name collision? shadcn Card same name
// TextField → Input + Label (keep id) - too varied; script leaves TextField for second pass

// FormControlLabel — multiline Checkbox; fix in follow-up pass

// Remaining cleanup invalid JSX may need manual fix

fs.writeFileSync(file, s)
console.log('migrate-category-marketing-mui.mjs: pass applied — verify and fix TextField/Select manually')
