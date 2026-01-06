import React from 'react'
import {
  Box,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  IconButton,
  useTheme,
  useMediaQuery,
  Stack,
  Chip
} from '@mui/material'
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  Clear as ClearIcon
} from '@mui/icons-material'

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
  { value: 'featured', label: 'Featured' }
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
  onMoreFilters
}) => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))

  const hasActiveFilters = searchQuery || categoryFilter !== 'all' || statusFilter !== 'all'

  return (
    <Box sx={{ mb: 3 }}>
      <Stack 
        direction={{ xs: 'column', md: 'row' }} 
        spacing={2} 
        alignItems={{ xs: 'stretch', md: 'center' }}
      >
        {/* Search Field */}
        <TextField
          fullWidth={isMobile}
          placeholder="Search services by name..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          InputProps={{
            startAdornment: <SearchIcon sx={{ color: 'text.secondary', mr: 1 }} />,
            endAdornment: searchQuery && (
              <IconButton
                size="small"
                onClick={() => onSearchChange('')}
                sx={{ mr: -1 }}
              >
                <ClearIcon fontSize="small" />
              </IconButton>
            )
          }}
          sx={{ 
            minWidth: { xs: '100%', md: 300 },
            '& .MuiOutlinedInput-root': {
              borderRadius: 2
            }
          }}
        />

        {/* Category Filter */}
        <FormControl sx={{ minWidth: { xs: '100%', md: 180 } }}>
          <InputLabel>Category</InputLabel>
          <Select
            value={categoryFilter}
            onChange={(e) => onCategoryChange(e.target.value)}
            label="Category"
            sx={{ borderRadius: 2 }}
          >
            <MenuItem value="all">All Categories</MenuItem>
            {categories.map((category) => (
              <MenuItem key={category.id} value={category.id}>
                {category.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Status Filter */}
        <FormControl sx={{ minWidth: { xs: '100%', md: 150 } }}>
          <InputLabel>Status</InputLabel>
          <Select
            value={statusFilter}
            onChange={(e) => onStatusChange(e.target.value)}
            label="Status"
            sx={{ borderRadius: 2 }}
          >
            {statusOptions.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Action Buttons */}
        <Stack direction="row" spacing={1}>
          <Button
            variant="outlined"
            startIcon={<FilterIcon />}
            onClick={onMoreFilters}
            sx={{ 
              borderRadius: 2,
              px: 2,
              whiteSpace: 'nowrap'
            }}
          >
            More Filter
          </Button>
          
          {hasActiveFilters && (
            <Button
              variant="text"
              startIcon={<ClearIcon />}
              onClick={onClearFilters}
              sx={{ 
                borderRadius: 2,
                px: 2,
                whiteSpace: 'nowrap'
              }}
            >
              Clear
            </Button>
          )}
        </Stack>
      </Stack>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {searchQuery && (
            <Chip
              label={`Search: "${searchQuery}"`}
              onDelete={() => onSearchChange('')}
              size="small"
              color="primary"
              variant="outlined"
            />
          )}
          {categoryFilter !== 'all' && (
            <Chip
              label={`Category: ${categories.find(cat => cat.id === categoryFilter)?.name || categoryFilter}`}
              onDelete={() => onCategoryChange('all')}
              size="small"
              color="secondary"
              variant="outlined"
            />
          )}
          {statusFilter !== 'all' && (
            <Chip
              label={`Status: ${statusOptions.find(opt => opt.value === statusFilter)?.label}`}
              onDelete={() => onStatusChange('all')}
              size="small"
              color="info"
              variant="outlined"
            />
          )}
        </Box>
      )}
    </Box>
  )
}
