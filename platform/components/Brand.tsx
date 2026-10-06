import { PLATFORM_BRAND } from '../config'

export function BrandMark({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" width={28} height={28} className={className} aria-hidden>
      <path d="M4 24 L14 8 L18 8 L8 24 Z" fill="currentColor" />
      <path d="M16 24 L26 8 L30 8 L20 24 Z" fill="currentColor" opacity={0.55} />
    </svg>
  )
}

export function BrandLink() {
  return (
    <a href="/" className="inline-flex items-center gap-2 text-lg font-semibold tracking-tight text-tq-ink">
      <BrandMark className="text-tq-primary" />
      {PLATFORM_BRAND}
    </a>
  )
}
