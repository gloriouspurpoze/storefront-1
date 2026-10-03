'use client'

import { Children, useCallback, useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { cx } from './cx'
import { IconButton } from './Button'
import { IconChevronLeft, IconChevronRight } from './icons'

/**
 * Scroll-snap carousel: native touch scrolling, arrow buttons on hover-capable
 * desktops, optional dots and autoplay (paused on hover/focus and when
 * reduced motion is requested). Item widths are set with CSS vars:
 * `--sf-carousel-item` (mobile), `-sm` (≥640) and `-lg` (≥1024).
 */
export function Carousel({
  children,
  label,
  dots,
  autoplayMs,
  className,
  style,
  itemWidth,
}: {
  children: ReactNode
  label: string
  dots?: boolean
  autoplayMs?: number
  className?: string
  style?: CSSProperties
  /** Shorthand: [mobile, ≥640, ≥1024] grid-auto-columns values. */
  itemWidth?: [string, string?, string?]
}) {
  const trackRef = useRef<HTMLDivElement | null>(null)
  const [index, setIndex] = useState(0)
  const [atStart, setAtStart] = useState(true)
  const [atEnd, setAtEnd] = useState(false)
  const [paused, setPaused] = useState(false)
  const count = Children.count(children)

  const update = useCallback(() => {
    const el = trackRef.current
    if (!el) return
    setAtStart(el.scrollLeft <= 4)
    setAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 4)
    const first = el.firstElementChild as HTMLElement | null
    const w = first ? first.getBoundingClientRect().width : el.clientWidth
    setIndex(Math.round(el.scrollLeft / Math.max(1, w)))
  }, [])

  useEffect(() => {
    const el = trackRef.current
    if (!el) return
    update()
    el.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)
    return () => {
      el.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
    }
  }, [update])

  const scrollToIndex = useCallback((i: number) => {
    const el = trackRef.current
    const child = el?.children[i] as HTMLElement | undefined
    if (el && child) el.scrollTo({ left: child.offsetLeft - el.offsetLeft, behavior: 'smooth' })
  }, [])

  const step = (dir: 1 | -1) => {
    const el = trackRef.current
    if (!el) return
    el.scrollBy({ left: dir * el.clientWidth * 0.9, behavior: 'smooth' })
  }

  useEffect(() => {
    if (!autoplayMs || paused || count < 2) return
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return
    const t = window.setInterval(() => {
      const el = trackRef.current
      if (!el) return
      const atLast = el.scrollLeft + el.clientWidth >= el.scrollWidth - 4
      if (atLast) el.scrollTo({ left: 0, behavior: 'smooth' })
      else step(1)
    }, autoplayMs)
    return () => window.clearInterval(t)
  }, [autoplayMs, paused, count])

  const vars: Record<string, string> = {}
  if (itemWidth) {
    vars['--sf-carousel-item'] = itemWidth[0]
    if (itemWidth[1]) vars['--sf-carousel-item-sm'] = itemWidth[1]
    if (itemWidth[2]) vars['--sf-carousel-item-lg'] = itemWidth[2]
  }

  return (
    <div
      className={cx('sf-carousel', className)}
      style={{ ...vars, ...style } as CSSProperties}
      role="region"
      aria-roledescription="carousel"
      aria-label={label}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div ref={trackRef} className="sf-carousel__track">
        {children}
      </div>
      {count > 1 && (
        <>
          <IconButton label="Previous" solid className="sf-carousel__nav sf-carousel__nav--prev" disabled={atStart} onClick={() => step(-1)}>
            <IconChevronLeft />
          </IconButton>
          <IconButton label="Next" solid className="sf-carousel__nav sf-carousel__nav--next" disabled={atEnd} onClick={() => step(1)}>
            <IconChevronRight />
          </IconButton>
        </>
      )}
      {dots && count > 1 && (
        <div className="sf-carousel__dots">
          {Array.from({ length: count }, (_, i) => (
            <button
              key={i}
              type="button"
              className="sf-carousel__dot"
              aria-label={`Go to slide ${i + 1}`}
              aria-current={i === index ? 'true' : undefined}
              onClick={() => scrollToIndex(i)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
