import React from 'react'
import { Search, Filter, X } from 'lucide-react'
import { useMediaQuery, muiMdUp } from '../../hooks/useMediaQuery'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select'
import { cn } from '../../lib/utils'

interface OrderFiltersProps {
  searchQuery: string
  onSearchChange: (query: string) => void
  statusFilter: string
  onStatusChange: (status: string) => void
  dateRange: {
    start: Date | null
    end: Date | null
  }
  onDateRangeChange: (start: Date | null, end: Date | null) => void
  onClearFilters: () => void
  onMoreFilters: () => void
}

const statusOptions = [
  { value: 'all', label: 'All Status' },
  { value: 'pending', label: 'Pending' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'completed', label: 'Completed' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'cancelled', label: 'Cancelled' },
]

export const OrderFilters: React.FC<OrderFiltersProps> = ({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusChange,
  dateRange,
  onDateRangeChange,
  onClearFilters,
  onMoreFilters,
}) => {
  const isDesktop = useMediaQuery(muiMdUp)

  return (
    <div className="mb-6">
      <div
        className={cn(
          'flex flex-col gap-3',
          isDesktop && 'md:flex-row md:flex-wrap md:items-center',
        )}
      >
        <div className={cn('relative min-w-0', isDesktop && 'md:min-w-[300px] md:max-w-md md:flex-1')}>
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="rounded-md pl-9 pr-9"
            placeholder="Search by name, Order ID..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            aria-label="Search orders"
          />
          {searchQuery ? (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute right-1 top-1/2 -translate-y-1/2 rounded p-1.5 text-muted-foreground hover:bg-muted"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          ) : null}
        </div>

        <div className={cn('w-full', isDesktop && 'md:w-[150px]')}>
          <Label htmlFor="order-status" className="sr-only">
            Status
          </Label>
          <Select value={statusFilter} onValueChange={onStatusChange}>
            <SelectTrigger id="order-status" className="rounded-md">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div
          className={cn(
            'flex w-full min-w-0 flex-col gap-2 sm:flex-row',
            isDesktop && 'md:min-w-[300px] md:max-w-md',
          )}
        >
          <div className="min-w-0 flex-1 space-y-1">
            <Label htmlFor="order-start" className="text-xs text-muted-foreground">
              Start Date
            </Label>
            <Input
              id="order-start"
              type="date"
              className="rounded-md"
              value={dateRange.start ? dateRange.start.toISOString().split('T')[0] : ''}
              onChange={(e) =>
                onDateRangeChange(e.target.value ? new Date(e.target.value) : null, dateRange.end)
              }
            />
          </div>
          <div className="min-w-0 flex-1 space-y-1">
            <Label htmlFor="order-end" className="text-xs text-muted-foreground">
              End Date
            </Label>
            <Input
              id="order-end"
              type="date"
              className="rounded-md"
              value={dateRange.end ? dateRange.end.toISOString().split('T')[0] : ''}
              onChange={(e) =>
                onDateRangeChange(dateRange.start, e.target.value ? new Date(e.target.value) : null)
              }
            />
          </div>
        </div>

        <div className="flex flex-row flex-wrap gap-2">
          <Button type="button" variant="outline" className="rounded-md px-4" onClick={onMoreFilters}>
            <Filter className="mr-1.5 h-4 w-4" />
            More Filter
          </Button>

          {(searchQuery || statusFilter !== 'all' || dateRange.start || dateRange.end) && (
            <Button type="button" variant="ghost" className="rounded-md px-4" onClick={onClearFilters}>
              <X className="mr-1.5 h-4 w-4" />
              Clear
            </Button>
          )}
        </div>
      </div>

      {(searchQuery || statusFilter !== 'all' || dateRange.start || dateRange.end) && (
        <div className="mt-3 flex flex-wrap gap-2">
          {searchQuery && (
            <Badge variant="outline" className="gap-1">
              Search: &quot;{searchQuery}&quot;
              <button
                type="button"
                className="ml-1 rounded-sm hover:bg-muted"
                onClick={() => onSearchChange('')}
                aria-label="Remove search filter"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {statusFilter !== 'all' && (
            <Badge variant="secondary" className="gap-1">
              Status: {statusOptions.find((opt) => opt.value === statusFilter)?.label}
              <button
                type="button"
                className="ml-1 rounded-sm hover:bg-muted"
                onClick={() => onStatusChange('all')}
                aria-label="Remove status filter"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {dateRange.start && (
            <Badge variant="outline" className="gap-1">
              From: {dateRange.start.toLocaleDateString()}
              <button
                type="button"
                className="ml-1 rounded-sm hover:bg-muted"
                onClick={() => onDateRangeChange(null, dateRange.end)}
                aria-label="Remove start date"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {dateRange.end && (
            <Badge variant="outline" className="gap-1">
              To: {dateRange.end.toLocaleDateString()}
              <button
                type="button"
                className="ml-1 rounded-sm hover:bg-muted"
                onClick={() => onDateRangeChange(dateRange.start, null)}
                aria-label="Remove end date"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
        </div>
      )}
    </div>
  )
}
