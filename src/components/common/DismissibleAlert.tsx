import React from 'react'
import { Button } from '../ui/button'
import { cn } from '../../lib/utils'

type Variant = 'success' | 'error'

/**
 * DESIGN.md token map:
 *   success → storm-mist surface + storm-deep ink + storm-deep border
 *   error   → destructive surface + destructive ink
 */
const shell: Record<Variant, string> = {
  success: 'border-storm-deep/30 bg-storm-mist/30 text-storm-deep',
  error: 'border-destructive/40 bg-destructive/10 text-destructive',
}

export interface DismissibleAlertProps {
  variant: Variant
  message: string
  onDismiss: () => void
  dismissLabel?: string
  className?: string
  role?: 'status' | 'alert'
}

/**
 * Inline full-width message bar with a dismiss action (e.g. page-level success/error after actions).
 */
export function DismissibleAlert({
  variant,
  message,
  onDismiss,
  dismissLabel = 'Dismiss',
  className,
  role,
}: DismissibleAlertProps) {
  return (
    <div
      role={role ?? (variant === 'error' ? 'alert' : 'status')}
      className={cn(
        'mb-md flex items-center justify-between gap-2 rounded-md border px-sm py-xs text-sm',
        shell[variant],
        className,
      )}
    >
      {message}
      <Button type="button" variant="ghost" size="sm" className="h-7" onClick={onDismiss}>
        {dismissLabel}
      </Button>
    </div>
  )
}
