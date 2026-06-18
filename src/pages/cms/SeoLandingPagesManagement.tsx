import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ExternalLink,
  FileSearch,
  Loader2,
  Plus,
  Save,
  Search,
  Trash2,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { Textarea } from '../../components/ui/textarea'
import { Switch } from '../../components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs'
import { Badge } from '../../components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select'
import { PageHeader } from '../../components/common/PageHeader'
import { CMSService } from '../../services/api'
import { useCmsCatalogCategories } from '../../hooks/useCmsCatalogCategories'
import { useServiceCatalogLocalities } from '../../hooks/useServiceCatalogLocalities'
import { usePermissions } from '../../hooks/usePermissions'
import { appToast } from '../../lib/appToast'
import { cn } from '../../lib/utils'
import { SeoSectionsEditor } from '../../components/cms/SeoSectionsEditor'
import { SeoLandingFaqEditor } from '../../components/cms/SeoLandingFaqEditor'
import { SeoLandingPriceTableEditor } from '../../components/cms/SeoLandingPriceTableEditor'
import { SeoLandingInternalLinksEditor } from '../../components/cms/SeoLandingInternalLinksEditor'
import {
  buildNearMeLocalityPublicPath,
  buildNearMeCategoryPublicPath,
} from '../../lib/nearMeSeo'
import {
  buildServiceLocalityPublicPath,
  getPreferredServiceCategoryUrlSlug,
} from '../../lib/serviceCatalogUrlSlugs'
import {
  kindMeta,
  pageListTitle,
  publicUrlForKind,
  publishGatesForDraft,
  estimateSeoLandingWordCount,
  SEO_LANDING_KINDS,
  SEO_LANDING_MIN_WORDS,
  SEO_LANDING_OPTIMAL_WORDS,
  SEO_LANDING_MIN_INTERNAL_LINKS,
  type SeoLandingEntityKind,
} from '../../lib/seoLandingPageKinds'
import {
  mergeSuggestedInternalLinks,
  suggestSeoLandingInternalLinks,
} from '../../lib/seoLandingSuggestLinks'
import type { ContentSection } from '../../types/seoLandingSections'

type EntityDraft = Record<string, unknown>
type EditorTab = 'setup' | 'content' | 'links' | 'seo'

function emptyDraft(kind: SeoLandingEntityKind, slug: string): EntityDraft {
  const base: EntityDraft = {
    slug,
    title: '',
    quickAnswer: '',
    keyTakeaways: [],
    body: '',
    sections: [],
    faqs: [],
    relatedLinks: [],
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
      relatedLinks: [],
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
      relatedLinks: [],
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
      relatedLinks: [],
      seo: { noindex: false, canonicalPath: slug ? `/${slug}` : '' },
    }
  }
  return base
}

async function fetchKindRecord(kind: SeoLandingEntityKind): Promise<Record<string, unknown>> {
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

async function saveKindRecord(kind: SeoLandingEntityKind, data: Record<string, unknown>) {
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

const strip = (s?: string) => (s ?? '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()

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

function FieldHint({ children }: { children: React.ReactNode }) {
  return <p className="text-xs text-muted-foreground leading-relaxed">{children}</p>
}

function SectionCard({
  title,
  description,
  children,
}: {
  title: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <Card className="overflow-hidden border-border/70 shadow-sm">
      <CardHeader className="border-b border-border/50 bg-muted/25 py-4">
        <CardTitle className="text-base font-semibold">{title}</CardTitle>
        {description ? <CardDescription className="text-sm">{description}</CardDescription> : null}
      </CardHeader>
      <CardContent className="space-y-4 pt-5">{children}</CardContent>
    </Card>
  )
}

export default function SeoLandingPagesManagement() {
  const { checkPermission } = usePermissions()
  const canMutate = checkPermission('manage_system_settings')
  const { options: catalogOptions } = useCmsCatalogCategories()
  const { rows: managedLocalities, loading: localitiesLoading } = useServiceCatalogLocalities()

  const sortedLocalities = useMemo(
    () =>
      [...managedLocalities]
        .filter((l) => l.isActive !== false)
        .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name)),
    [managedLocalities],
  )

  const [kind, setKind] = useState<SeoLandingEntityKind>('problems')
  const [editorTab, setEditorTab] = useState<EditorTab>('setup')
  const [records, setRecords] = useState<Record<string, EntityDraft>>({})
  const [selectedSlug, setSelectedSlug] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [newSlug, setNewSlug] = useState('')
  const [pageSearch, setPageSearch] = useState('')

  const meta = kindMeta(kind)
  const slugs = useMemo(() => Object.keys(records).sort(), [records])
  const filteredSlugs = useMemo(() => {
    const q = pageSearch.trim().toLowerCase()
    if (!q) return slugs
    return slugs.filter((s) => {
      const d = records[s]
      const title = pageListTitle(kind, d ?? {}).toLowerCase()
      return s.includes(q) || title.includes(q)
    })
  }, [slugs, pageSearch, records, kind])

  const draft: EntityDraft = useMemo(
    () => (selectedSlug ? records[selectedSlug] ?? emptyDraft(kind, selectedSlug) : emptyDraft(kind, '')),
    [records, selectedSlug, kind],
  )

  const bodyLen = useMemo(() => effectiveBodyLength(draft), [draft])
  const wordCount = useMemo(() => estimateSeoLandingWordCount(kind, draft), [kind, draft])
  const publishGates = useMemo(() => publishGatesForDraft(kind, draft, bodyLen), [kind, draft, bodyLen])
  const catalogLabelMap = useMemo(
    () => Object.fromEntries(catalogOptions.map((o) => [o.value, o.label])),
    [catalogOptions],
  )
  const readyToIndex = publishGates.every((g) => g.ok)
  const sectionsHaveInlinePriceTable = useMemo(() => {
    const sections = Array.isArray(draft.sections) ? (draft.sections as ContentSection[]) : []
    return sections.some((s) => s.type === 'price_table')
  }, [draft.sections])

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
      setEditorTab('setup')
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
      appToast(`${meta.label} saved.`, 'success')
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
    setEditorTab('setup')
  }

  const removeSlug = () => {
    if (!selectedSlug) return
    const next = { ...records }
    delete next[selectedSlug]
    setRecords(next)
    setSelectedSlug(Object.keys(next).sort()[0] ?? '')
  }

  const serviceSlug = String(draft.serviceSlug ?? '')
  const locationSlug = String(draft.locationSlug ?? '').trim().toLowerCase()
  const preferredCategory = serviceSlug ? getPreferredServiceCategoryUrlSlug(serviceSlug) : ''
  const localityName =
    String(draft.locationName ?? '').trim() ||
    sortedLocalities.find((l) => l.slug === locationSlug)?.name ||
    ''

  const derivedServiceUrl =
    serviceSlug && locationSlug
      ? buildServiceLocalityPublicPath(serviceSlug, locationSlug)
      : serviceSlug
        ? `/services/${preferredCategory}`
        : ''
  const derivedNearMeUrl =
    serviceSlug && locationSlug
      ? buildNearMeLocalityPublicPath(serviceSlug, locationSlug)
      : serviceSlug
        ? buildNearMeCategoryPublicPath(serviceSlug)
        : ''

  const patchLocationSlug = (slug: string) => {
    const normalized = slug.trim().toLowerCase()
    const hit = sortedLocalities.find((l) => l.slug === normalized)
    patchDraft({
      locationSlug: normalized,
      ...(hit && !String(draft.locationName ?? '').trim() ? { locationName: hit.name } : {}),
    })
  }

  const publicUrl = selectedSlug ? publicUrlForKind(kind, selectedSlug) : ''
  const listTitle = pageListTitle(kind, draft)

  const showCategoryLocation =
    kind === 'problems' || kind === 'cost-guides' || kind === 'guides' || kind === 'landing-pages'

  const categoryLocationBlock = showCategoryLocation ? (
    <SectionCard
      title="Category & location"
      description="Drives booking CTAs and internal links to /services/… and /near-me/… on the live site."
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Service category</Label>
          <Select value={serviceSlug || undefined} onValueChange={(v) => patchDraft({ serviceSlug: v })}>
            <SelectTrigger>
              <SelectValue placeholder="Pick category" />
            </SelectTrigger>
            <SelectContent>
              {catalogOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Service area</Label>
          <Select
            value={
              locationSlug && sortedLocalities.some((l) => l.slug === locationSlug)
                ? locationSlug
                : locationSlug
                  ? '__custom__'
                  : '__none__'
            }
            onValueChange={(v) => {
              if (v === '__custom__' || v === '__none__') return
              patchLocationSlug(v)
            }}
            disabled={localitiesLoading}
          >
            <SelectTrigger>
              <SelectValue placeholder="Pick area from Service areas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">— No area —</SelectItem>
              {sortedLocalities.map((loc) => (
                <SelectItem key={loc.slug} value={loc.slug}>
                  {loc.name}
                </SelectItem>
              ))}
              <SelectItem value="__custom__">Custom slug (type below)</SelectItem>
            </SelectContent>
          </Select>
          <Input
            value={locationSlug}
            onChange={(e) => patchLocationSlug(e.target.value)}
            placeholder="mira-bhayandar"
            className="font-mono text-sm"
          />
        </div>
      </div>
      {(derivedServiceUrl || derivedNearMeUrl) && (
        <div className="rounded-md border border-border/60 bg-background px-3 py-2 text-xs space-y-1">
          <p>
            <span className="text-muted-foreground">Booking →</span>{' '}
            <code className="text-foreground">{derivedServiceUrl || '—'}</code>
          </p>
          <p>
            <span className="text-muted-foreground">Near-me →</span>{' '}
            <code className="text-foreground">{derivedNearMeUrl || '—'}</code>
          </p>
          {localityName ? (
            <p>
              <span className="text-muted-foreground">Display name →</span> {localityName}
            </p>
          ) : null}
        </div>
      )}
    </SectionCard>
  ) : null

  const seoBlock = (
    <SectionCard
      title="Search appearance"
      description="Leave blank to auto-generate from title + quick answer on the consumer site."
    >
      <div className="space-y-2">
        <Label>SEO title</Label>
        <Input
          value={String((draft.seo as Record<string, unknown>)?.title ?? '')}
          onChange={(e) => patchDraft({ seo: { ...(draft.seo as object), title: e.target.value } })}
          placeholder="AC Repair Cost in Mira Bhayandar (2026) | ProFixer"
        />
        <FieldHint>
          Aim 50–60 chars · {String((draft.seo as Record<string, unknown>)?.title ?? '').length}/60
        </FieldHint>
      </div>
      <div className="space-y-2">
        <Label>Meta description</Label>
        <Textarea
          rows={2}
          value={String((draft.seo as Record<string, unknown>)?.description ?? '')}
          onChange={(e) => patchDraft({ seo: { ...(draft.seo as object), description: e.target.value } })}
        />
        <FieldHint>
          Aim 150–160 chars · {String((draft.seo as Record<string, unknown>)?.description ?? '').length}/160
        </FieldHint>
      </div>
      <div className="space-y-2">
        <Label>Keywords</Label>
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
                keywords: e.target.value.split(',').map((kw) => kw.trim()).filter(Boolean),
              },
            })
          }
          placeholder="comma, separated, keywords"
        />
      </div>
      <div className="space-y-2">
        <Label>Canonical path</Label>
        <Input
          className="font-mono text-sm"
          value={String((draft.seo as Record<string, unknown>)?.canonicalPath ?? '')}
          onChange={(e) =>
            patchDraft({ seo: { ...(draft.seo as object), canonicalPath: e.target.value } })
          }
          placeholder={
            kind === 'landing-pages'
              ? derivedServiceUrl || `/${selectedSlug}`
              : `${meta.pathPrefix}/${selectedSlug}`
          }
        />
        <FieldHint>
          Self-canonical for indexable money pages. Point to <code>/services/…</code> if this page overlaps an industry landing.
        </FieldHint>
      </div>
      <div className="flex items-center justify-between rounded-lg border border-border/70 px-3 py-3">
        <div>
          <p className="text-sm font-medium">Hide from Google (noindex)</p>
          <p className="text-xs text-muted-foreground">Use while drafting or for thin variants.</p>
        </div>
        <Switch
          checked={Boolean((draft.seo as Record<string, unknown>)?.noindex)}
          onCheckedChange={(checked) =>
            patchDraft({ seo: { ...(draft.seo as object), noindex: checked } })
          }
        />
      </div>
    </SectionCard>
  )

  const renderSetupTab = () => {
    if (kind === 'locations') {
      return (
        <div className="space-y-4">
          <SectionCard title="Area identity" description="Matches /areas/{slug} — slug is the URL key in the sidebar.">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Display name</Label>
                <Input value={String(draft.name ?? '')} onChange={(e) => patchDraft({ name: e.target.value })} placeholder="Mira Bhayandar" />
              </div>
              <div className="space-y-2">
                <Label>City</Label>
                <Input value={String(draft.city ?? 'Mumbai')} onChange={(e) => patchDraft({ city: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Hero subtitle</Label>
              <Textarea rows={2} value={String(draft.subtitle ?? '')} onChange={(e) => patchDraft({ subtitle: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Neighbour areas (one slug per line)</Label>
              <Textarea
                rows={3}
                value={arrayToLines(draft.neighbours)}
                onChange={(e) => patchDraft({ neighbours: linesToArray(e.target.value) })}
                placeholder="borivali&#10;dahisar"
              />
            </div>
          </SectionCard>
          <SectionCard title="Trust stats" description="Shown on the area hub — keep numbers realistic.">
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label>Providers</Label>
                <Input
                  type="number"
                  value={String((draft.stats as Record<string, unknown>)?.providers ?? '')}
                  onChange={(e) =>
                    patchDraft({ stats: { ...((draft.stats as object) ?? {}), providers: Number(e.target.value) } })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Jobs done</Label>
                <Input
                  type="number"
                  value={String((draft.stats as Record<string, unknown>)?.jobsCompleted ?? '')}
                  onChange={(e) =>
                    patchDraft({ stats: { ...((draft.stats as object) ?? {}), jobsCompleted: Number(e.target.value) } })
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
                    patchDraft({ stats: { ...((draft.stats as object) ?? {}), avgRating: Number(e.target.value) } })
                  }
                />
              </div>
            </div>
          </SectionCard>
        </div>
      )
    }

    if (kind === 'providers') {
      return (
        <SectionCard title="Provider profile" description="Public URL: /provider/{slug}">
          <div className="space-y-2">
            <Label>Name</Label>
            <Input value={String(draft.name ?? '')} onChange={(e) => patchDraft({ name: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Bio</Label>
            <Textarea rows={4} value={String(draft.bio ?? '')} onChange={(e) => patchDraft({ bio: e.target.value })} />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Services (one slug per line)</Label>
              <Textarea
                rows={3}
                value={arrayToLines(draft.servicesOffered)}
                onChange={(e) => patchDraft({ servicesOffered: linesToArray(e.target.value) })}
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
        </SectionCard>
      )
    }

    return (
      <div className="space-y-4">
        <SectionCard title="Page headline" description="Becomes H1 and default meta title when SEO title is empty.">
          <div className="space-y-2">
            <Label>Title</Label>
            <Input value={String(draft.title ?? '')} onChange={(e) => patchDraft({ title: e.target.value })} />
          </div>
          {(kind === 'problems' || kind === 'cost-guides' || kind === 'guides') && (
            <div className="space-y-2">
              <Label>Subtitle (under H1)</Label>
              <Input
                value={String(draft.subtitle ?? '')}
                onChange={(e) => patchDraft({ subtitle: e.target.value })}
                placeholder="Common causes, fixes & what it costs"
              />
            </div>
          )}
          {kind === 'landing-pages' && (
            <div className="space-y-2">
              <Label>Location display name</Label>
              <Input
                value={String(draft.locationName ?? '')}
                onChange={(e) => patchDraft({ locationName: e.target.value })}
                placeholder="Bhayandar West, Thane"
              />
            </div>
          )}
          {kind === 'cost-guides' && (
            <div className="space-y-2 max-w-[12rem]">
              <Label>Price guide year</Label>
              <Input
                type="number"
                value={String(draft.year ?? new Date().getFullYear())}
                onChange={(e) => patchDraft({ year: Number(e.target.value) })}
              />
            </div>
          )}
        </SectionCard>
        {categoryLocationBlock}
      </div>
    )
  }

  const renderContentTab = () => (
    <div className="space-y-4">
      {kind !== 'providers' && (
        <SectionCard
          title="AI Overview & summary"
          description="Quick answer is required (40+ chars) before Google will index the page."
        >
          <div className="space-y-2">
            <Label>Quick answer</Label>
            <Textarea
              rows={3}
              value={String(draft.quickAnswer ?? '')}
              onChange={(e) => patchDraft({ quickAnswer: e.target.value })}
            />
            <FieldHint>
              {String(draft.quickAnswer ?? '').trim().length}/40 characters minimum
            </FieldHint>
          </div>
          {kind !== 'locations' && (
            <div className="space-y-2">
              <Label>Key takeaways (one per line)</Label>
              <Textarea
                rows={4}
                value={arrayToLines(draft.keyTakeaways)}
                onChange={(e) => patchDraft({ keyTakeaways: linesToArray(e.target.value) })}
              />
            </div>
          )}
        </SectionCard>
      )}

      {kind === 'providers' ? (
        <SectionCard title="FAQs" description="Optional Q&A on the provider profile.">
          <SeoLandingFaqEditor faqs={draft.faqs} onChange={(faqs) => patchDraft({ faqs })} disabled={!canMutate} />
        </SectionCard>
      ) : (
        <SectionCard title="Page sections" description="Drag to reorder. Add rich text, FAQs, price tables, how-to steps, and more.">
          <SeoSectionsEditor
            sections={Array.isArray(draft.sections) ? (draft.sections as ContentSection[]) : []}
            onChange={(sections) => patchDraft({ sections })}
            disabled={!canMutate}
          />
          <FieldHint>
            Word count: <strong className="text-foreground">{wordCount}</strong> / {SEO_LANDING_MIN_WORDS} minimum
            {wordCount >= SEO_LANDING_OPTIMAL_WORDS
              ? ' (optimal band ✓)'
              : wordCount >= SEO_LANDING_MIN_WORDS
                ? ` — aim for ${SEO_LANDING_OPTIMAL_WORDS}+ words`
                : ' — thin pages stay draft (noindex)'}
          </FieldHint>
        </SectionCard>
      )}

      {kind !== 'providers' && (
        <SectionCard title="FAQs" description="Visible on-page and eligible for FAQ rich results when complete.">
          <SeoLandingFaqEditor faqs={draft.faqs} onChange={(faqs) => patchDraft({ faqs })} disabled={!canMutate} />
        </SectionCard>
      )}

      {(kind === 'cost-guides' || kind === 'landing-pages') && (
        <SectionCard
          title={kind === 'cost-guides' ? 'Charge table' : 'Price table'}
          description={
            kind === 'cost-guides'
              ? 'Primary pricing block for /charges pages — this is what visitors see as the main price list.'
              : 'Optional top-level prices for flat local money pages. Use this OR a “Price table” block inside Page sections — not both.'
          }
        >
          {sectionsHaveInlinePriceTable ? (
            <div className="rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-foreground">
              You already added a <strong>Price table</strong> block under Page sections. The live site will show
              that inline table and <strong>ignore</strong> this standalone list — clear one or the other to avoid
              confusion.
            </div>
          ) : null}
          <SeoLandingPriceTableEditor
            rows={draft.priceTable}
            caption={kind === 'landing-pages' ? String(draft.priceTableCaption ?? '') : undefined}
            onChange={(rows) => patchDraft({ priceTable: rows })}
            onCaptionChange={kind === 'landing-pages' ? (caption) => patchDraft({ priceTableCaption: caption }) : undefined}
            disabled={!canMutate}
          />
          {kind === 'cost-guides' ? (
            <FieldHint>
              Year in Setup tab is appended to the caption on-site (e.g. “AC charges (2026)”).
            </FieldHint>
          ) : null}
        </SectionCard>
      )}
    </div>
  )

  const renderLinksTab = () => (
    <SectionCard
      title="Internal links"
      description="Editorial links shown first in the Related links block on the live site. Aim for 3+ contextual paths."
    >
      <SeoLandingInternalLinksEditor
        links={draft.relatedLinks}
        minRecommended={SEO_LANDING_MIN_INTERNAL_LINKS}
        onChange={(relatedLinks) => patchDraft({ relatedLinks })}
        onSuggest={() => {
          const suggested = suggestSeoLandingInternalLinks(kind, draft, catalogLabelMap)
          patchDraft({
            relatedLinks: mergeSuggestedInternalLinks(draft.relatedLinks, suggested),
          })
        }}
        disabled={!canMutate}
      />
    </SectionCard>
  )

  return (
    <div className="flex min-h-0 flex-col p-4 sm:p-6 md:p-8">
      <PageHeader
        title="SEO landing pages"
        subtitle="Programmatic content for problems, charges, guides, areas, providers & local money pages — synced to profixer.in via CMS blobs."
        action={
          <Button onClick={handleSave} disabled={saving || !canMutate || loading}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save {meta.shortLabel}
          </Button>
        }
      />

      {/* Page type picker */}
      <div className="mt-6 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {SEO_LANDING_KINDS.map((k) => {
          const Icon = k.icon
          const active = kind === k.id
          return (
            <button
              key={k.id}
              type="button"
              onClick={() => setKind(k.id)}
              className={cn(
                'rounded-xl border p-4 text-left transition hover:border-primary/40 hover:bg-muted/40',
                active ? 'border-primary bg-primary/5 ring-1 ring-primary/20' : 'border-border bg-card',
              )}
            >
              <div className="flex items-start gap-3">
                <div
                  className={cn(
                    'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg',
                    active ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground',
                  )}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0 space-y-1">
                  <p className="font-semibold text-foreground">{k.label}</p>
                  <p className="font-mono text-xs text-muted-foreground">{k.pathPrefix || '/{slug}'}</p>
                  <p className="line-clamp-2 text-xs text-muted-foreground">{k.intent}</p>
                </div>
              </div>
            </button>
          )
        })}
      </div>

      {/* Kind context banner */}
      <Card className="mt-4 border-primary/15 bg-primary-soft/30 dark:bg-primary/10">
        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-foreground">{meta.description}</p>
            <p className="text-xs text-muted-foreground">
              Example:{' '}
              <a
                href={meta.exampleUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-primary underline-offset-2 hover:underline"
              >
                {meta.exampleUrl.replace('https://www.profixer.in', '')}
              </a>
            </p>
          </div>
          <Badge variant={slugs.length > 0 ? 'success' : 'secondary'}>
            {slugs.length} page{slugs.length === 1 ? '' : 's'}
          </Badge>
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex min-h-[360px] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-[minmax(220px,280px)_1fr]">
          {/* Sidebar */}
          <Card className="h-fit lg:sticky lg:top-4">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Pages</CardTitle>
              <CardDescription className="text-xs">URL slug = record key in CMS JSON</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 pt-0">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search slug or title…"
                  value={pageSearch}
                  onChange={(e) => setPageSearch(e.target.value)}
                  className="pl-8 text-sm"
                />
              </div>
              <ul className="max-h-[min(420px,50vh)] space-y-1 overflow-y-auto">
                {filteredSlugs.length === 0 ? (
                  <li className="rounded-md px-2 py-6 text-center text-sm text-muted-foreground">
                    {slugs.length === 0 ? 'No pages — create a slug below.' : 'No matches.'}
                  </li>
                ) : (
                  filteredSlugs.map((s) => {
                    const row = records[s]
                    const title = pageListTitle(kind, row ?? {})
                    const active = selectedSlug === s
                    return (
                      <li key={s}>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedSlug(s)
                            setEditorTab('setup')
                          }}
                          className={cn(
                            'w-full rounded-lg border px-2.5 py-2 text-left transition',
                            active
                              ? 'border-primary/40 bg-primary/10'
                              : 'border-transparent hover:border-border hover:bg-muted/50',
                          )}
                        >
                          <p className="truncate font-mono text-xs text-foreground">{s}</p>
                          {title ? (
                            <p className="truncate text-xs text-muted-foreground">{title}</p>
                          ) : (
                            <p className="text-xs italic text-muted-foreground">No title yet</p>
                          )}
                        </button>
                      </li>
                    )
                  })
                )}
              </ul>
              <div className="flex gap-2 border-t border-border pt-3">
                <Input
                  placeholder="new-page-slug"
                  value={newSlug}
                  onChange={(e) => setNewSlug(e.target.value)}
                  className="text-sm font-mono"
                  onKeyDown={(e) => e.key === 'Enter' && addSlug()}
                />
                <Button type="button" size="icon" variant="outline" onClick={addSlug} title="Add page" disabled={!canMutate}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Editor */}
          <div className="min-w-0 space-y-4">
            {!selectedSlug ? (
              <Card className="min-h-[280px]">
                <CardContent className="flex flex-col items-center justify-center gap-2 py-16 text-center">
                  <FileSearch className="h-10 w-10 text-muted-foreground/60" />
                  <p className="text-sm font-medium">Select or create a page</p>
                  <p className="max-w-sm text-xs text-muted-foreground">
                    Pick a slug from the left, or type a new one (e.g. <code>{meta.exampleSlug}</code>).
                  </p>
                </CardContent>
              </Card>
            ) : (
              <>
                <Card>
                  <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="truncate font-mono text-lg font-semibold">{selectedSlug}</h2>
                        {listTitle ? (
                          <Badge variant="outline" className="max-w-[200px] truncate font-normal">
                            {listTitle}
                          </Badge>
                        ) : null}
                      </div>
                      <a
                        href={`https://www.profixer.in${publicUrl}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 font-mono text-sm text-primary hover:underline"
                      >
                        {publicUrl}
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                      <div className="flex flex-wrap gap-1.5">
                        {publishGates.map((g) => (
                          <Badge key={g.label} variant={g.ok ? 'success' : 'warning'} title={g.detail}>
                            {g.label}
                          </Badge>
                        ))}
                        {readyToIndex ? (
                          <Badge variant="info">Ready to index</Badge>
                        ) : (
                          <Badge variant="secondary">Draft / gated</Badge>
                        )}
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="shrink-0 text-destructive hover:text-destructive"
                      onClick={removeSlug}
                      disabled={!canMutate}
                    >
                      <Trash2 className="mr-1 h-4 w-4" />
                      Delete
                    </Button>
                  </CardContent>
                </Card>

                <Tabs value={editorTab} onValueChange={(v) => setEditorTab(v as EditorTab)}>
                  <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 sm:w-auto sm:inline-flex">
                    <TabsTrigger value="setup">Setup</TabsTrigger>
                    <TabsTrigger value="content">Content</TabsTrigger>
                    <TabsTrigger value="links">Internal links</TabsTrigger>
                    <TabsTrigger value="seo">SEO & publish</TabsTrigger>
                  </TabsList>
                  <TabsContent value="setup" className="mt-4 space-y-4">
                    {renderSetupTab()}
                  </TabsContent>
                  <TabsContent value="content" className="mt-4 space-y-4">
                    {renderContentTab()}
                  </TabsContent>
                  <TabsContent value="links" className="mt-4 space-y-4">
                    {renderLinksTab()}
                  </TabsContent>
                  <TabsContent value="seo" className="mt-4 space-y-4">
                    {seoBlock}
                  </TabsContent>
                </Tabs>

                <div className="sticky bottom-0 z-10 flex justify-end border-t border-border bg-background/95 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/80">
                  <Button onClick={handleSave} disabled={saving || !canMutate}>
                    {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Save changes
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
