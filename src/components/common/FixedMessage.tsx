import React from 'react'
import { cn } from '../../lib/utils'

type Variant = 'default' | 'success' | 'error' | 'warning'

/**
 * DESIGN.md token map:
 *   default → hairline border + canvas surface
 *   success → storm tones (DESIGN.md neutral positive accent)
 *   error   → destructive/bloom-deep
 *   warning → bloom-rose surface + bloom-deep ink + bloom-coral border
 */
const shell: Record<Variant, string> = {
  default: 'border-hairline bg-canvas text-ink',
  success: 'border-storm-deep/30 bg-storm-mist/20 text-storm-deep',
  error: 'border-destructive/30 bg-destructive/10 text-destructive',
  warning: 'border-bloom-coral/40 bg-bloom-rose text-bloom-deep',
}

export interface FixedMessageProps {
  children: React.ReactNode
  /** Positioned above page chrome (z-50) */
  variant?: Variant
  className?: string
  maxWidthClassName?: 'max-w-sm' | 'max-w-md' | 'max-w-lg'
}

/**
 * Non-modal toast region fixed to bottom-right (e.g. snackbar / flash notice).
 * Pair with `open &&` in the parent.
 */
export function FixedMessage({
  children,
  variant = 'default',
  className,
  maxWidthClassName = 'max-w-sm',
}: FixedMessageProps) {
  return (
    <div
      className={cn(
        'fixed bottom-4 right-4 z-50 rounded-md border px-sm py-xs text-sm shadow-soft-lift',
        maxWidthClassName,
        shell[variant],
        className,
      )}
    >
      {children}
    </div>
  )
}
