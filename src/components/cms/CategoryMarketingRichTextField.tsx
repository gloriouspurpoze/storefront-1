import React, { useEffect, useLayoutEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import ReactQuill from 'react-quill-new'
import { Label } from '../ui/label'
import { Textarea } from '../ui/textarea'
import { cn } from '../../lib/utils'
import { useCmsQuillImageEditor } from '../../hooks/useCmsQuillImageEditor'
import { CmsQuillAltTextDialog, CmsQuillCloudinaryDialog } from './CmsQuillImageDialogs'
import {
  CATEGORY_MARKETING_BODY_CLOUDINARY_FOLDER,
  CMS_QUILL_FULL_FORMATS_WITH_IMAGE,
} from '../../lib/cmsQuillImage'
import { quillTableEditorCss } from '../../lib/quillTableSupport'
import 'react-quill-new/dist/quill.snow.css'

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
  preview?: React.ReactNode
}

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
  const [editorReady, setEditorReady] = useState(false)
  const image = useCmsQuillImageEditor({
    folder: CATEGORY_MARKETING_BODY_CLOUDINARY_FOLDER,
    toolbarPreset: 'category-marketing',
  })

  useEffect(() => {
    setEditorReady(true)
  }, [])

  return (
    <div className="w-full space-y-2">
      <div className="flex items-center gap-2">
        <Label className={cn('text-sm font-semibold', error && 'text-destructive')}>
          {label}
          {required ? <span className="ml-0.5 text-destructive">*</span> : null}
        </Label>
        {image.uploading ? (
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
          ${quillTableEditorCss('category-marketing-rte')}
        `}</style>
        {editorReady ? (
          <ReactQuill
            ref={image.quillRef}
            theme="snow"
            value={value}
            onChange={onChange}
            modules={image.quillModules as ReactQuill.ReactQuillProps['modules']}
            formats={[...CMS_QUILL_FULL_FORMATS_WITH_IMAGE]}
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
        {error || helperText || 'Toolbar: headings, lists, links, tables (▦), image upload (alt required), Cloudinary library.'}
      </p>

      {preview ? (
        <div className="rounded-lg border border-dashed border-primary/30 bg-muted/20 p-3">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            Live preview (consumer style)
          </p>
          {preview}
        </div>
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

export default CategoryMarketingRichTextField
