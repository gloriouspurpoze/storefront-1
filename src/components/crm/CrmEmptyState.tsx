import React from 'react'
import { Inbox } from 'lucide-react'
import { Button } from '../ui/button'

type Props = {
  title: string
  description?: string
  actionLabel?: string
  onAction?: () => void
}

export function CrmEmptyState({ title, description, actionLabel, onAction }: Props) {
  return (
    <div className="flex min-h-[280px] flex-col items-center justify-center px-2 py-12 text-center">
      <Inbox className="mb-2 h-12 w-12 text-muted-foreground" aria-hidden />
      <h2 className="mb-2 text-lg font-semibold text-muted-foreground">{title}</h2>
      {description ? (
        <p className="mb-2 max-w-[420px] text-sm text-muted-foreground">{description}</p>
      ) : null}
      {actionLabel && onAction ? (
        <Button type="button" onClick={onAction}>
          {actionLabel}
        </Button>
      ) : null}
    </div>
  )
}
