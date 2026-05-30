import React, { useMemo, useState } from 'react'
import { Loader2, MapPin, Pencil, Plus, Trash2 } from 'lucide-react'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { Card, CardContent } from '../ui/card'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Switch } from '../ui/switch'
import { Textarea } from '../ui/textarea'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table'
import { cn } from '../../lib/utils'
import { appToast } from '../../lib/appToast'
import { CMSService } from '../../services/api'
import type {
  ServiceCatalogLocalityRow,
  LocalityQualitySignals,
} from '../../hooks/useServiceCatalogLocalities'

function slugifyHint(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/** Convert newline / comma-separated user input into a clean string[]. */
function parseStringList(raw: string): string[] {
  return raw
    .split(/[\n,]+/g)
    .map((s) => s.trim())
    .filter(Boolean)
}

function listToTextarea(items: string[] | undefined): string {
  return (items ?? []).join('\n')
}

const DEFAULT_QUALITY_SIGNALS: LocalityQualitySignals = {
  providerAvailability: false,
  reviewCount: false,
  hasUniqueContent: false,
  faqCoverage: false,
  hasPricingInfo: false,
  searchDemand: false,
  contentQualityScore: 0,
}

/**
 * Quick visual score — counts how many hard signals are truthy, plus a 0–1
 * editorial score. Mirrors the user-site `localityRegistry.ts` floor (0.7+ to
 * enter sitemaps).
 */
function summarizeQuality(signals: LocalityQualitySignals | undefined): {
  hard: number
  total: number
  score: number
  ready: boolean
} {
  const s = signals ?? {}
  const flags = [
    Boolean(s.providerAvailability),
    Boolean(s.reviewCount),
    Boolean(s.hasUniqueContent),
    Boolean(s.faqCoverage),
    Boolean(s.hasPricingInfo),
    Boolean(s.searchDemand),
  ]
  const hard = flags.filter(Boolean).length
  const score = typeof s.contentQualityScore === 'number' ? s.contentQualityScore : 0
  return {
    hard,
    total: flags.length,
    score,
    ready: hard >= 5 && score >= 0.7,
  }
}

type EditState =
  | { mode: 'create' }
  | { mode: 'edit'; row: ServiceCatalogLocalityRow }

type FormState = {
  name: string
  slug: string
  sortOrder: string
  isActive: boolean
  parentCity: string
  neighborhoods: string
  societies: string
  infrastructureFacts: string
  isIndexable: boolean
  qualitySignals: LocalityQualitySignals
}

const EMPTY_FORM: FormState = {
  name: '',
  slug: '',
  sortOrder: '0',
  isActive: true,
  parentCity: 'Mumbai',
  neighborhoods: '',
  societies: '',
  infrastructureFacts: '',
  isIndexable: false,
  qualitySignals: { ...DEFAULT_QUALITY_SIGNALS },
}

export function ServiceCatalogLocalitiesPanel({
  rows,
  loading,
  error,
  onRefresh,
}: {
  rows: ServiceCatalogLocalityRow[]
  loading: boolean
  error: string | null
  onRefresh: () => void | Promise<void>
}) {
  const [dialog, setDialog] = useState<EditState | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [dialogTab, setDialogTab] = useState<'basic' | 'content' | 'quality'>('basic')
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const sorted = useMemo(
    () => [...rows].sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name)),
    [rows],
  )

  const updateForm = (patch: Partial<FormState>) => setForm((prev) => ({ ...prev, ...patch }))
  const updateSignal = (patch: Partial<LocalityQualitySignals>) =>
    setForm((prev) => ({
      ...prev,
      qualitySignals: { ...prev.qualitySignals, ...patch },
    }))

  const openCreate = () => {
    setForm({
      ...EMPTY_FORM,
      sortOrder: String((sorted[sorted.length - 1]?.sortOrder ?? 0) + 10),
    })
    setDialogTab('basic')
    setDialog({ mode: 'create' })
  }

  const openEdit = (row: ServiceCatalogLocalityRow) => {
    setForm({
      name: row.name,
      slug: row.slug,
      sortOrder: String(row.sortOrder),
      isActive: row.isActive,
      parentCity: row.parentCity ?? 'Mumbai',
      neighborhoods: listToTextarea(row.neighborhoods),
      societies: listToTextarea(row.societies),
      infrastructureFacts: listToTextarea(row.infrastructureFacts),
      isIndexable: row.isIndexable ?? false,
      qualitySignals: { ...DEFAULT_QUALITY_SIGNALS, ...(row.qualitySignals ?? {}) },
    })
    setDialogTab('basic')
    setDialog({ mode: 'edit', row })
  }

  const closeDialog = () => {
    if (!saving) setDialog(null)
  }

  const buildPayload = () => {
    const sortOrder = Number.parseInt(form.sortOrder, 10)
    const score = form.qualitySignals.contentQualityScore
    const clampedScore =
      typeof score === 'number' && Number.isFinite(score)
        ? Math.min(1, Math.max(0, score))
        : undefined

    return {
      name: form.name.trim(),
      slug: form.slug.trim() || undefined,
      sortOrder: Number.isFinite(sortOrder) ? sortOrder : 0,
      isActive: form.isActive,
      parentCity: form.parentCity.trim() || undefined,
      neighborhoods: parseStringList(form.neighborhoods),
      societies: parseStringList(form.societies),
      infrastructureFacts: parseStringList(form.infrastructureFacts),
      isIndexable: form.isIndexable,
      qualitySignals: {
        ...form.qualitySignals,
        contentQualityScore: clampedScore,
      },
    }
  }

  const handleSave = async () => {
    const name = form.name.trim()
    if (!name) {
      appToast('Enter a display name (e.g. Mira Road).', 'error')
      return
    }
    setSaving(true)
    try {
      const payload = buildPayload()
      if (dialog?.mode === 'create') {
        await CMSService.createServiceCatalogLocality(payload)
        appToast('Location created.', 'success')
      } else if (dialog?.mode === 'edit') {
        await CMSService.updateServiceCatalogLocality(dialog.row._id, {
          ...payload,
          slug: payload.slug ?? dialog.row.slug,
        })
        appToast('Location updated.', 'success')
      }
      setDialog(null)
      await onRefresh()
    } catch (e: unknown) {
      const msg =
        e && typeof e === 'object' && 'response' in e
          ? (e as { response?: { data?: { error?: string } } }).response?.data?.error
          : undefined
      appToast(msg || (e instanceof Error ? e.message : 'Save failed'), 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (row: ServiceCatalogLocalityRow) => {
    if (
      !window.confirm(
        `Delete “${row.name}” (${row.slug})? Existing CMS keys using this slug are unchanged.`,
      )
    ) {
      return
    }
    setDeletingId(row._id)
    try {
      await CMSService.deleteServiceCatalogLocality(row._id)
      appToast('Location deleted.', 'success')
      await onRefresh()
    } catch (e: unknown) {
      const msg =
        e && typeof e === 'object' && 'response' in e
          ? (e as { response?: { data?: { error?: string } } }).response?.data?.error
          : undefined
      appToast(msg || 'Delete failed', 'error')
    } finally {
      setDeletingId(null)
    }
  }

  const toggleActive = async (row: ServiceCatalogLocalityRow, next: boolean) => {
    try {
      await CMSService.updateServiceCatalogLocality(row._id, { isActive: next })
      appToast(
        next
          ? 'Location activated (URLs live).'
          : 'Location deactivated (404 on consumer).',
        'success',
      )
      await onRefresh()
    } catch (e: unknown) {
      const msg =
        e && typeof e === 'object' && 'response' in e
          ? (e as { response?: { data?: { error?: string } } }).response?.data?.error
          : undefined
      appToast(msg || 'Update failed', 'error')
    }
  }

  const toggleIndexable = async (row: ServiceCatalogLocalityRow, next: boolean) => {
    try {
      await CMSService.updateServiceCatalogLocality(row._id, { isIndexable: next })
      appToast(
        next
          ? 'Marked indexable — will appear in /sitemaps/localities.xml on next regeneration.'
          : 'Removed from sitemap (route still reachable).',
        'success',
      )
      await onRefresh()
    } catch (e: unknown) {
      const msg =
        e && typeof e === 'object' && 'response' in e
          ? (e as { response?: { data?: { error?: string } } }).response?.data?.error
          : undefined
      appToast(msg || 'Update failed', 'error')
    }
  }

  return (
    <Card className="border-border/80 shadow-sm">
      <CardContent className="space-y-4 py-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <MapPin className="h-4 w-4 text-muted-foreground" aria-hidden />
              Service areas (hyperlocal URLs)
            </div>
            <p className="max-w-2xl text-sm text-muted-foreground">
              Controls which locality segments work on{' '}
              <code className="rounded bg-muted px-1 py-0.5 text-xs">
                /services/{'{category}'}/{'{locality}'}
              </code>
              . <strong>Active</strong> = consumer renders 200 (route exists).{' '}
              <strong>Indexable</strong> = the URL enters{' '}
              <code className="rounded bg-muted px-1 py-0.5 text-xs">/sitemaps/localities.xml</code>{' '}
              after passing quality signals. Use deactivate to 404, use de-index to soft-prune
              without breaking URLs. Landing CMS keys use{' '}
              <code className="rounded bg-muted px-1 py-0.5 text-xs">industry__slug</code>.
            </p>
          </div>
          <Button type="button" size="sm" leftIcon={<Plus className="h-4 w-4" />} onClick={openCreate}>
            Add location
          </Button>
        </div>

        {error ? (
          <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        ) : null}

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : sorted.length === 0 ? (
          <p className="rounded-lg border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
            No locations yet. Add one, or run backend{' '}
            <code className="rounded bg-muted px-1 text-xs">npm run seed:service-catalog-localities</code>.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead className="font-mono text-xs">URL slug</TableHead>
                  <TableHead className="hidden md:table-cell">Hyperlocal content</TableHead>
                  <TableHead className="w-[120px] text-center">Quality</TableHead>
                  <TableHead className="w-[88px] text-center">Order</TableHead>
                  <TableHead className="w-[100px] text-center">Active</TableHead>
                  <TableHead className="w-[110px] text-center">Indexable</TableHead>
                  <TableHead className="w-[120px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sorted.map((row) => {
                  const summary = summarizeQuality(row.qualitySignals)
                  const richness = [
                    (row.neighborhoods?.length ?? 0) > 0,
                    (row.societies?.length ?? 0) > 0,
                    (row.infrastructureFacts?.length ?? 0) > 0,
                  ].filter(Boolean).length
                  return (
                    <TableRow key={row._id} className={cn(!row.isActive && 'bg-muted/40')}>
                      <TableCell className="font-medium">
                        <div>{row.name}</div>
                        {row.parentCity ? (
                          <div className="text-[11px] text-muted-foreground">{row.parentCity}</div>
                        ) : null}
                      </TableCell>
                      <TableCell className="font-mono text-xs">{row.slug}</TableCell>
                      <TableCell className="hidden text-[11px] text-muted-foreground md:table-cell">
                        {richness === 0 ? (
                          <span className="italic text-bloom-coral">No hyperlocal fields</span>
                        ) : (
                          <span>
                            {(row.neighborhoods?.length ?? 0)} neighborhoods ·{' '}
                            {(row.societies?.length ?? 0)} societies ·{' '}
                            {(row.infrastructureFacts?.length ?? 0)} infra facts
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant={summary.ready ? 'default' : 'secondary'}
                          className={cn(
                            'tabular-nums text-[11px]',
                            summary.ready
                              ? 'bg-storm-deep hover:bg-storm-deep'
                              : 'text-muted-foreground',
                          )}
                          title={`${summary.hard}/${summary.total} signals · score ${summary.score.toFixed(2)} (floor 0.70)`}
                        >
                          {summary.hard}/{summary.total} · {summary.score.toFixed(2)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center tabular-nums">{row.sortOrder}</TableCell>
                      <TableCell className="text-center">
                        <Switch
                          checked={row.isActive}
                          onCheckedChange={(v) => void toggleActive(row, v)}
                          aria-label={`${row.isActive ? 'Deactivate' : 'Activate'} ${row.name}`}
                        />
                      </TableCell>
                      <TableCell className="text-center">
                        <Switch
                          checked={row.isIndexable ?? false}
                          onCheckedChange={(v) => void toggleIndexable(row, v)}
                          aria-label={`${row.isIndexable ? 'Remove from sitemap' : 'Add to sitemap'} ${row.name}`}
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            title="Edit"
                            onClick={() => openEdit(row)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            title="Delete"
                            disabled={deletingId === row._id}
                            onClick={() => void handleDelete(row)}
                          >
                            {deletingId === row._id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      <Dialog open={dialog !== null} onOpenChange={(o) => !o && closeDialog()}>
        <DialogContent className="max-h-[92vh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {dialog?.mode === 'edit' ? 'Edit location' : 'Add location'}
            </DialogTitle>
          </DialogHeader>

          <Tabs value={dialogTab} onValueChange={(v) => setDialogTab(v as typeof dialogTab)}>
            <TabsList className="mb-3 w-full justify-start">
              <TabsTrigger value="basic">Basic</TabsTrigger>
              <TabsTrigger value="content">Hyperlocal content</TabsTrigger>
              <TabsTrigger value="quality">SEO quality signals</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="loc-name">Display name</Label>
                  <Input
                    id="loc-name"
                    value={form.name}
                    onChange={(e) => {
                      const v = e.target.value
                      updateForm({
                        name: v,
                        slug:
                          dialog?.mode === 'create' ? slugifyHint(v) : form.slug,
                      })
                    }}
                    placeholder="e.g. Borivali West"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="loc-slug">URL slug</Label>
                  <Input
                    id="loc-slug"
                    className="font-mono text-sm"
                    value={form.slug}
                    onChange={(e) => updateForm({ slug: slugifyHint(e.target.value) })}
                    placeholder="borivali-west"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Lowercase hyphens only. Used in CMS key{' '}
                    <span className="font-mono">industry__slug</span>.
                  </p>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="loc-parent-city">Parent city / metro</Label>
                  <Input
                    id="loc-parent-city"
                    value={form.parentCity}
                    onChange={(e) => updateForm({ parentCity: e.target.value })}
                    placeholder="Mumbai"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Used in JSON-LD <span className="font-mono">addressLocality</span> and AI
                    answer-engine context.
                  </p>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="loc-sort">Sort order</Label>
                  <Input
                    id="loc-sort"
                    type="number"
                    value={form.sortOrder}
                    onChange={(e) => updateForm({ sortOrder: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid gap-3 rounded-lg border bg-muted/30 p-3 sm:grid-cols-2">
                <label className="flex items-start gap-2 text-sm">
                  <Switch
                    checked={form.isActive}
                    onCheckedChange={(v) => updateForm({ isActive: v })}
                  />
                  <span>
                    <span className="font-medium">Active</span> — URL renders 200 on the consumer site.
                    Turn off to return 404.
                  </span>
                </label>
                <label className="flex items-start gap-2 text-sm">
                  <Switch
                    checked={form.isIndexable}
                    onCheckedChange={(v) => updateForm({ isIndexable: v })}
                  />
                  <span>
                    <span className="font-medium">Indexable</span> — included in{' '}
                    <span className="font-mono text-xs">/sitemaps/localities.xml</span> when quality
                    signals pass. Soft-prune toggle that keeps URLs reachable.
                  </span>
                </label>
              </div>
            </TabsContent>

            <TabsContent value="content" className="space-y-4">
              <p className="rounded-md border border-bloom-coral/60 bg-bloom-rose px-3 py-2 text-xs text-bloom-coral">
                These inputs feed the CMS prompt in{' '}
                <code className="font-mono">docs/seo/CMS_PROMPT_LOCALITY.md</code> — every locality
                landing the editor generates anchors to these facts. Without them, AI output drifts
                into generic doorway copy and gets de-ranked.
              </p>

              <div className="space-y-1.5">
                <Label htmlFor="loc-neighborhoods">Neighborhoods (one per line, or comma-separated)</Label>
                <Textarea
                  id="loc-neighborhoods"
                  rows={4}
                  value={form.neighborhoods}
                  onChange={(e) => updateForm({ neighborhoods: e.target.value })}
                  placeholder={'Mira Road East\nBhayandar West\nJP North\nShanti Park'}
                />
                <p className="text-[11px] text-muted-foreground">
                  4–8 real neighborhoods inside this locality. Drives intro / FAQ / localityGuide
                  prose.
                </p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="loc-societies">Notable societies / housing complexes</Label>
                <Textarea
                  id="loc-societies"
                  rows={4}
                  value={form.societies}
                  onChange={(e) => updateForm({ societies: e.target.value })}
                  placeholder={'Cosmos Lounge\nKanakia Sevens\nRoyal Palms\nJP Infra towers'}
                />
                <p className="text-[11px] text-muted-foreground">
                  3–6 real societies — search them on 99acres to verify. Locality landings name
                  these by hand to prove on-the-ground knowledge.
                </p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="loc-infra">Infrastructure & local truth facts</Label>
                <Textarea
                  id="loc-infra"
                  rows={5}
                  value={form.infrastructureFacts}
                  onChange={(e) => updateForm({ infrastructureFacts: e.target.value })}
                  placeholder={
                    'Monsoon waterlogging on Mira-Bhayandar road\nHumidity-driven mold near creek\nMany 1990s–2000s buildings with aluminum wiring\nLift outages during 11am–2pm power dips'
                  }
                />
                <p className="text-[11px] text-muted-foreground">
                  3–8 specific facts. Each one should be{' '}
                  <em>only true here</em> — if you can swap the locality name and the fact still
                  reads true, drop it.
                </p>
              </div>
            </TabsContent>

            <TabsContent value="quality" className="space-y-4">
              <p className="rounded-md border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
                These signals mirror{' '}
                <code className="font-mono">localityRegistry.ts</code> on the user site. The
                consumer's sitemap generator excludes localities that don't pass these checks —
                this panel is where editorial promotes pairs without engineering touching code.
              </p>

              <div className="grid gap-3 sm:grid-cols-2">
                <SignalToggle
                  label="Verified providers available"
                  description="At least one verified pro covers this locality in any industry."
                  checked={Boolean(form.qualitySignals.providerAvailability)}
                  onCheckedChange={(v) => updateSignal({ providerAvailability: v })}
                />
                <SignalToggle
                  label="Has reviews / ratings"
                  description="Real customer reviews exist (or aggregate rating from the parent city)."
                  checked={Boolean(form.qualitySignals.reviewCount)}
                  onCheckedChange={(v) => updateSignal({ reviewCount: v })}
                />
                <SignalToggle
                  label="Unique CMS content"
                  description="At least one (category, locality) pair has localityGuide.enabled === true."
                  checked={Boolean(form.qualitySignals.hasUniqueContent)}
                  onCheckedChange={(v) => updateSignal({ hasUniqueContent: v })}
                />
                <SignalToggle
                  label="Locality-specific FAQs (≥3)"
                  description="At least 3 FAQs include the locality or a neighborhood name."
                  checked={Boolean(form.qualitySignals.faqCoverage)}
                  onCheckedChange={(v) => updateSignal({ faqCoverage: v })}
                />
                <SignalToggle
                  label="Localized pricing band visible"
                  description="Locality landings expose a real price range (not generic copy)."
                  checked={Boolean(form.qualitySignals.hasPricingInfo)}
                  onCheckedChange={(v) => updateSignal({ hasPricingInfo: v })}
                />
                <SignalToggle
                  label="Measurable search demand"
                  description="Real organic-search demand confirmed in GSC / Keyword Planner."
                  checked={Boolean(form.qualitySignals.searchDemand)}
                  onCheckedChange={(v) => updateSignal({ searchDemand: v })}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="loc-score">Editorial quality score (0–1)</Label>
                <div className="flex items-center gap-3">
                  <Input
                    id="loc-score"
                    type="number"
                    min={0}
                    max={1}
                    step={0.05}
                    className="max-w-[120px]"
                    value={
                      typeof form.qualitySignals.contentQualityScore === 'number'
                        ? form.qualitySignals.contentQualityScore
                        : 0
                    }
                    onChange={(e) => {
                      const n = Number(e.target.value)
                      updateSignal({
                        contentQualityScore: Number.isFinite(n)
                          ? Math.min(1, Math.max(0, n))
                          : 0,
                      })
                    }}
                  />
                  <span className="text-xs text-muted-foreground">
                    Floor for sitemap inclusion: <strong>0.70</strong>.{' '}
                    {(() => {
                      const score = form.qualitySignals.contentQualityScore ?? 0
                      if (score >= 0.7)
                        return (
                          <span className="font-medium text-storm-deep">
                            Passes — eligible for sitemap.
                          </span>
                        )
                      return (
                        <span className="font-medium text-bloom-coral">
                          Below floor — will stay out of sitemap.
                        </span>
                      )
                    })()}
                  </span>
                </div>
              </div>

              {(() => {
                const summary = summarizeQuality(form.qualitySignals)
                return (
                  <div className="rounded-md border bg-background px-3 py-2 text-xs">
                    <span className="font-semibold">Readiness:</span> {summary.hard}/{summary.total}{' '}
                    hard signals · score {summary.score.toFixed(2)} ·{' '}
                    {summary.ready ? (
                      <span className="font-medium text-storm-deep">ready to promote</span>
                    ) : (
                      <span className="font-medium text-bloom-coral">not ready yet</span>
                    )}
                  </div>
                )
              })()}
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={closeDialog} disabled={saving}>
              Cancel
            </Button>
            <Button type="button" onClick={() => void handleSave()} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Save
                </>
              ) : (
                'Save'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}

function SignalToggle({
  label,
  description,
  checked,
  onCheckedChange,
}: {
  label: string
  description: string
  checked: boolean
  onCheckedChange: (next: boolean) => void
}) {
  return (
    <label className="flex items-start gap-2 rounded-md border bg-background px-3 py-2 text-sm">
      <Switch checked={checked} onCheckedChange={onCheckedChange} className="mt-0.5" />
      <span className="space-y-0.5">
        <span className="block font-medium">{label}</span>
        <span className="block text-[11px] text-muted-foreground">{description}</span>
      </span>
    </label>
  )
}
