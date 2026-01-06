import React from 'react'
import {
  Box,
  Grid,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Chip,
  Stack,
} from '@mui/material'
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  Clear as ClearIcon,
} from '@mui/icons-material'

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
}) => {
  const hasActiveFilters =
    searchTerm ||
    selectedType !== 'all' ||
    selectedStatus !== 'all' ||
    selectedVerification !== 'all'

  return (
    <Box>
      <Grid container spacing={2} alignItems="center">
        <Grid item xs={12} md={4}>
          <TextField
            fullWidth
            placeholder="Search by name, email, or phone..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
        </Grid>

        <Grid item xs={12} sm={6} md={2}>
          <FormControl fullWidth>
            <InputLabel>User Type</InputLabel>
            <Select
              value={selectedType}
              label="User Type"
              onChange={(e) => onTypeChange(e.target.value)}
            >
              <MenuItem value="all">All Types</MenuItem>
              <MenuItem value="admin">Admin</MenuItem>
              <MenuItem value="provider">Provider</MenuItem>
              <MenuItem value="customer">Customer</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} sm={6} md={2}>
          <FormControl fullWidth>
            <InputLabel>Status</InputLabel>
            <Select
              value={selectedStatus}
              label="Status"
              onChange={(e) => onStatusChange(e.target.value)}
            >
              <MenuItem value="all">All Status</MenuItem>
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="inactive">Inactive</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} sm={6} md={2}>
          <FormControl fullWidth>
            <InputLabel>Verification</InputLabel>
            <Select
              value={selectedVerification}
              label="Verification"
              onChange={(e) => onVerificationChange(e.target.value)}
            >
              <MenuItem value="all">All</MenuItem>
              <MenuItem value="verified">Verified</MenuItem>
              <MenuItem value="unverified">Unverified</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} sm={6} md={2}>
          <Button
            variant="outlined"
            startIcon={<ClearIcon />}
            fullWidth
            disabled={!hasActiveFilters}
            onClick={onClearFilters}
            sx={{ height: 56 }}
          >
            Clear Filters
          </Button>
        </Grid>
      </Grid>

      {hasActiveFilters && (
        <Stack direction="row" spacing={1} sx={{ mt: 2, flexWrap: 'wrap', gap: 1 }}>
          {searchTerm && (
            <Chip
              label={`Search: ${searchTerm}`}
              onDelete={() => onSearchChange('')}
              size="small"
            />
          )}
          {selectedType !== 'all' && (
            <Chip
              label={`Type: ${selectedType}`}
              onDelete={() => onTypeChange('all')}
              size="small"
              color="primary"
            />
          )}
          {selectedStatus !== 'all' && (
            <Chip
              label={`Status: ${selectedStatus}`}
              onDelete={() => onStatusChange('all')}
              size="small"
              color="secondary"
            />
          )}
          {selectedVerification !== 'all' && (
            <Chip
              label={`Verification: ${selectedVerification}`}
              onDelete={() => onVerificationChange('all')}
              size="small"
              color="info"
            />
          )}
        </Stack>
      )}
    </Box>
  )
}

