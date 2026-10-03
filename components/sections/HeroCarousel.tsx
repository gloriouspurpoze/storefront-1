'use client'

import Link from 'next/link'
import { useCallback, useEffect, useRef, useState } from 'react'
import { IconChevronLeft, IconChevronRight, cx } from '@/ui'
import './sections.css'

export type HeroSlide = {
  id: string
  eyebrow?: string
  title: string
  subtitle?: string
  imageUrl?: string
  mobileImageUrl?: string
  videoUrl?: string
  ctaLabel?: string
  ctaHref?: string
  secondaryLabel?: string
  secondaryHref?: string
  align?: 'left' | 'center'
}

/**
 * Full-bleed hero with crossfading slides, autoplay (paused on hover/focus,
 * off for reduced motion), arrows + progress dots. A single slide renders as
 * a static hero. Slides without imagery get a brand-tinted gradient.
 */
export function HeroCarousel({ slides, intervalMs = 6000 }: { slides: HeroSlide[]; intervalMs?: number }) {
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const count = slides.length
  const regionRef = useRef<HTMLElement | null>(null)

  const go = useCallback((i: number) => setIndex(((i % count) + count) % count), [count])

  useEffect(() => {
    if (count < 2 || paused) return
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return
    const t = window.setTimeout(() => go(index + 1), intervalMs)
    return () => window.clearTimeout(t)
  }, [index, paused, count, intervalMs, go])

  // Basic swipe support.
  const touchX = useRef<number | null>(null)

  if (!count) return null

  return (
    <section
      ref={regionRef}
      className="sf-hero"
      aria-roledescription="carousel"
      aria-label="Featured"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
      onTouchStart={(e) => (touchX.current = e.touches[0]?.clientX ?? null)}
      onTouchEnd={(e) => {
        if (touchX.current == null) return
        const dx = (e.changedTouches[0]?.clientX ?? touchX.current) - touchX.current
        if (Math.abs(dx) > 40) go(index + (dx < 0 ? 1 : -1))
        touchX.current = null
      }}
    >
      {slides.map((s, i) => {
        const active = i === index
        const hasMedia = Boolean(s.imageUrl || s.videoUrl)
        return (
          <div
            key={s.id}
            className={cx('sf-hero__slide', active && 'is-active', !hasMedia && 'sf-hero__slide--plain', s.align === 'center' && 'sf-hero__slide--center')}
            aria-hidden={!active}
            role="group"
            aria-roledescription="slide"
            aria-label={`${i + 1} of ${count}`}
          >
            {s.videoUrl ? (
              <video className="sf-hero__media" src={s.videoUrl} poster={s.imageUrl} autoPlay muted loop playsInline aria-hidden />
            ) : s.imageUrl ? (
              <picture>
                {s.mobileImageUrl && <source media="(max-width: 767px)" srcSet={s.mobileImageUrl} />}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img className="sf-hero__media" src={s.imageUrl} alt="" loading={i === 0 ? 'eager' : 'lazy'} fetchPriority={i === 0 ? 'high' : undefined} />
              </picture>
            ) : null}
            <div className="sf-hero__content sf-container">
              <div className="sf-hero__copy">
                {s.eyebrow && <p className="sf-hero__eyebrow">{s.eyebrow}</p>}
                {i === 0 ? <h1 className="sf-hero__title">{s.title}</h1> : <h2 className="sf-hero__title">{s.title}</h2>}
                {s.subtitle && <p className="sf-hero__subtitle">{s.subtitle}</p>}
                {(s.ctaHref || s.secondaryHref) && (
                  <div className="sf-hero__actions">
                    {s.ctaHref && (
                      <Link href={s.ctaHref} className="sf-btn sf-btn--lg sf-btn--inverse" tabIndex={active ? 0 : -1}>
                        {s.ctaLabel || 'Shop now'}
                      </Link>
                    )}
                    {s.secondaryHref && (
                      <Link href={s.secondaryHref} className="sf-btn sf-btn--lg sf-hero__ghost" tabIndex={active ? 0 : -1}>
                        {s.secondaryLabel || 'Learn more'}
                      </Link>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      })}
      {count > 1 && (
        <div className="sf-hero__controls sf-container">
          <div className="sf-hero__dots">
            {slides.map((s, i) => (
              <button
                key={s.id}
                type="button"
                className="sf-hero__dot"
                aria-label={`Go to slide ${i + 1}`}
                aria-current={i === index ? 'true' : undefined}
                onClick={() => go(i)}
              >
                <span style={i === index && !paused ? { animationDuration: `${intervalMs}ms` } : undefined} />
              </button>
            ))}
          </div>
          <div className="sf-hero__arrows">
            <button type="button" className="sf-hero__arrow" aria-label="Previous slide" onClick={() => go(index - 1)}>
              <IconChevronLeft />
            </button>
            <button type="button" className="sf-hero__arrow" aria-label="Next slide" onClick={() => go(index + 1)}>
              <IconChevronRight />
            </button>
          </div>
        </div>
      )}
    </section>
  )
}
