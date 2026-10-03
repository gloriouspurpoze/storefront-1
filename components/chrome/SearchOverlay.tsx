'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, type FormEvent } from 'react'
import { Drawer, IconArrowRight, IconSearch } from '@/ui'
import './store-header.css'

export function SearchOverlay({
  open,
  onClose,
  suggestions,
  placeholder = 'Search products, categories…',
}: {
  open: boolean
  onClose: () => void
  /** Quick links shown under the field (e.g. categories). */
  suggestions?: { href: string; label: string }[]
  placeholder?: string
}) {
  const router = useRouter()
  const [q, setQ] = useState('')

  function submit(e: FormEvent) {
    e.preventDefault()
    const term = q.trim()
    if (!term) return
    onClose()
    router.push(`/search?q=${encodeURIComponent(term)}`)
  }

  return (
    <Drawer open={open} onClose={onClose} side="top" title="Search" className="sf-search-sheet">
      <form className="sf-search-form sf-container sf-container--narrow" role="search" onSubmit={submit}>
        <IconSearch className="sf-search-form__icon" />
        <input
          data-autofocus
          type="search"
          name="q"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={placeholder}
          aria-label="Search"
          className="sf-search-form__input"
          autoComplete="off"
        />
        <button type="submit" className="sf-search-form__go" aria-label="Search">
          <IconArrowRight />
        </button>
      </form>
      {suggestions && suggestions.length > 0 && (
        <div className="sf-container sf-container--narrow sf-search-suggest">
          <p className="sf-eyebrow">Popular</p>
          <div className="sf-search-suggest__chips">
            {suggestions.slice(0, 10).map((s) => (
              <Link key={s.href} href={s.href} className="sf-tab" onClick={onClose}>
                {s.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </Drawer>
  )
}
