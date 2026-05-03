import React from 'react'
import { Inbox } from 'lucide-react'
import { Button } from '../ui/button'

type Props = {
  title: string
  description?: string
  actionLabel?: string
  onAction?: () => void
  /** Shown next to the primary action (e.g. generic “Log activity” beside “Log WhatsApp outcome”). */
  secondaryActionLabel?: string
  onSecondaryAction?: () => void
}

export function CrmEmptyState({
  title,
  description,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
}: Props) {
  return (
    <div className="flex min-h-[280px] flex-col items-center justify-center px-2 py-12 text-center">
      <Inbox className="mb-2 h-12 w-12 text-muted-foreground" aria-hidden />
      <h2 className="mb-2 text-lg font-semibold text-muted-foreground">{title}</h2>
      {description ? (
        <p className="mb-2 max-w-[420px] text-sm text-muted-foreground">{description}</p>
      ) : null}
      {actionLabel && onAction ? (
        <div className="flex flex-wrap items-center justify-center gap-2">
          <Button type="button" onClick={onAction}>
            {actionLabel}
          </Button>
          {secondaryActionLabel && onSecondaryAction ? (
            <Button type="button" variant="outline" onClick={onSecondaryAction}>
              {secondaryActionLabel}
            </Button>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
