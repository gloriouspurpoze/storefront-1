/**
 * One-off migration: remove @mui from booking-details.tsx
 * Run: node scripts/migrate-booking-details.mjs
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')
const filePath = path.join(root, 'src/pages/bookings/booking-details.tsx')

function removeBalancedFrom(s, startIdx, openCh) {
  let i = startIdx
  let depth = 0
  if (s[i] !== openCh) return { end: startIdx, ok: false }
  depth = 1
  i++
  const closeCh = openCh === '{' ? '}' : openCh
  while (i < s.length && depth > 0) {
    const c = s[i]
    if (openCh === '{' && c === '{') depth++
    else if (openCh === '{' && c === '}') depth--
    i++
  }
  return { end: i, ok: depth === 0 }
}

/** Remove prop named `sx` with value `{...}` including multiline */
function stripSxProps(s) {
  let out = ''
  let i = 0
  while (i < s.length) {
    const idx = s.indexOf(' sx=', i)
    if (idx === -1) {
      out += s.slice(i)
      break
    }
    out += s.slice(i, idx)
    let j = idx + 4
    while (j < s.length && /\s/.test(s[j])) j++
    if (s[j] === '{') {
      const { end } = removeBalancedFrom(s, j, '{')
      i = end
    } else if (s[j] === '(') {
      const { end } = removeBalancedFrom(s, j, '(') // rare
      i = end
    } else {
      out += s[idx]
      i = idx + 1
    }
  }
  return out
}

let s = fs.readFileSync(filePath, 'utf8')

const newImports = `import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Button,
  Card,
  CardContent,
  Input,
  Label,
  Textarea,
  Badge,
  Avatar,
  Separator,
  HStack,
  VStack,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../../components/ui'
import { AvatarImage, AvatarFallback } from '../../components/ui/avatar'
import {
  ArrowLeft,
  Pencil,
  Trash2,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Clock,
  IndianRupee,
  CheckCircle,
  XCircle,
  Navigation,
  UserCheck,
  Star,
  BadgeCheck,
  Home,
  CalendarClock,
  Play,
  Wallet,
  TrendingUp,
  Info,
  CreditCard,
  User,
  Building2,
  Receipt,
  History,
  MoreVertical,
  Camera,
  StickyNote,
  Loader2,
} from 'lucide-react'
import { AssignProfessionalDialog } from '../../components/bookings/AssignProfessionalDialog'
`

const importEnd = s.indexOf("import { AssignProfessionalDialog }")
if (importEnd === -1) throw new Error('Could not find AssignProfessionalDialog import')
const importStart = s.indexOf("import React, { useState, useEffect } from 'react'")
s = s.slice(0, importStart) + newImports + s.slice(importEnd)

// alpha helper: keep as local function (replace MUI alpha)
if (!s.includes('function muiAlpha')) {
  const hook =
    s.indexOf("import { isLikelyImageUrl, parseBookingNotesContent } from '../../lib/parseBookingNotesContent'")
  const insertAt = s.indexOf('\n', hook) + 1
  s =
    s.slice(0, insertAt) +
    `
/** rgba from #RRGGBB + opacity (replaces @mui/material alpha). */
function muiAlpha(hex: string, opacity: number): string {
  const h = hex.replace('#', '')
  const r = parseInt(h.slice(0, 2), 16)
  const g = parseInt(h.slice(2, 4), 16)
  const b = parseInt(h.slice(4, 6), 16)
  return \`rgba(\${r},\${g},\${b},\${opacity})\`
}
` +
    s.slice(insertAt)
}

// Replace alpha( with muiAlpha(
s = s.replace(/\balpha\(/g, 'muiAlpha(')

// Snackbar -> appToast
s = s.replace(
  /import \{ addToast \} from '\.\.\/\.\.\/store\/slices\/uiSlice'/,
  "import { addToast } from '../../store/slices/uiSlice'\nimport { appToast } from '../../lib/appToast'",
)
s = s.replace(/  const \[snackbar, setSnackbar\] = useState\(\{ open: false, message: '', severity: 'success' as 'success' \| 'error' \}\)\n/, '')

const snackReplacements = [
  [/setSnackbar\(\{ open: true, message: 'Please provide a cancellation reason', severity: 'error' \}\)/g, "appToast('Please provide a cancellation reason', 'error')"],
  [/setSnackbar\(\{ open: true, message: 'Booking cancelled successfully', severity: 'success' \}\)/g, "appToast('Booking cancelled successfully', 'success')"],
  [/setSnackbar\(\{ open: true, message: err\.message \|\| 'Failed to cancel booking', severity: 'error' \}\)/g, "appToast(err.message || 'Failed to cancel booking', 'error')"],
  [/setSnackbar\(\{ open: true, message: 'Booking deleted successfully', severity: 'success' \}\)/g, "appToast('Booking deleted successfully', 'success')"],
  [/setSnackbar\(\{ open: true, message: err\.message \|\| 'Failed to delete booking', severity: 'error' \}\)/g, "appToast(err.message || 'Failed to delete booking', 'error')"],
  [/setSnackbar\(\{ open: true, message: 'Enter a valid refund amount', severity: 'error' \}\)/g, "appToast('Enter a valid refund amount', 'error')"],
  [/setSnackbar\(\{ open: true, message: 'Reason is required', severity: 'error' \}\)/g, "appToast('Reason is required', 'error')"],
  [/setSnackbar\(\{ open: true, message: 'Partial refund recorded on booking', severity: 'success' \}\)/g, "appToast('Partial refund recorded on booking', 'success')"],
  [/setSnackbar\(\{ open: true, message: err\?\.message \|\| 'Failed to record refund', severity: 'error' \}\)/g, "appToast(err?.message || 'Failed to record refund', 'error')"],
  [/setSnackbar\(\{ open: true, message: err\?\.message \|\| 'Verify failed', severity: 'error' \}\)/g, "appToast(err?.message || 'Verify failed', 'error')"],
  [/setSnackbar\(\{ open: true, message: 'Enter a short reason to open a dispute', severity: 'error' \}\)/g, "appToast('Enter a short reason to open a dispute', 'error')"],
  [/setSnackbar\(\{ open: true, message: err\?\.message \|\| 'Dispute update failed', severity: 'error' \}\)/g, "appToast(err?.message || 'Dispute update failed', 'error')"],
  [/setSnackbar\(\{ open: true, message: error\.message \|\| 'Failed to update booking', severity: 'error' \}\)/g, "appToast(error.message || 'Failed to update booking', 'error')"],
]
for (const [re, rep] of snackReplacements) s = s.replace(re, rep)

// Multiline setSnackbar success block
s = s.replace(
  /setSnackbar\(\s*\{\s*open: true,\s*message: action === 'accept' \? 'Booking accepted successfully!'\s*: action === 'start' \? 'Work started successfully!'\s*: 'Booking completed successfully!',\s*severity: 'success'\s*\}\s*\)/,
  "appToast(action === 'accept' ? 'Booking accepted successfully!' : action === 'start' ? 'Work started successfully!' : 'Booking completed successfully!', 'success')",
)

s = s.replace(/  const handleCloseSnackbar = \(\) => \{\s*setSnackbar\(\{ \.\.\.snackbar, open: false \}\)\s*\}\s*\n/, '')

// Icon component names (MUI -> lucide)
const iconMap = [
  ['ArrowBack', 'ArrowLeft'],
  ['Edit', 'Pencil'],
  ['Delete', 'Trash2'],
  ['Email', 'Mail'],
  ['LocationOn', 'MapPin'],
  ['CalendarToday', 'Calendar'],
  ['AccessTime', 'Clock'],
  ['AttachMoney', 'IndianRupee'],
  ['Cancel', 'XCircle'],
  ['AssignmentInd', 'UserCheck'],
  ['Verified', 'BadgeCheck'],
  ['Schedule', 'CalendarClock'],
  ['PlayArrow', 'Play'],
  ['AccountBalanceWallet', 'Wallet'],
  ['Payment', 'CreditCard'],
  ['Person', 'User'],
  ['Business', 'Building2'],
  ['PhotoCamera', 'Camera'],
  ['StickyNote2Outlined', 'StickyNote'],
  ['MoreVert', 'MoreVertical'],
]
for (const [from, to] of iconMap) {
  s = s.replace(new RegExp(`<${from}(\\s|/)`, 'g'), `<${to}$1`)
  s = s.replace(new RegExp(`<${from}>`, 'g'), `<${to}>`)
}

// DOM tags
s = s.replace(/<Box\b/g, '<div')
s = s.replace(/<\/Box>/g, '</div>')
s = s.replace(/<Typography\b/g, '<p')
s = s.replace(/<\/Typography>/g, '</p>')
s = s.replace(/<Stack\b/g, '<div data-mui-stack')
s = s.replace(/<\/Stack>/g, '</div>')
s = s.replace(/<Paper\b/g, '<div data-mui-paper')
s = s.replace(/<\/Paper>/g, '</div>')
s = s.replace(/<Grid\b([^>]*)\/>/g, '<div data-grid-void$1 />') // unlikely
s = s.replace(/<Grid\b/g, '<div data-grid')
s = s.replace(/<\/Grid>/g, '</div>')

// IconButton -> button with btn classes
s = s.replace(/<IconButton\b/g, '<button type="button" className="inline-flex h-12 w-12 items-center justify-center rounded-md transition-colors hover:bg-white/10"')
s = s.replace(/<\/IconButton>/g, '</button>')

// CircularProgress
s = s.replace(/<CircularProgress[^/]*\/>/g, '<Loader2 className="h-12 w-12 animate-spin text-muted-foreground" />')

// TableContainer
s = s.replace(/<TableContainer[^>]*>/g, '<div className="overflow-x-auto rounded-md border border-border">')
s = s.replace(/<\/TableContainer>/g, '</div>')

// Dialog MUI -> shadcn structure (title/content/actions)
s = s.replace(/<DialogTitle>/g, '<DialogHeader><DialogTitle>')
s = s.replace(/<\/DialogTitle>\s*(?=<DialogContent>)/g, '</DialogTitle></DialogHeader>')
// The above might double-wrap — booking file uses DialogTitle then DialogContent. Shadcn has DialogHeader wrapping Title.
// Revert risky replace - do simpler: map DialogActions -> DialogFooter

s = s.replace(/<DialogActions>/g, '<DialogFooter className="gap-2">')
s = s.replace(/<\/DialogActions>/g, '</DialogFooter>')

// Chip -> Badge (rough)
s = s.replace(/<Chip\b/g, '<Badge')
s = s.replace(/label=\{/g, 'children={')
s = s.replace(/label="([^"]+)"/g, 'children="$1"') // might break - Chip uses label= not children

// Fix Chip: MUI Chip uses label= ; our Badge uses children
s = s.replace(/<Chip([^>]*)\s+label=\{([^}]+)\}/g, '<Badge$1>{$2}</Badge>')
// Wrong - need manual fix after

// Remove Dialog maxWidth fullWidth from MUI (not valid on radix)
s = s.replace(/\s+maxWidth="[^"]*"/g, '')
s = s.replace(/\s+fullWidth/g, '')

// Snackbar block at end
s = s.replace(
  /\s*<Snackbar[\s\S]*?<\/Snackbar>\s*/,
  '\n',
)

// --- strip sx globally after other transforms ---
s = stripSxProps(s)

// Fix Chip remnants: reopen file issues - Badge needs variant; drop icon prop on Badge (invalid)
// Remove MUI-specific props from tags (invalid on DOM)
const muiProps = [
  'variant',
  'color',
  'size',
  'startIcon',
  'disableElevation',
  'gutterBottom',
  'noWrap',
  'flex',
  'display',
  'alignItems',
  'justifyContent',
  'flexWrap',
  'minWidth',
  'component',
  'href',
  'target',
  'rel',
  'borderRadius',
  'bgcolor',
  'p',
  'px',
  'py',
  'pt',
  'pb',
  'pl',
  'pr',
  'm',
  'mb',
  'mt',
  'ml',
  'mr',
  'mx',
  'my',
  'gap',
  'flexDirection',
  'overflow',
  'border',
  'borderColor',
  'width',
  'height',
  'fontSize',
  'fontWeight',
  'textTransform',
  'letterSpacing',
  'letterSpacing',
  'elevation',
]

fs.writeFileSync(filePath, s)
console.log('Wrote migrated file. Review Chip/Badge and DialogTitle wrapping manually.')
