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
    if (str.slice(i, i + 4) === ' sx=') {
      let j = i + 4
      while (j < str.length && /\s/.test(str[j])) j++
      if (str[j] === '{') {
        let depth = 0
        for (let k = j; k < str.length; k++) {
          if (str[k] === '{') depth++
          else if (str[k] === '}') {
            depth--
            if (depth === 0) {
              i = k + 1
              break
            }
          }
        }
        continue
      }
    }
    out += str[i]
    i++
  }
  return out
}

s = stripSx(s)

s = s.replace(/<\/TabContext>/g, '</Tabs>')

// Layout primitive renames
s = s.replace(/<Box\b/g, '<div')
s = s.replace(/<\/Box>/g, '</div>')

s = s.replace(/<Stack spacing=\{2\}>/g, '<div className="flex flex-col gap-4">')
s = s.replace(/<Stack spacing=\{2\}\s*>/g, '<div className="flex flex-col gap-4">')
s = s.replace(/<Stack spacing=\{3\}>/g, '<div className="flex flex-col gap-6">')
s = s.replace(/<Stack spacing=\{1\}>/g, '<div className="flex flex-col gap-2">')
s = s.replace(/<\/Stack>/g, '</div>')

// common Stack with props → generic flex container (Tailwind)
s = s.replace(/<Stack direction=\{\{ xs: 'column', sm: 'row' \}\} spacing=\{2\}[^>]*>/g, '<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-4">')
s = s.replace(
  /<Stack direction=\{\{ xs: 'column', sm: 'row' \}\} spacing=\{2\} alignItems=\{\{ sm: 'center' \}\}>/g,
  '<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-4">',
)
s = s.replace(
  /<Stack direction=\{\{ xs: 'column', sm: 'row' \}\} spacing=\{2\} alignItems=\{\{ sm: 'center' \}\} flexWrap="wrap">/g,
  '<div className="flex flex-col flex-wrap gap-4 sm:flex-row sm:items-center sm:gap-4">',
)
s = s.replace(/<Stack direction="row" spacing=\{1\} flexWrap="wrap">/g, '<div className="flex flex-row flex-wrap gap-2">')
s = s.replace(
  /<Stack direction="row" spacing=\{1\} alignItems="center">/g,
  '<div className="flex flex-row items-center gap-2">',
)
s = s.replace(
  /<Stack key=\{`hero-proof-\$\{i\}`\} direction="row" spacing=\{1\} alignItems="center">/g,
  '<div key={`hero-proof-${i}`} className="flex flex-row items-center gap-2">',
)
s = s.replace(
  /<Stack key=\{`topic-chip-\$\{i\}`\} direction="row" spacing=\{1\} alignItems="center">/g,
  '<div key={`topic-chip-${i}`} className="flex flex-row items-center gap-2">',
)
s = s.replace(
  /<Stack key=\{i\} direction="row" spacing=\{1\} alignItems="center">/g,
  '<div key={i} className="flex flex-row items-center gap-2">',
)
s = s.replace(
  /<Stack key=\{i\} direction=\{\{ xs: 'column', sm: 'row' \}\} spacing=\{1\} alignItems=\{\{ sm: 'center' \}\}>/g,
  '<div key={i} className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-2">',
)
s = s.replace(
  /<Stack direction=\{\{ xs: 'column', sm: 'row' \}\} spacing=\{2\}>/g,
  '<div className="flex flex-col gap-4 sm:flex-row sm:gap-4">',
)
// Typography
s = s.replace(/<Typography variant="subtitle1" fontWeight=\{600\} gutterBottom>/g, '<p className="mb-2 text-base font-semibold">')
s = s.replace(/<Typography variant="subtitle2" color="text\.secondary">/g, '<p className="text-sm text-muted-foreground">')
s = s.replace(/<Typography variant="subtitle2">/g, '<p className="text-sm font-medium">')
s = s.replace(
  /<Typography variant="body2" color="text\.secondary"/g,
  '<p className="text-sm text-muted-foreground"',
)
s = s.replace(/<Typography variant="body2"/g, '<p className="text-sm"')
s = s.replace(/<Typography variant="caption"/g, '<p className="text-xs text-muted-foreground"')
s = s.replace(/<\/Typography>/g, '</p>')

// Alert
s = s.replace(
  /<Alert severity="warning"[^>]*>/g,
  '<div role="alert" className="mb-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950 dark:border-amber-900 dark:bg-amber-950/30">',
)
s = s.replace(
  /<Alert severity="info"[^>]*>/g,
  '<div role="alert" className="rounded-md border border-blue-200 bg-blue-50/80 p-3 text-sm dark:border-blue-900 dark:bg-blue-950/30">',
)
s = s.replace(/<\/Alert>/g, '</div>')

// Buttons
s = s.replace(/variant="contained"/g, 'variant="default"')
s = s.replace(/variant="outlined"/g, 'variant="outline"')
s = s.replace(/color="secondary"/g, 'variant="secondary"')
s = s.replace(/startIcon=\{/g, 'leftIcon={')

s = s.replace(/<CircularProgress size=\{18\} \/>/g, '<Loader2 className="h-4 w-4 animate-spin" />')

// Icons
s = s.replace(/<ExpandMoreIcon \/>/g, '<ChevronDown className="h-4 w-4" />')
s = s.replace(/<DeleteIcon\b/g, '<Trash2 className="h-4 w-4"')
s = s.replace(/<AddIcon\b/g, '<Plus className="h-4 w-4"')
s = s.replace(/<CampaignIcon\b/g, '<Megaphone className="h-4 w-4"')
s = s.replace(/<ImageIcon\b/g, '<ImageIconLucide className="h-4 w-4"')

fs.writeFileSync(file, s)
console.log('category marketing MUI strip pass done')
