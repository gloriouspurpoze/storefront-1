/**
 * Converts <TextField ... /> in CategoryMarketingManagement.tsx to Label + Input/Textarea.
 * Run from repo root: node scripts/cmm-textfield.mjs
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const filePath = path.join(__dirname, '../src/pages/cms/CategoryMarketingManagement.tsx')
let s = fs.readFileSync(filePath, 'utf8')

let nf = 0
function nextId() {
  nf++
  return `cmm-f-${nf}`
}

/** Find `<TextField` ... `/>` with brace-aware scan */
function nextTextField(src, from) {
  const open = '<TextField'
  const i = src.indexOf(open, from)
  if (i === -1) return null
  let j = i + open.length
  let brace = 0
  while (j < src.length - 1) {
    const c = src[j]
    if (brace === 0 && c === '/' && src[j + 1] === '>') {
      return { start: i, end: j + 2, raw: src.slice(i, j + 2) }
    }
    if (brace === 0 && (c === '"' || c === "'" || c === '`')) {
      const q = c
      j++
      while (j < src.length) {
        if (src[j] === '\\') {
          j += 2
          continue
        }
        if (src[j] === q) {
          j++
          break
        }
        j++
      }
      continue
    }
    if (c === '{') brace++
    else if (c === '}') brace = Math.max(0, brace - 1)
    j++
  }
  return null
}

function convertTextField(raw) {
  const a = raw.slice('<TextField'.length, -2).trim()
  const fullWidth = /(?:^|\s)fullWidth(?:\s|$)/.test(a)
  const multiline = /(?:^|\s)multiline(?:\s|$)/.test(a)
  const small = /size=\{\s*['"]small['"]\s*\}/.test(a) || /size="small"/.test(a)

  let labelJsx = ''
  const quoted = a.match(/\n\s*label="((?:[^"\\]|\\.)*)"/)
  if (quoted) {
    labelJsx = `<Label htmlFor="__ID__">${quoted[1]}</Label>`
  } else {
    const expr = a.match(/\n\s*label=\{([\s\S]*?)\}\s*(?=\n|$|multiline|fullWidth|size|rows|minRows|value|onChange|placeholder|helperText|inputProps|InputProps|disabled)/)
    if (expr) {
      labelJsx = `<Label htmlFor="__ID__">{${expr[1]}}</Label>`
    }
  }

  const mRows = a.match(/\n\s*rows=\{(\d+)\}/)
  const mMin = a.match(/\n\s*minRows=\{(\d+)\}/)
  const rows = mRows ? Number(mRows[1]) : mMin ? Number(mMin[1]) : multiline ? 3 : undefined

  const mMax = a.match(/inputProps=\{\{\s*maxLength:\s*([^}]+?)\s*\}\}/)
  const maxLen = mMax ? ` maxLength={${mMax[1].trim()}}` : ''

  const mPh = a.match(/\n\s*placeholder="((?:[^"\\]|\\.)*)"/)
  const phAttr = mPh ? ` placeholder="${mPh[1]}"` : ''

  const mHelp = a.match(/\n\s*helperText="((?:[^"\\]|\\.)*)"/)
  const help = mHelp
    ? `\n                      <p className="text-xs text-muted-foreground">${mHelp[1]}</p>`
    : ''

  const mono = /fontFamily:\s*['"]ui-monospace/.test(a)

  const valueBlock = a.match(/\n\s*(value=\{[\s\S]*)/)
  if (!valueBlock) return raw
  let rest = valueBlock[1]
  let depth = 0
  let k = 0
  for (; k < rest.length; k++) {
    if (rest[k] === '{') depth++
    else if (rest[k] === '}') {
      depth--
      if (depth === 0) {
        k++
        break
      }
    }
  }
  const valuePart = rest.slice(0, k).trim()

  const afterVal = rest.slice(k)
  const oc = afterVal.match(/\s*(onChange=\{[\s\S]*)/)
  if (!oc) return raw
  rest = oc[1]
  depth = 0
  k = 0
  if (!rest.startsWith('onChange=')) return raw
  const ocn = rest.slice('onChange='.length)
  if (ocn[0] !== '{') return raw
  for (k = 0; k < ocn.length; k++) {
    if (ocn[k] === '{') depth++
    else if (ocn[k] === '}') {
      depth--
      if (depth === 0) {
        k++
        break
      }
    }
  }
  const onChangePart = `onChange=${ocn.slice(0, k)}`

  const mDis = a.match(/\n\s*disabled=\{([^}]+)\}/)
  const dis = mDis ? ` disabled={${mDis[1]}}` : ''

  const id = nextId()
  labelJsx = labelJsx.replace('__ID__', id)

  const clsParts = []
  if (fullWidth || multiline) clsParts.push('w-full')
  if (small) clsParts.push('h-9', 'text-sm')
  if (mono) clsParts.push('font-mono', 'text-[13px]')
  const cls = clsParts.length ? ` className="${clsParts.join(' ')}"` : fullWidth || multiline ? ' className="w-full"' : ''

  let input
  if (multiline) {
    input = `<Textarea id="${id}"${cls} rows={${rows ?? 3}} ${valuePart} ${onChangePart}${maxLen}${dis}${phAttr} />`
  } else {
    input = `<Input id="${id}"${cls} ${valuePart} ${onChangePart}${maxLen}${dis}${phAttr} />`
  }

  if (!labelJsx) {
    input = input.replace(` id="${id}"`, '')
    return `<div className="space-y-2">${input}${help}\n                    </div>`
  }

  return `<div className="space-y-2">
                      ${labelJsx}
                      ${input}${help}
                    </div>`
}

let pos = 0
const out = []
let last = 0
while (true) {
  const hit = nextTextField(s, pos)
  if (!hit) break
  out.push(s.slice(last, hit.start))
  out.push(convertTextField(hit.raw))
  last = hit.end
  pos = hit.end
}
out.push(s.slice(last))
s = out.join('')

fs.writeFileSync(filePath, s)
console.log('cmm-textfield.mjs: converted', nf, 'fields')
