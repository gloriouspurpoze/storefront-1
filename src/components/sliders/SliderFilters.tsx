import React from 'react'
import {
  Box,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Chip,
  Paper,
  Typography,
  IconButton,
} from '@mui/material'
import Grid from '@mui/material/GridLegacy'
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  Clear as ClearIcon,
} from '@mui/icons-material'

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
    { value: 'all', label: 'All Users' },
    { value: 'customers', label: 'Customers Only' },
    { value: 'providers', label: 'Providers Only' },
  ]

  const hasActiveFilters = searchTerm || statusFilter !== 'all' || audienceFilter !== 'all'

  return (
    <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <FilterIcon color="primary" />
        <Typography variant="h6" fontWeight="600">
          Filters
        </Typography>
        {hasActiveFilters && (
          <Chip
            label="Active"
            color="primary"
            size="small"
            sx={{ ml: 'auto' }}
          />
        )}
      </Box>

      <Grid container spacing={2} alignItems="center">
        <Grid item xs={12} md={4}>
          <TextField
            fullWidth
            placeholder="Search sliders..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            InputProps={{
              startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
              },
            }}
          />
        </Grid>

        <Grid item xs={12} md={3}>
          <FormControl fullWidth>
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
        </Grid>

        <Grid item xs={12} md={3}>
          <FormControl fullWidth>
            <InputLabel>Audience</InputLabel>
            <Select
              value={audienceFilter}
              onChange={(e) => onAudienceChange(e.target.value)}
              label="Audience"
              sx={{ borderRadius: 2 }}
            >
              {audienceOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} md={2}>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="contained"
              onClick={onApplyFilters}
              startIcon={<FilterIcon />}
              sx={{ borderRadius: 2, flex: 1 }}
            >
              Apply
            </Button>
            {hasActiveFilters && (
              <IconButton
                onClick={onClearFilters}
                color="error"
                sx={{
                  '&:hover': {
                    bgcolor: 'error.100',
                  },
                }}
              >
                <ClearIcon />
              </IconButton>
            )}
          </Box>
        </Grid>
      </Grid>
    </Paper>
  )
}
