import React, { useCallback, useMemo, useState } from 'react'
import { addWeeks, format, parseISO, startOfWeek } from 'date-fns'
import { CalendarDays, Pencil, Plus, Trash2 } from 'lucide-react'
import { PageHeader } from '../../components/common/PageHeader'
import { MarketingWorkspaceSubnav } from '../../components/marketing-workspace/MarketingWorkspaceSubnav'
import { CampaignSelect } from '../../components/marketing-workspace/CampaignSelect'
import { CalendarWeekBoard } from '../../components/marketing-workspace/CalendarWeekBoard'
import { useMarketingWorkspace } from '../../hooks/useMarketingWorkspace'
import { marketingWorkspaceApi } from '../../services/api/marketingWorkspace.api'
import type { MarketingCalendarItem, MarketingCalendarStatus, MarketingContentType } from '../../types/marketingWorkspace.types'
import {
  APPROVAL_STEP_STATUS_LABEL,
  CONTENT_STATUS_LABEL,
  CONTENT_TYPE_LABEL,
} from '../../lib/marketingWorkspaceLabels'
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
import { Tabs, TabsList, TabsTrigger } from '../../components/ui/tabs'
import { cn } from '../../lib/utils'

const STATUSES: MarketingCalendarStatus[] = [
  'idea',
  'draft',
  'in_review',
  'scheduled',
  'published',
  'archived',
]
const CONTENT_TYPES: MarketingContentType[] = [
  'blog',
  'newsletter',
  'video',
  'whitepaper',
  'case_study',
  'infographic',
  'social',
  'other',
]

export function ContentCalendarPage() {
  const [view, setView] = useState<'month' | 'week'>('month')
  const [month, setMonth] = useState(() => new Date().toISOString().slice(0, 7))
  const [weekStart, setWeekStart] = useState(() =>
    format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd'),
  )
  const [calendarCampaignId, setCalendarCampaignId] = useState<string | undefined>()

  const workspaceQuery = useMemo(() => {
    const q: { month?: string; weekStart?: string; calendarCampaignId?: string } = {}
    if (calendarCampaignId) q.calendarCampaignId = calendarCampaignId
    if (view === 'week') q.weekStart = weekStart
    else q.month = month
    return q
  }, [view, month, weekStart, calendarCampaignId])

  const { bundle, loading, reload } = useMarketingWorkspace(workspaceQuery)
  const campaigns = bundle?.campaigns ?? []
  const filtered = useMemo(() => bundle?.calendar ?? [], [bundle?.calendar])

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [approvalNote, setApprovalNote] = useState('')
  const [form, setForm] = useState({
    title: '',
    scheduledDate: `${month}-15`,
    contentType: 'blog' as MarketingContentType,
    channel: 'Blog',
    status: 'draft' as MarketingCalendarStatus,
    approvalStage: '',
    approvalTemplate: '' as '' | 'editorial_v1',
    objective: '',
    audience: '',
    notes: '',
    owner: '',
    relatedUrl: '',
    assetUrlsText: '',
    recurringRule: '',
    campaignId: undefined as string | undefined,
  })

  const editingRow = useMemo(
    () => (editingId ? bundle?.calendar.find((c) => c.id === editingId) ?? null : null),
    [bundle?.calendar, editingId],
  )

  const openCreate = () => {
    setEditingId(null)
    setApprovalNote('')
    setForm({
      title: '',
      scheduledDate: `${month}-15`,
      contentType: 'blog',
      channel: 'Blog',
      status: 'draft',
      approvalStage: '',
      approvalTemplate: '',
      objective: '',
      audience: '',
      notes: '',
      owner: '',
      relatedUrl: '',
      assetUrlsText: '',
      recurringRule: '',
      campaignId: undefined,
    })
    setDialogOpen(true)
  }

  const openEdit = (row: MarketingCalendarItem) => {
    setEditingId(row.id)
    setApprovalNote('')
    setForm({
      title: row.title,
      scheduledDate: row.scheduledDate.slice(0, 10),
      contentType: row.contentType,
      channel: row.channel,
      status: row.status,
      approvalStage: row.approvalStage || '',
      approvalTemplate: '',
      objective: row.objective || '',
      audience: row.audience || '',
      notes: row.notes || '',
      owner: row.owner || '',
      relatedUrl: row.relatedUrl || '',
      assetUrlsText: (row.assetUrls || []).join('\n'),
      recurringRule: row.recurringRule || '',
      campaignId: row.campaignId,
    })
    setDialogOpen(true)
  }

  const save = async () => {
    if (!form.title.trim()) return
    const assetUrls = form.assetUrlsText
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean)
    const payload: Record<string, unknown> = {
      title: form.title.trim(),
      scheduledDate: form.scheduledDate,
      contentType: form.contentType,
      channel: form.channel,
      status: form.status,
      approvalStage: form.approvalStage || undefined,
      objective: form.objective || undefined,
      audience: form.audience || undefined,
      notes: form.notes || undefined,
      owner: form.owner || undefined,
      relatedUrl: form.relatedUrl || undefined,
      assetUrls,
      recurringRule: form.recurringRule || undefined,
      campaignId: form.campaignId,
    }
    if (!editingId && form.approvalTemplate === 'editorial_v1') {
      payload.approvalTemplate = 'editorial_v1'
    }
    if (editingId) {
      await marketingWorkspaceApi.updateCalendar(editingId, payload)
    } else {
      await marketingWorkspaceApi.createCalendar(payload)
    }
    setDialogOpen(false)
    await reload()
  }

  const remove = async (id: string) => {
    await marketingWorkspaceApi.deleteCalendar(id)
    await reload()
  }

  const onWeekShift = useCallback((deltaWeeks: number) => {
    setWeekStart(format(addWeeks(parseISO(`${weekStart}T12:00:00`), deltaWeeks), 'yyyy-MM-dd'))
  }, [weekStart])

  const onReschedule = useCallback(
    async (entryId: string, newDate: string) => {
      await marketingWorkspaceApi.rescheduleCalendar(entryId, newDate)
      await reload()
    },
    [reload],
  )

  const runApproval = async (stepIndex: number, status: 'approved' | 'rejected' | 'waived') => {
    if (!editingId) return
    await marketingWorkspaceApi.patchCalendarApprovalStep(editingId, stepIndex, {
      status,
      note: approvalNote.trim() || undefined,
      autoAdvanceToScheduled: true,
    })
    setApprovalNote('')
    await reload()
  }

  const approvalSummary = (row: MarketingCalendarItem) => {
    const steps = row.approvalSteps
    if (!steps?.length) return '—'
    const done = steps.filter((s) => s.status === 'approved' || s.status === 'waived').length
    return `${done}/${steps.length}`
  }

  return (
    <div className="container max-w-6xl py-6">
      <PageHeader
        title="Content calendar"
        subtitle="Editorial schedule, multi-step approvals, and drag-to-reschedule in week view — scoped per campaign."
        icon={<CalendarDays className="h-8 w-8 text-primary" />}
        action={
          <Button onClick={openCreate}>
            <Plus className="mr-1.5 h-4 w-4" />
            Add entry
          </Button>
        }
      />
      <MarketingWorkspaceSubnav />

      <div className="mb-4 flex flex-wrap items-end gap-3">
        <Tabs
          value={view}
          onValueChange={(v) => {
            const next = v as 'month' | 'week'
            setView(next)
            if (next === 'week') {
              setWeekStart(
                format(startOfWeek(parseISO(`${month}-01T12:00:00`), { weekStartsOn: 1 }), 'yyyy-MM-dd'),
              )
            }
          }}
          className="w-full sm:w-auto"
        >
          <TabsList>
            <TabsTrigger value="month">Month list</TabsTrigger>
            <TabsTrigger value="week">Week board</TabsTrigger>
          </TabsList>
        </Tabs>
        {view === 'month' ? (
          <div className="space-y-1.5">
            <Label htmlFor="cal-month">Month</Label>
            <Input
              id="cal-month"
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="w-[11rem]"
            />
          </div>
        ) : null}
        <div className="min-w-[12rem] flex-1 space-y-1.5 sm:max-w-xs">
          <Label>Campaign filter</Label>
          <CampaignSelect
            campaigns={campaigns}
            value={calendarCampaignId}
            onChange={setCalendarCampaignId}
            label=""
          />
        </div>
      </div>

      {view === 'week' ? (
        <Card className="mb-6">
          <CardContent className="p-4">
            <CalendarWeekBoard
              weekStart={weekStart}
              entries={filtered}
              onWeekShift={onWeekShift}
              onReschedule={onReschedule}
              disabled={loading}
            />
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Channel</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Approvals</TableHead>
                <TableHead className="w-[100px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                    Loading…
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                    No entries in this view.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="whitespace-nowrap font-medium">{row.scheduledDate}</TableCell>
                    <TableCell>
                      <div className="font-medium">{row.title}</div>
                      {row.objective ? (
                        <div className="text-xs text-muted-foreground line-clamp-1">{row.objective}</div>
                      ) : null}
                    </TableCell>
                    <TableCell>{CONTENT_TYPE_LABEL[row.contentType]}</TableCell>
                    <TableCell>{row.channel}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{CONTENT_STATUS_LABEL[row.status]}</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{approvalSummary(row)}</TableCell>
                    <TableCell className="text-right">
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

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit calendar entry' : 'New calendar entry'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <CampaignSelect
              campaigns={campaigns}
              value={form.campaignId}
              onChange={(id) => setForm((f) => ({ ...f, campaignId: id }))}
            />
            <div className="space-y-1.5">
              <Label htmlFor="f-title">Title</Label>
              <Input
                id="f-title"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="f-date">Date</Label>
                <Input
                  id="f-date"
                  type="date"
                  value={form.scheduledDate}
                  onChange={(e) => setForm((f) => ({ ...f, scheduledDate: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select
                  value={form.status}
                  onValueChange={(v) => setForm((f) => ({ ...f, status: v as MarketingCalendarStatus }))}
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
            {!editingId ? (
              <div className="space-y-1.5">
                <Label>Approval template</Label>
                <Select
                  value={form.approvalTemplate || '__none__'}
                  onValueChange={(v) =>
                    setForm((f) => ({ ...f, approvalTemplate: v === '__none__' ? '' : 'editorial_v1' }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Optional" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">None</SelectItem>
                    <SelectItem value="editorial_v1">Editorial — 3 steps (content, brand, legal)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Adds a structured review chain. You can still track a free-text approval stage below.
                </p>
              </div>
            ) : null}
            <div className="space-y-1.5">
              <Label>Content type</Label>
              <Select
                value={form.contentType}
                onValueChange={(v) => setForm((f) => ({ ...f, contentType: v as MarketingContentType }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CONTENT_TYPES.map((ct) => (
                    <SelectItem key={ct} value={ct}>
                      {CONTENT_TYPE_LABEL[ct]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="f-channel">Channel / surface</Label>
              <Input
                id="f-channel"
                value={form.channel}
                onChange={(e) => setForm((f) => ({ ...f, channel: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="f-approval">Approval stage (label)</Label>
              <Input
                id="f-approval"
                value={form.approvalStage}
                onChange={(e) => setForm((f) => ({ ...f, approvalStage: e.target.value }))}
                placeholder="e.g. Legal pending"
              />
            </div>
            {editingId && editingRow?.approvalSteps && editingRow.approvalSteps.length > 0 ? (
              <div className="space-y-3 rounded-lg border bg-muted/40 p-3">
                <Label className="text-foreground">Structured approvals</Label>
                <Textarea
                  className="min-h-[56px] text-sm"
                  placeholder="Optional note for the next decision…"
                  value={approvalNote}
                  onChange={(e) => setApprovalNote(e.target.value)}
                />
                <div className="space-y-3">
                  {editingRow.approvalSteps.map((step, i) => (
                    <div key={`${step.key}-${i}`} className="rounded-md border bg-background p-2 text-sm">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <span className="font-medium">{step.label}</span>
                          {step.roleHint ? (
                            <span className="text-muted-foreground"> · {step.roleHint}</span>
                          ) : null}
                        </div>
                        <Badge variant={step.status === 'pending' ? 'secondary' : 'outline'}>
                          {APPROVAL_STEP_STATUS_LABEL[step.status]}
                        </Badge>
                      </div>
                      {step.status === 'pending' ? (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          <Button type="button" size="sm" variant="secondary" onClick={() => void runApproval(i, 'approved')}>
                            Approve
                          </Button>
                          <Button type="button" size="sm" variant="outline" onClick={() => void runApproval(i, 'waived')}>
                            Waive
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="destructive"
                            className="bg-destructive/90"
                            onClick={() => void runApproval(i, 'rejected')}
                          >
                            Reject
                          </Button>
                        </div>
                      ) : null}
                      {step.note ? (
                        <p className="mt-1 text-xs text-muted-foreground">Note: {step.note}</p>
                      ) : null}
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  When every step is approved or waived, you can auto-advance to scheduled (enabled above).
                </p>
              </div>
            ) : null}
            <div className="space-y-1.5">
              <Label htmlFor="f-objective">Objective</Label>
              <Input
                id="f-objective"
                value={form.objective}
                onChange={(e) => setForm((f) => ({ ...f, objective: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="f-audience">Audience</Label>
              <Input
                id="f-audience"
                value={form.audience}
                onChange={(e) => setForm((f) => ({ ...f, audience: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="f-owner">Owner</Label>
              <Input
                id="f-owner"
                value={form.owner}
                onChange={(e) => setForm((f) => ({ ...f, owner: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="f-url">Related URL</Label>
              <Input
                id="f-url"
                value={form.relatedUrl}
                onChange={(e) => setForm((f) => ({ ...f, relatedUrl: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="f-assets">Asset URLs (one per line)</Label>
              <Textarea
                id="f-assets"
                className={cn('min-h-[72px] font-mono text-xs')}
                value={form.assetUrlsText}
                onChange={(e) => setForm((f) => ({ ...f, assetUrlsText: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="f-recur">Recurring rule</Label>
              <Input
                id="f-recur"
                value={form.recurringRule}
                onChange={(e) => setForm((f) => ({ ...f, recurringRule: e.target.value }))}
                placeholder="e.g. weekly-newsletter"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="f-notes">Notes</Label>
              <Textarea
                id="f-notes"
                className={cn('min-h-[80px]')}
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
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
    </div>
  )
}
