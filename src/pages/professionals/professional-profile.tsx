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
  Tabs,
  Tab,
  IconButton,
  Tooltip,
  Paper,
  LinearProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
} from '@mui/material'
import Grid from '@mui/material/GridLegacy'
import {
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Camera as CameraIcon,
  VerifiedUser as VerifiedIcon,
  LocationOn as LocationIcon,
  Work as WorkIcon,
  Schedule as ScheduleIcon,
  Star as StarIcon,
  TrendingUp as TrendingUpIcon,
  Description as DocumentIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Person as PersonIcon,
} from '@mui/icons-material'
import { useAppSelector, useAppDispatch } from '../../store/hooks'
import { ProfessionalsService } from '../../services/api/professionals.service'
import { Professional } from '../../types/professional.types'
import { addToast } from '../../store/slices/uiSlice'
import { getInitials } from '../../lib/utils'
import {
  extractProfessionalFromGetResponse,
  normalizeProfessionalFromApi,
} from '../../lib/professionalAdmin'

interface TabPanelProps {
  children?: React.ReactNode
  index: number
  value: number
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`profile-tabpanel-${index}`}
      aria-labelledby={`profile-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  )
}

export function ProfessionalProfile() {
  const { user } = useAppSelector((state) => state.auth)
  const dispatch = useAppDispatch()
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [professional, setProfessional] = useState<Professional | null>(null)
  const [activeTab, setActiveTab] = useState(0)
  
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
      dispatch(addToast({ 
        message: err?.message || 'Failed to load profile', 
        severity: 'error' 
      }))
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [field]: e.target.value,
    }))
  }

  const handleNestedInputChange = (parent: string, field: string) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData(prev => ({
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
      dispatch(addToast({ 
        message: 'Profile updated successfully!', 
        severity: 'success' 
      }))
      
      // Reload profile
      await fetchProfessionalProfile()
      
    } catch (err: any) {
      console.error('Error updating profile:', err)
      setError(err?.message || 'Failed to update profile')
      dispatch(addToast({ 
        message: err?.message || 'Failed to update profile', 
        severity: 'error' 
      }))
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    fetchProfessionalProfile() // Reset to original data
    setIsEditing(false)
  }

  const toggleWorkingDay = (day: string) => {
    setFormData(prev => ({
      ...prev,
      workingDays: prev.workingDays.includes(day)
        ? prev.workingDays.filter(d => d !== day)
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

  if (loading && !professional) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    )
  }

  if (error && !professional) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
        <Button onClick={fetchProfessionalProfile} sx={{ mt: 2 }}>
          Retry
        </Button>
      </Box>
    )
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Page Header */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
              My Profile
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Manage your professional profile and settings
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
                disabled={saving}
              >
                Cancel
              </Button>
              <Button
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={handleSave}
                sx={{ borderRadius: 2 }}
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </Stack>
          )}
        </Box>
      </Box>

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

      <Grid container spacing={3}>
        {/* Profile Picture & Basic Stats */}
        <Grid item xs={12} md={4}>
          <Card sx={{ borderRadius: 2, position: 'sticky', top: 20 }}>
            <CardContent>
              <Box sx={{ textAlign: 'center', mb: 3 }}>
                <Box sx={{ position: 'relative', display: 'inline-block' }}>
                  <Avatar
                    src={professional?.profileImage}
                    sx={{
                      width: 120,
                      height: 120,
                      bgcolor: 'primary.main',
                      fontSize: 48,
                      mb: 2,
                    }}
                  >
                    {professional?.profileImage 
                      ? null 
                      : getInitials(`${formData.firstName} ${formData.lastName}`)}
                  </Avatar>
                  {isEditing && (
                    <IconButton
                      size="small"
                      sx={{
                        position: 'absolute',
                        bottom: 16,
                        right: 0,
                        bgcolor: 'primary.main',
                        color: 'white',
                        '&:hover': { bgcolor: 'primary.dark' },
                      }}
                    >
                      <CameraIcon />
                    </IconButton>
                  )}
                </Box>

                <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                  {formData.firstName} {formData.lastName}
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Professional
                </Typography>
                <Stack direction="row" spacing={1} justifyContent="center" sx={{ mt: 1 }}>
                  {professional?.isVerified && (
                    <Chip 
                      icon={<VerifiedIcon />} 
                      label="Verified" 
                      color="success" 
                      size="small" 
                    />
                  )}
                  <Chip 
                    label={formData.expertiseLevel} 
                    color="primary" 
                    size="small" 
                    variant="outlined"
                  />
                </Stack>
              </Box>

              <Divider sx={{ my: 2 }} />

              {/* Performance Metrics */}
              <Stack spacing={2}>
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="caption" color="text.secondary">
                      Rating
                    </Typography>
                    <Typography variant="caption" sx={{ fontWeight: 600 }}>
                      {professional?.rating?.toFixed(1) || '0.0'} / 5.0
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <StarIcon sx={{ color: 'warning.main', fontSize: 16 }} />
                    <LinearProgress 
                      variant="determinate" 
                      value={(professional?.rating || 0) * 20} 
                      sx={{ flex: 1, height: 6, borderRadius: 3 }}
                    />
                  </Box>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Member Since
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {professional?.createdAt 
                      ? new Date(professional.createdAt).toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'long' 
                        })
                      : 'N/A'}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Jobs Completed
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {professional?.completedJobs || 0} jobs
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Total Reviews
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {professional?.totalReviews || 0} reviews
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Availability
                  </Typography>
                  <Chip 
                    label={formData.availability} 
                    color={
                      formData.availability === 'available' ? 'success' :
                      formData.availability === 'busy' ? 'warning' : 'default'
                    }
                    size="small"
                    sx={{ mt: 0.5 }}
                  />
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Profile Form */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ borderRadius: 2 }}>
            <Tabs 
              value={activeTab} 
              onChange={(e, newValue) => setActiveTab(newValue)}
              sx={{ borderBottom: 1, borderColor: 'divider' }}
            >
              <Tab label="Personal Info" icon={<PersonIcon />} iconPosition="start" />
              <Tab label="Professional" icon={<WorkIcon />} iconPosition="start" />
              <Tab label="Location" icon={<LocationIcon />} iconPosition="start" />
              <Tab label="Schedule" icon={<ScheduleIcon />} iconPosition="start" />
            </Tabs>

            {/* Personal Information Tab */}
            <TabPanel value={activeTab} index={0}>
              <CardContent>
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="First Name"
                      value={formData.firstName}
                      onChange={handleInputChange('firstName')}
                      disabled={!isEditing}
                      required
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Last Name"
                      value={formData.lastName}
                      onChange={handleInputChange('lastName')}
                      disabled={!isEditing}
                      required
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange('email')}
                      disabled={true}
                      InputProps={{
                        startAdornment: <EmailIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Phone Number"
                      value={formData.phoneNumber}
                      onChange={handleInputChange('phoneNumber')}
                      disabled={!isEditing}
                      required
                      InputProps={{
                        startAdornment: <PhoneIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Alternate Phone"
                      value={formData.alternatePhone}
                      onChange={handleInputChange('alternatePhone')}
                      disabled={!isEditing}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Date of Birth"
                      type="date"
                      value={formData.dateOfBirth}
                      onChange={handleInputChange('dateOfBirth')}
                      disabled={!isEditing}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth disabled={!isEditing}>
                      <InputLabel>Gender</InputLabel>
                      <Select
                        value={formData.gender}
                        label="Gender"
                        onChange={(e) => setFormData(prev => ({ ...prev, gender: e.target.value as any }))}
                      >
                        <MenuItem value="male">Male</MenuItem>
                        <MenuItem value="female">Female</MenuItem>
                        <MenuItem value="other">Other</MenuItem>
                      </Select>
                    </FormControl>
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
                      placeholder="Tell us about yourself..."
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </TabPanel>

            {/* Professional Details Tab */}
            <TabPanel value={activeTab} index={1}>
              <CardContent>
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Years of Experience"
                      type="number"
                      value={formData.experience}
                      onChange={(e) => setFormData(prev => ({ ...prev, experience: parseInt(e.target.value) || 0 }))}
                      disabled={!isEditing}
                      required
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth disabled={!isEditing}>
                      <InputLabel>Expertise Level</InputLabel>
                      <Select
                        value={formData.expertiseLevel}
                        label="Expertise Level"
                        onChange={(e) => setFormData(prev => ({ ...prev, expertiseLevel: e.target.value as any }))}
                      >
                        <MenuItem value="beginner">Beginner</MenuItem>
                        <MenuItem value="intermediate">Intermediate</MenuItem>
                        <MenuItem value="expert">Expert</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Max Bookings Per Day"
                      type="number"
                      value={formData.maxBookingsPerDay}
                      onChange={(e) => setFormData(prev => ({ ...prev, maxBookingsPerDay: parseInt(e.target.value) || 5 }))}
                      disabled={!isEditing}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth disabled={!isEditing}>
                      <InputLabel>Availability Status</InputLabel>
                      <Select
                        value={formData.availability}
                        label="Availability Status"
                        onChange={(e) => setFormData(prev => ({ ...prev, availability: e.target.value as any }))}
                      >
                        <MenuItem value="available">Available</MenuItem>
                        <MenuItem value="busy">Busy</MenuItem>
                        <MenuItem value="offline">Offline</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" gutterBottom>
                      Services Offered
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                      {professional?.services?.map((service) => (
                        <Chip 
                          key={service._id} 
                          label={service.name} 
                          color="primary" 
                          size="small"
                        />
                      ))}
                      {(!professional?.services || professional.services.length === 0) && (
                        <Typography variant="body2" color="text.secondary">
                          No services added yet
                        </Typography>
                      )}
                    </Box>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" gutterBottom>
                      Skills
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                      {professional?.skills?.map((skill) => (
                        <Chip 
                          key={skill} 
                          label={skill} 
                          variant="outlined" 
                          size="small"
                        />
                      ))}
                      {(!professional?.skills || professional.skills.length === 0) && (
                        <Typography variant="body2" color="text.secondary">
                          No skills added yet
                        </Typography>
                      )}
                    </Box>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" gutterBottom>
                      Certifications
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                      {professional?.certifications?.map((cert, index) => (
                        <Chip 
                          key={index}
                          icon={<DocumentIcon />}
                          label={cert.name} 
                          color="success" 
                          size="small"
                        />
                      ))}
                      {(!professional?.certifications || professional.certifications.length === 0) && (
                        <Typography variant="body2" color="text.secondary">
                          No certifications added yet
                        </Typography>
                      )}
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </TabPanel>

            {/* Location Tab */}
            <TabPanel value={activeTab} index={2}>
              <CardContent>
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Street Address"
                      value={formData.address.street}
                      onChange={handleNestedInputChange('address', 'street')}
                      disabled={!isEditing}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Area"
                      value={formData.address.area}
                      onChange={handleNestedInputChange('address', 'area')}
                      disabled={!isEditing}
                      required
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="City"
                      value={formData.address.city}
                      onChange={handleNestedInputChange('address', 'city')}
                      disabled={!isEditing}
                      required
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="State"
                      value={formData.address.state}
                      onChange={handleNestedInputChange('address', 'state')}
                      disabled={!isEditing}
                      required
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Pincode"
                      value={formData.address.pincode}
                      onChange={handleNestedInputChange('address', 'pincode')}
                      disabled={!isEditing}
                      required
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Divider sx={{ my: 2 }} />
                    <Typography variant="subtitle2" gutterBottom>
                      Service Areas
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                      {professional?.serviceAreas?.map((area, index) => (
                        <Chip 
                          key={index}
                          icon={<LocationIcon />}
                          label={`${area.city}${area.areas?.length ? ` (${area.areas.join(', ')})` : ''}`} 
                          variant="outlined" 
                          size="small"
                        />
                      ))}
                      {(!professional?.serviceAreas || professional.serviceAreas.length === 0) && (
                        <Typography variant="body2" color="text.secondary">
                          No service areas added yet
                        </Typography>
                      )}
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </TabPanel>

            {/* Schedule Tab */}
            <TabPanel value={activeTab} index={3}>
              <CardContent>
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" gutterBottom>
                      Working Days
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 3 }}>
                      {WORKING_DAYS.map((day) => (
                        <Chip
                          key={day.value}
                          label={day.label}
                          onClick={() => isEditing && toggleWorkingDay(day.value)}
                          color={formData.workingDays.includes(day.value) ? 'primary' : 'default'}
                          variant={formData.workingDays.includes(day.value) ? 'filled' : 'outlined'}
                          disabled={!isEditing}
                          clickable={isEditing}
                        />
                      ))}
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Start Time"
                      type="time"
                      value={formData.workingHours.start}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        workingHours: { ...prev.workingHours, start: e.target.value }
                      }))}
                      disabled={!isEditing}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="End Time"
                      type="time"
                      value={formData.workingHours.end}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        workingHours: { ...prev.workingHours, end: e.target.value }
                      }))}
                      disabled={!isEditing}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Divider sx={{ my: 2 }} />
                    <Typography variant="subtitle2" gutterBottom sx={{ mb: 2 }}>
                      Emergency Contact
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={4}>
                        <TextField
                          fullWidth
                          label="Contact Name"
                          value={formData.emergencyContact.name}
                          onChange={handleNestedInputChange('emergencyContact', 'name')}
                          disabled={!isEditing}
                        />
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <TextField
                          fullWidth
                          label="Relationship"
                          value={formData.emergencyContact.relationship}
                          onChange={handleNestedInputChange('emergencyContact', 'relationship')}
                          disabled={!isEditing}
                          placeholder="e.g., Spouse, Parent"
                        />
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <TextField
                          fullWidth
                          label="Phone Number"
                          value={formData.emergencyContact.phone}
                          onChange={handleNestedInputChange('emergencyContact', 'phone')}
                          disabled={!isEditing}
                        />
                      </Grid>
                    </Grid>
                  </Grid>
                </Grid>
              </CardContent>
            </TabPanel>
          </Paper>
        </Grid>
      </Grid>

      {isEditing && (
        <Alert severity="info" sx={{ mt: 3 }}>
          Make sure all information is accurate. Changes will be reviewed by our team before being published.
        </Alert>
      )}
    </Box>
  )
}
