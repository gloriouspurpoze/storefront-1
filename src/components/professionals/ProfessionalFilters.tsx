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
import {
  Box,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Paper,
  Grid,
  InputAdornment,
} from '@mui/material'
import {
  Search as SearchIcon,
  FilterAlt as FilterIcon,
  Clear as ClearIcon,
} from '@mui/icons-material'

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
  onClearFilters,
  onApplyFilters,
}: ProfessionalFiltersProps) {
  return (
    <Paper sx={{ p: 3, mb: 3, borderRadius: 2, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
      <Grid container spacing={2} alignItems="center">
        {/* Search */}
        <Grid item xs={12} md={4}>
          <TextField
            fullWidth
            placeholder="Search by name, email, phone..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: 'text.secondary' }} />
                </InputAdornment>
              ),
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
              },
            }}
          />
        </Grid>

        {/* Availability Filter */}
        <Grid item xs={12} sm={6} md={2}>
          <FormControl fullWidth>
            <InputLabel>Availability</InputLabel>
            <Select
              value={availabilityFilter}
              onChange={(e) => onAvailabilityChange(e.target.value)}
              label="Availability"
              sx={{ borderRadius: 2 }}
            >
              <MenuItem value="all">All</MenuItem>
              <MenuItem value="available">Available</MenuItem>
              <MenuItem value="busy">Busy</MenuItem>
              <MenuItem value="offline">Offline</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        {/* Expertise Filter */}
        <Grid item xs={12} sm={6} md={2}>
          <FormControl fullWidth>
            <InputLabel>Expertise</InputLabel>
            <Select
              value={expertiseFilter}
              onChange={(e) => onExpertiseChange(e.target.value)}
              label="Expertise"
              sx={{ borderRadius: 2 }}
            >
              <MenuItem value="all">All Levels</MenuItem>
              <MenuItem value="beginner">Beginner</MenuItem>
              <MenuItem value="intermediate">Intermediate</MenuItem>
              <MenuItem value="expert">Expert</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        {/* Verification Filter */}
        <Grid item xs={12} sm={6} md={2}>
          <FormControl fullWidth>
            <InputLabel>Verification</InputLabel>
            <Select
              value={verificationFilter}
              onChange={(e) => onVerificationChange(e.target.value)}
              label="Verification"
              sx={{ borderRadius: 2 }}
            >
              <MenuItem value="all">All</MenuItem>
              <MenuItem value="verified">Verified</MenuItem>
              <MenuItem value="pending">Pending</MenuItem>
              <MenuItem value="rejected">Rejected</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        {/* Action Buttons */}
        <Grid item xs={12} md={2}>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              onClick={onClearFilters}
              startIcon={<ClearIcon />}
              sx={{
                borderRadius: 2,
                borderColor: 'divider',
                color: 'text.secondary',
                '&:hover': {
                  borderColor: 'primary.main',
                  bgcolor: 'action.hover',
                },
              }}
            >
              Clear
            </Button>
            <Button
              variant="contained"
              onClick={onApplyFilters}
              startIcon={<FilterIcon />}
              sx={{ borderRadius: 2 }}
            >
              Apply
            </Button>
          </Box>
        </Grid>
      </Grid>
    </Paper>
  )
}

