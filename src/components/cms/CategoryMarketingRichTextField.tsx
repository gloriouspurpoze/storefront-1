import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type Quill from 'quill'
import ReactQuill from 'react-quill-new'
import { ImageIcon, Loader2, X } from 'lucide-react'
import { Label } from '../ui/label'
import { Input } from '../ui/input'
import { Button } from '../ui/button'
import { cn } from '../../lib/utils'
import { useToast } from '../ui/use-toast'
import UploadService from '../../services/api/upload.service'
import {
  buildCategoryMarketingQuillModules,
  CATEGORY_MARKETING_BODY_CLOUDINARY_FOLDER,
  CATEGORY_MARKETING_RTE_FORMATS_WITH_IMAGE,
} from '../../lib/categoryMarketingQuillImage'
import 'react-quill-new/dist/quill.snow.css'

const CLOUDINARY_LIBRARY_LIMIT = 48

export interface CategoryMarketingRichTextFieldProps {
  label: string
  value: string
  onChange: (value: string) => void
  error?: string
  helperText?: string
  required?: boolean
  disabled?: boolean
  placeholder?: string
  height?: number
  /** Optional live preview below the editor (consumer-style). */
  preview?: React.ReactNode
}

/**
 * Rich text for category-marketing CMS fields — supports Cloudinary image upload
 * with required alt text (SEO + accessibility) and optional inline preview.
 */
export function CategoryMarketingRichTextField({
  label,
  value,
  onChange,
  error,
  helperText,
  required = false,
  disabled = false,
  placeholder = 'Start typing…',
  height = 200,
  preview,
}: CategoryMarketingRichTextFieldProps) {
  const { toast } = useToast()
  const quillRef = useRef<ReactQuill>(null)
  const pendingQuillRef = useRef<Quill | null>(null)
  const pendingIndexRef = useRef(0)

  const [editorReady, setEditorReady] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [altDialogOpen, setAltDialogOpen] = useState(false)
  const [pendingImageUrl, setPendingImageUrl] = useState<string | null>(null)
  const [altDraft, setAltDraft] = useState('')

  const [cloudinaryOpen, setCloudinaryOpen] = useState(false)
  const [cloudinaryLoading, setCloudinaryLoading] = useState(false)
  const [cloudinaryError, setCloudinaryError] = useState<string | null>(null)
  const [cloudinaryImages, setCloudinaryImages] = useState<Array<{ url: string; publicId: string }>>([])

  useEffect(() => {
    setEditorReady(true)
  }, [])

  const openAltForImage = useCallback((url: string, insertIndex: number, quill: Quill) => {
    pendingQuillRef.current = quill
    pendingIndexRef.current = insertIndex
    setPendingImageUrl(url)
    setAltDraft('')
    setAltDialogOpen(true)
  }, [])

  const quillModules = useMemo(
    () =>
      buildCategoryMarketingQuillModules({
        onUploadStart: () => setUploading(true),
        onUploadError: (message) => {
          setUploading(false)
          toast({ title: 'Image upload failed', description: message, variant: 'destructive' })
        },
        onImageReadyForAlt: (url, insertIndex, quill) => {
          setUploading(false)
          openAltForImage(url, insertIndex, quill)
        },
        onOpenCloudinaryLibrary: (insertIndex, quill) => {
          pendingQuillRef.current = quill
          pendingIndexRef.current = insertIndex
          setCloudinaryOpen(true)
        },
      }),
    [openAltForImage, toast],
  )

  const confirmAlt = useCallback(() => {
    const url = pendingImageUrl
    const alt = altDraft.trim()
    const editor = pendingQuillRef.current
    if (!url || !editor) {
      setAltDialogOpen(false)
      return
    }
    if (!alt) {
      toast({
        title: 'Alt text required',
        description: 'Describe the image for screen readers and Google Image SEO.',
        variant: 'destructive',
      })
      return
    }
    const idx = pendingIndexRef.current
    editor.insertEmbed(idx, 'image', url, 'user')
    editor.formatText(idx, 1, { alt }, 'user')
    editor.setSelection(idx + 1, 0)
    setAltDialogOpen(false)
    setPendingImageUrl(null)
    setAltDraft('')
    toast({ title: 'Image inserted', description: 'Alt text saved with this image.' })
  }, [altDraft, pendingImageUrl, toast])

  const cancelAlt = useCallback(() => {
    setAltDialogOpen(false)
    setPendingImageUrl(null)
    setAltDraft('')
  }, [])

  useEffect(() => {
    if (!cloudinaryOpen) return
    setCloudinaryLoading(true)
    setCloudinaryError(null)
    void UploadService.listImages(CATEGORY_MARKETING_BODY_CLOUDINARY_FOLDER, CLOUDINARY_LIBRARY_LIMIT)
      .then((rows) => setCloudinaryImages(rows.map((r) => ({ url: r.url, publicId: r.publicId ?? r.url }))))
      .catch((e: unknown) =>
        setCloudinaryError(e instanceof Error ? e.message : 'Could not load Cloudinary library'),
      )
      .finally(() => setCloudinaryLoading(false))
  }, [cloudinaryOpen])

  const pickFromLibrary = useCallback(
    (url: string) => {
      setCloudinaryOpen(false)
      const quill = pendingQuillRef.current
      if (!quill) return
      openAltForImage(url, pendingIndexRef.current, quill)
    },
    [openAltForImage],
  )

  return (
    <div className="w-full space-y-2">
      <div className="flex items-center gap-2">
        <Label className={cn('text-sm font-semibold', error && 'text-destructive')}>
          {label}
          {required ? <span className="ml-0.5 text-destructive">*</span> : null}
        </Label>
        {uploading ? (
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            <Loader2 className="h-3 w-3 animate-spin" aria-hidden />
            Uploading…
          </span>
        ) : null}
      </div>

      <div
        className={cn(
          'category-marketing-rte',
          '[&_.ql-toolbar]:rounded-t-md [&_.ql-toolbar]:border [&_.ql-toolbar]:border-b-0 [&_.ql-toolbar]:border-input',
          '[&_.ql-container]:rounded-b-md [&_.ql-container]:border [&_.ql-container]:border-input',
          error && '[&_.ql-toolbar]:border-destructive [&_.ql-container]:border-destructive',
          disabled && 'pointer-events-none opacity-60',
        )}
      >
        <style>{`
          .category-marketing-rte .ql-container { min-height: ${height}px; }
          .category-marketing-rte .ql-editor { min-height: ${Math.max(0, height - 42)}px; }
          .category-marketing-rte .ql-toolbar button.ql-cloudinary::before {
            content: '☁';
            font-size: 14px;
            line-height: 1;
          }
          .category-marketing-rte .ql-editor img {
            max-width: 100%;
            height: auto;
            border-radius: 0.375rem;
          }
        `}</style>
        {editorReady ? (
          <ReactQuill
            ref={quillRef}
            theme="snow"
            value={value}
            onChange={onChange}
            modules={quillModules as ReactQuill.ReactQuillProps['modules']}
            formats={CATEGORY_MARKETING_RTE_FORMATS_WITH_IMAGE}
            placeholder={placeholder}
            readOnly={disabled}
          />
        ) : (
          <div
            className="flex items-center rounded-b-md border border-input bg-muted/30 px-3 text-sm text-muted-foreground"
            style={{ minHeight: height }}
          >
            Loading editor…
          </div>
        )}
      </div>

      <p className={cn('text-xs', error ? 'text-destructive' : 'text-muted-foreground')}>
        {error || helperText || 'Toolbar: headings, lists, links, image upload (alt required), Cloudinary library.'}
      </p>

      {preview ? (
        <div className="rounded-lg border border-dashed border-primary/30 bg-muted/20 p-3">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            Live preview (consumer style)
          </p>
          {preview}
        </div>
      ) : null}

      {altDialogOpen ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-lg border border-border bg-card p-5 shadow-xl">
            <h3 className="text-base font-semibold">Image alt text (required)</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Describe what the image shows — used for accessibility and Google Image search.
            </p>
            {pendingImageUrl ? (
              <div className="mt-3 overflow-hidden rounded-md border border-border/60 bg-muted/30">
                <img src={pendingImageUrl} alt="" className="max-h-40 w-full object-contain" />
              </div>
            ) : null}
            <Input
              className="mt-3"
              value={altDraft}
              onChange={(e) => setAltDraft(e.target.value)}
              placeholder="e.g. Electrician testing DB panel in Mira Road apartment"
              autoFocus
            />
            <div className="mt-4 flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={cancelAlt}>
                Cancel
              </Button>
              <Button type="button" onClick={confirmAlt}>
                Insert image
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {cloudinaryOpen ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
          <div className="flex max-h-[85vh] w-full max-w-2xl flex-col rounded-lg border border-border bg-card shadow-xl">
            <div className="flex items-center justify-between border-b border-border/60 px-4 py-3">
              <div className="flex items-center gap-2">
                <ImageIcon className="h-4 w-4 text-muted-foreground" aria-hidden />
                <h3 className="text-sm font-semibold">Insert from Cloudinary</h3>
              </div>
              <Button type="button" variant="ghost" size="icon" onClick={() => setCloudinaryOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="overflow-y-auto p-4">
              {cloudinaryLoading ? (
                <p className="py-8 text-center text-sm text-muted-foreground">Loading library…</p>
              ) : null}
              {cloudinaryError ? (
                <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{cloudinaryError}</p>
              ) : null}
              {!cloudinaryLoading && !cloudinaryError && cloudinaryImages.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  No images in `{CATEGORY_MARKETING_BODY_CLOUDINARY_FOLDER}` yet — upload via the image button.
                </p>
              ) : null}
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {cloudinaryImages.map((img) => (
                  <button
                    key={img.publicId}
                    type="button"
                    className="overflow-hidden rounded-md border border-border/60 transition hover:border-primary/50 hover:ring-2 hover:ring-primary/20"
                    onClick={() => pickFromLibrary(img.url)}
                  >
                    <img src={img.url} alt="" className="aspect-video w-full object-cover" loading="lazy" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

export default CategoryMarketingRichTextField
