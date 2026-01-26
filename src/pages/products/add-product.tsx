import React, { useState, useCallback, useRef, useEffect } from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  IconButton,
  Alert,
  useTheme,
  useMediaQuery,
  Stack,
  InputAdornment,
  Stepper,
  Step,
  StepLabel,
  LinearProgress,
  Fade,
  CircularProgress,
} from '@mui/material'
import {
  Save as SaveIcon,
  ArrowBack as ArrowBackIcon,
  Inventory as PackageIcon,
  AttachMoney as DollarIcon,
  Image as ImageIcon,
  Scale as ScaleIcon,
  Tag as TagIcon,
  Description as DescriptionIcon,
  Security as SecurityIcon,
  CheckCircle as CheckIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material'
import { Product, Category } from '../../types'
import { formatCurrency } from '../../lib/utils'
import { ProductsService } from '../../services/api/products.service'
import { CategoriesService } from '../../services/api/categories.service'
import { ProvidersService } from '../../services/api/providers.service'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { useAppDispatch } from '../../store/hooks'
import { addToast } from '../../store/slices/uiSlice'

// Import common form components
import {
  FormField,
  SelectField,
  RichTextField,
  ImageUploadField,
  SpecificationField,
  TagField,
  SwitchField,
  DateField,
  type SelectOption,
  type ImageFile,
  type Specification,
} from '../../components/forms'

interface ProductFormData {
  // Basic Information
  name: string
  shortDescription: string
  description: string
  brand: string
  model: string
  barcode: string
  
  // Pricing & Inventory
  price: number
  originalPrice: number
  costPrice: number
  sku: string
  stockQuantity: number
  lowStockThreshold: number
  trackInventory: boolean
  allowBackorder: boolean
  
  // Categorization
  categoryId: string
  subcategoryId: string
  providerId: string
  tags: string[]
  collections: string[]
  
  // Physical Properties
  weight: number
  weightUnit: string
  dimensions: {
    length: number
    width: number
    height: number
    unit: string
  }
  
  // SEO & Marketing
  seoTitle: string
  seoDescription: string
  seoKeywords: string[]
  metaTags: string[]
  isFeatured: boolean
  isNew: boolean
  isOnSale: boolean
  featuredUntil: string
  
  // Shipping & Handling
  shippingWeight: number
  shippingDimensions: {
    length: number
    width: number
    height: number
  }
  requiresShipping: boolean
  freeShipping: boolean
  shippingClass: string
  handlingTime: number
  
  // Digital Product
  isDigital: boolean
  downloadLimit: number
  downloadExpiry: number
  digitalFiles: string[]
  
  // Advanced Settings
  specifications: Specification[]
  customFields: Array<{
    name: string
    value: string
    type: string
  }>
  relatedProducts: number[]
  crossSellProducts: number[]
  upSellProducts: number[]
  
  // Media
  images: ImageFile[]
  videos: Array<{
    id: string
    url: string
    type: string
    thumbnail: string
  }>
  
  // Status & Visibility
  isActive: boolean
  visibility: 'public' | 'private' | 'password'
  password: string
  publishDate: string
  expiryDate: string
  
  // Tax & Compliance
  taxClass: string
  taxStatus: 'taxable' | 'shipping' | 'none'
  customsInfo: {
    hsCode: string
    countryOfOrigin: string
    customsDescription: string
  }
  
  // Warranty & Support
  warrantyPeriod: number
  warrantyType: string
  supportEmail: string
  supportPhone: string
  instructionManual: string
}

const initialFormData: ProductFormData = {
  // Basic Information
  name: '',
  shortDescription: '',
  description: '',
  brand: '',
  model: '',
  barcode: '',
  
  // Pricing & Inventory
  price: 0,
  originalPrice: 0,
  costPrice: 0,
  sku: '',
  stockQuantity: 0,
  lowStockThreshold: 5,
  trackInventory: true,
  allowBackorder: false,
  
  // Categorization
  categoryId: '',
  subcategoryId: '',
  providerId: '',
  tags: [],
  collections: [],
  
  // Physical Properties
  weight: 0,
  weightUnit: 'lbs',
  dimensions: {
    length: 0,
    width: 0,
    height: 0,
    unit: 'in',
  },
  
  // SEO & Marketing
  seoTitle: '',
  seoDescription: '',
  seoKeywords: [],
  metaTags: [],
  isFeatured: false,
  isNew: false,
  isOnSale: false,
  featuredUntil: '',
  
  // Shipping & Handling
  shippingWeight: 0,
  shippingDimensions: {
    length: 0,
    width: 0,
    height: 0,
  },
  requiresShipping: true,
  freeShipping: false,
  shippingClass: 'standard',
  handlingTime: 1,
  
  // Digital Product
  isDigital: false,
  downloadLimit: 0,
  downloadExpiry: 0,
  digitalFiles: [],
  
  // Advanced Settings
  specifications: [{ key: '', value: '', group: 'General' }],
  customFields: [],
  relatedProducts: [],
  crossSellProducts: [],
  upSellProducts: [],
  
  // Media
  images: [],
  videos: [],
  
  // Status & Visibility
  isActive: true,
  visibility: 'public',
  password: '',
  publishDate: new Date().toISOString().split('T')[0],
  expiryDate: '',
  
  // Tax & Compliance
  taxClass: 'standard',
  taxStatus: 'taxable',
  customsInfo: {
    hsCode: '',
    countryOfOrigin: '',
    customsDescription: '',
  },
  
  // Warranty & Support
  warrantyPeriod: 0,
  warrantyType: 'manufacturer',
  supportEmail: '',
  supportPhone: '',
  instructionManual: '',
}

export function AddProduct() {
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const { id } = useParams()
  const location = useLocation()
  
  const isEditMode = location.pathname.includes('/edit/')
  const isViewMode = location.pathname.includes('/view/')
  const isCreateMode = !isEditMode && !isViewMode
  
  const [formData, setFormData] = useState<ProductFormData>(initialFormData)
  const [errors, setErrors] = useState<any>({})
  const [isLoading, setIsLoading] = useState(false)
  const [activeStep, setActiveStep] = useState(0)
  const [categories, setCategories] = useState<any[]>([])
  const [providers, setProviders] = useState<any[]>([])
  const [isLoadingData, setIsLoadingData] = useState(true)

  const theme = useTheme()

  // Fetch product data if editing or viewing
  useEffect(() => {
    if (id && (isEditMode || isViewMode)) {
      fetchProductData(id)
    } else {
      fetchInitialData()
    }
  }, [id, isEditMode, isViewMode])

  const fetchProductData = async (productId: string) => {
    try {
      setIsLoadingData(true)
      
      // Fetch product, categories, and providers in parallel
      const [productResponse, categoriesRes, providersRes] = await Promise.all([
        ProductsService.getProduct(productId),
        CategoriesService.getCategories(),
        ProvidersService.getProviders()
      ])
      
      // Set categories and providers first
      if (categoriesRes.success && categoriesRes.data) {
        const cats = Array.isArray(categoriesRes.data) ? categoriesRes.data : categoriesRes.data.categories || []
        setCategories(cats)
      }
      
      if (providersRes.success && providersRes.data) {
        const provs = Array.isArray(providersRes.data) ? providersRes.data : providersRes.data.providers || []
        setProviders(provs)
      }
      
      if (productResponse.success && productResponse.data) {
        const product = productResponse.data
    
        // Map product data to form data
        setFormData({
          ...initialFormData,
          name: product.name || '',
          shortDescription: product.short_description || '',
          description: product.description || '',
          brand: '',
          model: '',
          barcode: '',
          price: product.price || 0,
          originalPrice: product.original_price || 0,
          costPrice: 0,
          sku: product.sku || '',
          stockQuantity: product.stock_quantity || 0,
          lowStockThreshold: product.low_stock_threshold || 5,
          trackInventory: true,
          allowBackorder: false,
          categoryId: String(product.category_id ?? ''),
          subcategoryId: String((product as any).subcategory_id ?? ''),
          providerId: String(product.provider_id ?? ''),
          tags: product.tags || [],
          collections: [],
          weight: parseFloat(product.weight?.toString() || '0'),
          weightUnit: 'lbs',
          dimensions: product.dimensions ? {
            ...product.dimensions,
            unit: product.dimensions.unit || 'in'
          } : { length: 0, width: 0, height: 0, unit: 'in' },
          seoTitle: product.seo_title || '',
          seoDescription: product.seo_description || '',
          seoKeywords: product.seo_keywords || [],
          metaTags: [],
          isFeatured: product.is_featured || product.isFeatured || false,
          isNew: product.is_new || false,
          isOnSale: false,
          featuredUntil: '',
          shippingWeight: 0,
          shippingDimensions: { length: 0, width: 0, height: 0 },
          requiresShipping: true,
          freeShipping: product.free_shipping || false,
          shippingClass: 'standard',
          handlingTime: 1,
          isDigital: false,
          downloadLimit: 0,
          downloadExpiry: 0,
          digitalFiles: [],
          specifications: product.specifications ? Object.entries(product.specifications).map(([key, value]) => ({
            key,
            value: value as string,
            group: 'General'
          })) : [{ key: '', value: '', group: 'General' }],
          customFields: [],
          relatedProducts: [],
          crossSellProducts: [],
          upSellProducts: [],
          images: product.images?.map((url, idx) => ({ 
            id: idx.toString(), 
            url, 
            file: null as any, 
            preview: url,
            alt: product.name,
            isPrimary: idx === 0,
            order: idx
          })) || [],
          videos: [],
          isActive: product.is_active !== undefined ? product.is_active : true,
          visibility: 'public',
          password: '',
          publishDate: new Date().toISOString().split('T')[0],
          expiryDate: '',
          taxClass: 'standard',
          taxStatus: 'taxable',
          customsInfo: { hsCode: '', countryOfOrigin: '', customsDescription: '' },
          warrantyPeriod: 0,
          warrantyType: 'manufacturer',
          supportEmail: '',
          supportPhone: '',
          instructionManual: '',
        })
            }
    } catch (error) {
      console.error('Error fetching product:', error)
      dispatch(addToast({
        message: 'Failed to load product data.',
        severity: 'error',
        duration: 4000,
      }))
    } finally {
      setIsLoadingData(false)
    }
  }

  const fetchInitialData = async () => {
    try {
      setIsLoadingData(true)
      
      // Fetch categories
      const categoriesResponse = await CategoriesService.getCategories({ 
        page: 1, 
        limit: 100,
        category_type: 'product' // Only fetch product categories
      })
      
      if (categoriesResponse.success && categoriesResponse.data) {
        setCategories(categoriesResponse.data.categories || [])
      }

      // Fetch providers
      const providersResponse = await ProvidersService.getProviders({ 
        page: 1, 
        limit: 100,
        status: 'verified' // Only fetch verified providers
      })
      
      if (providersResponse.success && providersResponse.data) {
        setProviders(providersResponse.data.providers || [])
      }
    } catch (error) {
      console.error('Error fetching initial data:', error)
      dispatch(addToast({
        message: 'Failed to load categories and providers. Please refresh the page.',
        severity: 'error',
        duration: 4000,
      }))
    } finally {
      setIsLoadingData(false)
    }
  }

  const steps = [
    'Basic Information',
    'Pricing & Inventory',
    'Media & SEO',
    'Shipping & Variants',
    'Advanced Settings',
    'Review & Publish'
  ]

  const handleInputChange = (field: keyof ProductFormData) => (
    eventOrValue: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | any
  ) => {
    // Handle both event objects and direct values
    const value = eventOrValue?.target?.value !== undefined ? eventOrValue.target.value : eventOrValue
    
    setFormData((prev: ProductFormData) => ({
      ...prev,
      [field]: field === 'price' || field === 'originalPrice' || field === 'costPrice' || field === 'stockQuantity' || field === 'weight' || field === 'lowStockThreshold' || field === 'handlingTime' || field === 'downloadLimit' || field === 'downloadExpiry' || field === 'warrantyPeriod'
        ? Number(value) || 0 
        : value,
    }))
    
    // Clear error when user starts typing
    if (errors[field]) {
    setErrors((prev: any) => ({
      ...prev,
      [field]: undefined,
    }))
    }
  }

  const handleDescriptionChange = (value: string) => {
    setFormData((prev: ProductFormData) => ({
      ...prev,
      description: value
    }))
  }

  const handleNestedInputChange = (parentField: keyof ProductFormData, childField: string) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = event.target.type === 'number' ? Number(event.target.value) || 0 : event.target.value
    setFormData((prev: ProductFormData) => ({
      ...prev,
      [parentField]: {
        ...prev[parentField] as any,
        [childField]: value,
      },
    }))
  }

  const validateForm = (): boolean => {
    const newErrors: any = {}

    // Basic validation
    if (!formData.name.trim()) {
      newErrors.name = 'Product name is required'
    }

    if (!formData.shortDescription.trim()) {
      newErrors.shortDescription = 'Short description is required'
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Product description is required'
    }

    if (formData.price <= 0) {
      newErrors.price = 'Price must be greater than 0'
    }

    if (formData.originalPrice < 0) {
      newErrors.originalPrice = 'Original price cannot be negative'
    }

    if (!formData.sku.trim()) {
      newErrors.sku = 'SKU is required'
    }

    if (formData.stockQuantity < 0) {
      newErrors.stockQuantity = 'Stock quantity cannot be negative'
    }

    if (formData.weight < 0) {
      newErrors.weight = 'Weight cannot be negative'
    }

    if (formData.dimensions.length < 0 || formData.dimensions.width < 0 || formData.dimensions.height < 0) {
      newErrors.dimensions = 'Dimensions cannot be negative'
    }

    // SEO validation
    if (formData.seoTitle && formData.seoTitle.length > 60) {
      newErrors.seoTitle = 'SEO title should be under 60 characters'
    }

    if (formData.seoDescription && formData.seoDescription.length > 160) {
      newErrors.seoDescription = 'SEO description should be under 160 characters'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    
    if (!validateForm()) {
      dispatch(addToast({
        message: 'Please fix the validation errors before submitting.',
        severity: 'error',
        duration: 4000,
      }))
      return
    }

    setIsLoading(true)
    
    try {
      // Transform form data to match backend API
      const productData = {
        category_id: formData.categoryId.toString(),
        name: formData.name,
        description: formData.description,
        price: formData.price,
        original_price: formData.originalPrice || undefined,
        sku: formData.sku,
        stock_quantity: formData.stockQuantity,
        images: formData.images.map(img => img.url), // Extract URLs from ImageFile objects
        specifications: formData.specifications.reduce((acc, spec) => {
          if (spec.key && spec.value) {
            acc[spec.key] = spec.value
          }
          return acc
        }, {} as Record<string, string>),
        is_active: formData.isActive,
        is_featured: formData.isFeatured,
        weight: formData.weight || undefined,
        dimensions: formData.dimensions.length > 0 || formData.dimensions.width > 0 || formData.dimensions.height > 0 
          ? {
              length: formData.dimensions.length,
              width: formData.dimensions.width,
              height: formData.dimensions.height,
            }
          : undefined,
        tags: formData.tags,
      }

      console.log('Product data to submit:', productData)
      
      let response
      if (isEditMode && id) {
        // Update existing product
        response = await ProductsService.updateProduct(id, productData)
        
        if (response.success) {
          dispatch(addToast({
            message: 'Product updated successfully!',
            severity: 'success',
            duration: 4000,
          }))
          navigate('/products')
        }
      } else {
        // Create new product
        response = await ProductsService.createProduct(productData)
        
        if (response.success) {
          dispatch(addToast({
            message: 'Product created successfully!',
            severity: 'success',
            duration: 4000,
          }))
          navigate('/products')
        }
      }
    } catch (error) {
      console.error('Error saving product:', error)
      dispatch(addToast({
        message: isEditMode ? 'Failed to update product.' : 'Failed to create product.',
        severity: 'error',
        duration: 4000,
      }))
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveDraft = async () => {
    setIsLoading(true)
    
    try {
      // Transform form data to match backend API (same as handleSubmit but for drafts)
      const productData = {
        category_id: formData.categoryId.toString(),
        name: formData.name || 'Draft Product',
        description: formData.description || '',
        price: formData.price || 0,
        original_price: formData.originalPrice || undefined,
        sku: formData.sku || `DRAFT-${Date.now()}`,
        stock_quantity: formData.stockQuantity || 0,
        images: formData.images.map(img => img.url), // Extract URLs from ImageFile objects
        specifications: formData.specifications.reduce((acc, spec) => {
          if (spec.key && spec.value) {
            acc[spec.key] = spec.value
          }
          return acc
        }, {} as Record<string, string>),
        is_active: false, // Drafts are inactive
        is_featured: false, // Drafts are never featured
        weight: formData.weight || undefined,
        dimensions: formData.dimensions.length > 0 || formData.dimensions.width > 0 || formData.dimensions.height > 0 
          ? {
              length: formData.dimensions.length,
              width: formData.dimensions.width,
              height: formData.dimensions.height,
            }
          : undefined,
        tags: formData.tags,
      }

      console.log('Saving draft:', productData)
      
      // Use the draft endpoint
      const response = await ProductsService.createProductDraft(productData)
      
      if (response.success) {
        console.log('Draft saved successfully:', response.data)
        
        dispatch(addToast({
          message: 'Product draft saved successfully! You can find it in the "Drafts" tab.',
          severity: 'success',
          duration: 5000,
        }))
        
        // Navigate back to products page
        navigate('/products')
      }
    } catch (error) {
      console.error('Error saving draft:', error)
      dispatch(addToast({
        message: 'Failed to save draft. Please try again.',
        severity: 'error',
        duration: 4000,
      }))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Box sx={{ flexGrow: 1, bgcolor: 'grey.50', minHeight: '100vh' }}>
      {/* Header */}
      <Box sx={{ 
        bgcolor: 'white', 
        borderBottom: 1, 
        borderColor: 'divider',
        px: 3,
        py: 2,
        mb: 3
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <IconButton 
              sx={{ mr: 2, color: 'primary.main' }}
              onClick={() => navigate('/products')}
            >
          <ArrowBackIcon />
        </IconButton>
        <Box>
              <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5, color: 'text.primary' }}>
                {isViewMode ? 'View Product' : isEditMode ? 'Edit Product' : 'Create New Product'}
          </Typography>
              <Typography variant="body2" color="text.secondary">
                {isViewMode ? 'View product details and information' : isEditMode ? 'Update product information and details' : 'Build a comprehensive product listing with all necessary details'}
          </Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            {!isViewMode && (
              <>
                <Button
                  variant="outlined"
                  startIcon={<SaveIcon />}
                  onClick={handleSaveDraft}
                  disabled={isLoading || isLoadingData}
                >
                  {isLoading ? 'Saving...' : 'Save Draft'}
                </Button>
                <Button
                  variant="contained"
                  startIcon={<SaveIcon />}
                  onClick={handleSubmit}
                  disabled={isLoading || isLoadingData}
                  sx={{ minWidth: 140 }}
                >
                  {isLoading ? (isEditMode ? 'Updating...' : 'Creating...') : (isEditMode ? 'Update Product' : 'Create Product')}
                </Button>
              </>
            )}
          </Box>
        </Box>
      </Box>

      {/* Loading Initial Data */}
      {isLoadingData && (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400, px: 3 }}>
          <Box sx={{ textAlign: 'center' }}>
            <CircularProgress size={48} sx={{ mb: 2 }} />
            <Typography variant="h6" color="text.secondary">
              Loading categories and providers...
            </Typography>
          </Box>
        </Box>
      )}

      {/* Form Content */}
      {!isLoadingData && (
      <Box sx={{ px: 3 }}>
        {/* Progress Stepper */}
        <Card sx={{ mb: 3, overflow: 'visible' }}>
          <CardContent sx={{ pb: 2 }}>
            <Stepper activeStep={activeStep} alternativeLabel>
              {steps.map((label, index) => (
                <Step key={label}>
                  <StepLabel
                    onClick={() => setActiveStep(index)}
                    sx={{ cursor: 'pointer' }}
                  >
                    {label}
                  </StepLabel>
                </Step>
              ))}
            </Stepper>
          </CardContent>
        </Card>

        <Box sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', lg: 'row' } }}>
        {/* Main Form */}
          <Box sx={{ flex: { xs: 1, lg: 2 } }}>
          <Stack spacing={3}>
              {/* Step 1: Basic Information */}
              {activeStep === 0 && (
                <Fade in={true}>
            <Card>
              <CardContent>
                      <Typography variant="h6" sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1, color: 'primary.main' }}>
                  <PackageIcon />
                  Basic Information
                </Typography>
                
                      <Stack spacing={3}>
                        <FormField
                      label="Product Name"
                      value={formData.name}
                      onChange={handleInputChange('name')}
                          error={errors.name}
                          helperText="Enter a clear, descriptive product name"
                          disabled={isViewMode}
                          placeholder="e.g., Professional Wireless Headphones"
                          required
                        />
                        
                        <FormField
                          label="Short Description"
                          value={formData.shortDescription}
                          onChange={handleInputChange('shortDescription')}
                          error={errors.shortDescription}
                          helperText="Brief description for product cards and search results"
                          placeholder="Brief, compelling description of your product"
                      multiline
                          rows={2}
                          required
                          disabled={isViewMode}
                        />
                        
                        <RichTextField
                          label="Detailed Description"
                      value={formData.description}
                          onChange={handleDescriptionChange}
                          error={errors.description}
                          helperText="Create a detailed, compelling description of your product"
                          placeholder="Start typing your detailed product description..."
                          required
                          height={200}
                          disabled={isViewMode}
                        />
                        
                        <Box sx={{ display: 'flex', gap: 2 }}>
                          <Box sx={{ flex: 1 }}>
                            <FormField
                              label="Brand"
                              value={formData.brand}
                              onChange={handleInputChange('brand')}
                              placeholder="e.g., Apple, Samsung"
                              helperText="Product brand or manufacturer"
                              disabled={isViewMode}
                            />
                          </Box>
                          <Box sx={{ flex: 1 }}>
                            <FormField
                              label="Model"
                              value={formData.model}
                              onChange={handleInputChange('model')}
                              placeholder="e.g., iPhone 15 Pro"
                              helperText="Product model number"
                              disabled={isViewMode}
                            />
                          </Box>
                        </Box>
                        
                        <Box sx={{ display: 'flex', gap: 2 }}>
                          <Box sx={{ flex: 1 }}>
                            <FormField
                              label="Barcode / UPC"
                              value={formData.barcode}
                              onChange={handleInputChange('barcode')}
                              placeholder="123456789012"
                              helperText="Product barcode or UPC code"
                              disabled={isViewMode}
                            />
                          </Box>
                          <Box sx={{ flex: 1 }}>
                        <SelectField
                        label="Category"
                              value={formData.categoryId}
                        onChange={handleInputChange('categoryId')}
                              options={categories.length > 0 ? categories.map(category => ({
                                value: category.id,
                                label: category.name
                              })) : []}
                              error={errors.categoryId}
                              helperText={categories.length > 0 ? "Select product category (Required for saving)" : "No categories found. Please add categories first."}
                              required
                              disabled={categories.length === 0 || isViewMode}
                            />
                          </Box>
                        </Box>
                        
                        <SelectField
                        label="Provider"
                          value={formData.providerId}
                        onChange={handleInputChange('providerId')}
                          options={providers.length > 0 ? providers.map(provider => ({
                            value: provider.id,
                            label: provider.business_name || provider.businessName || 'Unknown Provider'
                          })) : [{ value: 1, label: 'No providers available' }]}
                          helperText={providers.length > 0 ? "Select service provider" : "No verified providers found."}
                          disabled={providers.length === 0 || isViewMode}
                        />
                      </Stack>
              </CardContent>
            </Card>
                </Fade>
              )}

              {/* Step 2: Pricing & Inventory */}
              {activeStep === 1 && (
                <Fade in={true}>
            <Card>
              <CardContent>
                      <Typography variant="h6" sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1, color: 'primary.main' }}>
                  <DollarIcon />
                  Pricing & Inventory
                </Typography>
                
                      <Stack spacing={3}>
                        <Box sx={{ display: 'flex', gap: 2 }}>
                          <Box sx={{ flex: 1 }}>
                            <FormField
                              label="Selling Price"
                      value={formData.price}
                      onChange={handleInputChange('price')}
                              error={errors.price}
                              helperText="Customer-facing price"
                              type="number"
                              startAdornment="$"
                              required
                            />
                          </Box>
                          <Box sx={{ flex: 1 }}>
                            <FormField
                      label="Original Price"
                      value={formData.originalPrice}
                      onChange={handleInputChange('originalPrice')}
                              error={errors.originalPrice}
                              helperText="MSRP or regular price"
                              type="number"
                              startAdornment="$"
                            />
                          </Box>
                          <Box sx={{ flex: 1 }}>
                            <FormField
                              label="Cost Price"
                              value={formData.costPrice}
                              onChange={handleInputChange('costPrice')}
                              helperText="Your cost for profit calculation"
                              type="number"
                              startAdornment="$"
                            />
                          </Box>
                        </Box>
                        
                        <Box sx={{ display: 'flex', gap: 2 }}>
                          <Box sx={{ flex: 1 }}>
                            <FormField
                      label="SKU"
                      value={formData.sku}
                      onChange={handleInputChange('sku')}
                              error={errors.sku}
                              helperText="Unique product identifier"
                      placeholder="e.g., PROD-001"
                              required
                            />
                          </Box>
                          <Box sx={{ flex: 1 }}>
                            <FormField
                      label="Stock Quantity"
                      value={formData.stockQuantity}
                      onChange={handleInputChange('stockQuantity')}
                              error={errors.stockQuantity}
                              helperText="Available inventory"
                              type="number"
                            />
                          </Box>
                        </Box>
                        
                        <Box sx={{ display: 'flex', gap: 2 }}>
                          <Box sx={{ flex: 1 }}>
                            <FormField
                              label="Low Stock Threshold"
                              value={formData.lowStockThreshold}
                              onChange={handleInputChange('lowStockThreshold')}
                              helperText="Alert when stock falls below this number"
                              type="number"
                            />
                          </Box>
                          <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', gap: 2 }}>
                            <SwitchField
                              label="Track Inventory"
                              value={formData.trackInventory}
                              onChange={(value: boolean) => setFormData((prev: ProductFormData) => ({ ...prev, trackInventory: value }))}
                              helperText="Enable inventory tracking"
                            />
                            <SwitchField
                              label="Allow Backorder"
                              value={formData.allowBackorder}
                              onChange={(value: boolean) => setFormData((prev: ProductFormData) => ({ ...prev, allowBackorder: value }))}
                              helperText="Allow orders when out of stock"
                            />
                          </Box>
                        </Box>
                      </Stack>
              </CardContent>
            </Card>
                </Fade>
              )}

              {/* Step 3: Media & SEO */}
              {activeStep === 2 && (
                <Fade in={true}>
                  <Stack spacing={3}>
                    <ImageUploadField
                      label="Product Images"
                      value={formData.images}
                      onChange={(images) => setFormData(prev => ({ ...prev, images }))}
                      maxFiles={10}
                      maxSize={10}
                      helperText="Upload high-quality product images"
                    />

            <Card>
              <CardContent>
                        <Typography variant="h6" sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1, color: 'primary.main' }}>
                          SEO & Marketing
                        </Typography>
                        
                        <Stack spacing={3}>
                          <FormField
                            label="SEO Title"
                            value={formData.seoTitle}
                            onChange={handleInputChange('seoTitle')}
                            error={errors.seoTitle}
                            helperText="Optimized title for search engines"
                            placeholder="SEO-optimized product title"
                            showCharCount
                            maxLength={60}
                          />
                          
                          <FormField
                            label="SEO Description"
                            value={formData.seoDescription}
                            onChange={handleInputChange('seoDescription')}
                            error={errors.seoDescription}
                            helperText="Meta description for search results"
                            placeholder="Compelling description for search results"
                            multiline
                            rows={3}
                            showCharCount
                            maxLength={160}
                          />
                          
                          <TagField
                            label="SEO Keywords"
                            value={formData.seoKeywords}
                              onChange={(keywords: string[]) => setFormData((prev: ProductFormData) => ({ ...prev, seoKeywords: keywords }))}
                            placeholder="Add keywords for better search visibility"
                            suggestions={['premium', 'quality', 'professional', 'wireless', 'bluetooth']}
                            maxTags={20}
                            helperText="Add relevant keywords to improve search visibility"
                          />
                          
                          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                            <SwitchField
                              label="Featured Product"
                              value={formData.isFeatured}
                              onChange={(value: boolean) => setFormData((prev: ProductFormData) => ({ ...prev, isFeatured: value }))}
                              helperText="Show on homepage and featured sections"
                            />
                            <SwitchField
                              label="New Product"
                              value={formData.isNew}
                              onChange={(value: boolean) => setFormData((prev: ProductFormData) => ({ ...prev, isNew: value }))}
                              helperText="Mark as new product"
                            />
                            <SwitchField
                              label="On Sale"
                              value={formData.isOnSale}
                              onChange={(value: boolean) => setFormData((prev: ProductFormData) => ({ ...prev, isOnSale: value }))}
                              helperText="Show sale badge"
                            />
                          </Box>
                        </Stack>
                      </CardContent>
                    </Card>
                  </Stack>
                </Fade>
              )}

              {/* Step 4: Shipping & Variants */}
              {activeStep === 3 && (
                <Fade in={true}>
                  <Stack spacing={3}>
                    <Card>
                      <CardContent>
                        <Typography variant="h6" sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1, color: 'primary.main' }}>
                  <ScaleIcon />
                  Physical Properties
                </Typography>
                
                        <Stack spacing={3}>
                          <Box sx={{ display: 'flex', gap: 2 }}>
                            <Box sx={{ flex: 1 }}>
                              <FormField
                                label="Weight"
                      value={formData.weight}
                      onChange={handleInputChange('weight')}
                                error={errors.weight}
                                helperText="Product weight"
                                type="number"
                                endAdornment={formData.weightUnit}
                              />
                            </Box>
                            <Box sx={{ flex: 1 }}>
                              <SelectField
                                label="Weight Unit"
                                value={formData.weightUnit}
                                onChange={(value: string) => setFormData((prev: ProductFormData) => ({ ...prev, weightUnit: value }))}
                                options={[
                                  { value: 'lbs', label: 'Pounds (lbs)' },
                                  { value: 'kg', label: 'Kilograms (kg)' },
                                  { value: 'oz', label: 'Ounces (oz)' },
                                  { value: 'g', label: 'Grams (g)' },
                                ]}
                                helperText="Select weight unit"
                              />
                            </Box>
                          </Box>
                          
                          <Typography variant="subtitle2" sx={{ mb: 1 }}>
                            Dimensions
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 2 }}>
                            <Box sx={{ flex: 1 }}>
                              <FormField
                      label="Length"
                      value={formData.dimensions.length}
                      onChange={handleNestedInputChange('dimensions', 'length')}
                                error={errors.dimensions}
                                type="number"
                              />
                            </Box>
                            <Box sx={{ flex: 1 }}>
                              <FormField
                      label="Width"
                      value={formData.dimensions.width}
                      onChange={handleNestedInputChange('dimensions', 'width')}
                                error={errors.dimensions}
                                type="number"
                              />
                            </Box>
                            <Box sx={{ flex: 1 }}>
                              <FormField
                      label="Height"
                      value={formData.dimensions.height}
                      onChange={handleNestedInputChange('dimensions', 'height')}
                                error={errors.dimensions}
                                type="number"
                    />
                            </Box>
                          </Box>
                        </Stack>
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                        <Typography variant="h6" sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1, color: 'primary.main' }}>
                          Shipping & Handling
                </Typography>
                
                        <Stack spacing={3}>
                          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                            <SwitchField
                              label="Requires Shipping"
                              value={formData.requiresShipping}
                              onChange={(value: boolean) => setFormData((prev: ProductFormData) => ({ ...prev, requiresShipping: value }))}
                              helperText="Product requires physical shipping"
                            />
                            <SwitchField
                              label="Free Shipping"
                              value={formData.freeShipping}
                              onChange={(value: boolean) => setFormData((prev: ProductFormData) => ({ ...prev, freeShipping: value }))}
                              helperText="Offer free shipping for this product"
                            />
                </Box>
                
                          <Box sx={{ display: 'flex', gap: 2 }}>
                            <Box sx={{ flex: 1 }}>
                              <FormField
                                label="Handling Time (days)"
                                value={formData.handlingTime}
                                onChange={handleInputChange('handlingTime')}
                                helperText="Days to prepare for shipment"
                                type="number"
                              />
                </Box>
                            <Box sx={{ flex: 1 }}>
                              <SelectField
                                label="Shipping Class"
                                value={formData.shippingClass}
                                onChange={(value: string) => setFormData((prev: ProductFormData) => ({ ...prev, shippingClass: value }))}
                                options={[
                                  { value: 'standard', label: 'Standard' },
                                  { value: 'express', label: 'Express' },
                                  { value: 'overnight', label: 'Overnight' },
                                  { value: 'fragile', label: 'Fragile' },
                                ]}
                                helperText="Select shipping class"
                              />
                            </Box>
                          </Box>
                        </Stack>
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                        <Typography variant="h6" sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1, color: 'primary.main' }}>
                          <TagIcon />
                          Tags & Collections
                </Typography>
                
                        <Stack spacing={3}>
                          <TagField
                            label="Product Tags"
                            value={formData.tags}
                              onChange={(tags: string[]) => setFormData((prev: ProductFormData) => ({ ...prev, tags }))}
                            placeholder="Add tags to categorize your product"
                            suggestions={['electronics', 'wireless', 'premium', 'bluetooth', 'headphones']}
                            maxTags={20}
                            helperText="Add tags to help customers find your product"
                          />
                </Stack>
              </CardContent>
            </Card>
          </Stack>
                </Fade>
              )}

              {/* Step 5: Advanced Settings */}
              {activeStep === 4 && (
                <Fade in={true}>
          <Stack spacing={3}>
                    <SpecificationField
                      label="Product Specifications"
                      value={formData.specifications}
                              onChange={(specifications: Specification[]) => setFormData((prev: ProductFormData) => ({ ...prev, specifications }))}
                      groups={['General', 'Technical', 'Physical', 'Warranty', 'Other']}
                      maxSpecifications={50}
                      helperText="Add detailed product specifications"
                    />

            <Card>
              <CardContent>
                        <Typography variant="h6" sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1, color: 'primary.main' }}>
                          <SecurityIcon />
                          Status & Visibility
                </Typography>
                
                        <Stack spacing={3}>
                          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                            <SwitchField
                              label="Product Active"
                              value={formData.isActive}
                              onChange={(value: boolean) => setFormData((prev: ProductFormData) => ({ ...prev, isActive: value }))}
                              helperText="Make product visible to customers"
                            />
                          </Box>
                          
                          <Box sx={{ display: 'flex', gap: 2 }}>
                            <Box sx={{ flex: 1 }}>
                              <SelectField
                                label="Visibility"
                                value={formData.visibility}
                                onChange={(value: string) => setFormData((prev: ProductFormData) => ({ ...prev, visibility: value as any }))}
                                options={[
                                  { value: 'public', label: 'Public' },
                                  { value: 'private', label: 'Private' },
                                  { value: 'password', label: 'Password Protected' },
                                ]}
                                helperText="Control product visibility"
                              />
                            </Box>
                            {formData.visibility === 'password' && (
                              <Box sx={{ flex: 1 }}>
                                <FormField
                                  label="Password"
                                  type="password"
                                  value={formData.password}
                                  onChange={handleInputChange('password')}
                                  helperText="Password to access this product"
                                />
                              </Box>
                            )}
                          </Box>
                          
                          <Box sx={{ display: 'flex', gap: 2 }}>
                            <Box sx={{ flex: 1 }}>
                              <DateField
                                label="Publish Date"
                                value={formData.publishDate}
                                onChange={handleInputChange('publishDate')}
                                helperText="When to make product live"
                              />
                            </Box>
                            <Box sx={{ flex: 1 }}>
                              <DateField
                                label="Expiry Date"
                                value={formData.expiryDate}
                                onChange={handleInputChange('expiryDate')}
                                helperText="When to remove product (optional)"
                              />
                            </Box>
                          </Box>
                </Stack>
              </CardContent>
            </Card>
                  </Stack>
                </Fade>
              )}

              {/* Step 6: Review & Publish */}
              {activeStep === 5 && (
                <Fade in={true}>
            <Card>
              <CardContent>
                      <Typography variant="h6" sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1, color: 'primary.main' }}>
                        <CheckIcon />
                        Review & Publish
                </Typography>
                
                      <Alert severity="info" sx={{ mb: 3 }}>
                        Review all information before publishing your product. You can always edit these details later.
                      </Alert>
                      
                      <Box sx={{ display: 'flex', gap: 3 }}>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="h6" sx={{ mb: 2 }}>Product Summary</Typography>
                          <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                              {formData.name || 'Untitled Product'}
                  </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                              {formData.shortDescription || 'No description provided'}
                            </Typography>
                            <Typography variant="h6" color="primary">
                              ${formData.price || 0}
                  </Typography>
                          </Box>
                        </Box>
                        
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="h6" sx={{ mb: 2 }}>Status</Typography>
                          <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                              {formData.isActive ? <CheckIcon color="success" /> : <CheckIcon color="error" />}
                              <Typography variant="body2">
                                {formData.isActive ? 'Active' : 'Inactive'}
                              </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                              {formData.isFeatured ? <CheckIcon color="warning" /> : <CheckIcon color="disabled" />}
                              <Typography variant="body2">
                                {formData.isFeatured ? 'Featured' : 'Not Featured'}
                              </Typography>
                            </Box>
                            <Typography variant="body2" color="text.secondary">
                              Visibility: {formData.visibility}
                            </Typography>
                          </Box>
                        </Box>
                </Box>
              </CardContent>
            </Card>
                </Fade>
              )}

              {/* Navigation Buttons */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
                <Button
                  variant="outlined"
                  onClick={() => setActiveStep(Math.max(0, activeStep - 1))}
                  disabled={activeStep === 0}
                >
                  Previous
                </Button>
                  <Button
                    variant="contained"
                  onClick={() => setActiveStep(Math.min(steps.length - 1, activeStep + 1))}
                  disabled={activeStep === steps.length - 1}
                >
                  Next
                  </Button>
              </Box>
            </Stack>
          </Box>

          {/* Sidebar */}
          <Box sx={{ flex: { xs: 1, lg: 1 } }}>
            <Stack spacing={3}>
              {/* Progress Summary */}
              <Card>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2 }}>
                    Progress
                  </Typography>
                  <LinearProgress 
                    variant="determinate" 
                    value={(activeStep + 1) / steps.length * 100} 
                    sx={{ mb: 2 }}
                  />
                  <Typography variant="body2" color="text.secondary">
                    Step {activeStep + 1} of {steps.length}: {steps[activeStep]}
                  </Typography>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2 }}>
                    Quick Actions
                  </Typography>
                  <Stack spacing={1}>
                  <Button
                    variant="outlined"
                    fullWidth
                    startIcon={<SaveIcon />}
                    onClick={handleSaveDraft}
                    disabled={isLoading}
                  >
                    {isLoading ? 'Saving...' : 'Save Draft'}
                  </Button>
                  <Button
                    variant="text"
                    fullWidth
                      startIcon={<RefreshIcon />}
                    onClick={() => setFormData(initialFormData)}
                  >
                    Reset Form
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          </Stack>
          </Box>
        </Box>
      </Box>
      )}
    </Box>
  )
}

export default AddProduct
