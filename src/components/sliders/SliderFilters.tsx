import React from 'react'
import { Search, Filter, X } from 'lucide-react'
import { Card, CardContent } from '../ui/card'
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

interface SliderFiltersProps {
  searchTerm: string
  onSearchChange: (value: string) => void
  statusFilter: string
  onStatusChange: (value: string) => void
  audienceFilter: string
  onAudienceChange: (value: string) => void
  onClearFilters: () => void
  onApplyFilters: () => void
}

export function SliderFilters({
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusChange,
  audienceFilter,
  onAudienceChange,
  onClearFilters,
  onApplyFilters,
}: SliderFiltersProps) {
  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
  ]

  const audienceOptions = [
    { value: 'all', label: 'All Audiences' },
    { value: 'customers', label: 'Customers Only' },
    { value: 'providers', label: 'Providers Only' },
  ]

  const hasActiveFilters = searchTerm || statusFilter !== 'all' || audienceFilter !== 'all'

  return (
    <Card className="mb-6">
      <CardContent className="p-6">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <Filter className="h-5 w-5 text-primary" aria-hidden />
          <h3 className="text-lg font-semibold">Filters</h3>
          {hasActiveFilters && (
            <Badge className="ml-auto sm:ml-0" variant="default">
              Active
            </Badge>
          )}
        </div>

        <div className="grid grid-cols-1 items-end gap-4 md:grid-cols-12">
          <div className="md:col-span-4">
            <Label htmlFor="slider-search" className="sr-only">
              Search
            </Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="slider-search"
                className="rounded-md pl-9"
                placeholder="Search sliders..."
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
              />
            </div>
          </div>

          <div className="md:col-span-3">
            <Label className="mb-1.5 block text-xs text-muted-foreground">Status</Label>
            <Select value={statusFilter} onValueChange={onStatusChange}>
              <SelectTrigger className="rounded-md">
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

          <div className="md:col-span-3">
            <Label className="mb-1.5 block text-xs text-muted-foreground">Audience</Label>
            <Select value={audienceFilter} onValueChange={onAudienceChange}>
              <SelectTrigger className="rounded-md">
                <SelectValue placeholder="Audience" />
              </SelectTrigger>
              <SelectContent>
                {audienceOptions.map((option, i) => (
                  <SelectItem key={`${option.value}-${option.label}-${i}`} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2 md:col-span-2">
            <Button type="button" className="min-w-0 flex-1 rounded-md" onClick={onApplyFilters}>
              <Filter className="mr-1.5 h-4 w-4" />
              Apply
            </Button>
            {hasActiveFilters && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={onClearFilters}
                className="shrink-0 text-destructive hover:bg-destructive/10"
                title="Clear filters"
                aria-label="Clear filters"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
