'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { PhoneIcon } from './icons'
import './trade-pro.css'

/**
 * Mobile-only sticky conversion bar (DESIGN §4.2).
 * Shows after the header sentinel leaves the viewport; hidden while the mobile
 * nav drawer is open and on `sm+` where the header already has a primary CTA.
 */
export function TradeProMobileStickyCta({
  phone,
  menuOpen = false,
}: {
  phone?: string
  /** When the hamburger drawer is open, hide to avoid stacked CTAs. */
  menuOpen?: boolean
}) {
  const [pastSentinel, setPastSentinel] = useState(false)

  useEffect(() => {
    const sentinel = document.querySelector('[data-tp-mobile-cta-sentinel]')
    if (!sentinel) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        setPastSentinel(!entry.isIntersecting)
      },
      { threshold: 0, rootMargin: '0px' },
    )
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [])

  const visible = pastSentinel && !menuOpen

  useEffect(() => {
    const root = document.querySelector('.theme-trade-pro')
    if (!root) return
    root.classList.toggle('tp-has-mobile-cta', visible)
    return () => {
      root.classList.remove('tp-has-mobile-cta')
    }
  }, [visible])

  return (
    <div
      className={`tp-mobile-cta sm:hidden ${visible ? 'tp-mobile-cta--visible' : ''}`}
      role="region"
      aria-label="Quick actions"
      aria-hidden={!visible}
    >
      <div className="tp-mobile-cta__inner">
        {phone ? (
          <a
            href={`tel:${phone}`}
            className="tp-mobile-cta__call"
            aria-label={`Call ${phone}`}
            tabIndex={visible ? undefined : -1}
          >
            <PhoneIcon className="h-4 w-4 shrink-0" />
            Call now
          </a>
        ) : null}
        <Link
          href="/book"
          className={`tp-btn-primary tp-mobile-cta__quote ${phone ? '' : 'tp-mobile-cta__quote--solo'}`}
          tabIndex={visible ? undefined : -1}
        >
          Get a quote
        </Link>
      </div>
    </div>
  )
}
