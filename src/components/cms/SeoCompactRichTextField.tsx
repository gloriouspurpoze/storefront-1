import React, { Component, type ErrorInfo, useLayoutEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import ReactQuill from 'react-quill-new'
import { RichTextField } from '../forms/RichTextField'
import { Label } from '../ui/label'
import { cn } from '../../lib/utils'
import { useCmsQuillImageEditor } from '../../hooks/useCmsQuillImageEditor'
import { CmsQuillAltTextDialog, CmsQuillCloudinaryDialog } from './CmsQuillImageDialogs'
import {
  CMS_QUILL_COMPACT_FORMATS_WITH_IMAGE,
  SEO_LANDING_QUICK_ANSWER_CLOUDINARY_FOLDER,
} from '../../lib/cmsQuillImage'
import { mergeFormatsWithTableSupport, mergeModulesWithTableSupport, quillTableEditorCss } from '../../lib/quillTableSupport'
import 'react-quill-new/dist/quill.snow.css'

const COMPACT_MODULES = mergeModulesWithTableSupport({
  toolbar: [
    ['bold', 'italic', 'underline'],
    [{ list: 'ordered' }, { list: 'bullet' }],
    ['link'],
    ['clean'],
  ],
  clipboard: { matchVisual: false },
})

const COMPACT_FORMATS = mergeFormatsWithTableSupport([
  'bold',
  'italic',
  'underline',
  'list',
  'bullet',
  'link',
])

export interface SeoCompactRichTextFieldProps {
  label: string
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  placeholder?: string
  helperText?: string
  height?: number
  showCharCount?: boolean
  /** Upload + Cloudinary library for inline images (alt text required). */
  enableImages?: boolean
}

class QuillGuard extends Component<
  { children: React.ReactNode; fallback: React.ReactNode },
  { error: Error | null }
> {
  state = { error: null as Error | null }

  static getDerivedStateFromError(error: Error) {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[SeoCompactRichTextField] Quill failed:', error, info.componentStack)
  }

  render() {
    if (this.state.error) return <>{this.props.fallback}</>
    return this.props.children
  }
}

/** Lightweight Quill for speakable blocks (quick answer, takeaway bullets). */
export function SeoCompactRichTextField({
  label,
  value,
  onChange,
  disabled,
  placeholder,
  helperText,
  height = 140,
  showCharCount,
  enableImages = false,
}: SeoCompactRichTextFieldProps) {
  const [editorReady, setEditorReady] = useState(false)
  const image = useCmsQuillImageEditor({
    folder: SEO_LANDING_QUICK_ANSWER_CLOUDINARY_FOLDER,
    toolbarPreset: 'compact',
  })

  useLayoutEffect(() => {
    setEditorReady(true)
  }, [])

  if (!enableImages) {
    return (
      <RichTextField
        label={label}
        value={value}
        onChange={onChange}
        disabled={disabled}
        placeholder={placeholder}
        helperText={helperText}
        height={height}
        modules={COMPACT_MODULES}
        formats={COMPACT_FORMATS}
        enableTables
        showCharCount={showCharCount}
      />
    )
  }

  const charCount = value ? value.replace(/<[^>]*>/g, '').length : 0

  return (
    <div className="w-full">
      <div className="mb-1 flex items-center gap-2">
        <Label className="text-sm font-semibold">{label}</Label>
        {image.uploading ? (
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            <Loader2 className="h-3 w-3 animate-spin" aria-hidden />
            Uploading…
          </span>
        ) : null}
      </div>

      <div
        className={cn(
          'seo-compact-rte',
          '[&_.ql-toolbar]:rounded-t-md [&_.ql-toolbar]:border [&_.ql-toolbar]:border-b-0 [&_.ql-toolbar]:border-input',
          '[&_.ql-container]:rounded-b-md [&_.ql-container]:border [&_.ql-container]:border-input',
          '[&_.ql-container]:text-sm',
          disabled && '[&_.ql-toolbar]:bg-muted [&_.ql-container]:bg-muted opacity-60',
        )}
      >
        <style>{`
          .seo-compact-rte .ql-container { min-height: ${height}px; }
          .seo-compact-rte .ql-editor { min-height: ${Math.max(0, height - 42)}px; padding: 12px 15px; }
          .seo-compact-rte .ql-toolbar button.ql-cloudinary::before {
            content: '☁';
            font-size: 14px;
            line-height: 1;
          }
          .seo-compact-rte .ql-editor img {
            max-width: 100%;
            height: auto;
            border-radius: 0.375rem;
          }
          ${quillTableEditorCss('seo-compact-rte')}
        `}</style>
        {editorReady ? (
          <QuillGuard
            fallback={
              <textarea
                className="min-h-[120px] w-full rounded-b-md border border-t-0 border-input bg-background px-3 py-2 font-mono text-sm"
                style={{ minHeight: height }}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                disabled={disabled}
                aria-label={label}
              />
            }
          >
            <ReactQuill
              ref={image.quillRef}
              theme="snow"
              value={value}
              onChange={onChange}
              modules={image.quillModules as ReactQuill.ReactQuillProps['modules']}
              formats={[...CMS_QUILL_COMPACT_FORMATS_WITH_IMAGE]}
              placeholder={placeholder}
              readOnly={disabled}
            />
          </QuillGuard>
        ) : (
          <div
            className="flex items-center rounded-b-md border border-t-0 border-input bg-muted/30 px-3 text-sm text-muted-foreground"
            style={{ minHeight: height }}
          >
            Loading editor…
          </div>
        )}
      </div>

      <p className="mt-1.5 text-sm text-muted-foreground">
        {helperText || 'Bold, lists, links, tables (▦), image upload (alt required), Cloudinary library (☁).'}
      </p>
      {showCharCount ? (
        <p className="mt-0.5 text-xs text-muted-foreground">{charCount} characters (HTML excluded)</p>
      ) : null}

      <CmsQuillAltTextDialog
        open={image.altDialogOpen}
        pendingImageUrl={image.pendingImageUrl}
        altDraft={image.altDraft}
        onAltChange={image.setAltDraft}
        onConfirm={image.confirmAlt}
        onCancel={image.cancelAlt}
      />

      <CmsQuillCloudinaryDialog
        open={image.cloudinaryOpen}
        folder={image.folder}
        loading={image.cloudinaryLoading}
        error={image.cloudinaryError}
        images={image.cloudinaryImages}
        onClose={() => image.setCloudinaryOpen(false)}
        onPick={image.pickFromLibrary}
      />
    </div>
  )
}
