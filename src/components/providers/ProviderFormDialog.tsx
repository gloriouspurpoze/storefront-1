import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Box,
  Typography,
  IconButton,
  Switch,
  FormControlLabel,
  Divider,
} from '@mui/material'
import Grid from '@mui/material/GridLegacy'
import {
  Close as CloseIcon,
  Add as AddIcon,
  Business as BusinessIcon,
} from '@mui/icons-material'

interface ServiceProvider {
  id: string
  business_name: string
  business_license: string
  services_offered: string[]
  service_areas: string[]
  verification_status: 'pending' | 'verified' | 'rejected'
  rating: number
  total_reviews: number
  years_experience: number
  bio: string
  user?: {
    firstName: string
    lastName: string
    email: string
    phone: string
  }
}

interface ProviderFormDialogProps {
  open: boolean
  onClose: () => void
  onSubmit: (data: any) => void
  mode: 'create' | 'edit'
  provider?: ServiceProvider | null
  loading?: boolean
}

export function ProviderFormDialog({
  open,
  onClose,
  onSubmit,
  mode,
  provider,
  loading = false,
}: ProviderFormDialogProps) {
  const [formData, setFormData] = useState({
    business_name: '',
    business_license: '',
    services_offered: [] as string[],
    service_areas: [] as string[],
    verification_status: 'pending' as 'pending' | 'verified' | 'rejected',
    years_experience: 0,
    bio: '',
    is_active: true,
  })

  const [newService, setNewService] = useState('')
  const [newArea, setNewArea] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (mode === 'edit' && provider) {
      setFormData({
        business_name: provider.business_name || '',
        business_license: provider.business_license || '',
        services_offered: provider.services_offered || [],
        service_areas: provider.service_areas || [],
        verification_status: provider.verification_status || 'pending',
        years_experience: provider.years_experience || 0,
        bio: provider.bio || '',
        is_active: true,
      })
    } else {
      setFormData({
        business_name: '',
        business_license: '',
        services_offered: [],
        service_areas: [],
        verification_status: 'pending',
        years_experience: 0,
        bio: '',
        is_active: true,
      })
    }
  }, [mode, provider])

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const addService = () => {
    if (newService.trim() && !formData.services_offered.includes(newService.trim())) {
      handleChange('services_offered', [...formData.services_offered, newService.trim()])
      setNewService('')
    }
  }

  const removeService = (service: string) => {
    handleChange('services_offered', formData.services_offered.filter(s => s !== service))
  }

  const addArea = () => {
    if (newArea.trim() && !formData.service_areas.includes(newArea.trim())) {
      handleChange('service_areas', [...formData.service_areas, newArea.trim()])
      setNewArea('')
    }
  }

  const removeArea = (area: string) => {
    handleChange('service_areas', formData.service_areas.filter(a => a !== area))
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.business_name.trim()) {
      newErrors.business_name = 'Business name is required'
    }

    if (formData.services_offered.length === 0) {
      newErrors.services_offered = 'At least one service is required'
    }

    if (formData.service_areas.length === 0) {
      newErrors.service_areas = 'At least one service area is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = () => {
    if (validateForm()) {
      onSubmit(formData)
    }
  }

  const handleClose = () => {
    setFormData({
      business_name: '',
      business_license: '',
      services_offered: [],
      service_areas: [],
      verification_status: 'pending',
      years_experience: 0,
      bio: '',
      is_active: true,
    })
    setErrors({})
    setNewService('')
    setNewArea('')
    onClose()
  }

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 2 }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        pb: 1,
        borderBottom: 1,
        borderColor: 'divider'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <BusinessIcon color="primary" />
          <Typography variant="h6" fontWeight="600">
            {mode === 'create' ? 'Create New Provider' : 'Edit Provider'}
          </Typography>
        </Box>
        <IconButton onClick={handleClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ pt: 3 }}>
        <Grid container spacing={3}>
          {/* Basic Information */}
          <Grid item xs={12}>
            <Typography variant="h6" color="primary" gutterBottom>
              Basic Information
            </Typography>
            <Divider sx={{ mb: 2 }} />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Business Name"
              value={formData.business_name}
              onChange={(e) => handleChange('business_name', e.target.value)}
              error={!!errors.business_name}
              helperText={errors.business_name}
              sx={{ borderRadius: 2 }}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Business License"
              value={formData.business_license}
              onChange={(e) => handleChange('business_license', e.target.value)}
              sx={{ borderRadius: 2 }}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Years of Experience"
              type="number"
              value={formData.years_experience}
              onChange={(e) => handleChange('years_experience', parseInt(e.target.value) || 0)}
              sx={{ borderRadius: 2 }}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Verification Status</InputLabel>
              <Select
                value={formData.verification_status}
                onChange={(e) => handleChange('verification_status', e.target.value)}
                label="Verification Status"
                sx={{ borderRadius: 2 }}
              >
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="verified">Verified</MenuItem>
                <MenuItem value="rejected">Rejected</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {/* Services Offered */}
          <Grid item xs={12}>
            <Typography variant="h6" color="primary" gutterBottom sx={{ mt: 2 }}>
              Services Offered
            </Typography>
            <Divider sx={{ mb: 2 }} />
          </Grid>

          <Grid item xs={12}>
            <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
              <TextField
                fullWidth
                label="Add Service"
                value={newService}
                onChange={(e) => setNewService(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addService()}
                sx={{ borderRadius: 2 }}
              />
              <Button
                variant="contained"
                onClick={addService}
                startIcon={<AddIcon />}
                sx={{ borderRadius: 2, minWidth: 'auto', px: 2 }}
              >
                Add
              </Button>
            </Box>
            {errors.services_offered && (
              <Typography color="error" variant="caption" sx={{ mb: 1, display: 'block' }}>
                {errors.services_offered}
              </Typography>
            )}
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {formData.services_offered.map((service, index) => (
                <Chip
                  key={index}
                  label={service}
                  onDelete={() => removeService(service)}
                  color="primary"
                  variant="outlined"
                  sx={{ borderRadius: 2 }}
                />
              ))}
            </Box>
          </Grid>

          {/* Service Areas */}
          <Grid item xs={12}>
            <Typography variant="h6" color="primary" gutterBottom sx={{ mt: 2 }}>
              Service Areas
            </Typography>
            <Divider sx={{ mb: 2 }} />
          </Grid>

          <Grid item xs={12}>
            <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
              <TextField
                fullWidth
                label="Add Service Area"
                value={newArea}
                onChange={(e) => setNewArea(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addArea()}
                sx={{ borderRadius: 2 }}
              />
              <Button
                variant="contained"
                onClick={addArea}
                startIcon={<AddIcon />}
                sx={{ borderRadius: 2, minWidth: 'auto', px: 2 }}
              >
                Add
              </Button>
            </Box>
            {errors.service_areas && (
              <Typography color="error" variant="caption" sx={{ mb: 1, display: 'block' }}>
                {errors.service_areas}
              </Typography>
            )}
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {formData.service_areas.map((area, index) => (
                <Chip
                  key={index}
                  label={area}
                  onDelete={() => removeArea(area)}
                  color="secondary"
                  variant="outlined"
                  sx={{ borderRadius: 2 }}
                />
              ))}
            </Box>
          </Grid>

          {/* Bio */}
          <Grid item xs={12}>
            <Typography variant="h6" color="primary" gutterBottom sx={{ mt: 2 }}>
              Additional Information
            </Typography>
            <Divider sx={{ mb: 2 }} />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Bio"
              multiline
              rows={4}
              value={formData.bio}
              onChange={(e) => handleChange('bio', e.target.value)}
              placeholder="Tell us about your business and experience..."
              sx={{ borderRadius: 2 }}
            />
          </Grid>

          {/* Settings */}
          <Grid item xs={12}>
            <Typography variant="h6" color="primary" gutterBottom sx={{ mt: 2 }}>
              Settings
            </Typography>
            <Divider sx={{ mb: 2 }} />
          </Grid>

          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Switch
                  checked={formData.is_active}
                  onChange={(e) => handleChange('is_active', e.target.checked)}
                  color="primary"
                />
              }
              label="Active Provider"
            />
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ 
        p: 3, 
        bgcolor: 'grey.50',
        borderTop: 1,
        borderColor: 'divider'
      }}>
        <Button
          onClick={handleClose}
          variant="outlined"
          sx={{ borderRadius: 2 }}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading}
          sx={{ borderRadius: 2 }}
        >
          {loading ? 'Saving...' : mode === 'create' ? 'Create Provider' : 'Update Provider'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
