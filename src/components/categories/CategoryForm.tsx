import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Fade,
  Slide,
  Alert,
  Chip,
  Avatar,
  IconButton,
  Tooltip,
  Divider,
  Grid,
  useTheme,
  alpha,
} from '@mui/material'
import {
  Close as CloseIcon,
  Save as SaveIcon,
  Category as CategoryIcon,
  Description as DescriptionIcon,
  Image as ImageIcon,
  Settings as SettingsIcon,
  Preview as PreviewIcon,
  ArrowBack as ArrowBackIcon,
  ArrowForward as ArrowForwardIcon,
} from '@mui/icons-material'
import { styled } from '@mui/material/styles'
import { Category, CreateCategoryRequest, UpdateCategoryRequest } from '../../types'
import { FormField, SelectField, ImageUploadField, SwitchField } from '../forms'
import { CategoriesService } from '../../services/api/categories.service'

// Enhanced form styling
const StyledDialog = styled(Dialog)(({ theme }) => ({
  '& .MuiDialog-paper': {
    borderRadius: theme.spacing(3),
    maxWidth: 800,
    maxHeight: '90vh',
    background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.95)} 0%, ${alpha(theme.palette.primary.main, 0.02)} 100%)`,
    backdropFilter: 'blur(10px)',
  },
}))

const FormHeader = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(2),
  padding: theme.spacing(3),
  background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.secondary.main, 0.1)} 100%)`,
  borderRadius: `${theme.spacing(3)} ${theme.spacing(3)} 0 0`,
  borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
}))

const StepContentWrapper = styled(Box)(({ theme }) => ({
  padding: theme.spacing(3),
  minHeight: 400,
}))

const FormSection = styled(Box)(({ theme }) => ({
  marginBottom: theme.spacing(3),
  padding: theme.spacing(2),
  borderRadius: theme.spacing(2),
  backgroundColor: alpha(theme.palette.grey[50], 0.5),
  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
}))

const PreviewCard = styled(Box)(({ theme }) => ({
  padding: theme.spacing(3),
  borderRadius: theme.spacing(2),
  backgroundColor: theme.palette.background.paper,
  border: `2px solid ${alpha(theme.palette.primary.main, 0.2)}`,
  boxShadow: theme.shadows[4],
}))

export interface CategoryFormProps {
  open: boolean
  onClose: () => void
  onSubmit: (category: CreateCategoryRequest | UpdateCategoryRequest) => Promise<void>
  category?: Category | null
  parentCategories?: Category[]
  mode?: 'create' | 'edit'
}

const steps = [
  'Basic Information',
  'Category Details',
  'Settings & Preview',
]

export const CategoryForm: React.FC<CategoryFormProps> = ({
  open,
  onClose,
  onSubmit,
  category,
  parentCategories = [],
  mode = 'create',
}) => {
  const theme = useTheme()
  const [activeStep, setActiveStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formData, setFormData] = useState<CreateCategoryRequest>({
    name: '',
    description: '',
    parentId: undefined,
    status: 'active',
    categoryType: 'both',
  })

  // Initialize form data when category changes
  useEffect(() => {
    if (category && mode === 'edit') {
      setFormData({
        name: category.name,
        description: category.description,
        parentId: category.parentId,
        status: category.status,
        categoryType: category.categoryType || 'both',
      })
    } else {
      setFormData({
        name: '',
        description: '',
        parentId: undefined,
        status: 'active',
        categoryType: 'both',
      })
    }
    setErrors({})
    setActiveStep(0)
  }, [category, mode, open])

  const handleInputChange = (field: keyof CreateCategoryRequest) => (
    eventOrValue: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | any
  ) => {
    // Handle both event objects and direct values
    const value = typeof eventOrValue === 'object' && eventOrValue?.target
      ? eventOrValue.target.value
      : eventOrValue
    
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }))
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: '',
      }))
    }
  }

  const handleSwitchChange = (field: keyof CreateCategoryRequest) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = event.target.checked
    setFormData(prev => ({
      ...prev,
      [field]: value ? 'active' : 'inactive',
    }))
  }

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {}

    switch (step) {
      case 0:
        if (!formData.name.trim()) {
          newErrors.name = 'Category name is required'
        } else if (formData.name.length < 2) {
          newErrors.name = 'Category name must be at least 2 characters'
        } else if (formData.name.length > 100) {
          newErrors.name = 'Category name cannot exceed 100 characters'
        }
        break
      
      case 1:
        if (formData.description && formData.description.length > 500) {
          newErrors.description = 'Description cannot exceed 500 characters'
        }
        break
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = () => {
    if (validateStep(activeStep)) {
      setActiveStep(prev => prev + 1)
    }
  }

  const handleBack = () => {
    setActiveStep(prev => prev - 1)
  }

  const handleSubmit = async () => {
    if (!validateStep(activeStep)) return
    
    setLoading(true)
    try {
      await onSubmit(formData)
      onClose()
    } catch (error) {
      console.error('Error submitting category:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Fade in timeout={300}>
            <FormSection>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <CategoryIcon color="primary" />
                <Typography variant="h6" color="primary">
                  Basic Information
                </Typography>
              </Box>
              
              <Grid container spacing={3}>
                <Grid size={{ xs: 12 }}>
                  <FormField
                    label="Category Name"
                    value={formData.name}
                    onChange={handleInputChange('name')}
                    error={errors.name}
                    helperText={errors.name || 'Enter a clear, descriptive category name'}
                    placeholder="e.g., Electronics, Home & Garden"
                    required
                  />
                </Grid>
                
                <Grid size={{ xs: 12 }}>
                  <FormField
                    label="Description"
                    value={formData.description || ''}
                    onChange={handleInputChange('description')}
                    error={errors.description}
                    helperText={errors.description || 'Optional description for this category'}
                    placeholder="Describe what products belong to this category..."
                    multiline
                    rows={3}
                  />
                </Grid>
              </Grid>
            </FormSection>
          </Fade>
        )

      case 1:
        return (
          <Fade in timeout={300}>
            <FormSection>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <DescriptionIcon color="primary" />
                <Typography variant="h6" color="primary">
                  Category Details
                </Typography>
              </Box>
              
              <Grid container spacing={3}>
                <Grid size={{ xs: 12 }}>
                  <SelectField
                    label="Category Type"
                    value={formData.categoryType || 'both'}
                    onChange={(value: string) => setFormData(prev => ({ ...prev, categoryType: value as 'product' | 'service' | 'both' }))}
                    options={[
                      { value: 'both', label: '🔄 Both Products & Services' },
                      { value: 'product', label: '📦 Products Only' },
                      { value: 'service', label: '🔧 Services Only' },
                    ]}
                    helperText="Choose what this category is for: products, services, or both"
                  />
                </Grid>
                
                <Grid size={{ xs: 12 }}>
                  <SelectField
                    label="Parent Category"
                    value={formData.parentId || ''}
                    onChange={(value: string) => setFormData(prev => ({ ...prev, parentId: value || undefined }))}
                    options={[
                      { value: '', label: 'No Parent (Top Level)' },
                      ...parentCategories.map(parent => ({
                        value: parent.id,
                        label: parent.name,
                      }))
                    ]}
                    helperText="Select a parent category if this is a subcategory"
                  />
                </Grid>
                
                <Grid size={{ xs: 12 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <SettingsIcon color="primary" />
                    <Typography variant="h6" color="primary">
                      Category Settings
                    </Typography>
                  </Box>
                  
                  <SwitchField
                    label="Active Status"
                    value={formData.status === 'active'}
                    onChange={(value: boolean) => setFormData(prev => ({ ...prev, status: value ? 'active' : 'inactive' }))}
                    helperText="Inactive categories won't be visible to customers"
                  />
                </Grid>
              </Grid>
            </FormSection>
          </Fade>
        )

      case 2:
        return (
          <Fade in timeout={300}>
            <FormSection>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <PreviewIcon color="primary" />
                <Typography variant="h6" color="primary">
                  Preview & Submit
                </Typography>
              </Box>
              
              <PreviewCard>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <Avatar sx={{ bgcolor: 'primary.main' }}>
                    <CategoryIcon />
                  </Avatar>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h6">{formData.name}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {formData.parentId ? 'Subcategory' : 'Top Level Category'}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Chip
                      label={
                        formData.categoryType === 'both' ? '🔄 Both' :
                        formData.categoryType === 'product' ? '📦 Products' :
                        '🔧 Services'
                      }
                      color="info"
                      size="small"
                      variant="outlined"
                    />
                    <Chip
                      label={formData.status}
                      color={formData.status === 'active' ? 'success' : 'error'}
                      size="small"
                    />
                  </Box>
                </Box>
                
                {formData.description && (
                  <>
                    <Divider sx={{ my: 2 }} />
                    <Typography variant="body2" color="text.secondary">
                      {formData.description}
                    </Typography>
                  </>
                )}
                
                {formData.parentId && (
                  <>
                    <Divider sx={{ my: 2 }} />
                    <Typography variant="caption" color="text.secondary">
                      Parent Category: {parentCategories.find(p => p.id === formData.parentId)?.name || 'Unknown'}
                    </Typography>
                  </>
                )}
              </PreviewCard>
              
              <Alert severity="info" sx={{ mt: 2 }}>
                {mode === 'create' 
                  ? 'Review the information above before creating the category.'
                  : 'Review the changes before updating the category.'
                }
              </Alert>
            </FormSection>
          </Fade>
        )

      default:
        return null
    }
  }

  return (
    <StyledDialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      TransitionComponent={Slide}
    >
      <FormHeader>
        <Avatar sx={{ bgcolor: 'primary.main' }}>
          <CategoryIcon />
        </Avatar>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h5" fontWeight={600}>
            {mode === 'create' ? 'Create New Category' : 'Edit Category'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {mode === 'create' 
              ? 'Add a new product category to organize your inventory'
              : 'Update category information and settings'
            }
          </Typography>
        </Box>
        <IconButton onClick={onClose} size="large">
          <CloseIcon />
        </IconButton>
      </FormHeader>

      <DialogContent sx={{ p: 0 }}>
        <Box sx={{ p: 3, pb: 1 }}>
          <Stepper activeStep={activeStep} orientation="horizontal">
            {steps.map((label, index) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
        </Box>

        <StepContentWrapper>
          {getStepContent(activeStep)}
        </StepContentWrapper>
      </DialogContent>

      <DialogActions sx={{ p: 3, gap: 1 }}>
        <Button
          onClick={onClose}
          disabled={loading}
          startIcon={<CloseIcon />}
        >
          Cancel
        </Button>
        
        {activeStep > 0 && (
          <Button
            onClick={handleBack}
            disabled={loading}
            startIcon={<ArrowBackIcon />}
          >
            Back
          </Button>
        )}
        
        {activeStep < steps.length - 1 ? (
          <Button
            onClick={handleNext}
            variant="outlined"
            endIcon={<ArrowForwardIcon />}
          >
            Next
          </Button>
        ) : (
          <Button
            onClick={handleSubmit}
            variant="contained"
            loading={loading}
            startIcon={<SaveIcon />}
            disabled={loading}
          >
            {mode === 'create' ? 'Create Category' : 'Update Category'}
          </Button>
        )}
      </DialogActions>
    </StyledDialog>
  )
}

export default CategoryForm
