/**
 * ============================================================================
 * PROFESSIONAL FILTERS
 * ============================================================================
 * Filter and search component for professionals
 *
 * @author CTO Team
 * @date November 7, 2025
 */

import React from 'react'
import { Search, Filter, X } from 'lucide-react'
import { Card, CardContent } from '../ui/card'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Button } from '../ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select'
import { PROFESSIONAL_TRADE_CATEGORIES } from '../../constants/professionalCategories'

interface ProfessionalFiltersProps {
  searchTerm: string
  onSearchChange: (value: string) => void
  availabilityFilter: string
  onAvailabilityChange: (value: string) => void
  expertiseFilter: string
  onExpertiseChange: (value: string) => void
  verificationFilter: string
  onVerificationChange: (value: string) => void
  categoryFilter: string
  onCategoryChange: (value: string) => void
  accountFilter: string
  onAccountFilterChange: (value: string) => void
  onClearFilters: () => void
  onApplyFilters: () => void
}

export function ProfessionalFilters({
  searchTerm,
  onSearchChange,
  availabilityFilter,
  onAvailabilityChange,
  expertiseFilter,
  onExpertiseChange,
  verificationFilter,
  onVerificationChange,
  categoryFilter,
  onCategoryChange,
  accountFilter,
  onAccountFilterChange,
  onClearFilters,
  onApplyFilters,
}: ProfessionalFiltersProps) {
  return (
    <Card className="mb-6 shadow-sm">
      <CardContent className="p-6">
        <div className="grid grid-cols-1 items-end gap-4 md:grid-cols-12">
          <div className="md:col-span-2">
            <Label htmlFor="prof-search" className="sr-only">
              Search
            </Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="prof-search"
                className="rounded-md pl-9"
                placeholder="Search by name, email, phone..."
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
              />
            </div>
          </div>

          <div className="md:col-span-2">
            <Label className="mb-1.5 block text-xs text-muted-foreground">Trade / category</Label>
            <Select value={categoryFilter} onValueChange={onCategoryChange}>
              <SelectTrigger className="rounded-md">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All trades</SelectItem>
                {PROFESSIONAL_TRADE_CATEGORIES.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="md:col-span-1 min-w-[120px]">
            <Label className="mb-1.5 block text-xs text-muted-foreground">Account</Label>
            <Select value={accountFilter} onValueChange={onAccountFilterChange}>
              <SelectTrigger className="rounded-md">
                <SelectValue placeholder="Account" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="md:col-span-2">
            <Label className="mb-1.5 block text-xs text-muted-foreground">Availability</Label>
            <Select value={availabilityFilter} onValueChange={onAvailabilityChange}>
              <SelectTrigger className="rounded-md">
                <SelectValue placeholder="Availability" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="available">Available</SelectItem>
                <SelectItem value="busy">Busy</SelectItem>
                <SelectItem value="offline">Offline</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="md:col-span-2">
            <Label className="mb-1.5 block text-xs text-muted-foreground">Expertise</Label>
            <Select value={expertiseFilter} onValueChange={onExpertiseChange}>
              <SelectTrigger className="rounded-md">
                <SelectValue placeholder="Expertise" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                <SelectItem value="beginner">Beginner</SelectItem>
                <SelectItem value="intermediate">Intermediate</SelectItem>
                <SelectItem value="expert">Expert</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="md:col-span-2">
            <Label className="mb-1.5 block text-xs text-muted-foreground">Verification</Label>
            <Select value={verificationFilter} onValueChange={onVerificationChange}>
              <SelectTrigger className="rounded-md">
                <SelectValue placeholder="Verification" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="verified">Verified</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2 md:col-span-1 sm:flex-row">
            <Button
              type="button"
              variant="outline"
              className="min-w-0 flex-1 rounded-md"
              onClick={onClearFilters}
            >
              <X className="mr-1.5 h-4 w-4" />
              Clear
            </Button>
            <Button type="button" className="min-w-0 flex-1 rounded-md" onClick={onApplyFilters}>
              <Filter className="mr-1.5 h-4 w-4" />
              Apply
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
