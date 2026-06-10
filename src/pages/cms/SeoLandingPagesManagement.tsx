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

type EntityDraft = Record<string, unknown>

const KIND_LABELS: Record<EntityKind, string> = {
  problems: 'Problems (/problems)',
  'cost-guides': 'Cost guides (/cost)',
  guides: 'How-to guides (/guide)',
  providers: 'Providers (/provider)',
  locations: 'Areas (/areas)',
}

const KIND_PUBLIC_PATH: Record<EntityKind, string> = {
  problems: '/problems',
  'cost-guides': '/cost',
  guides: '/guide',
  providers: '/provider',
  locations: '/areas',
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
        subtitle="Programmatic pages: /cost, /problems, /guide, /provider & /areas — synced to the consumer site via static-content CMS blobs."
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
                            {(k === 'problems' || k === 'cost-guides') && (
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
                            {k === 'cost-guides' && (
                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <Label>Location slug (optional)</Label>
                                  <Input
                                    value={String(draft.locationSlug ?? '')}
                                    onChange={(e) => patchDraft({ locationSlug: e.target.value })}
                                    placeholder="mira-bhayandar"
                                  />
                                </div>
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
                            {k === 'cost-guides' && (
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
                                  Example: {`[{"item":"AC service","priceFrom":499,"priceTo":899}]`}
                                </p>
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
