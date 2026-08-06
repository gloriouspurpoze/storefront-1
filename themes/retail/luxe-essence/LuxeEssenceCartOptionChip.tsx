'use client'

/** Refined options cue for Luxe cart lines (icon + label; not color-only). */
export function LuxeEssenceCartOptionChip({ label }: { label: string }) {
  return (
    <span className="le-cart-option" aria-label={`Option: ${label}`}>
      <svg
        className="le-cart-option__icon"
        width="12"
        height="12"
        viewBox="0 0 12 12"
        fill="none"
        aria-hidden
      >
        <rect x="1.25" y="1.25" width="4" height="4" rx="0.75" stroke="currentColor" strokeWidth="1.25" />
        <rect x="6.75" y="1.25" width="4" height="4" rx="0.75" stroke="currentColor" strokeWidth="1.25" />
        <rect x="1.25" y="6.75" width="4" height="4" rx="0.75" stroke="currentColor" strokeWidth="1.25" />
        <rect x="6.75" y="6.75" width="4" height="4" rx="0.75" stroke="currentColor" strokeWidth="1.25" />
      </svg>
      <span className="le-cart-option__label">{label}</span>
    </span>
  )
}
