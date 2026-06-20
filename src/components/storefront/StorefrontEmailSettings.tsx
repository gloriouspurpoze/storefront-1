import React, { useCallback, useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { Badge, Button, Input, Label } from '../ui'
import { storefrontStudioService, type StorefrontEmailConfig } from '../../services/api/storefrontStudio.service'

export function StorefrontEmailSettings() {
  const [cfg, setCfg] = useState<StorefrontEmailConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fromEmail, setFromEmail] = useState('')
  const [displayName, setDisplayName] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await storefrontStudioService.getEmailConfig()
      if (res?.success && res.data) {
        setCfg(res.data)
        setFromEmail(res.data.fromEmail ?? '')
        setDisplayName(res.data.emailDisplayName ?? '')
      } else {
        setError('Could not load email settings.')
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load email settings')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const save = async () => {
    setSaving(true)
    setError(null)
    try {
      const res = await storefrontStudioService.patchEmailConfig({
        fromEmail,
        emailDisplayName: displayName,
      })
      if (res?.success && res.data) {
        setCfg((prev) => ({ ...(prev ?? {}), ...res.data } as StorefrontEmailConfig))
        await load()
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  const verify = async () => {
    setVerifying(true)
    setError(null)
    try {
      const res = await storefrontStudioService.verifyEmailDomain()
      if (res?.success) {
        await load()
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Verification failed')
    } finally {
      setVerifying(false)
    }
  }

  if (loading) {
    return (
      <p className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading email settings…
      </p>
    )
  }

  if (!cfg?.isPremiumEligible) {
    return (
      <div className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
        <p className="font-medium text-foreground">Order emails on the free plan</p>
        <p className="mt-1">
          Customers receive branded confirmation and status emails sent via the platform SMTP (
          display name shows your brand). Upgrade to Growth to use a custom From address.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-medium">Custom order emails (Premium)</p>
        <p className="text-xs text-muted-foreground">
          Emails are sent through the platform SMTP. Set your preferred From address and display
          name — ensure your mail provider allows sending as that address (SPF/DKIM on your domain).
        </p>
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="sf-from-email">From email</Label>
          <Input
            id="sf-from-email"
            type="email"
            placeholder="orders@yourdomain.com"
            value={fromEmail}
            onChange={(e) => setFromEmail(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="sf-display-name">Display name</Label>
          <Input
            id="sf-display-name"
            placeholder="The Brown Butter"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Badge variant={cfg.isEmailVerified ? 'default' : 'secondary'}>
          {cfg.isEmailVerified ? 'From address confirmed' : 'Not confirmed'}
        </Badge>
        <Button type="button" size="sm" variant="outline" onClick={() => void save()} disabled={saving}>
          {saving ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : null}
          Save
        </Button>
        <Button
          type="button"
          size="sm"
          onClick={() => void verify()}
          disabled={verifying || !fromEmail.trim()}
        >
          {verifying ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : null}
          Confirm From address
        </Button>
      </div>

      <p className="text-xs text-muted-foreground">
        After saving, click Confirm once SPF/DKIM is set up for your domain at your email provider.
        No third-party email API is required.
      </p>
    </div>
  )
}
