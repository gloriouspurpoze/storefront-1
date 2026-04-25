import React from 'react'
import { cn } from '../../lib/utils'

interface FixerLogoMarkProps {
  size?: number
  className?: string
}

/** Compact wordmark + mark for sidebar and auth — SVG scales cleanly at any density */
export function FixerLogoMark({ size = 44, className }: FixerLogoMarkProps) {
  return (
    <svg
      viewBox="0 0 44 44"
      role="img"
      aria-label="Fixer"
      width={size}
      height={size}
      className={cn('shrink-0 rounded-md', className)}
    >
      <defs>
        <linearGradient id="fixerLogoFill" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#3b82f6" />
          <stop offset="100%" stopColor="#2563eb" />
        </linearGradient>
      </defs>
      <rect width="44" height="44" rx="10" fill="url(#fixerLogoFill)" />
      <path fill="#fff" d="M14 12h14.5v3.25H17.75v4.1h9v3.25h-9V32H14V12z" />
    </svg>
  )
}
