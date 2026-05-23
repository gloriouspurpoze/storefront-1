import React, { useState, useEffect } from 'react'
import { Link2, Facebook, Twitter, Instagram, Linkedin, Youtube, Globe, Loader2 } from 'lucide-react'
import { Card, CardContent } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { PageHeader } from '../../components/common/PageHeader'
import { settingsService } from '../../services/api/settings.service'
import { cn } from '../../lib/utils'

export interface SocialLinksData {
  facebook?: string
  twitter?: string
  instagram?: string
  linkedin?: string
  youtube?: string
  website?: string
}

const defaultLinks: SocialLinksData = {
  facebook: '',
  twitter: '',
  instagram: '',
  linkedin: '',
  youtube: '',
  website: '',
}

const iconMap: Record<keyof SocialLinksData, React.ReactNode> = {
  website: <Globe className="h-4 w-4" />,
  facebook: <Facebook className="h-4 w-4" />,
  twitter: <Twitter className="h-4 w-4" />,
  instagram: <Instagram className="h-4 w-4" />,
  linkedin: <Linkedin className="h-4 w-4" />,
  youtube: <Youtube className="h-4 w-4" />,
}

export default function SocialLinksManagement() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  })
  const [formData, setFormData] = useState<SocialLinksData>(defaultLinks)

  useEffect(() => {
    loadSettings()
  }, [])

  useEffect(() => {
    if (!snackbar.open) return undefined
    const t = window.setTimeout(() => setSnackbar((s) => ({ ...s, open: false })), 6000)
    return () => window.clearTimeout(t)
  }, [snackbar.open, snackbar.message])

  const loadSettings = async () => {
    try {
      setLoading(true)
      const res = await settingsService.getClientControls()
      const data = (res as any)?.data ?? res
      const controls = data?.clientControls ?? data
      const links = (controls?.socialLinks ?? controls?.social_links) || {}
      if (controls && typeof controls === 'object') {
        setFormData({ ...defaultLinks, ...links })
      }
    } catch (e) {
      console.error('Error loading client controls:', e)
      setSnackbar({ open: true, message: 'Could not load settings.', severity: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (field: keyof SocialLinksData) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value.trim() }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setSaving(true)
      await settingsService.updateClientControls({ socialLinks: formData } as any)
      setSnackbar({ open: true, message: 'Social links saved successfully.', severity: 'success' })
    } catch (err: any) {
      setSnackbar({
        open: true,
        message: err?.error || err?.message || 'Failed to save social links.',
        severity: 'error',
      })
    } finally {
      setSaving(false)
    }
  }

  const fields: { key: keyof SocialLinksData; label: string; placeholder: string }[] = [
    { key: 'website', label: 'Website', placeholder: 'https://yourwebsite.com' },
    { key: 'facebook', label: 'Facebook', placeholder: 'https://facebook.com/yourpage' },
    { key: 'twitter', label: 'Twitter / X', placeholder: 'https://twitter.com/yourhandle' },
    { key: 'instagram', label: 'Instagram', placeholder: 'https://instagram.com/yourhandle' },
    { key: 'linkedin', label: 'LinkedIn', placeholder: 'https://linkedin.com/company/yourpage' },
    { key: 'youtube', label: 'YouTube', placeholder: 'https://youtube.com/@yourchannel' },
  ]

  return (
    <div className="p-4 sm:p-6 md:p-8">
      <PageHeader
        title="Social Links"
        subtitle="Manage social and website links shown on your client site (footer, header, contact)"
      />

      <div className="mb-6 rounded-md border border-sky-200 bg-sky-50/80 p-4 text-sm dark:border-sky-900 dark:bg-sky-950/40">
        <p>
          URLs saved here are stored in global settings as{' '}
          <code className="rounded bg-muted px-1">clientControls.socialLinks</code> and served publicly on the
          customer site via <code className="rounded bg-muted px-1">GET /api/cms/social-links</code> (footer, about
          page, and SEO JSON-LD).
        </p>
      </div>

      <Card className="max-w-2xl overflow-hidden rounded-xl">
        <CardContent className="p-6 md:p-8">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {fields.map(({ key, label, placeholder }) => (
                <div key={key} className="space-y-2">
                  <Label htmlFor={`social-${key}`}>{label}</Label>
                  <div className="flex gap-2">
                    <span className="flex shrink-0 items-center text-muted-foreground" aria-hidden>
                      {iconMap[key]}
                    </span>
                    <Input
                      id={`social-${key}`}
                      type="url"
                      placeholder={placeholder}
                      value={formData[key] || ''}
                      onChange={handleChange(key)}
                      className="rounded-md"
                    />
                  </div>
                </div>
              ))}
              <div className="flex flex-col gap-2 pt-2 sm:flex-row sm:items-center">
                <Button type="submit" disabled={saving} className="rounded-md">
                  {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Link2 className="mr-2 h-4 w-4" />}
                  {saving ? 'Saving…' : 'Save social links'}
                </Button>
                <Button type="button" variant="outline" onClick={loadSettings} className="rounded-md">
                  Reset
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>

      {snackbar.open && (
        <div
          className={cn(
            'fixed bottom-4 right-4 z-50 max-w-md rounded-md border p-4 shadow-lg',
            snackbar.severity === 'error'
              ? 'border-destructive/50 bg-destructive/10'
              : 'border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/40'
          )}
        >
          <p className="text-sm">{snackbar.message}</p>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="mt-2"
            onClick={() => setSnackbar((s) => ({ ...s, open: false }))}
          >
            Dismiss
          </Button>
        </div>
      )}
    </div>
  )
}
