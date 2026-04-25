import React, { useRef } from 'react'
import { Info, CheckCircle2, AlertCircle, AlertTriangle } from 'lucide-react'
import ReactQuill from 'react-quill-new'
import { Label } from '../ui/label'
import { cn } from '../../lib/utils'
import 'react-quill-new/dist/quill.snow.css'

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
}

const StatusIcon = ({ status }: { status?: RichTextFieldProps['status'] }) => {
  if (!status) return null
  const cls = 'h-4 w-4 shrink-0'
  switch (status) {
    case 'success':
      return <CheckCircle2 className={cn(cls, 'text-green-600')} aria-hidden />
    case 'error':
      return <AlertCircle className={cn(cls, 'text-destructive')} aria-hidden />
    case 'warning':
      return <AlertTriangle className={cn(cls, 'text-amber-600')} aria-hidden />
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
}) => {
  const quillRef = useRef<ReactQuill>(null)

  const defaultModules = {
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
    clipboard: {
      matchVisual: false,
    },
  }

  const defaultFormats = [
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
  ]

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
        `}</style>
        <ReactQuill
          ref={quillRef}
          theme="snow"
          value={value}
          onChange={handleChange}
          modules={modules || defaultModules}
          formats={formats || defaultFormats}
          placeholder={placeholder}
          readOnly={disabled}
        />
      </div>

      <div className="mt-1.5 flex items-center justify-between gap-2">
        <p className={cn('m-0 text-sm', error ? 'text-destructive' : 'text-muted-foreground')}>
          {error || helperText}
        </p>
        {showCharCount && maxLength && (
          <span
            className={cn(
              'shrink-0 text-xs',
              charCount > maxLength * 0.9 ? 'text-amber-600' : 'text-muted-foreground',
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
