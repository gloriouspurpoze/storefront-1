import React, { useState, useEffect } from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Avatar,
  TextField,
  Stack,
  Chip,
  Divider,
  Alert,
  CircularProgress,
} from '@mui/material'
import Grid from '@mui/material/GridLegacy'
import {
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Camera as CameraIcon,
} from '@mui/icons-material'
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
      
      // Get provider profile by user ID
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

  const handleInputChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
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
    fetchProviderProfile() // Reset to original data
    setIsEditing(false)
  }

  return (
    <Box>
      {/* Page Header */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
              My Profile
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Manage your provider profile and settings
            </Typography>
          </Box>
          {!isEditing ? (
            <Button
              variant="contained"
              startIcon={<EditIcon />}
              onClick={() => setIsEditing(true)}
              sx={{ borderRadius: 2 }}
              disabled={loading}
            >
              Edit Profile
            </Button>
          ) : (
            <Stack direction="row" spacing={2}>
              <Button
                variant="outlined"
                startIcon={<CancelIcon />}
                onClick={handleCancel}
                sx={{ borderRadius: 2 }}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={handleSave}
                sx={{ borderRadius: 2 }}
                disabled={loading}
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </Button>
            </Stack>
          )}
        </Box>
      </Box>

      {/* Loading State */}
      {loading && !isEditing && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      )}

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Success Alert */}
      {success && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      {!loading && (

      <Grid container spacing={3}>
        {/* Profile Picture & Basic Info */}
        <Grid item xs={12} md={4}>
          <Card sx={{ borderRadius: 2 }}>
            <CardContent>
              <Box sx={{ textAlign: 'center', mb: 3 }}>
                <Box sx={{ position: 'relative', display: 'inline-block' }}>
                  <Avatar
                    sx={{
                      width: 120,
                      height: 120,
                      bgcolor: 'primary.main',
                      fontSize: 48,
                      mb: 2,
                    }}
                  >
                    {user?.firstName?.charAt(0) || 'P'}
                  </Avatar>
                  {isEditing && (
                    <Button
                      size="small"
                      variant="contained"
                      sx={{
                        position: 'absolute',
                        bottom: 16,
                        right: 0,
                        minWidth: 40,
                        width: 40,
                        height: 40,
                        borderRadius: '50%',
                        p: 0,
                      }}
                    >
                      <CameraIcon />
                    </Button>
                  )}
                </Box>

                <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                  {user?.firstName} {user?.lastName}
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Service Provider
                </Typography>
                <Chip label="Verified" color="success" size="small" sx={{ mt: 1 }} />
              </Box>

              <Divider sx={{ my: 2 }} />

              <Stack spacing={2}>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Member Since
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    January 2023
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Total Jobs Completed
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    127 jobs
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Average Rating
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    4.8 / 5.0
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Profile Form */}
        <Grid item xs={12} md={8}>
          <Stack spacing={3}>
            {/* Personal Information */}
            <Card sx={{ borderRadius: 2 }}>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                  Personal Information
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="First Name"
                      value={formData.firstName}
                      onChange={handleInputChange('firstName')}
                      disabled={!isEditing}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Last Name"
                      value={formData.lastName}
                      onChange={handleInputChange('lastName')}
                      disabled={!isEditing}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange('email')}
                      disabled={!isEditing}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Phone"
                      value={formData.phone}
                      onChange={handleInputChange('phone')}
                      disabled={!isEditing}
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            {/* Business Information */}
            <Card sx={{ borderRadius: 2 }}>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                  Business Information
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Business Name"
                      value={formData.businessName}
                      onChange={handleInputChange('businessName')}
                      disabled={!isEditing}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Business Address"
                      value={formData.businessAddress}
                      onChange={handleInputChange('businessAddress')}
                      disabled={!isEditing}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Years of Experience"
                      type="number"
                      value={formData.yearsExperience}
                      onChange={handleInputChange('yearsExperience')}
                      disabled={!isEditing}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Hourly Rate ($)"
                      type="number"
                      value={formData.hourlyRate}
                      onChange={handleInputChange('hourlyRate')}
                      disabled={!isEditing}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Bio"
                      multiline
                      rows={4}
                      value={formData.bio}
                      onChange={handleInputChange('bio')}
                      disabled={!isEditing}
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            {/* Services & Areas */}
            <Card sx={{ borderRadius: 2 }}>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                  Services & Coverage
                </Typography>
                <Stack spacing={3}>
                  <Box>
                    <Typography variant="subtitle2" gutterBottom>
                      Services Offered
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      {formData.services.map((service) => (
                        <Chip key={service} label={service} color="primary" />
                      ))}
                    </Box>
                  </Box>
                  <Box>
                    <Typography variant="subtitle2" gutterBottom>
                      Service Areas
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      {formData.serviceAreas.map((area) => (
                        <Chip key={area} label={area} variant="outlined" />
                      ))}
                    </Box>
                  </Box>
                  <Box>
                    <Typography variant="subtitle2" gutterBottom>
                      Certifications
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      {formData.certifications.map((cert) => (
                        <Chip key={cert} label={cert} color="success" size="small" />
                      ))}
                    </Box>
                  </Box>
                </Stack>
              </CardContent>
            </Card>

            {isEditing && (
              <Alert severity="info">
                Make sure all information is accurate. Changes will be reviewed by our team before being published.
              </Alert>
            )}
          </Stack>
        </Grid>
      </Grid>
      )}
    </Box>
  )
}

