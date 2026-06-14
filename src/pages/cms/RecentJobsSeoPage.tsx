import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Button,
  Card,
  CardContent,
  Input,
  Label,
  Textarea,
  Badge,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  useToast,
} from '../../components/ui'
import { PageHeader } from '../../components/common/PageHeader'
import {
  SeoService,
  type RecentJobsData,
  type ManualRecentJobsMap,
} from '../../services/api'
import {
  Briefcase,
  Loader2,
  RefreshCw,
  MapPin,
  AlertCircle,
  ShieldCheck,
  Plus,
  Trash2,
  Save,
  Pencil,
  Clock,
} from 'lucide-react'

function formatSlug(slug: string): string {
  return slug
    .split('-')
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

function formatDuration(mins?: number): string {
  if (!mins || mins <= 0) return '—'
  if (mins < 60) return `${mins} min`
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return m ? `${h} hr ${m} min` : `${h} hr`
}

function newId(): string {
  try {
    return crypto.randomUUID()
  } catch {
    return `row-${Math.random().toString(36).slice(2)}-${Date.now()}`
  }
}

interface EditorRow {
  id: string
  locality: string
  service: string
  serviceName: string
  area: string
  completedAt: string
  durationMins: string
  problem: string
  resolution: string
}

function emptyRow(): EditorRow {
  return {
    id: newId(),
    locality: '',
    service: '',
    serviceName: '',
    area: '',
    completedAt: '',
    durationMins: '',
    problem: '',
    resolution: '',
  }
}

function mapToRows(map: ManualRecentJobsMap): EditorRow[] {
  const rows: EditorRow[] = []
  for (const [locality, jobs] of Object.entries(map || {})) {
    for (const j of jobs || []) {
      rows.push({
        id: newId(),
        locality,
        service: j.service || '',
        serviceName: j.serviceName || '',
        area: j.area || '',
        completedAt: (j.completedAt || '').slice(0, 10),
        durationMins: j.durationMins != null ? String(j.durationMins) : '',
        problem: j.problem || '',
        resolution: j.resolution || '',
      })
    }
  }
  return rows
}

function rowsToMap(rows: EditorRow[]): ManualRecentJobsMap {
  const map: ManualRecentJobsMap = {}
  for (const r of rows) {
    const locality = r.locality.trim().toLowerCase()
    const service = r.service.trim().toLowerCase()
    const serviceName = r.serviceName.trim()
    const area = r.area.trim()
    const completedAt = r.completedAt.trim()
    if (!locality || !service || !serviceName || !area || !completedAt) continue
    const duration = Number.parseInt(r.durationMins, 10)
    ;(map[locality] ??= []).push({
      service,
      serviceName,
      area,
      completedAt,
      ...(Number.isFinite(duration) && duration > 0 ? { durationMins: duration } : {}),
      ...(r.problem.trim() ? { problem: r.problem.trim() } : {}),
      ...(r.resolution.trim() ? { resolution: r.resolution.trim() } : {}),
    })
  }
  return map
}

function rowIsComplete(r: EditorRow): boolean {
  return Boolean(
    r.locality.trim() &&
      r.service.trim() &&
      r.serviceName.trim() &&
      r.area.trim() &&
      r.completedAt.trim(),
  )
}

function StatCard({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="mt-1 text-2xl font-semibold text-foreground">{value}</p>
      </CardContent>
    </Card>
  )
}

export default function RecentJobsSeoPage() {
  const { toast } = useToast()
  const [data, setData] = useState<RecentJobsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [rows, setRows] = useState<EditorRow[]>([])
  const [savedRowsKey, setSavedRowsKey] = useState('')
  const [saving, setSaving] = useState(false)

  // Dialog state for add/edit
  const [dialogOpen, setDialogOpen] = useState(false)
  const [draft, setDraft] = useState<EditorRow | null>(null)
  const [draftIsNew, setDraftIsNew] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [feed, manual] = await Promise.all([
        SeoService.getRecentJobs(),
        SeoService.getManualRecentJobs(),
      ])
      if (feed.success && feed.data) setData(feed.data)
      else setData(null)
      const manualMap = manual.success && manual.data ? manual.data : {}
      const mapped = mapToRows(manualMap)
      setRows(mapped)
      setSavedRowsKey(JSON.stringify(rowsToMap(mapped)))
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load recent jobs')
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const localityEntries = useMemo(
    () => (data ? Object.entries(data.jobs).sort((a, b) => b[1].length - a[1].length) : []),
    [data],
  )

  const knownLocalities = useMemo(() => {
    const set = new Set<string>()
    if (data) Object.keys(data.jobs).forEach((s) => set.add(s))
    rows.forEach((r) => r.locality && set.add(r.locality.trim().toLowerCase()))
    return Array.from(set).sort()
  }, [data, rows])

  const dirty = useMemo(() => JSON.stringify(rowsToMap(rows)) !== savedRowsKey, [rows, savedRowsKey])

  const openAdd = () => {
    setDraft(emptyRow())
    setDraftIsNew(true)
    setDialogOpen(true)
  }

  const openEdit = (row: EditorRow) => {
    setDraft({ ...row })
    setDraftIsNew(false)
    setDialogOpen(true)
  }

  const patchDraft = (patch: Partial<EditorRow>) =>
    setDraft((prev) => (prev ? { ...prev, ...patch } : prev))

  const commitDraft = () => {
    if (!draft) return
    setRows((prev) => {
      const exists = prev.some((r) => r.id === draft.id)
      return exists ? prev.map((r) => (r.id === draft.id ? draft : r)) : [...prev, draft]
    })
    setDialogOpen(false)
    setDraft(null)
  }

  const removeRow = (id: string) => setRows((prev) => prev.filter((r) => r.id !== id))

  const save = useCallback(async () => {
    setSaving(true)
    try {
      const payload = rowsToMap(rows)
      const res = await SeoService.saveManualRecentJobs(payload)
      if (res.success) {
        toast({ title: 'Saved', description: 'Curated recent jobs updated.' })
        setSavedRowsKey(JSON.stringify(payload))
        const feed = await SeoService.getRecentJobs()
        if (feed.success && feed.data) setData(feed.data)
      } else {
        toast({ title: 'Save failed', description: res.message || 'Try again', variant: 'destructive' })
      }
    } catch (e: unknown) {
      toast({
        title: 'Save failed',
        description: e instanceof Error ? e.message : 'Try again',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }, [rows, toast])

  const curatedByLocality = useMemo(() => {
    const groups = new Map<string, EditorRow[]>()
    for (const r of rows) {
      const key = r.locality.trim().toLowerCase() || '(unassigned)'
      const list = groups.get(key) ?? []
      list.push(r)
      groups.set(key, list)
    }
    return Array.from(groups.entries()).sort((a, b) => a[0].localeCompare(b[0]))
  }, [rows])

  const draftValid = draft ? rowIsComplete(draft) : false

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
      <PageHeader
        title="Recent Jobs (SEO)"
        subtitle="Recently completed jobs shown on hyperlocal pages. Real bookings are added automatically (anonymized); you can also curate your own for extra trust."
        icon={<Briefcase className="h-6 w-6" />}
        action={
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => void load()} disabled={loading || saving}>
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 h-4 w-4" />
              )}
              Refresh
            </Button>
            <Button onClick={() => void save()} disabled={saving || !dirty}>
              {saving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Save changes{dirty ? ' *' : ''}
            </Button>
          </div>
        }
      />

      <div className="mb-6 flex items-start gap-2 rounded-lg border border-border bg-muted/40 p-3 text-sm text-muted-foreground">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
        <span>
          Auto jobs are derived from completed bookings, minimized (no names, phones, or addresses),
          day-rounded, and k-anonymity gated. Curated jobs you add below are merged in and shown first.
          Keep them truthful — they appear publicly and feed SEO trust signals.
        </span>
      </div>

      {data?.meta && (
        <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-5">
          <StatCard label="Localities" value={data.meta.localities} />
          <StatCard label="Total jobs" value={data.meta.total_jobs} />
          <StatCard label="Auto" value={data.meta.auto_jobs} />
          <StatCard label="Curated" value={data.meta.manual_jobs} />
          <StatCard label="Window" value={`${data.meta.window_days}d`} />
        </div>
      )}

      {/* ---- Curated jobs (managed via dialog) ---- */}
      <Card className="mb-8">
        <CardContent className="p-0">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
            <div>
              <h2 className="text-base font-semibold text-foreground">Curated jobs</h2>
              <p className="text-xs text-muted-foreground">
                Hand-written jobs that appear publicly alongside real bookings. Remember to Save changes.
              </p>
            </div>
            <Button size="sm" onClick={openAdd} disabled={saving}>
              <Plus className="mr-1.5 h-4 w-4" /> Add job
            </Button>
          </div>

          {rows.length === 0 ? (
            <div className="px-4 py-12 text-center text-sm text-muted-foreground">
              <Briefcase className="mx-auto mb-3 h-9 w-9 opacity-40" />
              <p className="font-medium text-foreground">No curated jobs yet</p>
              <p className="mt-1">
                Click <span className="font-medium text-foreground">Add job</span> to create one.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {curatedByLocality.map(([locality, list]) => (
                <div key={locality} className="px-4 py-4">
                  <div className="mb-3 flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-primary" />
                    <h3 className="text-sm font-semibold text-foreground">
                      {locality === '(unassigned)' ? 'Unassigned (set a locality)' : formatSlug(locality)}
                    </h3>
                    <Badge variant="secondary">{list.length}</Badge>
                  </div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {list.map((r) => {
                      const incomplete = !rowIsComplete(r)
                      return (
                        <div
                          key={r.id}
                          className="group flex items-start justify-between gap-3 rounded-lg border border-border bg-card p-3"
                        >
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-medium text-foreground">
                                {r.serviceName || 'Untitled job'}
                              </span>
                              {r.service ? <Badge variant="outline">{formatSlug(r.service)}</Badge> : null}
                              {incomplete ? (
                                <Badge variant="warning">Incomplete</Badge>
                              ) : null}
                            </div>
                            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                              {r.area ? (
                                <span className="inline-flex items-center gap-1">
                                  <MapPin className="h-3 w-3" />
                                  {r.area}
                                </span>
                              ) : null}
                              {r.completedAt ? <span>{formatDate(r.completedAt)}</span> : null}
                              {r.durationMins ? (
                                <span className="inline-flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {formatDuration(Number(r.durationMins))}
                                </span>
                              ) : null}
                            </div>
                            {r.problem || r.resolution ? (
                              <p className="mt-1.5 truncate text-xs text-muted-foreground">
                                {[r.problem, r.resolution].filter(Boolean).join(' → ')}
                              </p>
                            ) : null}
                          </div>
                          <div className="flex shrink-0 items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openEdit(r)}
                              aria-label="Edit job"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removeRow(r.id)}
                              aria-label="Remove job"
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ---- Add/Edit dialog ---- */}
      <Dialog
        open={dialogOpen}
        onOpenChange={(o) => {
          setDialogOpen(o)
          if (!o) setDraft(null)
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{draftIsNew ? 'Add curated job' : 'Edit curated job'}</DialogTitle>
            <DialogDescription>
              These details appear publicly on the locality page. Fields marked * are required.
            </DialogDescription>
          </DialogHeader>

          {draft && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="f-locality">Locality slug *</Label>
                <Input
                  id="f-locality"
                  list="known-localities"
                  value={draft.locality}
                  placeholder="mira-bhayandar"
                  onChange={(e) => patchDraft({ locality: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="f-service">Category slug *</Label>
                <Input
                  id="f-service"
                  value={draft.service}
                  placeholder="electrician"
                  onChange={(e) => patchDraft({ service: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="f-serviceName">Service name *</Label>
                <Input
                  id="f-serviceName"
                  value={draft.serviceName}
                  placeholder="MCB Replacement"
                  onChange={(e) => patchDraft({ serviceName: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="f-area">Area / society *</Label>
                <Input
                  id="f-area"
                  value={draft.area}
                  placeholder="JP North"
                  onChange={(e) => patchDraft({ area: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="f-date">Completed date *</Label>
                <Input
                  id="f-date"
                  type="date"
                  value={draft.completedAt}
                  onChange={(e) => patchDraft({ completedAt: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="f-duration">Duration (minutes)</Label>
                <Input
                  id="f-duration"
                  type="number"
                  min={0}
                  value={draft.durationMins}
                  placeholder="45"
                  onChange={(e) => patchDraft({ durationMins: e.target.value })}
                />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="f-problem">Problem (optional)</Label>
                <Textarea
                  id="f-problem"
                  rows={2}
                  value={draft.problem}
                  placeholder="Power tripping due to faulty MCB"
                  onChange={(e) => patchDraft({ problem: e.target.value })}
                />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="f-resolution">Resolution (optional)</Label>
                <Textarea
                  id="f-resolution"
                  rows={2}
                  value={draft.resolution}
                  placeholder="Replaced MCB and tested all circuits"
                  onChange={(e) => patchDraft({ resolution: e.target.value })}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={commitDraft} disabled={!draftValid}>
              {draftIsNew ? 'Add job' : 'Update job'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <datalist id="known-localities">
        {knownLocalities.map((s) => (
          <option key={s} value={s} />
        ))}
      </datalist>

      {/* ---- Live merged preview ---- */}
      <h2 className="mb-3 text-lg font-semibold text-foreground">Live preview (auto + curated)</h2>
      {loading && !data ? (
        <div className="flex items-center justify-center gap-2 py-24 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
          Loading recent jobs…
        </div>
      ) : error ? (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          <AlertCircle className="h-5 w-5 shrink-0" />
          {error}
        </div>
      ) : localityEntries.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center text-muted-foreground">
            <Briefcase className="mx-auto mb-3 h-10 w-10 opacity-40" />
            <p className="font-medium text-foreground">No recent jobs to show yet</p>
            <p className="mt-1 text-sm">
              Once enough bookings are completed — or you add curated jobs above — they&apos;ll appear here
              and on the public locality pages.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {localityEntries.map(([slug, jobs]) => (
            <Card key={slug}>
              <CardContent className="p-0">
                <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-primary" />
                    <h3 className="text-base font-semibold text-foreground">{formatSlug(slug)}</h3>
                    <span className="text-xs text-muted-foreground">/{slug}</span>
                  </div>
                  <Badge variant="secondary">{jobs.length} jobs</Badge>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead>Service</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Area</TableHead>
                      <TableHead>Completed</TableHead>
                      <TableHead className="text-right">Duration</TableHead>
                      <TableHead className="text-right">Source</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {jobs.map((job, i) => (
                      <TableRow key={`${slug}-${i}`}>
                        <TableCell className="font-medium text-foreground">{job.serviceName}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{formatSlug(job.service)}</Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{job.area}</TableCell>
                        <TableCell className="text-muted-foreground">{formatDate(job.completedAt)}</TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          {formatDuration(job.durationMins)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge variant={job.source === 'manual' ? 'success' : 'secondary'}>
                            {job.source === 'manual' ? 'Curated' : 'Auto'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
