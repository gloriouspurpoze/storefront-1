/**
 * IconButton → shadcn Button (fixed: closing `>` must not match `>` inside `{onClick=...}`)
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const filePath = path.join(__dirname, '../src/pages/cms/CategoryMarketingManagement.tsx')
let s = fs.readFileSync(filePath, 'utf8')

function skipString(src, i) {
  const q = src[i]
  let j = i + 1
  while (j < src.length) {
    if (src[j] === '\\') {
      j += 2
      continue
    }
    if (src[j] === q) return j + 1
    j++
  }
  return src.length
}

/** Index after '>' or '/>' that closes the opening tag starting at `start` ('<' at tag start) */
function endOfJsxOpenTag(src, start) {
  if (src[start] !== '<') return -1
  let i = start + 1
  while (i < src.length && /[A-Za-z0-9._:-]/.test(src[i])) i++
  let brace = 0
  while (i < src.length) {
    if (brace === 0 && src[i] === '/' && src[i + 1] === '>') return i + 2
    if (brace === 0 && src[i] === '>') return i + 1
    const c = src[i]
    if (brace === 0 && (c === '"' || c === "'" || c === '`')) {
      i = skipString(src, i)
      continue
    }
    if (c === '{') brace++
    else if (c === '}' && brace > 0) brace--
    i++
  }
  return -1
}

function convertIconButtons(src) {
  let out = ''
  let pos = 0
  while (true) {
    const j = src.indexOf('<IconButton', pos)
    if (j === -1) {
      out += src.slice(pos)
      break
    }
    out += src.slice(pos, j)
    const endTag = endOfJsxOpenTag(src, j)
    if (endTag === -1) {
      out += src.slice(j)
      break
    }
    const close = src.indexOf('</IconButton>', endTag)
    if (close === -1) {
      out += src.slice(j)
      break
    }
    const openTag = src.slice(j, endTag)
    const inner = src.slice(endTag, close).trim()
    let tagInner = openTag.slice('<IconButton'.length, -1).trim()

    let onClick = ''
    const oi = tagInner.indexOf('onClick=')
    if (oi !== -1 && tagInner[oi + 'onClick='.length] === '{') {
      const startBrace = oi + 'onClick='.length
      let d = 0
      let k = startBrace
      for (; k < tagInner.length; k++) {
        const ch = tagInner[k]
        if (ch === '{') d++
        else if (ch === '}') {
          d--
          if (d === 0) {
            k++
            break
          }
        } else if ((ch === '"' || ch === "'" || ch === '`') && d === 1) {
          const q = ch
          let kk = k + 1
          while (kk < tagInner.length) {
            if (tagInner[kk] === '\\') {
              kk += 2
              continue
            }
            if (tagInner[kk] === q) {
              k = kk
              break
            }
            kk++
          }
        }
      }
      onClick = tagInner.slice(oi, k).trim()
    }

    let aria = ''
    const am = tagInner.match(/aria-label="([^"]*)"/)
    if (am) aria = ` aria-label="${am[1]}"`

    let cn = 'h-9 w-9 shrink-0 text-destructive hover:text-destructive'
    if (!/size="small"/.test(tagInner)) {
      cn = 'h-10 w-10 shrink-0 text-destructive hover:text-destructive'
    }

    const child = inner.replace(/\s*fontSize="small"\s*/g, '')

    out += `<Button type="button" variant="ghost" size="icon" className="${cn}" ${onClick ? `${onClick} ` : ''}${aria}>${child}</Button>`
    pos = close + '</IconButton>'.length
  }
  return out
}

s = convertIconButtons(s)
fs.writeFileSync(filePath, s)
console.log('cmm-iconbutton-fixed.mjs: done')
