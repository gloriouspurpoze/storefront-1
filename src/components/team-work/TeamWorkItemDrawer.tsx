import React, { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { Loader2, MessageSquare, Pencil, Trash2, X } from 'lucide-react'
import { teamWorkApi } from '../../services/api/teamWork.api'
import type { TeamWorkItem, TeamWorkMeta } from '../../types/teamWork.types'
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
import type { User } from '../../services/api/users.service'
import { assigneeSwatchClass, initialsFromLabel, PRIORITY_CHIP, priorityLabel } from '../../lib/teamWorkVisuals'

type Props = {
  open: boolean
  itemId: string | null
  meta: TeamWorkMeta | null
  onClose: () => void
  canManage: boolean
  onUpdated: () => void
  onDeleted: () => void
  epics: TeamWorkItem[]
  adminUsers: User[]
  assigneeMap: Map<string, string>
}

function userLabel(u: User): string {
  const n = `${u.firstName || ''} ${u.lastName || ''}`.trim()
  return n || u.email || u.id
}

export function TeamWorkItemDrawer({
  open,
  itemId,
  meta,
  onClose,
  canManage,
  onUpdated,
  onDeleted,
  epics,
  adminUsers,
  assigneeMap,
}: Props) {
  const [item, setItem] = useState<TeamWorkItem | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [comment, setComment] = useState('')
  const [posting, setPosting] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [form, setForm] = useState<Partial<TeamWorkItem>>({})

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

  if (!open) return null

  const statuses = meta?.statuses ?? []
  const priorities = meta?.priorities ?? []
  const issueTypes = meta?.issueTypes ?? []

  return (
    <>
      <button type="button" aria-label="Close panel" className="fixed inset-0 z-[150] bg-black/50" onClick={onClose} />
      <div
        className={cn(
          'fixed right-0 top-0 z-[160] flex h-full w-full max-w-lg flex-col border-l bg-background shadow-xl',
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
                  <p className="mt-2 text-xs italic text-muted-foreground">Unassigned — set Assignee in the Details tab.</p>
                )}
                <p className="mt-1 truncate text-xs text-muted-foreground">Updated {format(new Date(item.updatedAt), 'PPp')}</p>
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
              <div className="min-h-0 flex-1 space-y-4 overflow-y-auto py-4">
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
                    rows={6}
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
                  <Label>Assignee</Label>
                  <p className="text-[11px] text-muted-foreground">
                    Saving a new assignee sends them an email (when the API has SMTP configured). Self-assign does not email you.
                  </p>
                  <Select
                    disabled={!canManage}
                    value={form.assigneeUserId || '__none__'}
                    onValueChange={(v) =>
                      setForm((f) => ({ ...f, assigneeUserId: v === '__none__' ? undefined : v }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Unassigned" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">Unassigned</SelectItem>
                      {form.assigneeUserId &&
                      !adminUsers.some((u) => u.id === form.assigneeUserId) ? (
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
                  <Label htmlFor="tw-labels">Labels (comma-separated)</Label>
                  <Input
                    id="tw-labels"
                    disabled={!canManage}
                    value={(form.labels || []).join(', ')}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        labels: e.target.value
                          .split(',')
                          .map((s) => s.trim())
                          .filter(Boolean),
                      }))
                    }
                  />
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
      </div>
    </>
  )
}
