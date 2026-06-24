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
import { cmsRichImageLayoutCss } from '../../lib/quillCmsImage'
import { quillTableEditorCss } from '../../lib/quillTableSupport'
import { QuillImageLayoutBar } from './QuillImageLayoutBar'
import { RichTextPreview } from '../forms/RichTextPreview'
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
  /** Live preview below editor. Default on. */
  showPreview?: boolean
  /** Optional content shown above preview body (e.g. page heading). */
  previewContext?: React.ReactNode
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
  showPreview = true,
  previewContext,
}: CategoryMarketingRichTextFieldProps) {
  const [editorReady, setEditorReady] = useState(false)
  const [selectionTick, setSelectionTick] = useState(0)
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

      <QuillImageLayoutBar
        quill={editorReady ? image.quillRef.current?.getEditor() ?? null : null}
        selectionTick={selectionTick}
        disabled={disabled}
        onApplied={() => {
          const rq = image.quillRef.current
          if (rq) onChange(rq.getEditor().root.innerHTML)
        }}
      />

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
          ${cmsRichImageLayoutCss('category-marketing-rte')}
          ${quillTableEditorCss('category-marketing-rte')}
        `}</style>
        {editorReady ? (
          <ReactQuill
            ref={image.quillRef}
            theme="snow"
            value={value}
            onChange={onChange}
            onChangeSelection={() => setSelectionTick((n) => n + 1)}
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
        {error || helperText || 'Headings, lists, links, tables (▦), images with left/right float. Click an image to adjust layout.'}
      </p>

      {showPreview ? (
        <RichTextPreview
          html={value}
          variant="marketing"
          context={previewContext}
        />
      ) : null}

      <CmsQuillAltTextDialog
        open={image.altDialogOpen}
        pendingImageUrl={image.pendingImageUrl}
        altDraft={image.altDraft}
        layout={image.layoutDraft}
        widthPx={image.widthDraft}
        heightPx={image.heightDraft}
        onAltChange={image.setAltDraft}
        onLayoutChange={image.setLayoutDraft}
        onWidthChange={image.setWidthDraft}
        onHeightChange={image.setHeightDraft}
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
