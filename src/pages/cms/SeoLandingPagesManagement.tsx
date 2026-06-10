import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { FileSearch, Loader2, Plus, Save, Trash2 } from 'lucide-react'
import { Card, CardContent } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { Textarea } from '../../components/ui/textarea'
import { Switch } from '../../components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs'
import { PageHeader } from '../../components/common/PageHeader'
import { CMSService } from '../../services/api'
import { useCmsCatalogCategories } from '../../hooks/useCmsCatalogCategories'
import { usePermissions } from '../../hooks/usePermissions'
import { appToast } from '../../lib/appToast'
import { cn } from '../../lib/utils'
import { SeoSectionsEditor } from '../../components/cms/SeoSectionsEditor'
import type { ContentSection } from '../../types/seoLandingSections'

type EntityKind =
  | 'problems'
  | 'cost-guides'
  | 'guides'
  | 'providers'
  | 'locations'
  | 'landing-pages'

type EntityDraft = Record<string, unknown>

const KIND_LABELS: Record<EntityKind, string> = {
  problems: 'Problems (/problems)',
  'cost-guides': 'Service charges (/charges)',
  guides: 'How-to guides (/guide)',
  providers: 'Providers (/provider)',
  locations: 'Areas (/areas)',
  'landing-pages': 'Local pages (/…)',
}

const KIND_PUBLIC_PATH: Record<EntityKind, string> = {
  problems: '/problems',
  'cost-guides': '/charges',
  guides: '/guide',
  providers: '/provider',
  locations: '/areas',
  // Flat top-level "money page" slug — no path prefix.
  'landing-pages': '',
}

/** Public URL for a record key. */
function publicUrlForKey(kind: EntityKind, key: string): string {
  return `${KIND_PUBLIC_PATH[kind]}/${key}`
}

function emptyDraft(kind: EntityKind, slug: string): EntityDraft {
  const base: EntityDraft = {
    slug,
    title: '',
    quickAnswer: '',
    keyTakeaways: [],
    body: '',
    sections: [],
    faqs: [],
    seo: { noindex: false },
  }
  if (kind === 'problems' || kind === 'cost-guides') {
    base.serviceSlug = 'ac-repair'
  }
  if (kind === 'cost-guides') {
    base.year = new Date().getFullYear()
    base.priceTable = []
  }
  if (kind === 'guides') {
    base.howToSteps = []
  }
  if (kind === 'providers') {
    return {
      slug,
      name: '',
      bio: '',
      servicesOffered: ['electrician'],
      areasServed: ['mira-road'],
      reviews: [],
      faqs: [],
      seo: { noindex: false },
    }
  }
  if (kind === 'locations') {
    return {
      slug,
      name: '',
      city: 'Mumbai',
      region: 'Maharashtra',
      subtitle: '',
      quickAnswer: '',
      neighbours: [],
      stats: { providers: 45, jobsCompleted: 1200, avgRating: 4.8 },
      sections: [],
      faqs: [],
      seo: { noindex: false },
    }
  }
  if (kind === 'landing-pages') {
    return {
      slug,
      title: '',
      serviceSlug: 'ac-repair',
      locationSlug: 'mira-road',
      locationName: '',
      quickAnswer: '',
      keyTakeaways: [],
      priceTable: [],
      priceTableCaption: '',
      sections: [],
      faqs: [],
      // Self-canonical by default → a real indexable money page. Point this at
      // /services/{service}/{locality} instead if you see cannibalization.
      seo: { noindex: false, canonicalPath: slug ? `/${slug}` : '' },
    }
  }
  return base
}

async function fetchKindRecord(kind: EntityKind): Promise<Record<string, unknown>> {
  switch (kind) {
    case 'problems':
      return CMSService.getSeoProblems()
    case 'cost-guides':
      return CMSService.getSeoCostGuides()
    case 'guides':
      return CMSService.getSeoGuides()
    case 'providers':
      return CMSService.getSeoProviders()
    case 'locations':
      return CMSService.getSeoLocations()
    case 'landing-pages':
      return CMSService.getSeoLandingPages()
  }
}

async function saveKindRecord(kind: EntityKind, data: Record<string, unknown>) {
  switch (kind) {
    case 'problems':
      return CMSService.updateSeoProblems(data)
    case 'cost-guides':
      return CMSService.updateSeoCostGuides(data)
    case 'guides':
      return CMSService.updateSeoGuides(data)
    case 'providers':
      return CMSService.updateSeoProviders(data)
    case 'locations':
      return CMSService.updateSeoLocations(data)
    case 'landing-pages':
      return CMSService.updateSeoLandingPages(data)
  }
}

function linesToArray(text: string): string[] {
  return text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
}

function arrayToLines(arr: unknown): string {
  if (!Array.isArray(arr)) return ''
  return arr.map(String).join('\n')
}

function parseJsonField<T>(raw: string, fallback: T): T {
  try {
    const parsed = JSON.parse(raw)
    return parsed as T
  } catch {
    return fallback
  }
}

const strip = (s?: string) => (s ?? '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()

/** Plain-text length of body + structured sections — mirrors the consumer publish gate. */
function effectiveBodyLength(draft: EntityDraft): number {
  let len = strip(String(draft.body ?? '')).length
  const sections = Array.isArray(draft.sections) ? (draft.sections as ContentSection[]) : []
  for (const s of sections) {
    len += strip(s.heading).length
    if (s.type === 'rich_text' || s.type === 'callout') len += strip(s.html).length
    if (s.type === 'key_takeaways') len += (s.items ?? []).join(' ').length
    if (s.type === 'faqs') len += (s.faqs ?? []).reduce((n, f) => n + f.question.length + strip(f.answer).length, 0)
    if (s.type === 'how_to') len += (s.steps ?? []).reduce((n, st) => n + st.name.length + st.text.length, 0)
    if (s.type === 'causes') len += (s.causes ?? []).reduce((n, c) => n + c.cause.length + c.fix.length, 0)
    if (s.type === 'price_table') len += (s.rows ?? []).reduce((n, r) => n + r.item.length + (r.note?.length ?? 0), 0)
    if (s.type === 'cards')
      len += (s.cards ?? []).reduce(
        (n, c) => n + c.title.length + (c.description?.length ?? 0) + (c.value?.length ?? 0),
        0,
      )
  }
  return len
}

export default function SeoLandingPagesManagement() {
  const { checkPermission } = usePermissions()
  const canMutate = checkPermission('manage_system_settings')
  const { options: catalogOptions } = useCmsCatalogCategories()

  const [kind, setKind] = useState<EntityKind>('problems')
  const [records, setRecords] = useState<Record<string, EntityDraft>>({})
  const [selectedSlug, setSelectedSlug] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [newSlug, setNewSlug] = useState('')

  const slugs = useMemo(() => Object.keys(records).sort(), [records])
  const draft: EntityDraft = useMemo(
    () => (selectedSlug ? records[selectedSlug] ?? emptyDraft(kind, selectedSlug) : emptyDraft(kind, '')),
    [records, selectedSlug, kind],
  )

  const load = useCallback(async () => {
    try {
      setLoading(true)
      const raw = await fetchKindRecord(kind)
      const map: Record<string, EntityDraft> = {}
      if (raw && typeof raw === 'object') {
        for (const [key, value] of Object.entries(raw)) {
          if (value && typeof value === 'object') {
            map[key] = { ...(value as EntityDraft), slug: key }
          }
        }
      }
      setRecords(map)
      const first = Object.keys(map).sort()[0] ?? ''
      setSelectedSlug((prev) => (prev && map[prev] ? prev : first))
    } catch (e: unknown) {
      console.error(e)
      appToast('Failed to load SEO landing pages', 'error')
      setRecords({})
      setSelectedSlug('')
    } finally {
      setLoading(false)
    }
  }, [kind])

  useEffect(() => {
    load()
  }, [load])

  const patchDraft = (patch: Partial<EntityDraft>) => {
    if (!selectedSlug) return
    setRecords((prev) => ({
      ...prev,
      [selectedSlug]: { ...emptyDraft(kind, selectedSlug), ...prev[selectedSlug], ...patch, slug: selectedSlug },
    }))
  }

  const handleSave = async () => {
    if (!canMutate) return
    try {
      setSaving(true)
      await saveKindRecord(kind, records)
      appToast(`${KIND_LABELS[kind]} saved.`, 'success')
      await load()
    } catch (e: unknown) {
      console.error(e)
      appToast('Save failed — check API static-content route is provisioned.', 'error')
    } finally {
      setSaving(false)
    }
  }

  const addSlug = () => {
    const slug = newSlug.trim().toLowerCase().replace(/\s+/g, '-')
    if (!slug) return
    if (records[slug]) {
      appToast('Slug already exists', 'error')
      return
    }
    setRecords((prev) => ({ ...prev, [slug]: emptyDraft(kind, slug) }))
    setSelectedSlug(slug)
    setNewSlug('')
  }

  const removeSlug = () => {
    if (!selectedSlug) return
    const next = { ...records }
    delete next[selectedSlug]
    setRecords(next)
    setSelectedSlug(Object.keys(next).sort()[0] ?? '')
  }

  const isProvider = kind === 'providers'
  const isLocation = kind === 'locations'

  return (
    <div className="p-4 sm:p-6 md:p-8">
      <PageHeader
        title="SEO landing pages"
        subtitle="Programmatic pages: /charges, /problems, /guide, /provider, /areas & flat local pages — synced to the consumer site via static-content CMS blobs."
        action={
          <Button onClick={handleSave} disabled={saving || !canMutate} className="rounded-md">
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save all
          </Button>
        }
      />

      <Tabs value={kind} onValueChange={(v) => setKind(v as EntityKind)} className="mt-4">
        <TabsList className="mb-4 flex flex-wrap h-auto">
          {(Object.keys(KIND_LABELS) as EntityKind[]).map((k) => (
            <TabsTrigger key={k} value={k} className="text-xs sm:text-sm">
              {KIND_LABELS[k]}
            </TabsTrigger>
          ))}
        </TabsList>

        {(Object.keys(KIND_LABELS) as EntityKind[]).map((k) => (
          <TabsContent key={k} value={k} className="mt-0">
            {loading ? (
              <div className="flex min-h-[320px] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-[240px_1fr]">
                <Card className="rounded-md">
                  <CardContent className="p-4 space-y-3">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Pages</p>
                    <ul className="max-h-[420px] overflow-y-auto space-y-1">
                      {slugs.length === 0 ? (
                        <li className="text-sm text-muted-foreground">No pages yet — add a slug.</li>
                      ) : (
                        slugs.map((s) => (
                          <li key={s}>
                            <button
                              type="button"
                              onClick={() => setSelectedSlug(s)}
                              className={cn(
                                'w-full rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted',
                                selectedSlug === s && 'bg-primary/10 font-medium text-primary',
                              )}
                            >
                              {s}
                            </button>
                          </li>
                        ))
                      )}
                    </ul>
                    <div className="flex gap-2 pt-2 border-t">
                      <Input
                        placeholder="new-slug"
                        value={newSlug}
                        onChange={(e) => setNewSlug(e.target.value)}
                        className="text-sm"
                      />
                      <Button type="button" size="icon" variant="outline" onClick={addSlug} title="Add page">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card className="rounded-md">
                  <CardContent className="p-4 space-y-4">
                    {!selectedSlug ? (
                      <p className="text-sm text-muted-foreground">Select or create a page slug to edit.</p>
                    ) : (
                      <>
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="text-sm text-muted-foreground">
                            Public URL:{' '}
                            <span className="font-mono text-foreground">
                              {publicUrlForKey(kind, selectedSlug)}
                            </span>
                          </p>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="text-destructive"
                            onClick={removeSlug}
                            disabled={!canMutate}
                          >
                            <Trash2 className="mr-1 h-4 w-4" />
                            Delete
                          </Button>
                        </div>

                        {isLocation ? (
                          <>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label>Display name</Label>
                                <Input
                                  value={String(draft.name ?? '')}
                                  onChange={(e) => patchDraft({ name: e.target.value })}
                                  placeholder="Mira Road"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>City</Label>
                                <Input
                                  value={String(draft.city ?? 'Mumbai')}
                                  onChange={(e) => patchDraft({ city: e.target.value })}
                                />
                              </div>
                            </div>
                            <div className="space-y-2">
                              <Label>Hero subtitle</Label>
                              <Textarea
                                rows={2}
                                value={String(draft.subtitle ?? '')}
                                onChange={(e) => patchDraft({ subtitle: e.target.value })}
                                placeholder="Book verified AC repair, plumbing & electrical professionals…"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Quick answer (AI Overview)</Label>
                              <Textarea
                                rows={3}
                                value={String(draft.quickAnswer ?? '')}
                                onChange={(e) => patchDraft({ quickAnswer: e.target.value })}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Neighbour area slugs (one per line)</Label>
                              <Textarea
                                rows={3}
                                value={arrayToLines(draft.neighbours)}
                                onChange={(e) => patchDraft({ neighbours: linesToArray(e.target.value) })}
                                placeholder="mira-bhayandar&#10;borivali"
                              />
                            </div>
                            <div className="grid grid-cols-3 gap-3">
                              <div className="space-y-2">
                                <Label>Providers count</Label>
                                <Input
                                  type="number"
                                  value={String((draft.stats as Record<string, unknown>)?.providers ?? '')}
                                  onChange={(e) =>
                                    patchDraft({
                                      stats: {
                                        ...((draft.stats as object) ?? {}),
                                        providers: Number(e.target.value),
                                      },
                                    })
                                  }
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>Jobs completed</Label>
                                <Input
                                  type="number"
                                  value={String((draft.stats as Record<string, unknown>)?.jobsCompleted ?? '')}
                                  onChange={(e) =>
                                    patchDraft({
                                      stats: {
                                        ...((draft.stats as object) ?? {}),
                                        jobsCompleted: Number(e.target.value),
                                      },
                                    })
                                  }
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>Avg rating</Label>
                                <Input
                                  type="number"
                                  step="0.1"
                                  value={String((draft.stats as Record<string, unknown>)?.avgRating ?? '')}
                                  onChange={(e) =>
                                    patchDraft({
                                      stats: {
                                        ...((draft.stats as object) ?? {}),
                                        avgRating: Number(e.target.value),
                                      },
                                    })
                                  }
                                />
                              </div>
                            </div>
                            <div className="space-y-2 rounded-md border border-border p-3">
                              <SeoSectionsEditor
                                sections={
                                  Array.isArray(draft.sections)
                                    ? (draft.sections as ContentSection[])
                                    : []
                                }
                                onChange={(sections) => patchDraft({ sections })}
                                disabled={!canMutate}
                              />
                            </div>
                            <p className="text-xs text-muted-foreground">
                              Slugs must match active entries in CMS → Service areas (
                              <code>service-catalog-localities</code>). New service-area slugs auto-get a
                              minimal /areas page; enrich here for unique stats &amp; copy.
                            </p>
                          </>
                        ) : isProvider ? (
                          <>
                            <div className="space-y-2">
                              <Label>Name</Label>
                              <Input
                                value={String(draft.name ?? '')}
                                onChange={(e) => patchDraft({ name: e.target.value })}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Bio</Label>
                              <Textarea
                                rows={4}
                                value={String(draft.bio ?? '')}
                                onChange={(e) => patchDraft({ bio: e.target.value })}
                              />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label>Services offered (one slug per line)</Label>
                                <Textarea
                                  rows={3}
                                  value={arrayToLines(draft.servicesOffered)}
                                  onChange={(e) =>
                                    patchDraft({ servicesOffered: linesToArray(e.target.value) })
                                  }
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>Areas served (one slug per line)</Label>
                                <Textarea
                                  rows={3}
                                  value={arrayToLines(draft.areasServed)}
                                  onChange={(e) => patchDraft({ areasServed: linesToArray(e.target.value) })}
                                />
                              </div>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="space-y-2">
                              <Label>Title (H1 / meta)</Label>
                              <Input
                                value={String(draft.title ?? '')}
                                onChange={(e) => patchDraft({ title: e.target.value })}
                              />
                            </div>
                            {(k === 'problems' || k === 'cost-guides' || k === 'guides') && (
                              <div className="space-y-2">
                                <Label>Hero subtitle (optional, shown under H1)</Label>
                                <Input
                                  value={String(draft.subtitle ?? '')}
                                  onChange={(e) => patchDraft({ subtitle: e.target.value })}
                                  placeholder="Common Causes, DIY Fixes & Repair Cost Guide"
                                />
                              </div>
                            )}
                            {(k === 'problems' || k === 'cost-guides' || k === 'landing-pages') && (
                              <div className="space-y-2">
                                <Label>Service slug</Label>
                                <select
                                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                                  value={String(draft.serviceSlug ?? '')}
                                  onChange={(e) => patchDraft({ serviceSlug: e.target.value })}
                                >
                                  {catalogOptions.map((opt) => (
                                    <option key={opt.value} value={opt.value}>
                                      {opt.label}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            )}
                            {(k === 'problems' || k === 'cost-guides' || k === 'guides') && (
                              <div className="space-y-2">
                                <Label>Location slug (optional — hyperlocal booking &amp; nearby-area links)</Label>
                                <Input
                                  value={String(draft.locationSlug ?? '')}
                                  onChange={(e) => patchDraft({ locationSlug: e.target.value })}
                                  placeholder="mira-bhayandar"
                                />
                              </div>
                            )}
                            {k === 'cost-guides' && (
                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <Label>Year</Label>
                                  <Input
                                    type="number"
                                    value={String(draft.year ?? new Date().getFullYear())}
                                    onChange={(e) => patchDraft({ year: Number(e.target.value) })}
                                  />
                                </div>
                              </div>
                            )}
                            {k === 'landing-pages' && (
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <Label>Location slug (booking CTA → /services/{'{'}service{'}'}/{'{'}slug{'}'})</Label>
                                  <Input
                                    value={String(draft.locationSlug ?? '')}
                                    onChange={(e) => patchDraft({ locationSlug: e.target.value })}
                                    placeholder="bhayandar"
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label>Location display name</Label>
                                  <Input
                                    value={String(draft.locationName ?? '')}
                                    onChange={(e) => patchDraft({ locationName: e.target.value })}
                                    placeholder="Bhayandar West, Thane"
                                  />
                                </div>
                                <div className="space-y-2 sm:col-span-2">
                                  <Label>Canonical path (self-canonical, or point to /services/… to avoid cannibalization)</Label>
                                  <Input
                                    value={String((draft.seo as Record<string, unknown>)?.canonicalPath ?? '')}
                                    onChange={(e) =>
                                      patchDraft({
                                        seo: { ...(draft.seo as object), canonicalPath: e.target.value },
                                      })
                                    }
                                    placeholder={`/${selectedSlug}`}
                                  />
                                </div>
                              </div>
                            )}
                            <div className="space-y-2">
                              <Label>Quick answer (AI Overview block)</Label>
                              <Textarea
                                rows={3}
                                value={String(draft.quickAnswer ?? '')}
                                onChange={(e) => patchDraft({ quickAnswer: e.target.value })}
                              />
                              <p className="text-xs text-muted-foreground">
                                Min 40 characters to publish (Google index). Shorter copy still previews on-site as draft (noindex).
                                {' '}
                                {String(draft.quickAnswer ?? '').trim().length}/40
                              </p>
                            </div>
                            <div className="space-y-2">
                              <Label>Key takeaways (one per line)</Label>
                              <Textarea
                                rows={4}
                                value={arrayToLines(draft.keyTakeaways)}
                                onChange={(e) => patchDraft({ keyTakeaways: linesToArray(e.target.value) })}
                              />
                            </div>
                            <div className="space-y-2 rounded-md border border-border p-3">
                              <SeoSectionsEditor
                                sections={
                                  Array.isArray(draft.sections)
                                    ? (draft.sections as ContentSection[])
                                    : []
                                }
                                onChange={(sections) => patchDraft({ sections })}
                                disabled={!canMutate}
                              />
                              {(k === 'problems' || k === 'guides') && (
                                <p className="text-xs text-muted-foreground">
                                  Min 600 characters of content to publish (Google index). Current:{' '}
                                  {effectiveBodyLength(draft)}/600
                                  {effectiveBodyLength(draft) < 600
                                    ? ' — shorter pages still preview on-site as draft (noindex).'
                                    : ' ✓'}
                                </p>
                              )}
                            </div>
                            {(k === 'cost-guides' || k === 'landing-pages') && (
                              <div className="space-y-2">
                                <Label>Price table (JSON array)</Label>
                                <Textarea
                                  rows={6}
                                  className="font-mono text-xs"
                                  value={JSON.stringify(draft.priceTable ?? [], null, 2)}
                                  onChange={(e) =>
                                    patchDraft({
                                      priceTable: parseJsonField(e.target.value, []),
                                    })
                                  }
                                />
                                <p className="text-xs text-muted-foreground">
                                  Example: {`[{"item":"AC service","priceFrom":499,"priceTo":899,"note":"Labour"}]`}
                                </p>
                                {k === 'landing-pages' && (
                                  <Input
                                    className="mt-2"
                                    value={String(draft.priceTableCaption ?? '')}
                                    onChange={(e) => patchDraft({ priceTableCaption: e.target.value })}
                                    placeholder="Price table caption (e.g. Indicative AC charges in Bhayandar West, 2026)"
                                  />
                                )}
                              </div>
                            )}
                          </>
                        )}

                        <div className="space-y-2">
                          <Label>FAQs (JSON array)</Label>
                          <Textarea
                            rows={5}
                            className="font-mono text-xs"
                            value={JSON.stringify(draft.faqs ?? [], null, 2)}
                            onChange={(e) => patchDraft({ faqs: parseJsonField(e.target.value, []) })}
                          />
                        </div>

                        <div className="space-y-3 rounded-md border border-border p-3">
                          <p className="text-sm font-semibold">SEO &amp; meta</p>
                          <p className="text-xs text-muted-foreground">
                            Overrides the auto-generated tags. Leave blank to use the smart defaults derived from the title &amp; quick answer.
                          </p>
                          <div className="space-y-2">
                            <Label>SEO title (meta title)</Label>
                            <Input
                              value={String((draft.seo as Record<string, unknown>)?.title ?? '')}
                              onChange={(e) =>
                                patchDraft({ seo: { ...(draft.seo as object), title: e.target.value } })
                              }
                              placeholder="AC Repair Cost in Mira Bhayandar (2026) | ProFixer"
                            />
                            <p className="text-xs text-muted-foreground">
                              Aim for 50–60 characters. {String((draft.seo as Record<string, unknown>)?.title ?? '').length}/60
                            </p>
                          </div>
                          <div className="space-y-2">
                            <Label>Meta description</Label>
                            <Textarea
                              rows={2}
                              value={String((draft.seo as Record<string, unknown>)?.description ?? '')}
                              onChange={(e) =>
                                patchDraft({ seo: { ...(draft.seo as object), description: e.target.value } })
                              }
                              placeholder="Transparent AC repair charges in Mira Bhayandar with verified technicians, upfront pricing & same-day slots."
                            />
                            <p className="text-xs text-muted-foreground">
                              Aim for 150–160 characters. {String((draft.seo as Record<string, unknown>)?.description ?? '').length}/160
                            </p>
                          </div>
                          <div className="space-y-2">
                            <Label>Keywords (comma separated)</Label>
                            <Input
                              value={
                                Array.isArray((draft.seo as Record<string, unknown>)?.keywords)
                                  ? ((draft.seo as Record<string, unknown>).keywords as string[]).join(', ')
                                  : ''
                              }
                              onChange={(e) =>
                                patchDraft({
                                  seo: {
                                    ...(draft.seo as object),
                                    keywords: e.target.value
                                      .split(',')
                                      .map((kw) => kw.trim())
                                      .filter(Boolean),
                                  },
                                })
                              }
                              placeholder="ac repair cost mira bhayandar, ac service charges, ac gas refill price"
                            />
                          </div>
                          {k !== 'landing-pages' && (
                            <div className="space-y-2">
                              <Label>Canonical path (self-canonical, or point to /services/… to avoid cannibalization)</Label>
                              <Input
                                value={String((draft.seo as Record<string, unknown>)?.canonicalPath ?? '')}
                                onChange={(e) =>
                                  patchDraft({
                                    seo: { ...(draft.seo as object), canonicalPath: e.target.value },
                                  })
                                }
                                placeholder={`/${k === 'problems' ? 'problems' : k === 'cost-guides' ? 'charges' : 'guide'}/${selectedSlug}`}
                              />
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-3 rounded-md border p-3">
                          <Switch
                            checked={Boolean((draft.seo as Record<string, unknown>)?.noindex)}
                            onCheckedChange={(checked) =>
                              patchDraft({
                                seo: { ...(draft.seo as object), noindex: checked },
                              })
                            }
                          />
                          <Label className="cursor-pointer">Noindex this page</Label>
                        </div>

                        <Button onClick={handleSave} disabled={saving || !canMutate} className="w-full sm:w-auto">
                          {saving ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <FileSearch className="mr-2 h-4 w-4" />
                          )}
                          Save {KIND_LABELS[k]}
                        </Button>
                      </>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
