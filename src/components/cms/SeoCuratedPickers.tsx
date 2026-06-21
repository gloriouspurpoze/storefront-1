import React, { useMemo } from 'react'
import { X } from 'lucide-react'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { Label } from '../ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select'
import { cn } from '../../lib/utils'

export type CuratedOption = { value: string; label: string; hint?: string }

export interface SeoCuratedMultiSelectProps {
  label: string
  description?: string
  value: string[]
  onChange: (next: string[]) => void
  options: CuratedOption[]
  disabled?: boolean
  loading?: boolean
  placeholder?: string
  maxItems?: number
  emptyHint?: string
}

export function SeoCuratedMultiSelect({
  label,
  description,
  value,
  onChange,
  options,
  disabled,
  loading,
  placeholder = 'Add from list…',
  maxItems = 12,
  emptyHint,
}: SeoCuratedMultiSelectProps) {
  const labelByValue = useMemo(() => new Map(options.map((o) => [o.value, o.label])), [options])
  const available = options.filter((o) => !value.includes(o.value))
  const unknown = value.filter((v) => !labelByValue.has(v))

  const add = (slug: string) => {
    if (!slug || value.includes(slug) || value.length >= maxItems) return
    onChange([...value, slug])
  }

  const remove = (slug: string) => onChange(value.filter((v) => v !== slug))

  return (
    <div className="space-y-2">
      <div>
        <Label>{label}</Label>
        {description ? <p className="text-xs text-muted-foreground mt-0.5">{description}</p> : null}
      </div>
      <Select
        onValueChange={add}
        disabled={disabled || loading || available.length === 0 || value.length >= maxItems}
      >
        <SelectTrigger>
          <SelectValue placeholder={loading ? 'Loading…' : placeholder} />
        </SelectTrigger>
        <SelectContent>
          {available.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              <span>{opt.label}</span>
              {opt.hint ? <span className="ml-2 font-mono text-xs text-muted-foreground">{opt.hint}</span> : null}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {value.length > 0 || unknown.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {value.map((slug) => {
            const known = labelByValue.has(slug)
            return (
              <Badge
                key={slug}
                variant={known ? 'secondary' : 'warning'}
                className="gap-1 pr-1 font-normal"
                title={known ? slug : 'Not in catalog — pick a replacement'}
              >
                <span>{labelByValue.get(slug) ?? slug}</span>
                {!disabled ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5 shrink-0"
                    onClick={() => remove(slug)}
                    aria-label={`Remove ${slug}`}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                ) : null}
              </Badge>
            )
          })}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">{emptyHint ?? 'Nothing selected yet.'}</p>
      )}
      {unknown.length > 0 ? (
        <p className="text-xs text-amber-600 dark:text-amber-400">
          {unknown.length} value(s) not in the catalog — remove and re-add from the dropdown.
        </p>
      ) : null}
    </div>
  )
}

export interface SeoCuratedSingleSelectProps {
  label: string
  description?: string
  value: string
  onChange: (value: string) => void
  options: CuratedOption[]
  disabled?: boolean
  loading?: boolean
  placeholder?: string
  allowEmpty?: boolean
  emptyLabel?: string
  invalidHint?: string
}

export function SeoCuratedSingleSelect({
  label,
  description,
  value,
  onChange,
  options,
  disabled,
  loading,
  placeholder = 'Select…',
  allowEmpty,
  emptyLabel = '— None —',
  invalidHint,
}: SeoCuratedSingleSelectProps) {
  const known = !value || options.some((o) => o.value === value)
  const selectValue = value && options.some((o) => o.value === value) ? value : allowEmpty ? '__none__' : undefined

  return (
    <div className="space-y-2">
      <div>
        <Label>{label}</Label>
        {description ? <p className="text-xs text-muted-foreground mt-0.5">{description}</p> : null}
      </div>
      <Select
        value={selectValue}
        onValueChange={(v) => onChange(v === '__none__' ? '' : v)}
        disabled={disabled || loading}
      >
        <SelectTrigger className={cn(!known && value && 'border-amber-500/50')}>
          <SelectValue placeholder={loading ? 'Loading…' : placeholder} />
        </SelectTrigger>
        <SelectContent>
          {allowEmpty ? <SelectItem value="__none__">{emptyLabel}</SelectItem> : null}
          {options.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
              {opt.hint ? (
                <span className="ml-2 font-mono text-xs text-muted-foreground">{opt.hint}</span>
              ) : null}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {!known && value ? (
        <p className="text-xs text-amber-600 dark:text-amber-400">
          {invalidHint ?? `Current value “${value}” is not in the catalog — pick a valid option.`}
        </p>
      ) : null}
    </div>
  )
}
