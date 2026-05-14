import DOMPurify from 'dompurify'

/** Quill modules for category marketing long-form fields (no images/video in stored HTML). */
export const CATEGORY_MARKETING_RTE_MODULES = {
  toolbar: [
    [{ header: [1, 2, 3, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ color: [] }, { background: [] }],
    [{ list: 'ordered' }, { list: 'bullet' }],
    [{ indent: '-1' }, { indent: '+1' }],
    [{ align: [] }],
    ['link'],
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
]

export function sanitizeCategoryMarketingRichHtml(html: string): string {
  const raw = String(html ?? '')
  if (!raw.trim()) return ''
  return DOMPurify.sanitize(raw, {
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
    ],
    ALLOWED_ATTR: ['href', 'target', 'rel', 'class'],
  })
}
