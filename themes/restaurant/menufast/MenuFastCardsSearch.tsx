'use client'

import { useEffect, useRef } from 'react'

function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  )
}

/** Icon button in the sticky toolbar — expands search row below. */
export function MenuFastCardsSearchToggle({
  expanded,
  onExpandedChange,
  hasQuery,
}: {
  expanded: boolean
  onExpandedChange: (expanded: boolean) => void
  hasQuery?: boolean
}) {
  return (
    <button
      type="button"
      className={`mf-search-toggle${expanded || hasQuery ? ' mf-search-toggle--active' : ''}`}
      aria-label="Search menu"
      aria-expanded={expanded}
      aria-controls="mf-menu-search-panel"
      onClick={() => onExpandedChange(!expanded)}
    >
      <SearchIcon />
    </button>
  )
}

/** Full-width search input in sticky zone (shown when expanded). */
export function MenuFastCardsSearchRow({
  expanded,
  value,
  onChange,
  onExpandedChange,
}: {
  expanded: boolean
  value: string
  onChange: (value: string) => void
  onExpandedChange: (expanded: boolean) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (expanded) inputRef.current?.focus()
  }, [expanded])

  if (!expanded) return null

  const closeSearch = () => {
    onChange('')
    onExpandedChange(false)
  }

  return (
    <div className="mf-cards-search-row" role="search">
      <label className="mf-cards-search-label" htmlFor="mf-menu-search-panel">
        Search menu
      </label>
      <div className="mf-cards-search mf-cards-search--expanded">
        <SearchIcon />
        <input
          ref={inputRef}
          id="mf-menu-search-panel"
          type="search"
          className="mf-cards-search-input"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Search dishes…"
          autoComplete="off"
        />
        <button type="button" className="mf-search-close" aria-label="Close search" onClick={closeSearch}>
          ×
        </button>
      </div>
    </div>
  )
}
