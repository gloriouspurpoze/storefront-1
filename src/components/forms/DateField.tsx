import React from 'react'
import { Info, CheckCircle2, AlertCircle, AlertTriangle } from 'lucide-react'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { cn } from '../../lib/utils'

export interface DateFieldProps {
  label: string
  value: string
  onChange: (value: string) => void
  error?: string
  helperText?: string
  required?: boolean
  disabled?: boolean
  placeholder?: string
  fullWidth?: boolean
  size?: 'small' | 'medium'
  variant?: 'outlined' | 'filled' | 'standard'
  tooltip?: string
  status?: 'success' | 'error' | 'warning' | 'info'
  min?: string
  max?: string
  showCharCount?: boolean
  maxLength?: number
}

const StatusIcon = ({ status }: { status?: DateFieldProps['status'] }) => {
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

export const DateField: React.FC<DateFieldProps> = ({
  label,
  value,
  onChange,
  error,
  helperText,
  required = false,
  disabled = false,
  placeholder,
  fullWidth = true,
  size = 'medium',
  tooltip,
  status,
  min,
  max,
  showCharCount = false,
  maxLength,
}) => {
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onChange(event.target.value)
  }

  const displayValue = value || ''
  const charCount = typeof displayValue === 'string' ? displayValue.length : 0
  const inputSize = size === 'small' ? 'h-8 text-sm' : 'h-10'

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

      <Input
        type="date"
        className={cn('w-full', inputSize, error && 'border-destructive', disabled && 'bg-muted')}
        value={displayValue}
        onChange={handleChange}
        disabled={disabled}
        placeholder={placeholder}
        min={min}
        max={max}
      />

      <div className="mt-1.5 flex items-center justify-between gap-2">
        <p
          className={cn(
            'm-0 text-sm',
            error ? 'text-destructive' : 'text-muted-foreground',
          )}
        >
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

export default DateField
