import type Quill from 'quill'
import UploadService from '../services/api/upload.service'
import {
  BLOG_IMAGE_MAX_FILE_BYTES,
  BLOG_IMAGE_RECOMMENDED_MAX_BYTES,
} from '../components/blog/blog-seo-guidelines'
import { mergeFormatsWithTableSupport, mergeModulesWithTableSupport } from './quillTableSupport'

function formatImageSizeCap(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(0)} MB`
  return `${Math.round(bytes / 1024)} KB`
}

export const CATEGORY_MARKETING_BODY_CLOUDINARY_FOLDER = 'category-marketing/body'
export const SEO_LANDING_QUICK_ANSWER_CLOUDINARY_FOLDER = 'seo-landing/quick-answer'

export type CmsQuillToolbarPreset = 'compact' | 'category-marketing'

export type CmsQuillImageHandlers = {
  onUploadStart?: () => void
  onUploadError: (message: string) => void
  onImageReadyForAlt: (url: string, insertIndex: number, quill: Quill) => void
  onOpenCloudinaryLibrary: (insertIndex: number, quill: Quill) => void
}

function imageHandlers(handlers: CmsQuillImageHandlers, folder: string) {
  return {
    image: function (this: { quill: Quill }) {
      const quill = this.quill
      const sel = quill.getSelection(true)
      const len = quill.getLength()
      const insertIndex = sel?.index ?? Math.max(0, len - 1)
      const input = document.createElement('input')
      input.setAttribute('type', 'file')
      input.setAttribute('accept', 'image/*')
      input.click()
      input.onchange = async () => {
        const file = input.files?.[0]
        if (!file) return
        if (file.size > BLOG_IMAGE_MAX_FILE_BYTES) {
          handlers.onUploadError(
            `Image too large (max ${formatImageSizeCap(BLOG_IMAGE_MAX_FILE_BYTES)}). Compress to ~${formatImageSizeCap(BLOG_IMAGE_RECOMMENDED_MAX_BYTES)} for faster page loads.`,
          )
          return
        }
        handlers.onUploadStart?.()
        try {
          const { url } = await UploadService.uploadImage(file, folder)
          handlers.onImageReadyForAlt(url, insertIndex, quill)
        } catch (e: unknown) {
          handlers.onUploadError(e instanceof Error ? e.message : 'Upload failed')
        }
      }
    },
    cloudinary: function (this: { quill: Quill }) {
      const quill = this.quill
      const sel = quill.getSelection(true)
      const len = quill.getLength()
      const insertIndex = sel?.index ?? Math.max(0, len - 1)
      handlers.onOpenCloudinaryLibrary(insertIndex, quill)
    },
  }
}

const COMPACT_TOOLBAR = [
  ['bold', 'italic', 'underline'],
  [{ list: 'ordered' }, { list: 'bullet' }],
  ['link', 'image', 'cloudinary'],
  ['clean'],
] as const

const CATEGORY_MARKETING_TOOLBAR = [
  [{ header: [1, 2, 3, false] }],
  ['bold', 'italic', 'underline', 'strike'],
  [{ color: [] }, { background: [] }],
  [{ list: 'ordered' }, { list: 'bullet' }],
  [{ indent: '-1' }, { indent: '+1' }],
  [{ align: [] }],
  ['link', 'image', 'cloudinary'],
  ['clean'],
] as const

/** Quill toolbar + handlers for CMS rich text with Cloudinary image upload + library. */
export function buildCmsQuillModules(
  folder: string,
  handlers: CmsQuillImageHandlers,
  preset: CmsQuillToolbarPreset = 'category-marketing',
): Record<string, unknown> {
  const container = preset === 'compact' ? COMPACT_TOOLBAR : CATEGORY_MARKETING_TOOLBAR
  return mergeModulesWithTableSupport(
    {
      toolbar: {
        container: [...container],
        handlers: imageHandlers(handlers, folder),
      },
      clipboard: { matchVisual: false },
    },
    { onError: (message) => handlers.onUploadError(message) },
  )
}

export const CMS_QUILL_COMPACT_FORMATS_WITH_IMAGE = mergeFormatsWithTableSupport([
  'bold',
  'italic',
  'underline',
  'list',
  'bullet',
  'link',
  'image',
])

export const CMS_QUILL_FULL_FORMATS_WITH_IMAGE = mergeFormatsWithTableSupport([
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
])
