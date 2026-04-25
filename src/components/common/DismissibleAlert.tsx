import React from 'react'
import { Button } from '../ui/button'
import { cn } from '../../lib/utils'

type Variant = 'success' | 'error'

const shell: Record<Variant, string> = {
  success:
    'border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200',
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
        'mb-4 flex items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm',
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
