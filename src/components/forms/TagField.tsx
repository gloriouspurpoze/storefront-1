import React, { useState, useMemo } from 'react'
import { Plus, X, Info, CheckCircle2, AlertCircle, AlertTriangle } from 'lucide-react'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { cn } from '../../lib/utils'

export interface TagFieldProps {
  label: string
  value: string[]
  onChange: (tags: string[]) => void
  error?: string
  helperText?: string
  required?: boolean
  disabled?: boolean
  placeholder?: string
  tooltip?: string
  status?: 'success' | 'error' | 'warning' | 'info'
  maxTags?: number
  allowDuplicates?: boolean
  suggestions?: string[]
  freeSolo?: boolean
  size?: 'small' | 'medium'
}

const StatusIcon = ({ status }: { status?: TagFieldProps['status'] }) => {
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

const TagPill: React.FC<{
  tag: string
  onRemove: () => void
  disabled?: boolean
}> = ({ tag, onRemove, disabled }) => (
  <Badge variant="outline" className="max-w-full gap-1 pl-2 pr-1 font-normal">
    <span className="truncate">{tag}</span>
    <button
      type="button"
      className="shrink-0 rounded-sm p-0.5 hover:bg-muted disabled:pointer-events-none"
      onClick={onRemove}
      disabled={disabled}
      aria-label={`Remove ${tag}`}
    >
      <X className="h-3 w-3" />
    </button>
  </Badge>
)

export const TagField: React.FC<TagFieldProps> = ({
  label,
  value = [],
  onChange,
  error,
  helperText,
  required = false,
  disabled = false,
  placeholder = 'Add tags...',
  tooltip,
  status,
  maxTags = 20,
  allowDuplicates = false,
  suggestions = [],
  freeSolo = true,
  size = 'medium',
}) => {
  const [inputValue, setInputValue] = useState('')

  const inputSize = size === 'small' ? 'h-8 text-sm' : 'h-10'

  const handleAddTag = (tag: string) => {
    const trimmed = tag.trim()
    if (!trimmed) return
    if (value.length >= maxTags) return
    if (!allowDuplicates && value.includes(trimmed)) return
    onChange([...value, trimmed])
    setInputValue('')
  }

  const handleRemove = (t: string) => {
    onChange(value.filter((x) => x !== t))
  }

  const filteredSuggestions = useMemo(() => {
    if (!suggestions.length) return []
    const q = inputValue.toLowerCase()
    return suggestions.filter(
      (s) =>
        s.toLowerCase().includes(q) && (allowDuplicates || !value.includes(s)),
    )
  }, [suggestions, inputValue, value, allowDuplicates])

  const canAddMore = value.length < maxTags
  const showSolo = freeSolo

  const labelRow = (
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
  )

  if (showSolo) {
    return (
      <div className="w-full space-y-1">
        {labelRow}
        {value.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-1">
            {value.map((tag) => (
              <TagPill
                key={tag}
                tag={tag}
                disabled={disabled}
                onRemove={() => handleRemove(tag)}
              />
            ))}
          </div>
        )}
        <div className="space-y-1">
          <Input
            className={cn('w-full', inputSize, error && 'border-destructive', disabled && 'bg-muted')}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                handleAddTag(inputValue)
              }
            }}
            disabled={disabled}
            placeholder={canAddMore ? placeholder : `Maximum ${maxTags} tags reached`}
          />
          {filteredSuggestions.length > 0 && canAddMore && !disabled && inputValue && (
            <ul className="z-10 max-h-32 overflow-y-auto rounded-md border bg-popover p-1 text-sm text-popover-foreground shadow">
              {filteredSuggestions.slice(0, 8).map((s) => (
                <li key={s} className="m-0 list-none p-0">
                  <button
                    type="button"
                    className="w-full rounded-sm px-2 py-1.5 text-left hover:bg-accent"
                    onClick={() => handleAddTag(s)}
                  >
                    {s}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        {(error || helperText) && (
          <p
            className={cn(
              'text-sm',
              error ? 'text-destructive' : 'text-muted-foreground',
            )}
          >
            {error || helperText}
          </p>
        )}
        <p className="text-xs text-muted-foreground">
          {value.length}/{maxTags} tags
        </p>
      </div>
    )
  }

  return (
    <div className="w-full space-y-1">
      {labelRow}
      {value.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1">
          {value.map((tag) => (
            <TagPill
              key={tag}
              tag={tag}
              disabled={disabled}
              onRemove={() => handleRemove(tag)}
            />
          ))}
        </div>
      )}

      {canAddMore && (
        <div className="flex items-start gap-1">
          <Input
            className={cn('w-full', inputSize, error && 'border-destructive', disabled && 'bg-muted')}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                handleAddTag(inputValue)
              }
            }}
            disabled={disabled}
            placeholder={placeholder}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="shrink-0 px-3"
            onClick={() => handleAddTag(inputValue)}
            disabled={!inputValue.trim() || disabled}
            leftIcon={<Plus className="h-4 w-4" />}
          >
            Add
          </Button>
        </div>
      )}

      {canAddMore && (error || helperText) && (
        <p
          className={cn('text-sm', error ? 'text-destructive' : 'text-muted-foreground')}
        >
          {error || helperText}
        </p>
      )}

      {!canAddMore && (
        <p className="text-sm text-bloom-coral">
          Maximum {maxTags} tags reached. Remove some to add more.
        </p>
      )}

      {maxTags !== undefined && (
        <p className="text-xs text-muted-foreground">
          {value.length}/{maxTags} tags
        </p>
      )}
    </div>
  )
}

export default TagField
