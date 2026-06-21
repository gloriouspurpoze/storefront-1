import React from 'react'
import { cn } from '../../lib/utils'

type Props = {
  title: string
  hint?: string
  id?: string
  actions?: React.ReactNode
  children: React.ReactNode
  className?: string
}

/** Compact section block — less chrome than full Card for content editors. */
export function CategoryMarketingWriterSection({ title, hint, id, actions, children, className }: Props) {
  return (
    <section
      id={id}
      className={cn('scroll-mt-28 rounded-lg border border-border/70 bg-card/50', className)}
    >
      <div className="flex items-start justify-between gap-2 border-b border-border/50 px-3 py-2 sm:px-4">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-foreground">{title}</h3>
          {hint ? <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">{hint}</p> : null}
        </div>
        {actions ? <div className="shrink-0">{actions}</div> : null}
      </div>
      <div className="space-y-3 px-3 py-3 sm:space-y-4 sm:px-4 sm:py-4">{children}</div>
    </section>
  )
}

/** Inline label row for repeatable list fields inside a section. */
export function WriterListLabel({ children, actions }: { children: React.ReactNode; actions?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
      <p className="text-xs font-medium text-muted-foreground">{children}</p>
      {actions}
    </div>
  )
}
