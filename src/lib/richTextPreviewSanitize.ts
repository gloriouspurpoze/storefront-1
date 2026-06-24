import DOMPurify from 'dompurify'

const EMPTYABLE_BLOCK_TAGS = ['p', 'div', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'li', 'blockquote']

const EMPTY_BLOCK_RE = new RegExp(
  `<(${EMPTYABLE_BLOCK_TAGS.join('|')})(?:\\s[^>]*)?>(?:\\s|&nbsp;|&#160;|<br\\s*/?>)*</\\1>`,
  'gi',
)

function dropEmptyBlocks(html: string): string {
  let prev = html
  let next = html.replace(EMPTY_BLOCK_RE, '')
  while (next !== prev) {
    prev = next
    next = next.replace(EMPTY_BLOCK_RE, '')
  }
  return next
}

const PREVIEW_ALLOWED_TAGS = [
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'p',
  'br',
  'div',
  'span',
  'strong',
  'b',
  'em',
  'i',
  'u',
  's',
  'strike',
  'sub',
  'sup',
  'a',
  'ul',
  'ol',
  'li',
  'blockquote',
  'pre',
  'code',
  'img',
  'figure',
  'figcaption',
  'table',
  'thead',
  'tbody',
  'tfoot',
  'tr',
  'th',
  'td',
  'caption',
]

const PREVIEW_ALLOWED_ATTR = [
  'href',
  'target',
  'rel',
  'class',
  'src',
  'alt',
  'title',
  'width',
  'height',
  'loading',
  'data-layout',
  'colspan',
  'rowspan',
  'scope',
]

/** Sanitize Quill HTML for admin live previews — mirrors consumer allowlists where possible. */
export function sanitizeRichTextPreviewHtml(html: string | null | undefined): string {
  const raw = String(html ?? '')
  if (!raw.trim()) return ''
  if (!raw.includes('<')) return raw
  const safe = DOMPurify.sanitize(raw, {
    ALLOWED_TAGS: PREVIEW_ALLOWED_TAGS,
    ALLOWED_ATTR: PREVIEW_ALLOWED_ATTR,
  })
  return dropEmptyBlocks(safe)
}

/** @deprecated Use sanitizeRichTextPreviewHtml */
export function sanitizeCategoryMarketingRichHtml(html: string): string {
  return sanitizeRichTextPreviewHtml(html)
}

const IMG_TAG_RE = /<img\b[^>]*\/?>/gi

function readImageLayout(tag: string): string | null {
  const value = tag.match(/\bdata-layout=["']([^"']*)["']/i)?.[1]?.trim()
  return value || null
}

function ensureImageLayout(tag: string, layout: string): string {
  if (readImageLayout(tag)) return tag
  return tag.replace(/<img/i, `<img data-layout="${layout}"`)
}

/** Quick-answer preview — float image so text wraps (matches consumer site). */
export function prepareQuickAnswerPreviewHtml(html: string): string {
  const trimmed = html.trim()
  if (!trimmed) return trimmed

  const firstMatch = trimmed.match(/<img\b[^>]*\/?>/i)
  if (!firstMatch) return trimmed

  const imgTag = firstMatch[0]
  const layout = readImageLayout(imgTag) ?? 'float-right'

  if (layout === 'block' || layout === 'center') {
    let replaced = false
    return trimmed.replace(IMG_TAG_RE, (tag) => {
      if (replaced) return tag
      replaced = true
      return ensureImageLayout(tag, layout)
    })
  }

  const img = ensureImageLayout(imgTag, layout)
  const withoutImg = trimmed.replace(imgTag, '')
  const textPart = withoutImg.replace(EMPTY_BLOCK_RE, '').trim()
  if (!textPart) return img

  const injected = textPart.replace(/^(<p(?:\s[^>]*)?>)/i, `$1${img}`)
  if (injected !== textPart) return injected

  return `<p>${img}${textPart}</p>`
}

export type RichTextPreviewVariant = 'default' | 'compact' | 'marketing' | 'quick-answer'

export function prepareRichTextPreviewHtml(html: string, variant: RichTextPreviewVariant): string {
  const trimmed = html.trim()
  if (!trimmed) return ''
  if (variant === 'quick-answer') return prepareQuickAnswerPreviewHtml(trimmed)
  return trimmed
}
