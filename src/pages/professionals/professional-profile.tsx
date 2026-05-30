/**
 * ============================================================================
 * PROFESSIONAL PROFILE PAGE
 * ============================================================================
 * Complete profile management for professionals (workers/technicians)
 *
 * Features:
 * - View and edit personal information
 * - Manage professional details (services, skills, certifications)
 * - Update location and service areas
 * - Manage availability and working hours
 * - View performance metrics
 * - Upload documents and certifications
 * - Manage emergency contact
 *
 * @author CTO Team
 * @date January 23, 2026
 */

import React, { useState, useEffect } from 'react'
import {
  Loader2,
  Pencil,
  Save,
  X,
  Camera,
  BadgeCheck,
  MapPin,
  Briefcase,
  Clock,
  Star,
  FileText,
  Phone,
  Mail,
  User,
} from 'lucide-react'
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '../../components/ui/avatar'
import {
  Badge,
  Button,
  Card,
  CardContent,
  Input,
  Label,
  Separator,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Textarea,
} from '../../components/ui'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select'
import { useAppSelector, useAppDispatch } from '../../store/hooks'
import { ProfessionalsService } from '../../services/api/professionals.service'
import { Professional } from '../../types/professional.types'
import { addToast } from '../../store/slices/uiSlice'
import { getInitials } from '../../lib/utils'
import {
  extractProfessionalFromGetResponse,
  normalizeProfessionalFromApi,
} from '../../lib/professionalAdmin'

export function ProfessionalProfile() {
  const { user } = useAppSelector((state) => state.auth)
  const dispatch = useAppDispatch()
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [professional, setProfessional] = useState<Professional | null>(null)
  const [activeTab, setActiveTab] = useState('personal')

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    alternatePhone: '',
    dateOfBirth: '',
    gender: '' as 'male' | 'female' | 'other' | '',
    bio: '',
    experience: 0,
    expertiseLevel: 'intermediate' as 'beginner' | 'intermediate' | 'expert',
    address: {
      street: '',
      area: '',
      city: '',
      state: '',
      pincode: '',
    },
    workingDays: [] as string[],
    workingHours: {
      start: '09:00',
      end: '18:00',
    },
    availability: 'available' as 'available' | 'busy' | 'offline',
    maxBookingsPerDay: 5,
    languages: [] as string[],
    emergencyContact: {
      name: '',
      relationship: '',
      phone: '',
    },
  })

  useEffect(() => {
    fetchProfessionalProfile()
  }, [])

  const fetchProfessionalProfile = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await ProfessionalsService.getMyProfile()

      if (response.success && response.data) {
        const raw = extractProfessionalFromGetResponse(response.data)
        if (!raw || typeof raw !== 'object') {
          setError('Professional profile not found')
          return
        }
        const prof = normalizeProfessionalFromApi(raw)
        if (prof && prof._id) {
          setProfessional(prof)

          setFormData({
            firstName: prof.firstName || '',
            lastName: prof.lastName || '',
            email: prof.email || user?.email || '',
            phoneNumber: prof.phoneNumber || '',
            alternatePhone: prof.alternatePhone || '',
            dateOfBirth: prof.dateOfBirth || '',
            gender: prof.gender || '',
            bio: prof.bio || '',
            experience: prof.experience || 0,
            expertiseLevel: prof.expertiseLevel || 'intermediate',
            address: {
              street: prof.address?.street ?? '',
              area: prof.address?.area ?? '',
              city: prof.address?.city ?? '',
              state: prof.address?.state ?? '',
              pincode: prof.address?.pincode ?? '',
            },
            workingDays: prof.workingDays || [],
            workingHours: prof.workingHours || { start: '09:00', end: '18:00' },
            availability: prof.availability || 'available',
            maxBookingsPerDay: prof.maxBookingsPerDay || 5,
            languages: prof.languages || [],
            emergencyContact: prof.emergencyContact || {
              name: '',
              relationship: '',
              phone: '',
            },
          })
        } else {
          setError('Professional profile not found')
        }
      } else {
        setError('Professional profile not found')
      }
    } catch (err: any) {
      console.error('Error fetching profile:', err)
      setError(err?.message || 'Failed to load profile')
      dispatch(
        addToast({
          message: err?.message || 'Failed to load profile',
          severity: 'error',
        })
      )
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({
      ...prev,
      [field]: e.target.value,
    }))
  }

  const handleNestedInputChange =
    (parent: string, field: string) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setFormData((prev) => ({
        ...prev,
        [parent]: {
          ...(prev[parent as keyof typeof prev] as any),
          [field]: e.target.value,
        },
      }))
    }

  const handleSave = async () => {
    if (!professional?._id) {
      setError('Professional ID not found')
      return
    }

    try {
      setSaving(true)
      setError(null)

      await ProfessionalsService.updateMyProfile({
        firstName: formData.firstName,
        lastName: formData.lastName,
        phoneNumber: formData.phoneNumber,
        alternatePhone: formData.alternatePhone,
        dateOfBirth: formData.dateOfBirth,
        gender: formData.gender || undefined,
        bio: formData.bio,
        experience: formData.experience,
        expertiseLevel: formData.expertiseLevel,
        address: formData.address,
        workingDays: formData.workingDays,
        workingHours: formData.workingHours,
        availability: formData.availability,
        maxBookingsPerDay: formData.maxBookingsPerDay,
        languages: formData.languages,
        emergencyContact: formData.emergencyContact,
      })

      setSuccess('Profile updated successfully!')
      setIsEditing(false)
      setTimeout(() => setSuccess(null), 3000)
      dispatch(addToast({ message: 'Profile updated successfully!', severity: 'success' }))

      await fetchProfessionalProfile()
    } catch (err: any) {
      console.error('Error updating profile:', err)
      setError(err?.message || 'Failed to update profile')
      dispatch(
        addToast({
          message: err?.message || 'Failed to update profile',
          severity: 'error',
        })
      )
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    fetchProfessionalProfile()
    setIsEditing(false)
  }

  const toggleWorkingDay = (day: string) => {
    setFormData((prev) => ({
      ...prev,
      workingDays: prev.workingDays.includes(day)
        ? prev.workingDays.filter((d) => d !== day)
        : [...prev.workingDays, day],
    }))
  }

  const WORKING_DAYS = [
    { value: 'monday', label: 'Monday' },
    { value: 'tuesday', label: 'Tuesday' },
    { value: 'wednesday', label: 'Wednesday' },
    { value: 'thursday', label: 'Thursday' },
    { value: 'friday', label: 'Friday' },
    { value: 'saturday', label: 'Saturday' },
    { value: 'sunday', label: 'Sunday' },
  ]

  const availabilityVariant = (a: string): 'success' | 'warning' | 'secondary' => {
    if (a === 'available') return 'success'
    if (a === 'busy') return 'warning'
    return 'secondary'
  }

  if (loading && !professional) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-6">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error && !professional) {
    return (
      <div className="p-6">
        <div
          role="alert"
          className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          {error}
        </div>
        <Button className="mt-4" variant="outline" onClick={fetchProfessionalProfile}>
          Retry
        </Button>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="mb-1 text-3xl font-bold tracking-tight">My Profile</h1>
          <p className="text-muted-foreground">Manage your professional profile and settings</p>
        </div>
        {!isEditing ? (
          <Button onClick={() => setIsEditing(true)} disabled={loading}>
            <Pencil className="mr-2 h-4 w-4" />
            Edit Profile
          </Button>
        ) : (
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={handleCancel} disabled={saving}>
              <X className="mr-2 h-4 w-4" />
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              <Save className="mr-2 h-4 w-4" />
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        )}
      </div>

      {error && (
        <div
          role="alert"
          className="mb-6 flex items-start justify-between gap-2 rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          <span>{error}</span>
          <button type="button" className="shrink-0 underline" onClick={() => setError(null)}>
            Dismiss
          </button>
        </div>
      )}

      {success && (
        <div
          role="status"
          className="mb-6 flex items-start justify-between gap-2 rounded-lg border border-storm-deep/40 bg-storm-deep/10 px-4 py-3 text-sm"
        >
          <span>{success}</span>
          <button type="button" className="shrink-0 underline" onClick={() => setSuccess(null)}>
            Dismiss
          </button>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <Card className="sticky top-5 rounded-lg border shadow-sm">
            <CardContent className="space-y-6 pt-6">
              <div className="text-center">
                <div className="relative mx-auto inline-block">
                  <Avatar className="mx-auto mb-3 h-[120px] w-[120px] text-5xl">
                    {professional?.profileImage && (
                      <AvatarImage src={professional.profileImage} alt="" />
                    )}
                    <AvatarFallback className="bg-primary text-5xl text-primary-foreground">
                      {getInitials(`${formData.firstName} ${formData.lastName}`)}
                    </AvatarFallback>
                  </Avatar>
                  {isEditing && (
                    <Button
                      type="button"
                      size="icon"
                      className="absolute bottom-2 right-0 h-8 w-8 rounded-full"
                      variant="default"
                      aria-label="Upload photo"
                    >
                      <Camera className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                <h2 className="text-lg font-semibold">
                  {formData.firstName} {formData.lastName}
                </h2>
                <p className="text-sm text-muted-foreground">Professional</p>
                <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
                  {professional?.isVerified && (
                    <Badge variant="success" className="gap-1">
                      <BadgeCheck className="h-3 w-3" />
                      Verified
                    </Badge>
                  )}
                  <Badge variant="outline">{formData.expertiseLevel}</Badge>
                </div>
              </div>

              <Separator />

              <div className="space-y-4 text-sm">
                <div>
                  <div className="mb-1 flex justify-between text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Star className="h-3.5 w-3.5 text-bloom-coral" />
                      Rating
                    </span>
                    <span className="font-semibold text-foreground">
                      {professional?.rating?.toFixed(1) || '0.0'} / 5.0
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="h-3.5 w-3.5 shrink-0 text-bloom-coral" />
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-bloom-coral transition-all"
                        style={{ width: `${(professional?.rating || 0) * 20}%` }}
                      />
                    </div>
                  </div>
                </div>
                <div>
                  <p className="text-muted-foreground">Member Since</p>
                  <p className="font-medium">
                    {professional?.createdAt
                      ? new Date(professional.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                        })
                      : 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Jobs Completed</p>
                  <p className="font-medium">{professional?.completedJobs || 0} jobs</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Total Reviews</p>
                  <p className="font-medium">{professional?.totalReviews || 0} reviews</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Availability</p>
                  <Badge variant={availabilityVariant(formData.availability)} className="mt-1">
                    {formData.availability}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-8">
          <Card className="overflow-hidden rounded-lg border shadow-sm">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="h-auto w-full flex-wrap justify-start rounded-none border-b bg-muted/30 p-2">
                <TabsTrigger value="personal" className="gap-2">
                  <User className="h-4 w-4" />
                  Personal Info
                </TabsTrigger>
                <TabsTrigger value="professional" className="gap-2">
                  <Briefcase className="h-4 w-4" />
                  Professional
                </TabsTrigger>
                <TabsTrigger value="location" className="gap-2">
                  <MapPin className="h-4 w-4" />
                  Location
                </TabsTrigger>
                <TabsTrigger value="schedule" className="gap-2">
                  <Clock className="h-4 w-4" />
                  Schedule
                </TabsTrigger>
              </TabsList>

              <TabsContent value="personal" className="mt-0 border-0 p-0">
                <CardContent className="space-y-4 p-6">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <Label htmlFor="firstName">First Name</Label>
                      <Input
                        id="firstName"
                        className="mt-1"
                        value={formData.firstName}
                        onChange={handleInputChange('firstName')}
                        disabled={!isEditing}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        className="mt-1"
                        value={formData.lastName}
                        onChange={handleInputChange('lastName')}
                        disabled={!isEditing}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <div className="relative mt-1">
                        <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          id="email"
                          type="email"
                          className="pl-9"
                          value={formData.email}
                          onChange={handleInputChange('email')}
                          disabled
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="phone">Phone Number</Label>
                      <div className="relative mt-1">
                        <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          id="phone"
                          className="pl-9"
                          value={formData.phoneNumber}
                          onChange={handleInputChange('phoneNumber')}
                          disabled={!isEditing}
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="altPhone">Alternate Phone</Label>
                      <Input
                        id="altPhone"
                        className="mt-1"
                        value={formData.alternatePhone}
                        onChange={handleInputChange('alternatePhone')}
                        disabled={!isEditing}
                      />
                    </div>
                    <div>
                      <Label htmlFor="dob">Date of Birth</Label>
                      <Input
                        id="dob"
                        type="date"
                        className="mt-1"
                        value={formData.dateOfBirth}
                        onChange={handleInputChange('dateOfBirth')}
                        disabled={!isEditing}
                      />
                    </div>
                    <div>
                      <Label>Gender</Label>
                      <Select
                        value={formData.gender ? formData.gender : 'unspecified'}
                        onValueChange={(v) =>
                          setFormData((prev) => ({
                            ...prev,
                            gender:
                              v === 'unspecified' ? '' : (v as 'male' | 'female' | 'other'),
                          }))
                        }
                        disabled={!isEditing}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Gender" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="unspecified">Not specified</SelectItem>
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="female">Female</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea
                      id="bio"
                      rows={4}
                      className="mt-1"
                      value={formData.bio}
                      onChange={handleInputChange('bio')}
                      disabled={!isEditing}
                      placeholder="Tell us about yourself..."
                    />
                  </div>
                </CardContent>
              </TabsContent>

              <TabsContent value="professional" className="mt-0 border-0 p-0">
                <CardContent className="space-y-4 p-6">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <Label htmlFor="exp">Years of Experience</Label>
                      <Input
                        id="exp"
                        type="number"
                        className="mt-1"
                        value={formData.experience}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            experience: parseInt(e.target.value, 10) || 0,
                          }))
                        }
                        disabled={!isEditing}
                        required
                      />
                    </div>
                    <div>
                      <Label>Expertise Level</Label>
                      <Select
                        value={formData.expertiseLevel}
                        onValueChange={(v) =>
                          setFormData((prev) => ({
                            ...prev,
                            expertiseLevel: v as 'beginner' | 'intermediate' | 'expert',
                          }))
                        }
                        disabled={!isEditing}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="beginner">Beginner</SelectItem>
                          <SelectItem value="intermediate">Intermediate</SelectItem>
                          <SelectItem value="expert">Expert</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="maxBook">Max Bookings Per Day</Label>
                      <Input
                        id="maxBook"
                        type="number"
                        className="mt-1"
                        value={formData.maxBookingsPerDay}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            maxBookingsPerDay: parseInt(e.target.value, 10) || 5,
                          }))
                        }
                        disabled={!isEditing}
                      />
                    </div>
                    <div>
                      <Label>Availability Status</Label>
                      <Select
                        value={formData.availability}
                        onValueChange={(v) =>
                          setFormData((prev) => ({
                            ...prev,
                            availability: v as 'available' | 'busy' | 'offline',
                          }))
                        }
                        disabled={!isEditing}
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
                  </div>

                  <div>
                    <p className="mb-2 text-sm font-medium">Services Offered</p>
                    <div className="flex flex-wrap gap-2">
                      {professional?.services?.map((service) => (
                        <Badge key={service._id} variant="default">
                          {service.name}
                        </Badge>
                      ))}
                      {(!professional?.services || professional.services.length === 0) && (
                        <p className="text-sm text-muted-foreground">No services added yet</p>
                      )}
                    </div>
                  </div>
                  <div>
                    <p className="mb-2 text-sm font-medium">Skills</p>
                    <div className="flex flex-wrap gap-2">
                      {professional?.skills?.map((skill) => (
                        <Badge key={skill} variant="outline">
                          {skill}
                        </Badge>
                      ))}
                      {(!professional?.skills || professional.skills.length === 0) && (
                        <p className="text-sm text-muted-foreground">No skills added yet</p>
                      )}
                    </div>
                  </div>
                  <div>
                    <p className="mb-2 text-sm font-medium">Certifications</p>
                    <div className="flex flex-wrap gap-2">
                      {professional?.certifications?.map((cert, index) => (
                        <Badge key={index} variant="success" className="gap-1">
                          <FileText className="h-3 w-3" />
                          {cert.name}
                        </Badge>
                      ))}
                      {(!professional?.certifications ||
                        professional.certifications.length === 0) && (
                        <p className="text-sm text-muted-foreground">No certifications added yet</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </TabsContent>

              <TabsContent value="location" className="mt-0 border-0 p-0">
                <CardContent className="space-y-4 p-6">
                  <div>
                    <Label htmlFor="street">Street Address</Label>
                    <Input
                      id="street"
                      className="mt-1"
                      value={formData.address.street}
                      onChange={handleNestedInputChange('address', 'street')}
                      disabled={!isEditing}
                    />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <Label htmlFor="area">Area</Label>
                      <Input
                        id="area"
                        className="mt-1"
                        value={formData.address.area}
                        onChange={handleNestedInputChange('address', 'area')}
                        disabled={!isEditing}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="city">City</Label>
                      <Input
                        id="city"
                        className="mt-1"
                        value={formData.address.city}
                        onChange={handleNestedInputChange('address', 'city')}
                        disabled={!isEditing}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="state">State</Label>
                      <Input
                        id="state"
                        className="mt-1"
                        value={formData.address.state}
                        onChange={handleNestedInputChange('address', 'state')}
                        disabled={!isEditing}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="pincode">Pincode</Label>
                      <Input
                        id="pincode"
                        className="mt-1"
                        value={formData.address.pincode}
                        onChange={handleNestedInputChange('address', 'pincode')}
                        disabled={!isEditing}
                        required
                      />
                    </div>
                  </div>
                  <Separator />
                  <div>
                    <p className="mb-2 text-sm font-medium">Service Areas</p>
                    <div className="flex flex-wrap gap-2">
                      {professional?.serviceAreas?.map((area, index) => (
                        <Badge key={index} variant="outline" className="gap-1 font-normal">
                          <MapPin className="h-3 w-3" />
                          {`${area.city}${area.areas?.length ? ` (${area.areas.join(', ')})` : ''}`}
                        </Badge>
                      ))}
                      {(!professional?.serviceAreas || professional.serviceAreas.length === 0) && (
                        <p className="text-sm text-muted-foreground">No service areas added yet</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </TabsContent>

              <TabsContent value="schedule" className="mt-0 border-0 p-0">
                <CardContent className="space-y-6 p-6">
                  <div>
                    <p className="mb-3 text-sm font-medium">Working Days</p>
                    <div className="flex flex-wrap gap-2">
                      {WORKING_DAYS.map((day) => {
                        const on = formData.workingDays.includes(day.value)
                        return (
                          <Button
                            key={day.value}
                            type="button"
                            size="sm"
                            variant={on ? 'default' : 'outline'}
                            disabled={!isEditing}
                            onClick={() => isEditing && toggleWorkingDay(day.value)}
                          >
                            {day.label}
                          </Button>
                        )
                      })}
                    </div>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <Label htmlFor="whStart">Start Time</Label>
                      <Input
                        id="whStart"
                        type="time"
                        className="mt-1"
                        value={formData.workingHours.start}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            workingHours: { ...prev.workingHours, start: e.target.value },
                          }))
                        }
                        disabled={!isEditing}
                      />
                    </div>
                    <div>
                      <Label htmlFor="whEnd">End Time</Label>
                      <Input
                        id="whEnd"
                        type="time"
                        className="mt-1"
                        value={formData.workingHours.end}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            workingHours: { ...prev.workingHours, end: e.target.value },
                          }))
                        }
                        disabled={!isEditing}
                      />
                    </div>
                  </div>
                  <Separator />
                  <div>
                    <p className="mb-4 text-sm font-medium">Emergency Contact</p>
                    <div className="grid gap-4 sm:grid-cols-3">
                      <div>
                        <Label htmlFor="ecName">Contact Name</Label>
                        <Input
                          id="ecName"
                          className="mt-1"
                          value={formData.emergencyContact.name}
                          onChange={handleNestedInputChange('emergencyContact', 'name')}
                          disabled={!isEditing}
                        />
                      </div>
                      <div>
                        <Label htmlFor="ecRel">Relationship</Label>
                        <Input
                          id="ecRel"
                          className="mt-1"
                          value={formData.emergencyContact.relationship}
                          onChange={handleNestedInputChange('emergencyContact', 'relationship')}
                          disabled={!isEditing}
                          placeholder="e.g., Spouse, Parent"
                        />
                      </div>
                      <div>
                        <Label htmlFor="ecPhone">Phone Number</Label>
                        <Input
                          id="ecPhone"
                          className="mt-1"
                          value={formData.emergencyContact.phone}
                          onChange={handleNestedInputChange('emergencyContact', 'phone')}
                          disabled={!isEditing}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </TabsContent>
            </Tabs>
          </Card>
        </div>
      </div>

      {isEditing && (
        <div
          role="status"
          className="mt-6 rounded-lg border border-primary/40 bg-primary/10 px-4 py-3 text-sm"
        >
          Make sure all information is accurate. Changes will be reviewed by our team before being
          published.
        </div>
      )}
    </div>
  )
}
