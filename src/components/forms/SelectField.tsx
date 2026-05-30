import React from 'react'
import { Info, X, CheckCircle2, AlertCircle, AlertTriangle } from 'lucide-react'
import { Label } from '../ui/label'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { cn } from '../../lib/utils'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '../ui/select'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu'

export interface SelectOption {
  value: any
  label: string
  disabled?: boolean
  group?: string
}

export interface SelectFieldProps {
  label: string
  value: any
  onChange: (value: any) => void
  options: SelectOption[]
  error?: string
  helperText?: string
  required?: boolean
  disabled?: boolean
  placeholder?: string
  fullWidth?: boolean
  size?: 'small' | 'medium'
  variant?: 'outlined' | 'filled' | 'standard'
  multiple?: boolean
  clearable?: boolean
  tooltip?: string
  status?: 'success' | 'error' | 'warning' | 'info'
  groupBy?: boolean
  renderValue?: (selected: any) => React.ReactNode
}

const optionKey = (v: any) => {
  if (v === null || v === undefined) return ''
  if (typeof v === 'object') return JSON.stringify(v)
  return String(v)
}

const StatusIcon = ({ status }: { status?: SelectFieldProps['status'] }) => {
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

export const SelectField: React.FC<SelectFieldProps> = ({
  label,
  value,
  onChange,
  options,
  error,
  helperText,
  required = false,
  disabled = false,
  placeholder,
  fullWidth = true,
  size = 'medium',
  multiple = false,
  clearable = false,
  tooltip,
  status,
  groupBy = false,
  renderValue,
}) => {
  const triggerSize = size === 'small' ? 'h-8 text-sm' : 'h-10'

  const findOption = (k: string) => options.find((o) => optionKey(o.value) === k)

  const handleClear = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onChange(multiple ? [] : '')
  }

  const isChecked = (opt: SelectOption) => {
    const ar = Array.isArray(value) ? value : []
    return ar.includes(opt.value)
  }

  const setMulti = (opt: SelectOption, checked: boolean) => {
    if (opt.disabled) return
    const ar = Array.isArray(value) ? value : []
    if (checked) {
      if (!ar.includes(opt.value)) onChange([...ar, opt.value])
    } else {
      onChange(ar.filter((v) => v !== opt.value))
    }
  }

  const groupedOptions = groupBy
    ? options.reduce<Record<string, SelectOption[]>>((acc, option) => {
        const g = option.group || 'Other'
        if (!acc[g]) acc[g] = []
        acc[g].push(option)
        return acc
      }, {})
    : null

  const renderMultiLabel = () => {
    if (renderValue) {
      return <span className="flex-1 text-left font-normal">{renderValue(value)}</span>
    }
    const ar = Array.isArray(value) ? value : []
    if (ar.length === 0) {
      return <span className="text-muted-foreground">{placeholder}</span>
    }
    return (
      <div className="flex flex-1 flex-wrap justify-start gap-1">
        {ar.map((val) => {
          const option = options.find((o) => o.value === val)
          return (
            <Badge key={optionKey(val)} variant="outline" className="font-normal">
              {option?.label ?? String(val)}
            </Badge>
          )
        })}
      </div>
    )
  }

  if (multiple) {
    return (
      <div className={cn(fullWidth ? 'w-full' : 'w-auto', 'space-y-1')}>
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

        <div className="flex items-start gap-1">
          <DropdownMenu>
            <DropdownMenuTrigger asChild disabled={disabled}>
              <Button
                type="button"
                variant="outline"
                className={cn(
                  'min-h-10 w-full flex-1 items-start justify-between px-3 py-2 font-normal',
                  triggerSize,
                  error && 'border-destructive',
                )}
              >
                {renderMultiLabel()}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-[var(--radix-dropdown-menu-trigger-width)] max-w-none">
              {groupedOptions
                ? Object.entries(groupedOptions).map(([group, groupOptions]) => (
                    <div key={group} className="px-0 py-1">
                      <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground">
                        {group}
                      </DropdownMenuLabel>
                      {groupOptions.map((option) => (
                        <DropdownMenuCheckboxItem
                          key={optionKey(option.value)}
                          checked={isChecked(option)}
                          disabled={option.disabled}
                          onSelect={(e) => e.preventDefault()}
                          onCheckedChange={(c) => setMulti(option, !!c)}
                          className="pl-2"
                        >
                          {option.label}
                        </DropdownMenuCheckboxItem>
                      ))}
                    </div>
                  ))
                : options.map((option) => (
                    <DropdownMenuCheckboxItem
                      key={optionKey(option.value)}
                      checked={isChecked(option)}
                      disabled={option.disabled}
                      onSelect={(e) => e.preventDefault()}
                      onCheckedChange={(c) => setMulti(option, !!c)}
                    >
                      {option.label}
                    </DropdownMenuCheckboxItem>
                  ))}
            </DropdownMenuContent>
          </DropdownMenu>
          {clearable &&
            !disabled &&
            (Array.isArray(value) && value.length > 0) && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0"
                onClick={handleClear}
                aria-label="Clear selection"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        {!error && helperText && (
          <p className="text-sm text-muted-foreground">{helperText}</p>
        )}
      </div>
    )
  }

  const vKey = optionKey(value)
  const hasValue = value !== null && value !== undefined && value !== ''
  return (
    <div className={cn(fullWidth ? 'w-full' : 'w-auto', 'space-y-1')}>
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

      <div className="flex items-center gap-1">
        <Select
          value={hasValue ? vKey : undefined}
          onValueChange={(k) => {
            const opt = findOption(k)
            if (opt) onChange(opt.value)
          }}
          disabled={disabled}
        >
          <SelectTrigger
            className={cn(
              'w-full',
              triggerSize,
              error && 'border-destructive',
            )}
            aria-invalid={!!error}
          >
            {renderValue && hasValue ? (
              <span className="line-clamp-1 w-full text-left">
                {renderValue(value)}
              </span>
            ) : (
              <SelectValue placeholder={placeholder} />
            )}
          </SelectTrigger>
          <SelectContent>
            {groupedOptions
              ? Object.entries(groupedOptions).map(([group, groupOptions]) => (
                  <SelectGroup key={group}>
                    <SelectLabel className="text-xs text-muted-foreground">{group}</SelectLabel>
                    {groupOptions.map((option) => (
                      <SelectItem
                        key={optionKey(option.value)}
                        value={optionKey(option.value)}
                        disabled={option.disabled}
                      >
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                ))
              : options.map((option) => (
                  <SelectItem
                    key={optionKey(option.value)}
                    value={optionKey(option.value)}
                    disabled={option.disabled}
                  >
                    {option.label}
                  </SelectItem>
                ))}
          </SelectContent>
        </Select>
        {clearable && hasValue && !disabled && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={handleClear}
            aria-label="Clear selection"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      {!error && helperText && <p className="text-sm text-muted-foreground">{helperText}</p>}
    </div>
  )
}

export default SelectField
