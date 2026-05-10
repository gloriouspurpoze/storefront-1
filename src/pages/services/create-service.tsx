import React, { useState, useEffect } from 'react'
import {
  Loader2,
  ArrowLeft,
  Save,
  Eye,
  Plus,
  Trash2,
  Upload,
  Star,
  IndianRupee,
  Info,
  Calendar,
  MapPin,
  Wrench,
  ArrowUp,
  ArrowDown,
  CircleCheck,
  CircleX,
  Lightbulb,
  ShieldCheck,
  CircleHelp,
  ListOrdered,
  X,
} from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import { Button } from '../../components/ui/button'
import { Card, CardContent } from '../../components/ui/card'
import { Input } from '../../components/ui/input'
import { Textarea } from '../../components/ui/textarea'
import { Label } from '../../components/ui/label'
import { Badge } from '../../components/ui/badge'
import { Checkbox } from '../../components/ui/checkbox'
import { Switch } from '../../components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select'
import { Tabs, TabsList, TabsTrigger } from '../../components/ui/tabs'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '../../components/ui/accordion'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '../../components/ui/tooltip'
import { appToast } from '../../lib/appToast'
import { platformServicesService } from '../../services/api/platformServices.service'
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

function getCategoryId(c: any): string {
  return String(c?.id ?? c?._id ?? '').toLowerCase()
}

function slugifyLabel(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function extractIdLikeString(raw: unknown): string {
  if (raw == null) return ''
  if (typeof raw === 'object') {
    const o = raw as Record<string, unknown>
    const id = o.id ?? o._id
    if (id != null && String(id).trim()) return String(id).trim().toLowerCase()
    if (o.slug != null && String(o.slug).trim()) return String(o.slug).trim().toLowerCase()
    if (o.name != null && String(o.name).trim()) return String(o.name).trim().toLowerCase()
    return ''
  }
  return String(raw).trim().toLowerCase()
}

/** Map API category (id, slug, or name) to a dropdown value that exists in loaded categories. */
function resolveCategoryPick(raw: unknown, categories: any[]): string {
  const hint = extractIdLikeString(raw)
  if (!hint || !categories.length) return hint
  if (categories.some((c) => getCategoryId(c) === hint)) return hint
  const bySlug = categories.find((c) => String((c as any).slug ?? '').toLowerCase() === hint)
  if (bySlug) return getCategoryId(bySlug)
  const byName = categories.find((c) => String((c as any).name ?? '').toLowerCase() === hint)
  if (byName) return getCategoryId(byName)
  const bySlugifiedName = categories.find((c) => slugifyLabel(String((c as any).name ?? '')) === hint)
  if (bySlugifiedName) return getCategoryId(bySlugifiedName)
  return hint
}

function resolveSubcategoryPick(raw: unknown, subs: any[]): string {
  const hint = extractIdLikeString(raw)
  if (!hint || !subs.length) return hint
  if (subs.some((s) => getCategoryId(s) === hint)) return hint
  const bySlug = subs.find((s) => String((s as any).slug ?? '').toLowerCase() === hint)
  if (bySlug) return getCategoryId(bySlug)
  const byName = subs.find((s) => String((s as any).name ?? '').toLowerCase() === hint)
  if (byName) return getCategoryId(byName)
  return hint
}

/** Rich text often saves as `<p><br></p>` — treat as empty for required validation. */
function richTextHasPlainText(html: string): boolean {
  if (!html || !String(html).trim()) return false
  const stripped = String(html)
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  return stripped.length > 0
}

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
        appToast('Service name is required', 'error')
        setActiveTab(0)
        return
      }
      if (!formData.category?.trim()) {
        appToast('Please select a category', 'error')
        setActiveTab(0)
        return
      }
      const subsRequired =
        Boolean(formData.category?.trim()) && !loadingSubcategories && subcategories.length > 0
      if (subsRequired && !formData.subcategory?.trim()) {
        appToast('Please select a subcategory', 'error')
        setActiveTab(0)
        return
      }
      if (!richTextHasPlainText(formData.description)) {
        appToast('Description is required', 'error')
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
        appToast('Service updated successfully!', 'success')
      } else {
        if (action === 'draft') {
          await platformServicesService.saveAsDraft(submitData)
          appToast('Service saved as draft successfully!', 'success')
        } else {
          await platformServicesService.createService(submitData)
          appToast('Service published successfully!', 'success')
        }
      }

      setTimeout(() => navigate('/platform-services'), 1500)
    } catch (error: any) {
      const message =
        error?.response?.data?.message ??
        error?.message ??
        (error?.errors ? error.errors.map((e: any) => e.message || e.msg).join(', ') : null) ??
        `Failed to ${isEditMode ? 'update' : action} service`
      appToast(String(message), 'error')
    } finally {
      setLoading(false)
    }
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
        
        appToast('Service loaded successfully', 'success')
      } catch (error: any) {
        appToast(error.message || 'Failed to load service', 'error')
        // Navigate back if service not found
        setTimeout(() => navigate('/platform-services'), 2000)
      } finally {
        setLoadingService(false)
      }
    }
    
    loadService()
  }, [id])

  // When catalog loads, align stored category with dropdown ids (slug/name/object → Mongo id).
  useEffect(() => {
    if (loadingCategories || categories.length === 0) return
    setFormData((prev) => {
      if (!prev.category?.trim()) return prev
      const resolved = resolveCategoryPick(prev.category, categories)
      if (resolved === prev.category) return prev
      return { ...prev, category: resolved }
    })
  }, [categories, loadingCategories])

  // Align subcategory once options load (slug/name vs id).
  useEffect(() => {
    if (loadingSubcategories || subcategories.length === 0 || !formData.subcategory?.trim()) return
    setFormData((prev) => {
      const resolved = resolveSubcategoryPick(prev.subcategory, subcategories)
      if (resolved === prev.subcategory) return prev
      return { ...prev, subcategory: resolved }
    })
  }, [subcategories, loadingSubcategories])

  // Fetch categories for dropdown: full service/both list so ids match API (not only root parents).
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
        const raw = await CategoriesService.getCategoriesForServiceUIs({
          page: 1,
          limit: 200,
          is_active: true,
        })
        const list = normalizeList({ categories: raw })
        list.sort((a: any, b: any) =>
          String(a.name ?? '').localeCompare(String(b.name ?? ''), undefined, { sensitivity: 'base' }),
        )
        setCategories(list)
      } catch (error) {
        console.error('Error fetching categories:', error)
        appToast('Failed to load categories', 'error')
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
        appToast('Failed to load providers', 'error')
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
        appToast('Failed to load products', 'error')
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
      const normalized = list
        .map((sub: any) => ({
          ...sub,
          id: String(sub.id ?? sub._id ?? '').toLowerCase(),
          name: sub.name ?? sub.displayName ?? sub.title ?? '',
        }))
        .filter((sub: any) => sub.id && sub.name)
      setSubcategories(normalized)
    } catch (error) {
      console.error('Error fetching subcategories:', error)
      appToast('Failed to load subcategories', 'error')
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
      appToast('Enter a subcategory name', 'error')
      return
    }
    if (!formData.category) {
      appToast('Select a category first', 'error')
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
      const newId = created ? String(created.id ?? (created as any)._id ?? '').toLowerCase() : ''
      if (newId) {
        setSubcategories((prev) => [...prev, { ...created, id: newId, name: created.name ?? name }])
        handleInputChange('subcategory', newId)
        setNewSubcategoryName('')
        appToast(`Subcategory "${name}" created under ${parentCategory?.name ?? 'category'}`, 'success')
      } else {
        await fetchSubcategoriesForCategory(formData.category)
        appToast('Subcategory created', 'success')
      }
    } catch (error: any) {
      console.error('Error creating subcategory:', error)
      appToast(error?.message ?? 'Failed to create subcategory', 'error')
    } finally {
      setCreatingSubcategory(false)
    }
  }

  const requiresSubcategoryPick =
    Boolean(formData.category?.trim()) && !loadingSubcategories && subcategories.length > 0

  const primaryActionsDisabled =
    loading ||
    !formData.name?.trim() ||
    !formData.category?.trim() ||
    (requiresSubcategoryPick && !formData.subcategory?.trim()) ||
    !richTextHasPlainText(formData.description)

  return (
    <div className="p-4 md:p-6">
      {/* Loading indicator for edit mode */}
      {loadingService && (
        <div className="flex min-h-[50vh] items-center justify-center">
          <div className="text-center">
            <Loader2 className="mx-auto h-12 w-12 animate-spin text-muted-foreground" />
            <p className="mt-2 text-sm">Loading service data...</p>
          </div>
        </div>
      )}
      
      {!loadingService && (
        <>
          {/* Header */}
          <div className="mb-6">
            <div className="mb-4 flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => navigate('/platform-services')}
                className="bg-muted hover:bg-muted/80"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="mb-0.5 text-2xl font-semibold">
                  {isEditMode ? 'Edit Service' : 'Create New Service'}
                </h1>
                <p className="text-sm text-muted-foreground">
                  {isEditMode ? 'Update service details and settings' : 'Add a new service to your platform'}
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                leftIcon={<Eye className="h-4 w-4" />}
                onClick={() => setPreviewMode(!previewMode)}
              >
                {previewMode ? 'Edit Mode' : 'Preview Mode'}
              </Button>
              <Button
                loading={loading}
                leftIcon={!loading ? <Save className="h-4 w-4" /> : undefined}
                onClick={() => handleSubmit('publish')}
                disabled={primaryActionsDisabled}
              >
                {loading ? (isEditMode ? 'Updating...' : 'Creating...') : (isEditMode ? 'Update Service' : 'Create Service')}
              </Button>
            </div>
          </div>

      {/* Main Form with Tabs */}
      <Card className="overflow-hidden rounded-lg border shadow-sm">
        <div className="overflow-x-auto border-b">
          <Tabs
            value={String(activeTab)}
            onValueChange={(v) => setActiveTab(Number(v))}
            className="w-full"
          >
            <TabsList className="h-auto min-h-[4rem] w-full flex-wrap justify-start gap-0 rounded-none border-0 bg-transparent p-1">
              <TabsTrigger value="0" className="gap-2 data-[state=active]:bg-muted sm:min-h-16">
                <Info className="h-4 w-4 shrink-0" />
                Basic Info
              </TabsTrigger>
              <TabsTrigger value="1" className="gap-2 data-[state=active]:bg-muted sm:min-h-16">
                <IndianRupee className="h-4 w-4 shrink-0" />
                Pricing
              </TabsTrigger>
              <TabsTrigger value="2" className="gap-2 data-[state=active]:bg-muted sm:min-h-16">
                <Calendar className="h-4 w-4 shrink-0" />
                Availability
              </TabsTrigger>
              <TabsTrigger value="3" className="gap-2 data-[state=active]:bg-muted sm:min-h-16">
                <Star className="h-4 w-4 shrink-0" />
                Features & Requirements
              </TabsTrigger>
              <TabsTrigger value="4" className="gap-2 data-[state=active]:bg-muted sm:min-h-16">
                <Wrench className="h-4 w-4 shrink-0" />
                Product Options
              </TabsTrigger>
              <TabsTrigger value="5" className="gap-2 data-[state=active]:bg-muted sm:min-h-16">
                <MapPin className="h-4 w-4 shrink-0" />
                Service Areas
              </TabsTrigger>
              <TabsTrigger value="6" className="gap-2 data-[state=active]:bg-muted sm:min-h-16">
                <ListOrdered className="h-4 w-4 shrink-0" />
                Our Process
              </TabsTrigger>
              <TabsTrigger value="7" className="gap-2 data-[state=active]:bg-muted sm:min-h-16">
                <CircleCheck className="h-4 w-4 shrink-0" />
                Include & Exclude
              </TabsTrigger>
              <TabsTrigger value="8" className="gap-2 data-[state=active]:bg-muted sm:min-h-16">
                <Lightbulb className="h-4 w-4 shrink-0" />
                Notes & Promises
              </TabsTrigger>
              <TabsTrigger value="9" className="gap-2 data-[state=active]:bg-muted sm:min-h-16">
                <CircleHelp className="h-4 w-4 shrink-0" />
                FAQs
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {/* Basic Information Tab — Mandatory fields first, then optional (pre-filled) */}
          {activeTab === 0 && (
            <div>
              <p className="mb-6 text-sm text-muted-foreground">
                Complete name, category, description, and subcategory when your category has sub-types. Other fields
                have sensible defaults you can adjust later.
              </p>

              <div className="mb-6 rounded-lg border border-primary/20 bg-primary/5 p-6">
                <p className="mb-4 flex items-center gap-2 text-base font-bold">
                  <Badge>Required</Badge>
                  Basic info
                </p>
                <div className="flex flex-col gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="service-name">Service Name</Label>
                    <Input
                      id="service-name"
                      value={formData.name}
                      onChange={(e) => handleNameChange(e.target.value)}
                      placeholder="e.g., Switch & Socket Repair"
                      disabled={previewMode}
                      className="w-full"
                    />
                    <p className="text-xs text-muted-foreground">Clear name customers will see</p>
                  </div>

                  <div className="flex flex-col gap-4 md:flex-row">
                    <div className="flex-1 space-y-2">
                      <Label>Category</Label>
                      <Select
                        value={formData.category || undefined}
                        onValueChange={(v) => {
                          handleInputChange('category', v)
                          handleInputChange('subcategory', '')
                        }}
                        disabled={previewMode || loadingCategories}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue
                            placeholder={
                              loadingCategories
                                ? 'Loading...'
                                : categories.length === 0
                                  ? 'No categories'
                                  : 'Select category'
                            }
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((cat) => (
                            <SelectItem key={getCategoryId(cat)} value={getCategoryId(cat)}>
                              {cat.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex-1 space-y-2">
                      <Label>
                        Subcategory
                        {formData.category && !loadingSubcategories && subcategories.length === 0 ? (
                          <span className="ml-1 font-normal text-muted-foreground">(optional)</span>
                        ) : null}
                      </Label>
                      <Select
                        value={formData.subcategory || undefined}
                        onValueChange={(v) => handleInputChange('subcategory', v)}
                        disabled={previewMode || !formData.category || loadingSubcategories}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue
                            placeholder={
                              loadingSubcategories
                                ? 'Loading...'
                                : formData.category
                                  ? 'Select subcategory'
                                  : 'Select category first'
                            }
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {subcategories.map((sub) => (
                            <SelectItem key={getCategoryId(sub)} value={getCategoryId(sub)}>
                              {sub.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {formData.category && (
                    <div className="rounded-md border bg-background p-3">
                      <p className="mb-2 block text-xs text-muted-foreground">Need a new subcategory?</p>
                      <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-end">
                        <div className="min-w-[140px] flex-1 space-y-2">
                          <Label htmlFor="new-subcat">New subcategory name</Label>
                          <Input
                            id="new-subcat"
                            placeholder="e.g. Socket, Switch"
                            value={newSubcategoryName}
                            onChange={(e) => setNewSubcategoryName(e.target.value)}
                            onKeyDown={(e) =>
                              e.key === 'Enter' && (e.preventDefault(), handleCreateSubcategory())
                            }
                            disabled={creatingSubcategory || previewMode}
                          />
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          loading={creatingSubcategory}
                          leftIcon={!creatingSubcategory ? <Plus className="h-4 w-4" /> : undefined}
                          onClick={handleCreateSubcategory}
                          disabled={creatingSubcategory || !newSubcategoryName.trim() || previewMode}
                          className="shrink-0"
                        >
                          {creatingSubcategory ? 'Creating…' : 'Add'}
                        </Button>
                      </div>
                    </div>
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
                </div>
              </div>

              <div className="mb-6 rounded-lg border bg-card p-6">
                <p className="mb-1 flex items-center gap-2 text-base font-bold">
                  <Upload className="h-5 w-5 text-primary" />
                  Service Images
                </p>
                <p className="mb-4 text-sm text-muted-foreground">
                  Add at least one image so customers can see the service. First image is used as the main image.
                </p>
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
              </div>

              <div className="mb-6 rounded-lg border bg-card p-6">
                <p className="mb-4 block text-sm font-medium text-muted-foreground">Visibility</p>
                <div className="flex flex-wrap items-center gap-6">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={formData.is_featured}
                      onCheckedChange={(v) => handleInputChange('is_featured', v)}
                      disabled={previewMode}
                    />
                    <Label>Featured</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={formData.is_popular}
                      onCheckedChange={(v) => handleInputChange('is_popular', v)}
                      disabled={previewMode}
                    />
                    <Label>Popular</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={formData.is_active}
                      onCheckedChange={(v) => handleInputChange('is_active', v)}
                      disabled={previewMode}
                    />
                    <Label>Active</Label>
                  </div>
                </div>
                <p className="mt-2 block text-xs text-muted-foreground">
                  Featured services appear in highlighted sections; popular in &quot;Popular&quot; listings. Inactive
                  services are hidden from customers.
                </p>
              </div>

              <Accordion type="single" collapsible className="rounded-md border">
                <AccordionItem value="optional-details" className="border-0 px-4">
                  <AccordionTrigger className="py-3 text-left text-sm font-medium text-muted-foreground no-underline hover:no-underline">
                    Optional details (pre-filled with defaults — edit if needed)
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="flex flex-col gap-4 pb-4">
                      <div className="space-y-2">
                        <Label htmlFor="slug">URL Slug (optional)</Label>
                        <Input
                          id="slug"
                          value={formData.slug}
                          onChange={(e) => handleInputChange('slug', e.target.value)}
                          placeholder="Auto-generated from name"
                          disabled={previewMode}
                          className="w-full font-mono text-sm"
                        />
                        <p className="text-xs text-muted-foreground">Leave blank to auto-generate from service name</p>
                      </div>

                      <div className="space-y-2">
                        <Label>Service Provider (optional)</Label>
                        <Select
                          value={formData.provider_id || 'platform'}
                          onValueChange={(v) => handleInputChange('provider_id', v === 'platform' ? '' : v)}
                          disabled={previewMode || loadingProviders}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Platform managed" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="platform">Platform managed</SelectItem>
                            {providers?.map((p) => (
                              <SelectItem key={p.id} value={p.id}>
                                {p.business_name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex flex-col gap-4 md:flex-row">
                        <div className="flex-1 space-y-2">
                          <Label>Service type</Label>
                          <Select
                            value={formData.service_type}
                            onValueChange={(v) =>
                              handleInputChange('service_type', v as 'fixed' | 'hourly' | 'consultation')
                            }
                            disabled={previewMode}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {PRICE_TYPES.map((t) => (
                                <SelectItem key={t.value} value={t.value}>
                                  {t.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex-1 space-y-2">
                          <Label htmlFor="duration-field">Duration</Label>
                          <Input
                            id="duration-field"
                            value={formData.duration}
                            onChange={(e) => handleInputChange('duration', e.target.value)}
                            placeholder="e.g. 60 mins"
                            disabled={previewMode}
                            className="w-full"
                          />
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Featured, Popular and Active toggles are in Basic Info above.
                      </p>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          )}

          {/* Pricing Tab */}
          {activeTab === 1 && (
            <div>
              <h2 className="mb-6 text-lg font-semibold">Pricing Configuration</h2>

              <div className="flex flex-col gap-6">
                {formData.service_type === 'fixed' && (
                  <div className="space-y-2">
                    <Label htmlFor="base-price">Base Price (₹) *</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                        ₹
                      </span>
                      <Input
                        id="base-price"
                        type="number"
                        value={formData.base_price}
                        onChange={(e) => handleInputChange('base_price', e.target.value)}
                        placeholder="299"
                        disabled={previewMode}
                        className="w-full pl-8"
                      />
                    </div>
                  </div>
                )}

                {formData.service_type === 'hourly' && (
                  <div className="flex flex-col gap-4 md:flex-row">
                    <div className="flex-1 space-y-2">
                      <Label htmlFor="hourly">Hourly Rate (₹) *</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                          ₹
                        </span>
                        <Input
                          id="hourly"
                          type="number"
                          value={formData.hourly_rate}
                          onChange={(e) => handleInputChange('hourly_rate', e.target.value)}
                          placeholder="199"
                          disabled={previewMode}
                          className="w-full pl-8"
                        />
                      </div>
                    </div>
                    <div className="flex-1 space-y-2">
                      <Label htmlFor="min-h">Minimum Hours</Label>
                      <Input
                        id="min-h"
                        type="number"
                        value={formData.min_hours}
                        onChange={(e) => handleInputChange('min_hours', e.target.value)}
                        placeholder="2"
                        disabled={previewMode}
                        className="w-full"
                      />
                    </div>
                    <div className="flex-1 space-y-2">
                      <Label htmlFor="max-h">Maximum Hours</Label>
                      <Input
                        id="max-h"
                        type="number"
                        value={formData.max_hours}
                        onChange={(e) => handleInputChange('max_hours', e.target.value)}
                        placeholder="8"
                        disabled={previewMode}
                        className="w-full"
                      />
                    </div>
                  </div>
                )}

                {formData.service_type === 'consultation' && (
                  <div className="space-y-2">
                    <Label htmlFor="consult">Consultation Fee (₹) *</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                        ₹
                      </span>
                      <Input
                        id="consult"
                        type="number"
                        value={formData.consultation_fee}
                        onChange={(e) => handleInputChange('consultation_fee', e.target.value)}
                        placeholder="999"
                        disabled={previewMode}
                        className="w-full pl-8"
                      />
                    </div>
                  </div>
                )}

                <div className="flex flex-col gap-4 md:flex-row md:items-end">
                  <div className="flex-1 space-y-2">
                    <Label htmlFor="gst">GST (%)</Label>
                    <Input
                      id="gst"
                      type="number"
                      value={formData.gst_percentage}
                      onChange={(e) =>
                        handleInputChange('gst_percentage', parseFloat(e.target.value) || 0)
                      }
                      disabled={previewMode}
                      className="w-full"
                    />
                  </div>
                  <div className="flex flex-1 items-center gap-2 pb-2">
                    <Switch
                      checked={formData.tax_included}
                      onCheckedChange={(v) => handleInputChange('tax_included', v)}
                      disabled={previewMode}
                    />
                    <Label>Tax included in price</Label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Availability Tab */}
          {activeTab === 2 && (
            <div>
              <h2 className="mb-6 text-lg font-semibold">Service Availability</h2>

              <div className="flex flex-col gap-6">
                <div>
                  <p className="mb-3 text-sm font-semibold">Working Days</p>
                  <div className="flex flex-wrap gap-4">
                    {WORKING_DAYS.map((day) => (
                      <div key={day} className="flex items-center gap-2">
                        <Checkbox
                          id={`day-${day}`}
                          checked={formData.working_days.includes(day)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              handleArrayChange('working_days', [...formData.working_days, day])
                            } else {
                              handleArrayChange(
                                'working_days',
                                formData.working_days.filter((d) => d !== day),
                              )
                            }
                          }}
                          disabled={previewMode}
                        />
                        <Label htmlFor={`day-${day}`} className="font-normal">
                          {day}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="mb-3 text-sm font-semibold">Available Time Slots</p>
                  <div className="flex flex-col gap-2">
                    {TIME_SLOTS.map((slot) => (
                      <div key={slot.value} className="flex items-center gap-2">
                        <Checkbox
                          id={`slot-${slot.value}`}
                          checked={formData.time_slots.includes(slot.value)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              handleArrayChange('time_slots', [...formData.time_slots, slot.value])
                            } else {
                              handleArrayChange(
                                'time_slots',
                                formData.time_slots.filter((s) => s !== slot.value),
                              )
                            }
                          }}
                          disabled={previewMode}
                        />
                        <Label htmlFor={`slot-${slot.value}`} className="font-normal">
                          {slot.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-4 md:flex-row">
                  <div className="flex-1 space-y-2">
                    <Label htmlFor="adv-hours">Advance Booking (hours)</Label>
                    <Input
                      id="adv-hours"
                      type="number"
                      value={formData.advance_booking_hours}
                      onChange={(e) =>
                        handleInputChange('advance_booking_hours', parseInt(e.target.value, 10) || 0)
                      }
                      disabled={previewMode}
                      className="w-full"
                    />
                  </div>
                  <div className="flex-1 space-y-2">
                    <Label htmlFor="em-charge">Emergency Charge (₹)</Label>
                    <Input
                      id="em-charge"
                      type="number"
                      value={formData.emergency_charge}
                      onChange={(e) => handleInputChange('emergency_charge', e.target.value)}
                      placeholder="200"
                      disabled={previewMode}
                      className="w-full"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap gap-6">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={formData.same_day_booking}
                      onCheckedChange={(v) => handleInputChange('same_day_booking', v)}
                      disabled={previewMode}
                    />
                    <Label>Allow Same-day Booking</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={formData.emergency_service}
                      onCheckedChange={(v) => handleInputChange('emergency_service', v)}
                      disabled={previewMode}
                    />
                    <Label>Emergency Service Available</Label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Features & Requirements Tab */}
          {activeTab === 3 && (
            <div>
              <h2 className="mb-6 text-lg font-semibold">Features & Requirements</h2>

              <div className="flex flex-col gap-8">
                <div>
                  <p className="mb-3 text-sm font-semibold">Service Features</p>
                  <div className="mb-2 flex flex-wrap gap-2">
                    {formData.features.map((feature, index) => (
                      <Badge
                        key={index}
                        variant="outline"
                        className="inline-flex items-center gap-1 border-primary/40 py-1 pl-2 pr-1"
                      >
                        {feature}
                        {!previewMode && (
                          <button
                            type="button"
                            className="rounded p-0.5 hover:bg-muted"
                            onClick={() => removeFeature(feature)}
                          >
                            <X className="h-3 w-3" />
                          </button>
                        )}
                      </Badge>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      placeholder="e.g., Switch replacement"
                      value={newFeature}
                      onChange={(e) => setNewFeature(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && addFeature()}
                      disabled={previewMode}
                      className="max-w-md flex-1"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={addFeature}
                      disabled={previewMode || !newFeature.trim()}
                    >
                      Add
                    </Button>
                  </div>
                </div>

                <div>
                  <p className="mb-3 text-sm font-semibold">Customer Requirements</p>
                  <div className="mb-2 flex flex-wrap gap-2">
                    {formData.requirements.map((requirement, index) => (
                      <Badge
                        key={index}
                        variant="outline"
                        className="inline-flex items-center gap-1 border-muted py-1 pl-2 pr-1"
                      >
                        {requirement}
                        {!previewMode && (
                          <button
                            type="button"
                            className="rounded p-0.5 hover:bg-muted"
                            onClick={() => removeRequirement(requirement)}
                          >
                            <X className="h-3 w-3" />
                          </button>
                        )}
                      </Badge>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      placeholder="e.g., Clear workspace"
                      value={newRequirement}
                      onChange={(e) => setNewRequirement(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && addRequirement()}
                      disabled={previewMode}
                      className="max-w-md flex-1"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={addRequirement}
                      disabled={previewMode || !newRequirement.trim()}
                    >
                      Add
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Product Options Tab */}
          {activeTab === 4 && (
            <>
              <div>
                <h2 className="mb-6 text-lg font-semibold">Product Options</h2>

                <div className="flex flex-col gap-6">
                  {formData.product_options.map((product, index) => (
                    <Card key={index} className="border p-4">
                      <div className="mb-3 flex items-start justify-between">
                        <p className="font-semibold">{product.name}</p>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={() => removeProduct(index)}
                          disabled={previewMode}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="flex flex-col gap-4 md:flex-row">
                        <div className="flex-1 space-y-2">
                          <Label>Product Name</Label>
                          <Input value={product.name} disabled={previewMode} className="w-full" readOnly />
                        </div>
                        <div className="flex-1 space-y-2">
                          <Label>Price (₹)</Label>
                          <Input type="number" value={product.price} disabled={previewMode} className="w-full" readOnly />
                        </div>
                        <div className="flex-1 space-y-2">
                          <Label>Brand</Label>
                          <Input value={product.brand} disabled={previewMode} className="w-full" readOnly />
                        </div>
                        <div className="flex-1 space-y-2">
                          <Label>Warranty</Label>
                          <Input value={product.warranty} disabled={previewMode} className="w-full" readOnly />
                        </div>
                      </div>
                      <div className="mt-4 space-y-2">
                        <Label>Description</Label>
                        <Textarea value={product.description} disabled={previewMode} rows={2} className="w-full" readOnly />
                      </div>
                    </Card>
                  ))}

                  <Card className="border-2 border-dashed p-4">
                    <p className="mb-4 text-sm font-semibold">Add New Product Option</p>
                    <div className="mb-4 flex flex-col gap-4 md:flex-row">
                      <div className="flex-1 space-y-2">
                        <Label htmlFor="np-name">Product Name</Label>
                        <Input
                          id="np-name"
                          value={newProduct.name}
                          onChange={(e) => setNewProduct((prev) => ({ ...prev, name: e.target.value }))}
                          disabled={previewMode}
                          className="w-full"
                        />
                      </div>
                      <div className="flex-1 space-y-2">
                        <Label htmlFor="np-price">Price (₹)</Label>
                        <Input
                          id="np-price"
                          type="number"
                          value={newProduct.price}
                          onChange={(e) => setNewProduct((prev) => ({ ...prev, price: e.target.value }))}
                          disabled={previewMode}
                          className="w-full"
                        />
                      </div>
                      <div className="flex-1 space-y-2">
                        <Label htmlFor="np-brand">Brand</Label>
                        <Input
                          id="np-brand"
                          value={newProduct.brand}
                          onChange={(e) => setNewProduct((prev) => ({ ...prev, brand: e.target.value }))}
                          disabled={previewMode}
                          className="w-full"
                        />
                      </div>
                      <div className="flex-1 space-y-2">
                        <Label htmlFor="np-warranty">Warranty</Label>
                        <Input
                          id="np-warranty"
                          value={newProduct.warranty}
                          onChange={(e) => setNewProduct((prev) => ({ ...prev, warranty: e.target.value }))}
                          disabled={previewMode}
                          className="w-full"
                        />
                      </div>
                    </div>
                    <div className="mb-4 space-y-2">
                      <Label htmlFor="np-desc">Description</Label>
                      <Textarea
                        id="np-desc"
                        value={newProduct.description}
                        onChange={(e) => setNewProduct((prev) => ({ ...prev, description: e.target.value }))}
                        disabled={previewMode}
                        rows={2}
                        className="w-full"
                      />
                    </div>
                    <Button
                      variant="outline"
                      onClick={addProduct}
                      disabled={previewMode || !newProduct.name.trim()}
                      leftIcon={<Plus className="h-4 w-4" />}
                    >
                      Add Product
                    </Button>
                  </Card>
                </div>
              </div>

              <div className="mt-8 space-y-3">
                <p className="text-sm font-semibold">Associated Products (Optional)</p>
                <div className="max-h-48 space-y-2 overflow-y-auto rounded-md border border-input p-3">
                  {loadingProducts ? (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Loading products...
                    </div>
                  ) : products.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No products available</p>
                  ) : (
                    products.map((product) => (
                      <div key={product.id} className="flex items-center gap-2">
                        <Checkbox
                          id={`assoc-${product.id}`}
                          checked={formData.selected_products.includes(product.id)}
                          onCheckedChange={(c) => {
                            const set = new Set(formData.selected_products)
                            if (c) set.add(product.id)
                            else set.delete(product.id)
                            handleInputChange('selected_products', Array.from(set))
                          }}
                          disabled={previewMode}
                        />
                        <Label htmlFor={`assoc-${product.id}`} className="font-normal">
                          {product.name} - ₹{product.price}
                        </Label>
                      </div>
                    ))
                  )}
                </div>
                {formData.selected_products.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {formData.selected_products.map((id) => {
                      const p = products.find((x) => x.id === id)
                      return (
                        <Badge key={id} variant="secondary">
                          {p?.name || id}
                        </Badge>
                      )
                    })}
                  </div>
                )}
                <p className="mt-2 text-xs text-muted-foreground">
                  Link products that can be used or sold with this service
                </p>
              </div>
            </>
          )}

          {/* Service Areas Tab */}
          {activeTab === 5 && (
            <div>
              <h2 className="mb-6 text-lg font-semibold">Service Areas</h2>

              <div className="flex flex-col gap-6">
                {formData.service_areas.map((area, index) => (
                  <Card key={index} className="bg-muted/40 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold">{area.name}</p>
                        <p className="text-sm text-muted-foreground">
                          Base price multiplier: {area.multiplier}x
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={area.active ? 'default' : 'secondary'}>
                          {area.active ? 'Active' : 'Inactive'}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={() => removeServiceArea(index)}
                          disabled={previewMode}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}

                <Card className="border-2 border-dashed p-4">
                  <p className="mb-4 text-sm font-semibold">Add New Service Area</p>
                  <div className="mb-4 flex flex-col gap-4 md:flex-row md:items-end">
                    <div className="flex-1 space-y-2">
                      <Label htmlFor="sa-name">Area Name</Label>
                      <Input
                        id="sa-name"
                        value={newServiceArea.name}
                        onChange={(e) => setNewServiceArea((prev) => ({ ...prev, name: e.target.value }))}
                        disabled={previewMode}
                        className="w-full"
                      />
                    </div>
                    <div className="flex-1 space-y-2">
                      <Label htmlFor="sa-mult">Price Multiplier</Label>
                      <Input
                        id="sa-mult"
                        type="number"
                        value={newServiceArea.multiplier}
                        onChange={(e) =>
                          setNewServiceArea((prev) => ({
                            ...prev,
                            multiplier: parseFloat(e.target.value) || 1.0,
                          }))
                        }
                        disabled={previewMode}
                        className="w-full"
                      />
                    </div>
                    <div className="flex flex-1 items-center gap-2 pb-2">
                      <Switch
                        checked={newServiceArea.active}
                        onCheckedChange={(v) => setNewServiceArea((prev) => ({ ...prev, active: v }))}
                        disabled={previewMode}
                      />
                      <Label>Active</Label>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    onClick={addServiceArea}
                    disabled={previewMode || !newServiceArea.name.trim()}
                    leftIcon={<Plus className="h-4 w-4" />}
                  >
                    Add Service Area
                  </Button>
                </Card>
              </div>
            </div>
          )}

          {/* Our Process Tab */}
          {activeTab === 6 && (
            <div>
              <div className="mb-6">
                <h2 className="mb-1 flex items-center gap-2 text-lg font-bold">
                  <ListOrdered className="h-6 w-6 text-primary" />
                  Our Process
                </h2>
                <p className="text-sm text-muted-foreground">
                  Define the step-by-step process customers can expect. This builds trust and sets clear expectations.
                </p>
              </div>

              <div className="flex flex-col gap-6">
                {formData.our_process.length > 0 ? (
                  formData.our_process.map((step, index) => (
                    <Card
                      key={index}
                      className="relative overflow-visible border-2 border-primary/30 bg-gradient-to-br from-slate-50 to-slate-200 p-6 shadow-sm"
                    >
                      <div className="absolute -top-4 left-5 flex h-10 w-10 items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-foreground shadow-md">
                        {step.step}
                      </div>

                      <div className="mt-4">
                        <div className="mb-3 flex items-start justify-between gap-2">
                          <h3 className="text-base font-bold text-primary">{step.title}</h3>
                          <div className="flex gap-1">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="h-8 w-8 bg-background"
                                  onClick={() => moveProcessStep(index, 'up')}
                                  disabled={previewMode || index === 0}
                                >
                                  <ArrowUp className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Move up</TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="h-8 w-8 bg-background"
                                  onClick={() => moveProcessStep(index, 'down')}
                                  disabled={previewMode || index === formData.our_process.length - 1}
                                >
                                  <ArrowDown className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Move down</TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="h-8 w-8 bg-background text-destructive hover:text-destructive"
                                  onClick={() => removeProcessStep(index)}
                                  disabled={previewMode}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Remove step</TooltipContent>
                            </Tooltip>
                          </div>
                        </div>
                        <p className="text-sm leading-relaxed text-foreground">{step.description}</p>
                      </div>
                    </Card>
                  ))
                ) : (
                  <div className="rounded-xl border-2 border-dashed border-muted-foreground/30 bg-muted/30 p-10 text-center">
                    <ListOrdered className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                    <p className="mb-1 font-medium text-muted-foreground">No process steps added yet</p>
                    <p className="text-sm text-muted-foreground">
                      Add step-by-step instructions to help customers understand your workflow
                    </p>
                  </div>
                )}

                <Card className="border-2 border-dashed border-primary/40 bg-primary/5 p-6">
                  <p className="mb-4 flex items-center gap-2 text-base font-bold">
                    <Plus className="h-5 w-5 text-primary" />
                    Add New Process Step
                  </p>
                  <div className="grid gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="step-title">Step Title</Label>
                      <Input
                        id="step-title"
                        value={newProcessStep.title}
                        onChange={(e) => setNewProcessStep((prev) => ({ ...prev, title: e.target.value }))}
                        disabled={previewMode}
                        placeholder="e.g., Schedule Appointment"
                        className="bg-background"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="step-desc">Step Description</Label>
                      <Textarea
                        id="step-desc"
                        rows={3}
                        value={newProcessStep.description}
                        onChange={(e) => setNewProcessStep((prev) => ({ ...prev, description: e.target.value }))}
                        disabled={previewMode}
                        placeholder="Describe what happens in this step..."
                        className="bg-background"
                      />
                    </div>
                    <Button
                      onClick={addProcessStep}
                      disabled={
                        previewMode || !newProcessStep.title.trim() || !newProcessStep.description.trim()
                      }
                      leftIcon={<Plus className="h-4 w-4" />}
                      className="w-full sm:w-auto"
                      size="lg"
                    >
                      Add Process Step
                    </Button>
                  </div>
                </Card>
              </div>
            </div>
          )}

          {/* Include & Exclude Tab */}
          {activeTab === 7 && (
            <div>
              <div className="mb-6">
                <h2 className="mb-1 flex items-center gap-2 text-lg font-bold">
                  <CircleCheck className="h-6 w-6 text-emerald-600" />
                  What&apos;s Included & Excluded
                </h2>
                <p className="text-sm text-muted-foreground">
                  Clearly define what is and isn&apos;t included in your service to avoid misunderstandings.
                </p>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <Card className="flex h-full flex-col overflow-hidden border-2 border-emerald-500/40">
                  <div className="flex items-center gap-2 bg-emerald-600 p-4 text-white">
                    <CircleCheck className="h-5 w-5" />
                    <span className="flex-1 text-lg font-bold">What&apos;s Included</span>
                    <Badge variant="secondary" className="bg-white/30 text-white hover:bg-white/40">
                      {formData.whats_included.length}
                    </Badge>
                  </div>
                  <CardContent className="flex flex-1 flex-col p-4">
                    <div className="mb-4 min-h-[200px]">
                      {formData.whats_included.length > 0 ? (
                        <div className="space-y-2">
                          {formData.whats_included.map((item, index) => (
                            <div
                              key={index}
                              className="flex items-center gap-2 rounded-md bg-emerald-50 p-3 dark:bg-emerald-950/30"
                            >
                              <CircleCheck className="h-4 w-4 shrink-0 text-emerald-600" />
                              <p className="flex-1 text-sm">{item}</p>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 shrink-0 text-destructive hover:text-destructive"
                                onClick={() => removeIncluded(index)}
                                disabled={previewMode}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="flex h-[200px] items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/30 bg-muted/30">
                          <p className="text-sm text-muted-foreground">No items added yet</p>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Input
                        placeholder="e.g., All materials and labor"
                        value={newIncluded}
                        onChange={(e) => setNewIncluded(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && addIncluded()}
                        disabled={previewMode}
                        className="flex-1"
                      />
                      <Button
                        className="bg-emerald-600 hover:bg-emerald-700"
                        onClick={addIncluded}
                        disabled={previewMode || !newIncluded.trim()}
                        size="icon"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card className="flex h-full flex-col overflow-hidden border-2 border-red-500/40">
                  <div className="flex items-center gap-2 bg-red-600 p-4 text-white">
                    <CircleX className="h-5 w-5" />
                    <span className="flex-1 text-lg font-bold">What&apos;s Excluded</span>
                    <Badge variant="secondary" className="bg-white/30 text-white hover:bg-white/40">
                      {formData.whats_excluded.length}
                    </Badge>
                  </div>
                  <CardContent className="flex flex-1 flex-col p-4">
                    <div className="mb-4 min-h-[200px]">
                      {formData.whats_excluded.length > 0 ? (
                        <div className="space-y-2">
                          {formData.whats_excluded.map((item, index) => (
                            <div
                              key={index}
                              className="flex items-center gap-2 rounded-md bg-red-50 p-3 dark:bg-red-950/30"
                            >
                              <CircleX className="h-4 w-4 shrink-0 text-red-600" />
                              <p className="flex-1 text-sm">{item}</p>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 shrink-0 text-destructive hover:text-destructive"
                                onClick={() => removeExcluded(index)}
                                disabled={previewMode}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="flex h-[200px] items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/30 bg-muted/30">
                          <p className="text-sm text-muted-foreground">No items added yet</p>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Input
                        placeholder="e.g., Structural repairs"
                        value={newExcluded}
                        onChange={(e) => setNewExcluded(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && addExcluded()}
                        disabled={previewMode}
                        className="flex-1"
                      />
                      <Button
                        variant="destructive"
                        onClick={addExcluded}
                        disabled={previewMode || !newExcluded.trim()}
                        size="icon"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* Notes & Promises Tab */}
          {activeTab === 8 && (
            <div>
              <div className="mb-6">
                <h2 className="mb-1 flex items-center gap-2 text-lg font-bold">
                  <Lightbulb className="h-6 w-6 text-amber-500" />
                  Important Notes & Our Promises
                </h2>
                <p className="text-sm text-muted-foreground">
                  Add important notes and service commitments to build customer confidence.
                </p>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <Card className="flex h-full flex-col overflow-hidden border-2 border-amber-500/40">
                  <div className="flex items-center gap-2 bg-amber-500 p-4 text-white">
                    <Lightbulb className="h-5 w-5" />
                    <span className="flex-1 text-lg font-bold">Please Note</span>
                    <Badge variant="secondary" className="bg-white/30 text-white hover:bg-white/40">
                      {formData.please_note.length}
                    </Badge>
                  </div>
                  <CardContent className="flex flex-1 flex-col p-4">
                    <div className="mb-4 min-h-[250px]">
                      {formData.please_note.length > 0 ? (
                        <div className="space-y-3">
                          {formData.please_note.map((note, index) => (
                            <div
                              key={index}
                              className="flex gap-2 rounded-md border-l-4 border-amber-500 bg-amber-50 p-3 dark:bg-amber-950/20"
                            >
                              <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                              <p className="flex-1 text-sm leading-relaxed">{note}</p>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 shrink-0"
                                onClick={() => removeNote(index)}
                                disabled={previewMode}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="flex h-[250px] flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-muted-foreground/30 bg-muted/30">
                          <Lightbulb className="h-12 w-12 text-muted-foreground" />
                          <p className="text-sm text-muted-foreground">No notes added yet</p>
                          <p className="text-xs text-muted-foreground">
                            Add important information customers should know
                          </p>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Textarea
                        placeholder="e.g., 24-hour advance booking required"
                        value={newNote}
                        onChange={(e) => setNewNote(e.target.value)}
                        disabled={previewMode}
                        rows={2}
                        className="min-w-0 flex-1"
                      />
                      <Button
                        className="min-w-14 bg-amber-500 hover:bg-amber-600"
                        onClick={addNote}
                        disabled={previewMode || !newNote.trim()}
                        size="icon"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card className="flex h-full flex-col overflow-hidden border-2 border-sky-500/40">
                  <div className="flex items-center gap-2 bg-sky-600 p-4 text-white">
                    <ShieldCheck className="h-5 w-5" />
                    <span className="flex-1 text-lg font-bold">Our Promises</span>
                    <Badge variant="secondary" className="bg-white/30 text-white hover:bg-white/40">
                      {formData.our_promises.length}
                    </Badge>
                  </div>
                  <CardContent className="flex flex-1 flex-col p-4">
                    <div className="mb-4 min-h-[250px]">
                      {formData.our_promises.length > 0 ? (
                        <div className="space-y-3">
                          {formData.our_promises.map((promise, index) => (
                            <div
                              key={index}
                              className="flex gap-2 rounded-md border-l-4 border-sky-600 bg-sky-50 p-3 dark:bg-sky-950/20"
                            >
                              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-sky-600" />
                              <p className="flex-1 text-sm font-medium leading-relaxed">{promise}</p>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 shrink-0"
                                onClick={() => removePromise(index)}
                                disabled={previewMode}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="flex h-[250px] flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-muted-foreground/30 bg-muted/30">
                          <ShieldCheck className="h-12 w-12 text-muted-foreground" />
                          <p className="text-sm text-muted-foreground">No promises added yet</p>
                          <p className="text-xs text-muted-foreground">Build trust with service commitments</p>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Textarea
                        placeholder="e.g., 100% Satisfaction Guaranteed"
                        value={newPromise}
                        onChange={(e) => setNewPromise(e.target.value)}
                        disabled={previewMode}
                        rows={2}
                        className="min-w-0 flex-1"
                      />
                      <Button
                        className="min-w-14 bg-sky-600 hover:bg-sky-700"
                        onClick={addPromise}
                        disabled={previewMode || !newPromise.trim()}
                        size="icon"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* FAQs Tab */}
          {activeTab === 9 && (
            <div>
              <div className="mb-6">
                <h2 className="mb-1 flex items-center gap-2 text-lg font-bold">
                  <CircleHelp className="h-6 w-6 text-muted-foreground" />
                  Frequently Asked Questions
                </h2>
                <p className="text-sm text-muted-foreground">
                  Answer common customer questions to reduce support inquiries and build confidence.
                </p>
              </div>

              <div className="flex flex-col gap-6">
                {formData.faqs.length > 0 ? (
                  <Accordion
                    type="multiple"
                    defaultValue={formData.faqs.map((_, i) => String(i))}
                    className="space-y-3"
                  >
                    {formData.faqs.map((faq, index) => (
                      <AccordionItem
                        key={index}
                        value={String(index)}
                        className="rounded-xl border border-border bg-card px-4 shadow-sm"
                      >
                        <div className="flex items-stretch gap-2">
                          <AccordionTrigger className="flex-1 py-3 hover:no-underline [&[data-state=open]>svg]:rotate-180">
                            <div className="flex flex-1 items-center gap-2 text-left">
                              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary text-sm font-bold text-secondary-foreground">
                                Q{index + 1}
                              </span>
                              <span className="font-medium">{faq.question}</span>
                            </div>
                          </AccordionTrigger>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="mt-2 shrink-0 self-start text-destructive hover:text-destructive"
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              removeFaq(index)
                            }}
                            disabled={previewMode}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <AccordionContent className="border-t pb-4 pt-2 text-sm leading-relaxed text-muted-foreground">
                          {faq.answer}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                ) : (
                  <div className="rounded-xl border-2 border-dashed border-muted-foreground/30 bg-muted/30 p-12 text-center">
                    <CircleHelp className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
                    <p className="mb-1 font-medium text-muted-foreground">No FAQs added yet</p>
                    <p className="text-sm text-muted-foreground">
                      Add frequently asked questions to help customers make informed decisions
                    </p>
                  </div>
                )}

                <Card className="border-2 border-dashed border-muted-foreground/40 bg-muted/20 p-6">
                  <p className="mb-4 flex items-center gap-2 text-base font-bold">
                    <Plus className="h-5 w-5" />
                    Add New FAQ
                  </p>
                  <div className="grid gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="faq-q">Question</Label>
                      <Input
                        id="faq-q"
                        value={newFaq.question}
                        onChange={(e) => setNewFaq((prev) => ({ ...prev, question: e.target.value }))}
                        disabled={previewMode}
                        placeholder="e.g., How long does the service take?"
                        className="bg-background"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="faq-a">Answer</Label>
                      <Textarea
                        id="faq-a"
                        rows={4}
                        value={newFaq.answer}
                        onChange={(e) => setNewFaq((prev) => ({ ...prev, answer: e.target.value }))}
                        disabled={previewMode}
                        placeholder="Provide a detailed answer..."
                        className="bg-background"
                      />
                    </div>
                    <Button
                      onClick={addFaq}
                      disabled={previewMode || !newFaq.question.trim() || !newFaq.answer.trim()}
                      leftIcon={<Plus className="h-4 w-4" />}
                      size="lg"
                      className="w-full sm:w-auto"
                      variant="secondary"
                    >
                      Add FAQ
                    </Button>
                  </div>
                </Card>
              </div>
            </div>
          )}
        </div>

        {/* Form Actions */}
        <div className="flex flex-col gap-3 border-t bg-muted/40 p-4 sm:flex-row sm:items-center sm:justify-between">
          <Button variant="outline" leftIcon={<ArrowLeft className="h-4 w-4" />} onClick={() => navigate('/platform-services')}>
            Back to Services
          </Button>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={() => handleSubmit('draft')}
              disabled={primaryActionsDisabled}
            >
              Save as Draft
            </Button>
            <Button
              loading={loading}
              leftIcon={!loading ? <Save className="h-4 w-4" /> : undefined}
              onClick={() => handleSubmit('publish')}
              disabled={primaryActionsDisabled}
            >
              {loading
                ? isEditMode
                  ? 'Updating...'
                  : 'Creating...'
                : isEditMode
                  ? 'Update Service'
                  : 'Publish Service'}
            </Button>
          </div>
        </div>
      </Card>

        </>
      )}
    </div>
  )
}