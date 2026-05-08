/**
 * One-off: finish MUI → shadcn migration in CategoryMarketingManagement.tsx
 * Run: node scripts/finish-category-marketing-shadcn.mjs
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const file = path.join(__dirname, '../src/pages/cms/CategoryMarketingManagement.tsx')

let s = fs.readFileSync(file, 'utf8')

function findSelfClosingEnd(str, openTag) {
  const start = str.indexOf(openTag)
  if (start === -1) return null
  let i = start + openTag.length
  let brace = 0
  while (i < str.length - 1) {
    const c = str[i]
    if (brace === 0 && c === '/' && str[i + 1] === '>') {
      return { start, end: i + 2, raw: str.slice(start, i + 2) }
    }
    if (brace === 0 && (c === '"' || c === "'" || c === '`')) {
      const q = c
      i++
      while (i < str.length) {
        if (str[i] === '\\') {
          i += 2
          continue
        }
        if (str[i] === q) {
          i++
          break
        }
        i++
      }
      continue
    }
    if (c === '{') brace++
    else if (c === '}') brace = Math.max(0, brace - 1)
    i++
  }
  return null
}

let idCounter = 0
function nextId() {
  idCounter++
  return `cmm-field-${idCounter}`
}

/**
 * @param {string} raw - full "<TextField ... />" string
 */
function convertTextField(raw) {
  const inner = raw.slice('<TextField'.length).replace(/\/>$/, '').trim()

  const has = (name) =>
    new RegExp(`(?:^|\\s)${name}(?:\\s|=)`).test(inner) || new RegExp(`(?:^|\\s)${name}$`).test(inner)

  const fullWidth = has('fullWidth')
  const multiline = has('multiline')
  const small = /size=\{\s*['"]small['"]\s*\}/.test(inner) || /size="small"/.test(inner)

  let label = null
  const mLabelStr = inner.match(/label="((?:[^"\\]|\\.)*)"/)
  if (mLabelStr) label = mLabelStr[1]
  if (!label) {
    const mLabelTpl = inner.match(/label=\{`([^`$]*)\$\{[^}]+\}([^`]*)`\}/)
    if (mLabelTpl) label = mLabelTpl[0].replace(/^label=\{/, '').replace(/\}$/, '')
    else {
      const mLabelExpr = inner.match(/label=\{([^]*)\}/)
      if (mLabelExpr) label = `{${mLabelExpr[1]}}`
    }
  }

  const mPlaceholder = inner.match(/placeholder="((?:[^"\\]|\\.)*)"/)
  const placeholder = mPlaceholder ? ` placeholder=${mPlaceholder[0].slice('placeholder='.length)}` : ''

  const mRows = inner.match(/rows=\{(\d+)\}/)
  const mMinRows = inner.match(/minRows=\{(\d+)\}/)
  const rows = mRows ? Number(mRows[1]) : mMinRows ? Number(mMinRows[1]) : multiline ? 3 : undefined

  const mMax = inner.match(/inputProps=\{\{\s*maxLength:\s*([^}]+)\s*\}\}/)
  const maxLengthAttr = mMax ? ` maxLength={${mMax[1].trim()}}` : ''

  const mHelper = inner.match(/helperText="((?:[^"\\]|\\.)*)"/)
  let helper = mHelper ? mHelper[1] : null
  if (helper) helper = helper.replace(/&apos;/g, "'")

  const mValue = inner.match(/value=\{([^]*)\}/)
  const value = mValue ? `{${mValue[1]}}` : null

  const mChange = inner.match(/onChange=\{([^]*)\}\s*\}/)
  /** onChange may end with `)}` for arrow - find balanced */
  let onChange = null
  if (inner.includes('onChange=')) {
    const idx = inner.indexOf('onChange=')
    let j = idx + 'onChange='.length
    while (j < inner.length && inner[j] !== '{') j++
    if (inner[j] === '{') {
      let d = 0
      const startBrace = j
      for (; j < inner.length; j++) {
        const ch = inner[j]
        if (ch === '{') d++
        else if (ch === '}') {
          d--
          if (d === 0) {
            onChange = inner.slice(startBrace, j + 1)
            break
          }
        } else if ((ch === '"' || ch === "'" || ch === '`') && d === 1) {
          const q = ch
          j++
          while (j < inner.length) {
            if (inner[j] === '\\') {
              j += 2
              continue
            }
            if (inner[j] === q) break
            j++
          }
        }
      }
    }
  }

  const mDisabled = inner.match(/disabled=\{([^}]+)\}/)
  const disabled = mDisabled ? ` disabled={${mDisabled[1]}}` : ''

  const id = nextId()
  const widthCls = fullWidth ? ' w-full' : ''
  const sizeCls = small ? ' h-9 text-sm' : ''

  let field
  if (multiline) {
    field = `<Textarea id="${id}" className={cn('min-h-[${rows * 24}px]${widthCls}${sizeCls}')} rows={${rows ?? 3}} value=${value} onChange=${onChange}${maxLengthAttr.replace(/^ maxLength=/, ' maxLength=')}${disabled}${placeholder} />`
    // Fix: Textarea uses rows prop not min-h hack — use rows only
    field = `<Textarea id="${id}" className={cn('${widthCls}', ${small ? "'min-h-20 text-sm'" : "''"})} rows={${rows ?? 3}} value=${value} onChange=${onChange}${maxLengthAttr}${disabled}${placeholder.replace('placeholder=', 'placeholder=')} />`
  } else {
    field = `<Input id="${id}" type="text" className={cn('${widthCls}',${small ? "'h-9'" : "''"})} value=${value} onChange=${onChange}${maxLengthAttr}${disabled}${placeholder} />`
  }

  // Clean up broken replace — do simpler manual emit:
  const inputCls = [widthCls.trim() && 'w-full', small && 'h-9 text-sm'].filter(Boolean).join(' ')
  const valuePart = mValue ? `value={${mValue[1]}}` : ''
  if (!mValue) {
    return raw // can't convert
  }

  let onChangePart = ''
  if (onChange) onChangePart = `onChange=${onChange}`

  const maxL = mMax ? ` maxLength={${mMax[1].trim()}}` : ''

  const extraInputClass = []
  if (fullWidth) extraInputClass.push('w-full')
  if (small) extraInputClass.push('h-9', 'text-sm')
  if (/InputProps=\{\{\s*sx:\s*\{[^}]*monospace/.test(inner)) extraInputClass.push('font-mono', 'text-[13px]')

  const inputClassName =
    extraInputClass.length > 0 ? ` className="${extraInputClass.join(' ')}"` : fullWidth ? ' className="w-full"' : ''

  if (multiline) {
    const rowN = rows ?? 3
    field = `<Textarea id="${id}"${inputClassName} rows={${rowN}} ${valuePart} ${onChangePart}${maxL}${disabled}${mPlaceholder ? ` placeholder={${JSON.stringify(mPlaceholder[1])}}` : ''} />`
  } else {
    field = `<Input id="${id}"${inputClassName} ${valuePart} ${onChangePart}${maxL}${disabled}${mPlaceholder ? ` placeholder={${JSON.stringify(mPlaceholder[1])}}` : ''} />`
  }

  // Label
  let labelEl
  if (label && label.startsWith('{')) {
    labelEl = `<Label htmlFor="${id}">${label.slice(1, -1)}</Label>`
    // label is expression like `Paragraph ${i + 1}` wrong
  }
  if (label && !label.startsWith('{')) {
    labelEl = `<Label htmlFor="${id}">${label}</Label>`
  } else if (mLabelTpl) {
    labelEl = `<Label htmlFor="${id}">${inner.match(/label=\{([^]+)\}/)[0].replace(/^label=/, '')}</Label>`
  } else if (inner.includes('label={'))) {
    const lm = inner.match(/label=\{((?:[^{}]|\{[^}]*\})*)\}/s)
    if (lm) labelEl = `<Label htmlFor="${id}">{${lm[1]}}</Label>`
  }

  let lbl = ''
  const lbMatch = inner.match(/\n\s*label=\{\s*((?:.|\n)*?)\s*\}\s*\n/)
  if (lbMatch) {
    lbl = `<Label htmlFor="${id}">{${lbMatch[1]}}</Label>`
  } else if (mLabelStr) {
    lbl = `<Label htmlFor="${id}">${mLabelStr[1]}</Label>`
  }

  const helperEl = helper
    ? `<p className="text-xs text-muted-foreground">${helper.replace(/"/g, '&quot;')}</p>`
    : mHelper
      ? `<p className="text-xs text-muted-foreground">${mHelper[1]}</p>`
      : ''

  // Re-parse label — line-based simpler: many labels are label="..."
  if (!lbl && mLabelStr) {
    lbl = `<Label htmlFor="${id}">${mLabelStr[1]}</Label>`
  }

  return `<div className="space-y-2">${lbl ? `${lbl}\n                      ` : ''}${field}${helperEl ? `\n                      ${helperEl}` : ''}</div>`
}

// Simpler: iterate replace TextField tags using findSelfClosingEnd in a loop
let guard = 0
while (guard++ < 500) {
  const hit = findSelfClosingEnd(s, '<TextField')
  if (!hit) break
  try {
    const conv = convertTextField(hit.raw)
    s = s.slice(0, hit.start) + conv + s.slice(hit.end)
  } catch {
    break
  }
}

fs.writeFileSync(file, s)
console.log('Pass: TextField conversion attempted. Inspect file.')
