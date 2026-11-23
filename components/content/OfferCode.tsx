'use client'

import { useState } from 'react'
import './offer-code.css'

/** Tap-to-copy coupon code chip for popups and offer strips. */
export function OfferCode({ code, className }: { code: string; className?: string }) {
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard blocked (insecure context / permissions): the code stays visible to copy by hand.
    }
  }

  return (
    <button
      type="button"
      className={`sf-offer-code${className ? ` ${className}` : ''}`}
      onClick={() => void copy()}
      aria-label={`Copy coupon code ${code}`}
    >
      <span className="sf-offer-code-value">{code}</span>
      <span className="sf-offer-code-hint" aria-live="polite">
        {copied ? 'Copied!' : 'Tap to copy'}
      </span>
    </button>
  )
}
