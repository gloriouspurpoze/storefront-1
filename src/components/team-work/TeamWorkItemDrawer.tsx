import React, { useEffect, useMemo, useState } from 'react'
import { format } from 'date-fns'
import { CalendarPlus, Loader2, MessageSquare, Pencil, Tag, Trash2, UserMinus, UserPlus, X } from 'lucide-react'
import { teamWorkApi } from '../../services/api/teamWork.api'
import type { TeamWorkItem, TeamWorkMeta, TeamWorkTagCatalogEntry } from '../../types/teamWork.types'
import { teamWorkTagDisplayName, teamWorkTagSlug } from '../../lib/teamWorkTags'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Textarea } from '../ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { cn } from '../../lib/utils'
import { ConfirmDialog } from '../common/ConfirmDialog'
import { ScheduleMeetingDialog } from './ScheduleMeetingDialog'
import type { User } from '../../services/api/users.service'
import { assigneeSwatchClass, initialsFromLabel, PRIORITY_CHIP, priorityLabel } from '../../lib/teamWorkVisuals'

type Props = {
  open: boolean
  itemId: string | null
  /** Current board — used for tags API and catalog. */
  projectId: string | null
  meta: TeamWorkMeta | null
  onClose: () => void
  canManage: boolean
  onUpdated: () => void
  onDeleted: () => void
  epics: TeamWorkItem[]
  adminUsers: User[]
  assigneeMap: Map<string, string>
  /** Logged-in user id for “Assign to me”. */
  currentUserId?: string
  /** Preset tags from the project (refreshed when parent reloads projects). */
  projectTagCatalog?: TeamWorkTagCatalogEntry[]
  /** After saving tag catalog on the project. */
  onProjectTagCatalogChanged?: () => void | Promise<void>
}

function userLabel(u: User): string {
  const n = `${u.firstName || ''} ${u.lastName || ''}`.trim()
  return n || u.email || u.id
}

export function TeamWorkItemDrawer({
  open,
  itemId,
  projectId,
  meta,
  onClose,
  canManage,
  onUpdated,
  onDeleted,
  epics,
  adminUsers,
  assigneeMap,
  currentUserId,
  projectTagCatalog = [],
  onProjectTagCatalogChanged,
}: Props) {
  const [item, setItem] = useState<TeamWorkItem | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [comment, setComment] = useState('')
  const [posting, setPosting] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [scheduleMeetingOpen, setScheduleMeetingOpen] = useState(false)
  const [form, setForm] = useState<Partial<TeamWorkItem>>({})
  const [tagOptions, setTagOptions] = useState<{ catalog: TeamWorkTagCatalogEntry[]; inUse: string[] } | null>(null)
  const [newCustomTag, setNewCustomTag] = useState('')
  const [savingCatalog, setSavingCatalog] = useState(false)

  useEffect(() => {
    if (!open || !itemId) {
      setItem(null)
      return
    }
    let cancelled = false
    setLoading(true)
    teamWorkApi
      .getItem(itemId)
      .then((row) => {
        if (cancelled) return
        setItem(row)
        setForm({
          title: row.title,
          description: row.description,
          status: row.status,
          priority: row.priority,
          issueType: row.issueType,
          assigneeUserId: row.assigneeUserId,
          labels: row.labels,
          dueAt: row.dueAt,
          epicId: row.epicId,
          storyPoints: row.storyPoints,
        })
      })
      .catch(() => {
        if (!cancelled) setItem(null)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [open, itemId])

  useEffect(() => {
    if (!open || !projectId) {
      setTagOptions(null)
      return
    }
    let cancelled = false
    void teamWorkApi
      .getProjectTags(projectId)
      .then((d) => {
        if (!cancelled) setTagOptions(d)
      })
      .catch(() => {
        if (!cancelled) setTagOptions({ catalog: [], inUse: [] })
      })
    return () => {
      cancelled = true
    }
  }, [open, projectId])

  const catalogMerged = useMemo(() => {
    const m = new Map<string, TeamWorkTagCatalogEntry>()
    for (const t of projectTagCatalog) m.set(t.slug, t)
    for (const t of tagOptions?.catalog ?? []) {
      if (!m.has(t.slug)) m.set(t.slug, t)
    }
    return Array.from(m.values()).sort((a, b) => a.name.localeCompare(b.name))
  }, [projectTagCatalog, tagOptions])

  const extraLabelSlugs = useMemo(() => {
    const known = new Set(catalogMerged.map((t) => t.slug))
    const out: string[] = []
    for (const slug of tagOptions?.inUse ?? []) {
      if (!known.has(slug)) out.push(slug)
    }
    for (const slug of form.labels ?? []) {
      if (!known.has(slug)) out.push(slug)
    }
    return Array.from(new Set(out)).sort()
  }, [catalogMerged, tagOptions, form.labels])

  const reporterLabel = useMemo(() => {
    if (!item?.reporterUserId) return '—'
    return assigneeMap.get(item.reporterUserId) || item.reporterUserId
  }, [item?.reporterUserId, assigneeMap])

  const assigneeGuestEmails = useMemo(() => {
    if (!item?.assigneeUserId) return [] as string[]
    const u = adminUsers.find((x) => x.id === item.assigneeUserId)
    return u?.email ? [u.email] : []
  }, [item?.assigneeUserId, adminUsers])

  const meetingDefaultDetails = useMemo(() => {
    if (!item) return ''
    const lines = [
      `Work item: ${item.issueKey} — ${item.title}`,
      item.description?.trim() ? `\n${item.description.trim()}` : '',
      '\n\nOpened from Fixer Admin → Team work.',
    ]
    return lines.join('')
  }, [item])

  const save = async () => {
    if (!item || !canManage) return
    setSaving(true)
    try {
      const updated = await teamWorkApi.updateItem(item.id, {
        ...form,
        labels: form.labels || [],
      })
      setItem(updated)
      onUpdated()
    } finally {
      setSaving(false)
    }
  }

  const postComment = async () => {
    if (!item || !comment.trim()) return
    setPosting(true)
    try {
      const updated = await teamWorkApi.addComment(item.id, comment.trim())
      setItem(updated)
      setComment('')
      onUpdated()
    } finally {
      setPosting(false)
    }
  }

  const remove = async () => {
    if (!item || !canManage) return
    await teamWorkApi.deleteItem(item.id)
    setDeleteOpen(false)
    onDeleted()
    onClose()
  }

  const toggleLabel = (slug: string) => {
    const cur = new Set(form.labels || [])
    if (cur.has(slug)) cur.delete(slug)
    else cur.add(slug)
    setForm((f) => ({ ...f, labels: Array.from(cur) }))
  }

  const addCustomTagFromInput = () => {
    const raw = newCustomTag.trim()
    if (!raw) return
    const slug = teamWorkTagSlug(raw)
    const cur = new Set(form.labels || [])
    cur.add(slug)
    setForm((f) => ({ ...f, labels: Array.from(cur) }))
    setNewCustomTag('')
  }

  const saveTagToBoardPreset = async (slug: string, displayName: string) => {
    if (!projectId || !canManage) return
    setSavingCatalog(true)
    try {
      const next = [...projectTagCatalog]
      if (!next.some((t) => t.slug === slug)) {
        next.push({ slug, name: displayName.slice(0, 64) })
      }
      await teamWorkApi.patchProject(projectId, { tagCatalog: next })
      await onProjectTagCatalogChanged?.()
      const d = await teamWorkApi.getProjectTags(projectId)
      setTagOptions(d)
    } finally {
      setSavingCatalog(false)
    }
  }

  if (!open) return null

  const statuses = meta?.statuses ?? []
  const priorities = meta?.priorities ?? []
  const issueTypes = meta?.issueTypes ?? []

  return (
    <>
      <button type="button" aria-label="Close panel" className="fixed inset-0 z-[150] bg-black/50" onClick={onClose} />
      <div
        className={cn(
          'fixed right-0 top-0 z-[160] flex h-full w-full max-w-xl flex-col border-l bg-background shadow-xl',
          'animate-in slide-in-from-right duration-200',
        )}
      >
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div className="min-w-0">
            {loading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading…
              </div>
            ) : item ? (
              <>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-sm font-bold text-primary">{item.issueKey}</span>
                  <Badge variant="outline" className="text-[10px] capitalize">
                    {item.issueType}
                  </Badge>
                  <Badge variant="secondary" className="text-[10px] capitalize">
                    {item.status.replace(/_/g, ' ')}
                  </Badge>
                  <span
                    className={cn(
                      'rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
                      PRIORITY_CHIP[item.priority],
                    )}
                  >
                    {priorityLabel(item.priority)}
                  </span>
                </div>
                <div className="mt-2 rounded-lg border border-border/60 bg-muted/25 px-3 py-2 text-[11px] leading-relaxed text-muted-foreground">
                  <p>
                    <span className="font-medium text-foreground">Created</span> by {reporterLabel} on{' '}
                    {item.createdAt ? format(new Date(item.createdAt), 'PPp') : '—'}
                  </p>
                  <p className="mt-0.5">
                    <span className="font-medium text-foreground">Last updated</span> {format(new Date(item.updatedAt), 'PPp')}
                  </p>
                </div>
                {item.assigneeUserId ? (
                  <div className="mt-2 flex items-center gap-2">
                    <span
                      className={cn(
                        'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ring-2 ring-background',
                        assigneeSwatchClass(item.assigneeUserId),
                      )}
                    >
                      {initialsFromLabel(assigneeMap.get(item.assigneeUserId) || item.assigneeUserId)}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-xs font-medium text-foreground">Assignee</p>
                      <p className="truncate text-sm text-muted-foreground">
                        {assigneeMap.get(item.assigneeUserId) || item.assigneeUserId}
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="mt-2 text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">Unassigned</span> — open the Details tab and pick someone, use Assign to me, or leave in the team pool.
                  </p>
                )}
              </>
            ) : (
              <p className="text-sm text-destructive">Could not load this item.</p>
            )}
          </div>
          <Button type="button" size="icon" variant="ghost" className="h-8 w-8 shrink-0" onClick={onClose} aria-label="Close">
            <X className="h-4 w-4" />
          </Button>
        </div>

        {item ? (
          <Tabs defaultValue="details" className="flex min-h-0 flex-1 flex-col">
            <TabsList className="mx-4 mt-2 w-auto justify-start">
              <TabsTrigger value="details" className="gap-1.5">
                <Pencil className="h-3.5 w-3.5" />
                Details
              </TabsTrigger>
              <TabsTrigger value="comments" className="gap-1.5">
                <MessageSquare className="h-3.5 w-3.5" />
                Comments
                {item.comments?.length ? (
                  <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-[10px]">
                    {item.comments.length}
                  </Badge>
                ) : null}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="mt-0 flex min-h-0 flex-1 flex-col overflow-hidden px-4 pb-4">
              <div className="min-h-0 flex-1 space-y-5 overflow-y-auto py-4">
                <div className="rounded-lg border border-border/70 bg-card p-4 shadow-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Assignee</p>
                      <p className="mt-0.5 text-sm text-foreground">
                        {form.assigneeUserId
                          ? assigneeMap.get(form.assigneeUserId) || form.assigneeUserId
                          : 'Unassigned — visible to the whole board'}
                      </p>
                    </div>
                    {canManage ? (
                      <div className="flex flex-wrap gap-2">
                        {currentUserId ? (
                          <Button
                            type="button"
                            size="sm"
                            variant="secondary"
                            className="gap-1"
                            onClick={() => setForm((f) => ({ ...f, assigneeUserId: currentUserId }))}
                          >
                            <UserPlus className="h-3.5 w-3.5" aria-hidden />
                            Assign to me
                          </Button>
                        ) : null}
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="gap-1"
                          onClick={() => setForm((f) => ({ ...f, assigneeUserId: undefined }))}
                        >
                          <UserMinus className="h-3.5 w-3.5" aria-hidden />
                          Unassign
                        </Button>
                      </div>
                    ) : null}
                  </div>
                  <p className="mt-2 text-[11px] text-muted-foreground">
                    Assigning someone else emails them when SMTP is configured on the API. Assigning yourself does not send email.
                  </p>
                  <Select
                    disabled={!canManage}
                    value={form.assigneeUserId || '__none__'}
                    onValueChange={(v) =>
                      setForm((f) => ({ ...f, assigneeUserId: v === '__none__' ? undefined : v }))
                    }
                  >
                    <SelectTrigger className="mt-2">
                      <SelectValue placeholder="Choose assignee" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">Unassigned (team pool)</SelectItem>
                      {form.assigneeUserId && !adminUsers.some((u) => u.id === form.assigneeUserId) ? (
                        <SelectItem value={form.assigneeUserId}>
                          {assigneeMap.get(form.assigneeUserId) || form.assigneeUserId}
                        </SelectItem>
                      ) : null}
                      {adminUsers.map((u) => (
                        <SelectItem key={u.id} value={u.id}>
                          {userLabel(u)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Tag className="h-4 w-4 text-muted-foreground" aria-hidden />
                    <Label className="text-base">Tags</Label>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Tap a tag to add or remove it from this issue. Tags are shared on this board — save a new name as a board preset so everyone can reuse it in filters.
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {catalogMerged.map((t) => {
                      const on = (form.labels || []).includes(t.slug)
                      return (
                        <Button
                          key={t.slug}
                          type="button"
                          size="sm"
                          variant={on ? 'default' : 'outline'}
                          className="h-8 rounded-full px-3 text-xs font-normal"
                          disabled={!canManage}
                          onClick={() => toggleLabel(t.slug)}
                        >
                          {t.name}
                        </Button>
                      )
                    })}
                    {extraLabelSlugs.map((slug) => {
                      const on = (form.labels || []).includes(slug)
                      const name = teamWorkTagDisplayName(slug, catalogMerged)
                      return (
                        <Button
                          key={`extra-${slug}`}
                          type="button"
                          size="sm"
                          variant={on ? 'default' : 'secondary'}
                          className="h-8 rounded-full px-3 text-xs font-normal"
                          disabled={!canManage}
                          onClick={() => toggleLabel(slug)}
                        >
                          {name}
                        </Button>
                      )
                    })}
                  </div>
                  {canManage ? (
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                      <div className="min-w-0 flex-1 space-y-1">
                        <Label htmlFor="tw-newtag" className="text-xs">
                          Add custom tag
                        </Label>
                        <Input
                          id="tw-newtag"
                          placeholder="e.g. Marketing team"
                          value={newCustomTag}
                          onChange={(e) => setNewCustomTag(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault()
                              addCustomTagFromInput()
                            }
                          }}
                        />
                      </div>
                      <Button type="button" variant="secondary" size="sm" onClick={addCustomTagFromInput}>
                        Add tag
                      </Button>
                    </div>
                  ) : null}
                  {canManage && projectId
                    ? (form.labels || []).map((slug) => {
                        const inPreset = projectTagCatalog.some((t) => t.slug === slug)
                        if (inPreset) return null
                        return (
                          <div key={`preset-${slug}`} className="flex items-center gap-2 text-[11px] text-muted-foreground">
                            <span>
                              “{teamWorkTagDisplayName(slug, catalogMerged)}” is only on this issue.
                            </span>
                            <Button
                              type="button"
                              variant="link"
                              className="h-auto p-0 text-xs"
                              disabled={savingCatalog}
                              onClick={() =>
                                void saveTagToBoardPreset(slug, teamWorkTagDisplayName(slug, catalogMerged))
                              }
                            >
                              Save as board tag
                            </Button>
                          </div>
                        )
                      })
                    : null}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tw-title">Title</Label>
                  <Input
                    id="tw-title"
                    value={form.title ?? ''}
                    disabled={!canManage}
                    onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tw-desc">Description</Label>
                  <Textarea
                    id="tw-desc"
                    rows={5}
                    className="resize-y"
                    disabled={!canManage}
                    value={form.description ?? ''}
                    onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select
                      disabled={!canManage}
                      value={form.status}
                      onValueChange={(v) => setForm((f) => ({ ...f, status: v as TeamWorkItem['status'] }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {statuses.map((s) => (
                          <SelectItem key={s} value={s} className="capitalize">
                            {s.replace(/_/g, ' ')}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Priority</Label>
                    <Select
                      disabled={!canManage}
                      value={form.priority}
                      onValueChange={(v) => setForm((f) => ({ ...f, priority: v as TeamWorkItem['priority'] }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {priorities.map((p) => (
                          <SelectItem key={p} value={p} className="capitalize">
                            {p}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Type</Label>
                    <Select
                      disabled={!canManage}
                      value={form.issueType}
                      onValueChange={(v) => setForm((f) => ({ ...f, issueType: v as TeamWorkItem['issueType'] }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {issueTypes.map((t) => (
                          <SelectItem key={t} value={t} className="capitalize">
                            {t}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tw-sp">Story points</Label>
                    <Input
                      id="tw-sp"
                      type="number"
                      min={0}
                      max={100}
                      disabled={!canManage}
                      value={form.storyPoints ?? ''}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          storyPoints: e.target.value === '' ? undefined : Number(e.target.value),
                        }))
                      }
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Epic</Label>
                  <Select
                    disabled={!canManage}
                    value={form.epicId || '__none__'}
                    onValueChange={(v) => setForm((f) => ({ ...f, epicId: v === '__none__' ? undefined : v }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="None" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">None</SelectItem>
                      {epics.map((e) => (
                        <SelectItem key={e.id} value={e.id}>
                          {e.issueKey} — {e.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tw-due">Due date</Label>
                  <Input
                    id="tw-due"
                    type="datetime-local"
                    disabled={!canManage}
                    value={
                      form.dueAt
                        ? format(new Date(form.dueAt), "yyyy-MM-dd'T'HH:mm")
                        : ''
                    }
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        dueAt: e.target.value ? new Date(e.target.value).toISOString() : undefined,
                      }))
                    }
                  />
                </div>
                <div className="rounded-lg border border-border/70 bg-muted/20 p-3">
                  <p className="text-xs font-medium text-foreground">Meetings</p>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    Open Google Calendar with this issue in the title and description. Add guests or a Meet link in
                    the next step.
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-2 gap-1.5"
                    onClick={() => setScheduleMeetingOpen(true)}
                  >
                    <CalendarPlus className="h-3.5 w-3.5" aria-hidden />
                    Schedule in Google Calendar
                  </Button>
                </div>
              </div>
              {canManage ? (
                <div className="flex shrink-0 flex-wrap gap-2 border-t pt-3">
                  <Button type="button" onClick={() => void save()} disabled={saving}>
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                    Save changes
                  </Button>
                  <Button type="button" variant="destructive" className="gap-1" onClick={() => setDeleteOpen(true)}>
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </Button>
                </div>
              ) : null}
            </TabsContent>

            <TabsContent value="comments" className="mt-0 flex min-h-0 flex-1 flex-col overflow-hidden px-4 pb-4">
              <div className="min-h-0 flex-1 space-y-3 overflow-y-auto py-4">
                {(item.comments || []).length === 0 ? (
                  <p className="text-sm text-muted-foreground">No comments yet. Start the thread below.</p>
                ) : (
                  [...(item.comments || [])]
                    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
                    .map((c) => (
                      <div key={c.id} className="rounded-lg border border-border/70 bg-muted/20 p-3">
                        <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                          <span className="font-medium text-foreground">{c.authorName || c.userId}</span>
                          <span>{format(new Date(c.createdAt), 'PPp')}</span>
                        </div>
                        <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed">{c.body}</p>
                      </div>
                    ))
                )}
              </div>
              <div className="shrink-0 space-y-2 border-t pt-3">
                <Label htmlFor="tw-comment">Add comment</Label>
                <Textarea
                  id="tw-comment"
                  rows={3}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Mention context, blockers, or handoff notes…"
                />
                <Button type="button" size="sm" onClick={() => void postComment()} disabled={posting || !comment.trim()}>
                  {posting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  Post comment
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        ) : null}

        <ConfirmDialog
          open={deleteOpen}
          onCancel={() => setDeleteOpen(false)}
          onConfirm={() => void remove()}
          title="Delete work item?"
          message="This permanently removes the issue and its comments."
          confirmText="Delete"
          severity="error"
        />

        {item ? (
          <ScheduleMeetingDialog
            open={scheduleMeetingOpen}
            onOpenChange={setScheduleMeetingOpen}
            defaultTitle={`${item.issueKey}: ${item.title}`}
            defaultDetails={meetingDefaultDetails}
            defaultGuestEmails={assigneeGuestEmails}
          />
        ) : null}
      </div>
    </>
  )
}
