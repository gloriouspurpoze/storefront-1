import React from 'react'
import { Info, CheckCircle2, AlertCircle, AlertTriangle } from 'lucide-react'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Textarea } from '../ui/textarea'
import { cn } from '../../lib/utils'

export interface FormFieldProps {
  label: string
  value: any
  onChange: (value: any) => void
  error?: string
  helperText?: string
  required?: boolean
  disabled?: boolean
  placeholder?: string
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url'
  multiline?: boolean
  rows?: number
  startAdornment?: React.ReactNode
  endAdornment?: React.ReactNode
  fullWidth?: boolean
  size?: 'small' | 'medium'
  variant?: 'outlined' | 'filled' | 'standard'
  maxLength?: number
  showCharCount?: boolean
  tooltip?: string
  status?: 'success' | 'error' | 'warning' | 'info'
}

const StatusIcon = ({ status }: { status?: FormFieldProps['status'] }) => {
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

export const FormField: React.FC<FormFieldProps> = ({
  label,
  value,
  onChange,
  error,
  helperText,
  required = false,
  disabled = false,
  placeholder,
  type = 'text',
  multiline = false,
  rows = 1,
  startAdornment,
  endAdornment,
  fullWidth = true,
  size = 'medium',
  maxLength,
  showCharCount = false,
  tooltip,
  status,
}) => {
  const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    let newValue: string | number = event.target.value
    if (type === 'number') {
      if (event.target.value === '') {
        onChange('')
        return
      }
      const numValue = Number(event.target.value)
      if (!Number.isNaN(numValue)) {
        newValue = numValue
      } else {
        return
      }
    }
    if (maxLength && typeof newValue === 'string' && newValue.length > maxLength) {
      return
    }
    onChange(newValue)
  }

  const displayValue = value ?? ''
  const charCount = typeof displayValue === 'string' ? displayValue.length : 0
  const inputSize = size === 'small' ? 'h-8 text-sm' : 'h-10'
  const fieldClass = cn(
    error && 'border-destructive focus-visible:ring-destructive',
    (startAdornment || endAdornment) && 'relative',
  )

  return (
    <div className={cn(fullWidth ? 'w-full' : 'w-auto')}>
      <div className="mb-1 flex items-center gap-1">
        <Label
          className={cn(
            'text-sm font-semibold',
            error && 'text-destructive',
          )}
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

      {multiline ? (
        <Textarea
          value={displayValue}
          onChange={handleChange}
          disabled={disabled}
          placeholder={placeholder}
          maxLength={maxLength}
          rows={rows}
          className={cn('w-full', fieldClass, disabled && 'bg-muted')}
        />
      ) : (
        <div className="relative">
          {startAdornment && (
            <span className="absolute left-2.5 top-1/2 z-10 -translate-y-1/2 text-muted-foreground [&_svg]:h-4 [&_svg]:w-4">
              {startAdornment}
            </span>
          )}
          <Input
            className={cn(
              'w-full',
              fieldClass,
              inputSize,
              startAdornment && 'pl-9',
              endAdornment && 'pr-9',
              disabled && 'bg-muted',
            )}
            value={displayValue}
            onChange={handleChange}
            disabled={disabled}
            placeholder={placeholder}
            type={type}
            maxLength={maxLength}
          />
          {endAdornment && (
            <span className="absolute right-2.5 top-1/2 z-10 -translate-y-1/2 text-muted-foreground [&_svg]:h-4 [&_svg]:w-4">
              {endAdornment}
            </span>
          )}
        </div>
      )}

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

export default FormField
