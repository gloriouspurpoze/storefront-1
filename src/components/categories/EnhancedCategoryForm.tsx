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
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Chip,
  IconButton,
  Tooltip,
  Divider,
  Alert,
  Tabs,
  Tab,
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
  Search as SearchIcon,
  Palette as PaletteIcon,
  TrendingUp as TrendingUpIcon,
  Visibility as VisibilityIcon,
} from '@mui/icons-material'
import { styled } from '@mui/material/styles'
import { Category, CreateCategoryRequest, UpdateCategoryRequest } from '../../types'
import { CategoriesService } from '../../services/api/categories.service'

// Enhanced form styling
const StyledDialog = styled(Dialog)(({ theme }) => ({
  '& .MuiDialog-paper': {
    borderRadius: theme.spacing(3),
    maxWidth: 1000,
    maxHeight: '95vh',
    background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.95)} 0%, ${alpha(theme.palette.primary.main, 0.02)} 100%)`,
    backdropFilter: 'blur(10px)',
  },
}))

const FormSection = styled(Box)(({ theme }) => ({
  padding: theme.spacing(3),
  borderRadius: theme.spacing(2),
  background: alpha(theme.palette.background.paper, 0.7),
  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
  marginBottom: theme.spacing(2),
}))

const SectionTitle = styled(Typography)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
  marginBottom: theme.spacing(2),
  color: theme.palette.primary.main,
  fontWeight: 600,
}))

interface EnhancedCategoryFormProps {
  open: boolean
  onClose: () => void
  category?: Category | null
  parentCategories?: Category[]
  onSuccess?: (category: Category) => void
}

interface TabPanelProps {
  children?: React.ReactNode
  index: number
  value: number
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`category-tabpanel-${index}`}
      aria-labelledby={`category-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  )
}

export default function EnhancedCategoryForm({
  open,
  onClose,
  category,
  parentCategories = [],
  onSuccess,
}: EnhancedCategoryFormProps) {
  const theme = useTheme()
  const [activeStep, setActiveStep] = useState(0)
  const [activeTab, setActiveTab] = useState(0)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  
  // Form data with all enhanced fields
  const [formData, setFormData] = useState({
    // Basic fields
    name: '',
    description: '',
    parentId: '',
    status: 'active' as 'active' | 'inactive',
    categoryType: 'both' as 'product' | 'service' | 'both',
    image: '',
    icon: '',
    sortOrder: 0,
    
    // Enhanced hierarchy fields
    level: 0,
    
    // SEO fields
    metaTitle: '',
    metaDescription: '',
    seoKeywords: [] as string[],
    
    // Marketing fields
    featuredImage: '',
    bannerImage: '',
    colorCode: '',
    
    // Analytics (read-only)
    viewCount: 0,
    clickCount: 0,
  })

  const [keywordInput, setKeywordInput] = useState('')

  // Initialize form data
  useEffect(() => {
    if (category) {
      setFormData({
        name: category.name || '',
        description: category.description || '',
        parentId: category.parentId || '',
        status: category.status || 'active',
        categoryType: category.type || 'both',
        image: category.image || '',
        icon: category.icon || '',
        sortOrder: category.sortOrder || 0,
        level: category.level || 0,
        metaTitle: category.metaTitle || '',
        metaDescription: category.metaDescription || '',
        seoKeywords: category.seoKeywords || [],
        featuredImage: category.featuredImage || '',
        bannerImage: category.bannerImage || '',
        colorCode: category.colorCode || '',
        viewCount: category.viewCount || 0,
        clickCount: category.clickCount || 0,
      })
    } else {
      setFormData({
        name: '',
        description: '',
        parentId: '',
        status: 'active',
        categoryType: 'both',
        image: '',
        icon: '',
        sortOrder: 0,
        level: 0,
        metaTitle: '',
        metaDescription: '',
        seoKeywords: [],
        featuredImage: '',
        bannerImage: '',
        colorCode: '',
        viewCount: 0,
        clickCount: 0,
      })
    }
  }, [category])

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const handleAddKeyword = () => {
    if (keywordInput.trim() && !formData.seoKeywords.includes(keywordInput.trim())) {
      setFormData(prev => ({
        ...prev,
        seoKeywords: [...prev.seoKeywords, keywordInput.trim()]
      }))
      setKeywordInput('')
    }
  }

  const handleRemoveKeyword = (keyword: string) => {
    setFormData(prev => ({
      ...prev,
      seoKeywords: prev.seoKeywords.filter(k => k !== keyword)
    }))
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    
    if (!formData.name.trim()) {
      newErrors.name = 'Category name is required'
    }
    
    if (formData.metaTitle && formData.metaTitle.length > 60) {
      newErrors.metaTitle = 'Meta title must be 60 characters or less'
    }
    
    if (formData.metaDescription && formData.metaDescription.length > 160) {
      newErrors.metaDescription = 'Meta description must be 160 characters or less'
    }
    
    if (formData.colorCode && !/^#[0-9A-Fa-f]{6}$/.test(formData.colorCode)) {
      newErrors.colorCode = 'Color code must be a valid hex color (e.g., #FF5733)'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validateForm()) return
    
    setLoading(true)
    try {
      const requestData = {
        name: formData.name,
        description: formData.description,
        parent_id: formData.parentId || undefined,
        is_active: formData.status === 'active',
        category_type: formData.categoryType,
        image: formData.image,
        icon: formData.icon,
        sort_order: formData.sortOrder,
        metaTitle: formData.metaTitle,
        metaDescription: formData.metaDescription,
        seoKeywords: formData.seoKeywords,
        featuredImage: formData.featuredImage,
        bannerImage: formData.bannerImage,
        colorCode: formData.colorCode,
      }

      let response
      if (category) {
        response = await CategoriesService.updateCategory(category.id, requestData)
      } else {
        response = await CategoriesService.createCategory(requestData)
      }

      onSuccess?.(response.data)
      onClose()
    } catch (error) {
      console.error('Error saving category:', error)
      setErrors({ submit: 'Failed to save category. Please try again.' })
    } finally {
      setLoading(false)
    }
  }

  const steps = [
    { label: 'Basic Information', icon: <CategoryIcon /> },
    { label: 'SEO & Marketing', icon: <SearchIcon /> },
    { label: 'Advanced Settings', icon: <SettingsIcon /> },
    { label: 'Preview', icon: <PreviewIcon /> },
  ]

  const tabs = [
    { label: 'Basic Info', icon: <CategoryIcon /> },
    { label: 'SEO', icon: <SearchIcon /> },
    { label: 'Marketing', icon: <PaletteIcon /> },
    { label: 'Analytics', icon: <TrendingUpIcon /> },
  ]

  return (
    <StyledDialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Typography variant="h5" component="div">
            {category ? 'Edit Category' : 'Create New Category'}
          </Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
            {tabs.map((tab, index) => (
              <Tab
                key={index}
                label={tab.label}
                icon={tab.icon}
                iconPosition="start"
              />
            ))}
          </Tabs>
        </Box>

        {/* Basic Information Tab */}
        <TabPanel value={activeTab} index={0}>
          <FormSection>
            <SectionTitle>
              <CategoryIcon />
              Basic Information
            </SectionTitle>
            
            <Box display="flex" flexDirection="column" gap={3}>
              <Box display="flex" gap={2} flexWrap="wrap">
                <Box flex="1" minWidth="300px">
                  <TextField
                    fullWidth
                    label="Category Name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    error={!!errors.name}
                    helperText={errors.name}
                    required
                  />
                </Box>
                
                <Box flex="1" minWidth="300px">
                  <FormControl fullWidth>
                    <InputLabel>Category Type</InputLabel>
                    <Select
                      value={formData.categoryType}
                      onChange={(e) => handleInputChange('categoryType', e.target.value)}
                      label="Category Type"
                    >
                      <MenuItem value="product">Product</MenuItem>
                      <MenuItem value="service">Service</MenuItem>
                      <MenuItem value="both">Both</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
              </Box>
              
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
              />
              
              <Box display="flex" gap={2} flexWrap="wrap">
                <Box flex="1" minWidth="300px">
                  <FormControl fullWidth>
                    <InputLabel>Parent Category</InputLabel>
                    <Select
                      value={formData.parentId}
                      onChange={(e) => handleInputChange('parentId', e.target.value)}
                      label="Parent Category"
                    >
                      <MenuItem value="">No Parent (Root Category)</MenuItem>
                      {parentCategories.map((parent) => (
                        <MenuItem key={parent.id} value={parent.id}>
                          {parent.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>
                
                <Box flex="1" minWidth="300px">
                  <TextField
                    fullWidth
                    label="Sort Order"
                    type="number"
                    value={formData.sortOrder}
                    onChange={(e) => handleInputChange('sortOrder', parseInt(e.target.value) || 0)}
                  />
                </Box>
              </Box>
              
              <Box display="flex" gap={2} flexWrap="wrap">
                <Box flex="1" minWidth="300px">
                  <TextField
                    fullWidth
                    label="Image URL"
                    value={formData.image}
                    onChange={(e) => handleInputChange('image', e.target.value)}
                  />
                </Box>
                
                <Box flex="1" minWidth="300px">
                  <TextField
                    fullWidth
                    label="Icon"
                    value={formData.icon}
                    onChange={(e) => handleInputChange('icon', e.target.value)}
                  />
                </Box>
              </Box>
              
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.status === 'active'}
                    onChange={(e) => handleInputChange('status', e.target.checked ? 'active' : 'inactive')}
                  />
                }
                label="Active"
              />
            </Box>
          </FormSection>
        </TabPanel>

        {/* SEO Tab */}
        <TabPanel value={activeTab} index={1}>
          <FormSection>
            <SectionTitle>
              <SearchIcon />
              SEO Settings
            </SectionTitle>
            
            <Box display="flex" flexDirection="column" gap={3}>
              <TextField
                fullWidth
                label="Meta Title"
                value={formData.metaTitle}
                onChange={(e) => handleInputChange('metaTitle', e.target.value)}
                error={!!errors.metaTitle}
                helperText={errors.metaTitle || `${formData.metaTitle.length}/60 characters`}
                inputProps={{ maxLength: 60 }}
              />
              
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Meta Description"
                value={formData.metaDescription}
                onChange={(e) => handleInputChange('metaDescription', e.target.value)}
                error={!!errors.metaDescription}
                helperText={errors.metaDescription || `${formData.metaDescription.length}/160 characters`}
                inputProps={{ maxLength: 160 }}
              />
              
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  SEO Keywords
                </Typography>
                <Box display="flex" gap={1} mb={2}>
                  <TextField
                    size="small"
                    placeholder="Add keyword"
                    value={keywordInput}
                    onChange={(e) => setKeywordInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddKeyword()}
                  />
                  <Button
                    variant="outlined"
                    onClick={handleAddKeyword}
                    disabled={!keywordInput.trim()}
                  >
                    Add
                  </Button>
                </Box>
                <Box display="flex" flexWrap="wrap" gap={1}>
                  {formData.seoKeywords.map((keyword, index) => (
                    <Chip
                      key={index}
                      label={keyword}
                      onDelete={() => handleRemoveKeyword(keyword)}
                      size="small"
                    />
                  ))}
                </Box>
              </Box>
            </Box>
          </FormSection>
        </TabPanel>

        {/* Marketing Tab */}
        <TabPanel value={activeTab} index={2}>
          <FormSection>
            <SectionTitle>
              <PaletteIcon />
              Marketing & Branding
            </SectionTitle>
            
            <Box display="flex" flexDirection="column" gap={3}>
              <Box display="flex" gap={2} flexWrap="wrap">
                <Box flex="1" minWidth="300px">
                  <TextField
                    fullWidth
                    label="Featured Image URL"
                    value={formData.featuredImage}
                    onChange={(e) => handleInputChange('featuredImage', e.target.value)}
                  />
                </Box>
                
                <Box flex="1" minWidth="300px">
                  <TextField
                    fullWidth
                    label="Banner Image URL"
                    value={formData.bannerImage}
                    onChange={(e) => handleInputChange('bannerImage', e.target.value)}
                  />
                </Box>
              </Box>
              
              <Box display="flex" gap={2} flexWrap="wrap" alignItems="end">
                <Box flex="1" minWidth="300px">
                  <TextField
                    fullWidth
                    label="Color Code"
                    value={formData.colorCode}
                    onChange={(e) => handleInputChange('colorCode', e.target.value)}
                    error={!!errors.colorCode}
                    helperText={errors.colorCode || 'Hex color code (e.g., #FF5733)'}
                    placeholder="#FF5733"
                  />
                </Box>
                
                {formData.colorCode && (
                  <Box
                    sx={{
                      width: 100,
                      height: 40,
                      backgroundColor: formData.colorCode,
                      borderRadius: 1,
                      border: '1px solid',
                      borderColor: 'divider',
                    }}
                  />
                )}
              </Box>
            </Box>
          </FormSection>
        </TabPanel>

        {/* Analytics Tab */}
        <TabPanel value={activeTab} index={3}>
          <FormSection>
            <SectionTitle>
              <TrendingUpIcon />
              Analytics & Performance
            </SectionTitle>
            
            <Box display="flex" flexDirection="column" gap={3}>
              <Box display="flex" gap={2} flexWrap="wrap">
                <Box flex="1" minWidth="300px">
                  <TextField
                    fullWidth
                    label="View Count"
                    value={formData.viewCount}
                    InputProps={{ readOnly: true }}
                    helperText="Total number of views"
                  />
                </Box>
                
                <Box flex="1" minWidth="300px">
                  <TextField
                    fullWidth
                    label="Click Count"
                    value={formData.clickCount}
                    InputProps={{ readOnly: true }}
                    helperText="Total number of clicks"
                  />
                </Box>
              </Box>
              
              <Alert severity="info">
                Analytics data is automatically tracked and cannot be manually edited.
              </Alert>
            </Box>
          </FormSection>
        </TabPanel>

        {errors.submit && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {errors.submit}
          </Alert>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 3 }}>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          startIcon={<SaveIcon />}
          disabled={loading}
        >
          {loading ? 'Saving...' : category ? 'Update Category' : 'Create Category'}
        </Button>
      </DialogActions>
    </StyledDialog>
  )
}
