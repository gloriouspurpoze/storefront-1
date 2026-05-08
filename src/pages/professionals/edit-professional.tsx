import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Loader2, Save } from 'lucide-react'
import {
  Badge,
  Button,
  Card,
  CardContent,
  Checkbox,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Separator,
  Textarea,
} from '../../components/ui'
import { ProfessionalsService } from '../../services/api/professionals.service'
import { PROFESSIONAL_TRADE_CATEGORIES } from '../../constants/professionalCategories'

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

  const toggleCategory = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      categories: prev.categories.includes(value)
        ? prev.categories.filter((c) => c !== value)
        : [...prev.categories, value],
    }))
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" aria-hidden />
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <Button type="button" variant="ghost" size="icon" onClick={() => navigate('/professionals')} aria-label="Back to professionals">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Edit professional</h1>
          <p className="text-sm text-muted-foreground">Update profile, trades, and schedule</p>
        </div>
      </div>

      <Card>
        <CardContent className="space-y-8 pt-6">
          {error && (
            <div
              role="alert"
              className="flex items-start justify-between gap-2 rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive"
            >
              <span>{error}</span>
              <button type="button" className="shrink-0 text-destructive underline" onClick={() => setError(null)}>
                Dismiss
              </button>
            </div>
          )}

          <section className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold">Personal</h2>
              <p className="text-sm text-muted-foreground">Contact used for the professional account</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="firstName">First name</Label>
                <Input
                  id="firstName"
                  required
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last name</Label>
                <Input
                  id="lastName"
                  required
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  required
                  value={formData.phoneNumber}
                  onChange={(e) =>
                    setFormData({ ...formData, phoneNumber: e.target.value.replace(/\D/g, '').slice(0, 10) })
                  }
                  maxLength={10}
                />
              </div>
            </div>
          </section>

          <Separator />

          <section className="space-y-4">
            <h2 className="text-lg font-semibold">Trades &amp; skills</h2>
            <div className="space-y-2">
              <Label>Trades / categories</Label>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {PROFESSIONAL_TRADE_CATEGORIES.map((c) => (
                  <label key={c.value} className="flex cursor-pointer items-center gap-2 rounded-md border border-border p-2 text-sm">
                    <Checkbox
                      checked={formData.categories.includes(c.value)}
                      onCheckedChange={() => toggleCategory(c.value)}
                    />
                    {c.label}
                  </label>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="skill">Add skill</Label>
              <div className="flex flex-wrap gap-2">
                <Input
                  id="skill"
                  className="max-w-md"
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                />
                <Button type="button" variant="outline" size="sm" onClick={addSkill}>
                  Add skill
                </Button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {formData.skills.map((skill) => (
                  <Badge key={skill} variant="secondary" className="gap-1 pr-1">
                    {skill}
                    <button
                      type="button"
                      className="rounded-full p-0.5 hover:bg-muted"
                      onClick={() => setFormData((p) => ({ ...p, skills: p.skills.filter((s) => s !== skill) }))}
                      aria-label={`Remove ${skill}`}
                    >
                      ×
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="exp">Years of experience</Label>
                <Input
                  id="exp"
                  type="number"
                  min={0}
                  max={50}
                  value={formData.experience}
                  onChange={(e) => setFormData({ ...formData, experience: parseInt(e.target.value, 10) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label>Expertise</Label>
                <Select
                  value={formData.expertiseLevel}
                  onValueChange={(v) =>
                    setFormData({ ...formData, expertiseLevel: v as 'beginner' | 'intermediate' | 'expert' })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EXPERTISE_LEVELS.map((l) => (
                      <SelectItem key={l.value} value={l.value}>
                        {l.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Availability</Label>
                <Select
                  value={formData.availability}
                  onValueChange={(v) =>
                    setFormData({ ...formData, availability: v as 'available' | 'busy' | 'offline' })
                  }
                >
                  <SelectTrigger>
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
            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea id="bio" rows={2} value={formData.bio} onChange={(e) => setFormData({ ...formData, bio: e.target.value })} />
            </div>
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <Checkbox
                checked={formData.isIndependent}
                onCheckedChange={(c) => setFormData({ ...formData, isIndependent: c === true })}
              />
              Independent professional (not under a company)
            </label>
          </section>

          <Separator />

          <section className="space-y-4">
            <h2 className="text-lg font-semibold">Location &amp; schedule</h2>
            <div className="space-y-2">
              <Label htmlFor="street">Street</Label>
              <Input
                id="street"
                value={formData.address.street}
                onChange={(e) => setFormData({ ...formData, address: { ...formData.address, street: e.target.value } })}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-2">
                <Label htmlFor="area">Area</Label>
                <Input
                  id="area"
                  required
                  value={formData.address.area}
                  onChange={(e) => setFormData({ ...formData, address: { ...formData.address, area: e.target.value } })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  required
                  value={formData.address.city}
                  onChange={(e) => setFormData({ ...formData, address: { ...formData.address, city: e.target.value } })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">State</Label>
                <Input
                  id="state"
                  required
                  value={formData.address.state}
                  onChange={(e) => setFormData({ ...formData, address: { ...formData.address, state: e.target.value } })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pincode">Pincode</Label>
                <Input
                  id="pincode"
                  required
                  value={formData.address.pincode}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      address: { ...formData.address, pincode: e.target.value.replace(/\D/g, '').slice(0, 6) },
                    })
                  }
                  maxLength={6}
                />
              </div>
            </div>
            <div>
              <Label className="mb-2 block">Working days</Label>
              <div className="flex flex-wrap gap-2">
                {WORKING_DAYS.map((day) => {
                  const on = formData.workingDays.includes(day)
                  return (
                    <Button
                      key={day}
                      type="button"
                      variant={on ? 'default' : 'outline'}
                      size="sm"
                      className="capitalize"
                      onClick={() => {
                        setFormData((prev) => ({
                          ...prev,
                          workingDays: on
                            ? prev.workingDays.filter((d) => d !== day)
                            : [...prev.workingDays, day],
                        }))
                      }}
                    >
                      {day.charAt(0).toUpperCase() + day.slice(1)}
                    </Button>
                  )
                })}
              </div>
            </div>
            <div className="grid max-w-2xl gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="start">Start</Label>
                <Input
                  id="start"
                  type="time"
                  value={formData.workingHours.start}
                  onChange={(e) =>
                    setFormData({ ...formData, workingHours: { ...formData.workingHours, start: e.target.value } })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end">End</Label>
                <Input
                  id="end"
                  type="time"
                  value={formData.workingHours.end}
                  onChange={(e) =>
                    setFormData({ ...formData, workingHours: { ...formData.workingHours, end: e.target.value } })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxb">Max bookings / day</Label>
                <Input
                  id="maxb"
                  type="number"
                  value={formData.maxBookingsPerDay}
                  onChange={(e) => setFormData({ ...formData, maxBookingsPerDay: parseInt(e.target.value, 10) || 0 })}
                />
              </div>
            </div>
          </section>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => navigate('/professionals')}>
              Cancel
            </Button>
            <Button type="button" onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Save changes
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
