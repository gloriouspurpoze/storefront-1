'use client'

import { useCallback, useEffect, useRef } from 'react'
import type { PublicMenuCategory } from '@/lib/storefront-api'

export type MenuCategoryFilter = 'all' | string

export function MenuFastCardsCategoryNav({
  categories,
  activeId,
  onChange,
}: {
  categories: PublicMenuCategory[]
  activeId: MenuCategoryFilter
  onChange: (id: MenuCategoryFilter) => void
}) {
  const listRef = useRef<HTMLDivElement>(null)

  const showAllPill = categories.length > 1

  useEffect(() => {
    if (activeId === 'all') return
    if (!categories.some((c) => c.id === activeId)) {
      onChange('all')
    }
  }, [activeId, categories, onChange])

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
      const pills = listRef.current?.querySelectorAll<HTMLButtonElement>('[role="tab"]')
      if (!pills?.length) return

      let next = index
      if (e.key === 'ArrowRight') next = (index + 1) % pills.length
      else if (e.key === 'ArrowLeft') next = (index - 1 + pills.length) % pills.length
      else if (e.key === 'Home') next = 0
      else if (e.key === 'End') next = pills.length - 1
      else return

      e.preventDefault()
      pills[next]?.focus()
      pills[next]?.click()
    },
    [],
  )

  if (categories.length < 2) {
    return null
  }

  const tabs: Array<{ id: MenuCategoryFilter; label: string }> = [
    ...(showAllPill ? [{ id: 'all' as const, label: 'All' }] : []),
    ...categories.map((c) => ({ id: c.id, label: c.name })),
  ]

  return (
    <div className="mf-cards-cats-wrap">
      <nav className="mf-cards-cats-nav" aria-label="Menu categories">
        <div ref={listRef} className="mf-cards-cats" role="tablist">
          {tabs.map((tab, index) => {
            const selected = activeId === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                id={`mf-cat-tab-${tab.id}`}
                aria-selected={selected}
                aria-controls="mf-menu-panel"
                tabIndex={selected ? 0 : -1}
                className={`mf-cat-pill${selected ? ' active' : ''}`}
                title={tab.label}
                onClick={() => onChange(tab.id)}
                onKeyDown={(e) => onKeyDown(e, index)}
              >
                <span className="mf-cat-pill-label">{tab.label}</span>
              </button>
            )
          })}
        </div>
      </nav>
    </div>
  )
}

/** Keeps filter valid when API categories change between renders. */
export function normalizeCategoryFilter(
  categories: PublicMenuCategory[],
  activeId: MenuCategoryFilter,
): MenuCategoryFilter {
  if (activeId === 'all') return 'all'
  return categories.some((c) => c.id === activeId) ? activeId : 'all'
}
