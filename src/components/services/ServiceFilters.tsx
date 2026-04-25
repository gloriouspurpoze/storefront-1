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

interface ServiceFiltersProps {
  searchQuery: string
  onSearchChange: (query: string) => void
  categoryFilter: string
  onCategoryChange: (category: string) => void
  statusFilter: string
  onStatusChange: (status: string) => void
  categories: Array<{ id: string; name: string }>
  onClearFilters: () => void
  onMoreFilters: () => void
}

const statusOptions = [
  { value: 'all', label: 'All Status' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'featured', label: 'Featured' },
]

export const ServiceFilters: React.FC<ServiceFiltersProps> = ({
  searchQuery,
  onSearchChange,
  categoryFilter,
  onCategoryChange,
  statusFilter,
  onStatusChange,
  categories,
  onClearFilters,
  onMoreFilters,
}) => {
  const isDesktop = useMediaQuery(muiMdUp)
  const hasActiveFilters = searchQuery || categoryFilter !== 'all' || statusFilter !== 'all'

  return (
    <div className="mb-6">
      <div
        className={cn(
          'flex flex-col gap-3',
          isDesktop && 'md:flex-row md:flex-wrap md:items-center',
        )}
      >
        <div className={cn('relative min-w-0', isDesktop && 'md:min-w-[300px] md:max-w-md')}>
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="rounded-md pl-9 pr-9"
            placeholder="Search services by name..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            aria-label="Search services"
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

        <div className={cn('w-full', isDesktop && 'md:w-[180px]')}>
          <Label htmlFor="svc-category" className="sr-only">
            Category
          </Label>
          <Select value={categoryFilter} onValueChange={onCategoryChange}>
            <SelectTrigger id="svc-category" className="rounded-md">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className={cn('w-full', isDesktop && 'md:w-[150px]')}>
          <Label htmlFor="svc-status" className="sr-only">
            Status
          </Label>
          <Select value={statusFilter} onValueChange={onStatusChange}>
            <SelectTrigger id="svc-status" className="rounded-md">
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

        <div className="flex flex-row flex-wrap gap-2">
          <Button type="button" variant="outline" className="rounded-md px-4" onClick={onMoreFilters}>
            <Filter className="mr-1.5 h-4 w-4" />
            More Filter
          </Button>

          {hasActiveFilters && (
            <Button type="button" variant="ghost" className="rounded-md px-4" onClick={onClearFilters}>
              <X className="mr-1.5 h-4 w-4" />
              Clear
            </Button>
          )}
        </div>
      </div>

      {hasActiveFilters && (
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
          {categoryFilter !== 'all' && (
            <Badge variant="secondary" className="gap-1">
              Category: {categories.find((c) => c.id === categoryFilter)?.name || categoryFilter}
              <button
                type="button"
                className="ml-1 rounded-sm hover:bg-muted"
                onClick={() => onCategoryChange('all')}
                aria-label="Remove category filter"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {statusFilter !== 'all' && (
            <Badge variant="outline" className="gap-1">
              Status: {statusOptions.find((o) => o.value === statusFilter)?.label}
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
        </div>
      )}
    </div>
  )
}
