import React, { useState, useRef, useEffect } from 'react'
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
import { Product } from '../../types'
import { formatCurrency } from '../../lib/utils'
import { slugify } from '../../lib/slugify'
import {
  buildProductCreateBody,
  buildProductDraftBody,
  mapProductApiErrorToFormFields,
  normalizeProductImagesFromApi,
  type ProductFormLike,
} from '../../lib/productFormPayload'
import { ProductsService } from '../../services/api/products.service'
import { CategoriesService } from '../../services/api/categories.service'
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
  /** URL segment; auto-filled from name unless edited */
  slug: string
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
  /** Finance vendor (catalog / procurement) */
  vendorId: string
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

function isRichTextEmpty(html: string): boolean {
  const raw = String(html ?? '')
  if (!raw.trim()) return true
  const text = raw
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;|&#160;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  return text.length === 0
}

const ADD_PRODUCT_STEP_ERROR_KEYS: Record<number, string[]> = {
  0: ['name', 'slug', 'shortDescription', 'description', 'categoryId', 'vendorId'],
  1: ['price', 'originalPrice', 'costPrice', 'sku', 'stockQuantity', 'lowStockThreshold'],
  2: ['images', 'seoTitle', 'seoDescription'],
  3: ['weight', 'dimensions', 'handlingTime'],
  4: ['password', 'expiryDate'],
}

function getAddProductStepErrors(
  step: number,
  data: ProductFormData,
  extra?: { brokenImageIds?: string[] },
): Record<string, string> {
  const e: Record<string, string> = {}
  switch (step) {
    case 0:
      if (!data.name.trim()) e.name = 'Product name is required'
      if (!data.shortDescription.trim()) e.shortDescription = 'Short description is required'
      if (isRichTextEmpty(data.description)) e.description = 'Product description is required'
      if (!String(data.categoryId ?? '').trim()) e.categoryId = 'Category is required'
      if (!String(data.vendorId ?? '').trim()) e.vendorId = 'Vendor is required'
      {
        const derived = slugify(data.name)
        const s = data.slug.trim()
        const effectiveSlug = s || derived
        if (!effectiveSlug) {
          e.slug = 'Enter a product name to generate a URL slug'
        }
        if (s && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/i.test(s)) {
          e.slug = 'Use only letters, numbers, and single hyphens (no spaces).'
        }
      }
      break
    case 1:
      if (data.price <= 0) e.price = 'Price must be greater than 0'
      if (data.originalPrice < 0) e.originalPrice = 'Original price cannot be negative'
      if (data.costPrice < 0) e.costPrice = 'Cost price cannot be negative'
      if (!data.sku.trim()) e.sku = 'SKU is required'
      if (data.stockQuantity < 0) e.stockQuantity = 'Stock quantity cannot be negative'
      if (data.lowStockThreshold < 0) e.lowStockThreshold = 'Low stock threshold cannot be negative'
      if (data.originalPrice > 0 && data.price > 0 && data.originalPrice < data.price) {
        e.originalPrice = 'Original price must be greater than or equal to the selling price'
      }
      break
    case 2:
      if (!data.images || data.images.length < 1) {
        e.images = 'At least one product image is required'
      } else {
        if (extra?.brokenImageIds?.length) {
          e.images =
            'One or more images failed to load in the preview. Remove them or upload again before publishing.'
        }
        for (const img of data.images) {
          const u = String(img?.url ?? '').trim()
          if (!u) {
            e.images = 'Each image must finish uploading with a valid URL.'
            break
          }
          try {
            const parsed = new URL(u)
            if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
              throw new Error('bad')
            }
          } catch {
            e.images = 'Images must use valid http(s) URLs from your upload.'
            break
          }
        }
      }
      if (data.seoTitle && data.seoTitle.length > 60) {
        e.seoTitle = 'SEO title should be 60 characters or less'
      }
      if (data.seoDescription && data.seoDescription.length > 160) {
        e.seoDescription = 'SEO description should be 160 characters or less'
      }
      break
    case 3: {
      if (data.weight < 0) {
        e.weight = 'Weight cannot be negative'
      } else if (data.requiresShipping && data.weight <= 0) {
        e.weight = 'Enter a weight greater than 0 for products that require shipping'
      }
      const { length: dLen, width: dWid, height: dHgt } = data.dimensions
      if (dLen < 0 || dWid < 0 || dHgt < 0) e.dimensions = 'Dimensions cannot be negative'
      if (data.handlingTime < 0) e.handlingTime = 'Handling time cannot be negative'
      break
    }
    case 4:
      if (data.visibility === 'password' && !String(data.password || '').trim()) {
        e.password = 'Password is required for password-protected products'
      }
      if (data.expiryDate && data.publishDate) {
        const exp = new Date(data.expiryDate)
        const pub = new Date(data.publishDate)
        if (!Number.isNaN(exp.getTime()) && !Number.isNaN(pub.getTime()) && exp < pub) {
          e.expiryDate = 'Expiry date must be on or after the publish date'
        }
      }
      break
    default:
      break
  }
  return e
}

const initialFormData: ProductFormData = {
  // Basic Information
  name: '',
  slug: '',
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
  vendorId: '',
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
  const slugDirtyRef = useRef(false)
  const [brokenImageIds, setBrokenImageIds] = useState<string[]>([])
  
  const isEditMode = location.pathname.includes('/edit/')
  const isViewMode = location.pathname.includes('/view/')
  const isCreateMode = !isEditMode && !isViewMode
  
  const [formData, setFormData] = useState<ProductFormData>(initialFormData)
  const [errors, setErrors] = useState<any>({})
  const [isLoading, setIsLoading] = useState(false)
  const [activeStep, setActiveStep] = useState(0)
  const [categories, setCategories] = useState<any[]>([])
  const [vendors, setVendors] = useState<Array<{ id: string; name: string; legal_name?: string }>>([])
  const [isLoadingData, setIsLoadingData] = useState(true)

  const theme = useTheme()

  useEffect(() => {
    if (slugDirtyRef.current) return
    const next = slugify(formData.name)
    setFormData((prev) => (prev.slug === next ? prev : { ...prev, slug: next }))
  }, [formData.name])

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
      
      const [productResponse, categoryList, vendorsRes] = await Promise.all([
        ProductsService.getProduct(productId),
        CategoriesService.getCategoriesForProductUIs({ page: 1, limit: 200 }),
        ProductsService.listCatalogVendors(),
      ])
      
      if (Array.isArray(categoryList) && categoryList.length > 0) {
        setCategories(categoryList)
      } else {
        setCategories([])
      }
      
      if (vendorsRes.success && vendorsRes.data?.vendors) {
        setVendors(vendorsRes.data.vendors)
      }
      
      if (productResponse.success && productResponse.data) {
        const product = productResponse.data
    
        // Map product data to form data
        slugDirtyRef.current = true
        setFormData({
          ...initialFormData,
          name: product.name || '',
          slug: product.slug || slugify(product.name || ''),
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
          vendorId: String((product as { vendor_id?: string }).vendor_id ?? ''),
          tags: product.tags || [],
          collections: [],
          weight: parseFloat(product.weight?.toString() || '0'),
          weightUnit: 'lbs',
          dimensions: product.dimensions ? {
            ...product.dimensions,
            unit:
              product.dimensions.unit === 'inch' || product.dimensions.unit === 'in'
                ? 'in'
                : product.dimensions.unit === 'cm'
                  ? 'cm'
                  : 'in',
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
          images: normalizeProductImagesFromApi(product.images as unknown, product.name || ''),
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
      
      const list = await CategoriesService.getCategoriesForProductUIs({
        page: 1,
        limit: 200,
      })
      if (list.length > 0) {
        setCategories(list)
      } else {
        setCategories([])
      }

      const vendorsResponse = await ProductsService.listCatalogVendors()
      if (vendorsResponse.success && vendorsResponse.data?.vendors) {
        setVendors(vendorsResponse.data.vendors)
      }
    } catch (error) {
      console.error('Error fetching initial data:', error)
      dispatch(addToast({
        message: 'Failed to load categories and vendors. Please refresh the page.',
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
    if (errors.description) {
      setErrors((prev: any) => ({
        ...prev,
        description: undefined,
      }))
    }
  }

  const handleNestedInputChange = (parentField: keyof ProductFormData, childField: string) => (
    eventOrValue: React.ChangeEvent<HTMLInputElement> | string | number
  ) => {
    let value: string | number
    if (eventOrValue != null && typeof eventOrValue === 'object' && 'target' in eventOrValue) {
      const t = (eventOrValue as React.ChangeEvent<HTMLInputElement>).target
      value = t.type === 'number' ? Number(t.value) || 0 : t.value
    } else if (eventOrValue === '' || eventOrValue === null || eventOrValue === undefined) {
      value = 0
    } else if (typeof eventOrValue === 'number') {
      value = Number.isNaN(eventOrValue) ? 0 : eventOrValue
    } else {
      const n = Number(eventOrValue)
      value = Number.isNaN(n) ? 0 : n
    }
    setFormData((prev: ProductFormData) => ({
      ...prev,
      [parentField]: {
        ...(prev[parentField] as object),
        [childField]: value,
      },
    }))
    if (parentField === 'dimensions' && errors.dimensions) {
      setErrors((prev: Record<string, string | undefined>) => ({ ...prev, dimensions: undefined }))
    }
  }

  const validateStep = (step: number): boolean => {
    const stepErrs = getAddProductStepErrors(step, formData, { brokenImageIds })
    setErrors((prev: any) => {
      const keys = ADD_PRODUCT_STEP_ERROR_KEYS[step] || []
      const next = { ...prev }
      keys.forEach((k) => {
        delete next[k]
      })
      return { ...next, ...stepErrs }
    })
    return Object.keys(stepErrs).length === 0
  }

  const validateForm = (options?: { focusFirstInvalid?: boolean }): boolean => {
    const merged: Record<string, string> = {}
    let firstInvalid: number | null = null
    for (let s = 0; s <= 4; s++) {
      const e = getAddProductStepErrors(s, formData, { brokenImageIds })
      Object.assign(merged, e)
      if (firstInvalid === null && Object.keys(e).length > 0) {
        firstInvalid = s
      }
    }
    setErrors(merged)
    if (options?.focusFirstInvalid && Object.keys(merged).length > 0 && firstInvalid !== null) {
      setActiveStep(firstInvalid)
    }
    return Object.keys(merged).length === 0
  }

  const goToStep = (index: number) => {
    if (isViewMode) {
      setActiveStep(index)
      return
    }
    if (index === activeStep) {
      return
    }
    if (index < activeStep) {
      setActiveStep(index)
      return
    }
    for (let s = activeStep; s < index; s++) {
      if (!validateStep(s)) {
        setActiveStep(s)
        dispatch(
          addToast({
            message: 'Complete the required fields in this step before continuing.',
            severity: 'error',
            duration: 4000,
          })
        )
        return
      }
    }
    setActiveStep(index)
  }

  const handleNext = () => {
    if (isViewMode) {
      setActiveStep((s) => Math.min(steps.length - 1, s + 1))
      return
    }
    if (activeStep >= steps.length - 1) {
      return
    }
    if (!validateStep(activeStep)) {
      dispatch(
        addToast({
          message: 'Please fix the errors in this step before continuing.',
          severity: 'error',
          duration: 4000,
        })
      )
      return
    }
    setActiveStep((s) => Math.min(steps.length - 1, s + 1))
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    
    if (!validateForm({ focusFirstInvalid: true })) {
      dispatch(addToast({
        message: 'Please fix the validation errors before submitting.',
        severity: 'error',
        duration: 4000,
      }))
      return
    }

    setIsLoading(true)
    
    try {
      const productData = buildProductCreateBody(formData as ProductFormLike)
      let response
      if (isEditMode && id) {
        response = await ProductsService.updateProduct(id, productData, { showErrorToast: false })
        if (response.success) {
          dispatch(addToast({
            message: 'Product updated successfully!',
            severity: 'success',
            duration: 4000,
          }))
          navigate('/products')
        }
      } else {
        response = await ProductsService.createProduct(productData, { showErrorToast: false })
        if (response.success) {
          dispatch(addToast({
            message: 'Product created successfully!',
            severity: 'success',
            duration: 4000,
          }))
          navigate('/products')
        }
      }
    } catch (error: unknown) {
      console.error('Error saving product:', error)
      const msg =
        error && typeof error === 'object' && 'message' in error
          ? String((error as { message?: string }).message)
          : ''
      const fieldErrs = mapProductApiErrorToFormFields(msg)
      setErrors((prev: Record<string, string | undefined>) => ({ ...prev, ...fieldErrs }))
      if (fieldErrs.slug) setActiveStep(0)
      else if (fieldErrs.images) setActiveStep(2)
      else if (fieldErrs.categoryId || fieldErrs.vendorId) setActiveStep(0)
      if (Object.keys(fieldErrs).length === 0) {
        dispatch(addToast({
          message: isEditMode ? 'Failed to update product.' : 'Failed to create product.',
          severity: 'error',
          duration: 4000,
        }))
      } else {
        dispatch(addToast({
          message: 'Fix the highlighted fields and try again.',
          severity: 'error',
          duration: 5000,
        }))
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveDraft = async () => {
    if (!String(formData.categoryId ?? '').trim()) {
      setErrors((prev: any) => ({
        ...prev,
        categoryId: 'Select a category to save a draft',
      }))
      dispatch(
        addToast({
          message: 'Select a category before saving a draft.',
          severity: 'error',
          duration: 4000,
        })
      )
      setActiveStep(0)
      return
    }
    if (!String(formData.vendorId ?? '').trim()) {
      setErrors((prev: any) => ({
        ...prev,
        vendorId: 'Select a vendor to save a draft',
      }))
      dispatch(
        addToast({
          message: 'Select a vendor (Finance directory) before saving a draft.',
          severity: 'error',
          duration: 4000,
        })
      )
      setActiveStep(0)
      return
    }

    setIsLoading(true)
    
    try {
      const productData = buildProductDraftBody(formData as ProductFormLike)
      const response = await ProductsService.createProductDraft(productData, { showErrorToast: false })
      if (response.success) {
        dispatch(addToast({
          message: 'Product draft saved successfully! You can find it in the "Drafts" tab.',
          severity: 'success',
          duration: 5000,
        }))
        navigate('/products')
      }
    } catch (error: unknown) {
      console.error('Error saving draft:', error)
      const msg =
        error && typeof error === 'object' && 'message' in error
          ? String((error as { message?: string }).message)
          : ''
      const fieldErrs = mapProductApiErrorToFormFields(msg)
      setErrors((prev: Record<string, string | undefined>) => ({ ...prev, ...fieldErrs }))
      if (fieldErrs.slug) setActiveStep(0)
      else if (fieldErrs.images) setActiveStep(2)
      if (Object.keys(fieldErrs).length === 0) {
        dispatch(addToast({
          message: 'Failed to save draft. Please try again.',
          severity: 'error',
          duration: 4000,
        }))
      } else {
        dispatch(addToast({
          message: 'Fix the highlighted fields and try saving the draft again.',
          severity: 'error',
          duration: 5000,
        }))
      }
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
              Loading categories and vendors...
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
                    onClick={() => goToStep(index)}
                    sx={{ cursor: isViewMode || !isLoadingData ? 'pointer' : 'default' }}
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
                          label="URL slug"
                          value={formData.slug}
                          onChange={(e) => {
                            slugDirtyRef.current = true
                            handleInputChange('slug')(e)
                          }}
                          error={errors.slug}
                          helperText="Used in product URLs. Fills from the name until you edit it."
                          disabled={isViewMode}
                          placeholder="e.g., professional-wireless-headphones"
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
                          label="Vendor"
                          value={formData.vendorId}
                          onChange={handleInputChange('vendorId')}
                          options={vendors.map((v) => ({
                            value: v.id,
                            label: v.legal_name?.trim() ? `${v.name} (${v.legal_name})` : v.name,
                          }))}
                          error={errors.vendorId}
                          helperText={
                            vendors.length > 0
                              ? 'Supplier from Finance → Directory (procurement / AP).'
                              : 'No active vendors. Add vendors under Finance → Directory, then refresh.'
                          }
                          required
                          disabled={vendors.length === 0 || isViewMode}
                          placeholder="Select vendor"
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
                              startAdornment="₹"
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
                              startAdornment="₹"
                            />
                          </Box>
                          <Box sx={{ flex: 1 }}>
                            <FormField
                      label="Cost Price"
                      value={formData.costPrice}
                      onChange={handleInputChange('costPrice')}
                              error={errors.costPrice}
                              helperText="Your cost for profit calculation"
                              type="number"
                              startAdornment="₹"
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
                      error={errors.lowStockThreshold}
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
                    {errors.images && (
                      <Alert severity="error" sx={{ borderRadius: 1 }}>
                        {errors.images}
                      </Alert>
                    )}
                    <ImageUploadField
                      label="Product Images"
                      value={formData.images}
                      onChange={(images) => {
                        setFormData((prev) => ({ ...prev, images }))
                        if (errors.images) {
                          setErrors((prev: any) => ({ ...prev, images: undefined }))
                        }
                      }}
                      onBrokenImageIdsChange={setBrokenImageIds}
                      error={errors.images}
                      required
                      maxFiles={10}
                      maxSize={10}
                      helperText="Upload high-quality images. We verify each file after upload; fix any that fail to load in the preview."
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
                          <SelectField
                            label="Dimension unit"
                            value={formData.dimensions.unit === 'cm' ? 'cm' : 'in'}
                            onChange={(value: string) =>
                              setFormData((prev: ProductFormData) => ({
                                ...prev,
                                dimensions: { ...prev.dimensions, unit: value === 'cm' ? 'cm' : 'in' },
                              }))
                            }
                            options={[
                              { value: 'in', label: 'Inches (in)' },
                              { value: 'cm', label: 'Centimeters (cm)' },
                            ]}
                            helperText="Stored as cm or inch for shipping records"
                            disabled={isViewMode}
                          />
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
                                error={errors.handlingTime}
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
                                  error={errors.password}
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
                                error={errors.expiryDate}
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
                      
                      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3 }}>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="h6" sx={{ mb: 2 }}>Product Summary</Typography>
                          <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                              {formData.name || 'Untitled Product'}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                              Category: {categories.find((c) => String(c.id) === String(formData.categoryId))?.name || '—'}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                              SKU: {formData.sku || '—'} · Stock: {formData.stockQuantity ?? 0}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                              Images: {formData.images?.length ?? 0} · Tags: {formData.tags?.length ?? 0}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                              {formData.shortDescription || 'No short description'}
                            </Typography>
                            <Typography variant="h6" color="primary" sx={{ fontWeight: 700 }}>
                              {formatCurrency(formData.price || 0)}
                            </Typography>
                            {formData.originalPrice > 0 && formData.originalPrice > (formData.price || 0) && (
                              <Typography variant="body2" color="text.secondary" sx={{ textDecoration: 'line-through' }}>
                                {formatCurrency(formData.originalPrice)}
                              </Typography>
                            )}
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
                            <Typography variant="body2" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                              Visibility: {formData.visibility}
                            </Typography>
                            {formData.vendorId && (() => {
                              const v = vendors.find((x) => String(x.id) === String(formData.vendorId))
                              const label =
                                v?.legal_name?.trim() ? `${v.name} (${v.legal_name})` : v?.name || '—'
                              return (
                                <Typography variant="body2" color="text.secondary">
                                  Vendor: {label}
                                </Typography>
                              )
                            })()}
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
                  onClick={handleNext}
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
                    onClick={() => {
                      slugDirtyRef.current = false
                      setBrokenImageIds([])
                      setFormData(initialFormData)
                    }}
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
