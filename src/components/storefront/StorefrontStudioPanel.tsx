import React, { useEffect, useMemo, useState } from 'react'
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  HStack,
  Input,
  Label,
  Separator,
  Switch,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Textarea,
} from '../ui'
import { ExternalLink, Loader2, Lock, ShieldCheck, Sparkles } from 'lucide-react'
import {
  storefrontStudioService,
  type StorefrontConfig,
  type StorefrontConfigFeatureFlags,
  type StorefrontConfigPatch,
} from '../../services/api/storefrontStudio.service'
import { StorefrontOrderingHoursEditor } from './studio/StorefrontOrderingHoursEditor'
import { StorefrontOrderingAvailabilityEditor } from './studio/StorefrontOrderingAvailabilityEditor'
import { StorefrontShippingPolicyEditor } from './studio/StorefrontShippingPolicyEditor'
import { StorefrontSectionEditor } from './studio/StorefrontSectionEditor'
import { StorefrontSeoPagesEditor } from './studio/StorefrontSeoPagesEditor'
import { StorefrontThemeMarketplace } from './studio/StorefrontThemeMarketplace'
import { StorefrontAddonsSection } from './studio/StorefrontAddonsSection'
import { StorefrontAiCopySection } from './studio/StorefrontAiCopySection'
import { StorefrontEmailSettings } from './StorefrontEmailSettings'
import { ImageUrlField } from './studio/ImageUrlField'
import { isLocalAdminHost, platformStorefrontDevUrl, platformStorefrontProdUrl } from '../../lib/storefrontUrls'
import { usePermissions } from '../../hooks/usePermissions'

const FLAGS: Array<{ key: keyof StorefrontConfigFeatureFlags; label: string; upsell?: boolean }> = [
  { key: 'showHero', label: 'Hero' },
  { key: 'showServices', label: 'Services' },
  { key: 'showProducts', label: 'Products' },
  { key: 'showMenu', label: 'Menu' },
  { key: 'showReservations', label: 'Reservations', upsell: true },
  { key: 'showBooking', label: 'Booking', upsell: true },
  { key: 'showWishlist', label: 'Wishlist', upsell: true },
  { key: 'showReviews', label: 'Reviews' },
  { key: 'showLiveChat', label: 'Live chat', upsell: true },
  { key: 'showWhatsAppButton', label: 'WhatsApp', upsell: true },
]

function isLocked(locks: string[], path: string): boolean {
  if (!locks?.length) return false
  if (locks.includes(path)) return true
  return locks.some((l) => l.endsWith('.*') && (path === l.slice(0, -2) || path.startsWith(l.slice(0, -1))))
}

export function StorefrontStudioPanel({
  tenantId,
  tenantSlug,
  isSuperAdmin,
}: {
  tenantId: string
  tenantSlug: string
  isSuperAdmin: boolean
}) {
  const { checkPermission, checkAnyPermission } = usePermissions()
  const canEditBranding = checkPermission('edit_storefront_branding')
  const canEditTheme = checkPermission('edit_storefront_theme')
  const canEditSections = checkPermission('edit_storefront_sections')
  const canEditSeo = checkPermission('edit_storefront_seo')
  const canEditContent = checkPermission('edit_storefront_content')
  const canManageAddons = checkPermission('manage_storefront_addons')
  const canSave = checkAnyPermission([
    'edit_storefront_branding',
    'edit_storefront_theme',
    'edit_storefront_sections',
    'edit_storefront_seo',
    'edit_storefront_content',
    'manage_storefront_addons',
    'manage_cms',
    'edit_settings',
  ])
  const defaultTab = canEditBranding
    ? 'branding'
    : canEditSeo
      ? 'seo'
      : canEditSections
        ? 'sections'
        : canEditTheme
          ? 'themes'
          : canEditContent
            ? 'copy'
            : canManageAddons
              ? 'addons'
              : 'branding'

  const [cfg, setCfg] = useState<StorefrontConfig | null>(null)
  const [catalog, setCatalog] = useState<{
    themes: import('../../services/api/storefrontStudio.service').StorefrontThemeCatalogItem[]
    addons: import('../../services/api/storefrontStudio.service').StorefrontAddonCatalogItem[]
    sections: import('../../services/api/storefrontStudio.service').StorefrontSectionCatalogItem[]
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)

  const previewUrl = useMemo(
    () => (isLocalAdminHost() ? platformStorefrontDevUrl(tenantSlug) : platformStorefrontProdUrl(tenantSlug)),
    [tenantSlug],
  )

  useEffect(() => {
    let alive = true
    setLoading(true)
    setLoadError(null)
    const fetcher = isSuperAdmin
      ? storefrontStudioService.getForTenant(tenantId)
      : storefrontStudioService.getMine()
    fetcher
      .then((res) => {
        if (!alive) return
        if (res?.success && res.data) {
          setCfg(res.data)
          const meta = (res as { meta?: { catalog?: typeof catalog } }).meta
          if (meta?.catalog) setCatalog(meta.catalog)
        } else {
          setLoadError('Storefront config endpoint returned no data.')
        }
      })
      .catch((err: { message?: string; code?: string; status?: number }) => {
        if (!alive) return
        const detail = err?.status === 404
          ? 'Storefront Studio API not deployed yet. Restart the backend after pulling the latest changes.'
          : err?.message || 'Unable to load storefront config.'
        setLoadError(detail)
      })
      .finally(() => {
        if (alive) setLoading(false)
      })
    return () => {
      alive = false
    }
  }, [tenantId, isSuperAdmin])

  const save = async (patch?: StorefrontConfigPatch) => {
    if (!cfg) return
    setSaving(true)
    try {
      const body = patch ?? {
        branding: cfg.branding,
        seo: cfg.seo,
        featureFlags: cfg.featureFlags,
        themeKey: cfg.themeKey,
        sections: cfg.sections,
        content: cfg.content,
        templateSettings: cfg.templateSettings,
        orderingHours: cfg.orderingHours,
        orderingAvailability: cfg.orderingAvailability,
        shippingPolicy: cfg.shippingPolicy,
        customCss: cfg.customCss,
        customHeadScripts: cfg.customHeadScripts,
        customBodyScripts: cfg.customBodyScripts,
        superAdminLocks: isSuperAdmin ? cfg.superAdminLocks : undefined,
      }
      const res = isSuperAdmin
        ? await storefrontStudioService.patchForTenant(tenantId, body)
        : await storefrontStudioService.patchMine(body)
      if (res?.success && res.data) setCfg(res.data)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-sm text-muted-foreground">
          <Loader2 className="mr-2 inline h-4 w-4 animate-spin" />
          Loading Storefront Studio…
        </CardContent>
      </Card>
    )
  }

  if (loadError || !cfg) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <Sparkles className="h-4 w-4" />
            Storefront Studio
          </CardTitle>
        </CardHeader>
        <CardContent className="py-4 text-sm">
          <p className="text-destructive">{loadError ?? 'Storefront config unavailable.'}</p>
          <p className="mt-2 text-xs text-muted-foreground">
            Tenant ID: <code className="text-[11px]">{tenantId}</code>
          </p>
        </CardContent>
      </Card>
    )
  }

  const locks = cfg.superAdminLocks ?? []
  const themes = catalog?.themes ?? []
  const addons = catalog?.addons ?? []
  const sectionCatalog = catalog?.sections ?? []

  return (
    <Card>
      <CardHeader>
        <HStack justify="between" align="center">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Sparkles className="h-4 w-4" />
            Storefront Studio
            {isSuperAdmin && (
              <Badge variant="outline" className="gap-1">
                <ShieldCheck className="h-3 w-3" />
                Super-admin
              </Badge>
            )}
          </CardTitle>
          <HStack spacing={2}>
            {previewUrl && (
              <Button type="button" size="sm" variant="outline" asChild>
                <a href={previewUrl} target="_blank" rel="noreferrer">
                  <ExternalLink className="mr-1 h-3 w-3" />
                  Preview
                </a>
              </Button>
            )}
            {canSave && (
              <Button type="button" size="sm" onClick={() => save()} disabled={saving}>
                {saving ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : null}
                Save
              </Button>
            )}
          </HStack>
        </HStack>
        <p className="text-xs text-muted-foreground">
          SEO: <code className="text-[11px]">{previewUrl}/sitemap.xml</code> ·{' '}
          <code className="text-[11px]">{previewUrl}/robots.txt</code>
        </p>
      </CardHeader>
      <CardContent>
        {!canSave ? (
          <div className="space-y-3 text-sm text-muted-foreground">
            <p>You have read-only access to Storefront Studio. Use Preview to open the live site.</p>
            <p>
              Theme: <span className="font-medium text-foreground">{cfg.themeKey ?? 'default'}</span>
              {' · '}
              Site: <span className="font-medium text-foreground">{cfg.branding?.siteName ?? '—'}</span>
            </p>
          </div>
        ) : (
        <Tabs defaultValue={defaultTab}>
          <TabsList className="mb-4 flex flex-wrap h-auto gap-1">
            {canEditBranding && <TabsTrigger value="email">Email</TabsTrigger>}
            {canEditBranding && <TabsTrigger value="branding">Branding</TabsTrigger>}
            {canEditBranding && <TabsTrigger value="availability">Availability</TabsTrigger>}
            {canEditSeo && <TabsTrigger value="seo">SEO</TabsTrigger>}
            {canEditSeo && <TabsTrigger value="pages">Per-page SEO</TabsTrigger>}
            {canEditSections && <TabsTrigger value="sections">Sections</TabsTrigger>}
            {canEditTheme && <TabsTrigger value="themes">Themes</TabsTrigger>}
            {canEditContent && <TabsTrigger value="copy">AI copy</TabsTrigger>}
            {canManageAddons && <TabsTrigger value="addons">Add-ons</TabsTrigger>}
            {isSuperAdmin && <TabsTrigger value="flags">Flags</TabsTrigger>}
          </TabsList>

          <TabsContent value="email">
            <StorefrontEmailSettings />
          </TabsContent>

          <TabsContent value="branding" className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Site name">
                <Input
                  value={cfg.branding?.siteName ?? ''}
                  onChange={(e) => setCfg({ ...cfg, branding: { ...cfg.branding, siteName: e.target.value } })}
                />
              </Field>
              <Field label="Tagline">
                <Input
                  value={cfg.branding?.tagline ?? ''}
                  onChange={(e) => setCfg({ ...cfg, branding: { ...cfg.branding, tagline: e.target.value } })}
                />
              </Field>
              <Field label="Primary color">
                <Input
                  type="color"
                  value={cfg.branding?.primaryColor ?? '#0f172a'}
                  onChange={(e) =>
                    setCfg({ ...cfg, branding: { ...cfg.branding, primaryColor: e.target.value } })
                  }
                />
              </Field>
              <ImageUrlField
                label="Logo"
                value={cfg.branding?.logoUrl ?? ''}
                onChange={(v) => setCfg({ ...cfg, branding: { ...cfg.branding, logoUrl: v } })}
                folder={`storefront/${tenantSlug}/branding`}
              />
              <ImageUrlField
                label="Favicon"
                value={cfg.branding?.faviconUrl ?? ''}
                onChange={(v) => setCfg({ ...cfg, branding: { ...cfg.branding, faviconUrl: v } })}
                folder={`storefront/${tenantSlug}/branding`}
                hint="32×32 or 64×64, transparent PNG / SVG."
              />
            </div>
          </TabsContent>

          <TabsContent value="availability" className="space-y-3">
            <StorefrontOrderingHoursEditor
              value={cfg.orderingHours}
              onChange={(orderingHours) => setCfg({ ...cfg, orderingHours })}
            />
            <StorefrontOrderingAvailabilityEditor
              value={cfg.orderingAvailability}
              onChange={(orderingAvailability) => setCfg({ ...cfg, orderingAvailability })}
            />
            <StorefrontShippingPolicyEditor
              value={cfg.shippingPolicy}
              onChange={(shippingPolicy) => setCfg({ ...cfg, shippingPolicy })}
            />
          </TabsContent>

          <TabsContent value="seo" className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Title template" hint='%s | Your Brand'>
                <Input
                  value={cfg.seo?.titleTemplate ?? ''}
                  onChange={(e) => setCfg({ ...cfg, seo: { ...cfg.seo, titleTemplate: e.target.value } })}
                />
              </Field>
              <Field label="Default title">
                <Input
                  value={cfg.seo?.defaultTitle ?? ''}
                  onChange={(e) => setCfg({ ...cfg, seo: { ...cfg.seo, defaultTitle: e.target.value } })}
                />
              </Field>
              <Field label="Default description" className="sm:col-span-2">
                <Textarea
                  rows={2}
                  value={cfg.seo?.defaultDescription ?? ''}
                  onChange={(e) =>
                    setCfg({ ...cfg, seo: { ...cfg.seo, defaultDescription: e.target.value } })
                  }
                />
              </Field>
              <Field label="Canonical domain">
                <Input
                  value={cfg.seo?.canonicalDomain ?? ''}
                  onChange={(e) => setCfg({ ...cfg, seo: { ...cfg.seo, canonicalDomain: e.target.value } })}
                />
              </Field>
              <ImageUrlField
                label="OG image (1200×630)"
                value={cfg.seo?.ogImageUrl ?? ''}
                onChange={(v) => setCfg({ ...cfg, seo: { ...cfg.seo, ogImageUrl: v } })}
                folder={`storefront/${tenantSlug}/seo`}
                hint="Shown in Google + WhatsApp + Facebook link previews."
              />
            </div>
            <ToggleRow
              label="Sitemap enabled"
              checked={cfg.seo?.sitemapEnabled !== false}
              onChange={(v) => setCfg({ ...cfg, seo: { ...cfg.seo, sitemapEnabled: v } })}
            />
            <ToggleRow
              label="Indexable"
              checked={cfg.seo?.robots?.indexable !== false}
              onChange={(v) =>
                setCfg({
                  ...cfg,
                  seo: { ...cfg.seo, robots: { ...(cfg.seo?.robots ?? { followLinks: true }), indexable: v } },
                })
              }
            />
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Google Analytics">
                <Input
                  value={cfg.seo?.analytics?.googleAnalyticsId ?? ''}
                  onChange={(e) =>
                    setCfg({
                      ...cfg,
                      seo: {
                        ...cfg.seo,
                        analytics: { ...cfg.seo?.analytics, googleAnalyticsId: e.target.value },
                      },
                    })
                  }
                />
              </Field>
              <Field label="Meta Pixel">
                <Input
                  value={cfg.seo?.analytics?.metaPixelId ?? ''}
                  onChange={(e) =>
                    setCfg({
                      ...cfg,
                      seo: { ...cfg.seo, analytics: { ...cfg.seo?.analytics, metaPixelId: e.target.value } },
                    })
                  }
                />
              </Field>
            </div>
          </TabsContent>

          <TabsContent value="pages">
            <StorefrontSeoPagesEditor
              seo={cfg.seo ?? {}}
              onChange={(seo) => setCfg({ ...cfg, seo })}
            />
          </TabsContent>

          <TabsContent value="sections">
            <p className="text-xs text-muted-foreground mb-3">Drag to reorder homepage blocks.</p>
            {cfg.sections && sectionCatalog.length > 0 ? (
              <StorefrontSectionEditor
                sections={cfg.sections}
                catalog={sectionCatalog}
                onChange={(sections) => setCfg({ ...cfg, sections })}
              />
            ) : (
              <p className="text-sm text-muted-foreground">Save once to initialize sections.</p>
            )}
          </TabsContent>

          <TabsContent value="themes">
            {themes.length > 0 ? (
              <StorefrontThemeMarketplace
                themes={themes}
                selectedKey={cfg.themeKey ?? 'classic'}
                isSuperAdmin={isSuperAdmin}
                templateSettings={cfg.templateSettings ?? {}}
                onSelect={(themeKey) => {
                  setCfg({ ...cfg, themeKey })
                  void save({ themeKey })
                }}
                onTemplateSettingChange={(themeKey, patch) => {
                  const next = {
                    ...(cfg.templateSettings ?? {}),
                    [themeKey]: {
                      ...(cfg.templateSettings?.[themeKey] ?? {}),
                      ...patch,
                    },
                  }
                  setCfg({ ...cfg, templateSettings: next })
                  void save({ templateSettings: next })
                }}
              />
            ) : (
              <p className="text-sm text-muted-foreground">Reload to load theme catalog.</p>
            )}
          </TabsContent>

          <TabsContent value="copy">
            <StorefrontAiCopySection
              cfg={cfg}
              isSuperAdmin={isSuperAdmin}
              tenantId={tenantId}
              onApplyContent={(content) => setCfg({ ...cfg, content })}
              onGenerate={async (opts) => {
                const res = isSuperAdmin
                  ? await storefrontStudioService.generateCopyForTenant(tenantId, opts)
                  : await storefrontStudioService.generateCopyMine(opts)
                if (res?.success && res.data?.config) setCfg(res.data.config)
              }}
            />
          </TabsContent>

          <TabsContent value="addons">
            <StorefrontAddonsSection
              cfg={cfg}
              addons={addons}
              isSuperAdmin={isSuperAdmin}
              tenantId={tenantId}
              brandColor={cfg.branding?.primaryColor}
              brandName={cfg.branding?.siteName || tenantSlug}
              prefill={{
                email: cfg.branding?.contactEmail,
                contact: cfg.branding?.contactPhone,
              }}
              onConfigUpdated={(next) => setCfg(next)}
              onGrant={async (flagKey, sku) => {
                const res = await storefrontStudioService.grantAddon(tenantId, flagKey, sku)
                if (res?.success && res.data) setCfg(res.data as StorefrontConfig)
              }}
              onRevoke={async (flagKey) => {
                const res = await storefrontStudioService.revokeAddon(tenantId, flagKey)
                if (res?.success && res.data) setCfg(res.data as StorefrontConfig)
              }}
            />
          </TabsContent>

          {isSuperAdmin && (
            <TabsContent value="flags">
              <div className="grid gap-2 sm:grid-cols-2">
                {FLAGS.map((f) => {
                  const path = `featureFlags.${String(f.key)}`
                  const locked = isLocked(locks, path) || locks.includes('featureFlags.*')
                  return (
                    <div
                      key={String(f.key)}
                      className="flex items-center justify-between rounded border border-border p-2"
                    >
                      <span className="text-sm">
                        {f.label}
                        {f.upsell && <Badge className="ml-1" variant="secondary">upsell</Badge>}
                        {locked && <Lock className="inline ml-1 h-3 w-3" />}
                      </span>
                      <Switch
                        checked={Boolean(cfg.featureFlags?.[f.key])}
                        onCheckedChange={(v) =>
                          setCfg({
                            ...cfg,
                            featureFlags: { ...cfg.featureFlags, [f.key]: v },
                          })
                        }
                      />
                    </div>
                  )
                })}
              </div>
              <Separator className="my-4" />
              <Field label="Head scripts">
                <Textarea
                  rows={3}
                  value={cfg.customHeadScripts ?? ''}
                  onChange={(e) => setCfg({ ...cfg, customHeadScripts: e.target.value })}
                />
              </Field>
            </TabsContent>
          )}
        </Tabs>
        )}
      </CardContent>
    </Card>
  )
}

function Field({
  label,
  hint,
  children,
  className,
}: {
  label: string
  hint?: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={className}>
      <Label className="mb-1 block text-xs">{label}</Label>
      {children}
      {hint && <p className="mt-1 text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  )
}

function ToggleRow({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between rounded border border-border p-2">
      <span className="text-sm">{label}</span>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  )
}
