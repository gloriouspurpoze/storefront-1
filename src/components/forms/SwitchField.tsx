import React from 'react'
import { Info, CheckCircle2, AlertCircle, AlertTriangle } from 'lucide-react'
import { Label } from '../ui/label'
import { Switch } from '../ui/switch'
import { cn } from '../../lib/utils'

export interface SwitchFieldProps {
  label: string
  value: boolean
  onChange: (value: boolean) => void
  error?: string
  helperText?: string
  disabled?: boolean
  tooltip?: string
  status?: 'success' | 'error' | 'warning' | 'info'
  color?: 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success'
  size?: 'small' | 'medium'
  required?: boolean
}

const StatusIcon = ({ status }: { status?: SwitchFieldProps['status'] }) => {
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

export const SwitchField: React.FC<SwitchFieldProps> = ({
  label,
  value,
  onChange,
  error,
  helperText,
  disabled = false,
  tooltip,
  status,
  size: _size = 'medium',
  required = false,
}) => {
  return (
    <div className="w-full space-y-1">
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

      <div className="flex items-center gap-3">
        <Switch
          checked={value}
          onCheckedChange={onChange}
          disabled={disabled}
        />
        <span
          className={cn(
            'text-sm',
            error ? 'text-destructive' : value ? 'text-foreground' : 'text-muted-foreground',
          )}
        >
          {value ? 'Enabled' : 'Disabled'}
        </span>
        {status && <StatusIcon status={status} />}
      </div>

      {(helperText || error) && (
        <p
          className={cn(
            'text-sm',
            error ? 'text-destructive' : 'text-muted-foreground',
          )}
        >
          {error || helperText}
        </p>
      )}
    </div>
  )
}

export default SwitchField
