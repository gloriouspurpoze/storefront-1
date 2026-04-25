import React from 'react'
import { Button } from '../ui/button'
import { cn } from '../../lib/utils'

type Props = {
  loading: boolean
  error: string | null
  onRetry: () => void
  isEmpty: boolean
  empty: React.ReactNode
  skeleton: React.ReactNode
  children: React.ReactNode
}

export function CrmListShell({ loading, error, onRetry, isEmpty, empty, skeleton, children }: Props) {
  if (loading) return <>{skeleton}</>
  if (error) {
    return (
      <div
        role="alert"
        className={cn(
          'flex flex-wrap items-center justify-between gap-3 rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive'
        )}
      >
        <span className="min-w-0 flex-1">{error}</span>
        <Button type="button" variant="outline" size="sm" onClick={onRetry} className="shrink-0 border-destructive/50 text-destructive hover:bg-destructive/10">
          Retry
        </Button>
      </div>
    )
  }
  if (isEmpty) return <div>{empty}</div>
  return <>{children}</>
}
