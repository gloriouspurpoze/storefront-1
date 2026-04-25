import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { getBreadcrumbItems } from '../../config/app-routes'
import { cn } from '../../lib/utils'

export function AppBreadcrumbs() {
  const location = useLocation()
  const items = getBreadcrumbItems(location.pathname)

  if (items.length === 0) return null

  return (
    <nav aria-label="breadcrumb" className="mb-1">
      <ol
        className={cn(
          'flex flex-wrap items-center gap-1 text-sm',
          'text-muted-foreground'
        )}
      >
        {items.map((crumb, index) => {
          const isLast = index === items.length - 1
          if (isLast) {
            return (
              <li key={crumb.to} className="font-semibold text-foreground">
                {crumb.label}
              </li>
            )
          }
          return (
            <li key={crumb.to} className="inline-flex min-w-0 max-w-full items-center gap-1">
              <Link
                to={crumb.to}
                className="min-w-0 max-w-full truncate font-medium text-muted-foreground hover:text-foreground hover:underline"
              >
                {crumb.label}
              </Link>
              <ChevronRight
                className="h-4 w-4 shrink-0 text-muted-foreground/70"
                aria-hidden
                strokeWidth={1.5}
              />
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
