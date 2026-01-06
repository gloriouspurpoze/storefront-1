import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  IconButton,
  Chip,
  InputAdornment,
  Alert,
} from '@mui/material'
import {
  Close as CloseIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  CloudUpload as UploadIcon,
} from '@mui/icons-material'
import { ServiceRequest, CreateServiceRequest, UpdateServiceRequest } from '../../services/api/services.service'

interface ServiceRequestFormDialogProps {
  open: boolean
  mode: 'create' | 'edit'
  service: ServiceRequest | null
  onClose: () => void
  onSubmit: (data: CreateServiceRequest | UpdateServiceRequest) => void
  loading?: boolean
}

const SERVICE_TYPES = [
  'plumbing',
  'electrical',
  'hvac',
  'cleaning',
  'landscaping',
  'painting',
  'carpentry',
  'handyman',
  'roofing',
  'flooring',
  'appliance_repair',
  'pest_control',
]

const URGENCY_LEVELS = [
  { value: 'low', label: 'Low - Can wait a few days', color: 'success' },
  { value: 'medium', label: 'Medium - Within a week', color: 'warning' },
  { value: 'high', label: 'High - Urgent, ASAP', color: 'error' },
]

export function ServiceRequestFormDialog({
  open,
  mode,
  service,
  onClose,
  onSubmit,
  loading = false,
}: ServiceRequestFormDialogProps) {
  const [formData, setFormData] = useState<any>({
    service_type: '',
    title: '',
    description: '',
    location: {
      address: '',
      city: '',
      state: '',
      zip_code: '',
      coordinates: {
        lat: '',
        lng: '',
      },
    },
    urgency: 'medium',
    budget_min: '',
    budget_max: '',
    preferred_date: '',
    images: [],
  })

  const [errors, setErrors] = useState<any>({})

  useEffect(() => {
    if (mode === 'edit' && service) {
      setFormData({
        service_type: service.service_type,
        title: service.title,
        description: service.description,
        location: {
          address: service.location.address,
          city: service.location.city,
          state: service.location.state,
          zip_code: service.location.zip_code,
          coordinates: {
            lat: service.location.coordinates?.lat || '',
            lng: service.location.coordinates?.lng || '',
          },
        },
        urgency: service.urgency,
        budget_min: parseFloat(service.budget_min),
        budget_max: parseFloat(service.budget_max),
        preferred_date: service.preferred_date ? service.preferred_date.split('T')[0] : '',
        images: service.images || [],
      })
    } else {
      // Reset form for create mode
      setFormData({
        service_type: '',
        title: '',
        description: '',
        location: {
          address: '',
          city: '',
          state: '',
          zip_code: '',
          coordinates: {
            lat: '',
            lng: '',
          },
        },
        urgency: 'medium',
        budget_min: '',
        budget_max: '',
        preferred_date: '',
        images: [],
      })
    }
    setErrors({})
  }, [mode, service, open])

  const handleChange = (field: string, value: any) => {
    setFormData((prev: any) => ({
      ...prev,
      [field]: value,
    }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev: any) => ({ ...prev, [field]: '' }))
    }
  }

  const handleLocationChange = (field: string, value: any) => {
    setFormData((prev: any) => ({
      ...prev,
      location: {
        ...prev.location,
        [field]: value,
      },
    }))
  }

  const handleAddImage = () => {
    const imageUrl = prompt('Enter image URL:')
    if (imageUrl && imageUrl.trim()) {
      setFormData((prev: any) => ({
        ...prev,
        images: [...prev.images, imageUrl.trim()],
      }))
    }
  }

  const handleRemoveImage = (index: number) => {
    setFormData((prev: any) => ({
      ...prev,
      images: prev.images.filter((_: any, i: number) => i !== index),
    }))
  }

  const validateForm = () => {
    const newErrors: any = {}

    if (!formData.service_type) newErrors.service_type = 'Service type is required'
    if (!formData.title || formData.title.trim().length < 5) {
      newErrors.title = 'Title must be at least 5 characters'
    }
    if (!formData.description || formData.description.trim().length < 20) {
      newErrors.description = 'Description must be at least 20 characters'
    }
    if (!formData.location.address) newErrors.address = 'Address is required'
    if (!formData.location.city) newErrors.city = 'City is required'
    if (!formData.location.state) newErrors.state = 'State is required'
    if (!formData.location.zip_code) newErrors.zip_code = 'ZIP code is required'
    if (!formData.location.coordinates.lat || !formData.location.coordinates.lng) {
      newErrors.coordinates = 'Coordinates (latitude and longitude) are required'
    }
    if (!formData.budget_min || parseFloat(formData.budget_min) <= 0) {
      newErrors.budget_min = 'Minimum budget must be greater than 0'
    }
    if (!formData.budget_max || parseFloat(formData.budget_max) <= 0) {
      newErrors.budget_max = 'Maximum budget must be greater than 0'
    }
    if (
      formData.budget_min &&
      formData.budget_max &&
      parseFloat(formData.budget_max) < parseFloat(formData.budget_min)
    ) {
      newErrors.budget_max = 'Maximum budget must be greater than minimum budget'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = () => {
    if (!validateForm()) {
      return
    }

    const submitData: any = {
      service_type: formData.service_type,
      title: formData.title.trim(),
      description: formData.description.trim(),
      location: {
        address: formData.location.address.trim(),
        city: formData.location.city.trim(),
        state: formData.location.state.trim(),
        zip_code: formData.location.zip_code.trim(),
        coordinates: {
          lat: parseFloat(formData.location.coordinates.lat),
          lng: parseFloat(formData.location.coordinates.lng),
        },
      },
      urgency: formData.urgency,
      budget_min: parseFloat(formData.budget_min),
      budget_max: parseFloat(formData.budget_max),
      images: formData.images,
    }

    if (formData.preferred_date) {
      submitData.preferred_date = new Date(formData.preferred_date).toISOString()
    }

    onSubmit(submitData)
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">
            {mode === 'create' ? 'Create New Service Request' : 'Edit Service Request'}
          </Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        <Grid container spacing={3}>
          {/* Service Type & Title */}
          <Grid item xs={12} md={6}>
            <FormControl fullWidth error={!!errors.service_type}>
              <InputLabel>Service Type *</InputLabel>
              <Select
                value={formData.service_type}
                label="Service Type *"
                onChange={(e) => handleChange('service_type', e.target.value)}
              >
                {SERVICE_TYPES.map((type) => (
                  <MenuItem key={type} value={type}>
                    {type
                      .split('_')
                      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                      .join(' ')}
                  </MenuItem>
                ))}
              </Select>
              {errors.service_type && (
                <Typography variant="caption" color="error">
                  {errors.service_type}
                </Typography>
              )}
            </FormControl>
          </Grid>

          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Urgency *</InputLabel>
              <Select
                value={formData.urgency}
                label="Urgency *"
                onChange={(e) => handleChange('urgency', e.target.value)}
              >
                {URGENCY_LEVELS.map((level) => (
                  <MenuItem key={level.value} value={level.value}>
                    <Chip
                      label={level.label}
                      color={level.color as any}
                      size="small"
                      sx={{ mr: 1 }}
                    />
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Title *"
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              error={!!errors.title}
              helperText={errors.title || 'Brief description of what you need (min 5 characters)'}
              placeholder="e.g., Fix leaking kitchen faucet"
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              rows={4}
              label="Description *"
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              error={!!errors.description}
              helperText={
                errors.description || 'Detailed description of the issue (min 20 characters)'
              }
              placeholder="Describe the problem in detail, including any relevant information..."
            />
          </Grid>

          {/* Location Section */}
          <Grid item xs={12}>
            <Typography variant="subtitle2" gutterBottom sx={{ mt: 2, mb: 1 }}>
              Location
            </Typography>
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Address *"
              value={formData.location.address}
              onChange={(e) => handleLocationChange('address', e.target.value)}
              error={!!errors.address}
              helperText={errors.address}
              placeholder="123 Main St, Apt 4B"
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="City *"
              value={formData.location.city}
              onChange={(e) => handleLocationChange('city', e.target.value)}
              error={!!errors.city}
              helperText={errors.city}
              placeholder="New York"
            />
          </Grid>

          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              label="State *"
              value={formData.location.state}
              onChange={(e) => handleLocationChange('state', e.target.value)}
              error={!!errors.state}
              helperText={errors.state}
              placeholder="NY"
              inputProps={{ maxLength: 2, style: { textTransform: 'uppercase' } }}
            />
          </Grid>

          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              label="ZIP Code *"
              value={formData.location.zip_code}
              onChange={(e) => handleLocationChange('zip_code', e.target.value)}
              error={!!errors.zip_code}
              helperText={errors.zip_code}
              placeholder="10001"
              inputProps={{ maxLength: 5 }}
            />
          </Grid>

          <Grid item xs={12}>
            <Typography variant="caption" color="textSecondary" sx={{ mb: 1, display: 'block' }}>
              Coordinates * (Get coordinates from{' '}
              <a href="https://www.google.com/maps" target="_blank" rel="noopener noreferrer">
                Google Maps
              </a>
              )
            </Typography>
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              type="number"
              label="Latitude *"
              value={formData.location.coordinates.lat}
              onChange={(e) =>
                setFormData((prev: any) => ({
                  ...prev,
                  location: {
                    ...prev.location,
                    coordinates: { ...prev.location.coordinates, lat: e.target.value },
                  },
                }))
              }
              error={!!errors.coordinates}
              helperText={errors.coordinates}
              placeholder="40.7128"
              inputProps={{ step: 'any' }}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              type="number"
              label="Longitude *"
              value={formData.location.coordinates.lng}
              onChange={(e) =>
                setFormData((prev: any) => ({
                  ...prev,
                  location: {
                    ...prev.location,
                    coordinates: { ...prev.location.coordinates, lng: e.target.value },
                  },
                }))
              }
              error={!!errors.coordinates}
              placeholder="-74.0060"
              inputProps={{ step: 'any' }}
            />
          </Grid>

          {/* Budget Section */}
          <Grid item xs={12}>
            <Typography variant="subtitle2" gutterBottom sx={{ mt: 2, mb: 1 }}>
              Budget
            </Typography>
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              type="number"
              label="Minimum Budget *"
              value={formData.budget_min}
              onChange={(e) => handleChange('budget_min', e.target.value)}
              error={!!errors.budget_min}
              helperText={errors.budget_min}
              InputProps={{
                startAdornment: <InputAdornment position="start">$</InputAdornment>,
              }}
              inputProps={{ min: 0, step: 10 }}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              type="number"
              label="Maximum Budget *"
              value={formData.budget_max}
              onChange={(e) => handleChange('budget_max', e.target.value)}
              error={!!errors.budget_max}
              helperText={errors.budget_max}
              InputProps={{
                startAdornment: <InputAdornment position="start">$</InputAdornment>,
              }}
              inputProps={{ min: 0, step: 10 }}
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              type="date"
              label="Preferred Date"
              value={formData.preferred_date}
              onChange={(e) => handleChange('preferred_date', e.target.value)}
              InputLabelProps={{ shrink: true }}
              helperText="When would you like the service completed?"
              inputProps={{
                min: new Date().toISOString().split('T')[0],
              }}
            />
          </Grid>

          {/* Images Section */}
          <Grid item xs={12}>
            <Box sx={{ mt: 2 }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                <Typography variant="subtitle2">Images (Optional)</Typography>
                <Button startIcon={<AddIcon />} size="small" onClick={handleAddImage}>
                  Add Image URL
                </Button>
              </Box>
              {formData.images.length > 0 ? (
                <Box display="flex" flexWrap="wrap" gap={1}>
                  {formData.images.map((image: string, index: number) => (
                    <Chip
                      key={index}
                      label={image.substring(0, 30) + '...'}
                      onDelete={() => handleRemoveImage(index)}
                      color="primary"
                      variant="outlined"
                    />
                  ))}
                </Box>
              ) : (
                <Alert severity="info" sx={{ mt: 1 }}>
                  No images added. You can add image URLs to help service providers understand the
                  issue.
                </Alert>
              )}
            </Box>
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading}
          startIcon={loading ? null : mode === 'create' ? <AddIcon /> : <EditIcon />}
        >
          {loading ? 'Saving...' : mode === 'create' ? 'Create Request' : 'Update Request'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

