import React, { useEffect, useState } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import { Loader2, Palette } from 'lucide-react'
import { PageHeader } from '../../components/common/PageHeader'
import {
  Button,
  Card,
  CardContent,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui'
import { publicSiteThemeService } from '../../services/api/publicSiteTheme.service'
import {
  DEFAULT_PUBLIC_SITE_THEME,
  type PublicSiteThemeTokens,
  type SiteRadiusPreset,
  type SiteSpacingDensity,
} from '../../types/publicSiteTheme.types'
import { cn } from '../../lib/utils'

const FONT_PRESETS = [
  { label: 'Inter + DM Sans', heading: '"DM Sans", system-ui, sans-serif', body: '"Inter", system-ui, sans-serif' },
  { label: 'System UI', heading: 'system-ui, sans-serif', body: 'system-ui, sans-serif' },
  { label: 'Georgia editorial', heading: 'Georgia, serif', body: 'system-ui, sans-serif' },
]

const THEME_PRESETS: { name: string; patch: Partial<PublicSiteThemeTokens> }[] = [
  { name: 'ProFixer default', patch: {} },
  {
    name: 'Emerald marketplace',
    patch: {
      primaryColor: '#047857',
      accentColor: '#0f766e',
      backgroundColor: '#f8fafc',
      surfaceColor: '#ffffff',
    },
  },
  {
    name: 'Bold contrast',
    patch: {
      primaryColor: '#b45309',
      accentColor: '#ea580c',
      backgroundColor: '#0f172a',
      surfaceColor: '#1e293b',
      textColor: '#f8fafc',
      mutedTextColor: '#94a3b8',
    },
  },
]

export default function SiteAppearancePage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [source, setSource] = useState<'api' | 'local' | 'default'>('default')
  const [theme, setTheme] = useState<PublicSiteThemeTokens>({ ...DEFAULT_PUBLIC_SITE_THEME })
  const [saveHint, setSaveHint] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      const r = await publicSiteThemeService.getTheme()
      if (!cancelled) {
        setTheme(r.theme)
        setSource(r.source)
      }
      setLoading(false)
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const applyPreset = (patch: Partial<PublicSiteThemeTokens>) => {
    setTheme({ ...DEFAULT_PUBLIC_SITE_THEME, ...patch })
  }

  const handleSave = async () => {
    setSaving(true)
    setSaveHint(null)
    const res = await publicSiteThemeService.saveTheme(theme)
    setSaving(false)
    if (res.ok) {
      setSource(res.source)
      setSaveHint(
        res.source === 'api'
          ? 'Saved to API.'
          : res.error
            ? `Saved locally (${res.error}).`
            : 'Saved locally (API route optional).',
      )
    } else {
      setSaveHint(res.error || 'Save failed.')
    }
  }

  const previewRadius =
    theme.borderRadius === 'sm' ? '0.25rem' : theme.borderRadius === 'lg' ? '0.75rem' : '0.375rem'
  const previewPadding =
    theme.sectionSpacing === 'compact' ? '1rem' : theme.sectionSpacing === 'spacious' ? '2.5rem' : '1.5rem'

  return (
    <div className="p-4 sm:p-6 md:p-8">
      <PageHeader
        title="Site appearance"
        subtitle="Public-site design tokens (colors, type, radius, spacing). Storefront should read these from your API when available."
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <RouterLink to="/cms/homepage">Homepage sections</RouterLink>
            </Button>
            <Button size="sm" disabled={saving} onClick={() => void handleSave()}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden /> : null}
              Save tokens
            </Button>
          </div>
        }
      />

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" aria-hidden />
        </div>
      ) : (
        <>
          <div
            role="status"
            className="mb-6 rounded-md border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-100"
          >
            Backend endpoint <strong>/cms/public-site-theme</strong> is optional. Without it, tokens persist per tenant in
            this browser so teams can prototype; wire the same JSON to profixer.in or your SSR theme injector.
          </div>

          {saveHint && (
            <div
              className={cn(
                'mb-4 rounded-md border p-3 text-sm',
                saveHint.includes('failed')
                  ? 'border-destructive/50 bg-destructive/10 text-destructive'
                  : 'border-green-200 bg-green-50 text-green-900 dark:border-green-900 dark:bg-green-950/40 dark:text-green-100',
              )}
            >
              {saveHint}
            </div>
          )}

          <p className="mb-4 text-xs text-muted-foreground">
            Loaded from: <strong className="text-foreground">{source}</strong>
          </p>

          <Card className="mb-6">
            <CardContent className="space-y-4 pt-6">
              <div className="mb-2 flex items-center gap-2">
                <Palette className="h-5 w-5 text-primary" aria-hidden />
                <h2 className="text-lg font-semibold tracking-tight">Quick presets</h2>
              </div>
              <div className="flex flex-wrap gap-2">
                {THEME_PRESETS.map((p) => (
                  <Button key={p.name} type="button" size="sm" variant="outline" onClick={() => applyPreset(p.patch)}>
                    {p.name}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-6 pt-6">
              <h2 className="text-lg font-semibold tracking-tight">Tokens</h2>

              <div className="space-y-2">
                <Label htmlFor="brand-logo-url">Brand logo URL (optional)</Label>
                <Input
                  id="brand-logo-url"
                  type="url"
                  inputMode="url"
                  placeholder="https://cdn.example.com/logo.png"
                  value={theme.brandLogoUrl ?? ''}
                  onChange={(e) =>
                    setTheme((t) => ({
                      ...t,
                      brandLogoUrl: e.target.value.trim() || undefined,
                    }))
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Shown on hosted document signing pages (<code className="rounded bg-muted px-1">/api/company-documents/public/sign/…</code>)
                  together with colors and fonts below.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
                {(
                  [
                    ['primaryColor', 'Primary'],
                    ['accentColor', 'Accent'],
                    ['backgroundColor', 'Background'],
                    ['surfaceColor', 'Surface'],
                    ['textColor', 'Text'],
                    ['mutedTextColor', 'Muted text'],
                  ] as const
                ).map(([key, label]) => (
                  <div key={key} className="space-y-2">
                    <Label htmlFor={key}>{label}</Label>
                    <Input
                      id={key}
                      type="color"
                      className="h-12 cursor-pointer p-1"
                      value={theme[key]}
                      onChange={(e) => setTheme((t) => ({ ...t, [key]: e.target.value }))}
                    />
                  </div>
                ))}
              </div>

              <div className="space-y-3">
                <p className="text-sm font-medium">Typography presets</p>
                <div className="flex flex-wrap gap-2">
                  {FONT_PRESETS.map((fp) => (
                    <Button
                      key={fp.label}
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => setTheme((t) => ({ ...t, fontHeading: fp.heading, fontBody: fp.body }))}
                    >
                      {fp.label}
                    </Button>
                  ))}
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="font-heading">Font stack — headings</Label>
                    <Input
                      id="font-heading"
                      value={theme.fontHeading}
                      onChange={(e) => setTheme((t) => ({ ...t, fontHeading: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="font-body">Font stack — body</Label>
                    <Input
                      id="font-body"
                      value={theme.fontBody}
                      onChange={(e) => setTheme((t) => ({ ...t, fontBody: e.target.value }))}
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="radius">Corner radius</Label>
                  <Select
                    value={theme.borderRadius}
                    onValueChange={(v) => setTheme((t) => ({ ...t, borderRadius: v as SiteRadiusPreset }))}
                  >
                    <SelectTrigger id="radius">
                      <SelectValue placeholder="Corner radius" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sm">Small</SelectItem>
                      <SelectItem value="md">Medium</SelectItem>
                      <SelectItem value="lg">Large</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="spacing">Section spacing</Label>
                  <Select
                    value={theme.sectionSpacing}
                    onValueChange={(v) =>
                      setTheme((t) => ({ ...t, sectionSpacing: v as SiteSpacingDensity }))
                    }
                  >
                    <SelectTrigger id="spacing">
                      <SelectValue placeholder="Section spacing" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="compact">Compact</SelectItem>
                      <SelectItem value="comfortable">Comfortable</SelectItem>
                      <SelectItem value="spacious">Spacious</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">Live preview (approximate)</p>
                <div
                  className="border border-border"
                  style={{
                    borderRadius: previewRadius,
                    padding: previewPadding,
                    backgroundColor: theme.surfaceColor,
                    color: theme.textColor,
                    backgroundImage: `linear-gradient(135deg, ${theme.primaryColor}22, ${theme.accentColor}18)`,
                  }}
                >
                  <p className="text-xl font-bold" style={{ fontFamily: theme.fontHeading }}>
                    Section headline
                  </p>
                  <p className="mt-2 text-sm" style={{ fontFamily: theme.fontBody, color: theme.mutedTextColor }}>
                    Body copy uses your muted and surface tokens.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
