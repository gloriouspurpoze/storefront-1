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
  IconButton,
  Alert,
  Snackbar,
  CircularProgress,
  Tabs,
  Tab,
  Avatar,
  LinearProgress,
  InputAdornment,
  Stepper,
  Step,
  StepLabel,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Skeleton,
} from '@mui/material'
import {
  ArrowBack as ArrowBackIcon,
  Save as SaveIcon,
  Preview as PreviewIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Business as BusinessIcon,
  LocationOn as LocationIcon,
  Work as WorkIcon,
  VerifiedUser as VerifiedIcon,
  AttachMoney as MoneyIcon,
  Schedule as ScheduleIcon,
  CheckCircle as CheckIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  ContactPage as ContactIcon,
  Description as DescriptionIcon,
  Star as StarIcon,
  Upload as UploadIcon,
} from '@mui/icons-material'
import { useNavigate, useParams } from 'react-router-dom'
import { ProvidersService, Provider, UpdateProviderData } from '../../services/api/providers.service'
import { ImageUploadField, DocumentUploadField, type ImageFile, type DocumentFile } from '../../components/forms'

const VERIFICATION_STATUS = [
  { value: 'pending', label: 'Pending Verification', color: 'warning' as const },
  { value: 'verified', label: 'Verified', color: 'success' as const },
  { value: 'rejected', label: 'Rejected', color: 'error' as const },
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

export function EditProvider() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [previewMode, setPreviewMode] = useState(false)
  const [activeTab, setActiveTab] = useState(0)
  const [provider, setProvider] = useState<Provider | null>(null)

  // Form state - matching the structure from create-provider
  const [formData, setFormData] = useState<any>({
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

  // Dynamic fields
  const [newService, setNewService] = useState('')
  const [newArea, setNewArea] = useState('')
  const [newPaymentMethod, setNewPaymentMethod] = useState('')

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Snackbar
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error',
  })

  // Fetch provider data
  useEffect(() => {
    if (id) {
      fetchProvider()
    }
  }, [id])

  const fetchProvider = async () => {
    if (!id) return

    try {
      setLoading(true)
      const response = await ProvidersService.getProvider(id)
      
      if (response.data) {
        const providerData = response.data
        setProvider(providerData)

        // Map provider data to form data
        setFormData({
          business_name: providerData.business_name || '',
          business_license: providerData.business_license || '',
          business_email: providerData.user?.email || '',
          business_phone: providerData.user?.phone || '',
          business_address: (providerData as any).business_address || '',
          business_logo: (providerData as any).business_logo 
            ? [{ url: (providerData as any).business_logo, name: 'logo' }] 
            : [],
          years_experience: providerData.years_experience || 0,
          bio: providerData.bio || '',
          contact_first_name: providerData.user?.firstName || '',
          contact_last_name: providerData.user?.lastName || '',
          contact_email: providerData.user?.email || '',
          contact_phone: providerData.user?.phone || '',
          contact_position: (providerData as any).contact_position || '',
          services_offered: providerData.services_offered || [],
          service_categories: (providerData as any).service_categories || [],
          service_areas: providerData.service_areas || [],
          working_days: (providerData as any).working_days || [],
          time_slots: (providerData as any).time_slots || [],
          emergency_service: (providerData as any).emergency_service || false,
          same_day_service: (providerData as any).same_day_service || false,
          hourly_rate: (providerData as any).hourly_rate || '',
          minimum_job_charge: (providerData as any).minimum_job_charge || '',
          travel_charge: (providerData as any).travel_charge || '',
          payment_methods: (providerData as any).payment_methods || [],
          verification_status: providerData.verification_status || 'pending',
          insurance_document: (providerData as any).insurance_document
            ? [{ url: (providerData as any).insurance_document, name: 'insurance' }]
            : [],
          certification_documents: (providerData as any).certification_documents?.map((url: string) => ({
            url,
            name: 'certification'
          })) || [],
          tax_id: (providerData as any).tax_id || '',
          is_active: (providerData as any).is_active !== false,
          accept_new_requests: (providerData as any).accept_new_requests !== false,
          auto_accept_requests: (providerData as any).auto_accept_requests || false,
          notification_email: (providerData as any).notification_email || '',
          notification_phone: (providerData as any).notification_phone || '',
        })
      }
    } catch (error: any) {
      console.error('Error fetching provider:', error)
      showSnackbar(error.message || 'Failed to fetch provider', 'error')
      // Navigate back after error
      setTimeout(() => navigate('/providers'), 2000)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev: any) => ({
      ...prev,
      [field]: value
    }))
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  const handleArrayChange = (field: string, value: string[]) => {
    setFormData((prev: any) => ({
      ...prev,
      [field]: value
    }))
  }

  // Add/Remove functions for array fields
  const addService = () => {
    if (newService.trim() && !formData.services_offered.includes(newService.trim())) {
      setFormData((prev: any) => ({
        ...prev,
        services_offered: [...prev.services_offered, newService.trim()]
      }))
      setNewService('')
    }
  }

  const removeService = (service: string) => {
    setFormData((prev: any) => ({
      ...prev,
      services_offered: prev.services_offered.filter((s: string) => s !== service)
    }))
  }

  const addArea = () => {
    if (newArea.trim() && !formData.service_areas.includes(newArea.trim())) {
      setFormData((prev: any) => ({
        ...prev,
        service_areas: [...prev.service_areas, newArea.trim()]
      }))
      setNewArea('')
    }
  }

  const removeArea = (area: string) => {
    setFormData((prev: any) => ({
      ...prev,
      service_areas: prev.service_areas.filter((a: string) => a !== area)
    }))
  }

  const addPaymentMethod = () => {
    if (newPaymentMethod.trim() && !formData.payment_methods.includes(newPaymentMethod.trim())) {
      setFormData((prev: any) => ({
        ...prev,
        payment_methods: [...prev.payment_methods, newPaymentMethod.trim()]
      }))
      setNewPaymentMethod('')
    }
  }

  const removePaymentMethod = (method: string) => {
    setFormData((prev: any) => ({
      ...prev,
      payment_methods: prev.payment_methods.filter((m: string) => m !== method)
    }))
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    // Business Information
    if (!formData.business_name.trim()) {
      newErrors.business_name = 'Business name is required'
    }
    if (!formData.business_email.trim()) {
      newErrors.business_email = 'Business email is required'
    }
    if (!formData.business_phone.trim()) {
      newErrors.business_phone = 'Business phone is required'
    }

    // Services & Areas
    if (formData.services_offered.length === 0) {
      newErrors.services_offered = 'At least one service is required'
    }
    if (formData.service_areas.length === 0) {
      newErrors.service_areas = 'At least one service area is required'
    }

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

    const requiredWeight = 0.7
    const optionalWeight = 0.3

    const requiredPercentage = (requiredFilled / requiredFields.length) * requiredWeight
    const optionalPercentage = (optionalFilled / optionalFields.length) * optionalWeight

    return Math.round((requiredPercentage + optionalPercentage) * 100)
  }

  const handleSubmit = async () => {
    if (!validateForm()) {
      showSnackbar('Please fill in all required fields', 'error')
      return
    }

    if (!id) return

    try {
      setSaving(true)

      // Map form data to API format
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
        certification_documents: formData.certification_documents.map((doc: DocumentFile) => doc.url),
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
      showSnackbar('Provider updated successfully!', 'success')

      // Navigate back to providers list
      setTimeout(() => {
        navigate('/providers')
      }, 1500)

    } catch (error: any) {
      showSnackbar(error.message || 'Failed to update provider', 'error')
    } finally {
      setSaving(false)
    }
  }

  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbar({ open: true, message, severity })
  }

  const completionPercentage = getCompletionPercentage()
  const steps = ['Business Info', 'Services & Areas', 'Availability', 'Verification']

  if (loading) {
    return (
      <Box sx={{ p: { xs: 2, md: 3 } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
          <Skeleton variant="circular" width={40} height={40} />
          <Box sx={{ flex: 1 }}>
            <Skeleton variant="text" width={200} height={32} />
            <Skeleton variant="text" width={300} height={24} />
          </Box>
        </Box>
        <Card sx={{ borderRadius: 2 }}>
          <CardContent>
            <Skeleton variant="rectangular" height={400} />
          </CardContent>
        </Card>
      </Box>
    )
  }

  if (!provider) {
    return (
      <Box sx={{ p: 3, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <Alert severity="error">Provider not found</Alert>
      </Box>
    )
  }

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <IconButton 
            onClick={() => navigate('/providers')}
            sx={{ 
              bgcolor: 'grey.100',
              '&:hover': { bgcolor: 'grey.200' }
            }}
          >
            <ArrowBackIcon />
          </IconButton>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h5" component="h1" sx={{ fontWeight: 600, mb: 0.5 }}>
              Edit Provider: {provider.business_name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Update provider information and settings
            </Typography>
          </Box>
        </Box>

        {/* Progress Indicator */}
        <Card sx={{ mb: 2, borderRadius: 2, bgcolor: 'primary.50', border: '1px solid', borderColor: 'primary.200' }}>
          <CardContent sx={{ py: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="subtitle2" fontWeight={600}>
                Profile Completion
              </Typography>
              <Typography variant="h6" fontWeight={700} color="primary.main">
                {completionPercentage}%
              </Typography>
            </Box>
            <LinearProgress 
              variant="determinate" 
              value={completionPercentage} 
              sx={{ 
                height: 8, 
                borderRadius: 4,
                bgcolor: 'grey.200',
                '& .MuiLinearProgress-bar': {
                  borderRadius: 4,
                }
              }}
            />
          </CardContent>
        </Card>

        {/* Stepper */}
        <Card sx={{ mb: 2, borderRadius: 2 }}>
          <CardContent sx={{ py: 2 }}>
            <Stepper activeStep={activeTab} alternativeLabel>
              {steps.map((label, index) => (
                <Step key={label} completed={activeTab > index}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
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
            startIcon={saving ? <CircularProgress size={16} /> : <SaveIcon />}
            onClick={handleSubmit}
            disabled={saving || completionPercentage < 70}
            sx={{ textTransform: 'none' }}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </Box>
      </Box>

      {/* Form Tabs - Reusing structure from create-provider */}
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
              icon={<BusinessIcon />}
              label="Business Information"
              iconPosition="start"
              sx={{ minHeight: 64 }}
            />
            <Tab 
              icon={<WorkIcon />} 
              label="Services & Areas"
              iconPosition="start"
              sx={{ minHeight: 64 }}
            />
            <Tab 
              icon={<ScheduleIcon />}
              label="Availability & Pricing"
              iconPosition="start"
              sx={{ minHeight: 64 }}
            />
            <Tab 
              icon={<VerifiedIcon />}
              label="Verification & Documents"
              iconPosition="start"
              sx={{ minHeight: 64 }}
            />
          </Tabs>
        </Box>

        {/* Tab Content - Similar to create-provider */}
        <Box sx={{ p: 3 }}>
          {/* Tab 1: Business Information */}
          {activeTab === 0 && (
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                <BusinessIcon color="primary" />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Business Information
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {/* Business Logo */}
                <Box>
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
                </Box>

                <Divider />

                {/* Basic Details */}
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <TextField
                    fullWidth
                    label="Business Name *"
                    value={formData.business_name}
                    onChange={(e) => handleInputChange('business_name', e.target.value)}
                    error={!!errors.business_name}
                    helperText={errors.business_name}
                    placeholder="e.g., Pro Fix Solutions"
                    disabled={previewMode}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <BusinessIcon color="action" />
                        </InputAdornment>
                      ),
                    }}
                  />

                  <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', md: 'row' } }}>
                    <TextField
                      fullWidth
                      label="Business License Number"
                      value={formData.business_license}
                      onChange={(e) => handleInputChange('business_license', e.target.value)}
                      placeholder="e.g., BL-2024-12345"
                      disabled={previewMode}
                      sx={{ flex: 1 }}
                    />
                    <TextField
                      fullWidth
                      label="Tax ID / GST Number"
                      value={formData.tax_id}
                      onChange={(e) => handleInputChange('tax_id', e.target.value)}
                      placeholder="e.g., 29ABCDE1234F1Z5"
                      disabled={previewMode}
                      sx={{ flex: 1 }}
                    />
                  </Box>

                  <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', md: 'row' } }}>
                    <TextField
                      fullWidth
                      label="Business Email *"
                      type="email"
                      value={formData.business_email}
                      onChange={(e) => handleInputChange('business_email', e.target.value)}
                      error={!!errors.business_email}
                      helperText={errors.business_email}
                      placeholder="contact@business.com"
                      disabled={previewMode}
                      sx={{ flex: 1 }}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <EmailIcon color="action" />
                          </InputAdornment>
                        ),
                      }}
                    />
                    <TextField
                      fullWidth
                      label="Business Phone *"
                      type="tel"
                      value={formData.business_phone}
                      onChange={(e) => handleInputChange('business_phone', e.target.value)}
                      error={!!errors.business_phone}
                      helperText={errors.business_phone}
                      placeholder="+91 1234567890"
                      disabled={previewMode}
                      sx={{ flex: 1 }}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <PhoneIcon color="action" />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Box>

                  <TextField
                    fullWidth
                    label="Business Address"
                    value={formData.business_address}
                    onChange={(e) => handleInputChange('business_address', e.target.value)}
                    placeholder="Full business address"
                    disabled={previewMode}
                    multiline
                    rows={2}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <LocationIcon color="action" />
                        </InputAdornment>
                      ),
                    }}
                  />

                  <TextField
                    fullWidth
                    label="Years of Experience"
                    type="number"
                    value={formData.years_experience}
                    onChange={(e) => handleInputChange('years_experience', parseInt(e.target.value) || 0)}
                    placeholder="0"
                    disabled={previewMode}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <StarIcon color="action" />
                        </InputAdornment>
                      ),
                    }}
                  />

                  <TextField
                    fullWidth
                    label="About Your Business"
                    multiline
                    rows={4}
                    value={formData.bio}
                    onChange={(e) => handleInputChange('bio', e.target.value)}
                    placeholder="Tell us about your business, expertise, and what makes you unique..."
                    disabled={previewMode}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <DescriptionIcon color="action" />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Box>
              </Box>

              {/* Navigation Buttons */}
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
                <Button
                  variant="contained"
                  onClick={() => setActiveTab(1)}
                  sx={{ textTransform: 'none' }}
                >
                  Next: Services & Areas
                </Button>
              </Box>
            </Box>
          )}

          {/* Tab 2: Services & Areas - Similar to create-provider */}
          {activeTab === 1 && (
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                <WorkIcon color="primary" />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Services & Service Areas
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {/* Services Offered */}
                <Box>
                  <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
                    Services Offered *
                  </Typography>
                  <Alert severity="info" sx={{ mb: 2 }}>
                    Add all the services your business provides. Be specific to help customers find you easily.
                  </Alert>
                  <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                    <TextField
                      fullWidth
                      size="small"
                      placeholder="e.g., AC Repair, Plumbing, Electrical"
                      value={newService}
                      onChange={(e) => setNewService(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && addService()}
                      disabled={previewMode}
                      error={!!errors.services_offered && formData.services_offered.length === 0}
                    />
                    <Button
                      variant="contained"
                      onClick={addService}
                      disabled={previewMode || !newService.trim()}
                      startIcon={<AddIcon />}
                      sx={{ minWidth: 100 }}
                    >
                      Add
                    </Button>
                  </Box>
                  {errors.services_offered && (
                    <Typography color="error" variant="caption" sx={{ mb: 1, display: 'block' }}>
                      {errors.services_offered}
                    </Typography>
                  )}
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {formData.services_offered.map((service: string, index: number) => (
                      <Chip
                        key={index}
                        label={service}
                        onDelete={previewMode ? undefined : () => removeService(service)}
                        color="primary"
                        variant="filled"
                        sx={{ fontWeight: 500 }}
                      />
                    ))}
                    {formData.services_offered.length === 0 && (
                      <Typography variant="body2" color="text.secondary">
                        No services added yet. Add at least one service.
                      </Typography>
                    )}
                  </Box>
                </Box>

                <Divider />

                {/* Service Areas */}
                <Box>
                  <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
                    Service Areas *
                  </Typography>
                  <Alert severity="info" sx={{ mb: 2 }}>
                    Specify the locations or neighborhoods where you provide services.
                  </Alert>
                  <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                    <TextField
                      fullWidth
                      size="small"
                      placeholder="e.g., Andheri West, Bandra, Juhu"
                      value={newArea}
                      onChange={(e) => setNewArea(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && addArea()}
                      disabled={previewMode}
                      error={!!errors.service_areas && formData.service_areas.length === 0}
                    />
                    <Button
                      variant="contained"
                      onClick={addArea}
                      disabled={previewMode || !newArea.trim()}
                      startIcon={<AddIcon />}
                      sx={{ minWidth: 100 }}
                    >
                      Add
                    </Button>
                  </Box>
                  {errors.service_areas && (
                    <Typography color="error" variant="caption" sx={{ mb: 1, display: 'block' }}>
                      {errors.service_areas}
                    </Typography>
                  )}
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {formData.service_areas.map((area: string, index: number) => (
                      <Chip
                        key={index}
                        label={area}
                        onDelete={previewMode ? undefined : () => removeArea(area)}
                        color="secondary"
                        variant="filled"
                        icon={<LocationIcon />}
                        sx={{ fontWeight: 500 }}
                      />
                    ))}
                    {formData.service_areas.length === 0 && (
                      <Typography variant="body2" color="text.secondary">
                        No service areas added yet. Add at least one area.
                      </Typography>
                    )}
                  </Box>
                </Box>
              </Box>

              {/* Navigation Buttons */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
                <Button
                  variant="outlined"
                  onClick={() => setActiveTab(0)}
                  sx={{ textTransform: 'none' }}
                >
                  Back
                </Button>
                <Button
                  variant="contained"
                  onClick={() => setActiveTab(2)}
                  sx={{ textTransform: 'none' }}
                >
                  Next: Availability
                </Button>
              </Box>
            </Box>
          )}

          {/* Tab 3: Availability & Pricing - Similar to create-provider */}
          {activeTab === 2 && (
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                <ScheduleIcon color="primary" />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Availability & Pricing
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {/* Working Days */}
                <Box>
                  <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
                    Working Days
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {WORKING_DAYS.map((day) => (
                      <Chip
                        key={day}
                        label={day}
                        onClick={() => {
                          if (previewMode) return
                          const newDays = formData.working_days.includes(day)
                            ? formData.working_days.filter((d: string) => d !== day)
                            : [...formData.working_days, day]
                          handleArrayChange('working_days', newDays)
                        }}
                        color={formData.working_days.includes(day) ? 'primary' : 'default'}
                        variant={formData.working_days.includes(day) ? 'filled' : 'outlined'}
                        clickable={!previewMode}
                        sx={{ fontWeight: 500 }}
                      />
                    ))}
                  </Box>
                </Box>

                {/* Time Slots */}
                <Box>
                  <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
                    Available Time Slots
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {TIME_SLOTS.map((slot) => (
                      <FormControlLabel
                        key={slot.value}
                        control={
                          <Switch
                            checked={formData.time_slots.includes(slot.value)}
                            onChange={(e) => {
                              const newSlots = e.target.checked
                                ? [...formData.time_slots, slot.value]
                                : formData.time_slots.filter((s: string) => s !== slot.value)
                              handleArrayChange('time_slots', newSlots)
                            }}
                            disabled={previewMode}
                          />
                        }
                        label={slot.label}
                      />
                    ))}
                  </Box>
                </Box>

                <Divider />

                {/* Pricing */}
                <Box>
                  <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <MoneyIcon color="primary" />
                    Pricing Information
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', md: 'row' } }}>
                      <TextField
                        fullWidth
                        label="Hourly Rate (₹)"
                        type="number"
                        value={formData.hourly_rate}
                        onChange={(e) => handleInputChange('hourly_rate', e.target.value)}
                        placeholder="500"
                        disabled={previewMode}
                        sx={{ flex: 1 }}
                        InputProps={{
                          startAdornment: <Typography sx={{ mr: 1 }}>₹</Typography>
                        }}
                      />
                      <TextField
                        fullWidth
                        label="Minimum Job Charge (₹)"
                        type="number"
                        value={formData.minimum_job_charge}
                        onChange={(e) => handleInputChange('minimum_job_charge', e.target.value)}
                        placeholder="300"
                        disabled={previewMode}
                        sx={{ flex: 1 }}
                        InputProps={{
                          startAdornment: <Typography sx={{ mr: 1 }}>₹</Typography>
                        }}
                      />
                    </Box>

                    <TextField
                      fullWidth
                      label="Travel Charge (₹)"
                      type="number"
                      value={formData.travel_charge}
                      onChange={(e) => handleInputChange('travel_charge', e.target.value)}
                      placeholder="100"
                      disabled={previewMode}
                      InputProps={{
                        startAdornment: <Typography sx={{ mr: 1 }}>₹</Typography>
                      }}
                      helperText="Charge for traveling to service locations"
                    />
                  </Box>
                </Box>

                {/* Payment Methods */}
                <Box>
                  <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
                    Accepted Payment Methods
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                    <TextField
                      fullWidth
                      size="small"
                      placeholder="e.g., Cash, UPI, Card"
                      value={newPaymentMethod}
                      onChange={(e) => setNewPaymentMethod(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && addPaymentMethod()}
                      disabled={previewMode}
                    />
                    <Button
                      variant="outlined"
                      onClick={addPaymentMethod}
                      disabled={previewMode || !newPaymentMethod.trim()}
                      startIcon={<AddIcon />}
                      sx={{ minWidth: 100 }}
                    >
                      Add
                    </Button>
                  </Box>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {formData.payment_methods.map((method: string, index: number) => (
                      <Chip
                        key={index}
                        label={method}
                        onDelete={previewMode ? undefined : () => removePaymentMethod(method)}
                        color="success"
                        variant="outlined"
                      />
                    ))}
                  </Box>
                </Box>

                <Divider />

                {/* Service Options */}
                <Box>
                  <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
                    Service Options
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={formData.emergency_service}
                          onChange={(e) => handleInputChange('emergency_service', e.target.checked)}
                          disabled={previewMode}
                        />
                      }
                      label="Offer Emergency Services"
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={formData.same_day_service}
                          onChange={(e) => handleInputChange('same_day_service', e.target.checked)}
                          disabled={previewMode}
                        />
                      }
                      label="Offer Same-Day Service"
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={formData.auto_accept_requests}
                          onChange={(e) => handleInputChange('auto_accept_requests', e.target.checked)}
                          disabled={previewMode}
                        />
                      }
                      label="Auto-Accept Service Requests"
                    />
                  </Box>
                </Box>
              </Box>

              {/* Navigation Buttons */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
                <Button
                  variant="outlined"
                  onClick={() => setActiveTab(1)}
                  sx={{ textTransform: 'none' }}
                >
                  Back
                </Button>
                <Button
                  variant="contained"
                  onClick={() => setActiveTab(3)}
                  sx={{ textTransform: 'none' }}
                >
                  Next: Verification
                </Button>
              </Box>
            </Box>
          )}

          {/* Tab 4: Verification & Documents */}
          {activeTab === 3 && (
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                <VerifiedIcon color="primary" />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Verification & Documents
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {/* Verification Status */}
                <Box>
                  <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
                    Verification Status
                  </Typography>
                  <FormControl fullWidth>
                    <Select
                      value={formData.verification_status}
                      onChange={(e) => handleInputChange('verification_status', e.target.value)}
                      disabled={previewMode}
                    >
                      {VERIFICATION_STATUS.map((status) => (
                        <MenuItem key={status.value} value={status.value}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Chip
                              label={status.label}
                              color={status.color}
                              size="small"
                            />
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <Alert severity="info" sx={{ mt: 2 }}>
                    Current status: <strong>{formData.verification_status}</strong>
                  </Alert>
                </Box>

                <Divider />

                {/* Documents */}
                <Box>
                  <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
                    Documents
                  </Typography>
                  
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
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
                  </Box>
                </Box>

                <Divider />

                {/* Settings */}
                <Box>
                  <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
                    Provider Settings
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={formData.is_active}
                          onChange={(e) => handleInputChange('is_active', e.target.checked)}
                          disabled={previewMode}
                          color="success"
                        />
                      }
                      label="Active Provider (Can receive service requests)"
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={formData.accept_new_requests}
                          onChange={(e) => handleInputChange('accept_new_requests', e.target.checked)}
                          disabled={previewMode}
                        />
                      }
                      label="Accept New Requests"
                    />
                  </Box>
                </Box>

                {/* Summary Card */}
                <Card sx={{ bgcolor: 'success.50', border: '1px solid', borderColor: 'success.200' }}>
                  <CardContent>
                    <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 2, color: 'success.dark' }}>
                      📋 Profile Summary
                    </Typography>
                    <List dense>
                      <ListItem>
                        <ListItemIcon>
                          <CheckIcon color="success" fontSize="small" />
                        </ListItemIcon>
                        <ListItemText 
                          primary={formData.business_name || 'Business name not set'} 
                          secondary="Business Name"
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon>
                          <CheckIcon color="success" fontSize="small" />
                        </ListItemIcon>
                        <ListItemText 
                          primary={`${formData.services_offered.length} services`} 
                          secondary="Services Offered"
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon>
                          <CheckIcon color="success" fontSize="small" />
                        </ListItemIcon>
                        <ListItemText 
                          primary={`${formData.service_areas.length} areas`} 
                          secondary="Service Areas"
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon>
                          <CheckIcon color="success" fontSize="small" />
                        </ListItemIcon>
                        <ListItemText 
                          primary={`${completionPercentage}% complete`} 
                          secondary="Profile Completion"
                        />
                      </ListItem>
                    </List>
                  </CardContent>
                </Card>
              </Box>

              {/* Navigation Buttons */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
                <Button
                  variant="outlined"
                  onClick={() => setActiveTab(2)}
                  sx={{ textTransform: 'none' }}
                >
                  Back
                </Button>
                <Button
                  variant="contained"
                  startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
                  onClick={handleSubmit}
                  disabled={saving || completionPercentage < 70}
                  sx={{ textTransform: 'none' }}
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              </Box>
            </Box>
          )}
        </Box>
      </Card>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert severity={snackbar.severity} variant="filled">
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  )
}

