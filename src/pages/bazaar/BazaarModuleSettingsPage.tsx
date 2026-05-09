import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { BazaarGuidanceAccordion } from './BazaarGuidanceAccordion'
import { PageHeader } from '../../components/common/PageHeader'
import {
  BazaarMarketplaceService,
  type BazaarModuleFlags,
  type BazaarModuleSettingsPayload,
} from '../../services/api/bazaarMarketplace.service'
import { Button } from '../../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { Switch } from '../../components/ui/switch'
import { Label } from '../../components/ui/label'
import { Badge } from '../../components/ui/badge'
import { usePermissions } from '../../hooks/usePermissions'
import { cn } from '../../lib/utils'

const FLAG_KEYS: (keyof BazaarModuleFlags)[] = [
  'assistAiEnabled',
  'photoCheckEnabled',
  'visionApiEnabled',
  'bypassPhotoModeration',
]

const FLAG_LABELS: Record<keyof BazaarModuleFlags, string> = {
  assistAiEnabled: 'Listing assist & smart AI',
  photoCheckEnabled: 'Photo check API (analyze-images)',
  visionApiEnabled: 'Google Vision (labels & safety on photos)',
  bypassPhotoModeration: 'Bypass all automated photo checks',
}

const HINT_KEY: Record<keyof BazaarModuleFlags, string> = {
  assistAiEnabled: 'assistAi',
  photoCheckEnabled: 'photoCheck',
  visionApiEnabled: 'visionApi',
  bypassPhotoModeration: 'bypassPhotoModeration',
}

export default function BazaarModuleSettingsPage() {
  const { checkPermission } = usePermissions()
  const canEdit = checkPermission('edit_products')

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [payload, setPayload] = useState<BazaarModuleSettingsPayload | null>(null)
  const [draft, setDraft] = useState<BazaarModuleFlags | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await BazaarMarketplaceService.adminGetModuleSettings()
      const data = res.data as BazaarModuleSettingsPayload
      setPayload(data)
      setDraft({ ...data.effective })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load Bazaar settings')
      setPayload(null)
      setDraft(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const dirty = useMemo(() => {
    if (!payload || !draft) return false
    return FLAG_KEYS.some((k) => draft[k] !== payload.effective[k])
  }, [payload, draft])

  const save = async () => {
    if (!draft || !dirty) return
    setSaving(true)
    setError(null)
    try {
      const res = await BazaarMarketplaceService.adminPatchModuleSettings(draft)
      const inner = res.data as { effective: BazaarModuleFlags; envBaseline: BazaarModuleFlags }
      setPayload((p) =>
        p
          ? {
              ...p,
              effective: inner.effective,
              envBaseline: inner.envBaseline,
            }
          : null
      )
      setDraft({ ...inner.effective })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  const setFlag = (key: keyof BazaarModuleFlags, value: boolean) => {
    setDraft((d) => (d ? { ...d, [key]: value } : d))
  }

  return (
    <div className="p-4">
      <PageHeader
        title="Bazaar — module & AI settings"
        subtitle="Control listing-assist AI, photo checks, and Vision without redeploying the API"
      />

      <BazaarGuidanceAccordion />

      <p className="mb-4 max-w-3xl text-sm text-muted-foreground">
        Effective values are stored in the database and apply immediately. <strong>Env baseline</strong> shows what the
        server would use from environment variables alone — useful to spot overrides.
      </p>

      {error && (
        <div
          className="mb-4 flex items-center justify-between gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          role="alert"
        >
          {error}
          <Button type="button" variant="ghost" size="sm" onClick={() => setError(null)}>
            Dismiss
          </Button>
        </div>
      )}

      <Card className="max-w-3xl">
        <CardHeader>
          <CardTitle className="text-lg">Feature switches</CardTitle>
          <CardDescription>
            Requires backend <code className="rounded bg-muted px-1 text-xs">/api/bazaar/admin/module-settings</code>.
            PATCH requires <code className="rounded bg-muted px-1 text-xs">edit_products</code>.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {loading || !draft || !payload ? (
            <div className="flex h-40 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              {FLAG_KEYS.map((key) => {
                const hint = payload.hints[HINT_KEY[key]]
                const envVal = payload.envBaseline[key]
                const effectiveVal = payload.effective[key]
                const differsFromEnv = effectiveVal !== envVal
                return (
                  <div
                    key={key}
                    className="flex flex-col gap-3 border-b border-border pb-6 last:border-0 last:pb-0 sm:flex-row sm:items-start sm:justify-between"
                  >
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Label htmlFor={`bazaar-${key}`} className="text-base font-medium">
                          {FLAG_LABELS[key]}
                        </Label>
                        {differsFromEnv && (
                          <Badge variant="secondary" className="text-xs font-normal">
                            Overrides env
                          </Badge>
                        )}
                      </div>
                      {hint && <p className="text-sm text-muted-foreground">{hint}</p>}
                      <p className="text-xs text-muted-foreground">
                        Env baseline: <span className="font-mono">{String(envVal)}</span> · Effective (saved):{' '}
                        <span className="font-mono">{String(effectiveVal)}</span>
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2 sm:pt-1">
                      <Switch
                        id={`bazaar-${key}`}
                        checked={draft[key]}
                        onCheckedChange={(v) => setFlag(key, v)}
                        disabled={!canEdit || saving}
                        className={cn(key === 'bypassPhotoModeration' && draft[key] && 'data-[state=checked]:bg-amber-600')}
                      />
                    </div>
                  </div>
                )
              })}

              <div className="flex flex-wrap items-center gap-2 pt-2">
                <Button type="button" onClick={() => void save()} disabled={!canEdit || !dirty || saving}>
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save changes
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    if (payload) setDraft({ ...payload.effective })
                  }}
                  disabled={!dirty || saving}
                >
                  Reset to saved
                </Button>
                <Button type="button" variant="ghost" onClick={() => void load()} disabled={saving || loading}>
                  Reload from server
                </Button>
                {!canEdit && (
                  <span className="text-sm text-muted-foreground">You can view these flags; saving needs edit_products.</span>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
