import React from 'react'
import { Card, CardContent } from '../ui/card'
import { cn } from '../../lib/utils'

function RoundedBar({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-md bg-muted', className)} />
}

export function CrmDataGridSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <Card>
      <CardContent className="p-2">
        <div className="flex flex-col gap-1">
          <RoundedBar className="h-10 w-full" />
          {Array.from({ length: rows }).map((_, i) => (
            <RoundedBar key={i} className="h-9 w-full" />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

export function CrmPipelineSkeleton({ columns = 6 }: { columns?: number }) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {Array.from({ length: columns }).map((_, i) => (
        <div key={i} className="min-w-[260px] flex-none">
          <RoundedBar className="h-[420px] w-full rounded-sm" />
        </div>
      ))}
    </div>
  )
}
