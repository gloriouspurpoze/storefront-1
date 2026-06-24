import React, { Component, type ErrorInfo, useLayoutEffect, useRef, useState } from 'react'
import { Info, CheckCircle2, AlertCircle, AlertTriangle } from 'lucide-react'
import ReactQuill from 'react-quill-new'
import { Label } from '../ui/label'
import { Textarea } from '../ui/textarea'
import { cn } from '../../lib/utils'
import {
  mergeFormatsWithTableSupport,
  mergeModulesWithTableSupport,
  quillTableEditorCss,
} from '../../lib/quillTableSupport'
import { RichTextPreview, type RichTextPreviewVariant } from './RichTextPreview'
import 'react-quill-new/dist/quill.snow.css'

/** Stable references — `react-quill-new` treats unequal `modules` as a full editor teardown/rebuild. */
const RICH_TEXT_DEFAULT_MODULES = mergeModulesWithTableSupport({
  toolbar: [
    [{ header: [1, 2, 3, 4, 5, 6, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ color: [] }, { background: [] }],
    [{ list: 'ordered' }, { list: 'bullet' }],
    [{ indent: '-1' }, { indent: '+1' }],
    [{ align: [] }],
    ['link', 'image', 'video'],
    ['clean'],
  ],
  clipboard: { matchVisual: false },
})

const RICH_TEXT_DEFAULT_FORMATS = mergeFormatsWithTableSupport([
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
  'video',
])

/** Catches Quill / React 19 edge cases during mount or reconciliation; keeps the form usable. */
class QuillGuard extends Component<
  { children: React.ReactNode; fallback: React.ReactNode },
  { error: Error | null }
> {
  state = { error: null }

  static getDerivedStateFromError(error: Error) {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[RichTextField] Quill failed:', error, info.componentStack)
  }

  render() {
    if (this.state.error) return <>{this.props.fallback}</>
    return this.props.children
  }
}

export interface RichTextFieldProps {
  label: string
  value: string
  onChange: (value: string) => void
  error?: string
  helperText?: string
  required?: boolean
  disabled?: boolean
  placeholder?: string
  fullWidth?: boolean
  height?: number
  tooltip?: string
  status?: 'success' | 'error' | 'warning' | 'info'
  modules?: any
  formats?: string[]
  showCharCount?: boolean
  maxLength?: number
  /** Insert HTML tables via toolbar (▦). Default on. */
  enableTables?: boolean
  /** Live consumer-style preview below the editor. Default on. */
  showPreview?: boolean
  previewVariant?: RichTextPreviewVariant
  /** Optional content above preview (e.g. related heading). */
  previewContext?: React.ReactNode
}

const StatusIcon = ({ status }: { status?: RichTextFieldProps['status'] }) => {
  if (!status) return null
  const cls = 'h-4 w-4 shrink-0'
  switch (status) {
    case 'success':
      return <CheckCircle2 className={cn(cls, 'text-storm-deep')} aria-hidden />
    case 'error':
      return <AlertCircle className={cn(cls, 'text-destructive')} aria-hidden />
    case 'warning':
      return <AlertTriangle className={cn(cls, 'text-bloom-coral')} aria-hidden />
    case 'info':
      return <Info className={cn(cls, 'text-muted-foreground')} aria-hidden />
    default:
      return null
  }
}

export const RichTextField: React.FC<RichTextFieldProps> = ({
  label,
  value,
  onChange,
  error,
  helperText,
  required = false,
  disabled = false,
  placeholder = 'Start typing...',
  fullWidth = true,
  height = 200,
  tooltip,
  status,
  modules,
  formats,
  showCharCount = false,
  maxLength,
  enableTables = true,
  showPreview = true,
  previewVariant = 'default',
  previewContext,
}) => {
  const quillRef = useRef<ReactQuill>(null)
  /** Mount Quill after DOM commit (layout phase) — fewer races with React 19 concurrent passes than useEffect. */
  const [editorReady, setEditorReady] = useState(false)
  useLayoutEffect(() => {
    setEditorReady(true)
  }, [])

  const resolvedModules = enableTables
    ? mergeModulesWithTableSupport((modules ?? RICH_TEXT_DEFAULT_MODULES) as Record<string, unknown>)
    : ((modules ?? RICH_TEXT_DEFAULT_MODULES) as Record<string, unknown>)

  const resolvedFormats = enableTables
    ? mergeFormatsWithTableSupport(formats ?? RICH_TEXT_DEFAULT_FORMATS)
    : ((formats ?? [...RICH_TEXT_DEFAULT_FORMATS]) as string[])

  const handleChange = (content: string) => {
    if (maxLength && content.length > maxLength) {
      return
    }
    onChange(content)
  }

  const charCount = value ? value.replace(/<[^>]*>/g, '').length : 0

  return (
    <div className={cn(fullWidth ? 'w-full' : 'w-auto')}>
      <div className="mb-1 flex items-center gap-1">
        <Label
          className={cn('text-sm font-semibold', error && 'text-destructive')}
        >
          {label}
          {required && <span className="ml-0.5 text-destructive">*</span>}
        </Label>
        {tooltip && (
          <span title={tooltip} className="inline-flex cursor-default text-muted-foreground">
            <Info className="h-4 w-4" />
          </span>
        )}
        <StatusIcon status={status} />
      </div>

      <div
        className={cn(
          'rich-text-field',
          '[&_.ql-toolbar]:rounded-t-md [&_.ql-toolbar]:border [&_.ql-toolbar]:border-b-0 [&_.ql-toolbar]:border-input',
          '[&_.ql-container]:rounded-b-md [&_.ql-container]:border [&_.ql-container]:border-input',
          '[&_.ql-container]:text-sm',
          error && '[&_.ql-toolbar]:border-destructive [&_.ql-container]:border-destructive',
          disabled && '[&_.ql-toolbar]:bg-muted [&_.ql-container]:bg-muted opacity-60',
        )}
      >
        <style>{`
          .rich-text-field .ql-container { min-height: ${height}px; }
          .rich-text-field .ql-editor { min-height: ${Math.max(0, height - 42)}px; padding: 12px 15px; }
          ${enableTables ? quillTableEditorCss('rich-text-field') : ''}
        `}</style>
        {editorReady ? (
          <QuillGuard
            fallback={
              <Textarea
                className="min-h-[120px] rounded-b-md border border-t-0 border-input bg-background px-3 py-2 font-mono text-sm"
                style={{ minHeight: height }}
                value={value}
                onChange={(e) => handleChange(e.target.value)}
                placeholder={placeholder}
                disabled={disabled}
                aria-label={label}
              />
            }
          >
            <ReactQuill
              ref={quillRef}
              theme="snow"
              value={value}
              onChange={handleChange}
              modules={resolvedModules as ReactQuill.ReactQuillProps['modules']}
              formats={resolvedFormats}
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

      {showPreview ? (
        <RichTextPreview html={value} variant={previewVariant} context={previewContext} />
      ) : null}

      <div className="mt-1.5 flex items-center justify-between gap-2">
        <p className={cn('m-0 text-sm', error ? 'text-destructive' : 'text-muted-foreground')}>
          {error || helperText}
        </p>
        {showCharCount && maxLength && (
          <span
            className={cn(
              'shrink-0 text-xs',
              charCount > maxLength * 0.9 ? 'text-bloom-coral' : 'text-muted-foreground',
            )}
          >
            {charCount}/{maxLength}
          </span>
        )}
      </div>
    </div>
  )
}

export default RichTextField
