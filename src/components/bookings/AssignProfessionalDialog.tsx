/**
 * ============================================================================
 * ASSIGN PROFESSIONAL TO BOOKING DIALOG
 * ============================================================================
 * Dialog for admins to assign a professional to a booking
 * 
 * Features:
 * - Search professionals by name, category, location
 * - Filter by availability, rating, expertise
 * - Show professional details and stats
 * - Assign with one click
 * 
 * @author CTO Team
 * @date November 7, 2025
 */

import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Card,
  CardContent,
  CardActions,
  Typography,
  Chip,
  Avatar,
  Box,
  CircularProgress,
  Alert,
  Rating,
  InputAdornment,
  Grid,
} from '@mui/material'
import {
  Search as SearchIcon,
  Person as PersonIcon,
  Star as StarIcon,
  LocationOn as LocationIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material'
import { ProfessionalsService } from '../../services/api/professionals.service'
import { BookingsService } from '../../services/api/bookings.service'
import type { Professional } from '../../types/professional.types'

interface AssignProfessionalDialogProps {
  open: boolean
  onClose: () => void
  bookingId: string
  bookingService?: string // Service name/category to filter
  bookingLocation?: string // Location to filter
  onAssigned?: () => void
}

export function AssignProfessionalDialog({
  open,
  onClose,
  bookingId,
  bookingService,
  bookingLocation,
  onAssigned,
}: AssignProfessionalDialogProps) {
  const [professionals, setProfessionals] = useState<Professional[]>([])
  const [filteredProfessionals, setFilteredProfessionals] = useState<Professional[]>([])
  const [loading, setLoading] = useState(false)
  const [assigning, setAssigning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [availabilityFilter, setAvailabilityFilter] = useState<string>('all')
  const [expertiseFilter, setExpertiseFilter] = useState<string>('all')

  // Load professionals when dialog opens
  useEffect(() => {
    if (open) {
      loadProfessionals()
    }
  }, [open])

  // Apply filters
  useEffect(() => {
    applyFilters()
  }, [professionals, searchQuery, categoryFilter, availabilityFilter, expertiseFilter])

  const loadProfessionals = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await ProfessionalsService.getProfessionals({
        page: 1,
        limit: 100, // Load all available professionals
        isVerified: true, // Only verified professionals
      })
      setProfessionals(response.data.professionals || [])
    } catch (err: any) {
      setError(err.message || 'Failed to load professionals')
    } finally {
      setLoading(false)
    }
  }

  const applyFilters = () => {
    let filtered = [...professionals]

    // Search by name or email
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (prof) =>
          `${prof.firstName} ${prof.lastName}`.toLowerCase().includes(query) ||
          prof.email?.toLowerCase().includes(query)
      )
    }

    // Filter by category
    if (categoryFilter && categoryFilter !== 'all') {
      filtered = filtered.filter((prof) => prof.categories?.includes(categoryFilter))
    }

    // Filter by availability
    if (availabilityFilter && availabilityFilter !== 'all') {
      filtered = filtered.filter((prof) => prof.availability === availabilityFilter)
    }

    // Filter by expertise
    if (expertiseFilter && expertiseFilter !== 'all') {
      filtered = filtered.filter((prof) => prof.expertiseLevel === expertiseFilter)
    }

    // Sort by rating (highest first)
    filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0))

    setFilteredProfessionals(filtered)
  }

  const handleAssign = async (professionalId: string) => {
    setAssigning(true)
    setError(null)
    setSuccess(null)

    try {
      // Call API using BookingsService (proper pattern)
      const response = await BookingsService.assignProfessional(bookingId, professionalId, {
        notifyProfessional: true,
        notifyCustomer: true,
      })

      if (!response.success) {
        throw new Error(response.message || 'Assignment failed')
      }

      setSuccess('Professional assigned successfully!')
      
      // Call onAssigned callback after short delay
      setTimeout(() => {
        onAssigned?.()
        onClose()
      }, 1500)
    } catch (err: any) {
      console.error('Error assigning professional:', err)
      setError(err.message || 'Failed to assign professional')
    } finally {
      setAssigning(false)
    }
  }

  const getAvailabilityColor = (availability?: string) => {
    switch (availability) {
      case 'available':
        return 'success'
      case 'busy':
        return 'warning'
      case 'offline':
        return 'error'
      default:
        return 'default'
    }
  }

  const getExpertiseColor = (expertise?: string) => {
    switch (expertise) {
      case 'expert':
        return 'error'
      case 'intermediate':
        return 'warning'
      case 'beginner':
        return 'info'
      default:
        return 'default'
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <PersonIcon />
          <span>Assign Professional to Booking</span>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        {/* Success/Error Messages */}
        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {success}
          </Alert>
        )}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* TEMPORARY: Quick assign Zillur — backend resolves "zillur" to professional by firstName. Remove when no longer needed. */}
        <Alert severity="info" sx={{ mb: 2 }}>
          <strong>Quick assign:</strong>{' '}
          <Button
            size="small"
            variant="contained"
            color="primary"
            onClick={() => handleAssign('zillur')}
            disabled={assigning}
          >
            Auto-assign Zillur
          </Button>
        </Alert>

        {/* Filters */}
        <Box mb={3}>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 2 }}>
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  label="Category"
                >
                  <MenuItem value="all">All</MenuItem>
                  <MenuItem value="electrician">Electrician</MenuItem>
                  <MenuItem value="plumber">Plumber</MenuItem>
                  <MenuItem value="carpenter">Carpenter</MenuItem>
                  <MenuItem value="painter">Painter</MenuItem>
                  <MenuItem value="cleaner">Cleaner</MenuItem>
                  <MenuItem value="ac_technician">AC Technician</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, md: 2 }}>
              <FormControl fullWidth>
                <InputLabel>Availability</InputLabel>
                <Select
                  value={availabilityFilter}
                  onChange={(e) => setAvailabilityFilter(e.target.value)}
                  label="Availability"
                >
                  <MenuItem value="all">All</MenuItem>
                  <MenuItem value="available">Available</MenuItem>
                  <MenuItem value="busy">Busy</MenuItem>
                  <MenuItem value="offline">Offline</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, md: 2 }}>
              <FormControl fullWidth>
                <InputLabel>Expertise</InputLabel>
                <Select
                  value={expertiseFilter}
                  onChange={(e) => setExpertiseFilter(e.target.value)}
                  label="Expertise"
                >
                  <MenuItem value="all">All</MenuItem>
                  <MenuItem value="expert">Expert</MenuItem>
                  <MenuItem value="intermediate">Intermediate</MenuItem>
                  <MenuItem value="beginner">Beginner</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </Box>

        {/* Loading State */}
        {loading && (
          <Box display="flex" justifyContent="center" p={4}>
            <CircularProgress />
          </Box>
        )}

        {/* Professionals Grid */}
        {!loading && filteredProfessionals.length === 0 && (
          <Alert severity="info">
            No professionals found matching your filters. Try adjusting your search criteria.
          </Alert>
        )}

        {!loading && filteredProfessionals.length > 0 && (
          <Grid container spacing={2}>
            {filteredProfessionals.map((professional) => (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={professional._id}>
                <Card variant="outlined">
                  <CardContent>
                    {/* Avatar & Name */}
                    <Box display="flex" alignItems="center" mb={2}>
                      <Avatar
                        src={professional.profileImage}
                        sx={{ width: 56, height: 56, mr: 2 }}
                      >
                        {professional.firstName[0]}
                        {professional.lastName[0]}
                      </Avatar>
                      <Box flex={1}>
                        <Typography variant="h6" gutterBottom>
                          {professional.firstName} {professional.lastName}
                        </Typography>
                        <Box display="flex" alignItems="center" gap={0.5}>
                          <Rating value={professional.rating || 0} size="small" readOnly precision={0.1} />
                          <Typography variant="caption" color="text.secondary">
                            ({professional.totalReviews || 0})
                          </Typography>
                        </Box>
                      </Box>
                    </Box>

                    {/* Categories */}
                    <Box display="flex" flexWrap="wrap" gap={0.5} mb={1}>
                      {professional.categories?.slice(0, 2).map((cat) => (
                        <Chip key={cat} label={cat} size="small" />
                      ))}
                      {(professional.categories?.length || 0) > 2 && (
                        <Chip label={`+${professional.categories!.length - 2}`} size="small" />
                      )}
                    </Box>

                    {/* Stats */}
                    <Box display="flex" gap={1} mb={1}>
                      <Chip
                        label={professional.availability || 'unknown'}
                        size="small"
                        color={getAvailabilityColor(professional.availability)}
                      />
                      <Chip
                        label={professional.expertiseLevel || 'unknown'}
                        size="small"
                        color={getExpertiseColor(professional.expertiseLevel)}
                      />
                    </Box>

                    {/* Location */}
                    {professional.address && (
                      <Typography variant="caption" color="text.secondary" display="flex" alignItems="center" gap={0.5}>
                        <LocationIcon fontSize="small" />
                        {professional.address.area}, {professional.address.city}
                      </Typography>
                    )}

                    {/* Experience */}
                    <Typography variant="caption" color="text.secondary" display="block" mt={0.5}>
                      {professional.experience} years experience • {professional.completedJobs || 0} jobs completed
                    </Typography>
                  </CardContent>

                  <CardActions>
                    <Button
                      fullWidth
                      variant="contained"
                      color="primary"
                      startIcon={<CheckCircleIcon />}
                      onClick={() => handleAssign(professional._id)}
                      disabled={assigning || professional.availability === 'offline'}
                    >
                      {assigning ? 'Assigning...' : 'Assign'}
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={assigning}>
          Cancel
        </Button>
      </DialogActions>
    </Dialog>
  )
}

