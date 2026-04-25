import React, { useEffect, useMemo, useState } from 'react'
import { Search, CornerDownRight } from 'lucide-react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Input } from '../ui/input'
import { Badge } from '../ui/badge'
import { Dialog, DialogContent, DialogTitle } from '../ui/dialog'
import { QUICK_NAV_ITEMS, type QuickNavGroup } from '../../config/app-routes'
import { useCommandPalette } from '../../contexts/command-palette-context'
import { useMediaQuery } from '../../hooks/useMediaQuery'
import { cn } from '../../lib/utils'

const GROUP_ORDER: QuickNavGroup[] = [
  'Overview',
  'CRM',
  'Catalog',
  'E-commerce',
  'Bazaar',
  'Operations',
  'Content & marketing',
  'Users & communication',
  'System',
  'Provider',
  'Professional',
]

function normalize(s: string) {
  return s.toLowerCase().trim()
}

/** MUI `breakpoints.down('sm')` — default theme `sm` = 600px */
const downSm = '(max-width: 599px)'

export function CommandPalette() {
  const { open, setOpen } = useCommandPalette()
  const [query, setQuery] = useState('')
  const navigate = useNavigate()
  const location = useLocation()
  const fullScreen = useMediaQuery(downSm)
  const jumpHint =
    typeof navigator !== 'undefined' && /Mac|iPhone|iPad|iPod/.test(navigator.userAgent)
      ? '⌘K'
      : 'Ctrl+K'

  useEffect(() => {
    if (!open) setQuery('')
  }, [open])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setOpen(true)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [setOpen])

  const filtered = useMemo(() => {
    const q = normalize(query)
    if (!q) return QUICK_NAV_ITEMS
    return QUICK_NAV_ITEMS.filter((item) => {
      if (normalize(item.label).includes(q) || normalize(item.path).includes(q)) return true
      if (item.keywords && normalize(item.keywords).includes(q)) return true
      if (normalize(item.group).includes(q)) return true
      return false
    })
  }, [query])

  const grouped = useMemo(() => {
    const map = new Map<QuickNavGroup, typeof filtered>()
    for (const item of filtered) {
      const arr = map.get(item.group) || []
      arr.push(item)
      map.set(item.group, arr)
    }
    return GROUP_ORDER.filter((g) => map.get(g)?.length).map((g) => ({
      group: g,
      items: map.get(g)!,
    }))
  }, [filtered])

  const handleSelect = (path: string) => {
    if (path !== location.pathname) navigate(path)
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        aria-labelledby="command-palette-title"
        className={cn(
          'flex w-full max-w-lg flex-col gap-0 overflow-hidden p-0',
          'max-h-[min(70vh,420px)]',
          fullScreen
            ? 'h-[100dvh] max-h-[100dvh] max-w-full translate-x-0 translate-y-0 rounded-none border-0 left-0 top-0 sm:left-1/2 sm:top-1/2 sm:mt-8 sm:max-h-[min(70vh,420px)] sm:max-w-lg sm:translate-x-[-50%] sm:translate-y-[-50%] sm:rounded-lg sm:border sm:shadow-lg'
            : 'sm:mt-8'
        )}
      >
        <div className="shrink-0 space-y-2 px-4 pt-4 sm:px-6 sm:pt-6">
          <DialogTitle
            id="command-palette-title"
            className="text-left text-sm font-normal text-muted-foreground"
          >
            Quick navigation
          </DialogTitle>
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              strokeWidth={2}
              aria-hidden
            />
            <Input
              className="h-9 pl-9 pr-24"
              autoFocus
              placeholder="Jump to page…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Search pages"
            />
            <div className="absolute right-2 top-1/2 flex -translate-y-1/2">
              <Badge
                variant="outline"
                className="h-[22px] border px-1.5 py-0 text-[0.7rem] font-normal"
              >
                {jumpHint}
              </Badge>
            </div>
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-4 sm:px-4">
          {grouped.length === 0 ? (
            <p className="px-1 py-4 text-sm text-muted-foreground">No matching pages. Try a different search.</p>
          ) : (
            <ul className="m-0 list-none p-0">
              {grouped.map(({ group, items }) => (
                <li key={group}>
                  <div
                    className="px-2 py-1 text-xs font-bold uppercase leading-snug tracking-wider text-muted-foreground"
                    id={`group-${group}`}
                  >
                    {group}
                  </div>
                  <ul className="m-0 list-none p-0" aria-labelledby={`group-${group}`}>
                    {items.map((item) => {
                      const selected = location.pathname === item.path
                      return (
                        <li key={`${item.group}-${item.path}`}>
                          <button
                            type="button"
                            onClick={() => handleSelect(item.path)}
                            className={cn(
                              'mb-0.5 flex w-full min-w-0 items-start rounded-md px-2 py-2 text-left',
                              'hover:bg-accent hover:text-accent-foreground',
                              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                              selected && 'bg-muted'
                            )}
                          >
                            <CornerDownRight
                              className="mr-2 mt-0.5 h-4 w-4 shrink-0 text-muted-foreground/80"
                              strokeWidth={2}
                              aria-hidden
                            />
                            <span className="min-w-0">
                              <span className="block text-sm font-medium leading-snug">{item.label}</span>
                              <span className="block font-mono text-xs text-muted-foreground">{item.path}</span>
                            </span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </li>
              ))}
            </ul>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
