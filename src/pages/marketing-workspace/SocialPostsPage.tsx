import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { CalendarClock, Pencil, Plus, Rocket, Share2, Trash2, Upload } from 'lucide-react'
import { PageHeader } from '../../components/common/PageHeader'
import { MarketingWorkspaceSubnav } from '../../components/marketing-workspace/MarketingWorkspaceSubnav'
import { CampaignSelect } from '../../components/marketing-workspace/CampaignSelect'
import { useMarketingWorkspace } from '../../hooks/useMarketingWorkspace'
import { marketingWorkspaceApi } from '../../services/api/marketingWorkspace.api'
import type { MarketingSocialPost, MarketingSocialStatus, SocialPlatform } from '../../types/marketingWorkspace.types'
import { CONTENT_STATUS_LABEL, SOCIAL_PLATFORM_LABEL } from '../../lib/marketingWorkspaceLabels'
import { Checkbox } from '../../components/ui/checkbox'
import { Button } from '../../components/ui/button'
import { Card, CardContent } from '../../components/ui/card'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { Textarea } from '../../components/ui/textarea'
import { Badge } from '../../components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table'
import { toDatetimeLocalValue } from './socialDatetime'
import { captionLengthHealth, getSocialCaptionLimit } from '../../lib/socialCaptionLimits'
import { cn } from '../../lib/utils'

function parseSocialImportTable(text: string): Record<string, unknown>[] {
  const lines = text
    .trim()
    .split(/\r?\n/)
    .filter((l) => l.trim())
  if (lines.length < 2) return []
  const delim = lines[0].includes('\t') ? '\t' : ','
  const headers = lines[0].split(delim).map((h) => h.trim().toLowerCase().replace(/^\ufeff/, ''))
  const rows: Record<string, unknown>[] = []
  for (let i = 1; i < lines.length; i++) {
    const parts = lines[i].split(delim).map((p) => p.trim().replace(/^"|"$/g, ''))
    const row: Record<string, unknown> = {}
    headers.forEach((h, j) => {
      row[h] = parts[j] ?? ''
    })
    rows.push(row)
  }
  return rows
}

function normalizeSocialImportRow(r: Record<string, unknown>): Record<string, unknown> {
  const pick = (a: string, b?: string) => {
    const v = r[a] ?? (b ? r[b] : '')
    return typeof v === 'string' ? v : String(v ?? '')
  }
  const sched = pick('scheduledat', 'scheduled_at')
  let scheduledAt: string | undefined
  if (sched) {
    const d = new Date(sched)
    if (!Number.isNaN(d.getTime())) scheduledAt = d.toISOString()
  }
  return {
    title: pick('title'),
    platform: pick('platform') || 'linkedin',
    caption: pick('caption', 'body'),
    status: pick('status') || 'draft',
    ...(scheduledAt ? { scheduledAt } : {}),
    ...(pick('campaignid', 'campaign_id') ? { campaignId: pick('campaignid', 'campaign_id') } : {}),
    ...(pick('hashtags') ? { hashtags: pick('hashtags') } : {}),
    ...(pick('linkurl', 'link_url') ? { linkUrl: pick('linkurl', 'link_url') } : {}),
    ...(pick('mediaimageurl', 'media_image_url') ? { mediaImageUrl: pick('mediaimageurl', 'media_image_url') } : {}),
    ...((): Record<string, unknown> => {
      const raw = pick('mediaimageurls', 'media_image_urls')
      if (!raw) return {}
      const urls = raw.split(/[|\n]+/).map((s) => s.trim()).filter(Boolean)
      return urls.length ? { mediaImageUrls: urls } : {}
    })(),
    ...((): Record<string, unknown> => {
      const rk = pick('redditpostkind', 'reddit_post_kind')
      return rk && rk.toLowerCase() === 'link' ? { redditPostKind: 'link' as const } : {}
    })(),
  }
}

const PLATFORMS: SocialPlatform[] = [
  'instagram',
  'facebook',
  'linkedin',
  'reddit',
  'whatsapp',
  'x',
  'tiktok',
  'youtube',
  'other',
]
/** Matches backend default fan-out. */
const FAN_OUT_PLATFORMS: SocialPlatform[] = ['linkedin', 'facebook', 'instagram', 'reddit', 'whatsapp']
const STATUSES: MarketingSocialStatus[] = [
  'idea',
  'draft',
  'in_review',
  'scheduled',
  'published',
  'archived',
]

type PublishCfg = {
  linkedIn: boolean
  metaFacebook: boolean
  instagram: boolean
  reddit: boolean
  whatsapp: boolean
} | null

function canPublishLive(row: MarketingSocialPost, cfg: PublishCfg): boolean {
  if (!cfg) return false
  if (row.status === 'published' && row.externalPostId) return false
  if (row.platform === 'linkedin') return cfg.linkedIn
  if (row.platform === 'facebook') return cfg.metaFacebook
  if (row.platform === 'instagram') return cfg.instagram
  if (row.platform === 'reddit') return cfg.reddit
  if (row.platform === 'whatsapp') return cfg.whatsapp
  return false
}

export function SocialPostsPage() {
  const { bundle, loading, reload } = useMarketingWorkspace()
  const campaigns = bundle?.campaigns ?? []
  const rows = useMemo(() => bundle?.social ?? [], [bundle?.social])

  const [statusFilter, setStatusFilter] = useState<string>('__all__')
  const [bulkOpen, setBulkOpen] = useState(false)
  const [bulkText, setBulkText] = useState('')
  const [bulkResult, setBulkResult] = useState<{ errors: string[]; createdCount: number } | null>(null)
  const [fanOutOpen, setFanOutOpen] = useState(false)
  const [fanOutRow, setFanOutRow] = useState<MarketingSocialPost | null>(null)
  const [fanOutAt, setFanOutAt] = useState('')
  const [fanOutPlatforms, setFanOutPlatforms] = useState<SocialPlatform[]>([...FAN_OUT_PLATFORMS])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [publishConfig, setPublishConfig] = useState<PublishCfg>(null)
  const [publishingId, setPublishingId] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState({
    title: '',
    platform: 'linkedin' as SocialPlatform,
    caption: '',
    scheduledAt: '',
    status: 'draft' as MarketingSocialStatus,
    hashtags: '',
    assetNotes: '',
    linkUrl: '',
    mediaImageUrl: '',
    mediaImageUrlsText: '',
    redditPostKind: 'self' as 'self' | 'link',
    utmCampaign: '',
    owner: '',
    campaignId: undefined as string | undefined,
  })

  const displayRows = useMemo(() => {
    let list = [...rows]
    if (statusFilter !== '__all__') list = list.filter((p) => p.status === statusFilter)
    return list.sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''))
  }, [rows, statusFilter])

  useEffect(() => {
    let cancelled = false
    void marketingWorkspaceApi.getSocialPublishConfig().then((c) => {
      if (!cancelled) setPublishConfig(c)
    })
    return () => {
      cancelled = true
    }
  }, [])

  const openCreate = () => {
    setEditingId(null)
    setForm({
      title: '',
      platform: 'linkedin',
      caption: '',
      scheduledAt: '',
      status: 'draft',
      hashtags: '',
      assetNotes: '',
      linkUrl: '',
      mediaImageUrl: '',
      mediaImageUrlsText: '',
      redditPostKind: 'self',
      utmCampaign: '',
      owner: '',
      campaignId: undefined,
    })
    setDialogOpen(true)
  }

  const openEdit = (row: MarketingSocialPost) => {
    setEditingId(row.id)
    setForm({
      title: row.title,
      platform: row.platform,
      caption: row.caption,
      scheduledAt: toDatetimeLocalValue(row.scheduledAt),
      status: row.status,
      hashtags: row.hashtags || '',
      assetNotes: row.assetNotes || '',
      linkUrl: row.linkUrl || '',
      mediaImageUrl: row.mediaImageUrl || '',
      mediaImageUrlsText: row.mediaImageUrls?.length ? row.mediaImageUrls.join('\n') : '',
      redditPostKind: row.redditPostKind === 'link' ? 'link' : 'self',
      utmCampaign: row.utmCampaign || '',
      owner: row.owner || '',
      campaignId: row.campaignId,
    })
    setDialogOpen(true)
  }

  const save = async () => {
    if (!form.title.trim()) return
    const scheduledAt = form.scheduledAt ? new Date(form.scheduledAt).toISOString() : undefined
    const carouselUrls = form.mediaImageUrlsText
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean)
    const payload: Record<string, unknown> = {
      title: form.title.trim(),
      platform: form.platform,
      caption: form.caption,
      scheduledAt,
      status: form.status,
      hashtags: form.hashtags || undefined,
      assetNotes: form.assetNotes || undefined,
      linkUrl: form.linkUrl || undefined,
      mediaImageUrl: form.mediaImageUrl || undefined,
      mediaImageUrls: carouselUrls.length ? carouselUrls : [],
      redditPostKind: form.redditPostKind,
      utmCampaign: form.utmCampaign || undefined,
      owner: form.owner || undefined,
      campaignId: form.campaignId,
    }
    if (editingId) {
      await marketingWorkspaceApi.updateSocial(editingId, payload)
    } else {
      await marketingWorkspaceApi.createSocial(payload)
    }
    setDialogOpen(false)
    await reload()
  }

  const remove = async (id: string) => {
    await marketingWorkspaceApi.deleteSocial(id)
    await reload()
  }

  const openFanOut = (row: MarketingSocialPost) => {
    setFanOutRow(row)
    setFanOutAt(row.scheduledAt ? toDatetimeLocalValue(row.scheduledAt) : '')
    setFanOutPlatforms([...FAN_OUT_PLATFORMS])
    setFanOutOpen(true)
  }

  const submitFanOut = async () => {
    if (!fanOutRow || fanOutPlatforms.length === 0) return
    const scheduledAt = fanOutAt ? new Date(fanOutAt).toISOString() : undefined
    await marketingWorkspaceApi.scheduleSocialAllPlatforms(fanOutRow.id, {
      scheduledAt,
      platforms: fanOutPlatforms,
    })
    setFanOutOpen(false)
    setFanOutRow(null)
    await reload()
  }

  const publishNow = async (row: MarketingSocialPost) => {
    setPublishingId(row.id)
    try {
      await marketingWorkspaceApi.publishSocial(row.id)
      await reload()
    } catch {
      await reload()
    } finally {
      setPublishingId(null)
    }
  }

  const runBulkImport = async () => {
    const parsed = parseSocialImportTable(bulkText).map(normalizeSocialImportRow)
    if (!parsed.length) {
      setBulkResult({ errors: ['Add a header row and at least one data row (comma or tab separated).'], createdCount: 0 })
      return
    }
    const res = await marketingWorkspaceApi.bulkCreateSocial(parsed)
    setBulkResult({ errors: res.errors ?? [], createdCount: res.createdCount ?? 0 })
    await reload()
  }

  const capLimit = getSocialCaptionLimit(form.platform)
  const capHealth = captionLengthHealth(form.caption.length, capLimit)

  return (
    <div className="container max-w-6xl py-6">
      <PageHeader
        title="Social posts"
        subtitle="Fan-out creates scheduled rows per network. Use Marketing → Live publish (or Settings → Social publish) to connect APIs for one-click publishing."
        icon={<Share2 className="h-8 w-8 text-primary" />}
        action={
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={() => { setBulkOpen(true); setBulkResult(null); setBulkText('') }}>
              <Upload className="mr-1.5 h-4 w-4" />
              Bulk import
            </Button>
            <Button type="button" onClick={openCreate}>
              <Plus className="mr-1.5 h-4 w-4" />
              New post
            </Button>
          </div>
        }
      />
      <MarketingWorkspaceSubnav />

      {publishConfig &&
      !publishConfig.linkedIn &&
      !publishConfig.metaFacebook &&
      !publishConfig.instagram &&
      !publishConfig.reddit &&
      !publishConfig.whatsapp ? (
        <div
          className="mb-4 rounded-lg border border-border bg-muted/40 px-4 py-3 text-sm text-foreground"
          role="status"
        >
          No live publish channels are configured yet.{' '}
          <Link to="/marketing/live-publish" className="font-medium text-primary underline-offset-4 hover:underline">
            Open Live publish
          </Link>{' '}
          to add credentials (or use Settings → Social publish if you have access).
        </div>
      ) : null}

      <div className="mb-4 flex flex-wrap items-end gap-3">
        <div className="space-y-1.5">
          <Label>Status filter</Label>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[11rem]">
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All statuses</SelectItem>
              {STATUSES.map((st) => (
                <SelectItem key={st} value={st}>
                  {CONTENT_STATUS_LABEL[st]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Platform</TableHead>
                <TableHead>Schedule</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden sm:table-cell">Kind</TableHead>
                <TableHead className="w-[140px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                    Loading…
                  </TableCell>
                </TableRow>
              ) : displayRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                    No posts yet.
                  </TableCell>
                </TableRow>
              ) : (
                displayRows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>
                      <div className="font-medium">{row.title}</div>
                      <div className="line-clamp-2 text-xs text-muted-foreground">{row.caption}</div>
                      {row.publishError ? (
                        <p className="mt-1 line-clamp-2 text-xs text-destructive">{row.publishError}</p>
                      ) : null}
                      {row.externalPermalink ? (
                        <a
                          href={row.externalPermalink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-1 inline-block text-xs font-medium text-primary underline-offset-2 hover:underline"
                        >
                          Open live post
                        </a>
                      ) : null}
                    </TableCell>
                    <TableCell>{SOCIAL_PLATFORM_LABEL[row.platform]}</TableCell>
                    <TableCell className="whitespace-nowrap text-sm">
                      {row.scheduledAt
                        ? new Date(row.scheduledAt).toLocaleString(undefined, {
                            dateStyle: 'short',
                            timeStyle: 'short',
                          })
                        : '—'}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{CONTENT_STATUS_LABEL[row.status]}</Badge>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      {row.sourcePostId ? (
                        <Badge variant="secondary" className="font-normal">
                          Network copy
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="font-normal">
                          Master
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {canPublishLive(row, publishConfig) ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          title="Publish to network (if that platform is configured in Live publish)"
                          disabled={publishingId === row.id}
                          onClick={() => void publishNow(row)}
                        >
                          <Rocket className="h-3.5 w-3.5" />
                        </Button>
                      ) : null}
                      {!row.sourcePostId ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          title="Schedule on all platforms"
                          onClick={() => openFanOut(row)}
                        >
                          <CalendarClock className="h-3.5 w-3.5" />
                        </Button>
                      ) : null}
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(row)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => void remove(row.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={fanOutOpen} onOpenChange={setFanOutOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Schedule on all platforms</DialogTitle>
          </DialogHeader>
          {fanOutRow ? (
            <div className="grid gap-4 py-1 text-sm">
              <p className="text-muted-foreground">
                Creates or updates a <strong className="text-foreground">scheduled</strong> post per selected network
                using this master&apos;s caption and links. Re-run anytime to refresh copies after you edit the master.
                Use the rocket on each row to push live when that platform is set up under Live publish.
              </p>
              <div className="rounded-md border bg-muted/40 p-3">
                <p className="font-medium text-foreground">{fanOutRow.title}</p>
                <p className="mt-1 line-clamp-4 text-xs text-muted-foreground">{fanOutRow.caption}</p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="fan-when">Go-live time (optional)</Label>
                <Input
                  id="fan-when"
                  type="datetime-local"
                  value={fanOutAt}
                  onChange={(e) => setFanOutAt(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">Leave empty to queue without a specific timestamp.</p>
              </div>
              <div className="space-y-2">
                <Label>Networks</Label>
                <div className="grid gap-2 sm:grid-cols-2">
                  {FAN_OUT_PLATFORMS.map((p) => (
                    <div key={p} className="flex items-center gap-2">
                      <Checkbox
                        id={`fan-${p}`}
                        checked={fanOutPlatforms.includes(p)}
                        onCheckedChange={(c) => {
                          if (c === 'indeterminate') return
                          setFanOutPlatforms((prev) => {
                            if (c) return prev.includes(p) ? prev : [...prev, p]
                            return prev.filter((x) => x !== p)
                          })
                        }}
                      />
                      <label htmlFor={`fan-${p}`} className="cursor-pointer text-sm leading-none">
                        {SOCIAL_PLATFORM_LABEL[p]}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : null}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setFanOutOpen(false)}>
              Cancel
            </Button>
            <Button type="button" disabled={!fanOutRow || fanOutPlatforms.length === 0} onClick={() => void submitFanOut()}>
              Schedule all selected
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit post' : 'New post'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <CampaignSelect
              campaigns={campaigns}
              value={form.campaignId}
              onChange={(id) => setForm((f) => ({ ...f, campaignId: id }))}
            />
            <div className="space-y-1.5">
              <Label htmlFor="p-title">Working title</Label>
              <Input
                id="p-title"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Platform</Label>
                <Select
                  value={form.platform}
                  onValueChange={(v) => setForm((f) => ({ ...f, platform: v as SocialPlatform }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PLATFORMS.map((p) => (
                      <SelectItem key={p} value={p}>
                        {SOCIAL_PLATFORM_LABEL[p]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select
                  value={form.status}
                  onValueChange={(v) => setForm((f) => ({ ...f, status: v as MarketingSocialStatus }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUSES.map((st) => (
                      <SelectItem key={st} value={st}>
                        {CONTENT_STATUS_LABEL[st]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {form.platform === 'reddit' ? (
              <div className="space-y-1.5">
                <Label>Reddit post type</Label>
                <Select
                  value={form.redditPostKind}
                  onValueChange={(v) => setForm((f) => ({ ...f, redditPostKind: v as 'self' | 'link' }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="self">Text (self) — title + caption in body</SelectItem>
                    <SelectItem value="link">Link — uses CTA link URL</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            ) : null}
            <div className="space-y-1.5">
              <Label htmlFor="p-when">Schedule (optional)</Label>
              <Input
                id="p-when"
                type="datetime-local"
                value={form.scheduledAt}
                onChange={(e) => setForm((f) => ({ ...f, scheduledAt: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <Label htmlFor="p-cap">Caption</Label>
                <span
                  className={cn(
                    'text-xs tabular-nums',
                    capHealth === 'over' && 'font-medium text-destructive',
                    capHealth === 'warn' && 'text-amber-600 dark:text-amber-500',
                    capHealth === 'ok' && 'text-muted-foreground',
                  )}
                >
                  {form.caption.length.toLocaleString()} / {capLimit.toLocaleString()} ({form.platform})
                </span>
              </div>
              <Textarea
                id="p-cap"
                className="min-h-[120px]"
                value={form.caption}
                onChange={(e) => setForm((f) => ({ ...f, caption: e.target.value }))}
              />
              <p className="text-xs text-muted-foreground">
                Limits are approximate per network; use as a planning guardrail.
              </p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="p-tags">Hashtags / keywords</Label>
              <Input
                id="p-tags"
                value={form.hashtags}
                onChange={(e) => setForm((f) => ({ ...f, hashtags: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="p-utm">UTM campaign</Label>
              <Input
                id="p-utm"
                value={form.utmCampaign}
                onChange={(e) => setForm((f) => ({ ...f, utmCampaign: e.target.value }))}
                placeholder="summer_sale_2026"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="p-assets">Asset notes</Label>
              <Textarea
                id="p-assets"
                className="min-h-[60px]"
                value={form.assetNotes}
                onChange={(e) => setForm((f) => ({ ...f, assetNotes: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="p-link">CTA link</Label>
              <Input
                id="p-link"
                value={form.linkUrl}
                onChange={(e) => setForm((f) => ({ ...f, linkUrl: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="p-media">Public image URL (Instagram)</Label>
              <Input
                id="p-media"
                className="font-mono text-xs"
                placeholder="https://…jpg (or use CTA link if it points to the image file)"
                value={form.mediaImageUrl}
                onChange={(e) => setForm((f) => ({ ...f, mediaImageUrl: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="p-carousel">Carousel image URLs (Instagram)</Label>
              <Textarea
                id="p-carousel"
                className="min-h-[72px] font-mono text-xs"
                placeholder={'https://…/2.jpg\nhttps://…/3.jpg'}
                value={form.mediaImageUrlsText}
                onChange={(e) => setForm((f) => ({ ...f, mediaImageUrlsText: e.target.value }))}
              />
              <p className="text-xs text-muted-foreground">
                One https URL per line. Two or more lines (plus optional primary image above) publishes as a carousel. Max 10
                images.
              </p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="p-owner">Owner</Label>
              <Input
                id="p-owner"
                value={form.owner}
                onChange={(e) => setForm((f) => ({ ...f, owner: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => void save()}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={bulkOpen} onOpenChange={setBulkOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Bulk import posts</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Paste CSV or TSV with a header row. Required:{' '}
            <code className="rounded bg-muted px-1 text-xs">title</code>,{' '}
            <code className="rounded bg-muted px-1 text-xs">platform</code>,{' '}
            <code className="rounded bg-muted px-1 text-xs">caption</code>. Optional:{' '}
            <code className="rounded bg-muted px-1 text-xs">status</code>,{' '}
            <code className="rounded bg-muted px-1 text-xs">scheduledAt</code>,{' '}
            <code className="rounded bg-muted px-1 text-xs">campaignId</code>,{' '}
            <code className="rounded bg-muted px-1 text-xs">hashtags</code>,{' '}
            <code className="rounded bg-muted px-1 text-xs">linkUrl</code>,{' '}
            <code className="rounded bg-muted px-1 text-xs">mediaImageUrl</code>,{' '}
            <code className="rounded bg-muted px-1 text-xs">mediaImageUrls</code> (pipe-separated https URLs),{' '}
            <code className="rounded bg-muted px-1 text-xs">redditPostKind</code> (<code className="rounded bg-muted px-1 text-xs">link</code>{' '}
            or self).
          </p>
          <Textarea
            className="min-h-[160px] font-mono text-xs"
            placeholder={'title,platform,caption,status\n"Launch post",linkedin,"Hello world",draft'}
            value={bulkText}
            onChange={(e) => setBulkText(e.target.value)}
          />
          {bulkResult ? (
            <div className="rounded-md border p-3 text-sm">
              <p className="font-medium">Created {bulkResult.createdCount} posts</p>
              {bulkResult.errors.length > 0 ? (
                <ul className="mt-2 max-h-40 list-inside list-disc overflow-y-auto text-destructive">
                  {bulkResult.errors.slice(0, 25).map((err) => (
                    <li key={err}>{err}</li>
                  ))}
                </ul>
              ) : (
                <p className="mt-1 text-muted-foreground">No row errors.</p>
              )}
            </div>
          ) : null}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setBulkOpen(false)}>
              Close
            </Button>
            <Button type="button" onClick={() => void runBulkImport()}>
              Import
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
