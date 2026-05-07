import React from 'react'
import { cn } from '../../lib/utils'

interface PageHeaderProps {
  title: string
  subtitle?: string
  icon?: React.ReactElement
  action?: React.ReactNode
  children?: React.ReactNode
  /** Merged onto the root container (e.g. tighter margins for dense pages). */
  className?: string
}

export function PageHeader({ title, subtitle, icon, action, children, className }: PageHeaderProps) {
  return (
    <div
      className={cn(
        'mb-6 flex flex-col gap-2 sm:mb-8 md:mb-10',
        'items-start sm:flex-row sm:items-center sm:justify-between',
        className,
      )}
    >
      <div className="flex min-w-0 items-start gap-1.5">
        {icon && (
          <div className="flex shrink-0 pt-0.5 text-primary">
            {icon}
          </div>
        )}
        <div className="min-w-0">
          <h1
            className={cn(
              'font-semibold tracking-tight text-foreground',
              'text-xl sm:text-[1.375rem] md:text-2xl',
              subtitle && 'mb-0.5',
              'leading-tight'
            )}
          >
            {title}
          </h1>
          {subtitle && (
            <p
              className={cn(
                'max-w-[min(52rem,100%)] text-sm text-muted-foreground',
                'text-[0.8125rem] sm:text-sm'
              )}
            >
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {action && <div className="flex w-full items-center gap-1 sm:w-auto">{action}</div>}

      {children}
    </div>
  )
}
