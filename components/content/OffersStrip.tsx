'use client'

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'

export type OffersStripProps<T> = {
  items: T[]
  className?: string
  trackClassName?: string
  slideClassName?: string
  dotsClassName?: string
  dotClassName?: string
  dotActiveClassName?: string
  ariaLabel?: string
  autoAdvanceMs?: number
  getItemKey?: (item: T, index: number) => string | number
  renderItem: (item: T, index: number) => ReactNode
}

/** Horizontal offer carousel shell — theme provides slide markup via `renderItem`. */
export function OffersStrip<T>({
  items,
  className,
  trackClassName,
  slideClassName,
  dotsClassName,
  dotClassName,
  dotActiveClassName,
  ariaLabel = 'Offers and promotions',
  autoAdvanceMs = 6000,
  getItemKey,
  renderItem,
}: OffersStripProps<T>) {
  const trackRef = useRef<HTMLDivElement>(null)
  const [activeIndex, setActiveIndex] = useState(0)

  const scrollToIndex = useCallback((index: number) => {
    const track = trackRef.current
    if (!track) return
    const slide = track.children.item(index) as HTMLElement | null
    slide?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
    setActiveIndex(index)
  }, [])

  useEffect(() => {
    if (items.length <= 1 || autoAdvanceMs <= 0) return
    const id = window.setInterval(() => {
      setActiveIndex((prev) => {
        const next = (prev + 1) % items.length
        scrollToIndex(next)
        return next
      })
    }, autoAdvanceMs)
    return () => window.clearInterval(id)
  }, [autoAdvanceMs, items.length, scrollToIndex])

  const onScroll = useCallback(() => {
    const track = trackRef.current
    if (!track || items.length <= 1) return
    const { scrollLeft, clientWidth } = track
    const index = Math.round(scrollLeft / Math.max(clientWidth, 1))
    setActiveIndex(Math.min(Math.max(index, 0), items.length - 1))
  }, [items.length])

  if (!items.length) return null

  return (
    <section className={className} aria-label={ariaLabel}>
      <div ref={trackRef} className={trackClassName} onScroll={onScroll}>
        {items.map((item, index) => (
          <div key={getItemKey ? getItemKey(item, index) : index} className={slideClassName}>
            {renderItem(item, index)}
          </div>
        ))}
      </div>
      {items.length > 1 ? (
        <div className={dotsClassName} role="tablist" aria-label="Offer slides">
          {items.map((_, index) => (
            <button
              key={index}
              type="button"
              role="tab"
              aria-selected={index === activeIndex}
              aria-label={`Offer ${index + 1} of ${items.length}`}
              className={`${dotClassName ?? ''}${index === activeIndex ? ` ${dotActiveClassName ?? ''}` : ''}`}
              onClick={() => scrollToIndex(index)}
            />
          ))}
        </div>
      ) : null}
    </section>
  )
}
