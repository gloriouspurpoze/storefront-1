import React, { useState, useRef, useEffect } from 'react'
import {
  Loader2,
  ArrowLeft,
  Package,
  IndianRupee,
  Image as ImageIcon,
  Scale,
  Tag,
  FileText,
  Shield,
  CheckCircle2,
  RefreshCw,
  Save,
  Sparkles,
} from 'lucide-react'
import { Button } from '../../components/ui/button'
import { Card, CardContent } from '../../components/ui/card'
import { cn } from '../../lib/utils'
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
import {
  buildProductSeoSuggestion,
  fillMissingProductSeo,
  type ProductSeoInput,
} from '../../lib/productSeoAutogen'
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
        limit: 20,
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

  /** Build the SEO source payload from current form + category lookup. */
  const buildSeoSource = React.useCallback((): ProductSeoInput => {
    const cat = categories.find((c: any) => c?.id === formData.categoryId || c?._id === formData.categoryId)
    return {
      name: formData.name,
      brand: formData.brand,
      model: formData.model,
      categoryLabel: (cat?.name ?? cat?.title ?? '') as string,
      shortDescription: formData.shortDescription,
      description: formData.description,
      price: formData.price,
      originalPrice: formData.originalPrice,
      tags: formData.tags,
      specifications: formData.specifications,
      isOnSale: formData.isOnSale,
      isNew: formData.isNew,
      isFeatured: formData.isFeatured,
      freeShipping: formData.freeShipping,
      warrantyPeriod: formData.warrantyPeriod,
    }
  }, [formData, categories])

  /** Regenerate all SEO fields from scratch (user-initiated, overwrites current). */
  const handleAutoGenerateSeo = () => {
    const src = buildSeoSource()
    if (!src.name?.trim()) {
      dispatch(addToast({
        message: 'Add the product name first — we use it to craft SEO copy.',
        severity: 'warning',
        duration: 3500,
      }))
      return
    }
    const suggestion = buildProductSeoSuggestion(src)
    setFormData((prev) => ({
      ...prev,
      seoTitle: suggestion.title,
      seoDescription: suggestion.description,
      seoKeywords: suggestion.keywords,
    }))
    setErrors((prev: any) => ({
      ...prev,
      seoTitle: undefined,
      seoDescription: undefined,
    }))
    dispatch(addToast({
      message: 'SEO copy auto-generated from product details.',
      severity: 'success',
      duration: 3000,
    }))
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

    // Silently auto-fill any blank SEO field so we never persist a product with empty meta.
    const autofilled = fillMissingProductSeo(
      {
        seoTitle: formData.seoTitle,
        seoDescription: formData.seoDescription,
        seoKeywords: formData.seoKeywords,
      },
      buildSeoSource(),
    )
    const formForSubmit: ProductFormData = {
      ...formData,
      seoTitle: autofilled.seoTitle,
      seoDescription: autofilled.seoDescription,
      seoKeywords: autofilled.seoKeywords,
    }
    if (
      formForSubmit.seoTitle !== formData.seoTitle ||
      formForSubmit.seoDescription !== formData.seoDescription ||
      formForSubmit.seoKeywords !== formData.seoKeywords
    ) {
      setFormData(formForSubmit)
    }

    setIsLoading(true)
    
    try {
      const productData = buildProductCreateBody(formForSubmit as ProductFormLike)
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
    <div className="min-h-screen flex-1 bg-muted/40">
      {/* Header */}
      <div className="mb-6 border-b border-border bg-card px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Button variant="ghost" size="icon" className="mr-4 text-primary" onClick={() => navigate('/products')} aria-label="Back">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                {isViewMode ? 'View Product' : isEditMode ? 'Edit Product' : 'Create New Product'}
              </h1>
              <p className="text-sm text-muted-foreground">
                {isViewMode ? 'View product details and information' : isEditMode ? 'Update product information and details' : 'Build a comprehensive product listing with all necessary details'}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            {!isViewMode && (
              <>
                <Button
                  variant="outline"
                  onClick={handleSaveDraft}
                  disabled={isLoading || isLoadingData}
                >
                  <Save className="mr-2 h-4 w-4" />
                  {isLoading ? 'Saving...' : 'Save Draft'}
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={isLoading || isLoadingData}
                  className="min-w-[140px]"
                >
                  <Save className="mr-2 h-4 w-4" />
                  {isLoading ? (isEditMode ? 'Updating...' : 'Creating...') : (isEditMode ? 'Update Product' : 'Create Product')}
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Loading Initial Data */}
      {isLoadingData && (
        <div className="flex min-h-[400px] items-center justify-center px-6">
          <div className="text-center">
            <Loader2 className="mx-auto mb-4 h-12 w-12 animate-spin text-muted-foreground" />
            <p className="text-lg text-muted-foreground">Loading categories and vendors...</p>
          </div>
        </div>
      )}

      {/* Form Content */}
      {!isLoadingData && (
      <div className="px-6">
        {/* Progress Stepper */}
        <Card className="mb-6 overflow-visible">
          <CardContent className="pb-4">
            <div className="flex flex-wrap justify-center gap-2">
              {steps.map((label, index) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => goToStep(index)}
                  className={cn(
                    'rounded-full border px-3 py-2 text-left text-xs font-medium transition-colors sm:text-sm',
                    index === activeStep
                      ? 'border-primary bg-primary/10 text-primary'
                      : index < activeStep
                        ? 'border-storm-deep/50 bg-storm-deep/5 text-storm-deep'
                        : 'border-border bg-background hover:bg-muted',
                  )}
                >
                  <span className="block text-[10px] uppercase text-muted-foreground">Step {index + 1}</span>
                  {label}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-8 lg:flex-row">
        {/* Main Form */}
          <div className="min-w-0 flex-1 lg:flex-[2]">
          <div className="flex flex-col gap-6">
              {/* Step 1: Basic Information */}
              {activeStep === 0 && (
                
            <Card>
              <CardContent>
                      <h2 className="mb-6 flex items-center gap-2 text-lg font-semibold text-primary">
                  <Package className="h-5 w-5" />
                  Basic Information
                </h2>
                
                      <div className="flex flex-col gap-6">
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
                        
                        <div className="flex flex-wrap gap-4">
                          <div className="min-w-[200px] flex-1">
                            <FormField
                              label="Brand"
                              value={formData.brand}
                              onChange={handleInputChange('brand')}
                              placeholder="e.g., Apple, Samsung"
                              helperText="Product brand or manufacturer"
                              disabled={isViewMode}
                            />
                          </div>
                          <div className="min-w-[200px] flex-1">
                            <FormField
                              label="Model"
                              value={formData.model}
                              onChange={handleInputChange('model')}
                              placeholder="e.g., iPhone 15 Pro"
                              helperText="Product model number"
                              disabled={isViewMode}
                            />
                          </div>
                        </div>
                        
                        <div className="flex flex-wrap gap-4">
                          <div className="min-w-[200px] flex-1">
                            <FormField
                              label="Barcode / UPC"
                              value={formData.barcode}
                              onChange={handleInputChange('barcode')}
                              placeholder="123456789012"
                              helperText="Product barcode or UPC code"
                              disabled={isViewMode}
                            />
                          </div>
                          <div className="min-w-[200px] flex-1">
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
                          </div>
                        </div>
                        
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
                      </div>
              </CardContent>
            </Card>
                
              )}

              {/* Step 2: Pricing & Inventory */}
              {activeStep === 1 && (
                
            <Card>
              <CardContent>
                      <h2 className="mb-6 flex items-center gap-2 text-lg font-semibold text-primary">
                      <IndianRupee className="h-5 w-5" />
                  Pricing & Inventory
                </h2>
                
                      <div className="flex flex-col gap-6">
                        <div className="flex flex-wrap gap-4">
                          <div className="min-w-[200px] flex-1">
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
                          </div>
                          <div className="min-w-[200px] flex-1">
                            <FormField
                      label="Original Price"
                      value={formData.originalPrice}
                      onChange={handleInputChange('originalPrice')}
                              error={errors.originalPrice}
                              helperText="MSRP or regular price"
                              type="number"
                              startAdornment="₹"
                            />
                          </div>
                          <div className="min-w-[200px] flex-1">
                            <FormField
                      label="Cost Price"
                      value={formData.costPrice}
                      onChange={handleInputChange('costPrice')}
                              error={errors.costPrice}
                              helperText="Your cost for profit calculation"
                              type="number"
                              startAdornment="₹"
                            />
                          </div>
                        </div>
                        
                        <div className="flex flex-wrap gap-4">
                          <div className="min-w-[200px] flex-1">
                            <FormField
                      label="SKU"
                      value={formData.sku}
                      onChange={handleInputChange('sku')}
                              error={errors.sku}
                              helperText="Unique product identifier"
                      placeholder="e.g., PROD-001"
                              required
                            />
                          </div>
                          <div className="min-w-[200px] flex-1">
                            <FormField
                      label="Stock Quantity"
                      value={formData.stockQuantity}
                      onChange={handleInputChange('stockQuantity')}
                              error={errors.stockQuantity}
                              helperText="Available inventory"
                              type="number"
                            />
                          </div>
                        </div>
                        
                        <div className="flex flex-wrap gap-4">
                          <div className="min-w-[200px] flex-1">
                            <FormField
                      label="Low Stock Threshold"
                      value={formData.lowStockThreshold}
                      onChange={handleInputChange('lowStockThreshold')}
                      error={errors.lowStockThreshold}
                      helperText="Alert when stock falls below this number"
                      type="number"
                    />
                          </div>
                          <div className="flex min-w-[200px] flex-1 items-center gap-4">
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
                          </div>
                        </div>
                      </div>
              </CardContent>
            </Card>
                
              )}

              {/* Step 3: Media & SEO */}
              {activeStep === 2 && (
                
                  <div className="flex flex-col gap-6">
                    {errors.images && (
                      <div className="mb-4 rounded-md border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
                        {errors.images}
                      </div>
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
                        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <h2 className="flex items-center gap-2 text-lg font-semibold text-primary">
                              SEO & Marketing
                            </h2>
                            <p className="mt-0.5 text-xs text-muted-foreground">
                              We auto-fill anything you leave blank when you save. Click <span className="font-medium">Auto-generate</span> to (re)write everything from the product details.
                            </p>
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleAutoGenerateSeo}
                            disabled={!formData.name.trim()}
                            className="gap-1.5"
                          >
                            <Sparkles className="h-4 w-4" />
                            Auto-generate SEO
                          </Button>
                        </div>
                        
                        <div className="flex flex-col gap-6">
                          <FormField
                            label="SEO Title"
                            value={formData.seoTitle}
                            onChange={handleInputChange('seoTitle')}
                            error={errors.seoTitle}
                            helperText="We auto-fill this from the product name on save if blank — or click Auto-generate to refresh."
                            placeholder="Auto-generated from product details if left blank"
                            showCharCount
                            maxLength={60}
                          />
                          
                          <FormField
                            label="SEO Description"
                            value={formData.seoDescription}
                            onChange={handleInputChange('seoDescription')}
                            error={errors.seoDescription}
                            helperText="Auto-filled from short description, price and trust signals when left blank."
                            placeholder="Auto-generated from product details if left blank"
                            multiline
                            rows={3}
                            showCharCount
                            maxLength={160}
                          />
                          
                          <TagField
                            label="SEO Keywords"
                            value={formData.seoKeywords}
                              onChange={(keywords: string[]) => setFormData((prev: ProductFormData) => ({ ...prev, seoKeywords: keywords }))}
                            placeholder="Auto-generated from product name, brand, category & tags if blank"
                            suggestions={['premium', 'quality', 'professional', 'wireless', 'bluetooth']}
                            maxTags={20}
                            helperText="We synthesize keywords from name, brand, category, tags & specs on save."
                          />
                          
                          <div className="flex flex-wrap gap-4">
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
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                
              )}

              {/* Step 4: Shipping & Variants */}
              {activeStep === 3 && (
                
                  <div className="flex flex-col gap-6">
                    <Card>
                      <CardContent>
                        <h2 className="mb-6 flex items-center gap-2 text-lg font-semibold text-primary">
                  <Scale className="h-5 w-5" />
                  Physical Properties
                </h2>
                
                        <div className="flex flex-col gap-6">
                          <div className="flex flex-wrap gap-4">
                            <div className="min-w-[200px] flex-1">
                              <FormField
                                label="Weight"
                      value={formData.weight}
                      onChange={handleInputChange('weight')}
                                error={errors.weight}
                                helperText="Product weight"
                                type="number"
                                endAdornment={formData.weightUnit}
                              />
                            </div>
                            <div className="min-w-[200px] flex-1">
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
                            </div>
                          </div>
                          
                          <p className="mb-2 text-sm font-medium">
                            Dimensions
                          </p>
                          <div className="flex flex-wrap gap-4">
                            <div className="min-w-[200px] flex-1">
                              <FormField
                      label="Length"
                      value={formData.dimensions.length}
                      onChange={handleNestedInputChange('dimensions', 'length')}
                                error={errors.dimensions}
                                type="number"
                              />
                            </div>
                            <div className="min-w-[200px] flex-1">
                              <FormField
                      label="Width"
                      value={formData.dimensions.width}
                      onChange={handleNestedInputChange('dimensions', 'width')}
                                error={errors.dimensions}
                                type="number"
                              />
                            </div>
                            <div className="min-w-[200px] flex-1">
                              <FormField
                      label="Height"
                      value={formData.dimensions.height}
                      onChange={handleNestedInputChange('dimensions', 'height')}
                                error={errors.dimensions}
                                type="number"
                    />
                            </div>
                          </div>
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
                        </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                        <h2 className="mb-6 flex items-center gap-2 text-lg font-semibold text-primary">
                          Shipping & Handling
                </h2>
                
                        <div className="flex flex-col gap-6">
                          <div className="flex flex-wrap gap-4">
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
                </div>
                
                          <div className="flex flex-wrap gap-4">
                            <div className="min-w-[200px] flex-1">
                              <FormField
                                label="Handling Time (days)"
                                value={formData.handlingTime}
                                onChange={handleInputChange('handlingTime')}
                                error={errors.handlingTime}
                                helperText="Days to prepare for shipment"
                                type="number"
                              />
                </div>
                            <div className="min-w-[200px] flex-1">
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
                            </div>
                          </div>
                        </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                        <h2 className="mb-6 flex items-center gap-2 text-lg font-semibold text-primary">
                          <Tag className="h-5 w-5" />
                          Tags & Collections
                </h2>
                
                        <div className="flex flex-col gap-6">
                          <TagField
                            label="Product Tags"
                            value={formData.tags}
                              onChange={(tags: string[]) => setFormData((prev: ProductFormData) => ({ ...prev, tags }))}
                            placeholder="Add tags to categorize your product"
                            suggestions={['electronics', 'wireless', 'premium', 'bluetooth', 'headphones']}
                            maxTags={20}
                            helperText="Add tags to help customers find your product"
                          />
                </div>
              </CardContent>
            </Card>
          </div>
                
              )}

              {/* Step 5: Advanced Settings */}
              {activeStep === 4 && (
                
          <div className="flex flex-col gap-6">
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
                        <h2 className="mb-6 flex items-center gap-2 text-lg font-semibold text-primary">
                          <Shield className="h-5 w-5" />
                          Status & Visibility
                </h2>
                
                        <div className="flex flex-col gap-6">
                          <div className="flex flex-wrap gap-4">
                            <SwitchField
                              label="Product Active"
                              value={formData.isActive}
                              onChange={(value: boolean) => setFormData((prev: ProductFormData) => ({ ...prev, isActive: value }))}
                              helperText="Make product visible to customers"
                            />
                          </div>
                          
                          <div className="flex flex-wrap gap-4">
                            <div className="min-w-[200px] flex-1">
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
                            </div>
                            {formData.visibility === 'password' && (
                              <div className="min-w-[200px] flex-1">
                                <FormField
                                  label="Password"
                                  type="password"
                                  value={formData.password}
                                  onChange={handleInputChange('password')}
                                  error={errors.password}
                                  helperText="Password to access this product"
                                />
                              </div>
                            )}
                          </div>
                          
                          <div className="flex flex-wrap gap-4">
                            <div className="min-w-[200px] flex-1">
                              <DateField
                                label="Publish Date"
                                value={formData.publishDate}
                                onChange={handleInputChange('publishDate')}
                                helperText="When to make product live"
                              />
                            </div>
                            <div className="min-w-[200px] flex-1">
                              <DateField
                                label="Expiry Date"
                                value={formData.expiryDate}
                                onChange={handleInputChange('expiryDate')}
                                error={errors.expiryDate}
                                helperText="When to remove product (optional)"
                              />
                            </div>
                          </div>
                </div>
              </CardContent>
            </Card>
                  </div>
                
              )}

              {/* Step 6: Review & Publish */}
              {activeStep === 5 && (
                
            <Card>
              <CardContent>
                      <h2 className="mb-6 flex items-center gap-2 text-lg font-semibold text-primary">
                        <CheckCircle2 className="h-5 w-5" />
                        Review & Publish
                </h2>
                
                      <div className="mb-6 rounded-lg border border-primary/30 bg-primary/10 p-4 text-sm">
                        Review all information before publishing your product. You can always edit these details later.
                      </div>
                      
                      <div className="flex flex-col gap-6 md:flex-row">
                        <div className="min-w-[200px] flex-1">
                          <h3 className="mb-4 text-lg font-semibold">Product Summary</h3>
                          <div className="rounded-md bg-muted/60 p-4">
                            <p className="mb-2 text-base font-semibold">
                              {formData.name || 'Untitled Product'}
                            </p>
                            <p className="mb-1 text-sm text-muted-foreground">
                              Category: {categories.find((c) => String(c.id) === String(formData.categoryId))?.name || '—'}
                            </p>
                            <p className="mb-1 text-sm text-muted-foreground">
                              SKU: {formData.sku || '—'} · Stock: {formData.stockQuantity ?? 0}
                            </p>
                            <p className="mb-2 text-sm text-muted-foreground">
                              Images: {formData.images?.length ?? 0} · Tags: {formData.tags?.length ?? 0}
                            </p>
                            <p className="mb-4 text-sm text-muted-foreground">
                              {formData.shortDescription || 'No short description'}
                            </p>
                            <p className="text-xl font-bold text-primary">
                              {formatCurrency(formData.price || 0)}
                            </p>
                            {formData.originalPrice > 0 && formData.originalPrice > (formData.price || 0) && (
                              <p className="text-sm text-muted-foreground line-through">
                                {formatCurrency(formData.originalPrice)}
                              </p>
                            )}
                          </div>
                        </div>
                        
                        <div className="min-w-[200px] flex-1">
                          <h3 className="mb-4 text-lg font-semibold">Status</h3>
                          <div className="rounded-md bg-muted/60 p-4">
                            <div className="mb-2 flex items-center gap-2">
                              <CheckCircle2 className={cn('h-4 w-4', formData.isActive ? 'text-storm-deep' : 'text-destructive')} />
                              <p className="text-sm">
                                {formData.isActive ? 'Active' : 'Inactive'}
                              </p>
                            </div>
                            <div className="mb-2 flex items-center gap-2">
                              <CheckCircle2 className={cn('h-4 w-4', formData.isFeatured ? 'text-bloom-coral' : 'text-muted-foreground')} />
                              <p className="text-sm">
                                {formData.isFeatured ? 'Featured' : 'Not Featured'}
                              </p>
                            </div>
                            <p className="mb-2 block text-sm text-muted-foreground">
                              Visibility: {formData.visibility}
                            </p>
                            {formData.vendorId && (() => {
                              const v = vendors.find((x) => String(x.id) === String(formData.vendorId))
                              const label =
                                v?.legal_name?.trim() ? `${v.name} (${v.legal_name})` : v?.name || '—'
                              return (
                                <p className="text-sm text-muted-foreground">
                                  Vendor: {label}
                                </p>
                              )
                            })()}
                          </div>
                        </div>
                </div>
              </CardContent>
            </Card>
                
              )}

              {/* Navigation Buttons */}
              <div className="mt-8 flex justify-between">
                <Button
                  variant="outline"
                  onClick={() => setActiveStep(Math.max(0, activeStep - 1))}
                  disabled={activeStep === 0}
                >
                  Previous
                </Button>
                  <Button
                  onClick={handleNext}
                  disabled={activeStep === steps.length - 1}
                >
                  Next
                  </Button>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="min-w-0 flex-1">
            <div className="flex flex-col gap-6">
              {/* Progress Summary */}
              <Card>
                <CardContent>
                  <h3 className="mb-4 text-lg font-semibold">
                    Progress
                  </h3>
                  <div className="mb-4 h-2 w-full overflow-hidden rounded-full bg-secondary">
                    <div
                      className="h-full bg-primary transition-all"
                      style={{ width: `${((activeStep + 1) / steps.length) * 100}%` }}
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Step {activeStep + 1} of {steps.length}: {steps[activeStep]}
                  </p>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card>
                <CardContent>
                  <h3 className="mb-4 text-lg font-semibold">
                    Quick Actions
                  </h3>
                  <div className="flex flex-col gap-2">
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={handleSaveDraft}
                    disabled={isLoading}
                  >
                    <Save className="mr-2 h-4 w-4" />
                    {isLoading ? 'Saving...' : 'Save Draft'}
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full"
                      onClick={() => {
                      slugDirtyRef.current = false
                      setBrokenImageIds([])
                      setFormData(initialFormData)
                    }}
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Reset Form
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
          </div>
        </div>
      </div>
      )}
    </div>
  )
}

export default AddProduct
