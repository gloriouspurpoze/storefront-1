import React, { useState, useEffect } from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Grid,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Divider,
  Stack,
  Paper,
  Alert,
  Snackbar,
  CircularProgress,
  IconButton,
  Tooltip,
  Tabs,
  Tab,
  Checkbox,
  FormGroup,
  FormControlLabel as MuiFormControlLabel,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material'
import {
  ArrowBack as ArrowBackIcon,
  Save as SaveIcon,
  Preview as PreviewIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Upload as UploadIcon,
  Star as StarIcon,
  Schedule as ScheduleIcon,
  AttachMoney as MoneyIcon,
  Category as CategoryIcon,
  Description as DescriptionIcon,
  Tag as TagIcon,
  Info as InfoIcon,
  CalendarToday as CalendarIcon,
  LocationOn as LocationIcon,
  Build as BuildIcon,
  ExpandMore as ExpandMoreIcon,
  ArrowUpward as ArrowUpIcon,
  ArrowDownward as ArrowDownIcon,
  CheckCircleOutline as CheckIcon,
  CancelOutlined as CrossIcon,
  LightbulbOutlined as LightbulbIcon,
  VerifiedUserOutlined as ShieldIcon,
  HelpOutlineOutlined as HelpIcon,
  Timeline as TimelineIcon,
} from '@mui/icons-material'
import { useNavigate, useParams } from 'react-router-dom'
import { platformServicesService, PlatformService } from '../../services/api/platformServices.service'
import { CategoriesService } from '../../services/api/categories.service'
import { SubcategoriesService } from '../../services/api/subcategories.service'
import { ProvidersService } from '../../services/api/providers.service'
import { ProductsService } from '../../services/api/products.service'
import {
  RichTextField,
  ImageUploadField,
  type ImageFile,
} from '../../components/forms'

const PRICE_TYPES = [
  { value: 'fixed', label: 'Fixed Price' },
  { value: 'hourly', label: 'Hourly Rate' },
  { value: 'consultation', label: 'Consultation' },
]

const WORKING_DAYS = [
  'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'
]

const TIME_SLOTS = [
  { value: 'morning', label: 'Morning (9:00 AM - 12:00 PM)' },
  { value: 'afternoon', label: 'Afternoon (12:00 PM - 3:00 PM)' },
  { value: 'evening', label: 'Evening (3:00 PM - 6:00 PM)' },
  { value: 'night', label: 'Night (6:00 PM - 9:00 PM)' },
]

export function CreateService() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>() // Get service ID from URL for edit mode
  const isEditMode = Boolean(id)
  const [loading, setLoading] = useState(false)
  const [loadingService, setLoadingService] = useState(false)
  const [previewMode, setPreviewMode] = useState(false)
  const [activeTab, setActiveTab] = useState(0)
  
  // API Data
  const [categories, setCategories] = useState<any[]>([])
  const [subcategories, setSubcategories] = useState<any[]>([])
  const [providers, setProviders] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [loadingCategories, setLoadingCategories] = useState(true)
  const [loadingSubcategories, setLoadingSubcategories] = useState(false)
  const [loadingProviders, setLoadingProviders] = useState(false)
  const [loadingProducts, setLoadingProducts] = useState(false)

  // Form state — optional fields pre-filled with valid defaults so user only fills mandatory ones
  const [formData, setFormData] = useState({
  // Basic Info (mandatory: name, category, subcategory, description)
    name: '',
    slug: '',
    description: '',
    short_description: 'Quality service by trained professionals.',
    category: '',
    subcategory: '',
    provider_id: '',
    selected_products: [] as string[],
    service_type: 'fixed' as 'fixed' | 'hourly' | 'consultation',
    duration: '60 mins',
    images: [] as ImageFile[],
    is_popular: false,
    is_active: true,
  // Pricing (pre-filled)
    base_price: '299',
    hourly_rate: '199',
    consultation_fee: '99',
    min_hours: '1',
    max_hours: '8',
    gst_percentage: 18,
    tax_included: false,
  // Availability (pre-filled)
    working_days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'] as string[],
    time_slots: ['morning', 'afternoon'] as string[],
    advance_booking_hours: 24,
    same_day_booking: true,
    emergency_service: false,
    emergency_charge: '',
  // Features & Requirements
    features: [] as string[],
    requirements: [] as string[],
    // Product Options — industry defaults (edit as needed)
    product_options: [
      { name: 'Standard Service', price: '0', brand: '', warranty: '30 days', description: 'Basic repair or installation as per booking.' },
      { name: 'Premium / Extended Warranty', price: '99', brand: '', warranty: '90 days', description: 'Extended warranty on workmanship and parts.' },
    ] as any[],
    // Service Areas — real-world defaults
    service_areas: [
      { name: 'Within city (0–15 km)', multiplier: 1.0, active: true },
      { name: 'Suburbs / outskirts (15–30 km)', multiplier: 1.2, active: true },
      { name: 'Out of city (30+ km)', multiplier: 1.5, active: true },
    ] as any[],
    // Our Process — step-by-step home service flow
    our_process: [
      { step: 1, title: 'Book online', description: 'Select your service, choose a time slot, and confirm your booking. You will receive a confirmation with expert details.' },
      { step: 2, title: 'Expert assigned', description: 'A verified professional is assigned to your job. You can view their profile and get an estimated arrival time.' },
      { step: 3, title: 'Service at your place', description: 'Our expert arrives at the scheduled time, completes the job with quality materials, and explains what was done.' },
      { step: 4, title: 'Payment & feedback', description: 'Pay securely after service. Share your feedback to help us improve and to help other customers.' },
    ] as Array<{ step: number; title: string; description: string }>,
    whats_included: [
      'Labour and service charges as quoted',
      'Basic materials and consumables (unless specified otherwise)',
      'Workmanship warranty as per plan',
      'Post-service support for the warranty period',
    ] as string[],
    whats_excluded: [
      'Parts or components not included in the quote',
      'Additional work not part of the original scope',
      'Structural or design changes',
      'Repairs due to misuse or tampering after service',
    ] as string[],
    please_note: [
      'Advance booking of at least 24 hours is recommended for confirmed slots.',
      'Please keep the work area accessible; our expert will need power/water as applicable.',
      'Valid ID may be required for verification at the time of service.',
    ] as string[],
    our_promises: [
      'Verified, trained professionals for every booking',
      'Transparent pricing—no hidden charges',
      'Satisfaction guarantee on workmanship',
      'Easy reschedule or cancellation as per policy',
    ] as string[],
    faqs: [
      { question: 'What is included in the service?', answer: 'Labour, basic materials as mentioned in the quote, and workmanship warranty are included. Any parts not in the quote are charged separately with your consent.' },
      { question: 'How do I book and pay?', answer: 'Book online by selecting date and time. You can pay online or pay at the time of service. We accept cards, UPI, and cash as per policy.' },
      { question: 'Is there a warranty?', answer: 'Yes. We offer workmanship warranty as per your chosen plan. Defects in our work within the warranty period will be rectified at no extra cost.' },
    ] as Array<{ question: string; answer: string }>,
    base_price_legacy: '',
    price_type: 'fixed',
    duration_minutes: '60',
    is_featured: false,
    sort_order: 0,
    tags: [] as string[],
    icon: '',
  })

  // Dynamic fields
  const [newTag, setNewTag] = useState('')
  const [newFeature, setNewFeature] = useState('')
  const [newRequirement, setNewRequirement] = useState('')
  const [newProduct, setNewProduct] = useState({
    name: '',
    price: '',
    brand: '',
    warranty: '',
    description: ''
  })
  const [newServiceArea, setNewServiceArea] = useState({
    name: '',
    multiplier: 1.0,
    active: true
  })
  
  // NEW: Dynamic fields for customer-focused sections
  const [newProcessStep, setNewProcessStep] = useState({
    step: 1,
    title: '',
    description: ''
  })
  const [newIncluded, setNewIncluded] = useState('')
  const [newExcluded, setNewExcluded] = useState('')
  const [newNote, setNewNote] = useState('')
  const [newPromise, setNewPromise] = useState('')
  const [newFaq, setNewFaq] = useState({
    question: '',
    answer: ''
  })

  // Snackbar
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error',
  })

  // Create subcategory inline (for selected category)
  const [newSubcategoryName, setNewSubcategoryName] = useState('')
  const [creatingSubcategory, setCreatingSubcategory] = useState(false)

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleArrayChange = (field: string, value: string[]) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }))
      setNewTag('')
    }
  }

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }))
  }

  const addFeature = () => {
    if (newFeature.trim() && !formData.features.includes(newFeature.trim())) {
    setFormData(prev => ({
      ...prev,
        features: [...prev.features, newFeature.trim()]
    }))
      setNewFeature('')
    }
  }

  const removeFeature = (featureToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.filter(feature => feature !== featureToRemove)
    }))
  }

  const addRequirement = () => {
    if (newRequirement.trim() && !formData.requirements.includes(newRequirement.trim())) {
      setFormData(prev => ({
        ...prev,
        requirements: [...prev.requirements, newRequirement.trim()]
      }))
      setNewRequirement('')
    }
  }

  const removeRequirement = (requirementToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      requirements: prev.requirements.filter(req => req !== requirementToRemove)
    }))
  }

  const addProduct = () => {
    if (newProduct.name.trim()) {
    setFormData(prev => ({
      ...prev,
        product_options: [...prev.product_options, { ...newProduct }]
      }))
      setNewProduct({
        name: '',
        price: '',
        brand: '',
        warranty: '',
        description: ''
      })
    }
  }

  const removeProduct = (index: number) => {
      setFormData(prev => ({
        ...prev,
      product_options: prev.product_options.filter((_, i) => i !== index)
      }))
  }

  const addServiceArea = () => {
    if (newServiceArea.name.trim()) {
      setFormData(prev => ({
        ...prev,
        service_areas: [...prev.service_areas, { ...newServiceArea }]
      }))
      setNewServiceArea({
        name: '',
        multiplier: 1.0,
        active: true
      })
    }
  }

  const removeServiceArea = (index: number) => {
      setFormData(prev => ({
        ...prev,
      service_areas: prev.service_areas.filter((_, i) => i !== index)
    }))
  }

  // NEW: Handlers for customer-focused sections
  const addProcessStep = () => {
    if (newProcessStep.title.trim() && newProcessStep.description.trim()) {
      setFormData(prev => ({
        ...prev,
        our_process: [...prev.our_process, { 
          ...newProcessStep, 
          step: prev.our_process.length + 1 
        }]
      }))
      setNewProcessStep({
        step: 1,
        title: '',
        description: ''
      })
    }
  }

  const removeProcessStep = (index: number) => {
    setFormData(prev => ({
      ...prev,
      our_process: prev.our_process.filter((_, i) => i !== index).map((step, idx) => ({
        ...step,
        step: idx + 1 // Re-number steps
      }))
    }))
  }

  const moveProcessStep = (index: number, direction: 'up' | 'down') => {
    setFormData(prev => {
      const newProcess = [...prev.our_process]
      const targetIndex = direction === 'up' ? index - 1 : index + 1
      
      if (targetIndex >= 0 && targetIndex < newProcess.length) {
        [newProcess[index], newProcess[targetIndex]] = [newProcess[targetIndex], newProcess[index]]
        // Re-number steps
        return {
          ...prev,
          our_process: newProcess.map((step, idx) => ({ ...step, step: idx + 1 }))
        }
      }
      return prev
    })
  }

  const addIncluded = () => {
    if (newIncluded.trim()) {
      setFormData(prev => ({
        ...prev,
        whats_included: [...prev.whats_included, newIncluded.trim()]
      }))
      setNewIncluded('')
    }
  }

  const removeIncluded = (index: number) => {
    setFormData(prev => ({
      ...prev,
      whats_included: prev.whats_included.filter((_, i) => i !== index)
    }))
  }

  const addExcluded = () => {
    if (newExcluded.trim()) {
      setFormData(prev => ({
        ...prev,
        whats_excluded: [...prev.whats_excluded, newExcluded.trim()]
      }))
      setNewExcluded('')
    }
  }

  const removeExcluded = (index: number) => {
    setFormData(prev => ({
      ...prev,
      whats_excluded: prev.whats_excluded.filter((_, i) => i !== index)
    }))
  }

  const addNote = () => {
    if (newNote.trim()) {
      setFormData(prev => ({
        ...prev,
        please_note: [...prev.please_note, newNote.trim()]
      }))
      setNewNote('')
    }
  }

  const removeNote = (index: number) => {
    setFormData(prev => ({
      ...prev,
      please_note: prev.please_note.filter((_, i) => i !== index)
    }))
  }

  const addPromise = () => {
    if (newPromise.trim()) {
      setFormData(prev => ({
        ...prev,
        our_promises: [...prev.our_promises, newPromise.trim()]
      }))
      setNewPromise('')
    }
  }

  const removePromise = (index: number) => {
    setFormData(prev => ({
      ...prev,
      our_promises: prev.our_promises.filter((_, i) => i !== index)
    }))
  }

  const addFaq = () => {
    if (newFaq.question.trim() && newFaq.answer.trim()) {
      setFormData(prev => ({
        ...prev,
        faqs: [...prev.faqs, { ...newFaq }]
      }))
      setNewFaq({
        question: '',
        answer: ''
      })
    }
  }

  const removeFaq = (index: number) => {
    setFormData(prev => ({
      ...prev,
      faqs: prev.faqs.filter((_, i) => i !== index)
    }))
  }

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '') // Remove leading and trailing dashes
  }

  const handleNameChange = (name: string) => {
      setFormData(prev => ({
        ...prev,
      name,
      slug: generateSlug(name)
    }))
  }

  const handleSubmit = async (action: 'draft' | 'publish' = 'publish') => {
    try {
      setLoading(true)

      if (!formData.name?.trim()) {
        showSnackbar('Service name is required', 'error')
        setActiveTab(0)
        return
      }
      if (!formData.category) {
        showSnackbar('Please select a category', 'error')
        setActiveTab(0)
        return
      }
      if (!formData.subcategory) {
        showSnackbar('Please select a subcategory', 'error')
        setActiveTab(0)
        return
      }
      if (!formData.description?.trim()) {
        showSnackbar('Description is required', 'error')
        setActiveTab(0)
        return
      }

      // Get primary image or first image
      const primaryImage = formData.images.find(img => img.isPrimary) || formData.images[0]

      // Map new form data to API format; use undefined for empty strings so they are omitted in JSON (avoids 400 on strict backends)
      const raw: Record<string, any> = {
        name: formData.name.trim(),
        display_name: formData.name.trim(),
        slug: formData.slug || undefined,
        description: formData.description?.trim() || undefined,
        short_description: formData.short_description?.trim() || undefined,
        category: formData.category?.trim() || undefined,
        subcategory: formData.subcategory?.trim() || undefined,
        provider_id: formData.provider_id?.trim() || undefined,
        selected_products: formData.selected_products?.length ? formData.selected_products : undefined,
        service_type: formData.service_type as 'fixed' | 'hourly' | 'consultation',
        duration: formData.duration?.trim() || undefined,
        base_price: formData.base_price ? parseFloat(String(formData.base_price)) : undefined,
        hourly_rate: formData.hourly_rate ? parseFloat(String(formData.hourly_rate)) : undefined,
        consultation_fee: formData.consultation_fee ? parseFloat(String(formData.consultation_fee)) : undefined,
        min_hours: formData.min_hours ? parseInt(String(formData.min_hours), 10) : undefined,
        max_hours: formData.max_hours ? parseInt(String(formData.max_hours), 10) : undefined,
        gst_percentage: formData.gst_percentage,
        tax_included: formData.tax_included,
        is_active: action === 'publish',
        is_featured: formData.is_featured,
        is_popular: formData.is_popular,
        sort_order: formData.sort_order,
        tags: formData.tags?.length ? formData.tags : undefined,
        features: formData.features?.length ? formData.features : undefined,
        requirements: formData.requirements?.length ? formData.requirements : undefined,
        working_days: formData.working_days?.length ? formData.working_days : undefined,
        time_slots: formData.time_slots?.length ? formData.time_slots : undefined,
        advance_booking_hours: formData.advance_booking_hours,
        same_day_booking: formData.same_day_booking,
        emergency_service: formData.emergency_service,
        emergency_charge: formData.emergency_charge ? parseFloat(String(formData.emergency_charge)) : undefined,
        product_options: formData.product_options?.length ? formData.product_options : undefined,
        service_areas: formData.service_areas?.length ? formData.service_areas : undefined,
        icon: formData.icon?.trim() || undefined,
        image: primaryImage?.url || undefined,
        images: formData.images?.length ? formData.images.map((img: any) => img.url).filter(Boolean) : undefined,
        our_process: formData.our_process?.length ? formData.our_process : undefined,
        whats_included: formData.whats_included?.length ? formData.whats_included : undefined,
        whats_excluded: formData.whats_excluded?.length ? formData.whats_excluded : undefined,
        please_note: formData.please_note?.length ? formData.please_note : undefined,
        our_promises: formData.our_promises?.length ? formData.our_promises : undefined,
        faqs: formData.faqs?.length ? formData.faqs : undefined,
      }
      // Only include status for publish; draft endpoint implies status=draft (some backends 400 if status is in body)
      if (action === 'publish') {
        raw.status = 'published'
      }

      // Drop undefined, empty string, and NaN so backend doesn't get invalid values
      const submitData = Object.fromEntries(
        Object.entries(raw).filter(([, v]) => {
          if (v === undefined || v === '') return false
          if (typeof v === 'number' && Number.isNaN(v)) return false
          return true
        })
      ) as any

      if (isEditMode && id) {
        await platformServicesService.updateService(id, submitData)
        showSnackbar('Service updated successfully!', 'success')
      } else {
        if (action === 'draft') {
          await platformServicesService.saveAsDraft(submitData)
          showSnackbar('Service saved as draft successfully!', 'success')
        } else {
          await platformServicesService.createService(submitData)
          showSnackbar('Service published successfully!', 'success')
        }
      }

      setTimeout(() => navigate('/platform-services'), 1500)
    } catch (error: any) {
      const message =
        error?.response?.data?.message ??
        error?.message ??
        (error?.errors ? error.errors.map((e: any) => e.message || e.msg).join(', ') : null) ??
        `Failed to ${isEditMode ? 'update' : action} service`
      showSnackbar(String(message), 'error')
    } finally {
      setLoading(false)
    }
  }

  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbar({ open: true, message, severity })
  }

  // Load service data if in edit mode
  useEffect(() => {
    const loadService = async () => {
      if (!id) return
      
      try {
        setLoadingService(true)
        const service = await platformServicesService.getServiceById(id)
        
        // Normalize category/subcategory to lowercase string id (API returns e.g. "690b45c8b1b9905e4aefb06f")
        const rawCat = (service as any).category
        const rawSub = (service as any).subcategory
        const categoryId = rawCat != null
          ? String((typeof rawCat === 'object' ? (rawCat?.id ?? rawCat?._id) : rawCat) ?? '').toLowerCase()
          : ''
        const subcategoryId = rawSub != null
          ? String((typeof rawSub === 'object' ? (rawSub?.id ?? rawSub?._id) : rawSub) ?? '').toLowerCase()
          : ''
        // Normalize images: support image (string), images (array of strings or objects with url)
        const rawImages = (service as any).images ?? ((service as any).image ? [(service as any).image] : [])
        const images: ImageFile[] = (Array.isArray(rawImages) ? rawImages : []).map((img: any, i: number) => {
          const url = typeof img === 'string' ? img : (img?.url ?? img?.secure_url ?? '')
          if (!url) return null
          return {
            id: (img?.id ?? img?.public_id ?? `loaded-${i}-${Date.now()}`).toString(),
            url,
            alt: (typeof img === 'object' && img.alt) ? img.alt : (service.name || 'Service image'),
            isPrimary: i === 0,
            order: i,
            file: undefined,
            publicId: typeof img === 'object' ? img.public_id ?? img.publicId : undefined,
            fromLibrary: true,
          }
        }).filter(Boolean) as ImageFile[]
        // If no array images, fallback to single service.image
        const finalImages = images.length > 0 ? images : (service.image ? [{
          id: `loaded-0-${Date.now()}`,
          url: service.image,
          file: undefined,
          isPrimary: true,
          alt: service.name || 'Service image',
          order: 0,
          fromLibrary: true,
        }] as ImageFile[] : [])

        // Convert service data to form format
        setFormData({
          name: service.name || '',
          slug: service.slug || '',
          description: service.description || '',
          short_description: service.short_description || '',
          category: String(categoryId || ''),
          subcategory: String(subcategoryId || ''),
          provider_id: '', // Not available in API response
          selected_products: [], // Not available in API response
          service_type: service.service_type || 'fixed',
          duration: service.duration || '',
          images: finalImages,
          is_popular: service.is_popular || false,
          is_active: service.is_active || false,
          
          // Pricing
          base_price: service.base_price?.toString() || '',
          hourly_rate: service.hourly_rate?.toString() || '',
          consultation_fee: service.consultation_fee?.toString() || '',
          min_hours: service.min_hours?.toString() || '',
          max_hours: service.max_hours?.toString() || '',
          gst_percentage: service.gst_percentage || 18,
          tax_included: service.tax_included || false,
          
          // Availability
          working_days: service.working_days || [],
          time_slots: service.time_slots || [],
          advance_booking_hours: service.advance_booking_hours || 24,
          same_day_booking: service.same_day_booking || false,
          emergency_service: service.emergency_service || false,
          emergency_charge: service.emergency_charge?.toString() || '',
          
          // Features & Requirements
          features: service.features || [],
          requirements: service.requirements || [],
          
          // Product Options
          product_options: service.product_options || [],
          
          // Service Areas (backend returns { city, areas?, pincodes? }; form uses { name, multiplier, active })
          service_areas: (service.service_areas || []).map((a: any) => ({
            name: a.city ?? a.name ?? 'General',
            multiplier: a.multiplier ?? 1,
            active: a.active !== false,
          })),
          
          // NEW: Customer-focused sections
          our_process: (service as any).our_process || [],
          whats_included: (service as any).whats_included || [],
          whats_excluded: (service as any).whats_excluded || [],
          please_note: (service as any).please_note || [],
          our_promises: (service as any).our_promises || [],
          faqs: (service as any).faqs || [],
          
          // Legacy fields
          base_price_legacy: service.base_price?.toString() || '',
          price_type: 'fixed',
          duration_minutes: '',
          is_featured: service.is_featured || false,
          sort_order: service.sort_order || 0,
          tags: service.tags || [],
          icon: service.icon || '',
        })
        
        showSnackbar('Service loaded successfully', 'success')
      } catch (error: any) {
        showSnackbar(error.message || 'Failed to load service', 'error')
        // Navigate back if service not found
        setTimeout(() => navigate('/platform-services'), 2000)
      } finally {
        setLoadingService(false)
      }
    }
    
    loadService()
  }, [id])

  // Normalize category id (backend may return id or _id); use lowercase so it matches API (e.g. 690b45c8b1b9905e4aefb06f)
  const getCategoryId = (c: any) => ((c?.id ?? c?._id ?? '') + '').toLowerCase()

  // Fetch categories for dropdown: support multiple API shapes, normalize id/name, show root-only, fallback without type filter
  useEffect(() => {
    const normalizeList = (raw: any): any[] => {
      const list = Array.isArray(raw)
        ? raw
        : raw?.categories ?? raw?.data?.categories ?? []
      return (list || [])
        .map((c: any) => ({
          ...c,
          id: getCategoryId(c),
          name: (c.name ?? c.title ?? '').toString().trim(),
        }))
        .filter((c: any) => c.id && c.name)
    }
    const fetchCategories = async () => {
      try {
        setLoadingCategories(true)
        let list: any[] = []
        const response = await CategoriesService.getCategories({
          page: 1,
          limit: 200,
          is_active: true,
          category_type: 'service',
        })
        if (response?.success && response.data != null) {
          list = normalizeList(response.data)
        }
        // Only root categories in Category dropdown (no parent)
        const roots = list.filter(
          (c: any) => !(c.parentId ?? c.parent_id)
        )
        if (roots.length > 0) {
          setCategories(roots)
          return
        }
        // Fallback: no service-type categories — fetch all and use roots
        const fallback = await CategoriesService.getCategories({
          page: 1,
          limit: 200,
          is_active: true,
        })
        if (fallback?.success && fallback.data != null) {
          const all = normalizeList(fallback.data)
          const fallbackRoots = all.filter((c: any) => !(c.parentId ?? c.parent_id))
          setCategories(fallbackRoots.length > 0 ? fallbackRoots : all)
        } else {
          setCategories(roots)
        }
      } catch (error) {
        console.error('Error fetching categories:', error)
        showSnackbar('Failed to load categories', 'error')
        setCategories([])
      } finally {
        setLoadingCategories(false)
      }
    }

    fetchCategories()
  }, [])

  // Fetch providers
  useEffect(() => {
    const fetchProviders = async () => {
      try {
        setLoadingProviders(true)
        const response = await ProvidersService.getProviders({
          page: 1,
          limit: 100
        })
        console.log("response",response)
        if (response.success) {
          setProviders(response?.data?.providers || [])
        }
      } catch (error) {
        console.error('Error fetching providers:', error)
        showSnackbar('Failed to load providers', 'error')
      } finally {
        setLoadingProviders(false)
      }
    }

    fetchProviders()
  }, [])

  // Fetch products
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoadingProducts(true)
        const response = await ProductsService.getProducts({
          page: 1,
          limit: 100,
          is_active: true
        })
        
        if (response.success) {
          setProducts(response.data.products || [])
        }
      } catch (error) {
        console.error('Error fetching products:', error)
        showSnackbar('Failed to load products', 'error')
      } finally {
        setLoadingProducts(false)
      }
    }

    fetchProducts()
  }, [])

  const fetchSubcategoriesForCategory = async (categoryId: string) => {
    if (!categoryId) {
      setSubcategories([])
      return
    }
    try {
      setLoadingSubcategories(true)
      const response = await SubcategoriesService.getSubcategories({
        categoryId,
        is_active: true,
      })
      const raw = response?.data
      const list = raw?.subcategories ?? (Array.isArray(raw) ? raw : [])
      const normalized = list.map((sub: any) => ({
        ...sub,
        id: sub.id ?? sub._id ?? '',
        name: sub.name ?? sub.displayName ?? sub.title ?? '',
      })).filter((sub: any) => sub.id && sub.name)
      setSubcategories(normalized)
    } catch (error) {
      console.error('Error fetching subcategories:', error)
      showSnackbar('Failed to load subcategories', 'error')
    } finally {
      setLoadingSubcategories(false)
    }
  }

  useEffect(() => {
    fetchSubcategoriesForCategory(formData.category)
  }, [formData.category])

  const handleCreateSubcategory = async () => {
    const name = newSubcategoryName.trim()
    if (!name) {
      showSnackbar('Enter a subcategory name', 'error')
      return
    }
    if (!formData.category) {
      showSnackbar('Select a category first', 'error')
      return
    }
    const parentCategory = categories.find((c) => getCategoryId(c) === formData.category)
    try {
      setCreatingSubcategory(true)
      const response = await SubcategoriesService.createSubcategory(
        {
          name,
          category_id: formData.category,
          service_intent: 'repair',
          is_active: true,
        },
        { showSuccessToast: false, showLoading: false }
      )
      const raw = response?.data
      const created = (raw && typeof raw === 'object' && ('name' in raw || 'id' in raw))
        ? raw
        : (raw as any)?.subcategory ?? (raw as any)?.data
      const newId = created ? (created.id ?? (created as any)._id) : null
      if (newId) {
        setSubcategories((prev) => [...prev, { ...created, id: newId, name: created.name ?? name }])
        handleInputChange('subcategory', newId)
        setNewSubcategoryName('')
        showSnackbar(`Subcategory "${name}" created under ${parentCategory?.name ?? 'category'}`, 'success')
      } else {
        await fetchSubcategoriesForCategory(formData.category)
        showSnackbar('Subcategory created', 'success')
      }
    } catch (error: any) {
      console.error('Error creating subcategory:', error)
      showSnackbar(error?.message ?? 'Failed to create subcategory', 'error')
    } finally {
      setCreatingSubcategory(false)
    }
  }

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      {/* Loading indicator for edit mode */}
      {loadingService && (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
          <Box sx={{ textAlign: 'center' }}>
            <CircularProgress size={48} />
            <Typography variant="body1" sx={{ mt: 2 }}>Loading service data...</Typography>
          </Box>
        </Box>
      )}
      
      {!loadingService && (
        <>
          {/* Header */}
          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <IconButton 
                onClick={() => navigate('/platform-services')}
                sx={{ 
                  bgcolor: 'grey.100',
                  '&:hover': { bgcolor: 'grey.200' }
                }}
              >
                <ArrowBackIcon />
              </IconButton>
              <Box>
                <Typography variant="h5" component="h1" sx={{ fontWeight: 600, mb: 0.5 }}>
                  {isEditMode ? 'Edit Service' : 'Create New Service'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {isEditMode ? 'Update service details and settings' : 'Add a new service to your platform'}
                </Typography>
              </Box>
            </Box>

            {/* Action Buttons */}
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
              <Button
                variant="outlined"
                startIcon={<PreviewIcon />}
                onClick={() => setPreviewMode(!previewMode)}
                sx={{ textTransform: 'none' }}
              >
                {previewMode ? 'Edit Mode' : 'Preview Mode'}
              </Button>
              <Button
                variant="contained"
                startIcon={loading ? <CircularProgress size={16} /> : <SaveIcon />}
                onClick={() => handleSubmit('publish')}
                disabled={loading || !formData.name?.trim() || !formData.category || !formData.subcategory || !formData.description?.trim()}
                sx={{ textTransform: 'none' }}
              >
                {loading ? (isEditMode ? 'Updating...' : 'Creating...') : (isEditMode ? 'Update Service' : 'Create Service')}
              </Button>
            </Box>
          </Box>

      {/* Main Form with Tabs */}
      <Card sx={{ borderRadius: 2, overflow: 'hidden' }}>
        {/* Tab Navigation */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs 
            value={activeTab} 
            onChange={(e, newValue) => setActiveTab(newValue)}
            variant="scrollable"
            scrollButtons="auto"
          >
            <Tab 
            icon={<InfoIcon />}
            label="Basic Info"
            iconPosition="start"
              sx={{ minHeight: 64 }}
            />
            <Tab 
              icon={<MoneyIcon />} 
            label="Pricing"
              iconPosition="start"
              sx={{ minHeight: 64 }}
          />
            <Tab 
            icon={<CalendarIcon />}
            label="Availability"
              iconPosition="start"
              sx={{ minHeight: 64 }}
          />
            <Tab 
            icon={<StarIcon />}
            label="Features & Requirements"
            iconPosition="start"
              sx={{ minHeight: 64 }}
            />
            <Tab 
              icon={<BuildIcon />} 
            label="Product Options"
              iconPosition="start"
              sx={{ minHeight: 64 }}
          />
            <Tab 
            icon={<LocationIcon />}
            label="Service Areas"
              iconPosition="start"
              sx={{ minHeight: 64 }}
          />
            <Tab 
              icon={<TimelineIcon />} 
              label="Our Process"
              iconPosition="start"
              sx={{ minHeight: 64 }}
            />
            <Tab 
              icon={<CheckIcon />} 
              label="Include & Exclude"
              iconPosition="start"
              sx={{ minHeight: 64 }}
            />
            <Tab 
              icon={<LightbulbIcon />} 
              label="Notes & Promises"
              iconPosition="start"
              sx={{ minHeight: 64 }}
            />
            <Tab 
              icon={<HelpIcon />} 
              label="FAQs"
              iconPosition="start"
              sx={{ minHeight: 64 }}
            />
          </Tabs>
        </Box>

        {/* Tab Content */}
        <Box sx={{ p: 3 }}>
          {/* Basic Information Tab — Mandatory fields first, then optional (pre-filled) */}
          {activeTab === 0 && (
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Fill the 4 required fields below to create your service. All other fields have sensible defaults and can be changed later.
              </Typography>

              {/* ——— Required (mandatory) ——— */}
              <Paper variant="outlined" sx={{ p: 3, mb: 3, bgcolor: 'primary.50', borderColor: 'primary.200' }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Chip label="Required" size="small" color="primary" />
                  Basic info
                </Typography>
                <Stack spacing={2.5}>
                  <TextField
                    fullWidth
                    label="Service Name"
                    value={formData.name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="e.g., Switch & Socket Repair"
                    required
                    disabled={previewMode}
                    helperText="Clear name customers will see"
                  />
                  <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', md: 'row' } }}>
                    <FormControl fullWidth required sx={{ flex: 1 }}>
                      <InputLabel>Category</InputLabel>
                      <Select
                        value={formData.category}
                        label="Category"
                        onChange={(e) => {
                          handleInputChange('category', e.target.value)
                          handleInputChange('subcategory', '')
                        }}
                        disabled={previewMode || loadingCategories}
                        renderValue={(v) => {
                          if (!v) return ''
                          const cat = categories.find((c) => getCategoryId(c) === v)
                          return cat?.name ?? v
                        }}
                      >
                        {loadingCategories ? (
                          <MenuItem disabled><CircularProgress size={16} /> Loading...</MenuItem>
                        ) : categories.length === 0 ? (
                          <MenuItem disabled>No categories available</MenuItem>
                        ) : (
                          categories.map((cat) => (
                            <MenuItem key={getCategoryId(cat)} value={getCategoryId(cat)}>{cat.name}</MenuItem>
                          ))
                        )}
                      </Select>
                    </FormControl>
                    <FormControl fullWidth required sx={{ flex: 1 }}>
                      <InputLabel>Subcategory</InputLabel>
                      <Select
                        value={formData.subcategory}
                        label="Subcategory"
                        onChange={(e) => handleInputChange('subcategory', e.target.value)}
                        disabled={previewMode || !formData.category || loadingSubcategories}
                        renderValue={(v) => {
                          if (!v) return ''
                          const sub = subcategories.find((s) => getCategoryId(s) === v)
                          return sub?.name ?? v
                        }}
                      >
                        {loadingSubcategories ? (
                          <MenuItem disabled><CircularProgress size={16} /> Loading...</MenuItem>
                        ) : subcategories.length === 0 ? (
                          <MenuItem disabled>{formData.category ? 'No subcategories' : 'Select category first'}</MenuItem>
                        ) : (
                          subcategories.map((sub) => (
                            <MenuItem key={getCategoryId(sub)} value={getCategoryId(sub)}>{sub.name}</MenuItem>
                          ))
                        )}
                      </Select>
                    </FormControl>
                  </Box>
                  {formData.category && (
                    <Box sx={{ p: 1.5, borderRadius: 1, bgcolor: 'background.paper' }}>
                      <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                        Need a new subcategory?
                      </Typography>
                      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems="flex-end">
                        <TextField
                          size="small"
                          placeholder="e.g. Socket, Switch"
                          value={newSubcategoryName}
                          onChange={(e) => setNewSubcategoryName(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleCreateSubcategory())}
                          disabled={creatingSubcategory || previewMode}
                          sx={{ flex: 1, minWidth: 140 }}
                          label="New subcategory name"
                        />
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={creatingSubcategory ? <CircularProgress size={14} /> : <AddIcon />}
                          onClick={handleCreateSubcategory}
                          disabled={creatingSubcategory || !newSubcategoryName.trim() || previewMode}
                        >
                          {creatingSubcategory ? 'Creating…' : 'Add'}
                        </Button>
                      </Stack>
                    </Box>
                  )}
                  <RichTextField
                    label="Description"
                    value={formData.description}
                    onChange={(value) => handleInputChange('description', value)}
                    placeholder="Describe what the service includes and what customers can expect. You can use formatting and lists."
                    required
                    disabled={previewMode}
                    height={200}
                    helperText="Required. Detailed description helps customers and SEO."
                  />
                </Stack>
              </Paper>

              {/* ——— Service Images (important, always visible) ——— */}
              <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <UploadIcon color="primary" />
                  Service Images
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Add at least one image so customers can see the service. First image is used as the main image.
                </Typography>
                <ImageUploadField
                  label="Upload Service Images"
                  value={formData.images}
                  onChange={(images) => handleInputChange('images', images)}
                  maxFiles={5}
                  maxSize={5}
                  disabled={previewMode}
                  allowPrimary
                  showPreview
                  helperText="Up to 5 images. Recommended size: 800×600px. Max 5MB each. First image = primary."
                  error={formData.images.length === 0 ? 'Add at least one image for a better listing' : undefined}
                />
              </Paper>

              {/* ——— Featured & Popular (Basic Info) ——— */}
              <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2, display: 'block' }}>
                  Visibility
                </Typography>
                <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.is_featured}
                        onChange={(e) => handleInputChange('is_featured', e.target.checked)}
                        disabled={previewMode}
                        color="primary"
                      />
                    }
                    label="Featured"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.is_popular}
                        onChange={(e) => handleInputChange('is_popular', e.target.checked)}
                        disabled={previewMode}
                        color="primary"
                      />
                    }
                    label="Popular"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.is_active}
                        onChange={(e) => handleInputChange('is_active', e.target.checked)}
                        disabled={previewMode}
                        color="primary"
                      />
                    }
                    label="Active"
                  />
                </Box>
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                  Featured services appear in highlighted sections; popular in &quot;Popular&quot; listings. Inactive services are hidden from customers.
                </Typography>
              </Paper>

              {/* ——— Optional (pre-filled with defaults) ——— */}
              <Accordion defaultExpanded={false} sx={{ '&:before': { display: 'none' }, boxShadow: 0 }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Optional details (pre-filled with defaults — edit if needed)
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Stack spacing={2.5}>
                    <TextField
                      fullWidth
                      size="small"
                      label="URL Slug (optional)"
                      value={formData.slug}
                      onChange={(e) => handleInputChange('slug', e.target.value)}
                      placeholder="Auto-generated from name"
                      disabled={previewMode}
                      helperText="Leave blank to auto-generate from service name"
                      InputProps={{ sx: { fontFamily: 'monospace' } }}
                    />
                    <FormControl fullWidth size="small">
                      <InputLabel>Service Provider (optional)</InputLabel>
                      <Select
                        value={formData.provider_id}
                        label="Service Provider (optional)"
                        onChange={(e) => handleInputChange('provider_id', e.target.value)}
                        disabled={previewMode || loadingProviders}
                      >
                        <MenuItem value=""><em>Platform managed</em></MenuItem>
                        {providers?.map((p) => (
                          <MenuItem key={p.id} value={p.id}>{p.business_name}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', md: 'row' } }}>
                      <FormControl fullWidth size="small" sx={{ flex: 1 }}>
                        <InputLabel>Service type</InputLabel>
                        <Select
                          value={formData.service_type}
                          label="Service type"
                          onChange={(e) => handleInputChange('service_type', e.target.value)}
                          disabled={previewMode}
                        >
                          {PRICE_TYPES.map((t) => (
                            <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                      <TextField
                        fullWidth
                        size="small"
                        label="Duration"
                        value={formData.duration}
                        onChange={(e) => handleInputChange('duration', e.target.value)}
                        placeholder="e.g. 60 mins"
                        disabled={previewMode}
                        sx={{ flex: 1 }}
                      />
                    </Box>
                    <Typography variant="caption" color="text.secondary">
                      Featured, Popular and Active toggles are in Basic Info above.
                    </Typography>
                  </Stack>
                </AccordionDetails>
              </Accordion>
            </Box>
          )}

          {/* Pricing Tab */}
          {activeTab === 1 && (
            <Box>
              <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
            Pricing Configuration
          </Typography>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {/* Base Price (Fixed) */}
                {formData.service_type === 'fixed' && (
                <TextField
                  fullWidth
                    label="Base Price (₹) *"
                    type="number"
                    value={formData.base_price}
                    onChange={(e) => handleInputChange('base_price', e.target.value)}
                  placeholder="299"
                    disabled={previewMode}
                    InputProps={{
                      startAdornment: <Typography sx={{ mr: 1 }}>₹</Typography>
                    }}
                  />
                )}

                {/* Hourly Rate */}
                {formData.service_type === 'hourly' && (
                  <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', md: 'row' } }}>
                  <TextField
                    fullWidth
                      label="Hourly Rate (₹) *"
                      type="number"
                      value={formData.hourly_rate}
                      onChange={(e) => handleInputChange('hourly_rate', e.target.value)}
                    placeholder="199"
                      disabled={previewMode}
                      InputProps={{
                        startAdornment: <Typography sx={{ mr: 1 }}>₹</Typography>
                      }}
                  />
                  <TextField
                      fullWidth
                    label="Minimum Hours"
                    type="number"
                      value={formData.min_hours}
                      onChange={(e) => handleInputChange('min_hours', e.target.value)}
                    placeholder="2"
                      disabled={previewMode}
                  />
                  <TextField
                      fullWidth
                    label="Maximum Hours"
                    type="number"
                      value={formData.max_hours}
                      onChange={(e) => handleInputChange('max_hours', e.target.value)}
                    placeholder="8"
                      disabled={previewMode}
                  />
                  </Box>
            )}

                {/* Consultation Fee */}
                {formData.service_type === 'consultation' && (
                <TextField
                  fullWidth
                    label="Consultation Fee (₹) *"
                    type="number"
                    value={formData.consultation_fee}
                    onChange={(e) => handleInputChange('consultation_fee', e.target.value)}
                  placeholder="999"
                    disabled={previewMode}
                    InputProps={{
                      startAdornment: <Typography sx={{ mr: 1 }}>₹</Typography>
                    }}
                />
            )}

                {/* GST */}
                <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', md: 'row' } }}>
              <TextField
                    fullWidth
                label="GST (%)"
                type="number"
                    value={formData.gst_percentage}
                    onChange={(e) => handleInputChange('gst_percentage', parseFloat(e.target.value) || 0)}
                    disabled={previewMode}
                    sx={{ flex: 1 }}
                  />
              <FormControlLabel
                control={
                      <Switch
                        checked={formData.tax_included}
                        onChange={(e) => handleInputChange('tax_included', e.target.checked)}
                        disabled={previewMode}
                  />
                }
                label="Tax included in price"
                    sx={{ flex: 1, mt: 2 }}
                  />
                </Box>
              </Box>
            </Box>
          )}

          {/* Availability Tab */}
          {activeTab === 2 && (
            <Box>
              <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
            Service Availability
          </Typography>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {/* Working Days */}
                <Box>
                  <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
                Working Days
              </Typography>
                  <FormGroup row>
                    {WORKING_DAYS.map((day) => (
                      <MuiFormControlLabel
                        key={day}
                      control={
                        <Checkbox
                            checked={formData.working_days.includes(day)}
                          onChange={(e) => {
                            if (e.target.checked) {
                                handleArrayChange('working_days', [...formData.working_days, day])
                            } else {
                                handleArrayChange('working_days', formData.working_days.filter(d => d !== day))
                            }
                          }}
                            disabled={previewMode}
                        />
                      }
                      label={day}
                    />
                    ))}
                  </FormGroup>
                </Box>

                {/* Time Slots */}
                <Box>
                  <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
                Available Time Slots
              </Typography>
                  <FormGroup>
                    {TIME_SLOTS.map((slot) => (
                      <MuiFormControlLabel
                        key={slot.value}
                      control={
                        <Checkbox
                            checked={formData.time_slots.includes(slot.value)}
                          onChange={(e) => {
                            if (e.target.checked) {
                                handleArrayChange('time_slots', [...formData.time_slots, slot.value])
                            } else {
                                handleArrayChange('time_slots', formData.time_slots.filter(s => s !== slot.value))
                              }
                            }}
                            disabled={previewMode}
                          />
                        }
                        label={slot.label}
                      />
                    ))}
                  </FormGroup>
                </Box>

                {/* Booking Settings */}
                <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', md: 'row' } }}>
              <TextField
                    fullWidth
                label="Advance Booking (hours)"
                type="number"
                    value={formData.advance_booking_hours}
                    onChange={(e) => handleInputChange('advance_booking_hours', parseInt(e.target.value) || 0)}
                    disabled={previewMode}
                    sx={{ flex: 1 }}
                  />
                  <TextField
                fullWidth
                    label="Emergency Charge (₹)"
                    type="number"
                    value={formData.emergency_charge}
                    onChange={(e) => handleInputChange('emergency_charge', e.target.value)}
                    placeholder="200"
                    disabled={previewMode}
                    sx={{ flex: 1 }}
                  />
                </Box>

                <Box sx={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              <FormControlLabel
                control={
                      <Switch
                        checked={formData.same_day_booking}
                        onChange={(e) => handleInputChange('same_day_booking', e.target.checked)}
                        disabled={previewMode}
                  />
                }
                label="Allow Same-day Booking"
              />
              <FormControlLabel
                control={
                      <Switch
                        checked={formData.emergency_service}
                        onChange={(e) => handleInputChange('emergency_service', e.target.checked)}
                        disabled={previewMode}
                  />
                }
                label="Emergency Service Available"
              />
                </Box>
              </Box>
            </Box>
          )}

          {/* Features & Requirements Tab */}
          {activeTab === 3 && (
            <Box>
              <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
            Features & Requirements
          </Typography>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {/* Features */}
                <Box>
                  <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
                Service Features
              </Typography>
                  <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
              {formData.features.map((feature, index) => (
                      <Chip
                        key={index}
                        label={feature}
                        onDelete={previewMode ? undefined : () => removeFeature(feature)}
                        color="primary"
                        variant="outlined"
                      />
                    ))}
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                  <TextField
                      size="small"
                    placeholder="e.g., Switch replacement"
                      value={newFeature}
                      onChange={(e) => setNewFeature(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && addFeature()}
                      disabled={previewMode}
                      sx={{ flexGrow: 1 }}
                    />
                    <Button
                      variant="outlined"
                      onClick={addFeature}
                      disabled={previewMode || !newFeature.trim()}
                      size="small"
                    >
                      Add
              </Button>
                  </Box>
                </Box>

                {/* Requirements */}
                <Box>
                  <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
                Customer Requirements
              </Typography>
                  <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
              {formData.requirements.map((requirement, index) => (
                      <Chip
                        key={index}
                        label={requirement}
                        onDelete={previewMode ? undefined : () => removeRequirement(requirement)}
                        color="secondary"
                        variant="outlined"
                      />
                    ))}
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                  <TextField
                      size="small"
                    placeholder="e.g., Clear workspace"
                      value={newRequirement}
                      onChange={(e) => setNewRequirement(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && addRequirement()}
                      disabled={previewMode}
                      sx={{ flexGrow: 1 }}
                    />
                    <Button
                      variant="outlined"
                      onClick={addRequirement}
                      disabled={previewMode || !newRequirement.trim()}
                      size="small"
                    >
                      Add
              </Button>
                  </Box>
                </Box>
              </Box>
            </Box>
          )}

          {/* Product Options Tab */}
          {activeTab === 4 && (
            <>
             <Box>
              <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
            Product Options
          </Typography>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {/* Existing Products */}
                {formData.product_options.map((product, index) => (
                  <Card key={index} sx={{ p: 2, border: '1px solid', borderColor: 'divider' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Typography variant="subtitle1" fontWeight="600">
                        {product.name}
                      </Typography>
                      <IconButton
                        size="small" 
                        onClick={() => removeProduct(index)}
                        disabled={previewMode}
                        color="error"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', md: 'row' } }}>
                        <TextField
                        size="small"
                          label="Product Name"
                          value={product.name}
                        disabled={previewMode}
                        sx={{ flex: 1 }}
                      />
                        <TextField
                        size="small"
                          label="Price (₹)"
                          type="number"
                          value={product.price}
                        disabled={previewMode}
                        sx={{ flex: 1 }}
                      />
                        <TextField
                        size="small"
                          label="Brand"
                          value={product.brand}
                        disabled={previewMode}
                        sx={{ flex: 1 }}
                      />
                        <TextField
                        size="small"
                          label="Warranty"
                          value={product.warranty}
                        disabled={previewMode}
                        sx={{ flex: 1 }}
                      />
                    </Box>
                        <TextField
                      size="small"
                          label="Description"
                          multiline
                          rows={2}
                          value={product.description}
                      disabled={previewMode}
                      sx={{ mt: 2 }}
                    />
                  </Card>
                ))}

                {/* Add New Product */}
                <Card sx={{ p: 2, border: '2px dashed', borderColor: 'divider' }}>
                  <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
                    Add New Product Option
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', md: 'row' }, mb: 2 }}>
                    <TextField
                      size="small"
                      label="Product Name"
                      value={newProduct.name}
                      onChange={(e) => setNewProduct(prev => ({ ...prev, name: e.target.value }))}
                      disabled={previewMode}
                      sx={{ flex: 1 }}
                    />
                    <TextField
                      size="small"
                      label="Price (₹)"
                      type="number"
                      value={newProduct.price}
                      onChange={(e) => setNewProduct(prev => ({ ...prev, price: e.target.value }))}
                      disabled={previewMode}
                      sx={{ flex: 1 }}
                    />
                    <TextField
                      size="small"
                      label="Brand"
                      value={newProduct.brand}
                      onChange={(e) => setNewProduct(prev => ({ ...prev, brand: e.target.value }))}
                      disabled={previewMode}
                      sx={{ flex: 1 }}
                    />
                    <TextField
                      size="small"
                      label="Warranty"
                      value={newProduct.warranty}
                      onChange={(e) => setNewProduct(prev => ({ ...prev, warranty: e.target.value }))}
                      disabled={previewMode}
                      sx={{ flex: 1 }}
                    />
                  </Box>
                  <TextField
                    size="small"
                    label="Description"
                    multiline
                    rows={2}
                    value={newProduct.description}
                    onChange={(e) => setNewProduct(prev => ({ ...prev, description: e.target.value }))}
                    disabled={previewMode}
                    sx={{ mb: 2 }}
                  />
              <Button
                variant="outlined"
                    onClick={addProduct}
                    disabled={previewMode || !newProduct.name.trim()}
                startIcon={<AddIcon />}
              >
                    Add Product
              </Button>
                </Card>
              </Box>
            </Box>

              {/* Product Selection */}
              <Box>
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                Associated Products (Optional)
              </Typography>
              <FormControl fullWidth>
                <InputLabel>Select Products</InputLabel>
                <Select
                  multiple
                  value={formData.selected_products}
                  label="Select Products"
                  onChange={(e) => handleInputChange('selected_products', e.target.value)}
                  disabled={previewMode || loadingProducts}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {(selected as string[]).map((value) => {
                        const product = products.find(p => p.id === value)
                        return (
                          <Chip
                            key={value}
                            label={product?.name || value}
                            size="small"
                          />
                        )
                      })}
                    </Box>
                  )}
                >
                  {loadingProducts ? (
                    <MenuItem disabled>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CircularProgress size={16} />
                        Loading products...
                      </Box>
                    </MenuItem>
                  ) : products.length === 0 ? (
                    <MenuItem disabled>No products available</MenuItem>
                  ) : (
                    products.map((product) => (
                      <MenuItem key={product.id} value={product.id}>
                        <Checkbox checked={formData.selected_products.indexOf(product.id) > -1} />
                        {product.name} - ₹{product.price}
                      </MenuItem>
                    ))
                  )}
                </Select>
              </FormControl>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                Link products that can be used or sold with this service
              </Typography>
            </Box>
            </>
           
          )}

          {/* Service Areas Tab */}
          {activeTab === 5 && (
            <Box>
              <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
            Service Areas
          </Typography>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {/* Existing Service Areas */}
                {formData.service_areas.map((area, index) => (
                  <Card key={index} sx={{ p: 2, bgcolor: 'grey.50' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box>
                        <Typography variant="subtitle1" fontWeight="600">
                          {area.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Base price multiplier: {area.multiplier}x
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Chip
                          label={area.active ? 'Active' : 'Inactive'} 
                          size="small"
                          color={area.active ? 'success' : 'default'} 
                        />
                        <IconButton
                          size="small" 
                          onClick={() => removeServiceArea(index)}
                          disabled={previewMode}
                          color="error"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                    </Box>
                </Card>
                ))}

                {/* Add New Service Area */}
                <Card sx={{ p: 2, border: '2px dashed', borderColor: 'divider' }}>
                  <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
                    Add New Service Area
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', md: 'row' }, mb: 2 }}>
                    <TextField
                      size="small"
                      label="Area Name"
                      value={newServiceArea.name}
                      onChange={(e) => setNewServiceArea(prev => ({ ...prev, name: e.target.value }))}
                      disabled={previewMode}
                      sx={{ flex: 1 }}
                    />
                    <TextField
                      size="small"
                      label="Price Multiplier"
                      type="number"
                      value={newServiceArea.multiplier}
                      onChange={(e) => setNewServiceArea(prev => ({ ...prev, multiplier: parseFloat(e.target.value) || 1.0 }))}
                      disabled={previewMode}
                      sx={{ flex: 1 }}
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={newServiceArea.active}
                          onChange={(e) => setNewServiceArea(prev => ({ ...prev, active: e.target.checked }))}
                          disabled={previewMode}
                        />
                      }
                      label="Active"
                      sx={{ flex: 1 }}
                    />
                  </Box>
              <Button
                    variant="outlined"
                    onClick={addServiceArea}
                    disabled={previewMode || !newServiceArea.name.trim()}
                startIcon={<AddIcon />}
              >
                Add Service Area
              </Button>
                </Card>
              </Box>
            </Box>
          )}

          {/* Our Process Tab */}
          {activeTab === 6 && (
            <Box>
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <TimelineIcon color="primary" />
                  Our Process
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Define the step-by-step process customers can expect. This builds trust and sets clear expectations.
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {/* Existing Process Steps */}
                {formData.our_process.length > 0 ? (
                  formData.our_process.map((step, index) => (
                    <Card key={index} sx={{ 
                      p: 3,
                      border: '2px solid',
                      borderColor: 'primary.light',
                      borderRadius: 3,
                      position: 'relative',
                      overflow: 'visible',
                      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
                    }}>
                      <Box sx={{ 
                        position: 'absolute',
                        top: -15,
                        left: 20,
                        width: 40,
                        height: 40,
                        borderRadius: '50%',
                        bgcolor: 'primary.main',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        fontSize: '1.2rem',
                        boxShadow: 3,
                      }}>
                        {step.step}
                      </Box>
                      
                      <Box sx={{ mt: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
                          <Typography variant="h6" fontWeight="700" color="primary.dark">
                            {step.title}
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <Tooltip title="Move up">
                              <IconButton
                                size="small"
                                onClick={() => moveProcessStep(index, 'up')}
                                disabled={previewMode || index === 0}
                                sx={{ bgcolor: 'white' }}
                              >
                                <ArrowUpIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Move down">
                              <IconButton
                                size="small"
                                onClick={() => moveProcessStep(index, 'down')}
                                disabled={previewMode || index === formData.our_process.length - 1}
                                sx={{ bgcolor: 'white' }}
                              >
                                <ArrowDownIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Remove step">
                              <IconButton
                                size="small"
                                onClick={() => removeProcessStep(index)}
                                disabled={previewMode}
                                color="error"
                                sx={{ bgcolor: 'white' }}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </Box>
                        <Typography variant="body2" color="text.primary" sx={{ lineHeight: 1.7 }}>
                          {step.description}
                        </Typography>
                      </Box>
                    </Card>
                  ))
                ) : (
                  <Paper sx={{ 
                    p: 4, 
                    textAlign: 'center', 
                    border: '2px dashed', 
                    borderColor: 'grey.300',
                    borderRadius: 3,
                    bgcolor: 'grey.50'
                  }}>
                    <TimelineIcon sx={{ fontSize: 48, color: 'grey.400', mb: 2 }} />
                    <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
                      No process steps added yet
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Add step-by-step instructions to help customers understand your workflow
                    </Typography>
                  </Paper>
                )}

                {/* Add New Process Step */}
                <Card sx={{ 
                  p: 3, 
                  border: '2px dashed', 
                  borderColor: 'primary.main',
                  borderRadius: 3,
                  bgcolor: 'primary.50'
                }}>
                  <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <AddIcon color="primary" />
                    Add New Process Step
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12 }}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Step Title"
                        value={newProcessStep.title}
                        onChange={(e) => setNewProcessStep(prev => ({ ...prev, title: e.target.value }))}
                        disabled={previewMode}
                        placeholder="e.g., Schedule Appointment"
                        sx={{ bgcolor: 'white' }}
                      />
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Step Description"
                        multiline
                        rows={3}
                        value={newProcessStep.description}
                        onChange={(e) => setNewProcessStep(prev => ({ ...prev, description: e.target.value }))}
                        disabled={previewMode}
                        placeholder="Describe what happens in this step..."
                        sx={{ bgcolor: 'white' }}
                      />
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                      <Button
                        variant="contained"
                        onClick={addProcessStep}
                        disabled={previewMode || !newProcessStep.title.trim() || !newProcessStep.description.trim()}
                        startIcon={<AddIcon />}
                        fullWidth
                        size="large"
                      >
                        Add Process Step
                      </Button>
                    </Grid>
                  </Grid>
                </Card>
              </Box>
            </Box>
          )}

          {/* Include & Exclude Tab */}
          {activeTab === 7 && (
            <Box>
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <CheckIcon color="success" />
                  What's Included & Excluded
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Clearly define what is and isn't included in your service to avoid misunderstandings.
                </Typography>
              </Box>
              
              <Grid container spacing={3}>
                {/* What's Included */}
                <Grid size={{ xs: 12, md: 6 }}>
                  <Card sx={{ 
                    height: '100%', 
                    border: '2px solid', 
                    borderColor: 'success.light',
                    borderRadius: 3,
                    overflow: 'hidden'
                  }}>
                    <Box sx={{ 
                      p: 2, 
                      bgcolor: 'success.main', 
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1
                    }}>
                      <CheckIcon />
                      <Typography variant="h6" fontWeight="700">
                        What's Included
                      </Typography>
                      <Chip 
                        label={formData.whats_included.length} 
                        size="small" 
                        sx={{ 
                          bgcolor: 'rgba(255,255,255,0.3)', 
                          color: 'white',
                          fontWeight: 600
                        }} 
                      />
                    </Box>
                    <CardContent>
                      <Box sx={{ mb: 2, minHeight: 200 }}>
                        {formData.whats_included.length > 0 ? (
                          <Stack spacing={1}>
                            {formData.whats_included.map((item, index) => (
                              <Paper key={index} sx={{ p: 1.5, display: 'flex', alignItems: 'center', gap: 1, bgcolor: 'success.50' }}>
                                <CheckIcon color="success" fontSize="small" />
                                <Typography variant="body2" sx={{ flex: 1 }}>
                                  {item}
                                </Typography>
                                <IconButton
                                  size="small"
                                  onClick={() => removeIncluded(index)}
                                  disabled={previewMode}
                                  color="error"
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </Paper>
                            ))}
                          </Stack>
                        ) : (
                          <Box sx={{ 
                            height: 200, 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            border: '2px dashed',
                            borderColor: 'grey.300',
                            borderRadius: 2,
                            bgcolor: 'grey.50'
                          }}>
                            <Typography variant="body2" color="text.secondary">
                              No items added yet
                            </Typography>
                          </Box>
                        )}
                      </Box>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <TextField
                          size="small"
                          fullWidth
                          placeholder="e.g., All materials and labor"
                          value={newIncluded}
                          onChange={(e) => setNewIncluded(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && addIncluded()}
                          disabled={previewMode}
                        />
                        <Button
                          variant="contained"
                          onClick={addIncluded}
                          disabled={previewMode || !newIncluded.trim()}
                          color="success"
                        >
                          <AddIcon />
                        </Button>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>

                {/* What's Excluded */}
                <Grid size={{ xs: 12, md: 6 }}>
                  <Card sx={{ 
                    height: '100%', 
                    border: '2px solid', 
                    borderColor: 'error.light',
                    borderRadius: 3,
                    overflow: 'hidden'
                  }}>
                    <Box sx={{ 
                      p: 2, 
                      bgcolor: 'error.main', 
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1
                    }}>
                      <CrossIcon />
                      <Typography variant="h6" fontWeight="700">
                        What's Excluded
                      </Typography>
                      <Chip 
                        label={formData.whats_excluded.length} 
                        size="small" 
                        sx={{ 
                          bgcolor: 'rgba(255,255,255,0.3)', 
                          color: 'white',
                          fontWeight: 600
                        }} 
                      />
                    </Box>
                    <CardContent>
                      <Box sx={{ mb: 2, minHeight: 200 }}>
                        {formData.whats_excluded.length > 0 ? (
                          <Stack spacing={1}>
                            {formData.whats_excluded.map((item, index) => (
                              <Paper key={index} sx={{ p: 1.5, display: 'flex', alignItems: 'center', gap: 1, bgcolor: 'error.50' }}>
                                <CrossIcon color="error" fontSize="small" />
                                <Typography variant="body2" sx={{ flex: 1 }}>
                                  {item}
                                </Typography>
                                <IconButton
                                  size="small"
                                  onClick={() => removeExcluded(index)}
                                  disabled={previewMode}
                                  color="error"
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </Paper>
                            ))}
                          </Stack>
                        ) : (
                          <Box sx={{ 
                            height: 200, 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            border: '2px dashed',
                            borderColor: 'grey.300',
                            borderRadius: 2,
                            bgcolor: 'grey.50'
                          }}>
                            <Typography variant="body2" color="text.secondary">
                              No items added yet
                            </Typography>
                          </Box>
                        )}
                      </Box>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <TextField
                          size="small"
                          fullWidth
                          placeholder="e.g., Structural repairs"
                          value={newExcluded}
                          onChange={(e) => setNewExcluded(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && addExcluded()}
                          disabled={previewMode}
                        />
                        <Button
                          variant="contained"
                          onClick={addExcluded}
                          disabled={previewMode || !newExcluded.trim()}
                          color="error"
                        >
                          <AddIcon />
                        </Button>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Box>
          )}

          {/* Notes & Promises Tab */}
          {activeTab === 8 && (
            <Box>
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <LightbulbIcon color="warning" />
                  Important Notes & Our Promises
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Add important notes and service commitments to build customer confidence.
                </Typography>
              </Box>
              
              <Grid container spacing={3}>
                {/* Please Note */}
                <Grid size={{ xs: 12, md: 6 }}>
                  <Card sx={{ 
                    height: '100%', 
                    border: '2px solid', 
                    borderColor: 'warning.light',
                    borderRadius: 3,
                    overflow: 'hidden'
                  }}>
                    <Box sx={{ 
                      p: 2, 
                      bgcolor: 'warning.main', 
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1
                    }}>
                      <LightbulbIcon />
                      <Typography variant="h6" fontWeight="700">
                        Please Note
                      </Typography>
                      <Chip 
                        label={formData.please_note.length} 
                        size="small" 
                        sx={{ 
                          bgcolor: 'rgba(255,255,255,0.3)', 
                          color: 'white',
                          fontWeight: 600
                        }} 
                      />
                    </Box>
                    <CardContent>
                      <Box sx={{ mb: 2, minHeight: 250 }}>
                        {formData.please_note.length > 0 ? (
                          <Stack spacing={1.5}>
                            {formData.please_note.map((note, index) => (
                              <Paper key={index} sx={{ p: 2, bgcolor: 'warning.50', borderLeft: '4px solid', borderColor: 'warning.main' }}>
                                <Box sx={{ display: 'flex', alignItems: 'start', gap: 1 }}>
                                  <LightbulbIcon color="warning" fontSize="small" sx={{ mt: 0.5 }} />
                                  <Typography variant="body2" sx={{ flex: 1, lineHeight: 1.6 }}>
                                    {note}
                                  </Typography>
                                  <IconButton
                                    size="small"
                                    onClick={() => removeNote(index)}
                                    disabled={previewMode}
                                  >
                                    <DeleteIcon fontSize="small" />
                                  </IconButton>
                                </Box>
                              </Paper>
                            ))}
                          </Stack>
                        ) : (
                          <Box sx={{ 
                            height: 250, 
                            display: 'flex', 
                            flexDirection: 'column',
                            alignItems: 'center', 
                            justifyContent: 'center',
                            border: '2px dashed',
                            borderColor: 'grey.300',
                            borderRadius: 2,
                            bgcolor: 'grey.50',
                            gap: 1
                          }}>
                            <LightbulbIcon sx={{ fontSize: 48, color: 'grey.400' }} />
                            <Typography variant="body2" color="text.secondary">
                              No notes added yet
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Add important information customers should know
                            </Typography>
                          </Box>
                        )}
                      </Box>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <TextField
                          size="small"
                          fullWidth
                          multiline
                          rows={2}
                          placeholder="e.g., 24-hour advance booking required"
                          value={newNote}
                          onChange={(e) => setNewNote(e.target.value)}
                          disabled={previewMode}
                        />
                        <Button
                          variant="contained"
                          onClick={addNote}
                          disabled={previewMode || !newNote.trim()}
                          color="warning"
                          sx={{ minWidth: 56 }}
                        >
                          <AddIcon />
                        </Button>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>

                {/* Our Promises */}
                <Grid size={{ xs: 12, md: 6 }}>
                  <Card sx={{ 
                    height: '100%', 
                    border: '2px solid', 
                    borderColor: 'info.light',
                    borderRadius: 3,
                    overflow: 'hidden'
                  }}>
                    <Box sx={{ 
                      p: 2, 
                      bgcolor: 'info.main', 
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1
                    }}>
                      <ShieldIcon />
                      <Typography variant="h6" fontWeight="700">
                        Our Promises
                      </Typography>
                      <Chip 
                        label={formData.our_promises.length} 
                        size="small" 
                        sx={{ 
                          bgcolor: 'rgba(255,255,255,0.3)', 
                          color: 'white',
                          fontWeight: 600
                        }} 
                      />
                    </Box>
                    <CardContent>
                      <Box sx={{ mb: 2, minHeight: 250 }}>
                        {formData.our_promises.length > 0 ? (
                          <Stack spacing={1.5}>
                            {formData.our_promises.map((promise, index) => (
                              <Paper key={index} sx={{ p: 2, bgcolor: 'info.50', borderLeft: '4px solid', borderColor: 'info.main' }}>
                                <Box sx={{ display: 'flex', alignItems: 'start', gap: 1 }}>
                                  <ShieldIcon color="info" fontSize="small" sx={{ mt: 0.5 }} />
                                  <Typography variant="body2" sx={{ flex: 1, fontWeight: 500, lineHeight: 1.6 }}>
                                    {promise}
                                  </Typography>
                                  <IconButton
                                    size="small"
                                    onClick={() => removePromise(index)}
                                    disabled={previewMode}
                                  >
                                    <DeleteIcon fontSize="small" />
                                  </IconButton>
                                </Box>
                              </Paper>
                            ))}
                          </Stack>
                        ) : (
                          <Box sx={{ 
                            height: 250, 
                            display: 'flex', 
                            flexDirection: 'column',
                            alignItems: 'center', 
                            justifyContent: 'center',
                            border: '2px dashed',
                            borderColor: 'grey.300',
                            borderRadius: 2,
                            bgcolor: 'grey.50',
                            gap: 1
                          }}>
                            <ShieldIcon sx={{ fontSize: 48, color: 'grey.400' }} />
                            <Typography variant="body2" color="text.secondary">
                              No promises added yet
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Build trust with service commitments
                            </Typography>
                          </Box>
                        )}
                      </Box>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <TextField
                          size="small"
                          fullWidth
                          multiline
                          rows={2}
                          placeholder="e.g., 100% Satisfaction Guaranteed"
                          value={newPromise}
                          onChange={(e) => setNewPromise(e.target.value)}
                          disabled={previewMode}
                        />
                        <Button
                          variant="contained"
                          onClick={addPromise}
                          disabled={previewMode || !newPromise.trim()}
                          color="info"
                          sx={{ minWidth: 56 }}
                        >
                          <AddIcon />
                        </Button>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Box>
          )}

          {/* FAQs Tab */}
          {activeTab === 9 && (
            <Box>
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <HelpIcon color="secondary" />
                  Frequently Asked Questions
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Answer common customer questions to reduce support inquiries and build confidence.
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {/* Existing FAQs */}
                {formData.faqs.length > 0 ? (
                  formData.faqs.map((faq, index) => (
                    <Accordion 
                      key={index}
                      defaultExpanded
                      sx={{ 
                        border: '1px solid',
                        borderColor: 'secondary.light',
                        borderRadius: '12px !important',
                        '&:before': { display: 'none' },
                        boxShadow: 2,
                      }}
                    >
                      <AccordionSummary 
                        expandIcon={<ExpandMoreIcon />}
                        sx={{
                          bgcolor: 'secondary.50',
                          borderRadius: '12px 12px 0 0',
                          '&.Mui-expanded': {
                            minHeight: 48,
                          }
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1, pr: 2 }}>
                          <Box sx={{
                            width: 32,
                            height: 32,
                            borderRadius: '50%',
                            bgcolor: 'secondary.main',
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.875rem',
                            fontWeight: 700,
                            flexShrink: 0
                          }}>
                            Q{index + 1}
                          </Box>
                          <Typography variant="subtitle1" fontWeight="600" sx={{ flex: 1 }}>
                            {faq.question}
                          </Typography>
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation()
                              removeFaq(index)
                            }}
                            disabled={previewMode}
                            color="error"
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      </AccordionSummary>
                      <AccordionDetails sx={{ p: 3, bgcolor: 'background.paper' }}>
                        <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>
                          {faq.answer}
                        </Typography>
                      </AccordionDetails>
                    </Accordion>
                  ))
                ) : (
                  <Paper sx={{ 
                    p: 6, 
                    textAlign: 'center', 
                    border: '2px dashed', 
                    borderColor: 'grey.300',
                    borderRadius: 3,
                    bgcolor: 'grey.50'
                  }}>
                    <HelpIcon sx={{ fontSize: 64, color: 'grey.400', mb: 2 }} />
                    <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
                      No FAQs added yet
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Add frequently asked questions to help customers make informed decisions
                    </Typography>
                  </Paper>
                )}

                {/* Add New FAQ */}
                <Card sx={{ 
                  p: 3, 
                  border: '2px dashed', 
                  borderColor: 'secondary.main',
                  borderRadius: 3,
                  bgcolor: 'secondary.50'
                }}>
                  <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <AddIcon color="secondary" />
                    Add New FAQ
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12 }}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Question"
                        value={newFaq.question}
                        onChange={(e) => setNewFaq(prev => ({ ...prev, question: e.target.value }))}
                        disabled={previewMode}
                        placeholder="e.g., How long does the service take?"
                        sx={{ bgcolor: 'white' }}
                      />
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Answer"
                        multiline
                        rows={4}
                        value={newFaq.answer}
                        onChange={(e) => setNewFaq(prev => ({ ...prev, answer: e.target.value }))}
                        disabled={previewMode}
                        placeholder="Provide a detailed answer..."
                        sx={{ bgcolor: 'white' }}
                      />
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                      <Button
                        variant="contained"
                        onClick={addFaq}
                        disabled={previewMode || !newFaq.question.trim() || !newFaq.answer.trim()}
                        startIcon={<AddIcon />}
                        fullWidth
                        size="large"
                        color="secondary"
                      >
                        Add FAQ
                      </Button>
                    </Grid>
                  </Grid>
                </Card>
              </Box>
            </Box>
          )}
        </Box>

        {/* Form Actions */}
        <Box sx={{ p: 3, bgcolor: 'grey.50', borderTop: '1px solid', borderColor: 'divider', display: 'flex', justifyContent: 'space-between' }}>
            <Button
              variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/platform-services')}
            sx={{ textTransform: 'none' }}
            >
              Back to Services
            </Button>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant="outlined"
                onClick={() => handleSubmit('draft')}
                disabled={loading || !formData.name?.trim() || !formData.category || !formData.subcategory || !formData.description?.trim()}
                sx={{ textTransform: 'none' }}
              >
                Save as Draft
              </Button>
              <Button
                variant="contained"
                startIcon={loading ? <CircularProgress size={16} /> : <SaveIcon />}
                onClick={() => handleSubmit('publish')}
                disabled={loading || !formData.name?.trim() || !formData.category || !formData.subcategory || !formData.description?.trim()}
                sx={{ textTransform: 'none' }}
              >
                {loading ? (isEditMode ? 'Updating...' : 'Creating...') : (isEditMode ? 'Update Service' : 'Publish Service')}
              </Button>
            </Box>
          </Box>
        </Card>

        {/* Snackbar */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        >
          <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
        </Snackbar>
        </>
      )}
    </Box>
  )
}