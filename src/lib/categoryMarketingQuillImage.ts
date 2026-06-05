import type Quill from 'quill'
import UploadService from '../services/api/upload.service'
import {
  BLOG_IMAGE_MAX_FILE_BYTES,
  BLOG_IMAGE_RECOMMENDED_MAX_BYTES,
} from '../components/blog/blog-seo-guidelines'

function formatImageSizeCap(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(0)} MB`
  return `${Math.round(bytes / 1024)} KB`
}

/** Cloudinary folder for inline category-marketing body images. */
export const CATEGORY_MARKETING_BODY_CLOUDINARY_FOLDER = 'category-marketing/body'

export type CategoryMarketingQuillImageHandlers = {
  onUploadStart?: () => void
  onUploadError: (message: string) => void
  onImageReadyForAlt: (url: string, insertIndex: number, quill: Quill) => void
  onOpenCloudinaryLibrary: (insertIndex: number, quill: Quill) => void
}

/** Stable Quill toolbar + handlers for category marketing rich text (includes images). */
export function buildCategoryMarketingQuillModules(
  handlers: CategoryMarketingQuillImageHandlers,
): Record<string, unknown> {
  return {
    toolbar: {
      container: [
        [{ header: [1, 2, 3, false] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ color: [] }, { background: [] }],
        [{ list: 'ordered' }, { list: 'bullet' }],
        [{ indent: '-1' }, { indent: '+1' }],
        [{ align: [] }],
        ['link', 'image', 'cloudinary'],
        ['clean'],
      ],
      handlers: {
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
              const { url } = await UploadService.uploadImage(file, CATEGORY_MARKETING_BODY_CLOUDINARY_FOLDER)
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
      },
    },
    clipboard: { matchVisual: false },
  }
}

export const CATEGORY_MARKETING_RTE_FORMATS_WITH_IMAGE: string[] = [
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
