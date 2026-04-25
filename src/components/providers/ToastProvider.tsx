import React, { useEffect } from 'react'
import { X } from 'lucide-react'
import { useAppSelector, useAppDispatch } from '../../store/hooks'
import { removeToast } from '../../store/slices/uiSlice'
import { cn } from '../../lib/utils'

type ToastItem = {
  id: string
  message: string
  severity: 'success' | 'error' | 'warning' | 'info'
  duration?: number
  action?: { label: string; onClick: () => void }
}

function ToastRow({ toast }: { toast: ToastItem }) {
  const dispatch = useAppDispatch()
  const duration = toast.duration ?? 6000

  useEffect(() => {
    if (duration <= 0) return undefined
    const t = window.setTimeout(() => dispatch(removeToast(toast.id)), duration)
    return () => window.clearTimeout(t)
  }, [duration, dispatch, toast.id])

  return (
    <div
      className={cn(
        'relative flex min-w-0 max-w-sm items-start gap-2 rounded-md border p-3 pr-9 text-sm font-medium shadow-lg',
        'animate-in slide-in-from-right-full',
        toast.severity === 'success' && 'border-emerald-700/40 bg-emerald-600 text-white',
        toast.severity === 'error' && 'border-destructive/30 bg-destructive text-destructive-foreground',
        toast.severity === 'warning' && 'border-amber-600/50 bg-amber-400 text-amber-950',
        toast.severity === 'info' && 'border-border bg-card text-foreground',
      )}
    >
      <p className="min-w-0 flex-1 leading-snug">{toast.message}</p>
      {toast.action && (
        <button
          type="button"
          className="shrink-0 text-xs font-semibold underline-offset-2 hover:underline"
          onClick={toast.action.onClick}
        >
          {toast.action.label}
        </button>
      )}
      <button
        type="button"
        onClick={() => dispatch(removeToast(toast.id))}
        className="absolute right-1.5 top-1.5 rounded p-0.5 opacity-80 transition-opacity hover:opacity-100"
        aria-label="Dismiss"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}

export function ToastProvider() {
  const toasts = useAppSelector((state) => state.ui.toasts) as ToastItem[]

  if (toasts.length === 0) {
    return null
  }

  return (
    <div
      className="pointer-events-none fixed right-3 top-16 z-[200] flex w-[min(100%,22rem)] flex-col gap-2 p-0 sm:right-4 sm:top-20"
      aria-live="polite"
    >
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <ToastRow toast={toast} />
        </div>
      ))}
    </div>
  )
}
