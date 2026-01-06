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
  Grid,
  Paper,
  Typography,
  IconButton,
} from '@mui/material'
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  Clear as ClearIcon,
} from '@mui/icons-material'

interface ProviderFiltersProps {
  searchTerm: string
  onSearchChange: (value: string) => void
  statusFilter: string
  onStatusChange: (value: string) => void
  experienceFilter: string
  onExperienceChange: (value: string) => void
  onClearFilters: () => void
  onApplyFilters: () => void
}

export function ProviderFilters({
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusChange,
  experienceFilter,
  onExperienceChange,
  onClearFilters,
  onApplyFilters,
}: ProviderFiltersProps) {
  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'verified', label: 'Verified' },
    { value: 'pending', label: 'Pending' },
    { value: 'rejected', label: 'Rejected' },
  ]

  const experienceOptions = [
    { value: 'all', label: 'All Experience' },
    { value: '0-2', label: '0-2 years' },
    { value: '3-5', label: '3-5 years' },
    { value: '6-10', label: '6-10 years' },
    { value: '10+', label: '10+ years' },
  ]

  const hasActiveFilters = searchTerm || statusFilter !== 'all' || experienceFilter !== 'all'

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
            placeholder="Search providers..."
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
            <InputLabel>Experience</InputLabel>
            <Select
              value={experienceFilter}
              onChange={(e) => onExperienceChange(e.target.value)}
              label="Experience"
              sx={{ borderRadius: 2 }}
            >
              {experienceOptions.map((option) => (
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
