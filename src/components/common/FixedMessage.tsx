import React from 'react'
import { cn } from '../../lib/utils'

type Variant = 'default' | 'success' | 'error' | 'warning'

const shell: Record<Variant, string> = {
  default: 'border-border bg-card',
  success: 'border-border bg-card text-foreground',
  error: 'border-destructive/30 bg-destructive/10 text-destructive',
  warning:
    'border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-950/90 dark:text-amber-100',
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
        'fixed bottom-4 right-4 z-50 rounded-md border px-3 py-2 text-sm shadow-md',
        maxWidthClassName,
        shell[variant],
        className,
      )}
    >
      {children}
    </div>
  )
}
