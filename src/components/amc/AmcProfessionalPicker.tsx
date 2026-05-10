import React, { useCallback, useEffect, useState } from 'react'
import { Loader2, X } from 'lucide-react'
import { ProfessionalsService } from '../../services/api/professionals.service'
import type { Professional } from '../../types/professional.types'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { cn } from '../../lib/utils'

function professionalLabel(p: Professional): string {
  const name =
    p.displayName?.trim() ||
    [p.firstName, p.lastName].filter(Boolean).join(' ').trim() ||
    'Professional'
  const phone = p.phoneNumber?.trim()
  return phone ? `${name} · ${phone}` : name
}

export interface AmcProfessionalPickerProps {
  id?: string
  value?: string
  onChange: (nextId: string | undefined) => void
  disabled?: boolean
  label?: string
}

export function AmcProfessionalPicker({
  id,
  value,
  onChange,
  disabled,
  label = 'Professional',
}: AmcProfessionalPickerProps) {
  const [search, setSearch] = useState('')
  const [debounced, setDebounced] = useState('')
  const [loading, setLoading] = useState(false)
  const [rows, setRows] = useState<Professional[]>([])
  const [selectedLabel, setSelectedLabel] = useState<string | null>(null)

  useEffect(() => {
    const t = window.setTimeout(() => setDebounced(search.trim()), 320)
    return () => window.clearTimeout(t)
  }, [search])

  useEffect(() => {
    if (!value || !/^[a-f\d]{24}$/i.test(value)) {
      setSelectedLabel(null)
      return
    }
    let cancelled = false
    void (async () => {
      try {
        const res = await ProfessionalsService.getProfessional(value)
        if (cancelled || res?.data == null) return
        const top = res.data as unknown
        const rawObj = top && typeof top === 'object' ? (top as Record<string, unknown>) : null
        const inner =
          rawObj && 'professional' in rawObj && rawObj.professional && typeof rawObj.professional === 'object'
            ? (rawObj.professional as Professional)
            : (top as Professional)
        if (inner && typeof inner._id === 'string') {
          setSelectedLabel(professionalLabel(inner))
        } else {
          setSelectedLabel(null)
        }
      } catch {
        if (!cancelled) setSelectedLabel(null)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [value])

  const loadList = useCallback(async () => {
    setLoading(true)
    try {
      const res = await ProfessionalsService.getProfessionals({
        page: 1,
        limit: 25,
        ...(debounced.length >= 2 ? { search: debounced } : {}),
        isActive: true,
      })
      const list = res.data?.professionals ?? []
      setRows(list)
    } catch {
      setRows([])
    } finally {
      setLoading(false)
    }
  }, [debounced])

  useEffect(() => {
    void loadList()
  }, [loadList])

  return (
    <div className="grid gap-2" id={id}>
      <div className="flex flex-wrap items-end gap-2">
        <div className="min-w-[200px] flex-1 grid gap-1">
          <Label>{label}</Label>
          <Input
            placeholder="Search name, email…"
            value={search}
            disabled={disabled}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        {value ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={disabled}
            className="shrink-0"
            onClick={() => onChange(undefined)}
          >
            <X className="mr-1 h-4 w-4" />
            Clear
          </Button>
        ) : null}
      </div>
      {value ? (
        <p className="text-xs text-muted-foreground">
          Selected:{' '}
          <span className="font-medium text-foreground">{selectedLabel || value}</span>
        </p>
      ) : null}
      {!disabled ? (
        <div
          className={cn(
            'max-h-44 overflow-auto rounded-md border bg-popover text-popover-foreground shadow-sm',
            rows.length === 0 && !loading ? 'p-3 text-xs text-muted-foreground' : ''
          )}
        >
          {loading ? (
            <div className="flex items-center gap-2 p-3 text-xs text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Searching…
            </div>
          ) : rows.length === 0 ? (
            <p>{debounced.length >= 2 ? 'No matches.' : 'Type at least 2 characters to search.'}</p>
          ) : (
            <ul className="divide-y">
              {rows.map((p) => (
                <li key={p._id}>
                  <button
                    type="button"
                    className="w-full px-3 py-2 text-left text-sm hover:bg-accent"
                    onClick={() => {
                      onChange(p._id)
                      setSearch('')
                    }}
                  >
                    {professionalLabel(p)}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  )
}
