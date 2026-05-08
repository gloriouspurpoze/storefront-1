import React, { useState, useEffect } from 'react'
import {
  Button,
  Card,
  CardContent,
  Input,
  Label,
  Textarea,
  Switch,
  Separator,
  Badge,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui'
import {
  ArrowLeft,
  Save,
  Eye,
  Plus,
  Building2,
  MapPin,
  Briefcase,
  ShieldCheck,
  IndianRupee,
  Clock,
  Star,
  CheckCircle2,
  FileText,
  Mail,
  Phone,
  Contact,
  X,
  Loader2,
} from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import { ProvidersService, type Provider, type UpdateProviderData } from '../../services/api/providers.service'
import { ImageUploadField, DocumentUploadField, type ImageFile, type DocumentFile } from '../../components/forms'
import { appToast } from '../../lib/appToast'
import { cn } from '../../lib/utils'

const VERIFICATION_STATUS = [
  { value: 'pending', label: 'Pending Verification', color: 'warning' as const },
  { value: 'verified', label: 'Verified', color: 'success' as const },
  { value: 'rejected', label: 'Rejected', color: 'error' as const },
]

const WORKING_DAYS = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
]

const TIME_SLOTS = [
  { value: 'morning', label: 'Morning (9:00 AM - 12:00 PM)' },
  { value: 'afternoon', label: 'Afternoon (12:00 PM - 3:00 PM)' },
  { value: 'evening', label: 'Evening (3:00 PM - 6:00 PM)' },
  { value: 'night', label: 'Night (6:00 PM - 9:00 PM)' },
]

const TAB_ITEMS = [
  { id: 0, label: 'Business Information', short: 'Business', icon: Building2 },
  { id: 1, label: 'Services & Areas', short: 'Services', icon: Briefcase },
  { id: 2, label: 'Availability & Pricing', short: 'Availability', icon: Clock },
  { id: 3, label: 'Verification & Documents', short: 'Verification', icon: ShieldCheck },
] as const

function statusBadgeClass(color: 'warning' | 'success' | 'error') {
  if (color === 'warning') return 'border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100'
  if (color === 'success') return 'border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-100'
  return 'border-red-200 bg-red-50 text-red-900 dark:border-red-800 dark:bg-red-950/40 dark:text-red-100'
}

export function EditProvider() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const [pageLoading, setPageLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [provider, setProvider] = useState<Provider | null>(null)
  const [previewMode, setPreviewMode] = useState(false)
  const [activeTab, setActiveTab] = useState(0)

  const [formData, setFormData] = useState({
    business_name: '',
    business_license: '',
    business_email: '',
    business_phone: '',
    business_address: '',
    business_logo: [] as ImageFile[],
    years_experience: 0,
    bio: '',
    contact_first_name: '',
    contact_last_name: '',
    contact_email: '',
    contact_phone: '',
    contact_position: '',
    services_offered: [] as string[],
    service_categories: [] as string[],
    service_areas: [] as string[],
    working_days: [] as string[],
    time_slots: [] as string[],
    emergency_service: false,
    same_day_service: false,
    hourly_rate: '',
    minimum_job_charge: '',
    travel_charge: '',
    payment_methods: [] as string[],
    verification_status: 'pending' as 'pending' | 'verified' | 'rejected',
    insurance_document: [] as DocumentFile[],
    certification_documents: [] as DocumentFile[],
    tax_id: '',
    is_active: true,
    accept_new_requests: true,
    auto_accept_requests: false,
    notification_email: '',
    notification_phone: '',
  })

  const [newService, setNewService] = useState('')
  const [newArea, setNewArea] = useState('')
  const [newPaymentMethod, setNewPaymentMethod] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (!id) return
    let cancelled = false
    const run = async () => {
      try {
        setPageLoading(true)
        const response = await ProvidersService.getProvider(id)
        if (cancelled) return
        const providerData = response.data
        if (providerData) {
          setProvider(providerData)
          setFormData({
            business_name: providerData.business_name || '',
            business_license: providerData.business_license || '',
            business_email: providerData.user?.email || '',
            business_phone: providerData.user?.phone || '',
            business_address: (providerData as { business_address?: string }).business_address || '',
            business_logo: (providerData as { business_logo?: string }).business_logo
              ? [
                  {
                    id: 'existing-business-logo',
                    url: (providerData as { business_logo?: string }).business_logo!,
                    alt: 'Business logo',
                    isPrimary: true,
                    order: 0,
                  },
                ]
              : [],
            years_experience: providerData.years_experience || 0,
            bio: providerData.bio || '',
            contact_first_name: providerData.user?.firstName || '',
            contact_last_name: providerData.user?.lastName || '',
            contact_email: providerData.user?.email || '',
            contact_phone: providerData.user?.phone || '',
            contact_position: (providerData as { contact_position?: string }).contact_position || '',
            services_offered: providerData.services_offered || [],
            service_categories: (providerData as { service_categories?: string[] }).service_categories || [],
            service_areas: providerData.service_areas || [],
            working_days: (providerData as { working_days?: string[] }).working_days || [],
            time_slots: (providerData as { time_slots?: string[] }).time_slots || [],
            emergency_service: (providerData as { emergency_service?: boolean }).emergency_service || false,
            same_day_service: (providerData as { same_day_service?: boolean }).same_day_service || false,
            hourly_rate: String((providerData as { hourly_rate?: string }).hourly_rate ?? ''),
            minimum_job_charge: String((providerData as { minimum_job_charge?: string }).minimum_job_charge ?? ''),
            travel_charge: String((providerData as { travel_charge?: string }).travel_charge ?? ''),
            payment_methods: (providerData as { payment_methods?: string[] }).payment_methods || [],
            verification_status: providerData.verification_status || 'pending',
            insurance_document: (providerData as { insurance_document?: string }).insurance_document
              ? [
                  {
                    id: 'existing-insurance',
                    url: (providerData as { insurance_document?: string }).insurance_document!,
                    name: 'Insurance',
                    size: 0,
                    type: 'application/pdf',
                  },
                ]
              : [],
            certification_documents:
              (providerData as { certification_documents?: string[] }).certification_documents?.map((url: string, i: number) => ({
                id: `existing-cert-${i}`,
                url,
                name: 'Certification',
                size: 0,
                type: 'application/pdf',
              })) || [],
            tax_id: (providerData as { tax_id?: string }).tax_id || '',
            is_active: (providerData as { is_active?: boolean }).is_active !== false,
            accept_new_requests: (providerData as { accept_new_requests?: boolean }).accept_new_requests !== false,
            auto_accept_requests: (providerData as { auto_accept_requests?: boolean }).auto_accept_requests || false,
            notification_email: (providerData as { notification_email?: string }).notification_email || '',
            notification_phone: (providerData as { notification_phone?: string }).notification_phone || '',
          })
        } else {
          setProvider(null)
        }
      } catch (e: unknown) {
        appToast((e as Error)?.message || 'Failed to fetch provider', 'error')
        setTimeout(() => navigate('/providers'), 2000)
      } finally {
        if (!cancelled) setPageLoading(false)
      }
    }
    void run()
    return () => {
      cancelled = true
    }
  }, [id, navigate])

  const handleInputChange = (field: string, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev }
        delete next[field]
        return next
      })
    }
  }

  const handleArrayChange = (field: string, value: string[]) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const addService = () => {
    if (newService.trim() && !formData.services_offered.includes(newService.trim())) {
      setFormData((prev) => ({
        ...prev,
        services_offered: [...prev.services_offered, newService.trim()],
      }))
      setNewService('')
    }
  }

  const removeService = (service: string) => {
    setFormData((prev) => ({
      ...prev,
      services_offered: prev.services_offered.filter((s) => s !== service),
    }))
  }

  const addArea = () => {
    if (newArea.trim() && !formData.service_areas.includes(newArea.trim())) {
      setFormData((prev) => ({
        ...prev,
        service_areas: [...prev.service_areas, newArea.trim()],
      }))
      setNewArea('')
    }
  }

  const removeArea = (area: string) => {
    setFormData((prev) => ({
      ...prev,
      service_areas: prev.service_areas.filter((a) => a !== area),
    }))
  }

  const addPaymentMethod = () => {
    if (newPaymentMethod.trim() && !formData.payment_methods.includes(newPaymentMethod.trim())) {
      setFormData((prev) => ({
        ...prev,
        payment_methods: [...prev.payment_methods, newPaymentMethod.trim()],
      }))
      setNewPaymentMethod('')
    }
  }

  const removePaymentMethod = (method: string) => {
    setFormData((prev) => ({
      ...prev,
      payment_methods: prev.payment_methods.filter((m) => m !== method),
    }))
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}
    if (!formData.business_name.trim()) newErrors.business_name = 'Business name is required'
    if (!formData.business_email.trim()) newErrors.business_email = 'Business email is required'
    if (!formData.business_phone.trim()) newErrors.business_phone = 'Business phone is required'
    if (formData.services_offered.length === 0) newErrors.services_offered = 'At least one service is required'
    if (formData.service_areas.length === 0) newErrors.service_areas = 'At least one service area is required'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const getCompletionPercentage = (): number => {
    const requiredFields = [
      formData.business_name,
      formData.business_email,
      formData.business_phone,
      formData.services_offered.length > 0,
      formData.service_areas.length > 0,
    ]
    const optionalFields = [
      formData.business_license,
      formData.bio,
      formData.working_days.length > 0,
      formData.hourly_rate,
      formData.payment_methods.length > 0,
    ]
    const requiredFilled = requiredFields.filter(Boolean).length
    const optionalFilled = optionalFields.filter(Boolean).length
    const requiredPercentage = (requiredFilled / requiredFields.length) * 0.7
    const optionalPercentage = (optionalFilled / optionalFields.length) * 0.3
    return Math.round((requiredPercentage + optionalPercentage) * 100)
  }

  const handleSave = async () => {
    if (!validateForm()) {
      appToast('Please fill in all required fields', 'error')
      return
    }
    if (!id) return
    try {
      setSaving(true)
      const submitData: UpdateProviderData = {
        business_name: formData.business_name,
        business_license: formData.business_license,
        business_email: formData.business_email,
        business_phone: formData.business_phone,
        business_address: formData.business_address,
        business_logo: formData.business_logo.length > 0 ? formData.business_logo[0].url : undefined,
        years_experience: formData.years_experience,
        bio: formData.bio,
        services_offered: formData.services_offered,
        service_areas: formData.service_areas,
        insurance_document: formData.insurance_document.length > 0 ? formData.insurance_document[0].url : undefined,
        certification_documents: formData.certification_documents.map((doc) => doc.url),
        tax_id: formData.tax_id,
        is_active: formData.is_active,
        working_days: formData.working_days,
        time_slots: formData.time_slots,
        emergency_service: formData.emergency_service,
        same_day_service: formData.same_day_service,
        hourly_rate: formData.hourly_rate,
        minimum_job_charge: formData.minimum_job_charge,
        travel_charge: formData.travel_charge,
        payment_methods: formData.payment_methods,
        accept_new_requests: formData.accept_new_requests,
        auto_accept_requests: formData.auto_accept_requests,
        notification_email: formData.notification_email,
        notification_phone: formData.notification_phone,
      }
      await ProvidersService.updateProvider(id, submitData)
      appToast('Provider updated successfully!', 'success')
      setTimeout(() => navigate('/providers'), 1500)
    } catch (error: unknown) {
      appToast((error as Error)?.message || 'Failed to update provider', 'error')
    } finally {
      setSaving(false)
    }
  }

  const completionPercentage = getCompletionPercentage()
  const steps = ['Business Info', 'Services & Areas', 'Availability', 'Verification']

  if (pageLoading) {
    return (
      <div className="p-4 md:p-6">
        <div className="mb-6 flex items-center gap-3">
          <div className="h-10 w-10 animate-pulse rounded-full bg-muted" />
          <div className="flex-1 space-y-2">
            <div className="h-7 w-48 animate-pulse rounded-md bg-muted" />
            <div className="h-4 w-72 max-w-full animate-pulse rounded-md bg-muted" />
          </div>
        </div>
        <Card className="rounded-xl">
          <CardContent className="py-6">
            <div className="h-[420px] animate-pulse rounded-lg bg-muted" />
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!provider) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center p-6">
        <p className="text-sm font-medium text-destructive">Provider not found</p>
        <Button type="button" variant="outline" className="mt-4" onClick={() => navigate('/providers')}>
          Back to providers
        </Button>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6">
      <div className="mb-6">
        <div className="mb-4 flex items-center gap-3">
          <Button type="button" variant="outline" size="icon" className="shrink-0 rounded-lg" onClick={() => navigate('/providers')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-xl font-semibold tracking-tight md:text-2xl">Edit Provider: {provider.business_name}</h1>
            <p className="text-sm text-muted-foreground">Update provider information and settings</p>
          </div>
        </div>

        <Card className="mb-4 rounded-xl border-primary/20 bg-primary/5">
          <CardContent className="space-y-2 py-4">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">Profile Completion</span>
              <span className="text-lg font-bold text-primary">{completionPercentage}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${Math.min(100, completionPercentage)}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              {completionPercentage < 100 ? 'Complete all required fields to publish' : 'Ready to publish!'}
            </p>
          </CardContent>
        </Card>

        <Card className="mb-4 rounded-xl">
          <CardContent className="py-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              {steps.map((label, index) => (
                <div key={label} className="flex min-w-[72px] flex-1 flex-col items-center">
                  <div
                    className={cn(
                      'flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold',
                      activeTab > index && 'bg-primary text-primary-foreground',
                      activeTab === index && 'ring-2 ring-primary ring-offset-2',
                      activeTab < index && 'bg-muted text-muted-foreground'
                    )}
                  >
                    {activeTab > index ? <CheckCircle2 className="h-4 w-4" /> : index + 1}
                  </div>
                  <span className="mt-1 hidden text-center text-[10px] text-muted-foreground sm:block sm:text-xs">{label}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-wrap justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => setPreviewMode(!previewMode)}>
            <Eye className="mr-2 h-4 w-4" />
            {previewMode ? 'Edit Mode' : 'Preview Mode'}
          </Button>
          <Button type="button" onClick={handleSave} disabled={saving || completionPercentage < 70}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>

      <Card className="overflow-hidden rounded-xl">
        <div className="border-b">
          <div className="-mb-px flex flex-wrap gap-1 overflow-x-auto p-2">
            {TAB_ITEMS.map((tab) => {
              const Icon = tab.icon
              return (
                <Button
                  key={tab.id}
                  type="button"
                  variant={activeTab === tab.id ? 'default' : 'ghost'}
                  size="sm"
                  className="shrink-0 gap-2 rounded-md"
                  onClick={() => setActiveTab(tab.id)}
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                  <span className="sm:hidden">{tab.short}</span>
                </Button>
              )
            })}
          </div>
        </div>

        <div className="p-4 md:p-6">
          {activeTab === 0 && (
            <div className="space-y-6">
              <div className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold">Business Information</h2>
              </div>

              <ImageUploadField
                label="Business Logo"
                value={formData.business_logo}
                onChange={(images) => handleInputChange('business_logo', images)}
                maxFiles={1}
                maxSize={5}
                helperText="Upload your business logo. Recommended size: 400x400px (1:1 ratio). Max file size: 5MB"
                disabled={previewMode}
                folder="providers/logos"
              />

              <Separator />

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="business_name">Business Name *</Label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="business_name"
                      className="pl-9"
                      value={formData.business_name}
                      onChange={(e) => handleInputChange('business_name', e.target.value)}
                      placeholder="e.g., Pro Fix Solutions"
                      disabled={previewMode}
                      aria-invalid={!!errors.business_name}
                    />
                  </div>
                  {errors.business_name && <p className="text-sm text-destructive">{errors.business_name}</p>}
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="business_license">Business License Number</Label>
                    <Input
                      id="business_license"
                      value={formData.business_license}
                      onChange={(e) => handleInputChange('business_license', e.target.value)}
                      placeholder="e.g., BL-2024-12345"
                      disabled={previewMode}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tax_id">Tax ID / GST Number</Label>
                    <Input
                      id="tax_id"
                      value={formData.tax_id}
                      onChange={(e) => handleInputChange('tax_id', e.target.value)}
                      placeholder="e.g., 29ABCDE1234F1Z5"
                      disabled={previewMode}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="business_email">Business Email *</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="business_email"
                        type="email"
                        className="pl-9"
                        value={formData.business_email}
                        onChange={(e) => handleInputChange('business_email', e.target.value)}
                        placeholder="contact@business.com"
                        disabled={previewMode}
                        aria-invalid={!!errors.business_email}
                      />
                    </div>
                    {errors.business_email && <p className="text-sm text-destructive">{errors.business_email}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="business_phone">Business Phone *</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="business_phone"
                        type="tel"
                        className="pl-9"
                        value={formData.business_phone}
                        onChange={(e) => handleInputChange('business_phone', e.target.value)}
                        placeholder="+91 1234567890"
                        disabled={previewMode}
                        aria-invalid={!!errors.business_phone}
                      />
                    </div>
                    {errors.business_phone && <p className="text-sm text-destructive">{errors.business_phone}</p>}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="business_address">Business Address</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Textarea
                      id="business_address"
                      className="min-h-[72px] pl-9 pt-2"
                      value={formData.business_address}
                      onChange={(e) => handleInputChange('business_address', e.target.value)}
                      placeholder="Full business address"
                      disabled={previewMode}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="years_experience">Years of Experience</Label>
                  <div className="relative">
                    <Star className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="years_experience"
                      type="number"
                      className="pl-9"
                      value={formData.years_experience || ''}
                      onChange={(e) => handleInputChange('years_experience', parseInt(e.target.value, 10) || 0)}
                      placeholder="0"
                      disabled={previewMode}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">About Your Business</Label>
                  <div className="relative">
                    <FileText className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Textarea
                      id="bio"
                      className="min-h-[100px] pl-9 pt-2"
                      value={formData.bio}
                      onChange={(e) => handleInputChange('bio', e.target.value)}
                      placeholder="Tell us about your business, expertise, and what makes you unique..."
                      disabled={previewMode}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
                  <Contact className="h-4 w-4 text-primary" />
                  Contact Person (Optional)
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="contact_first_name">First Name</Label>
                    <Input
                      id="contact_first_name"
                      value={formData.contact_first_name}
                      onChange={(e) => handleInputChange('contact_first_name', e.target.value)}
                      disabled={previewMode}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contact_last_name">Last Name</Label>
                    <Input
                      id="contact_last_name"
                      value={formData.contact_last_name}
                      onChange={(e) => handleInputChange('contact_last_name', e.target.value)}
                      disabled={previewMode}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contact_email">Email</Label>
                    <Input
                      id="contact_email"
                      type="email"
                      value={formData.contact_email}
                      onChange={(e) => handleInputChange('contact_email', e.target.value)}
                      disabled={previewMode}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contact_phone">Phone</Label>
                    <Input
                      id="contact_phone"
                      type="tel"
                      value={formData.contact_phone}
                      onChange={(e) => handleInputChange('contact_phone', e.target.value)}
                      disabled={previewMode}
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="contact_position">Position/Title</Label>
                    <Input
                      id="contact_position"
                      value={formData.contact_position}
                      onChange={(e) => handleInputChange('contact_position', e.target.value)}
                      placeholder="e.g., Owner, Manager"
                      disabled={previewMode}
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <Button type="button" onClick={() => setActiveTab(1)}>
                  Next: Services & Areas
                </Button>
              </div>
            </div>
          )}

          {activeTab === 1 && (
            <div className="space-y-8">
              <div className="flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold">Services & Service Areas</h2>
              </div>

              <div>
                <p className="mb-2 text-sm font-semibold">Services Offered *</p>
                <div className="mb-3 rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-sm text-sky-950 dark:border-sky-900 dark:bg-sky-950/30 dark:text-sky-100">
                  Add all the services your business provides. Be specific to help customers find you easily.
                </div>
                <div className="mb-2 flex flex-col gap-2 sm:flex-row">
                  <Input
                    placeholder="e.g., AC Repair, Plumbing, Electrical"
                    value={newService}
                    onChange={(e) => setNewService(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addService())}
                    disabled={previewMode}
                    className={cn(!!errors.services_offered && formData.services_offered.length === 0 && 'border-destructive')}
                  />
                  <Button type="button" className="shrink-0 sm:w-28" onClick={addService} disabled={previewMode || !newService.trim()}>
                    <Plus className="mr-1 h-4 w-4" />
                    Add
                  </Button>
                </div>
                {errors.services_offered && <p className="mb-2 text-sm text-destructive">{errors.services_offered}</p>}
                <div className="flex flex-wrap gap-2">
                  {formData.services_offered.map((service, index) => (
                    <Badge key={`${service}-${index}`} variant="secondary" className="gap-1 pr-1 font-medium">
                      {service}
                      {!previewMode && (
                        <button
                          type="button"
                          className="rounded-sm p-0.5 hover:bg-muted"
                          onClick={() => removeService(service)}
                          aria-label={`Remove ${service}`}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      )}
                    </Badge>
                  ))}
                  {formData.services_offered.length === 0 && (
                    <p className="text-sm text-muted-foreground">No services added yet. Add at least one service.</p>
                  )}
                </div>
              </div>

              <Separator />

              <div>
                <p className="mb-2 text-sm font-semibold">Service Areas *</p>
                <div className="mb-3 rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-sm text-sky-950 dark:border-sky-900 dark:bg-sky-950/30 dark:text-sky-100">
                  Specify the locations or neighborhoods where you provide services.
                </div>
                <div className="mb-2 flex flex-col gap-2 sm:flex-row">
                  <Input
                    placeholder="e.g., Andheri West, Bandra, Juhu"
                    value={newArea}
                    onChange={(e) => setNewArea(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addArea())}
                    disabled={previewMode}
                    className={cn(!!errors.service_areas && formData.service_areas.length === 0 && 'border-destructive')}
                  />
                  <Button type="button" className="shrink-0 sm:w-28" onClick={addArea} disabled={previewMode || !newArea.trim()}>
                    <Plus className="mr-1 h-4 w-4" />
                    Add
                  </Button>
                </div>
                {errors.service_areas && <p className="mb-2 text-sm text-destructive">{errors.service_areas}</p>}
                <div className="flex flex-wrap gap-2">
                  {formData.service_areas.map((area, index) => (
                    <Badge key={`${area}-${index}`} variant="outline" className="gap-1 pr-1 font-medium">
                      <MapPin className="h-3 w-3" />
                      {area}
                      {!previewMode && (
                        <button
                          type="button"
                          className="rounded-sm p-0.5 hover:bg-muted"
                          onClick={() => removeArea(area)}
                          aria-label={`Remove ${area}`}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      )}
                    </Badge>
                  ))}
                  {formData.service_areas.length === 0 && (
                    <p className="text-sm text-muted-foreground">No service areas added yet. Add at least one area.</p>
                  )}
                </div>
              </div>

              <div className="flex justify-between pt-2">
                <Button type="button" variant="outline" onClick={() => setActiveTab(0)}>
                  Back
                </Button>
                <Button type="button" onClick={() => setActiveTab(2)}>
                  Next: Availability
                </Button>
              </div>
            </div>
          )}

          {activeTab === 2 && (
            <div className="space-y-8">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold">Availability & Pricing</h2>
              </div>

              <div>
                <p className="mb-2 text-sm font-semibold">Working Days</p>
                <div className="flex flex-wrap gap-2">
                  {WORKING_DAYS.map((day) => {
                    const on = formData.working_days.includes(day)
                    return (
                      <Button
                        key={day}
                        type="button"
                        size="sm"
                        variant={on ? 'default' : 'outline'}
                        disabled={previewMode}
                        onClick={() => {
                          const newDays = on ? formData.working_days.filter((d) => d !== day) : [...formData.working_days, day]
                          handleArrayChange('working_days', newDays)
                        }}
                      >
                        {day}
                      </Button>
                    )
                  })}
                </div>
              </div>

              <div>
                <p className="mb-2 text-sm font-semibold">Available Time Slots</p>
                <div className="space-y-3">
                  {TIME_SLOTS.map((slot) => (
                    <div key={slot.value} className="flex items-center justify-between gap-4 rounded-md border px-3 py-2">
                      <span className="text-sm">{slot.label}</span>
                      <Switch
                        checked={formData.time_slots.includes(slot.value)}
                        onCheckedChange={(checked) => {
                          const newSlots = checked
                            ? [...formData.time_slots, slot.value]
                            : formData.time_slots.filter((s) => s !== slot.value)
                          handleArrayChange('time_slots', newSlots)
                        }}
                        disabled={previewMode}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              <div>
                <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
                  <IndianRupee className="h-4 w-4 text-primary" />
                  Pricing Information
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="hourly_rate">Hourly Rate (₹)</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₹</span>
                      <Input
                        id="hourly_rate"
                        type="number"
                        className="pl-7"
                        value={formData.hourly_rate}
                        onChange={(e) => handleInputChange('hourly_rate', e.target.value)}
                        placeholder="500"
                        disabled={previewMode}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="minimum_job_charge">Minimum Job Charge (₹)</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₹</span>
                      <Input
                        id="minimum_job_charge"
                        type="number"
                        className="pl-7"
                        value={formData.minimum_job_charge}
                        onChange={(e) => handleInputChange('minimum_job_charge', e.target.value)}
                        placeholder="300"
                        disabled={previewMode}
                      />
                    </div>
                  </div>
                </div>
                <div className="mt-4 space-y-2">
                  <Label htmlFor="travel_charge">Travel Charge (₹)</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₹</span>
                    <Input
                      id="travel_charge"
                      type="number"
                      className="pl-7"
                      value={formData.travel_charge}
                      onChange={(e) => handleInputChange('travel_charge', e.target.value)}
                      placeholder="100"
                      disabled={previewMode}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">Charge for traveling to service locations</p>
                </div>
              </div>

              <div>
                <p className="mb-2 text-sm font-semibold">Accepted Payment Methods</p>
                <div className="mb-2 flex flex-col gap-2 sm:flex-row">
                  <Input
                    placeholder="e.g., Cash, UPI, Card"
                    value={newPaymentMethod}
                    onChange={(e) => setNewPaymentMethod(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addPaymentMethod())}
                    disabled={previewMode}
                  />
                  <Button type="button" variant="outline" className="shrink-0 sm:w-28" onClick={addPaymentMethod} disabled={previewMode || !newPaymentMethod.trim()}>
                    <Plus className="mr-1 h-4 w-4" />
                    Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.payment_methods.map((method, index) => (
                    <Badge key={`${method}-${index}`} variant="outline" className="gap-1 border-emerald-200 bg-emerald-50 pr-1 text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-100">
                      {method}
                      {!previewMode && (
                        <button
                          type="button"
                          className="rounded-sm p-0.5 hover:bg-emerald-100 dark:hover:bg-emerald-900/50"
                          onClick={() => removePaymentMethod(method)}
                          aria-label={`Remove ${method}`}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      )}
                    </Badge>
                  ))}
                </div>
              </div>

              <Separator />

              <div>
                <p className="mb-3 text-sm font-semibold">Service Options</p>
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-4 rounded-md border px-3 py-2">
                    <span className="text-sm">Offer Emergency Services</span>
                    <Switch
                      checked={formData.emergency_service}
                      onCheckedChange={(c) => handleInputChange('emergency_service', c)}
                      disabled={previewMode}
                    />
                  </div>
                  <div className="flex items-center justify-between gap-4 rounded-md border px-3 py-2">
                    <span className="text-sm">Offer Same-Day Service</span>
                    <Switch
                      checked={formData.same_day_service}
                      onCheckedChange={(c) => handleInputChange('same_day_service', c)}
                      disabled={previewMode}
                    />
                  </div>
                  <div className="flex items-center justify-between gap-4 rounded-md border px-3 py-2">
                    <span className="text-sm">Auto-Accept Service Requests</span>
                    <Switch
                      checked={formData.auto_accept_requests}
                      onCheckedChange={(c) => handleInputChange('auto_accept_requests', c)}
                      disabled={previewMode}
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-between pt-2">
                <Button type="button" variant="outline" onClick={() => setActiveTab(1)}>
                  Back
                </Button>
                <Button type="button" onClick={() => setActiveTab(3)}>
                  Next: Verification
                </Button>
              </div>
            </div>
          )}

          {activeTab === 3 && (
            <div className="space-y-8">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold">Verification & Documents</h2>
              </div>

              <div>
                <Label className="mb-2 block text-sm font-semibold">Verification Status</Label>
                <Select
                  value={formData.verification_status}
                  onValueChange={(v) => handleInputChange('verification_status', v as typeof formData.verification_status)}
                  disabled={previewMode}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {VERIFICATION_STATUS.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        <Badge variant="outline" className={cn('font-normal', statusBadgeClass(status.color))}>
                          {status.label}
                        </Badge>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="mt-3 rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-sm text-sky-950 dark:border-sky-900 dark:bg-sky-950/30 dark:text-sky-100">
                  Current status: <strong className="capitalize">{formData.verification_status}</strong>
                </div>
              </div>

              <Separator />

              <div>
                <p className="mb-3 text-sm font-semibold">Documents</p>
                <div className="space-y-4">
                  <DocumentUploadField
                    label="Insurance Document"
                    value={formData.insurance_document}
                    onChange={(documents) => handleInputChange('insurance_document', documents)}
                    maxFiles={1}
                    maxSize={10}
                    helperText="Upload insurance certificate or document (PDF, DOC, or Image). Max file size: 10MB"
                    disabled={previewMode}
                    folder="providers/insurance"
                    required
                  />
                  <DocumentUploadField
                    label="Certification Documents (Optional)"
                    value={formData.certification_documents}
                    onChange={(documents) => handleInputChange('certification_documents', documents)}
                    maxFiles={5}
                    maxSize={10}
                    helperText="Upload certification documents, licenses, or professional credentials. Max 5 files, 10MB each"
                    disabled={previewMode}
                    folder="providers/certifications"
                  />
                </div>
              </div>

              <Separator />

              <div>
                <p className="mb-3 text-sm font-semibold">Provider Settings</p>
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-4 rounded-md border px-3 py-2">
                    <span className="text-sm">Active Provider (Can receive service requests)</span>
                    <Switch
                      checked={formData.is_active}
                      onCheckedChange={(c) => handleInputChange('is_active', c)}
                      disabled={previewMode}
                    />
                  </div>
                  <div className="flex items-center justify-between gap-4 rounded-md border px-3 py-2">
                    <span className="text-sm">Accept New Requests</span>
                    <Switch
                      checked={formData.accept_new_requests}
                      onCheckedChange={(c) => handleInputChange('accept_new_requests', c)}
                      disabled={previewMode}
                    />
                  </div>
                </div>
              </div>

              <Card className="rounded-xl border-emerald-200 bg-emerald-50/80 dark:border-emerald-900 dark:bg-emerald-950/30">
                <CardContent className="pt-6">
                  <p className="mb-3 font-semibold text-emerald-900 dark:text-emerald-100">Profile Summary</p>
                  <ul className="space-y-3 text-sm">
                    <li className="flex gap-2">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                      <div>
                        <p className="font-medium">{formData.business_name || 'Business name not set'}</p>
                        <p className="text-xs text-muted-foreground">Business Name</p>
                      </div>
                    </li>
                    <li className="flex gap-2">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                      <div>
                        <p className="font-medium">{formData.services_offered.length} services</p>
                        <p className="text-xs text-muted-foreground">Services Offered</p>
                      </div>
                    </li>
                    <li className="flex gap-2">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                      <div>
                        <p className="font-medium">{formData.service_areas.length} areas</p>
                        <p className="text-xs text-muted-foreground">Service Areas</p>
                      </div>
                    </li>
                    <li className="flex gap-2">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                      <div>
                        <p className="font-medium">{completionPercentage}% complete</p>
                        <p className="text-xs text-muted-foreground">Profile Completion</p>
                      </div>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between">
                <Button type="button" variant="outline" onClick={() => setActiveTab(2)}>
                  Back
                </Button>
                <div className="flex flex-wrap gap-2">
                  <Button type="button" onClick={handleSave} disabled={saving || completionPercentage < 70}>
                    {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    {saving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}
