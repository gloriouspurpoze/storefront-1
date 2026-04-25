import React from 'react'
import { Search } from 'lucide-react'
import { Input } from '../ui/input'
import { cn } from '../../lib/utils'

type Props = {
  searchPlaceholder?: string
  qInput: string
  onQChange: (value: string) => void
  children?: React.ReactNode
  className?: string
}

export function CrmListToolbar({
  searchPlaceholder = 'Search…',
  qInput,
  onQChange,
  children,
  className,
}: Props) {
  return (
    <div
      className={cn(
        'mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3',
        className,
      )}
    >
      <div className="relative w-full min-w-0 sm:max-w-xs sm:flex-[0_1_20rem]">
        <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="h-9 pl-8"
          placeholder={searchPlaceholder}
          value={qInput}
          onChange={(e) => onQChange(e.target.value)}
        />
      </div>
      {children}
    </div>
  )
}
