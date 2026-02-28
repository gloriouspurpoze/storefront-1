import React, { useState, useEffect } from 'react'
import {
  Box,
  Container,
  Typography,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormGroup,
  FormControlLabel,
  CircularProgress,
  Card,
  CardContent,
  IconButton,
  Paper,
  Stack,
  Divider,
} from '@mui/material'
import { 
  Add as AddIcon,
  ArrowBack as ArrowBackIcon,
  Image as ImageIcon,
  Category as CategoryIcon,
  Save as SaveIcon,
} from '@mui/icons-material'
import { CategoriesService } from '../../services/api/categories.service'
import { ImageUploadField, type ImageFile } from '../../components/forms'
import { useAppDispatch } from '../../store/hooks'
import { addToast } from '../../store/slices/uiSlice'
import { useNavigate, useParams, useLocation } from 'react-router-dom'

interface CategoryFormData {
  name: string
  description: string
  categoryType: 'service' | 'product' | 'both'
  images: ImageFile[]
  sortOrder: number
  isActive: boolean
}

export function CreateCategory() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const location = useLocation()
  const { id } = useParams<{ id: string }>()
  
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(false)
  const [formData, setFormData] = useState<CategoryFormData>({
    name: '',
    description: '',
    categoryType: 'product',
    images: [],
    sortOrder: 0,
    isActive: true,
  })

  // Determine mode based on URL
  const isEditMode = location.pathname.includes('/edit/')
  const isViewMode = location.pathname.includes('/view/')
  const isCreateMode = !isEditMode && !isViewMode

  useEffect(() => {
    if ((isEditMode || isViewMode) && id) {
      fetchCategoryData(id)
    }
  }, [id, isEditMode, isViewMode])

  const fetchCategoryData = async (categoryId: string) => {
    if (!categoryId?.trim()) return
    try {
      setLoadingData(true)
      const response = await CategoriesService.getCategory(categoryId)
      // Backend may return category as response.data or nested as response.data.category / response.data.data
      const raw = response?.data
      const category = (raw && typeof raw === 'object' && 'name' in raw)
        ? raw
        : (raw as any)?.category ?? (raw as any)?.data ?? null

      if (category && (category.name != null || category.description != null)) {
        const isActive =
          category.isActive !== undefined
            ? Boolean(category.isActive)
            : (category as any).is_active !== undefined
              ? Boolean((category as any).is_active)
              : category.status === 'active'
        const sortOrder = category.sortOrder ?? (category as any).sort_order ?? 0
        const categoryType = (category.type || category.categoryType || (category as any).category_type || 'product') as 'service' | 'product' | 'both'
        const imageUrl = category.image ?? (category as any).icon ?? (category as any).featuredImage

        setFormData({
          name: category.name || '',
          description: category.description || '',
          categoryType,
          images: imageUrl ? [{
            id: '1',
            url: imageUrl,
            file: undefined,
            alt: category.name,
            isPrimary: true,
            order: 0,
          }] : [],
          sortOrder: Number(sortOrder) || 0,
          isActive,
        })
      } else if (response?.success && isEditMode) {
        dispatch(addToast({
          message: 'Category data could not be loaded. Please try again.',
          severity: 'warning',
          duration: 4000,
        }))
      }
    } catch (error) {
      console.error('Error fetching category:', error)
      dispatch(addToast({
        message: 'Failed to load category data.',
        severity: 'error',
        duration: 4000,
      }))
    } finally {
      setLoadingData(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const categoryData = {
        name: formData.name,
        description: formData.description,
        type: formData.categoryType,
        image: formData.images.length > 0 ? formData.images[0].url : undefined,
        sort_order: formData.sortOrder,
        is_active: formData.isActive,
      }

      console.log('📤 Submitting category data:', categoryData)
      console.log('📝 Category Type being sent:', formData.categoryType)

      let response
      if (isEditMode && id) {
        response = await CategoriesService.updateCategory(id, categoryData)
      } else {
        response = await CategoriesService.createCategory(categoryData)
      }

      if (response.success) {
        dispatch(addToast({
          message: isEditMode ? 'Category updated successfully!' : 'Category created successfully!',
          severity: 'success',
          duration: 4000,
        }))
        
        // Navigate back to categories list
        navigate('/categories')
      }
    } catch (error) {
      console.error(`Error ${isEditMode ? 'updating' : 'creating'} category:`, error)
      dispatch(addToast({
        message: `Failed to ${isEditMode ? 'update' : 'create'} category.`,
        severity: 'error',
        duration: 4000,
      }))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box sx={{ flexGrow: 1, bgcolor: 'grey.50', minHeight: '100vh' }}>
      {/* Header */}
      <Paper sx={{ 
        p: 3, 
        mb: 3, 
        borderRadius: 0,
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white'
      }}>
        <Container maxWidth="lg">
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <IconButton 
              sx={{ color: 'white' }}
              onClick={() => navigate('/categories')}
            >
              <ArrowBackIcon />
            </IconButton>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
                {isViewMode ? 'View Category' : isEditMode ? 'Edit Category' : 'Create New Category'}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                {isViewMode ? 'Category details and information' : isEditMode ? 'Update category information' : 'Add a new category with image for better organization'}
              </Typography>
            </Box>
            <CategoryIcon sx={{ fontSize: 48, opacity: 0.2 }} />
          </Box>
        </Container>
      </Paper>

      <Container maxWidth="md">
        {loadingData ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Card sx={{ mb: 4, borderRadius: 2, boxShadow: 3 }}>
            <CardContent sx={{ p: 4 }}>
              <Box component="form" onSubmit={handleSubmit}>
                <Stack spacing={3}>
                {/* Basic Information */}
                <Box>
                  <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1, color: 'primary.main' }}>
                    <CategoryIcon />
                    Basic Information
                  </Typography>
                  <Stack spacing={2}>
                    <TextField
                      label="Category Name"
                      required
                      fullWidth
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g., Electronics, Home Appliances, Plumbing"
                      helperText="Enter a clear, descriptive category name"
                      disabled={isViewMode}
                    />

                    <TextField
                      label="Description"
                      multiline
                      rows={3}
                      fullWidth
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Describe the category and what products/services it includes..."
                      helperText="Provide a brief description to help users understand this category"
                      disabled={isViewMode}
                    />

                    <FormControl fullWidth required>
                      <InputLabel>Category Type</InputLabel>
                      <Select
                        value={formData.categoryType}
                        onChange={(e) => setFormData({ ...formData, categoryType: e.target.value as any })}
                        label="Category Type"
                        disabled={isViewMode}
                      >
                        <MenuItem value="product">Product</MenuItem>
                        <MenuItem value="service">Service</MenuItem>
                        <MenuItem value="both">Both (Product & Service)</MenuItem>
                      </Select>
                    </FormControl>
                  </Stack>
                </Box>

                <Divider />

                {/* Image Upload */}
                <Box>
                  <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1, color: 'primary.main' }}>
                    <ImageIcon />
                    Category Image
                  </Typography>
                  <ImageUploadField
                    label="Upload Category Image"
                    value={formData.images}
                    onChange={(images) => setFormData({ ...formData, images })}
                    maxFiles={1}
                    maxSize={5}
                    helperText="Upload a category image. Recommended size: 400x400px (1:1 ratio). Max file size: 5MB"
                    disabled={isViewMode}
                  />
                </Box>

                <Divider />

                {/* Settings */}
                <Box>
                  <Typography variant="h6" sx={{ mb: 2 }}>
                    Settings
                  </Typography>
                  <Stack spacing={2}>
                    <TextField
                      label="Sort Order"
                      type="number"
                      fullWidth
                      value={formData.sortOrder}
                      onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })}
                      helperText="Lower numbers appear first in the list (e.g., 1, 2, 3...)"
                      disabled={isViewMode}
                    />

                    <FormGroup>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={formData.isActive}
                            onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                            color="success"
                            disabled={isViewMode}
                          />
                        }
                        label={
                          <Box>
                            <Typography variant="body1">Active Category</Typography>
                            <Typography variant="caption" color="text.secondary">
                              Inactive categories won't be visible to users
                            </Typography>
                          </Box>
                        }
                      />
                    </FormGroup>
                  </Stack>
                </Box>

                {/* Action Buttons */}
                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', pt: 2 }}>
                  <Button
                    variant="outlined"
                    onClick={() => navigate('/categories')}
                    disabled={loading}
                  >
                    {isViewMode ? 'Back' : 'Cancel'}
                  </Button>
                  {!isViewMode && (
                    <Button
                      type="submit"
                      variant="contained"
                      size="large"
                      disabled={loading || !formData.name}
                      startIcon={loading ? <CircularProgress size={20} color="inherit" /> : isEditMode ? <SaveIcon /> : <AddIcon />}
                      sx={{ minWidth: 160 }}
                    >
                      {loading ? (isEditMode ? 'Updating...' : 'Creating...') : (isEditMode ? 'Update Category' : 'Create Category')}
                    </Button>
                  )}
                </Box>
                </Stack>
              </Box>
            </CardContent>
          </Card>
        )}
      </Container>
    </Box>
  )
}

export default CreateCategory

