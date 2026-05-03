import React from 'react'
import { Search, X } from 'lucide-react'
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

interface UserFiltersProps {
  searchTerm: string
  onSearchChange: (value: string) => void
  selectedType: string
  onTypeChange: (value: string) => void
  selectedStatus: string
  onStatusChange: (value: string) => void
  selectedVerification: string
  onVerificationChange: (value: string) => void
  onClearFilters: () => void
  /** When false, user type filter is hidden (e.g. team members page). */
  showUserTypeFilter?: boolean
  /** App directory: only customer / provider / professional options. */
  directoryTypesOnly?: boolean
}

export const UserFilters: React.FC<UserFiltersProps> = ({
  searchTerm,
  onSearchChange,
  selectedType,
  onTypeChange,
  selectedStatus,
  onStatusChange,
  selectedVerification,
  onVerificationChange,
  onClearFilters,
  showUserTypeFilter = true,
  directoryTypesOnly = false,
}) => {
  const hasActiveFilters =
    searchTerm ||
    (showUserTypeFilter && selectedType !== 'all') ||
    selectedStatus !== 'all' ||
    selectedVerification !== 'all'

  return (
    <div>
      <div className="grid grid-cols-1 items-end gap-4 md:grid-cols-12">
        <div className="md:col-span-4">
          <Label htmlFor="user-search" className="sr-only">
            Search users
          </Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="user-search"
              className="pl-9"
              placeholder="Search by name, email, or phone..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>
        </div>

        {showUserTypeFilter && (
          <div className="md:col-span-2">
            <Label className="mb-1.5 block text-xs text-muted-foreground">User Type</Label>
            <Select value={selectedType} onValueChange={onTypeChange}>
              <SelectTrigger>
                <SelectValue placeholder="User Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {!directoryTypesOnly && <SelectItem value="admin">Admin</SelectItem>}
                <SelectItem value="provider">Provider</SelectItem>
                <SelectItem value="customer">Customer</SelectItem>
                {directoryTypesOnly && <SelectItem value="professional">Professional</SelectItem>}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="md:col-span-2">
          <Label className="mb-1.5 block text-xs text-muted-foreground">Status</Label>
          <Select value={selectedStatus} onValueChange={onStatusChange}>
            <SelectTrigger>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="md:col-span-2">
          <Label className="mb-1.5 block text-xs text-muted-foreground">Verification</Label>
          <Select value={selectedVerification} onValueChange={onVerificationChange}>
            <SelectTrigger>
              <SelectValue placeholder="Verification" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="verified">Verified</SelectItem>
              <SelectItem value="unverified">Unverified</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="md:col-span-2">
          <Button
            type="button"
            variant="outline"
            className="h-10 w-full"
            disabled={!hasActiveFilters}
            onClick={onClearFilters}
          >
            <X className="mr-1.5 h-4 w-4" />
            Clear Filters
          </Button>
        </div>
      </div>

      {hasActiveFilters && (
        <div className="mt-3 flex flex-wrap gap-2">
          {searchTerm && (
            <Badge variant="secondary" className="gap-1 pr-1">
              Search: {searchTerm}
              <button
                type="button"
                className="ml-0.5 rounded p-0.5 hover:bg-muted-foreground/20"
                onClick={() => onSearchChange('')}
                aria-label="Remove"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {selectedType !== 'all' && (
            <Badge className="gap-1 pr-1" variant="default">
              Type: {selectedType}
              <button
                type="button"
                className="ml-0.5 rounded p-0.5 hover:bg-primary/20"
                onClick={() => onTypeChange('all')}
                aria-label="Remove"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {selectedStatus !== 'all' && (
            <Badge variant="outline" className="gap-1 pr-1">
              Status: {selectedStatus}
              <button
                type="button"
                className="ml-0.5 rounded p-0.5 hover:bg-muted"
                onClick={() => onStatusChange('all')}
                aria-label="Remove"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {selectedVerification !== 'all' && (
            <Badge variant="outline" className="gap-1 pr-1">
              Verification: {selectedVerification}
              <button
                type="button"
                className="ml-0.5 rounded p-0.5 hover:bg-muted"
                onClick={() => onVerificationChange('all')}
                aria-label="Remove"
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
