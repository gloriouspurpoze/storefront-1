import { sanitizeRichTextPreviewHtml } from './richTextPreviewSanitize'

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

/** @deprecated Use sanitizeRichTextPreviewHtml */
export function sanitizeCategoryMarketingRichHtml(html: string): string {
  return sanitizeRichTextPreviewHtml(html)
}

export { sanitizeRichTextPreviewHtml } from './richTextPreviewSanitize'
