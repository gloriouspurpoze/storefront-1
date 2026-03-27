/**
 * Blog article body HTML: allowlists + DOMPurify (OWASP-style sanitization for stored HTML).
 * Used when loading posts, pasting HTML, importing HTML, and saving to the API.
 */

import DOMPurify from 'dompurify'

export const BLOG_BODY_PURIFY_TAGS = [
  'p',
  'br',
  'span',
  'strong',
  'em',
  'u',
  's',
  'a',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'ul',
  'ol',
  'li',
  'blockquote',
  'pre',
  'code',
  'img',
  'iframe',
  'table',
  'thead',
  'tbody',
  'tr',
  'th',
  'td',
] as const

export const BLOG_BODY_PURIFY_ATTR = [
  'href',
  'src',
  'alt',
  'class',
  'style',
  'title',
  'width',
  'height',
  'frameborder',
  'allow',
  'allowfullscreen',
  'colspan',
  'rowspan',
  'data-row',
] as const

let hooksInstalled = false

function ensureDomPurifyHooks(): void {
  if (hooksInstalled || typeof window === 'undefined') return
  hooksInstalled = true
  DOMPurify.addHook('afterSanitizeAttributes', (node) => {
    if (node.nodeName !== 'A' || !(node instanceof HTMLAnchorElement)) return
    if (node.getAttribute('target') === '_blank') {
      const rel = node.getAttribute('rel') || ''
      if (!/\bnoopener\b/i.test(rel)) {
        node.setAttribute('rel', rel ? `${rel} noopener noreferrer`.trim() : 'noopener noreferrer')
      }
    }
  })
}

export interface SanitizeBlogBodyOptions {
  /** When true, strip inline styles (e.g. noisy paste from Word). Default false so Quill colors/layout are kept. */
  stripInlineStyles?: boolean
}

/**
 * Sanitize arbitrary HTML to tags/attributes allowed for blog bodies.
 * Safe for Quill to ingest via clipboard.convert / setContents.
 */
export function sanitizeBlogBodyHtml(
  html: string,
  options?: SanitizeBlogBodyOptions,
): string {
  if (!html || typeof html !== 'string') return ''
  ensureDomPurifyHooks()

  const stripStyles = options?.stripInlineStyles === true
  const allowedAttrs = stripStyles
    ? [...BLOG_BODY_PURIFY_ATTR].filter((a) => a !== 'style')
    : [...BLOG_BODY_PURIFY_ATTR, 'target', 'rel']

  return DOMPurify.sanitize(html, {
    ADD_ATTR: ['target', 'rel'],
    ALLOWED_TAGS: [...BLOG_BODY_PURIFY_TAGS],
    ALLOWED_ATTR: allowedAttrs,
    KEEP_CONTENT: true,
  })
}
