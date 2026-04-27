import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  FormControlLabel,
  Checkbox,
  CircularProgress,
  Alert,
  Divider,
  IconButton,
} from '@mui/material'
import Grid from '@mui/material/GridLegacy'
import { ArrowBack, Save } from '@mui/icons-material'
import { ProfessionalsService } from '../../services/api/professionals.service'
import { PROFESSIONAL_TRADE_CATEGORIES, getProfessionalCategoryLabel } from '../../constants/professionalCategories'

const EXPERTISE_LEVELS = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'expert', label: 'Expert' },
]

const WORKING_DAYS = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
] as const

function normalizeDay(d: string): string {
  return d.toLowerCase()
}

export function EditProfessional() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [newSkill, setNewSkill] = useState('')

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    alternatePhone: '' as string,
    dateOfBirth: '' as string,
    gender: 'male' as 'male' | 'female' | 'other',
    categories: [] as string[],
    skills: [] as string[],
    experience: 0,
    expertiseLevel: 'intermediate' as 'beginner' | 'intermediate' | 'expert',
    bio: '',
    isIndependent: true,
    address: {
      street: '',
      area: '',
      city: '',
      state: '',
      pincode: '',
    },
    workingDays: [] as string[],
    workingHours: { start: '09:00', end: '18:00' },
    availability: 'available' as 'available' | 'busy' | 'offline',
    maxBookingsPerDay: 5,
  })

  const mapApiToForm = useCallback((p: Record<string, unknown>) => {
    const u = p.user as Record<string, string> | undefined
    const addr = (p.address as Record<string, string>) || {}
    const wh = (p.workingHours as { start?: string; end?: string }) || {}
    const rawDays = (p.workingDays as string[]) || []
    const days = rawDays.map((d) => normalizeDay(d))
    const cats: string[] = Array.isArray(p.categories)
      ? (p.categories as string[])
      : ((p.services as { slug?: string; name?: string }[] | string[]) || []).map((s) => {
          if (typeof s === 'string') return s
          return s.slug || s.name || ''
        }).filter(Boolean)
    return {
      firstName: (p.firstName as string) || u?.firstName || '',
      lastName: (p.lastName as string) || u?.lastName || '',
      email: (p.email as string) || u?.email || '',
      phoneNumber: String(
        p.phoneNumber || p.phone || (u as { phone?: string } | undefined)?.phone || '',
      ).replace(/\D/g, '').slice(0, 10),
      alternatePhone: (p.alternatePhone as string) || '',
      dateOfBirth: (p.dateOfBirth as string) || '',
      gender: (p.gender as 'male' | 'female' | 'other') || 'male',
      categories: cats,
      skills: (p.skills as string[]) || [],
      experience: Number(p.experience ?? 0),
      expertiseLevel: (p.expertiseLevel as 'beginner' | 'intermediate' | 'expert') || 'intermediate',
      bio: (p.bio as string) || '',
      isIndependent: p.isIndependent !== false,
      address: {
        street: addr.street || '',
        area: addr.area || '',
        city: addr.city || '',
        state: addr.state || '',
        pincode: (addr.pincode || '').toString().replace(/\D/g, '').slice(0, 6),
      },
      workingDays: days.length
        ? days
        : ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
      workingHours: {
        start: wh.start || '09:00',
        end: wh.end || '18:00',
      },
      availability: (p.availability as 'available' | 'busy' | 'offline') || 'available',
      maxBookingsPerDay: Number(p.maxBookingsPerDay ?? 5),
    }
  }, [])

  const load = useCallback(async () => {
    if (!id) {
      setError('Missing professional id')
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const res = await ProfessionalsService.getProfessional(id)
      const top = res.data as unknown
      const rawObj = top && typeof top === 'object' ? (top as Record<string, unknown>) : null
      const inner =
        rawObj && 'professional' in rawObj && rawObj.professional && typeof rawObj.professional === 'object'
          ? (rawObj.professional as Record<string, unknown>)
          : rawObj
      const p = inner
      if (!p) {
        setError('Professional not found')
        return
      }
      setFormData(mapApiToForm(p))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load professional')
    } finally {
      setLoading(false)
    }
  }, [id, mapApiToForm])

  useEffect(() => {
    void load()
  }, [load])

  const handleSave = async () => {
    if (!id) return
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.phoneNumber) {
      setError('Please fill required fields')
      return
    }
    if (formData.categories.length === 0) {
      setError('Select at least one trade / category')
      return
    }
    setSaving(true)
    setError(null)
    try {
      await ProfessionalsService.updateProfessional(id, {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phoneNumber: formData.phoneNumber,
        alternatePhone: formData.alternatePhone || undefined,
        dateOfBirth: formData.dateOfBirth || undefined,
        gender: formData.gender,
        isIndependent: formData.isIndependent,
        services: formData.categories,
        primaryService: formData.categories[0],
        categories: formData.categories,
        skills: formData.skills,
        experience: formData.experience,
        expertiseLevel: formData.expertiseLevel,
        bio: formData.bio,
        address: {
          street: formData.address.street || undefined,
          area: formData.address.area,
          city: formData.address.city,
          state: formData.address.state,
          pincode: formData.address.pincode,
        },
        serviceAreas: [
          {
            city: formData.address.city,
            areas: [formData.address.area],
          },
        ],
        workingDays: formData.workingDays,
        workingHours: formData.workingHours,
        maxBookingsPerDay: formData.maxBookingsPerDay,
        availability: formData.availability,
      })
      navigate('/professionals')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const addSkill = () => {
    const t = newSkill.trim()
    if (t && !formData.skills.includes(t)) {
      setFormData((prev) => ({ ...prev, skills: [...prev.skills, t] }))
      setNewSkill('')
    }
  }

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" py={8}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box>
      <Box display="flex" alignItems="center" mb={3}>
        <IconButton onClick={() => navigate('/professionals')} sx={{ mr: 2 }} aria-label="Back to professionals">
          <ArrowBack />
        </IconButton>
        <Box>
          <Typography variant="h4" fontWeight="bold">
            Edit professional
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Update profile, trades, and schedule
          </Typography>
        </Box>
      </Box>

      <Paper sx={{ p: 3 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Typography variant="h6">Personal</Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Contact used for the professional account
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              required
              label="First name"
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              required
              label="Last name"
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
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              required
              label="Phone"
              value={formData.phoneNumber}
              onChange={(e) =>
                setFormData({ ...formData, phoneNumber: e.target.value.replace(/\D/g, '').slice(0, 10) })
              }
              inputProps={{ maxLength: 10 }}
            />
          </Grid>
        </Grid>

        <Divider sx={{ my: 3 }} />

        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Typography variant="h6">Trades &amp; skills</Typography>
          </Grid>
          <Grid item xs={12}>
            <FormControl fullWidth required>
              <InputLabel>Trades / categories</InputLabel>
              <Select
                multiple
                value={formData.categories}
                label="Trades / categories"
                onChange={(e) => setFormData({ ...formData, categories: e.target.value as string[] })}
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selected.map((value) => (
                      <Chip key={value} size="small" label={getProfessionalCategoryLabel(String(value))} />
                    ))}
                  </Box>
                )}
              >
                {PROFESSIONAL_TRADE_CATEGORIES.map((c) => (
                  <MenuItem key={c.value} value={c.value}>
                    {c.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12}>
            <TextField
              size="small"
              fullWidth
              label="Add skill"
              value={newSkill}
              onChange={(e) => setNewSkill(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
            />
            <Button sx={{ mt: 1 }} size="small" variant="outlined" onClick={addSkill}>
              Add skill
            </Button>
            <Box display="flex" flexWrap="wrap" gap={0.5} mt={1}>
              {formData.skills.map((skill) => (
                <Chip
                  key={skill}
                  label={skill}
                  size="small"
                  onDelete={() => setFormData((p) => ({ ...p, skills: p.skills.filter((s) => s !== skill) }))}
                />
              ))}
            </Box>
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              type="number"
              fullWidth
              label="Years of experience"
              value={formData.experience}
              onChange={(e) => setFormData({ ...formData, experience: parseInt(e.target.value, 10) || 0 })}
              inputProps={{ min: 0, max: 50 }}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth>
              <InputLabel>Expertise</InputLabel>
              <Select
                value={formData.expertiseLevel}
                label="Expertise"
                onChange={(e) =>
                  setFormData({ ...formData, expertiseLevel: e.target.value as 'beginner' | 'intermediate' | 'expert' })
                }
              >
                {EXPERTISE_LEVELS.map((l) => (
                  <MenuItem key={l.value} value={l.value}>
                    {l.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth>
              <InputLabel>Availability</InputLabel>
              <Select
                value={formData.availability}
                label="Availability"
                onChange={(e) =>
                  setFormData({ ...formData, availability: e.target.value as 'available' | 'busy' | 'offline' })
                }
              >
                <MenuItem value="available">Available</MenuItem>
                <MenuItem value="busy">Busy</MenuItem>
                <MenuItem value="offline">Offline</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              rows={2}
              label="Bio"
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
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
              label="Independent professional (not under a company)"
            />
          </Grid>
        </Grid>

        <Divider sx={{ my: 3 }} />

        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Typography variant="h6">Location &amp; schedule</Typography>
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Street"
              value={formData.address.street}
              onChange={(e) => setFormData({ ...formData, address: { ...formData.address, street: e.target.value } })}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              required
              label="Area"
              value={formData.address.area}
              onChange={(e) => setFormData({ ...formData, address: { ...formData.address, area: e.target.value } })}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              required
              label="City"
              value={formData.address.city}
              onChange={(e) => setFormData({ ...formData, address: { ...formData.address, city: e.target.value } })}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              required
              label="State"
              value={formData.address.state}
              onChange={(e) => setFormData({ ...formData, address: { ...formData.address, state: e.target.value } })}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              required
              label="Pincode"
              value={formData.address.pincode}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  address: { ...formData.address, pincode: e.target.value.replace(/\D/g, '').slice(0, 6) },
                })
              }
            />
          </Grid>
          <Grid item xs={12}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Working days
            </Typography>
            <Box display="flex" flexWrap="wrap" gap={1}>
              {WORKING_DAYS.map((day) => {
                const on = formData.workingDays.includes(day)
                return (
                  <Chip
                    key={day}
                    label={day.charAt(0).toUpperCase() + day.slice(1)}
                    color={on ? 'primary' : 'default'}
                    variant={on ? 'filled' : 'outlined'}
                    onClick={() => {
                      setFormData((prev) => ({
                        ...prev,
                        workingDays: on
                          ? prev.workingDays.filter((d) => d !== day)
                          : [...prev.workingDays, day],
                      }))
                    }}
                  />
                )
              })}
            </Box>
          </Grid>
          <Grid item xs={6} sm={3}>
            <TextField
              type="time"
              fullWidth
              label="Start"
              value={formData.workingHours.start}
              onChange={(e) =>
                setFormData({ ...formData, workingHours: { ...formData.workingHours, start: e.target.value } })
              }
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={6} sm={3}>
            <TextField
              type="time"
              fullWidth
              label="End"
              value={formData.workingHours.end}
              onChange={(e) =>
                setFormData({ ...formData, workingHours: { ...formData.workingHours, end: e.target.value } })
              }
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} sm={3}>
            <TextField
              type="number"
              fullWidth
              label="Max bookings / day"
              value={formData.maxBookingsPerDay}
              onChange={(e) => setFormData({ ...formData, maxBookingsPerDay: parseInt(e.target.value, 10) || 0 })}
            />
          </Grid>
        </Grid>

        <Box display="flex" justifyContent="flex-end" gap={2} mt={4}>
          <Button onClick={() => navigate('/professionals')}>Cancel</Button>
          <Button
            variant="contained"
            startIcon={saving ? <CircularProgress size={18} color="inherit" /> : <Save />}
            disabled={saving}
            onClick={handleSave}
          >
            Save changes
          </Button>
        </Box>
      </Paper>
    </Box>
  )
}
