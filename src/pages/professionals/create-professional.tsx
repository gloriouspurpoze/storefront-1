/**
 * ============================================================================
 * CREATE PROFESSIONAL PAGE
 * ============================================================================
 * Form to create a new professional (worker/technician) with User account
 *
 * Features:
 * - Multi-step form (Personal Info → Professional Details → Location → Review)
 * - Auto-creates User account for login
 * - Email validation
 * - Phone validation
 * - Image upload
 * - Service area selection
 *
 * @author CTO Team
 * @date November 7, 2025
 */

import React, { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  ArrowLeft,
  Save,
  UserPlus,
  Eye,
  EyeOff,
  Loader2,
} from 'lucide-react'
import {
  Badge,
  Button,
  Card,
  CardContent,
  Checkbox,
  Input,
  Label,
  Textarea,
} from '../../components/ui'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select'
import { cn } from '../../lib/utils'
import { ProfessionalsService } from '../../services/api/professionals.service'
import { PROFESSIONAL_TRADE_CATEGORIES as CATEGORIES } from '../../constants/professionalCategories'

const STEPS = ['Personal Info', 'Professional Details', 'Location & Availability', 'Review']

const EXPERTISE_LEVELS = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'expert', label: 'Expert' },
]

const WORKING_DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']

export function CreateProfessional() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const fromApplication = searchParams.get('fromApplication')?.trim() || ''

  const initialForm = useMemo(() => {
    const experienceRaw = searchParams.get('experience')
    const experience = experienceRaw ? Math.max(0, parseInt(experienceRaw, 10) || 2) : 2
    const servicesRaw = searchParams.get('services')?.trim()
    const serviceLabels = servicesRaw ? servicesRaw.split(',').map((s) => s.trim()).filter(Boolean) : []
    const categoryValues = serviceLabels
      .map((label) => {
        const match = CATEGORIES.find(
          (c) => c.label.toLowerCase() === label.toLowerCase() || c.value.replace(/_/g, ' ') === label.toLowerCase(),
        )
        return match?.value
      })
      .filter((v): v is string => Boolean(v))

    return {
      firstName: searchParams.get('firstName')?.trim() || '',
      lastName: searchParams.get('lastName')?.trim() || '',
      email: searchParams.get('email')?.trim() || '',
      phoneNumber: searchParams.get('phone')?.replace(/\D/g, '').slice(-10) || '',
      city: searchParams.get('city')?.trim() || '',
      experience,
      categories: categoryValues,
    }
  }, [searchParams])

  const [activeStep, setActiveStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)

  const [formData, setFormData] = useState({
    firstName: initialForm.firstName,
    lastName: initialForm.lastName,
    email: initialForm.email,
    phoneNumber: initialForm.phoneNumber,
    alternatePhone: '',
    dateOfBirth: '',
    gender: 'male' as 'male' | 'female' | 'other',
    password: 'SecurePass123!',
    categories: initialForm.categories as string[],
    skills: [] as string[],
    experience: initialForm.experience,
    expertiseLevel: 'intermediate' as 'beginner' | 'intermediate' | 'expert',
    bio: 'Experienced professional. Quality service guaranteed. Available for bookings.',
    isIndependent: true,
    address: {
      street: 'To be updated',
      area: initialForm.city || '',
      city: initialForm.city || 'Mumbai',
      state: 'Maharashtra',
      pincode: '',
    },
    workingDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'] as string[],
    workingHours: {
      start: '09:00',
      end: '18:00',
    },
    availability: 'available' as 'available' | 'busy' | 'offline',
    maxBookingsPerDay: 5,
  })

  const [newSkill, setNewSkill] = useState('')

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 0:
        if (!formData.firstName || !formData.lastName || !formData.email || !formData.phoneNumber) {
          setError('Please fill all required fields')
          return false
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
          setError('Invalid email format')
          return false
        }
        if (!/^[6-9]\d{9}$/.test(formData.phoneNumber)) {
          setError('Invalid phone number (must be 10 digits starting with 6-9)')
          return false
        }
        break

      case 1:
        if (formData.categories.length === 0) {
          setError('Please select at least one category')
          return false
        }
        if (formData.experience < 0) {
          setError('Experience must be 0 or more')
          return false
        }
        break

      case 2:
        if (!formData.address.area || !formData.address.city || !formData.address.pincode) {
          setError('Please fill all location fields')
          return false
        }
        if (formData.workingDays.length === 0) {
          setError('Please select at least one working day')
          return false
        }
        break
    }

    setError(null)
    return true
  }

  const handleNext = () => {
    if (validateStep(activeStep)) {
      setActiveStep((prev) => prev + 1)
    }
  }

  const handleBack = () => {
    setActiveStep((prev) => prev - 1)
    setError(null)
  }

  const handleSubmit = async () => {
    if (!validateStep(activeStep - 1)) return

    setLoading(true)
    setError(null)

    try {
      const professionalData = {
        ...formData,
        services: formData.categories,
        primaryService: formData.categories[0],
        serviceAreas: [
          {
            city: formData.address.city,
            areas: [formData.address.area],
          },
        ],
      }

      await ProfessionalsService.createProfessional(professionalData)

      navigate('/professionals', {
        state: {
          message: `Professional ${formData.firstName} ${formData.lastName} created successfully!`,
          severity: 'success',
        },
      })
    } catch (err: any) {
      setError(err.message || 'Failed to create professional')
    } finally {
      setLoading(false)
    }
  }

  const handleAddSkill = () => {
    if (newSkill.trim() && !formData.skills.includes(newSkill.trim())) {
      setFormData({
        ...formData,
        skills: [...formData.skills, newSkill.trim()],
      })
      setNewSkill('')
    }
  }

  const handleRemoveSkill = (skill: string) => {
    setFormData({
      ...formData,
      skills: formData.skills.filter((s) => s !== skill),
    })
  }

  const toggleCategory = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      categories: prev.categories.includes(value)
        ? prev.categories.filter((c) => c !== value)
        : [...prev.categories, value],
    }))
  }

  const renderPersonalInfo = () => (
    <div className="grid gap-6">
      <div className="col-span-full">
        <h2 className="text-lg font-semibold">Personal Information</h2>
        <p className="text-sm text-muted-foreground">Basic information about the professional</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="firstName">First Name *</Label>
          <Input
            id="firstName"
            className="mt-1"
            value={formData.firstName}
            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="lastName">Last Name *</Label>
          <Input
            id="lastName"
            className="mt-1"
            value={formData.lastName}
            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="email">Email *</Label>
          <Input
            id="email"
            type="email"
            className="mt-1"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />
          <p className="mt-1 text-xs text-muted-foreground">Used for login</p>
        </div>
        <div>
          <Label htmlFor="phone">Phone Number *</Label>
          <Input
            id="phone"
            className="mt-1"
            maxLength={10}
            value={formData.phoneNumber}
            onChange={(e) =>
              setFormData({ ...formData, phoneNumber: e.target.value.replace(/\D/g, '') })
            }
          />
          <p className="mt-1 text-xs text-muted-foreground">10 digits without country code</p>
        </div>
        <div>
          <Label htmlFor="altPhone">Alternate Phone</Label>
          <Input
            id="altPhone"
            className="mt-1"
            maxLength={10}
            value={formData.alternatePhone}
            onChange={(e) =>
              setFormData({ ...formData, alternatePhone: e.target.value.replace(/\D/g, '') })
            }
          />
        </div>
        <div>
          <Label htmlFor="dob">Date of Birth</Label>
          <Input
            id="dob"
            type="date"
            className="mt-1"
            value={formData.dateOfBirth}
            onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
          />
        </div>
        <div>
          <Label>Gender</Label>
          <Select
            value={formData.gender}
            onValueChange={(v) =>
              setFormData({ ...formData, gender: v as 'male' | 'female' | 'other' })
            }
          >
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Gender" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="male">Male</SelectItem>
              <SelectItem value="female">Female</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="password">Default Password *</Label>
          <div className="relative mt-1">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="pr-10"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-0 top-0 h-full px-3"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">Professional will use this to login</p>
        </div>
      </div>
    </div>
  )

  const renderProfessionalDetails = () => (
    <div className="grid gap-6">
      <div className="col-span-full">
        <h2 className="text-lg font-semibold">Professional Details</h2>
        <p className="text-sm text-muted-foreground">Skills, experience, and expertise</p>
      </div>

      <div className="col-span-full space-y-2">
        <Label>Service Categories *</Label>
        <div className="grid max-h-48 gap-2 overflow-y-auto rounded-md border p-3 sm:grid-cols-2">
          {CATEGORIES.map((category) => (
            <label
              key={category.value}
              className="flex cursor-pointer items-center gap-2 text-sm"
            >
              <Checkbox
                checked={formData.categories.includes(category.value)}
                onCheckedChange={() => toggleCategory(category.value)}
              />
              {category.label}
            </label>
          ))}
        </div>
        {formData.categories.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {formData.categories.map((value) => (
              <Badge key={value} variant="secondary" className="text-xs font-normal">
                {CATEGORIES.find((c) => c.value === value)?.label || value}
              </Badge>
            ))}
          </div>
        )}
      </div>

      <div className="col-span-full">
        <Label className="text-sm font-medium">Skills</Label>
        <div className="mt-2 flex flex-col gap-2 sm:flex-row">
          <Input
            placeholder="Add a skill (e.g., Wiring, Plumbing)"
            value={newSkill}
            onChange={(e) => setNewSkill(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSkill())}
            className="sm:flex-1"
          />
          <Button type="button" variant="outline" onClick={handleAddSkill}>
            Add
          </Button>
        </div>
        <div className="mt-2 flex flex-wrap gap-1">
          {formData.skills.map((skill) => (
            <Badge
              key={skill}
              variant="outline"
              className="cursor-pointer gap-1 font-normal"
              onClick={() => handleRemoveSkill(skill)}
            >
              {skill} ×
            </Badge>
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="exp">Years of Experience *</Label>
          <Input
            id="exp"
            type="number"
            min={0}
            max={50}
            className="mt-1"
            value={formData.experience}
            onChange={(e) =>
              setFormData({ ...formData, experience: parseInt(e.target.value, 10) || 0 })
            }
          />
        </div>
        <div>
          <Label>Expertise Level *</Label>
          <Select
            value={formData.expertiseLevel}
            onValueChange={(v) =>
              setFormData({
                ...formData,
                expertiseLevel: v as 'beginner' | 'intermediate' | 'expert',
              })
            }
          >
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {EXPERTISE_LEVELS.map((level) => (
                <SelectItem key={level.value} value={level.value}>
                  {level.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="col-span-full">
        <Label htmlFor="bio">Bio / Description</Label>
        <Textarea
          id="bio"
          rows={3}
          className="mt-1"
          value={formData.bio}
          onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
        />
        <p className="mt-1 text-xs text-muted-foreground">Brief description about the professional</p>
      </div>

      <label className="flex cursor-pointer items-center gap-2">
        <Checkbox
          checked={formData.isIndependent}
          onCheckedChange={(c) =>
            setFormData({ ...formData, isIndependent: c === true })
          }
        />
        <span className="text-sm">Independent Professional (not part of any company)</span>
      </label>
    </div>
  )

  const renderLocationAvailability = () => (
    <div className="grid gap-6">
      <div className="col-span-full">
        <h2 className="text-lg font-semibold">Location & Availability</h2>
        <p className="text-sm text-muted-foreground">
          Where the professional works and when they&apos;re available
        </p>
      </div>

      <div className="col-span-full">
        <Label htmlFor="street">Street / Building</Label>
        <Input
          id="street"
          className="mt-1"
          value={formData.address.street}
          onChange={(e) =>
            setFormData({
              ...formData,
              address: { ...formData.address, street: e.target.value },
            })
          }
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="area">Area / Locality *</Label>
          <Input
            id="area"
            className="mt-1"
            value={formData.address.area}
            onChange={(e) =>
              setFormData({
                ...formData,
                address: { ...formData.address, area: e.target.value },
              })
            }
          />
        </div>
        <div>
          <Label htmlFor="city">City *</Label>
          <Input
            id="city"
            className="mt-1"
            value={formData.address.city}
            onChange={(e) =>
              setFormData({
                ...formData,
                address: { ...formData.address, city: e.target.value },
              })
            }
          />
        </div>
        <div>
          <Label htmlFor="state">State *</Label>
          <Input
            id="state"
            className="mt-1"
            value={formData.address.state}
            onChange={(e) =>
              setFormData({
                ...formData,
                address: { ...formData.address, state: e.target.value },
              })
            }
          />
        </div>
        <div>
          <Label htmlFor="pincode">Pincode *</Label>
          <Input
            id="pincode"
            className="mt-1"
            maxLength={6}
            value={formData.address.pincode}
            onChange={(e) =>
              setFormData({
                ...formData,
                address: {
                  ...formData.address,
                  pincode: e.target.value.replace(/\D/g, ''),
                },
              })
            }
          />
        </div>
      </div>

      <div className="col-span-full border-t pt-4">
        <Label className="text-sm font-medium">Working Days</Label>
        <div className="mt-2 flex flex-wrap gap-2">
          {WORKING_DAYS.map((day) => {
            const on = formData.workingDays.includes(day)
            return (
              <Button
                key={day}
                type="button"
                size="sm"
                variant={on ? 'default' : 'outline'}
                onClick={() => {
                  const newDays = on
                    ? formData.workingDays.filter((d) => d !== day)
                    : [...formData.workingDays, day]
                  setFormData({ ...formData, workingDays: newDays })
                }}
              >
                {day.charAt(0).toUpperCase() + day.slice(1)}
              </Button>
            )
          })}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="start">Start Time</Label>
          <Input
            id="start"
            type="time"
            className="mt-1"
            value={formData.workingHours.start}
            onChange={(e) =>
              setFormData({
                ...formData,
                workingHours: { ...formData.workingHours, start: e.target.value },
              })
            }
          />
        </div>
        <div>
          <Label htmlFor="end">End Time</Label>
          <Input
            id="end"
            type="time"
            className="mt-1"
            value={formData.workingHours.end}
            onChange={(e) =>
              setFormData({
                ...formData,
                workingHours: { ...formData.workingHours, end: e.target.value },
              })
            }
          />
        </div>
        <div>
          <Label>Initial Availability</Label>
          <Select
            value={formData.availability}
            onValueChange={(v) =>
              setFormData({
                ...formData,
                availability: v as 'available' | 'busy' | 'offline',
              })
            }
          >
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="available">Available</SelectItem>
              <SelectItem value="busy">Busy</SelectItem>
              <SelectItem value="offline">Offline</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="maxBook">Max Bookings Per Day</Label>
          <Input
            id="maxBook"
            type="number"
            min={1}
            max={20}
            className="mt-1"
            value={formData.maxBookingsPerDay}
            onChange={(e) =>
              setFormData({
                ...formData,
                maxBookingsPerDay: parseInt(e.target.value, 10) || 5,
              })
            }
          />
        </div>
      </div>
    </div>
  )

  const renderReview = () => (
    <div className="grid gap-6">
      <div className="col-span-full">
        <h2 className="text-lg font-semibold">Review Information</h2>
        <p className="text-sm text-muted-foreground">Please review all details before creating</p>
      </div>

      <Card className="border-dashed">
        <CardContent className="space-y-3 pt-6">
          <h3 className="font-semibold">Personal Information</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <p className="text-xs text-muted-foreground">Name</p>
              <p className="text-sm">
                {formData.firstName} {formData.lastName}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Email</p>
              <p className="text-sm">{formData.email}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Phone</p>
              <p className="text-sm">{formData.phoneNumber}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Gender</p>
              <p className="text-sm">
                {formData.gender.charAt(0).toUpperCase() + formData.gender.slice(1)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-dashed">
        <CardContent className="space-y-3 pt-6">
          <h3 className="font-semibold">Professional Details</h3>
          <div>
            <p className="text-xs text-muted-foreground">Categories</p>
            <div className="mt-1 flex flex-wrap gap-1">
              {formData.categories.map((cat) => (
                <Badge key={cat} variant="secondary" className="text-xs font-normal">
                  {CATEGORIES.find((c) => c.value === cat)?.label || cat}
                </Badge>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Skills</p>
            <div className="mt-1 flex flex-wrap gap-1">
              {formData.skills.map((skill) => (
                <Badge key={skill} variant="outline" className="text-xs font-normal">
                  {skill}
                </Badge>
              ))}
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <p className="text-xs text-muted-foreground">Experience</p>
              <p className="text-sm">{formData.experience} years</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Expertise</p>
              <p className="text-sm">
                {formData.expertiseLevel.charAt(0).toUpperCase() +
                  formData.expertiseLevel.slice(1)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-dashed">
        <CardContent className="space-y-3 pt-6">
          <h3 className="font-semibold">Location & Availability</h3>
          <div>
            <p className="text-xs text-muted-foreground">Address</p>
            <p className="text-sm">
              {formData.address.area}, {formData.address.city}, {formData.address.state} -{' '}
              {formData.address.pincode}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Working Days</p>
            <p className="text-sm">
              {formData.workingDays.map((d) => d.charAt(0).toUpperCase() + d.slice(1)).join(', ')}
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <p className="text-xs text-muted-foreground">Working Hours</p>
              <p className="text-sm">
                {formData.workingHours.start} - {formData.workingHours.end}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Availability</p>
              <p className="text-sm">
                {formData.availability.charAt(0).toUpperCase() + formData.availability.slice(1)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div
        role="status"
        className="rounded-lg border border-primary/40 bg-primary/10 px-4 py-3 text-sm"
      >
        <p className="font-medium">Login Credentials</p>
        <p className="mt-1">Email: {formData.email}</p>
        <p>Password: {formData.password}</p>
        <p className="mt-2 text-muted-foreground">
          The professional will be able to login using these credentials.
        </p>
      </div>
    </div>
  )

  const getStepContent = (step: number) => {
    switch (step) {
      case 0:
        return renderPersonalInfo()
      case 1:
        return renderProfessionalDetails()
      case 2:
        return renderLocationAvailability()
      case 3:
        return renderReview()
      default:
        return null
    }
  }

  return (
    <div className="p-1">
      <div className="mb-6 flex items-start gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/professionals')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <div className="flex items-center gap-2">
            <UserPlus className="h-7 w-7 text-muted-foreground" />
            <h1 className="text-3xl font-bold tracking-tight">Create Professional</h1>
          </div>
          <p className="text-sm text-muted-foreground">Add a new professional with login access</p>
          {fromApplication ? (
            <Badge variant="secondary" className="mt-2">
              Prefilled from application {fromApplication}
            </Badge>
          ) : null}
        </div>
      </div>

      {fromApplication ? (
        <div className="mb-4 rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-foreground">
          Onboarding a partner who applied via the website or app. Confirm details, complete location &amp; documents,
          then create their login.
        </div>
      ) : null}

      <Card className="mb-6 border bg-card shadow-sm">
        <CardContent className="py-6">
          <ol className="flex flex-col gap-4 md:flex-row md:flex-wrap md:items-center md:justify-between md:gap-2">
            {STEPS.map((label, i) => (
              <li key={label} className="flex items-center gap-2 md:flex-1 md:min-w-0">
                <div
                  className={cn(
                    'flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 text-sm font-semibold',
                    activeStep > i && 'border-primary bg-primary text-primary-foreground',
                    activeStep === i && 'border-primary text-primary',
                    activeStep < i && 'border-muted text-muted-foreground'
                  )}
                >
                  {i + 1}
                </div>
                <span
                  className={cn(
                    'truncate text-sm',
                    activeStep === i && 'font-semibold text-foreground',
                    activeStep !== i && 'text-muted-foreground'
                  )}
                >
                  {label}
                </span>
                {i < STEPS.length - 1 && (
                  <div className="mx-2 hidden h-0.5 flex-1 min-w-[1rem] bg-muted md:block" />
                )}
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>

      <Card className="border shadow-sm">
        <CardContent className="p-6 pt-6">
          {error && (
            <div
              role="alert"
              className="mb-6 rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive"
            >
              {error}
            </div>
          )}

          {getStepContent(activeStep)}

          <div className="mt-8 flex flex-wrap justify-between gap-4">
            <Button variant="outline" disabled={activeStep === 0 || loading} onClick={handleBack}>
              Back
            </Button>
            {activeStep === STEPS.length - 1 ? (
              <Button onClick={handleSubmit} disabled={loading}>
                {loading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                {loading ? 'Creating...' : 'Create Professional'}
              </Button>
            ) : (
              <Button onClick={handleNext}>Next</Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
