/** Remove leftover MUI Stack props leaked onto divs */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const p = path.join(__dirname, '../src/pages/cms/CategoryMarketingManagement.tsx')
let s = fs.readFileSync(p, 'utf8')

const reps = [
  [/ alignItems=\{\{ sm: 'center' \}\}/g, ''],
  [/ alignItems=\{\{ sm: 'center' \}\} flexWrap="wrap"/g, ''],
  [/ spacing=\{2\}/g, ''],
  [/ spacing=\{3\}/g, ''],
  [/ spacing=\{1\}/g, ''],
  [
    /<div className="flex flex-col gap-4" key=\{`hero-proof-\$\{i\}`\} direction="row" spacing=\{1\} alignItems="center">/g,
    '<div key={`hero-proof-${i}`} className="flex flex-row items-center gap-2">',
  ],
  [
    /<div className="flex flex-col gap-4" key=\{`topic-chip-\$\{i\}`\} direction="row" spacing=\{1\} alignItems="center">/g,
    '<div key={`topic-chip-${i}`} className="flex flex-row items-center gap-2">',
  ],
  [
    /<div className="flex flex-col gap-4" key=\{i\} direction="row" spacing=\{1\} alignItems="center">/g,
    '<div key={i} className="flex flex-row items-center gap-2">',
  ],
  [
    /<div className="flex flex-col gap-4" key=\{i\} direction="row" spacing=\{1\} alignItems="flex-start">/g,
    '<div key={i} className="flex flex-row items-start gap-2">',
  ],
  [
    /<div className="flex flex-col gap-4" key=\{i\} direction=\{\{ xs: 'column', sm: 'row' \}\} spacing=\{1\} alignItems=\{\{ sm: 'center' \}\}>/g,
    '<div key={i} className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-2">',
  ],
  [
    /<div className="flex flex-col gap-4" key=\{bi\} direction="row" spacing=\{1\} alignItems="center">/g,
    '<div key={bi} className="flex flex-row items-center gap-2">',
  ],
  [
    /<div className="flex flex-col gap-4" key=\{i\} spacing=\{1\}>\s*<div className="flex flex-col gap-4" direction="row" spacing=\{1\} alignItems="flex-start">/g,
    '<div key={i} className="flex flex-col gap-2">\n                        <div className="flex flex-row items-start gap-2">',
  ],
  [
    /<div className="flex flex-col gap-4" spacing=\{1\} flex=\{1\}>/g,
    '<div className="flex min-w-0 flex-1 flex-col gap-2">',
  ],
  [
    /<div display="flex" justifyContent="center" alignItems="center" minHeight="280px">/g,
    '<div className="flex min-h-[280px] items-center justify-center">',
  ],
  [
    /<div display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap">/g,
    '<div className="flex flex-wrap items-center justify-between">',
  ],
  [/<div display="flex" alignItems="center" gap=\{1\}>/g, '<div className="flex items-center gap-1">'],
  [
    /<div className="flex flex-col gap-4" direction="row" spacing=\{1\}>/g,
    '<div className="flex flex-row gap-2">',
  ],
  [
    /<div className="flex flex-col gap-4" key=\{`hero-proof-\$\{i\}`\} direction="row" alignItems="center">/g,
    '<div key={`hero-proof-${i}`} className="flex flex-row items-center gap-2">',
  ],
  [
    /<div className="flex flex-col gap-4" key=\{`topic-chip-\$\{i\}`\} direction="row" alignItems="center">/g,
    '<div key={`topic-chip-${i}`} className="flex flex-row items-center gap-2">',
  ],
  [
    /<div className="flex flex-col gap-4" key=\{i\} direction="row" alignItems="center">/g,
    '<div key={i} className="flex flex-row items-center gap-2">',
  ],
  [
    /<div className="flex flex-col gap-4" key=\{i\} direction="row" alignItems="flex-start">/g,
    '<div key={i} className="flex flex-row items-start gap-2">',
  ],
  [
    /<div className="flex flex-col gap-4" key=\{i\} direction=\{\{ xs: 'column', sm: 'row' \}\}>/g,
    '<div key={i} className="flex flex-col gap-2 sm:flex-row sm:gap-4">',
  ],
  [
    /<div className="flex flex-col gap-4" key=\{bi\} direction="row" alignItems="center">/g,
    '<div key={bi} className="flex flex-row items-center gap-2">',
  ],
  [
    /<div className="flex flex-col gap-4" direction="row" alignItems="flex-start">/g,
    '<div className="flex flex-row items-start gap-2">',
  ],
  [/<div className="flex flex-col gap-4" direction="row">/g, '<div className="flex flex-row gap-2">'],
]

for (const [a, b] of reps) {
  s = s.replace(a, b)
}

fs.writeFileSync(p, s)
console.log('cmm-fix-divs done')
