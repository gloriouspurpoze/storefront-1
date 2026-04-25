import React, { useState, useEffect } from 'react'
import { Pencil, Save, X, Camera, Loader2 } from 'lucide-react'
import { Card, CardContent } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { Textarea } from '../../components/ui/textarea'
import { Badge } from '../../components/ui/badge'
import { Separator } from '../../components/ui/separator'
import { Avatar, AvatarFallback } from '../../components/ui/avatar'
import { useAppSelector } from '../../store/hooks'
import { ProvidersService } from '../../services/api/providers.service'

export function ProviderProfile() {
  const { user } = useAppSelector((state) => state.auth)
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [providerId, setProviderId] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    businessName: '',
    businessAddress: '',
    yearsExperience: '',
    bio: '',
    services: [] as string[],
    serviceAreas: [] as string[],
    hourlyRate: '',
    emergencyService: true,
    certifications: [] as string[],
  })

  useEffect(() => {
    fetchProviderProfile()
  }, [user?.id])

  const fetchProviderProfile = async () => {
    try {
      setLoading(true)
      setError(null)

      if (!user?.id) {
        setError('User ID not found')
        return
      }

      const profileRes = await ProvidersService.getProviderByUserId(user.id)
      if (!profileRes.success || !profileRes.data) {
        const err =
          typeof profileRes.error === 'string'
            ? profileRes.error
            : (profileRes.error as any)?.message
        throw new Error(err || 'Failed to load provider profile')
      }
      const profile = profileRes.data as any
      setProviderId(profile.id)

      setFormData({
        firstName: profile.user?.firstName || user.firstName || '',
        lastName: profile.user?.lastName || user.lastName || '',
        email: profile.user?.email || user.email || '',
        phone: profile.user?.phone || user.phone || '',
        businessName: profile.business_name || profile.businessName || '',
        businessAddress: profile.business_address || profile.businessAddress || '',
        yearsExperience: (profile.years_experience ?? profile.yearsExperience ?? '').toString(),
        bio: profile.bio || '',
        services: profile.services_offered || profile.servicesOffered || [],
        serviceAreas: profile.service_areas || profile.serviceAreas || [],
        hourlyRate: profile.hourly_rate || profile.hourlyRate || '',
        emergencyService: profile.emergency_service ?? profile.emergencyService ?? true,
        certifications: profile.certification_documents || profile.certificationDocuments || [],
      })
    } catch (err: any) {
      console.error('Error fetching profile:', err)
      setError(err?.message || 'Failed to load profile')
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

  const handleSave = async () => {
    if (!providerId) {
      setError('Provider ID not found')
      return
    }

    try {
      setLoading(true)
      setError(null)

      await ProvidersService.updateProvider(providerId, {
        business_name: formData.businessName,
        business_address: formData.businessAddress,
        years_experience: parseInt(formData.yearsExperience) || 0,
        bio: formData.bio,
        services_offered: formData.services,
        service_areas: formData.serviceAreas,
        hourly_rate: formData.hourlyRate,
        emergency_service: formData.emergencyService,
      })

      setSuccess('Profile updated successfully!')
      setIsEditing(false)
      setTimeout(() => setSuccess(null), 3000)
    } catch (err: any) {
      console.error('Error updating profile:', err)
      setError(err?.message || 'Failed to update profile')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    fetchProviderProfile()
    setIsEditing(false)
  }

  return (
    <div>
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="mb-1 text-2xl font-bold">My Profile</h1>
          <p className="text-muted-foreground">Manage your provider profile and settings</p>
        </div>
        {!isEditing ? (
          <Button onClick={() => setIsEditing(true)} disabled={loading} className="rounded-md">
            <Pencil className="mr-2 h-4 w-4" />
            Edit Profile
          </Button>
        ) : (
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={handleCancel} disabled={loading} className="rounded-md">
              <X className="mr-2 h-4 w-4" />
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={loading} className="rounded-md">
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        )}
      </div>

      {loading && !isEditing && (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {error && (
        <div
          className="mb-4 flex items-start justify-between gap-2 rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive"
          role="alert"
        >
          {error}
          <Button type="button" variant="ghost" size="sm" onClick={() => setError(null)}>
            Dismiss
          </Button>
        </div>
      )}

      {success && (
        <div
          className="mb-4 flex items-start justify-between gap-2 rounded-md border border-emerald-200 bg-emerald-50/80 p-3 text-sm text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-100"
          role="status"
        >
          {success}
          <Button type="button" variant="ghost" size="sm" onClick={() => setSuccess(null)}>
            Dismiss
          </Button>
        </div>
      )}

      {!loading && (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
          <div className="md:col-span-4">
            <Card className="rounded-md">
              <CardContent className="pt-6">
                <div className="mb-6 text-center">
                  <div className="relative inline-block">
                    <Avatar className="mx-auto mb-2 h-[120px] w-[120px] text-5xl">
                      <AvatarFallback className="bg-primary text-4xl text-primary-foreground">
                        {user?.firstName?.charAt(0) || 'P'}
                      </AvatarFallback>
                    </Avatar>
                    {isEditing && (
                      <Button
                        size="icon"
                        className="absolute bottom-2 right-0 h-10 w-10 rounded-full p-0"
                        type="button"
                        aria-label="Change photo"
                      >
                        <Camera className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  <h2 className="text-lg font-semibold">
                    {user?.firstName} {user?.lastName}
                  </h2>
                  <p className="text-sm text-muted-foreground">Service Provider</p>
                  <Badge className="mt-2" variant="success">
                    Verified
                  </Badge>
                </div>
                <Separator className="my-4" />
                <div className="space-y-3 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground">Member Since</p>
                    <p className="font-medium">January 2023</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Total Jobs Completed</p>
                    <p className="font-medium">127 jobs</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Average Rating</p>
                    <p className="font-medium">4.8 / 5.0</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6 md:col-span-8">
            <Card className="rounded-md">
              <CardContent className="pt-6">
                <h2 className="mb-4 text-lg font-semibold">Personal Information</h2>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange('firstName')}
                      disabled={!isEditing}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange('lastName')}
                      disabled={!isEditing}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange('email')}
                      disabled={!isEditing}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={handleInputChange('phone')}
                      disabled={!isEditing}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-md">
              <CardContent className="pt-6">
                <h2 className="mb-4 text-lg font-semibold">Business Information</h2>
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="businessName">Business Name</Label>
                    <Input
                      id="businessName"
                      value={formData.businessName}
                      onChange={handleInputChange('businessName')}
                      disabled={!isEditing}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="businessAddress">Business Address</Label>
                    <Input
                      id="businessAddress"
                      value={formData.businessAddress}
                      onChange={handleInputChange('businessAddress')}
                      disabled={!isEditing}
                    />
                  </div>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="yearsExperience">Years of Experience</Label>
                      <Input
                        id="yearsExperience"
                        type="number"
                        value={formData.yearsExperience}
                        onChange={handleInputChange('yearsExperience')}
                        disabled={!isEditing}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="hourlyRate">Hourly Rate ($)</Label>
                      <Input
                        id="hourlyRate"
                        type="number"
                        value={formData.hourlyRate}
                        onChange={handleInputChange('hourlyRate')}
                        disabled={!isEditing}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea
                      id="bio"
                      rows={4}
                      value={formData.bio}
                      onChange={handleInputChange('bio')}
                      disabled={!isEditing}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-md">
              <CardContent className="pt-6">
                <h2 className="mb-4 text-lg font-semibold">Services & Coverage</h2>
                <div className="space-y-4">
                  <div>
                    <p className="mb-2 text-sm font-medium">Services Offered</p>
                    <div className="flex flex-wrap gap-1">
                      {formData.services.map((service) => (
                        <Badge key={service} variant="default">
                          {service}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="mb-2 text-sm font-medium">Service Areas</p>
                    <div className="flex flex-wrap gap-1">
                      {formData.serviceAreas.map((area) => (
                        <Badge key={area} variant="outline">
                          {area}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="mb-2 text-sm font-medium">Certifications</p>
                    <div className="flex flex-wrap gap-1">
                      {formData.certifications.map((cert) => (
                        <Badge key={cert} variant="success" className="text-xs">
                          {cert}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {isEditing && (
              <div className="rounded-md border border-sky-200 bg-sky-50/80 p-3 text-sm dark:border-sky-900 dark:bg-sky-950/40">
                Make sure all information is accurate. Changes will be reviewed by our team before being published.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
