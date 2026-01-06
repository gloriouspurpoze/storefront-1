import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  IconButton,
  Switch,
  FormControlLabel,
  Divider,
  Paper,
  Chip,
} from '@mui/material'
import {
  Close as CloseIcon,
  Image as ImageIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'

interface Slider {
  id: string
  title: string
  subtitle?: string
  description?: string
  image_url: string
  image_alt?: string
  button_text?: string
  button_url?: string
  position: number
  is_active: boolean
  start_date?: string
  end_date?: string
  target_audience?: 'all' | 'customers' | 'providers'
  created_at: string
  updated_at: string
}

interface SliderFormDialogProps {
  open: boolean
  onClose: () => void
  onSubmit: (data: any) => void
  mode: 'create' | 'edit'
  slider?: Slider | null
  loading?: boolean
}

export function SliderFormDialog({
  open,
  onClose,
  onSubmit,
  mode,
  slider,
  loading = false,
}: SliderFormDialogProps) {
  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    description: '',
    image_url: '',
    image_alt: '',
    button_text: '',
    button_url: '',
    position: 1,
    is_active: true,
    start_date: null as Date | null,
    end_date: null as Date | null,
    target_audience: 'all' as 'all' | 'customers' | 'providers',
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (mode === 'edit' && slider) {
      setFormData({
        title: slider.title || '',
        subtitle: slider.subtitle || '',
        description: slider.description || '',
        image_url: slider.image_url || '',
        image_alt: slider.image_alt || '',
        button_text: slider.button_text || '',
        button_url: slider.button_url || '',
        position: slider.position || 1,
        is_active: slider.is_active ?? true,
        start_date: slider.start_date ? new Date(slider.start_date) : null,
        end_date: slider.end_date ? new Date(slider.end_date) : null,
        target_audience: slider.target_audience || 'all',
      })
    } else {
      setFormData({
        title: '',
        subtitle: '',
        description: '',
        image_url: '',
        image_alt: '',
        button_text: '',
        button_url: '',
        position: 1,
        is_active: true,
        start_date: null,
        end_date: null,
        target_audience: 'all',
      })
    }
  }, [mode, slider])

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required'
    }

    if (!formData.image_url.trim()) {
      newErrors.image_url = 'Image URL is required'
    }

    if (formData.button_text && !formData.button_url) {
      newErrors.button_url = 'Button URL is required when button text is provided'
    }

    if (formData.start_date && formData.end_date && formData.start_date >= formData.end_date) {
      newErrors.end_date = 'End date must be after start date'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = () => {
    if (validateForm()) {
      const submitData = {
        ...formData,
        start_date: formData.start_date ? formData.start_date.toISOString() : undefined,
        end_date: formData.end_date ? formData.end_date.toISOString() : undefined,
      }
      onSubmit(submitData)
    }
  }

  const handleClose = () => {
    setFormData({
      title: '',
      subtitle: '',
      description: '',
      image_url: '',
      image_alt: '',
      button_text: '',
      button_url: '',
      position: 1,
      is_active: true,
      start_date: null,
      end_date: null,
      target_audience: 'all',
    })
    setErrors({})
    onClose()
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
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
            <ImageIcon color="primary" />
            <Typography variant="h6" fontWeight="600">
              {mode === 'create' ? 'Create New Slider' : 'Edit Slider'}
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
                label="Title *"
                value={formData.title}
                onChange={(e) => handleChange('title', e.target.value)}
                error={!!errors.title}
                helperText={errors.title}
                sx={{ borderRadius: 2 }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Subtitle"
                value={formData.subtitle}
                onChange={(e) => handleChange('subtitle', e.target.value)}
                sx={{ borderRadius: 2 }}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                multiline
                rows={3}
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                placeholder="Enter slider description..."
                sx={{ borderRadius: 2 }}
              />
            </Grid>

            {/* Image Information */}
            <Grid item xs={12}>
              <Typography variant="h6" color="primary" gutterBottom sx={{ mt: 2 }}>
                Image Information
              </Typography>
              <Divider sx={{ mb: 2 }} />
            </Grid>

            <Grid item xs={12} md={8}>
              <TextField
                fullWidth
                label="Image URL *"
                value={formData.image_url}
                onChange={(e) => handleChange('image_url', e.target.value)}
                error={!!errors.image_url}
                helperText={errors.image_url}
                placeholder="https://example.com/image.jpg"
                sx={{ borderRadius: 2 }}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Image Alt Text"
                value={formData.image_alt}
                onChange={(e) => handleChange('image_alt', e.target.value)}
                placeholder="Alt text for accessibility"
                sx={{ borderRadius: 2 }}
              />
            </Grid>

            {/* Image Preview */}
            {formData.image_url && (
              <Grid item xs={12}>
                <Paper sx={{ p: 2, borderRadius: 2, bgcolor: 'grey.50' }}>
                  <Typography variant="body2" fontWeight="500" gutterBottom>
                    Image Preview:
                  </Typography>
                  <Box
                    sx={{
                      width: '100%',
                      maxWidth: 400,
                      height: 200,
                      borderRadius: 2,
                      overflow: 'hidden',
                      border: '1px solid',
                      borderColor: 'grey.300',
                      bgcolor: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <img
                      src={formData.image_url}
                      alt={formData.image_alt || formData.title}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover'
                      }}
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none'
                      }}
                    />
                  </Box>
                </Paper>
              </Grid>
            )}

            {/* Call to Action */}
            <Grid item xs={12}>
              <Typography variant="h6" color="primary" gutterBottom sx={{ mt: 2 }}>
                Call to Action
              </Typography>
              <Divider sx={{ mb: 2 }} />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Button Text"
                value={formData.button_text}
                onChange={(e) => handleChange('button_text', e.target.value)}
                placeholder="e.g., Learn More, Get Started"
                sx={{ borderRadius: 2 }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Button URL"
                value={formData.button_url}
                onChange={(e) => handleChange('button_url', e.target.value)}
                error={!!errors.button_url}
                helperText={errors.button_url}
                placeholder="https://example.com/action"
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

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Position"
                type="number"
                value={formData.position}
                onChange={(e) => handleChange('position', parseInt(e.target.value) || 1)}
                inputProps={{ min: 1 }}
                sx={{ borderRadius: 2 }}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Target Audience</InputLabel>
                <Select
                  value={formData.target_audience}
                  onChange={(e) => handleChange('target_audience', e.target.value)}
                  label="Target Audience"
                  sx={{ borderRadius: 2 }}
                >
                  <MenuItem value="all">All Users</MenuItem>
                  <MenuItem value="customers">Customers Only</MenuItem>
                  <MenuItem value="providers">Providers Only</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={4}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.is_active}
                    onChange={(e) => handleChange('is_active', e.target.checked)}
                    color="primary"
                  />
                }
                label="Active"
                sx={{ mt: 2 }}
              />
            </Grid>

            {/* Schedule */}
            <Grid item xs={12}>
              <Typography variant="h6" color="primary" gutterBottom sx={{ mt: 2 }}>
                Schedule (Optional)
              </Typography>
              <Divider sx={{ mb: 2 }} />
            </Grid>

            <Grid item xs={12} md={6}>
              <DatePicker
                label="Start Date"
                value={formData.start_date}
                onChange={(date) => handleChange('start_date', date)}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    sx: { borderRadius: 2 }
                  }
                }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <DatePicker
                label="End Date"
                value={formData.end_date}
                onChange={(date) => handleChange('end_date', date)}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    error: !!errors.end_date,
                    helperText: errors.end_date,
                    sx: { borderRadius: 2 }
                  }
                }}
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
            {loading ? 'Saving...' : mode === 'create' ? 'Create Slider' : 'Update Slider'}
          </Button>
        </DialogActions>
      </Dialog>
    </LocalizationProvider>
  )
}
