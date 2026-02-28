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

import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Stepper,
  Step,
  StepLabel,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  OutlinedInput,
  FormControlLabel,
  Checkbox,
  CircularProgress,
  Alert,
  Divider,
  Avatar,
  IconButton,
  InputAdornment,
} from '@mui/material'
import Grid from '@mui/material/GridLegacy'
import {
  ArrowBack,
  Save,
  PersonAdd,
  CloudUpload,
  Visibility,
  VisibilityOff,
} from '@mui/icons-material'
import { ProfessionalsService } from '../../services/api/professionals.service'

const STEPS = ['Personal Info', 'Professional Details', 'Location & Availability', 'Review']

const CATEGORIES = [
  { value: 'electrician', label: 'Electrician' },
  { value: 'plumber', label: 'Plumber' },
  { value: 'carpenter', label: 'Carpenter' },
  { value: 'painter', label: 'Painter' },
  { value: 'cleaner', label: 'Cleaner' },
  { value: 'ac_technician', label: 'AC Technician' },
  { value: 'appliance_repair', label: 'Appliance Repair' },
  { value: 'pest_control', label: 'Pest Control' },
]

const EXPERTISE_LEVELS = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'expert', label: 'Expert' },
]

const WORKING_DAYS = [
  'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'
]

export function CreateProfessional() {
  const navigate = useNavigate()
  const [activeStep, setActiveStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)

  // Form data — required fields empty; all optional fields pre-filled
  const [formData, setFormData] = useState({
    // Personal Info (required: firstName, lastName, email, phoneNumber)
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    alternatePhone: '',
    dateOfBirth: '',
    gender: 'male' as 'male' | 'female' | 'other',
    password: 'SecurePass123!',

    // Professional Details (required: at least one category, experience >= 0)
    categories: [] as string[],
    skills: [] as string[],
    experience: 2,
    expertiseLevel: 'intermediate' as 'beginner' | 'intermediate' | 'expert',
    bio: 'Experienced professional. Quality service guaranteed. Available for bookings.',
    isIndependent: true,

    // Location (required: area, city, pincode, at least one working day)
    address: {
      street: 'To be updated',
      area: '',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '',
    },

    // Availability
    workingDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'] as string[],
    workingHours: {
      start: '09:00',
      end: '18:00',
    },
    availability: 'available' as 'available' | 'busy' | 'offline',
    maxBookingsPerDay: 5,
  })

  const [newSkill, setNewSkill] = useState('')

  // Validation
  const validateStep = (step: number): boolean => {
    switch (step) {
      case 0: // Personal Info
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
      
      case 1: // Professional Details
        if (formData.categories.length === 0) {
          setError('Please select at least one category')
          return false
        }
        if (formData.experience < 0) {
          setError('Experience must be 0 or more')
          return false
        }
        break
      
      case 2: // Location
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
      // Prepare data for API
      const professionalData = {
        ...formData,
        // Backend requires services list; we map it from selected categories for now
        services: formData.categories,
        primaryService: formData.categories[0],
        serviceAreas: [
          {
            city: formData.address.city,
            areas: [formData.address.area],
          }
        ],
      }

      const response = await ProfessionalsService.createProfessional(professionalData)

      // Success - redirect to professionals list
      navigate('/professionals', {
        state: {
          message: `Professional ${formData.firstName} ${formData.lastName} created successfully!`,
          severity: 'success'
        }
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
        skills: [...formData.skills, newSkill.trim()]
      })
      setNewSkill('')
    }
  }

  const handleRemoveSkill = (skill: string) => {
    setFormData({
      ...formData,
      skills: formData.skills.filter(s => s !== skill)
    })
  }

  const renderPersonalInfo = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Typography variant="h6" gutterBottom>
          Personal Information
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Basic information about the professional
        </Typography>
      </Grid>

      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          required
          label="First Name"
          value={formData.firstName}
          onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
        />
      </Grid>

      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          required
          label="Last Name"
          value={formData.lastName}
          onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
        />
      </Grid>

      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          required
          type="email"
          label="Email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          helperText="Used for login"
        />
      </Grid>

      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          required
          label="Phone Number"
          value={formData.phoneNumber}
          onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value.replace(/\D/g, '') })}
          helperText="10 digits without country code"
          inputProps={{ maxLength: 10 }}
        />
      </Grid>

      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Alternate Phone"
          value={formData.alternatePhone}
          onChange={(e) => setFormData({ ...formData, alternatePhone: e.target.value.replace(/\D/g, '') })}
          inputProps={{ maxLength: 10 }}
        />
      </Grid>

      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          type="date"
          label="Date of Birth"
          value={formData.dateOfBirth}
          onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
          InputLabelProps={{ shrink: true }}
        />
      </Grid>

      <Grid item xs={12} sm={6}>
        <FormControl fullWidth>
          <InputLabel>Gender</InputLabel>
          <Select
            value={formData.gender}
            label="Gender"
            onChange={(e) => setFormData({ ...formData, gender: e.target.value as any })}
          >
            <MenuItem value="male">Male</MenuItem>
            <MenuItem value="female">Female</MenuItem>
            <MenuItem value="other">Other</MenuItem>
          </Select>
        </FormControl>
      </Grid>

      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          required
          type={showPassword ? 'text' : 'password'}
          label="Default Password"
          value={formData.password}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          helperText="Professional will use this to login"
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                  {showPassword ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            ),
          }}
        />
      </Grid>
    </Grid>
  )

  const renderProfessionalDetails = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Typography variant="h6" gutterBottom>
          Professional Details
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Skills, experience, and expertise
        </Typography>
      </Grid>

      <Grid item xs={12}>
        <FormControl fullWidth required>
          <InputLabel>Service Categories</InputLabel>
          <Select
            multiple
            value={formData.categories}
            label="Service Categories"
            onChange={(e) => setFormData({ ...formData, categories: e.target.value as string[] })}
            renderValue={(selected) => (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {selected.map((value) => (
                  <Chip
                    key={value}
                    label={CATEGORIES.find(c => c.value === value)?.label || value}
                    size="small"
                  />
                ))}
              </Box>
            )}
          >
            {CATEGORIES.map((category) => (
              <MenuItem key={category.value} value={category.value}>
                {category.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>

      <Grid item xs={12}>
        <Typography variant="subtitle2" gutterBottom>
          Skills
        </Typography>
        <Box display="flex" gap={1} mb={1}>
          <TextField
            fullWidth
            size="small"
            placeholder="Add a skill (e.g., Wiring, Plumbing)"
            value={newSkill}
            onChange={(e) => setNewSkill(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAddSkill()}
          />
          <Button variant="outlined" onClick={handleAddSkill}>
            Add
          </Button>
        </Box>
        <Box display="flex" flexWrap="wrap" gap={0.5}>
          {formData.skills.map((skill) => (
            <Chip
              key={skill}
              label={skill}
              onDelete={() => handleRemoveSkill(skill)}
              size="small"
            />
          ))}
        </Box>
      </Grid>

      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          required
          type="number"
          label="Years of Experience"
          value={formData.experience}
          onChange={(e) => setFormData({ ...formData, experience: parseInt(e.target.value) || 0 })}
          inputProps={{ min: 0, max: 50 }}
        />
      </Grid>

      <Grid item xs={12} sm={6}>
        <FormControl fullWidth required>
          <InputLabel>Expertise Level</InputLabel>
          <Select
            value={formData.expertiseLevel}
            label="Expertise Level"
            onChange={(e) => setFormData({ ...formData, expertiseLevel: e.target.value as any })}
          >
            {EXPERTISE_LEVELS.map((level) => (
              <MenuItem key={level.value} value={level.value}>
                {level.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>

      <Grid item xs={12}>
        <TextField
          fullWidth
          multiline
          rows={3}
          label="Bio / Description"
          value={formData.bio}
          onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
          helperText="Brief description about the professional"
        />
      </Grid>

      <Grid item xs={12}>
        <FormControlLabel
          control={
            <Checkbox
              checked={formData.isIndependent}
              onChange={(e) => setFormData({ ...formData, isIndependent: e.target.checked })}
            />
          }
          label="Independent Professional (not part of any company)"
        />
      </Grid>
    </Grid>
  )

  const renderLocationAvailability = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Typography variant="h6" gutterBottom>
          Location & Availability
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Where the professional works and when they're available
        </Typography>
      </Grid>

      <Grid item xs={12}>
        <TextField
          fullWidth
          label="Street / Building"
          value={formData.address.street}
          onChange={(e) => setFormData({ ...formData, address: { ...formData.address, street: e.target.value } })}
        />
      </Grid>

      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          required
          label="Area / Locality"
          value={formData.address.area}
          onChange={(e) => setFormData({ ...formData, address: { ...formData.address, area: e.target.value } })}
        />
      </Grid>

      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          required
          label="City"
          value={formData.address.city}
          onChange={(e) => setFormData({ ...formData, address: { ...formData.address, city: e.target.value } })}
        />
      </Grid>

      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          required
          label="State"
          value={formData.address.state}
          onChange={(e) => setFormData({ ...formData, address: { ...formData.address, state: e.target.value } })}
        />
      </Grid>

      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          required
          label="Pincode"
          value={formData.address.pincode}
          onChange={(e) => setFormData({ ...formData, address: { ...formData.address, pincode: e.target.value.replace(/\D/g, '') } })}
          inputProps={{ maxLength: 6 }}
        />
      </Grid>

      <Grid item xs={12}>
        <Divider sx={{ my: 2 }} />
      </Grid>

      <Grid item xs={12}>
        <Typography variant="subtitle1" gutterBottom>
          Working Days
        </Typography>
        <Box display="flex" flexWrap="wrap" gap={1}>
          {WORKING_DAYS.map((day) => (
            <Chip
              key={day}
              label={day.charAt(0).toUpperCase() + day.slice(1)}
              onClick={() => {
                const newDays = formData.workingDays.includes(day)
                  ? formData.workingDays.filter(d => d !== day)
                  : [...formData.workingDays, day]
                setFormData({ ...formData, workingDays: newDays })
              }}
              color={formData.workingDays.includes(day) ? 'primary' : 'default'}
              variant={formData.workingDays.includes(day) ? 'filled' : 'outlined'}
            />
          ))}
        </Box>
      </Grid>

      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          type="time"
          label="Start Time"
          value={formData.workingHours.start}
          onChange={(e) => setFormData({ ...formData, workingHours: { ...formData.workingHours, start: e.target.value } })}
          InputLabelProps={{ shrink: true }}
        />
      </Grid>

      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          type="time"
          label="End Time"
          value={formData.workingHours.end}
          onChange={(e) => setFormData({ ...formData, workingHours: { ...formData.workingHours, end: e.target.value } })}
          InputLabelProps={{ shrink: true }}
        />
      </Grid>

      <Grid item xs={12} sm={6}>
        <FormControl fullWidth>
          <InputLabel>Initial Availability</InputLabel>
          <Select
            value={formData.availability}
            label="Initial Availability"
            onChange={(e) => setFormData({ ...formData, availability: e.target.value as any })}
          >
            <MenuItem value="available">Available</MenuItem>
            <MenuItem value="busy">Busy</MenuItem>
            <MenuItem value="offline">Offline</MenuItem>
          </Select>
        </FormControl>
      </Grid>

      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          type="number"
          label="Max Bookings Per Day"
          value={formData.maxBookingsPerDay}
          onChange={(e) => setFormData({ ...formData, maxBookingsPerDay: parseInt(e.target.value) || 5 })}
          inputProps={{ min: 1, max: 20 }}
        />
      </Grid>
    </Grid>
  )

  const renderReview = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Typography variant="h6" gutterBottom>
          Review Information
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Please review all details before creating
        </Typography>
      </Grid>

      <Grid item xs={12}>
        <Paper variant="outlined" sx={{ p: 3 }}>
          <Typography variant="subtitle1" gutterBottom fontWeight="bold">
            Personal Information
          </Typography>
          <Box display="grid" gridTemplateColumns="1fr 1fr" gap={2}>
            <Box>
              <Typography variant="caption" color="text.secondary">Name</Typography>
              <Typography>{formData.firstName} {formData.lastName}</Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">Email</Typography>
              <Typography>{formData.email}</Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">Phone</Typography>
              <Typography>{formData.phoneNumber}</Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">Gender</Typography>
              <Typography>{formData.gender.charAt(0).toUpperCase() + formData.gender.slice(1)}</Typography>
            </Box>
          </Box>
        </Paper>
      </Grid>

      <Grid item xs={12}>
        <Paper variant="outlined" sx={{ p: 3 }}>
          <Typography variant="subtitle1" gutterBottom fontWeight="bold">
            Professional Details
          </Typography>
          <Box display="grid" gap={2}>
            <Box>
              <Typography variant="caption" color="text.secondary">Categories</Typography>
              <Box mt={0.5}>
                {formData.categories.map(cat => (
                  <Chip key={cat} label={CATEGORIES.find(c => c.value === cat)?.label || cat} size="small" sx={{ mr: 0.5 }} />
                ))}
              </Box>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">Skills</Typography>
              <Box mt={0.5}>
                {formData.skills.map(skill => (
                  <Chip key={skill} label={skill} size="small" variant="outlined" sx={{ mr: 0.5 }} />
                ))}
              </Box>
            </Box>
            <Box display="grid" gridTemplateColumns="1fr 1fr" gap={2}>
              <Box>
                <Typography variant="caption" color="text.secondary">Experience</Typography>
                <Typography>{formData.experience} years</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">Expertise</Typography>
                <Typography>{formData.expertiseLevel.charAt(0).toUpperCase() + formData.expertiseLevel.slice(1)}</Typography>
              </Box>
            </Box>
          </Box>
        </Paper>
      </Grid>

      <Grid item xs={12}>
        <Paper variant="outlined" sx={{ p: 3 }}>
          <Typography variant="subtitle1" gutterBottom fontWeight="bold">
            Location & Availability
          </Typography>
          <Box display="grid" gap={2}>
            <Box>
              <Typography variant="caption" color="text.secondary">Address</Typography>
              <Typography>
                {formData.address.area}, {formData.address.city}, {formData.address.state} - {formData.address.pincode}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">Working Days</Typography>
              <Typography>
                {formData.workingDays.map(d => d.charAt(0).toUpperCase() + d.slice(1)).join(', ')}
              </Typography>
            </Box>
            <Box display="grid" gridTemplateColumns="1fr 1fr" gap={2}>
              <Box>
                <Typography variant="caption" color="text.secondary">Working Hours</Typography>
                <Typography>{formData.workingHours.start} - {formData.workingHours.end}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">Availability</Typography>
                <Typography>{formData.availability.charAt(0).toUpperCase() + formData.availability.slice(1)}</Typography>
              </Box>
            </Box>
          </Box>
        </Paper>
      </Grid>

      <Grid item xs={12}>
        <Alert severity="info">
          <Typography variant="body2">
            <strong>Login Credentials:</strong><br />
            Email: {formData.email}<br />
            Password: {formData.password}<br /><br />
            The professional will be able to login using these credentials.
          </Typography>
        </Alert>
      </Grid>
    </Grid>
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
    <Box>
      {/* Header */}
      <Box display="flex" alignItems="center" mb={3}>
        <IconButton onClick={() => navigate('/professionals')} sx={{ mr: 2 }}>
          <ArrowBack />
        </IconButton>
        <Box>
          <Typography variant="h4" fontWeight="bold">
            Create Professional
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Add a new professional with login access
          </Typography>
        </Box>
      </Box>

      {/* Stepper */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Stepper activeStep={activeStep}>
          {STEPS.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
      </Paper>

      {/* Form */}
      <Paper sx={{ p: 3 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {getStepContent(activeStep)}

        {/* Actions */}
        <Box display="flex" justifyContent="space-between" mt={4}>
          <Button
            disabled={activeStep === 0 || loading}
            onClick={handleBack}
          >
            Back
          </Button>
          <Box display="flex" gap={2}>
            {activeStep === STEPS.length - 1 ? (
              <Button
                variant="contained"
                startIcon={loading ? <CircularProgress size={20} /> : <Save />}
                onClick={handleSubmit}
                disabled={loading}
              >
                {loading ? 'Creating...' : 'Create Professional'}
              </Button>
            ) : (
              <Button variant="contained" onClick={handleNext}>
                Next
              </Button>
            )}
          </Box>
        </Box>
      </Paper>
    </Box>
  )
}

