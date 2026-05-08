import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { format } from 'date-fns'
import {
  CalendarPlus,
  Loader2,
  MessageSquare,
  Paperclip,
  PencilLine,
  Trash2,
  UserPlus,
  X,
} from 'lucide-react'
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels'
import { teamWorkApi } from '../../services/api/teamWork.api'
import { apiClient } from '../../services/apiClient'
import type {
  TeamWorkAttachment,
  TeamWorkItem,
  TeamWorkMeta,
  TeamWorkSprint,
  TeamWorkTagCatalogEntry,
} from '../../types/teamWork.types'
import { teamWorkTagDisplayName, teamWorkTagSlug } from '../../lib/teamWorkTags'
import { assigneeSwatchClass, initialsFromLabel, PRIORITY_CHIP, priorityLabel } from '../../lib/teamWorkVisuals'
import { assigneeIdsFromItem, primaryAssigneeUserId } from '../../lib/teamWorkAssignees'
import {
  clearTeamWorkDrawerDraft,
  loadTeamWorkDrawerDraft,
  saveTeamWorkDrawerDraft,
  type TeamWorkDrawerDraft,
} from '../../lib/teamWorkDrawerDraft'
import { ConfirmDialog } from '../common/ConfirmDialog'
import { ScheduleMeetingDialog } from './ScheduleMeetingDialog'
import type { User } from '../../services/api/users.service'
import { RichTextField } from '../forms/RichTextField'
import { cn } from '../../lib/utils'
import { sprintIdForTeamWorkApi } from '../../lib/mongoObjectId'
import { hierarchicalIssueLabel, parentIssueItem, subtasksOfParent } from '../../lib/teamWorkIssueDisplay'
import { resolveBackendMediaUrl } from '../../lib/apiMediaOrigin'
import { muiMdUp, useMediaQuery } from '../../hooks/useMediaQuery'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { Card, CardContent } from '../ui/card'
import { Checkbox } from '../ui/checkbox'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Separator } from '../ui/separator'
import { Textarea } from '../ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { Sheet, SheetContent } from '../ui/sheet'
import { Avatar, AvatarFallback } from '../ui/avatar'

type Props = {
  open: boolean
  itemId: string | null
  tenantId: string
  boardItems: TeamWorkItem[]
  projectId: string | null
  meta: TeamWorkMeta | null
  onClose: () => void
  canManage: boolean
  onUpdated: () => void
  onDeleted: () => void
  onNavigateItem?: (id: string) => void
  epics: TeamWorkItem[]
  assigneePoolUsers: User[]
  assigneeMap: Map<string, string>
  sprints: TeamWorkSprint[]
  sprintAssignmentMap: Record<string, string>
  onItemSprintPersist?: (itemId: string, sprintId: string | undefined) => void
  currentUserId?: string
  projectTagCatalog?: TeamWorkTagCatalogEntry[]
  onProjectTagCatalogChanged?: () => void | Promise<void>
}

function userLabel(u: User): string {
  if (u.username?.trim()) return u.username.trim()
  const n = `${u.firstName || ''} ${u.lastName || ''}`.trim()
  return n || u.email || u.id
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
}

async function uploadAttachmentFile(file: File): Promise<TeamWorkAttachment> {
  const fd = new FormData()
  fd.append('file', file)
  const raw = await apiClient.uploadFile<Record<string, unknown>>('/chat/upload', fd, {
    showSuccessToast: false,
    showErrorToast: true,
    errorMessage: 'Could not upload file',
    showLoading: false,
    loadingMessage: '',
  })
  const inner =
    raw &&
    typeof raw === 'object' &&
    'success' in raw &&
    (raw as { success?: boolean }).success &&
    'data' in raw &&
    typeof (raw as { data?: unknown }).data === 'object'
      ? ((raw as { data: Record<string, unknown> }).data as Record<string, unknown>)
      : raw
  const url = String(inner?.url || '')
  if (!url) throw new Error('Upload response missing URL')
  return {
    url: resolveBackendMediaUrl(url),
    fileName: String(inner?.fileName || file.name),
    mimeType: inner?.mimeType ? String(inner.mimeType) : file.type || undefined,
    fileSize: inner?.fileSize !== undefined ? Number(inner.fileSize) : file.size,
  }
}

const DESC_MODULES = {
  toolbar: [
    [{ header: [1, 2, 3, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ color: [] }, { background: [] }],
    [{ list: 'ordered' }, { list: 'bullet' }],
    [{ indent: '-1' }, { indent: '+1' }],
    ['link'],
    ['clean'],
  ],
  clipboard: { matchVisual: false },
}

const DESC_FORMATS = [
  'header',
  'bold',
  'italic',
  'underline',
  'strike',
  'color',
  'background',
  'list',
  'bullet',
  'indent',
  'link',
]

function AssigneeAvatarStack({ ids, assigneeMap }: { ids: string[]; assigneeMap: Map<string, string> }) {
  const max = 4
  const shown = ids.slice(0, max)
  const extra = ids.length - shown.length
  return (
    <div className="flex items-center pl-1">
      {shown.map((id, i) => (
        <Avatar
          key={id}
          className={cn(
            'h-7 w-7 border-2 border-background text-[0.65rem] font-bold',
            i > 0 && '-ml-2',
            assigneeSwatchClass(id),
          )}
        >
          <AvatarFallback className={cn(assigneeSwatchClass(id), 'text-[0.65rem] font-bold')}>
            {initialsFromLabel(assigneeMap.get(id) || id)}
          </AvatarFallback>
        </Avatar>
      ))}
      {extra > 0 ? (
        <div className="-ml-2 flex h-7 min-w-7 items-center justify-center rounded-full border-2 border-background bg-muted px-1 text-[0.65rem] font-semibold">
          +{extra}
        </div>
      ) : null}
    </div>
  )
}

export function TeamWorkItemDrawer({
  open,
  itemId,
  tenantId,
  boardItems,
  projectId,
  meta,
  onClose,
  canManage,
  onUpdated,
  onDeleted,
  onNavigateItem,
  epics,
  assigneePoolUsers,
  assigneeMap,
  sprints,
  sprintAssignmentMap,
  onItemSprintPersist,
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
  const [assigneeUserIds, setAssigneeUserIds] = useState<string[]>([])
  const [attachments, setAttachments] = useState<TeamWorkAttachment[]>([])
  const [uploadingFile, setUploadingFile] = useState(false)
  const [tab, setTab] = useState(0)
  const [tagOptions, setTagOptions] = useState<{ catalog: TeamWorkTagCatalogEntry[]; inUse: string[] } | null>(null)
  const [newCustomTag, setNewCustomTag] = useState('')
  const [savingCatalog, setSavingCatalog] = useState(false)
  const [subtaskTitle, setSubtaskTitle] = useState('')
  const [creatingSubtask, setCreatingSubtask] = useState(false)
  const [unsavedCloseOpen, setUnsavedCloseOpen] = useState(false)

  const fileRef = useRef<HTMLInputElement>(null)
  const baselineItemId = useRef<string | null>(null)
  const baselineRef = useRef<string>('')

  const computeSignature = useCallback(() => {
    if (!item) return ''
    const poolIds = new Set(assigneePoolUsers.map((u) => u.id))
    const cleaned = assigneeUserIds.filter((id) => poolIds.has(id)).slice().sort()
    const att = attachments
      .map((a) => a.url)
      .slice()
      .sort()
    return JSON.stringify({
      title: form.title,
      description: form.description,
      status: form.status,
      priority: form.priority,
      issueType: form.issueType,
      labels: (form.labels || []).slice().sort(),
      startAt: form.startAt ?? null,
      dueAt: form.dueAt ?? null,
      epicId: form.epicId ?? null,
      storyPoints: form.storyPoints ?? null,
      sprintId: form.sprintId ?? null,
      assignees: cleaned,
      attachments: att,
    })
  }, [item, form, assigneeUserIds, attachments, assigneePoolUsers])

  useLayoutEffect(() => {
    baselineItemId.current = null
  }, [itemId])

  useLayoutEffect(() => {
    if (!open || !item || loading) return
    if (baselineItemId.current === item.id) return
    baselineItemId.current = item.id
    baselineRef.current = computeSignature()
  }, [open, item, loading, computeSignature])

  const hasUnsavedEdits = Boolean(
    item &&
      (comment.trim().length > 0 || (canManage && computeSignature() !== baselineRef.current)),
  )

  const requestClose = () => {
    if (hasUnsavedEdits) {
      setUnsavedCloseOpen(true)
      return
    }
    onClose()
  }

  const discardAndClose = () => {
    if (item) clearTeamWorkDrawerDraft(tenantId, item.id)
    setUnsavedCloseOpen(false)
    onClose()
  }

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
    const emails: string[] = []
    for (const id of assigneeUserIds) {
      const u = assigneePoolUsers.find((x) => x.id === id)
      if (u?.email) emails.push(u.email)
    }
    return emails
  }, [assigneeUserIds, assigneePoolUsers])

  const assignableSprints = useMemo(() => {
    const live = sprints.filter((s) => s.state !== 'completed')
    const cur = form.sprintId
    if (cur && !live.some((s) => s.id === cur)) {
      const historic = sprints.find((s) => s.id === cur)
      return historic ? [...live, historic] : live
    }
    return live
  }, [sprints, form.sprintId])

  const issueDisplayLabel = useMemo(
    () => (item ? hierarchicalIssueLabel(item, boardItems) : ''),
    [item, boardItems],
  )

  const parentRowItem = useMemo(
    () => (item ? parentIssueItem(item, boardItems) : undefined),
    [item, boardItems],
  )

  const meetingDefaultDetails = useMemo(() => {
    if (!item) return ''
    const descPlain = form.description ? stripHtml(form.description) : ''
    const label = hierarchicalIssueLabel(item, boardItems)
    const lines = [
      `Work item: ${label}${label !== item.issueKey ? ` (${item.issueKey})` : ''} — ${item.title}`,
      descPlain ? `\n${descPlain}` : '',
      '\n\nOpened from Fixer Admin → Team work.',
    ]
    return lines.join('')
  }, [item, form.description, boardItems])

  const subtasks = useMemo(() => {
    if (!item) return []
    return subtasksOfParent(item.id, boardItems)
  }, [boardItems, item])

  const persistDraft = useCallback(() => {
    if (!itemId || !item) return
    const draft: TeamWorkDrawerDraft = {
      form: {
        title: form.title,
        description: form.description,
        status: form.status,
        priority: form.priority,
        issueType: form.issueType,
        labels: form.labels,
        startAt: form.startAt,
        dueAt: form.dueAt,
        epicId: form.epicId,
        storyPoints: form.storyPoints,
        sprintId: form.sprintId,
      },
      assigneeUserIds,
      attachments,
      commentDraft: comment,
      tab: tab === 1 ? 'comments' : 'details',
    }
    saveTeamWorkDrawerDraft(tenantId, itemId, draft)
  }, [
    itemId,
    item,
    form.title,
    form.description,
    form.status,
    form.priority,
    form.issueType,
    form.labels,
    form.startAt,
    form.dueAt,
    form.epicId,
    form.storyPoints,
    form.sprintId,
    assigneeUserIds,
    attachments,
    comment,
    tab,
    tenantId,
  ])

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
        const poolIds = new Set(assigneePoolUsers.map((u) => u.id))
        const sprintMerged = row.sprintId ?? sprintAssignmentMap[row.id]
        const baseForm: Partial<TeamWorkItem> = {
          title: row.title,
          description: row.description ?? '',
          status: row.status,
          priority: row.priority,
          issueType: row.issueType,
          labels: row.labels,
          startAt: row.startAt,
          dueAt: row.dueAt,
          epicId: row.epicId,
          storyPoints: row.storyPoints,
          sprintId: sprintMerged,
        }
        setForm(baseForm)
        setAssigneeUserIds(assigneeIdsFromItem(row).filter((id) => poolIds.has(id)))
        setAttachments(row.attachments ?? [])
        setComment('')
        setTab(0)

        const draft = loadTeamWorkDrawerDraft(tenantId, row.id)
        if (draft) {
          setForm((f) => ({ ...f, ...draft.form }))
          if (draft.assigneeUserIds?.length) setAssigneeUserIds(draft.assigneeUserIds)
          if (draft.attachments?.length) setAttachments(draft.attachments)
          setComment(draft.commentDraft ?? '')
          setTab(draft.tab === 'comments' ? 1 : 0)
        }
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
  }, [open, itemId, tenantId, sprintAssignmentMap, assigneePoolUsers])

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

  useEffect(() => {
    if (!open || !itemId || !item) return
    const t = window.setTimeout(() => persistDraft(), 450)
    return () => window.clearTimeout(t)
  }, [open, itemId, item, persistDraft])

  const save = async () => {
    if (!item || !canManage) return
    setSaving(true)
    try {
      const poolIds = new Set(assigneePoolUsers.map((u) => u.id))
      const cleanedAssignees = assigneeUserIds.filter((id) => poolIds.has(id))
      const primary = primaryAssigneeUserId(cleanedAssignees)
      const sprintOut: string | undefined = form.sprintId ? form.sprintId : undefined
      const updated = await teamWorkApi.updateItem(item.id, {
        ...form,
        labels: form.labels || [],
        assigneeUserId: primary,
        assigneeUserIds: cleanedAssignees.length ? cleanedAssignees : [],
        attachments: attachments.length ? attachments : [],
        sprintId: sprintIdForTeamWorkApi(sprintOut),
      })
      setItem(updated)
      setForm((f) => ({ ...f, sprintId: updated.sprintId ?? sprintOut }))
      setAssigneeUserIds(assigneeIdsFromItem(updated).filter((id) => poolIds.has(id)))
      setAttachments(updated.attachments ?? [])
      onItemSprintPersist?.(item.id, sprintOut)
      clearTeamWorkDrawerDraft(tenantId, item.id)
      onUpdated()
      queueMicrotask(() => {
        baselineRef.current = computeSignature()
      })
    } finally {
      setSaving(false)
    }
  }

  const saveThenClose = async () => {
    if (!item || !canManage) return
    await save()
    setUnsavedCloseOpen(false)
    onClose()
  }

  const postCommentThenClose = async () => {
    if (!item || !comment.trim()) return
    setPosting(true)
    try {
      await teamWorkApi.addComment(item.id, comment.trim())
      setComment('')
      clearTeamWorkDrawerDraft(tenantId, item.id)
      onUpdated()
      setUnsavedCloseOpen(false)
      onClose()
    } finally {
      setPosting(false)
    }
  }

  const postComment = async () => {
    if (!item || !comment.trim()) return
    setPosting(true)
    try {
      const updated = await teamWorkApi.addComment(item.id, comment.trim())
      setItem(updated)
      setComment('')
      clearTeamWorkDrawerDraft(tenantId, item.id)
      onUpdated()
    } finally {
      setPosting(false)
    }
  }

  const remove = async () => {
    if (!item || !canManage) return
    await teamWorkApi.deleteItem(item.id)
    clearTeamWorkDrawerDraft(tenantId, item.id)
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

  const toggleAssignee = (userId: string) => {
    setAssigneeUserIds((prev) =>
      prev.includes(userId) ? prev.filter((x) => x !== userId) : [...prev, userId].sort(),
    )
  }

  const onPickFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    e.target.value = ''
    if (!files?.length || !canManage) return
    setUploadingFile(true)
    try {
      const next = [...attachments]
      for (const file of Array.from(files)) {
        const row = await uploadAttachmentFile(file)
        next.push(row)
      }
      setAttachments(next)
    } finally {
      setUploadingFile(false)
    }
  }

  const createSubtask = async () => {
    if (!item || !projectId || !subtaskTitle.trim() || !canManage) return
    setCreatingSubtask(true)
    try {
      const parentSprint = form.sprintId || item.sprintId
      const created = await teamWorkApi.createItem({
        projectId,
        title: subtaskTitle.trim(),
        parentWorkItemId: item.id,
        issueType: 'task',
        status: 'todo',
        priority: form.priority ?? item.priority,
        sprintId: sprintIdForTeamWorkApi(parentSprint),
      })
      if (parentSprint) onItemSprintPersist?.(created.id, parentSprint)
      setSubtaskTitle('')
      onUpdated()
    } finally {
      setCreatingSubtask(false)
    }
  }

  const statuses = meta?.statuses ?? []
  const priorities = meta?.priorities ?? []
  const issueTypes = meta?.issueTypes ?? []
  const isWideDrawer = useMediaQuery(muiMdUp)

  const sheetOnOpenChange = (next: boolean) => {
    if (!next) requestClose()
  }

  const detailsBody = item ? (
    <div className="flex flex-col gap-6">
      <Card className="border-border/80 bg-muted/25">
        <CardContent className="space-y-3 pt-4">
          <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">People</p>
          {canManage && currentUserId ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mb-1"
              leftIcon={<UserPlus className="h-4 w-4" />}
              onClick={() => toggleAssignee(currentUserId)}
            >
              {assigneeUserIds.includes(currentUserId) ? 'Remove me' : 'Assign to me'}
            </Button>
          ) : null}
          {assigneePoolUsers.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              No one is on this board’s team list — add members under{' '}
              <span className="font-semibold">Board access</span> to pick assignees, or use an org-wide board to use all
              directory members.
            </p>
          ) : (
            <div className="max-h-[200px] space-y-2 overflow-auto pr-1">
              {assigneePoolUsers.map((u) => (
                <label
                  key={u.id}
                  className={cn('flex cursor-pointer items-center gap-2 rounded-md py-0.5', !canManage && 'cursor-not-allowed opacity-60')}
                >
                  <Checkbox
                    checked={assigneeUserIds.includes(u.id)}
                    disabled={!canManage}
                    onCheckedChange={() => canManage && toggleAssignee(u.id)}
                  />
                  <span className="text-sm">{userLabel(u)}</span>
                </label>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="space-y-2">
        <Label>Sprint</Label>
        <Select
          value={form.sprintId ? form.sprintId : '__backlog__'}
          onValueChange={(v) => setForm((f) => ({ ...f, sprintId: v === '__backlog__' ? undefined : v }))}
          disabled={!canManage}
        >
          <SelectTrigger className="h-9">
            <SelectValue placeholder="Sprint" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__backlog__">Backlog (no sprint)</SelectItem>
            {assignableSprints.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.state === 'active' ? '● ' : ''}
                {s.name} · {format(new Date(s.startAt), 'MMM d')} – {format(new Date(s.endAt), 'MMM d')}
                {s.state === 'completed' ? ' (closed)' : ''}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">Move work in or out of the current iteration. Save to persist (API + local overlay).</p>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Tags</p>
        <div className="flex flex-wrap gap-1.5">
          {catalogMerged.map((t) => {
            const on = (form.labels || []).includes(t.slug)
            return (
              <Badge
                key={t.slug}
                variant={on ? 'default' : 'outline'}
                className={cn('cursor-pointer', !canManage && 'pointer-events-none opacity-60')}
                onClick={() => canManage && toggleLabel(t.slug)}
              >
                {t.name}
              </Badge>
            )
          })}
          {extraLabelSlugs.map((slug) => {
            const on = (form.labels || []).includes(slug)
            const name = teamWorkTagDisplayName(slug, catalogMerged)
            return (
              <Badge
                key={`extra-${slug}`}
                variant={on ? 'secondary' : 'outline'}
                className={cn('cursor-pointer', !canManage && 'pointer-events-none opacity-60')}
                onClick={() => canManage && toggleLabel(slug)}
              >
                {name}
              </Badge>
            )
          })}
        </div>
        {canManage ? (
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
            <div className="flex-1 space-y-1">
              <Label htmlFor="tw-custom-tag" className="sr-only">
                Custom tag
              </Label>
              <Input
                id="tw-custom-tag"
                placeholder="e.g. Marketing"
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
            <Button type="button" variant="outline" size="sm" onClick={addCustomTagFromInput}>
              Add
            </Button>
          </div>
        ) : null}
        {canManage && projectId
          ? (form.labels || []).map((slug) => {
              const inPreset = projectTagCatalog.some((t) => t.slug === slug)
              if (inPreset) return null
              return (
                <p key={`preset-${slug}`} className="text-xs text-muted-foreground">
                  “{teamWorkTagDisplayName(slug, catalogMerged)}” is only on this issue —{' '}
                  <button
                    type="button"
                    className="font-medium text-primary underline-offset-4 hover:underline disabled:opacity-50"
                    disabled={savingCatalog}
                    onClick={() => void saveTagToBoardPreset(slug, teamWorkTagDisplayName(slug, catalogMerged))}
                  >
                    Save as board tag
                  </button>
                </p>
              )
            })
          : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="tw-title">Title</Label>
        <Input
          id="tw-title"
          disabled={!canManage}
          value={form.title ?? ''}
          onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
        />
      </div>

      <RichTextField
        label="Description"
        value={form.description ?? ''}
        onChange={(html) => setForm((f) => ({ ...f, description: html }))}
        disabled={!canManage}
        placeholder="Goals, acceptance criteria, links…"
        height={220}
        modules={DESC_MODULES}
        formats={DESC_FORMATS}
        helperText="Rich text is saved with the issue. Drafts persist in this browser session if you close the drawer."
      />

      <div className="space-y-2">
        <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Attachments</p>
        <p className="text-xs text-muted-foreground">
          Images and documents upload via the chat file endpoint, then attach to this issue.
        </p>
        <input
          ref={fileRef}
          type="file"
          className="hidden"
          multiple
          accept="image/*,.pdf,.doc,.docx,.txt,.csv,.zip"
          onChange={(e) => void onPickFiles(e)}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={!canManage || uploadingFile}
          leftIcon={uploadingFile ? <Loader2 className="h-4 w-4 animate-spin" /> : <Paperclip className="h-4 w-4" />}
          onClick={() => fileRef.current?.click()}
        >
          Add files
        </Button>
        {attachments.length ? (
          <div className="space-y-2">
            {attachments.map((a, idx) => (
              <Card key={`${a.url}-${idx}`} className="border-border/80">
                <CardContent className="flex items-center justify-between gap-2 py-3">
                  <a
                    href={resolveBackendMediaUrl(a.url)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="break-all text-sm text-primary underline-offset-4 hover:underline"
                  >
                    {a.fileName}
                  </a>
                  {canManage ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0"
                      aria-label="Remove attachment"
                      onClick={() => setAttachments((prev) => prev.filter((_, i) => i !== idx))}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  ) : null}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">No attachments yet.</p>
        )}
      </div>

      <Card className="border-border/80">
        <CardContent className="space-y-3 pt-4">
          <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Sub-tasks</p>
          <p className="text-xs text-muted-foreground">
            Numbers follow the parent ticket (e.g. <span className="font-mono font-semibold">PF-12.1</span>,{' '}
            <span className="font-mono font-semibold">PF-12.2</span>) in board order. The smaller monospace key is the stored
            server id when it differs.
          </p>
          {subtasks.length ? (
            <div className="mb-3 space-y-2">
              {subtasks.map((st) => {
                const stLabel = hierarchicalIssueLabel(st, boardItems)
                return (
                  <Card key={st.id} className="border-l-[3px] border-l-primary">
                    <CardContent className="flex items-center justify-between gap-2 py-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-1">
                          <span className="font-mono text-xs font-bold text-primary">{stLabel}</span>
                          {stLabel !== st.issueKey ? (
                            <span className="font-mono text-xs text-muted-foreground">{st.issueKey}</span>
                          ) : null}
                          <Badge variant="outline" className="h-5 px-1.5 text-[0.6rem]">
                            Subtask
                          </Badge>
                        </div>
                        <p className="truncate text-sm font-medium" title={st.title}>
                          {st.title}
                        </p>
                      </div>
                      {onNavigateItem ? (
                        <Button type="button" size="sm" variant="secondary" onClick={() => onNavigateItem(st.id)}>
                          Open
                        </Button>
                      ) : null}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          ) : (
            <p className="mb-3 text-xs text-muted-foreground">No sub-tasks yet.</p>
          )}
          {canManage ? (
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input
                placeholder="New sub-task title"
                value={subtaskTitle}
                onChange={(e) => setSubtaskTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    void createSubtask()
                  }
                }}
              />
              <Button type="button" loading={creatingSubtask} disabled={!subtaskTitle.trim()} onClick={() => void createSubtask()}>
                Add
              </Button>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Status</Label>
          <Select
            value={form.status ?? ''}
            onValueChange={(v) => setForm((f) => ({ ...f, status: v as TeamWorkItem['status'] }))}
            disabled={!canManage}
          >
            <SelectTrigger className="h-9 capitalize">
              <SelectValue placeholder="Status" />
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
            value={form.priority ?? ''}
            onValueChange={(v) => setForm((f) => ({ ...f, priority: v as TeamWorkItem['priority'] }))}
            disabled={!canManage}
          >
            <SelectTrigger className="h-9 capitalize">
              <SelectValue placeholder="Priority" />
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

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Type</Label>
          <Select
            value={form.issueType ?? ''}
            onValueChange={(v) => setForm((f) => ({ ...f, issueType: v as TeamWorkItem['issueType'] }))}
            disabled={!canManage}
          >
            <SelectTrigger className="h-9 capitalize">
              <SelectValue placeholder="Type" />
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
          <Label htmlFor="tw-points">Story points</Label>
          <Input
            id="tw-points"
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
          value={form.epicId || '__none__'}
          onValueChange={(v) => setForm((f) => ({ ...f, epicId: v === '__none__' ? undefined : String(v) }))}
          disabled={!canManage}
        >
          <SelectTrigger className="h-9">
            <SelectValue placeholder="Epic" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__none__">None</SelectItem>
            {epics.map((ep) => (
              <SelectItem key={ep.id} value={ep.id}>
                {ep.issueKey} — {ep.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="tw-start">Start</Label>
          <Input
            id="tw-start"
            type="datetime-local"
            disabled={!canManage}
            value={form.startAt ? format(new Date(form.startAt), "yyyy-MM-dd'T'HH:mm") : ''}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                startAt: e.target.value ? new Date(e.target.value).toISOString() : undefined,
              }))
            }
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="tw-due">Due</Label>
          <Input
            id="tw-due"
            type="datetime-local"
            disabled={!canManage}
            value={form.dueAt ? format(new Date(form.dueAt), "yyyy-MM-dd'T'HH:mm") : ''}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                dueAt: e.target.value ? new Date(e.target.value).toISOString() : undefined,
              }))
            }
          />
        </div>
      </div>

      <Card className="border-border/80">
        <CardContent className="space-y-2 pt-4">
          <p className="text-sm font-semibold">Meetings</p>
          <p className="text-xs text-muted-foreground">Open Google Calendar with this issue prefilled.</p>
          <Button type="button" variant="outline" size="sm" className="mt-1" leftIcon={<CalendarPlus className="h-4 w-4" />} onClick={() => setScheduleMeetingOpen(true)}>
            Schedule in Google Calendar
          </Button>
        </CardContent>
      </Card>

      {canManage ? (
        <div className="flex flex-wrap gap-2 pt-1">
          <Button type="button" loading={saving} onClick={() => void save()}>
            Save changes
          </Button>
          <Button type="button" variant="outline" className="text-destructive hover:text-destructive" leftIcon={<Trash2 className="h-4 w-4" />} onClick={() => setDeleteOpen(true)}>
            Delete
          </Button>
        </div>
      ) : null}
    </div>
  ) : null

  const commentsBody = item ? (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <div className="min-h-0 flex-1 space-y-3 overflow-auto pr-1">
        {(item.comments || []).length === 0 ? (
          <p className="text-sm text-muted-foreground">No comments yet.</p>
        ) : (
          [...(item.comments || [])]
            .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
            .map((c) => (
              <Card key={c.id} className="border-border/80 bg-muted/20">
                <CardContent className="space-y-2 pt-4">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="text-sm font-semibold">{c.authorName || c.userId}</p>
                    <p className="text-xs text-muted-foreground">{format(new Date(c.createdAt), 'PPp')}</p>
                  </div>
                  <Separator />
                  <p className="whitespace-pre-wrap text-sm">{c.body}</p>
                </CardContent>
              </Card>
            ))
        )}
      </div>
      <Card className="shrink-0 border-border/80">
        <CardContent className="space-y-2 pt-4">
          <p className="text-sm font-semibold">Add comment</p>
          <Textarea
            placeholder="Context, blockers, handoff…"
            rows={3}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
          <div className="flex justify-end">
            <Button type="button" size="sm" loading={posting} disabled={!comment.trim()} onClick={() => void postComment()}>
              Post
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  ) : null

  return (
    <>
      <Sheet open={open} onOpenChange={sheetOnOpenChange}>
        <SheetContent
          hideClose
          side="right"
          className="flex w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-[640px] md:max-w-[min(960px,96vw)]"
        >
          <div className="flex shrink-0 items-start justify-between gap-2 border-b border-border px-4 py-3">
            <div className="min-w-0 flex-1">
              {loading ? (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm">Loading…</span>
                </div>
              ) : item ? (
                <>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="font-mono text-sm font-bold text-primary">{issueDisplayLabel}</span>
                    {issueDisplayLabel !== item.issueKey ? (
                      <span className="font-mono text-xs font-semibold text-muted-foreground" title="Stored issue key from server">
                        {item.issueKey}
                      </span>
                    ) : null}
                    {item.parentWorkItemId ? (
                      <Badge variant="secondary" className="text-[0.65rem] font-bold">
                        Subtask
                      </Badge>
                    ) : null}
                    <Badge variant="outline" className="text-[0.65rem] capitalize">
                      {item.issueType}
                    </Badge>
                    <Badge variant="default" className="text-[0.65rem] capitalize">
                      {item.status.replace(/_/g, ' ')}
                    </Badge>
                    <Badge className={cn('text-[0.65rem] font-semibold', PRIORITY_CHIP[item.priority])}>{priorityLabel(item.priority)}</Badge>
                  </div>
                  {parentRowItem ? (
                    <div className="mt-2 flex flex-wrap items-center gap-1 text-xs">
                      <span className="font-semibold text-muted-foreground">Parent</span>
                      {onNavigateItem ? (
                        <button
                          type="button"
                          className="min-w-0 text-left text-xs text-primary underline-offset-4 hover:underline"
                          onClick={() => onNavigateItem(parentRowItem.id)}
                        >
                          <span className="font-mono font-bold">{hierarchicalIssueLabel(parentRowItem, boardItems)}</span>
                          <span className="ml-2 font-medium">— {parentRowItem.title}</span>
                        </button>
                      ) : (
                        <span className="text-muted-foreground">
                          {hierarchicalIssueLabel(parentRowItem, boardItems)} — {parentRowItem.title}
                        </span>
                      )}
                    </div>
                  ) : null}
                  <p className="mt-2 block text-xs text-muted-foreground">
                    Created by {reporterLabel}
                    {item.createdAt ? ` · ${format(new Date(item.createdAt), 'PPp')}` : ''}
                  </p>
                  <p className="text-xs text-muted-foreground">Updated {format(new Date(item.updatedAt), 'PPp')}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-xs font-semibold text-muted-foreground">Assignees</span>
                    {assigneeUserIds.length ? (
                      <AssigneeAvatarStack ids={assigneeUserIds} assigneeMap={assigneeMap} />
                    ) : (
                      <span className="text-xs text-muted-foreground">Unassigned</span>
                    )}
                  </div>
                </>
              ) : (
                <p className="text-sm text-destructive">Could not load this item.</p>
              )}
            </div>
            <Button type="button" variant="ghost" size="icon" className="h-8 w-8 shrink-0" aria-label="Close" onClick={() => requestClose()}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {item ? (
            !isWideDrawer ? (
              <Tabs
                value={tab === 0 ? 'details' : 'comments'}
                onValueChange={(v) => setTab(v === 'comments' ? 1 : 0)}
                className="flex min-h-0 flex-1 flex-col px-0"
              >
                <TabsList className="mx-2 mt-2 grid h-10 w-auto shrink-0 grid-cols-2 rounded-md">
                  <TabsTrigger value="details" className="gap-1.5 text-xs sm:text-sm">
                    <PencilLine className="h-3.5 w-3.5 shrink-0" />
                    Details
                  </TabsTrigger>
                  <TabsTrigger value="comments" className="gap-1.5 text-xs sm:text-sm">
                    <MessageSquare className="h-3.5 w-3.5 shrink-0" />
                    Comments{item.comments?.length ? ` (${item.comments.length})` : ''}
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="details" className="mt-0 min-h-0 flex-1 overflow-auto px-4 pb-4 pt-3">
                  {detailsBody}
                </TabsContent>
                <TabsContent value="comments" className="mt-0 flex min-h-0 flex-1 flex-col overflow-hidden px-4 pb-4 pt-3">
                  {commentsBody}
                </TabsContent>
              </Tabs>
            ) : (
              <PanelGroup direction="horizontal" autoSaveId="fixer-team-work-drawer-split" className="flex min-h-0 flex-1">
                <Panel defaultSize={62} minSize={32} className="min-w-0">
                  <div className="h-full overflow-auto px-4 py-4">{detailsBody}</div>
                </Panel>
                <PanelResizeHandle className="w-1.5 shrink-0 bg-border/60 hover:bg-border" />
                <Panel defaultSize={38} minSize={26} className="min-w-0 border-l border-border">
                  <div className="h-full overflow-auto px-4 py-4">{commentsBody}</div>
                </Panel>
              </PanelGroup>
            )
          ) : null}
        </SheetContent>
      </Sheet>

      <Dialog open={unsavedCloseOpen} onOpenChange={(v) => !v && setUnsavedCloseOpen(false)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Unsaved changes</DialogTitle>
            <DialogDescription>
              You have edits or a draft comment that are not saved to the server. Choose how to close this issue.
              {canManage && comment.trim() ? (
                <>
                  {' '}
                  <span className="font-semibold text-foreground">Save & close</span> only updates the issue fields — post the
                  comment separately if needed.
                </>
              ) : null}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={() => setUnsavedCloseOpen(false)}>
              Keep editing
            </Button>
            <Button type="button" variant="outline" className="border-amber-600 text-amber-800 hover:bg-amber-50 dark:hover:bg-amber-950/30" onClick={discardAndClose}>
              Discard
            </Button>
            {canManage && item && computeSignature() !== baselineRef.current ? (
              <Button type="button" loading={saving} onClick={() => void saveThenClose()}>
                Save & close
              </Button>
            ) : null}
            {comment.trim() ? (
              <Button type="button" variant="secondary" loading={posting} onClick={() => void postCommentThenClose()}>
                Post comment & close
              </Button>
            ) : null}
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
          defaultTitle={`${issueDisplayLabel}: ${item.title}`}
          defaultDetails={meetingDefaultDetails}
          defaultGuestEmails={assigneeGuestEmails}
        />
      ) : null}
    </>
  )
}
