import DOMPurify from 'dompurify'

/** Quill modules for category marketing long-form fields (links + Cloudinary images with alt). */
export const CATEGORY_MARKETING_RTE_MODULES = {
  toolbar: [
    [{ header: [1, 2, 3, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ color: [] }, { background: [] }],
    [{ list: 'ordered' }, { list: 'bullet' }],
    [{ indent: '-1' }, { indent: '+1' }],
    [{ align: [] }],
    ['link', 'image'],
    ['clean'],
  ],
  clipboard: { matchVisual: false },
}

export const CATEGORY_MARKETING_RTE_FORMATS: string[] = [
  'header',
  'bold',
  'italic',
  'underline',
  'strike',
  'color',
  'background',
  'list',
  'bullet',
  'indent',
  'align',
  'link',
  'image',
]

/**
 * Block-level tags dropped when they hold no visible text and no media — mirrors the
 * consumer-site sanitizer so the admin "Consumer preview" matches the live render.
 * Quill emits `<p><br></p>` for blank lines, which otherwise shows as empty gaps.
 */
const EMPTYABLE_BLOCK_TAGS = ['p', 'div', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'li', 'blockquote']

const EMPTY_BLOCK_RE = new RegExp(
  `<(${EMPTYABLE_BLOCK_TAGS.join('|')})(?:\\s[^>]*)?>(?:\\s|&nbsp;|&#160;|<br\\s*/?>)*</\\1>`,
  'gi',
)

/**
 * Removes empty block elements (e.g. `<p><br></p>`). Re-runs until stable so nested
 * empties collapse. Blocks containing an `<img>` are preserved because the inner-content
 * pattern only matches whitespace / `<br>` / `&nbsp;`.
 */
function dropEmptyBlocks(html: string): string {
  let prev = html
  let next = html.replace(EMPTY_BLOCK_RE, '')
  while (next !== prev) {
    prev = next
    next = next.replace(EMPTY_BLOCK_RE, '')
  }
  return next
}

export function sanitizeCategoryMarketingRichHtml(html: string): string {
  const raw = String(html ?? '')
  if (!raw.trim()) return ''
  const safe = DOMPurify.sanitize(raw, {
    ALLOWED_TAGS: [
      'p',
      'br',
      'strong',
      'b',
      'em',
      'i',
      'u',
      's',
      'strike',
      'a',
      'ul',
      'ol',
      'li',
      'span',
      'h1',
      'h2',
      'h3',
      'h4',
      'h5',
      'h6',
      'blockquote',
      'img',
      'figure',
      'figcaption',
    ],
    ALLOWED_ATTR: ['href', 'target', 'rel', 'class', 'src', 'alt', 'title', 'width', 'height', 'loading'],
  })
  return dropEmptyBlocks(safe)
}
