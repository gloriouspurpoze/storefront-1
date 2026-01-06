import React, { useState, useCallback, useEffect } from 'react'
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
  Switch,
  FormControlLabel,
  Box,
  Typography,
  Chip,
  IconButton,
  Paper,
  Alert,
  Divider,
  InputAdornment,
  Card,
  CardContent,
  CardMedia,
  Tooltip,
  LinearProgress,
  Zoom,
  Fade,
  Stepper,
  Step,
  StepLabel,
  alpha,
} from '@mui/material'
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  CloudUpload as CloudUploadIcon,
  Image as ImageIcon,
  Close as CloseIcon,
  Info as InfoIcon,
  CheckCircle as CheckCircleIcon,
  Edit as EditIcon,
  AttachMoney as AttachMoneyIcon,
  Schedule as ScheduleIcon,
  Settings as SettingsIcon,
  Label as LabelIcon,
  Build as BuildIcon,
  School as SchoolIcon,
  VerifiedUser as VerifiedUserIcon,
  Star as StarIcon,
  Visibility as VisibilityIcon,
} from '@mui/icons-material'
import ReactQuill from 'react-quill-new'
import 'react-quill-new/dist/quill.snow.css'
import { useDropzone } from 'react-dropzone'

interface ServiceImage {
  url: string
  file?: File
}

interface ServiceFormData {
  name: string
  slug: string
  description: string
  short_description: string
  category: string
  base_price: string
  price_type: 'fixed' | 'hourly' | 'quote'
  duration_minutes: string
  is_popular: boolean
  is_active: boolean
  is_featured: boolean
  sort_order: number
  requirements: {
    tools: string[]
    skills: string[]
    licenses: string[]
  }
  tags: string[]
  images: ServiceImage[]
  icon?: string
}

interface ServiceFormDialogProps {
  open: boolean
  onClose: () => void
  onSubmit: (data: ServiceFormData) => void
  mode: 'create' | 'edit'
  initialData?: Partial<ServiceFormData>
  loading?: boolean
}

const CATEGORIES = [
  { value: 'home_repair', label: 'Home Repair' },
  { value: 'home_improvement', label: 'Home Improvement' },
  { value: 'cleaning', label: 'Cleaning' },
  { value: 'outdoor', label: 'Outdoor' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'installation', label: 'Installation' },
  { value: 'emergency', label: 'Emergency' },
  { value: 'consultation', label: 'Consultation' },
]

const PRICE_TYPES = [
  { value: 'fixed', label: 'Fixed Price' },
  { value: 'hourly', label: 'Hourly Rate' },
  { value: 'quote', label: 'Quote Based' },
]

const quillModules = {
  toolbar: [
    [{ 'header': [1, 2, 3, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
    [{ 'indent': '-1'}, { 'indent': '+1' }],
    [{ 'color': [] }, { 'background': [] }],
    ['link'],
    ['clean']
  ],
}

const quillFormats = [
  'header', 'bold', 'italic', 'underline', 'strike',
  'list', 'bullet', 'indent', 'color', 'background', 'link'
]

export function ServiceFormDialog({
  open,
  onClose,
  onSubmit,
  mode,
  initialData,
  loading = false
}: ServiceFormDialogProps) {
  const [formData, setFormData] = useState<ServiceFormData>({
    name: '',
    slug: '',
    description: '',
    short_description: '',
    category: '',
    base_price: '',
    price_type: 'fixed',
    duration_minutes: '',
    is_popular: false,
    is_active: true,
    is_featured: false,
    sort_order: 0,
    requirements: {
      tools: [],
      skills: [],
      licenses: []
    },
    tags: [],
    images: [],
    icon: '',
    ...initialData
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [newTag, setNewTag] = useState('')
  const [newTool, setNewTool] = useState('')
  const [newSkill, setNewSkill] = useState('')
  const [newLicense, setNewLicense] = useState('')
  const [completionPercentage, setCompletionPercentage] = useState(0)

  // Update form data when initialData changes (for edit mode)
  useEffect(() => {
    if (open && initialData) {
      setFormData({
        name: initialData.name || '',
        slug: initialData.slug || '',
        description: initialData.description || '',
        short_description: initialData.short_description || '',
        category: initialData.category || '',
        base_price: initialData.base_price || '',
        price_type: initialData.price_type || 'fixed',
        duration_minutes: initialData.duration_minutes || '',
        is_popular: initialData.is_popular || false,
        is_active: initialData.is_active !== undefined ? initialData.is_active : true,
        is_featured: initialData.is_featured || false,
        sort_order: initialData.sort_order || 0,
        requirements: {
          tools: initialData.requirements?.tools || [],
          skills: initialData.requirements?.skills || [],
          licenses: initialData.requirements?.licenses || [],
        },
        tags: initialData.tags || [],
        images: initialData.images || [],
        icon: initialData.icon || '',
      })
      // Clear errors and input fields
      setErrors({})
      setNewTag('')
      setNewTool('')
      setNewSkill('')
      setNewLicense('')
    } else if (open && !initialData) {
      // Reset form for create mode
      setFormData({
        name: '',
        slug: '',
        description: '',
        short_description: '',
        category: '',
        base_price: '',
        price_type: 'fixed',
        duration_minutes: '',
        is_popular: false,
        is_active: true,
        is_featured: false,
        sort_order: 0,
        requirements: {
          tools: [],
          skills: [],
          licenses: []
        },
        tags: [],
        images: [],
        icon: '',
      })
      // Clear errors and input fields
      setErrors({})
      setNewTag('')
      setNewTool('')
      setNewSkill('')
      setNewLicense('')
    }
  }, [open, initialData])

  // Calculate form completion percentage
  useEffect(() => {
    const fields = [
      formData.name,
      formData.description,
      formData.category,
      formData.base_price,
      formData.duration_minutes,
      formData.images.length > 0 ? 'hasImages' : '',
      formData.short_description,
    ]
    const filledFields = fields.filter(field => field && field.toString().trim() !== '').length
    const percentage = Math.round((filledFields / fields.length) * 100)
    setCompletionPercentage(percentage)
  }, [formData])

  // Auto-generate slug from name
  useEffect(() => {
    if (formData.name && !initialData?.slug && mode === 'create') {
      const slug = formData.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
      setFormData(prev => ({ ...prev, slug }))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.name, mode])

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFormData(prev => {
      const currentImages = prev.images
      const remainingSlots = 4 - currentImages.length
      
      if (remainingSlots <= 0) {
        return prev // Already have 4 images
      }
      
      const newImages = acceptedFiles
        .slice(0, remainingSlots)
        .filter(file => file.type.startsWith('image/'))
        .map(file => ({
          url: URL.createObjectURL(file),
          file: file
        }))
      
      return {
        ...prev,
        images: [...currentImages, ...newImages]
      }
    })
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp']
    },
    multiple: true,
    maxFiles: 4
  })

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const handleRequirementsChange = (type: 'tools' | 'skills' | 'licenses', value: string[]) => {
    setFormData(prev => ({
      ...prev,
      requirements: { ...prev.requirements, [type]: value }
    }))
  }

  const addItem = (type: 'tags' | 'tools' | 'skills' | 'licenses', value: string) => {
    if (!value.trim()) return
    
    if (type === 'tags') {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, value.trim()]
      }))
      setNewTag('')
    } else {
      handleRequirementsChange(type as 'tools' | 'skills' | 'licenses', [
        ...formData.requirements[type as 'tools' | 'skills' | 'licenses'],
        value.trim()
      ])
      if (type === 'tools') setNewTool('')
      if (type === 'skills') setNewSkill('')
      if (type === 'licenses') setNewLicense('')
    }
  }

  const removeItem = (type: 'tags' | 'tools' | 'skills' | 'licenses', index: number) => {
    if (type === 'tags') {
      setFormData(prev => ({
        ...prev,
        tags: prev.tags.filter((_, i) => i !== index)
      }))
    } else {
      const currentItems = formData.requirements[type as 'tools' | 'skills' | 'licenses']
      handleRequirementsChange(type as 'tools' | 'skills' | 'licenses', 
        currentItems.filter((_, i) => i !== index)
      )
    }
  }

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }))
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Service name is required'
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required'
    }

    if (!formData.category) {
      newErrors.category = 'Category is required'
    }

    if (formData.base_price && isNaN(Number(formData.base_price))) {
      newErrors.base_price = 'Base price must be a valid number'
    }

    if (formData.duration_minutes && isNaN(Number(formData.duration_minutes))) {
      newErrors.duration_minutes = 'Duration must be a valid number'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = () => {
    console.log('Form submit button clicked')
    console.log('Current form data:', formData)
    
    if (validateForm()) {
      console.log('Form validation passed, submitting...')
      onSubmit(formData)
    } else {
      console.log('Form validation failed, errors:', errors)
    }
  }

  const handleClose = () => {
    setFormData({
      name: '',
      slug: '',
      description: '',
      short_description: '',
      category: '',
      base_price: '',
      price_type: 'fixed',
      duration_minutes: '',
      is_popular: false,
      is_active: true,
      is_featured: false,
      sort_order: 0,
      requirements: {
        tools: [],
        skills: [],
        licenses: []
      },
      tags: [],
      images: [],
      icon: '',
    })
    setErrors({})
    onClose()
  }

  return (
    <Dialog 
      open={open} 
      onClose={handleClose} 
      maxWidth="lg" 
      fullWidth
      TransitionComponent={Zoom}
      PaperProps={{
        elevation: 24,
        sx: {
          borderRadius: 3,
          overflow: 'hidden',
        }
      }}
    >
      <DialogTitle 
        sx={{ 
          pb: 2,
          pt: 3,
          px: 4,
          background: (theme) => `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
          color: 'white',
          position: 'relative',
        }}
      >
        <IconButton
          onClick={handleClose}
          disabled={loading}
          sx={{
            position: 'absolute',
            right: 16,
            top: 16,
            color: 'white',
            '&:hover': {
              bgcolor: alpha('#fff', 0.1),
            }
          }}
        >
          <CloseIcon />
        </IconButton>
        
        <Box>
          <Typography variant="h4" component="div" sx={{ fontWeight: 700, mb: 1 }}>
            {mode === 'create' ? 'Create New Service' : 'Edit Service'}
          </Typography>
          <Typography variant="body1" sx={{ opacity: 0.9, mb: 2 }}>
            {mode === 'create' 
              ? 'Add a new service to your platform' 
              : 'Update service information and settings'
            }
          </Typography>
          
          {/* Completion Progress */}
          <Box sx={{ mt: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="caption" sx={{ fontWeight: 500 }}>
                Form Completion
              </Typography>
              <Typography variant="caption" sx={{ fontWeight: 700 }}>
                {completionPercentage}%
              </Typography>
            </Box>
            <LinearProgress 
              variant="determinate" 
              value={completionPercentage}
              sx={{
                height: 6,
                borderRadius: 3,
                bgcolor: alpha('#fff', 0.2),
                '& .MuiLinearProgress-bar': {
                  bgcolor: 'white',
                  borderRadius: 3,
                }
              }}
            />
          </Box>
        </Box>
      </DialogTitle>

      {loading && <LinearProgress />}

      <DialogContent sx={{ p: 0, bgcolor: 'grey.50' }}>
        <Box sx={{ p: 4 }}>
          <Grid container spacing={3}>

            {/* Basic Information Section */}
            <Grid item xs={12}>
              <Card 
                elevation={0}
                sx={{ 
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 3,
                  overflow: 'visible',
                  bgcolor: 'background.paper',
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                    <Box
                      sx={{
                        width: 48,
                        height: 48,
                        borderRadius: 2,
                        bgcolor: 'primary.50',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mr: 2,
                      }}
                    >
                      <EditIcon sx={{ color: 'primary.main', fontSize: 24 }} />
                    </Box>
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary' }}>
                        Basic Information
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Essential details about your service
                      </Typography>
                    </Box>
                  </Box>

                  <Grid container spacing={2.5}>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Service Name"
                        required
                        value={formData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        error={!!errors.name}
                        helperText={errors.name || 'Enter a clear, descriptive name'}
                        placeholder="e.g., Leaky Faucet Repair"
                        InputProps={{
                          endAdornment: formData.name && (
                            <InputAdornment position="end">
                              <CheckCircleIcon sx={{ color: 'success.main', fontSize: 20 }} />
                            </InputAdornment>
                          ),
                        }}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 2,
                            transition: 'all 0.2s',
                            '&:hover': {
                              boxShadow: '0 0 0 2px rgba(25, 118, 210, 0.08)',
                            },
                            '&.Mui-focused': {
                              boxShadow: '0 0 0 2px rgba(25, 118, 210, 0.12)',
                            }
                          }
                        }}
                      />
                    </Grid>

                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="URL Slug"
                        value={formData.slug}
                        onChange={(e) => handleInputChange('slug', e.target.value)}
                        placeholder="auto-generated-from-name"
                        helperText="URL-friendly version (auto-generated)"
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <Typography variant="caption" color="text.secondary">/services/</Typography>
                            </InputAdornment>
                          ),
                        }}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 2,
                            fontFamily: 'monospace',
                          }
                        }}
                      />
                    </Grid>

                    <Grid item xs={12} md={6}>
                      <FormControl fullWidth error={!!errors.category}>
                        <InputLabel>Category *</InputLabel>
                        <Select
                          value={formData.category}
                          label="Category *"
                          onChange={(e) => handleInputChange('category', e.target.value)}
                          sx={{
                            borderRadius: 2,
                            transition: 'all 0.2s',
                            '&:hover': {
                              boxShadow: '0 0 0 2px rgba(25, 118, 210, 0.08)',
                            },
                          }}
                          MenuProps={{
                            PaperProps: {
                              sx: {
                                borderRadius: 2,
                                mt: 1,
                                '& .MuiMenuItem-root': {
                                  borderRadius: 1,
                                  mx: 1,
                                  my: 0.5,
                                }
                              }
                            }
                          }}
                        >
                          {CATEGORIES.map((cat) => (
                            <MenuItem key={cat.value} value={cat.value}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Box 
                                  sx={{ 
                                    width: 6, 
                                    height: 6, 
                                    borderRadius: '50%', 
                                    bgcolor: 'primary.main' 
                                  }} 
                                />
                                {cat.label}
                              </Box>
                            </MenuItem>
                          ))}
                        </Select>
                        {errors.category && (
                          <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.75, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <InfoIcon sx={{ fontSize: 14 }} />
                            {errors.category}
                          </Typography>
                        )}
                      </FormControl>
                    </Grid>

                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Short Description"
                        value={formData.short_description}
                        onChange={(e) => handleInputChange('short_description', e.target.value)}
                        placeholder="Brief overview for listings (max 120 chars)"
                        multiline
                        rows={2}
                        inputProps={{ maxLength: 120 }}
                        helperText={`${formData.short_description.length}/120 characters`}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 2,
                          }
                        }}
                      />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            {/* Description Section */}
            <Grid item xs={12}>
              <Card 
                elevation={0}
                sx={{ 
                  border: '1px solid',
                  borderColor: errors.description ? 'error.main' : 'divider',
                  borderRadius: 3,
                  bgcolor: 'background.paper',
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                    <Box
                      sx={{
                        width: 48,
                        height: 48,
                        borderRadius: 2,
                        bgcolor: 'info.50',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mr: 2,
                      }}
                    >
                      <EditIcon sx={{ color: 'info.main', fontSize: 24 }} />
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary' }}>
                        Detailed Description *
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Provide comprehensive information about this service
                      </Typography>
                    </Box>
                    {formData.description && formData.description.replace(/<[^>]*>/g, '').length > 50 && (
                      <Chip 
                        icon={<CheckCircleIcon />} 
                        label="Complete" 
                        size="small" 
                        color="success" 
                        variant="outlined"
                      />
                    )}
                  </Box>

                  <Box sx={{ 
                    border: errors.description ? '2px solid' : '1px solid', 
                    borderColor: errors.description ? 'error.main' : 'divider',
                    borderRadius: 2,
                    overflow: 'hidden',
                    transition: 'all 0.2s',
                    '&:hover': {
                      boxShadow: '0 0 0 2px rgba(25, 118, 210, 0.08)',
                    },
                    '& .ql-toolbar': {
                      borderBottom: '1px solid',
                      borderColor: 'divider',
                      backgroundColor: 'grey.50'
                    },
                    '& .ql-container': {
                      minHeight: '200px',
                      fontSize: '14px',
                      fontFamily: 'inherit',
                    },
                    '& .ql-editor': {
                      minHeight: '200px',
                    }
                  }}>
                    <ReactQuill
                      theme="snow"
                      value={formData.description}
                      onChange={(value) => handleInputChange('description', value)}
                      modules={quillModules}
                      formats={quillFormats}
                      placeholder="Describe what's included, process, benefits, and any important details customers should know..."
                    />
                  </Box>
                  {errors.description && (
                    <Alert severity="error" sx={{ mt: 2, borderRadius: 2 }}>
                      {errors.description}
                    </Alert>
                  )}
                </CardContent>
              </Card>
            </Grid>

            {/* Pricing & Duration Section */}
            <Grid item xs={12}>
              <Card 
                elevation={0}
                sx={{ 
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 3,
                  bgcolor: 'background.paper',
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                    <Box
                      sx={{
                        width: 48,
                        height: 48,
                        borderRadius: 2,
                        bgcolor: 'success.50',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mr: 2,
                      }}
                    >
                      <AttachMoneyIcon sx={{ color: 'success.main', fontSize: 24 }} />
                    </Box>
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary' }}>
                        Pricing & Duration
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Set pricing structure and estimated completion time
                      </Typography>
                    </Box>
                  </Box>

                  <Grid container spacing={2.5}>
                    <Grid item xs={12} md={4}>
                      <FormControl fullWidth>
                        <InputLabel>Price Type *</InputLabel>
                        <Select
                          value={formData.price_type}
                          label="Price Type *"
                          onChange={(e) => handleInputChange('price_type', e.target.value)}
                          sx={{ 
                            borderRadius: 2,
                            transition: 'all 0.2s',
                            '&:hover': {
                              boxShadow: '0 0 0 2px rgba(46, 125, 50, 0.08)',
                            },
                          }}
                          MenuProps={{
                            PaperProps: {
                              sx: {
                                borderRadius: 2,
                                mt: 1,
                                '& .MuiMenuItem-root': {
                                  borderRadius: 1,
                                  mx: 1,
                                  my: 0.5,
                                }
                              }
                            }
                          }}
                        >
                          {PRICE_TYPES.map((type) => (
                            <MenuItem key={type.value} value={type.value}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <AttachMoneyIcon sx={{ fontSize: 18, color: 'success.main' }} />
                                {type.label}
                              </Box>
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>

                    <Grid item xs={12} md={4}>
                      <TextField
                        fullWidth
                        label="Base Price"
                        type="number"
                        value={formData.base_price}
                        onChange={(e) => handleInputChange('base_price', e.target.value)}
                        error={!!errors.base_price}
                        helperText={errors.base_price || 'Leave empty for quote-based pricing'}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <Typography variant="body1" sx={{ fontWeight: 600, color: 'success.main' }}>
                                $
                              </Typography>
                            </InputAdornment>
                          ),
                          endAdornment: formData.base_price && (
                            <InputAdornment position="end">
                              <Chip 
                                label={`${formData.base_price} USD`} 
                                size="small" 
                                color="success" 
                                variant="outlined"
                              />
                            </InputAdornment>
                          ),
                        }}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 2,
                            '&:hover': {
                              boxShadow: '0 0 0 2px rgba(46, 125, 50, 0.08)',
                            },
                          }
                        }}
                      />
                    </Grid>

                    <Grid item xs={12} md={4}>
                      <TextField
                        fullWidth
                        label="Duration (minutes)"
                        type="number"
                        value={formData.duration_minutes}
                        onChange={(e) => handleInputChange('duration_minutes', e.target.value)}
                        error={!!errors.duration_minutes}
                        helperText={errors.duration_minutes || `${formData.duration_minutes ? `~${Math.round(Number(formData.duration_minutes) / 60)} hours` : 'Estimated time'}`}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <ScheduleIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                            </InputAdornment>
                          ),
                        }}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 2,
                          }
                        }}
                      />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            {/* Image Upload Section */}
            <Grid item xs={12}>
              <Card 
                elevation={0}
                sx={{ 
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 3,
                  bgcolor: 'background.paper',
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                    <Box
                      sx={{
                        width: 48,
                        height: 48,
                        borderRadius: 2,
                        bgcolor: 'warning.50',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mr: 2,
                      }}
                    >
                      <ImageIcon sx={{ color: 'warning.main', fontSize: 24 }} />
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary' }}>
                        Service Images
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Upload up to 4 images for your service
                      </Typography>
                    </Box>
                    <Chip 
                      label={`${formData.images.length}/4`}
                      size="small" 
                      color={formData.images.length >= 4 ? 'error' : formData.images.length > 0 ? 'success' : 'default'}
                      variant="outlined"
                    />
                  </Box>

                  {/* Image Gallery Grid */}
                  {formData.images.length > 0 && (
                    <Grid container spacing={2} sx={{ mb: 3 }}>
                      {formData.images.map((image, index) => (
                        <Grid item xs={12} sm={6} md={3} key={index}>
                          <Card 
                            elevation={0}
                            sx={{ 
                              border: '2px solid',
                              borderColor: 'success.light',
                              borderRadius: 2, 
                              overflow: 'hidden',
                              position: 'relative',
                              height: '100%',
                            }}
                          >
                            <Box sx={{ position: 'relative' }}>
                              {index === 0 && (
                                <Chip 
                                  label="Primary" 
                                  size="small" 
                                  color="primary"
                                  sx={{ 
                                    position: 'absolute', 
                                    top: 8, 
                                    left: 8, 
                                    zIndex: 1,
                                    fontWeight: 600,
                                  }} 
                                />
                              )}
                              <Tooltip title="Remove image">
                                <IconButton 
                                  size="small" 
                                  onClick={() => removeImage(index)} 
                                  sx={{ 
                                    position: 'absolute',
                                    top: 8,
                                    right: 8,
                                    zIndex: 1,
                                    bgcolor: 'rgba(0,0,0,0.6)',
                                    color: 'white',
                                    '&:hover': { 
                                      bgcolor: 'error.main',
                                    }
                                  }}
                                >
                                  <CloseIcon sx={{ fontSize: 18 }} />
                                </IconButton>
                              </Tooltip>
                              <CardMedia
                                component="img"
                                height="180"
                                image={image.url}
                                alt={`Service image ${index + 1}`}
                                sx={{ 
                                  objectFit: 'cover',
                                  transition: 'transform 0.3s',
                                  '&:hover': {
                                    transform: 'scale(1.05)',
                                  }
                                }}
                              />
                            </Box>
                            <CardContent sx={{ p: 1.5, bgcolor: 'background.paper' }}>
                              <Typography variant="caption" sx={{ fontWeight: 600, display: 'block' }} noWrap>
                                {image.file?.name || `Image ${index + 1}`}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {image.file ? `${(image.file.size / 1024).toFixed(1)} KB` : 'External'}
                              </Typography>
                            </CardContent>
                          </Card>
                        </Grid>
                      ))}
                    </Grid>
                  )}

                  {/* Upload Zone - Show if less than 4 images */}
                  {formData.images.length < 4 && (
                    <Paper
                      {...getRootProps()}
                      elevation={0}
                      sx={{
                        p: 4,
                        textAlign: 'center',
                        border: '2px dashed',
                        borderColor: isDragActive ? 'primary.main' : 'divider',
                        borderRadius: 2,
                        cursor: 'pointer',
                        bgcolor: isDragActive ? 'primary.50' : 'background.default',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        '&:hover': {
                          borderColor: 'primary.main',
                          bgcolor: 'primary.50',
                          transform: 'translateY(-2px)',
                          boxShadow: '0 8px 16px rgba(0,0,0,0.08)',
                        }
                      }}
                    >
                      <input {...getInputProps()} />
                      <CloudUploadIcon 
                        sx={{ 
                          fontSize: formData.images.length > 0 ? 48 : 64, 
                          color: isDragActive ? 'primary.main' : 'text.secondary',
                          mb: 2,
                          transition: 'all 0.3s',
                        }} 
                      />
                      <Typography variant={formData.images.length > 0 ? 'subtitle1' : 'h6'} gutterBottom sx={{ fontWeight: 700, color: 'text.primary' }}>
                        {isDragActive 
                          ? 'Drop images here!' 
                          : formData.images.length > 0 
                            ? `Add ${4 - formData.images.length} more image${4 - formData.images.length !== 1 ? 's' : ''}` 
                            : 'Drop images here or click to browse'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        {formData.images.length > 0 
                          ? `You can add up to ${4 - formData.images.length} more image${4 - formData.images.length !== 1 ? 's' : ''}`
                          : 'Recommended: 1200x800px, max 5MB per image'}
                      </Typography>
                      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, flexWrap: 'wrap' }}>
                        {['JPEG', 'PNG', 'WebP', 'GIF'].map(format => (
                          <Chip 
                            key={format}
                            label={format} 
                            size="small" 
                            variant="outlined" 
                            sx={{ borderRadius: 1 }}
                          />
                        ))}
                      </Box>
                    </Paper>
                  )}

                  {/* Max images reached message */}
                  {formData.images.length >= 4 && (
                    <Alert severity="info" sx={{ borderRadius: 2 }}>
                      Maximum of 4 images reached. Remove an image to upload a new one.
                    </Alert>
                  )}
                </CardContent>
              </Card>
            </Grid>

            {/* Requirements Section */}
            <Grid item xs={12}>
              <Card 
                elevation={0}
                sx={{ 
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 3,
                  bgcolor: 'background.paper',
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                    <Box
                      sx={{
                        width: 48,
                        height: 48,
                        borderRadius: 2,
                        bgcolor: 'error.50',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mr: 2,
                      }}
                    >
                      <BuildIcon sx={{ color: 'error.main', fontSize: 24 }} />
                    </Box>
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary' }}>
                        Service Requirements
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Specify tools, skills, and licenses needed for this service
                      </Typography>
                    </Box>
                  </Box>

                  <Grid container spacing={2.5}>
                    {/* Tools */}
                    <Grid item xs={12} md={4}>
                      <Paper 
                        elevation={0}
                        sx={{ 
                          p: 2.5, 
                          border: '1px solid',
                          borderColor: 'divider',
                          borderRadius: 2,
                          bgcolor: 'background.default',
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                          <BuildIcon sx={{ fontSize: 20, color: 'error.main', mr: 1 }} />
                          <Typography variant="subtitle2" sx={{ fontWeight: 600, flex: 1 }}>
                            Required Tools
                          </Typography>
                          <Chip 
                            label={formData.requirements.tools.length} 
                            size="small" 
                            sx={{ height: 20, fontSize: '0.7rem' }}
                          />
                        </Box>
                        <Box display="flex" flexWrap="wrap" gap={1} mb={2} minHeight={40}>
                          {formData.requirements.tools.length === 0 ? (
                            <Typography variant="caption" color="text.secondary" sx={{ py: 1 }}>
                              No tools added yet
                            </Typography>
                          ) : (
                            formData.requirements.tools.map((tool, index) => (
                              <Zoom in key={index}>
                                <Chip
                                  label={tool}
                                  onDelete={() => removeItem('tools', index)}
                                  size="small"
                                  color="error"
                                  variant="outlined"
                                  sx={{ borderRadius: 1.5 }}
                                />
                              </Zoom>
                            ))
                          )}
                        </Box>
                        <Box display="flex" gap={1}>
                          <TextField
                            size="small"
                            fullWidth
                            placeholder="e.g., Wrench, Drill..."
                            value={newTool}
                            onChange={(e) => setNewTool(e.target.value)}
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault()
                                addItem('tools', newTool)
                              }
                            }}
                            sx={{
                              '& .MuiOutlinedInput-root': {
                                borderRadius: 1.5,
                              }
                            }}
                          />
                          <Tooltip title="Add tool">
                            <span>
                              <IconButton
                                size="small"
                                onClick={() => addItem('tools', newTool)}
                                disabled={!newTool.trim()}
                                sx={{ 
                                  bgcolor: 'error.50',
                                  '&:hover': { bgcolor: 'error.100' },
                                  '&.Mui-disabled': { bgcolor: 'action.disabledBackground' }
                                }}
                              >
                                <AddIcon sx={{ fontSize: 18 }} />
                              </IconButton>
                            </span>
                          </Tooltip>
                        </Box>
                      </Paper>
                    </Grid>

                    {/* Skills */}
                    <Grid item xs={12} md={4}>
                      <Paper 
                        elevation={0}
                        sx={{ 
                          p: 2.5, 
                          border: '1px solid',
                          borderColor: 'divider',
                          borderRadius: 2,
                          bgcolor: 'background.default',
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                          <SchoolIcon sx={{ fontSize: 20, color: 'warning.main', mr: 1 }} />
                          <Typography variant="subtitle2" sx={{ fontWeight: 600, flex: 1 }}>
                            Required Skills
                          </Typography>
                          <Chip 
                            label={formData.requirements.skills.length} 
                            size="small" 
                            sx={{ height: 20, fontSize: '0.7rem' }}
                          />
                        </Box>
                        <Box display="flex" flexWrap="wrap" gap={1} mb={2} minHeight={40}>
                          {formData.requirements.skills.length === 0 ? (
                            <Typography variant="caption" color="text.secondary" sx={{ py: 1 }}>
                              No skills added yet
                            </Typography>
                          ) : (
                            formData.requirements.skills.map((skill, index) => (
                              <Zoom in key={index}>
                                <Chip
                                  label={skill}
                                  onDelete={() => removeItem('skills', index)}
                                  size="small"
                                  color="warning"
                                  variant="outlined"
                                  sx={{ borderRadius: 1.5 }}
                                />
                              </Zoom>
                            ))
                          )}
                        </Box>
                        <Box display="flex" gap={1}>
                          <TextField
                            size="small"
                            fullWidth
                            placeholder="e.g., Plumbing, Carpentry..."
                            value={newSkill}
                            onChange={(e) => setNewSkill(e.target.value)}
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault()
                                addItem('skills', newSkill)
                              }
                            }}
                            sx={{
                              '& .MuiOutlinedInput-root': {
                                borderRadius: 1.5,
                              }
                            }}
                          />
                          <Tooltip title="Add skill">
                            <span>
                              <IconButton
                                size="small"
                                onClick={() => addItem('skills', newSkill)}
                                disabled={!newSkill.trim()}
                                sx={{ 
                                  bgcolor: 'warning.50',
                                  '&:hover': { bgcolor: 'warning.100' },
                                  '&.Mui-disabled': { bgcolor: 'action.disabledBackground' }
                                }}
                              >
                                <AddIcon sx={{ fontSize: 18 }} />
                              </IconButton>
                            </span>
                          </Tooltip>
                        </Box>
                      </Paper>
                    </Grid>

                    {/* Licenses */}
                    <Grid item xs={12} md={4}>
                      <Paper 
                        elevation={0}
                        sx={{ 
                          p: 2.5, 
                          border: '1px solid',
                          borderColor: 'divider',
                          borderRadius: 2,
                          bgcolor: 'background.default',
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                          <VerifiedUserIcon sx={{ fontSize: 20, color: 'success.main', mr: 1 }} />
                          <Typography variant="subtitle2" sx={{ fontWeight: 600, flex: 1 }}>
                            Required Licenses
                          </Typography>
                          <Chip 
                            label={formData.requirements.licenses.length} 
                            size="small" 
                            sx={{ height: 20, fontSize: '0.7rem' }}
                          />
                        </Box>
                        <Box display="flex" flexWrap="wrap" gap={1} mb={2} minHeight={40}>
                          {formData.requirements.licenses.length === 0 ? (
                            <Typography variant="caption" color="text.secondary" sx={{ py: 1 }}>
                              No licenses added yet
                            </Typography>
                          ) : (
                            formData.requirements.licenses.map((license, index) => (
                              <Zoom in key={index}>
                                <Chip
                                  label={license}
                                  onDelete={() => removeItem('licenses', index)}
                                  size="small"
                                  color="success"
                                  variant="outlined"
                                  sx={{ borderRadius: 1.5 }}
                                />
                              </Zoom>
                            ))
                          )}
                        </Box>
                        <Box display="flex" gap={1}>
                          <TextField
                            size="small"
                            fullWidth
                            placeholder="e.g., EPA 608, Licensed..."
                            value={newLicense}
                            onChange={(e) => setNewLicense(e.target.value)}
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault()
                                addItem('licenses', newLicense)
                              }
                            }}
                            sx={{
                              '& .MuiOutlinedInput-root': {
                                borderRadius: 1.5,
                              }
                            }}
                          />
                          <Tooltip title="Add license">
                            <span>
                              <IconButton
                                size="small"
                                onClick={() => addItem('licenses', newLicense)}
                                disabled={!newLicense.trim()}
                                sx={{ 
                                  bgcolor: 'success.50',
                                  '&:hover': { bgcolor: 'success.100' },
                                  '&.Mui-disabled': { bgcolor: 'action.disabledBackground' }
                                }}
                              >
                                <AddIcon sx={{ fontSize: 18 }} />
                              </IconButton>
                            </span>
                          </Tooltip>
                        </Box>
                      </Paper>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            {/* Tags Section */}
            <Grid item xs={12}>
              <Card 
                elevation={0}
                sx={{ 
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 3,
                  bgcolor: 'background.paper',
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                    <Box
                      sx={{
                        width: 48,
                        height: 48,
                        borderRadius: 2,
                        bgcolor: 'info.50',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mr: 2,
                      }}
                    >
                      <LabelIcon sx={{ color: 'info.main', fontSize: 24 }} />
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary' }}>
                        Tags & Keywords
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Add searchable tags to help customers find this service
                      </Typography>
                    </Box>
                    <Chip 
                      label={`${formData.tags.length} tags`} 
                      size="small" 
                      variant="outlined"
                    />
                  </Box>

                  <Box display="flex" flexWrap="wrap" gap={1.5} mb={3} minHeight={50}>
                    {formData.tags.length === 0 ? (
                      <Box 
                        sx={{ 
                          width: '100%', 
                          py: 3, 
                          textAlign: 'center',
                          border: '1px dashed',
                          borderColor: 'divider',
                          borderRadius: 2,
                          bgcolor: 'background.default',
                        }}
                      >
                        <Typography variant="body2" color="text.secondary">
                          No tags added yet. Tags help with search and categorization.
                        </Typography>
                      </Box>
                    ) : (
                      formData.tags.map((tag, index) => (
                        <Zoom in key={index}>
                          <Chip
                            icon={<LabelIcon />}
                            label={tag}
                            onDelete={() => removeItem('tags', index)}
                            color="primary"
                            variant="filled"
                            sx={{ 
                              borderRadius: 2,
                              fontWeight: 500,
                              '& .MuiChip-deleteIcon': {
                                color: 'primary.dark',
                                '&:hover': {
                                  color: 'error.main',
                                }
                              }
                            }}
                          />
                        </Zoom>
                      ))
                    )}
                  </Box>

                  <Box display="flex" gap={1.5}>
                    <TextField
                      fullWidth
                      size="small"
                      placeholder="Type a tag and press Enter..."
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          addItem('tags', newTag)
                        }
                      }}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <LabelIcon sx={{ color: 'text.secondary', fontSize: 18 }} />
                          </InputAdornment>
                        ),
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2,
                        }
                      }}
                    />
                    <Button
                      variant="contained"
                      startIcon={<AddIcon />}
                      onClick={() => addItem('tags', newTag)}
                      disabled={!newTag.trim()}
                      sx={{ 
                        borderRadius: 2,
                        textTransform: 'none',
                        fontWeight: 600,
                        px: 3,
                        minWidth: 120,
                      }}
                    >
                      Add Tag
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Settings Section */}
            <Grid item xs={12}>
              <Card 
                elevation={0}
                sx={{ 
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 3,
                  bgcolor: 'background.paper',
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                    <Box
                      sx={{
                        width: 48,
                        height: 48,
                        borderRadius: 2,
                        bgcolor: 'secondary.50',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mr: 2,
                      }}
                    >
                      <SettingsIcon sx={{ color: 'secondary.main', fontSize: 24 }} />
                    </Box>
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary' }}>
                        Settings & Visibility
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Configure service display options and status
                      </Typography>
                    </Box>
                  </Box>

                  <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Icon"
                        value={formData.icon || ''}
                        onChange={(e) => handleInputChange('icon', e.target.value)}
                        placeholder="e.g., BuildIcon, plumbing-icon"
                        helperText="Material-UI icon name or icon URL"
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <ImageIcon sx={{ color: 'text.secondary' }} />
                            </InputAdornment>
                          ),
                        }}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 2,
                          }
                        }}
                      />
                    </Grid>

                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        type="number"
                        label="Sort Order"
                        value={formData.sort_order}
                        onChange={(e) => handleInputChange('sort_order', parseInt(e.target.value) || 0)}
                        helperText="Lower numbers appear first in lists"
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 2,
                          }
                        }}
                      />
                    </Grid>

                    <Grid item xs={12}>
                      <Divider sx={{ my: 1 }} />
                      <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2, mt: 2 }}>
                        Visibility & Status Options
                      </Typography>
                    </Grid>

                    <Grid item xs={12} md={4}>
                      <Paper 
                        elevation={0}
                        sx={{ 
                          p: 2.5,
                          border: '2px solid',
                          borderColor: formData.is_active ? 'success.main' : 'divider',
                          borderRadius: 2,
                          bgcolor: formData.is_active ? alpha('#2e7d32', 0.04) : 'background.default',
                          transition: 'all 0.3s',
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <VisibilityIcon sx={{ color: formData.is_active ? 'success.main' : 'text.secondary' }} />
                            <Box>
                              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                Active
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                Service is live
                              </Typography>
                            </Box>
                          </Box>
                          <Switch
                            checked={formData.is_active}
                            onChange={(e) => handleInputChange('is_active', e.target.checked)}
                            color="success"
                          />
                        </Box>
                      </Paper>
                    </Grid>

                    <Grid item xs={12} md={4}>
                      <Paper 
                        elevation={0}
                        sx={{ 
                          p: 2.5,
                          border: '2px solid',
                          borderColor: formData.is_popular ? 'warning.main' : 'divider',
                          borderRadius: 2,
                          bgcolor: formData.is_popular ? alpha('#ed6c02', 0.04) : 'background.default',
                          transition: 'all 0.3s',
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <StarIcon sx={{ color: formData.is_popular ? 'warning.main' : 'text.secondary' }} />
                            <Box>
                              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                Popular
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                Mark as popular
                              </Typography>
                            </Box>
                          </Box>
                          <Switch
                            checked={formData.is_popular}
                            onChange={(e) => handleInputChange('is_popular', e.target.checked)}
                            color="warning"
                          />
                        </Box>
                      </Paper>
                    </Grid>

                    <Grid item xs={12} md={4}>
                      <Paper 
                        elevation={0}
                        sx={{ 
                          p: 2.5,
                          border: '2px solid',
                          borderColor: formData.is_featured ? 'primary.main' : 'divider',
                          borderRadius: 2,
                          bgcolor: formData.is_featured ? alpha('#1976d2', 0.04) : 'background.default',
                          transition: 'all 0.3s',
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <StarIcon sx={{ color: formData.is_featured ? 'primary.main' : 'text.secondary' }} />
                            <Box>
                              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                Featured
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                Show in featured
                              </Typography>
                            </Box>
                          </Box>
                          <Switch
                            checked={formData.is_featured}
                            onChange={(e) => handleInputChange('is_featured', e.target.checked)}
                            color="primary"
                          />
                        </Box>
                      </Paper>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>
      </DialogContent>

      <DialogActions 
        sx={{ 
          p: 3, 
          bgcolor: 'background.paper', 
          borderTop: '1px solid', 
          borderColor: 'divider',
          gap: 2,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
          <Tooltip title="Form completion progress">
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box 
                sx={{ 
                  width: 8, 
                  height: 8, 
                  borderRadius: '50%', 
                  bgcolor: completionPercentage === 100 ? 'success.main' : 'warning.main' 
                }} 
              />
              <Typography variant="caption" color="text.secondary">
                {completionPercentage === 100 ? 'Ready to submit' : `${completionPercentage}% complete`}
              </Typography>
            </Box>
          </Tooltip>
        </Box>
        
        <Button 
          onClick={handleClose} 
          disabled={loading}
          size="large"
          sx={{ 
            borderRadius: 2,
            textTransform: 'none',
            fontWeight: 600,
            px: 4,
            color: 'text.primary',
          }}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading}
          size="large"
          startIcon={loading ? null : <CheckCircleIcon />}
          sx={{ 
            minWidth: 160,
            borderRadius: 2,
            textTransform: 'none',
            fontWeight: 700,
            px: 4,
            py: 1.5,
            boxShadow: 3,
            '&:hover': {
              boxShadow: 6,
            }
          }}
        >
          {loading ? 'Saving...' : mode === 'create' ? 'Create Service' : 'Update Service'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}