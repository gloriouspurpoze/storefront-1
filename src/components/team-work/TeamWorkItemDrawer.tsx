import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { format } from 'date-fns'
import CloseIcon from '@mui/icons-material/Close'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import AttachFileIcon from '@mui/icons-material/AttachFile'
import CommentIcon from '@mui/icons-material/Comment'
import EditNoteIcon from '@mui/icons-material/EditNote'
import EventIcon from '@mui/icons-material/Event'
import PersonAddIcon from '@mui/icons-material/PersonAdd'
import Avatar from '@mui/material/Avatar'
import AvatarGroup from '@mui/material/AvatarGroup'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Checkbox from '@mui/material/Checkbox'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Divider from '@mui/material/Divider'
import Drawer from '@mui/material/Drawer'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import FormControl from '@mui/material/FormControl'
import FormControlLabel from '@mui/material/FormControlLabel'
import FormGroup from '@mui/material/FormGroup'
import IconButton from '@mui/material/IconButton'
import InputLabel from '@mui/material/InputLabel'
import Link from '@mui/material/Link'
import MenuItem from '@mui/material/MenuItem'
import Paper from '@mui/material/Paper'
import Select from '@mui/material/Select'
import Stack from '@mui/material/Stack'
import Tab from '@mui/material/Tab'
import Tabs from '@mui/material/Tabs'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
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

type Props = {
  open: boolean
  itemId: string | null
  tenantId: string
  /** Items on the current board (for sub-task list). */
  boardItems: TeamWorkItem[]
  /** Current board — used for tags API and catalog. */
  projectId: string | null
  meta: TeamWorkMeta | null
  onClose: () => void
  canManage: boolean
  onUpdated: () => void
  onDeleted: () => void
  /** Open another issue without closing hub state. */
  onNavigateItem?: (id: string) => void
  epics: TeamWorkItem[]
  /** Board team roster — assignees are chosen only from this list. */
  assigneePoolUsers: User[]
  assigneeMap: Map<string, string>
  sprints: TeamWorkSprint[]
  sprintAssignmentMap: Record<string, string>
  onItemSprintPersist?: (itemId: string, sprintId: string | undefined) => void
  /** Logged-in user id for “Assign to me”. */
  currentUserId?: string
  /** Preset tags from the project (refreshed when parent reloads projects). */
  projectTagCatalog?: TeamWorkTagCatalogEntry[]
  /** After saving tag catalog on the project. */
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
      (comment.trim().length > 0 ||
        (canManage && computeSignature() !== baselineRef.current)),
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

  const drawerPaperSx = {
    width: { xs: '100%', sm: 'min(100%, 640px)', md: 'min(100%, min(960px, 96vw))' },
    maxWidth: '100%',
    bgcolor: 'hsl(var(--background) / 1)',
    borderLeft: '1px solid hsl(var(--border) / 0.6)',
    display: 'flex',
    flexDirection: 'column',
  }

  return (
    <>
      <Drawer
        anchor="right"
        open={open}
        onClose={() => requestClose()}
        slotProps={{
          backdrop: { sx: { bgcolor: 'rgba(0,0,0,0.45)' } },
          paper: { sx: drawerPaperSx },
        }}
      >
        <Box sx={{ px: 2, py: 1.5, borderBottom: 1, borderColor: 'divider', flexShrink: 0 }}>
          <Stack direction="row" alignItems="flex-start" justifyContent="space-between" spacing={1}>
            <Box sx={{ minWidth: 0, flex: 1 }}>
              {loading ? (
                <Stack direction="row" alignItems="center" spacing={1} sx={{ color: 'text.secondary' }}>
                  <CircularProgress size={18} />
                  <Typography variant="body2">Loading…</Typography>
                </Stack>
              ) : item ? (
                <>
                  <Stack direction="row" alignItems="center" flexWrap="wrap" gap={0.75}>
                    <Typography variant="subtitle2" sx={{ fontFamily: 'ui-monospace, monospace', color: 'primary.main', fontWeight: 700 }}>
                      {issueDisplayLabel}
                    </Typography>
                    {issueDisplayLabel !== item.issueKey ? (
                      <Typography
                        component="span"
                        variant="caption"
                        sx={{ fontFamily: 'ui-monospace, monospace', color: 'text.secondary', fontWeight: 600 }}
                        title="Stored issue key from server"
                      >
                        {item.issueKey}
                      </Typography>
                    ) : null}
                    {item.parentWorkItemId ? (
                      <Chip size="small" label="Subtask" color="secondary" variant="outlined" sx={{ fontWeight: 700 }} />
                    ) : null}
                    <Chip size="small" label={item.issueType} variant="outlined" sx={{ textTransform: 'capitalize' }} />
                    <Chip size="small" label={item.status.replace(/_/g, ' ')} sx={{ textTransform: 'capitalize' }} />
                    <Chip
                      size="small"
                      label={priorityLabel(item.priority)}
                      className={cn(PRIORITY_CHIP[item.priority])}
                      sx={{ fontWeight: 600, fontSize: '0.65rem' }}
                    />
                  </Stack>
                  {parentRowItem ? (
                    <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mt: 1, flexWrap: 'wrap' }}>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                        Parent
                      </Typography>
                      {onNavigateItem ? (
                        <Button
                          size="small"
                          variant="text"
                          sx={{ minWidth: 0, px: 0.5, py: 0, fontSize: '0.75rem', textAlign: 'left' }}
                          onClick={() => onNavigateItem(parentRowItem.id)}
                        >
                          <Box component="span" sx={{ fontFamily: 'ui-monospace, monospace', fontWeight: 700 }}>
                            {hierarchicalIssueLabel(parentRowItem, boardItems)}
                          </Box>
                          <Box component="span" sx={{ ml: 0.75, fontWeight: 500 }}>
                            — {parentRowItem.title}
                          </Box>
                        </Button>
                      ) : (
                        <Typography variant="caption" color="text.secondary">
                          {hierarchicalIssueLabel(parentRowItem, boardItems)} — {parentRowItem.title}
                        </Typography>
                      )}
                    </Stack>
                  ) : null}
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                    Created by {reporterLabel}
                    {item.createdAt ? ` · ${format(new Date(item.createdAt), 'PPp')}` : ''}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                    Updated {format(new Date(item.updatedAt), 'PPp')}
                  </Typography>
                  <Stack direction="row" alignItems="center" spacing={1} sx={{ mt: 1.5 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                      Assignees
                    </Typography>
                    {assigneeUserIds.length ? (
                      <AvatarGroup max={4} sx={{ '& .MuiAvatar-root': { width: 28, height: 28, fontSize: '0.7rem' } }}>
                        {assigneeUserIds.map((id) => (
                          <Avatar
                            key={id}
                            className={assigneeSwatchClass(id)}
                            sx={{ fontWeight: 700, fontSize: '0.65rem' }}
                          >
                            {initialsFromLabel(assigneeMap.get(id) || id)}
                          </Avatar>
                        ))}
                      </AvatarGroup>
                    ) : (
                      <Typography variant="caption" color="text.secondary">
                        Unassigned
                      </Typography>
                    )}
                  </Stack>
                </>
              ) : (
                <Typography color="error" variant="body2">
                  Could not load this item.
                </Typography>
              )}
            </Box>
            <IconButton aria-label="Close" onClick={() => requestClose()} size="small">
              <CloseIcon fontSize="small" />
            </IconButton>
          </Stack>
        </Box>

        {item
          ? (() => {
              const detailsBody = (
                <Stack spacing={2.5}>
                  <Paper variant="outlined" sx={{ p: 2, bgcolor: 'hsl(var(--muted) / 0.25)' }}>
                    <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 700 }}>
                      People
                    </Typography>
                    {/* <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                      Select everyone responsible — matches Jira-style multiple assignees when the API supports it.
                    </Typography> */}
                    {canManage && currentUserId ? (
                      <Button
                        size="small"
                        startIcon={<PersonAddIcon />}
                        onClick={() => toggleAssignee(currentUserId)}
                        sx={{ mb: 1 }}
                      >
                        {assigneeUserIds.includes(currentUserId) ? 'Remove me' : 'Assign to me'}
                      </Button>
                    ) : null}
                    {assigneePoolUsers.length === 0 ? (
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', py: 1 }}>
                        No one is on this board’s team list — add members under{' '}
                        <Box component="span" sx={{ fontWeight: 700 }}>
                          Board access
                        </Box>{' '}
                        to pick assignees, or use an org-wide board to use all directory members.
                      </Typography>
                    ) : (
                      <FormGroup sx={{ maxHeight: 200, overflow: 'auto', gap: 0 }}>
                        {assigneePoolUsers.map((u) => (
                          <FormControlLabel
                            key={u.id}
                            disabled={!canManage}
                            control={
                              <Checkbox
                                size="small"
                                checked={assigneeUserIds.includes(u.id)}
                                onChange={() => toggleAssignee(u.id)}
                              />
                            }
                            label={<Typography variant="body2">{userLabel(u)}</Typography>}
                          />
                        ))}
                      </FormGroup>
                    )}
                  </Paper>

                  <FormControl fullWidth size="small" disabled={!canManage}>
                    <InputLabel id="tw-sprint-lbl">Sprint</InputLabel>
                    <Select
                      labelId="tw-sprint-lbl"
                      label="Sprint"
                      value={form.sprintId ? form.sprintId : '__backlog__'}
                      onChange={(e) => {
                        const v = e.target.value as string
                        setForm((f) => ({ ...f, sprintId: v === '__backlog__' ? undefined : v }))
                      }}
                    >
                      <MenuItem value="__backlog__">Backlog (no sprint)</MenuItem>
                      {assignableSprints.map((s) => (
                        <MenuItem key={s.id} value={s.id}>
                          {s.state === 'active' ? '● ' : ''}
                          {s.name} · {format(new Date(s.startAt), 'MMM d')} – {format(new Date(s.endAt), 'MMM d')}
                          {s.state === 'completed' ? ' (closed)' : ''}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: -1 }}>
                    Move work in or out of the current iteration. Save to persist (API + local overlay).
                  </Typography>

                  <Stack spacing={1}>
                    <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 700 }}>
                      Tags
                    </Typography>
                    <Stack direction="row" flexWrap="wrap" gap={0.75}>
                      {catalogMerged.map((t) => {
                        const on = (form.labels || []).includes(t.slug)
                        return (
                          <Chip
                            key={t.slug}
                            label={t.name}
                            size="small"
                            color={on ? 'primary' : 'default'}
                            variant={on ? 'filled' : 'outlined'}
                            onClick={() => canManage && toggleLabel(t.slug)}
                          />
                        )
                      })}
                      {extraLabelSlugs.map((slug) => {
                        const on = (form.labels || []).includes(slug)
                        const name = teamWorkTagDisplayName(slug, catalogMerged)
                        return (
                          <Chip
                            key={`extra-${slug}`}
                            label={name}
                            size="small"
                            variant={on ? 'filled' : 'outlined'}
                            color={on ? 'secondary' : 'default'}
                            onClick={() => canManage && toggleLabel(slug)}
                          />
                        )
                      })}
                    </Stack>
                    {canManage ? (
                      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ sm: 'flex-end' }}>
                        <TextField
                          size="small"
                          fullWidth
                          label="Custom tag"
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
                        <Button variant="outlined" size="small" onClick={addCustomTagFromInput}>
                          Add
                        </Button>
                      </Stack>
                    ) : null}
                    {canManage && projectId
                      ? (form.labels || []).map((slug) => {
                          const inPreset = projectTagCatalog.some((t) => t.slug === slug)
                          if (inPreset) return null
                          return (
                            <Typography key={`preset-${slug}`} variant="caption" color="text.secondary">
                              “{teamWorkTagDisplayName(slug, catalogMerged)}” is only on this issue —{' '}
                              <Link
                                component="button"
                                type="button"
                                variant="caption"
                                disabled={savingCatalog}
                                onClick={() => void saveTagToBoardPreset(slug, teamWorkTagDisplayName(slug, catalogMerged))}
                              >
                                Save as board tag
                              </Link>
                            </Typography>
                          )
                        })
                      : null}
                  </Stack>

                  <TextField
                    label="Title"
                    fullWidth
                    size="small"
                    disabled={!canManage}
                    value={form.title ?? ''}
                    onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  />

                  <Box>
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
                  </Box>

                  <Stack spacing={1}>
                    <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 700 }}>
                      Attachments
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Images and documents upload via the chat file endpoint, then attach to this issue.
                    </Typography>
                    <input
                      ref={fileRef}
                      type="file"
                      hidden
                      multiple
                      accept="image/*,.pdf,.doc,.docx,.txt,.csv,.zip"
                      onChange={(e) => void onPickFiles(e)}
                    />
                    <Stack direction="row" flexWrap="wrap" gap={1} alignItems="center">
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={uploadingFile ? <CircularProgress size={16} /> : <AttachFileIcon />}
                        disabled={!canManage || uploadingFile}
                        onClick={() => fileRef.current?.click()}
                      >
                        Add files
                      </Button>
                    </Stack>
                    {attachments.length ? (
                      <Stack spacing={0.75}>
                        {attachments.map((a, idx) => (
                          <Paper key={`${a.url}-${idx}`} variant="outlined" sx={{ px: 1.5, py: 1 }}>
                            <Stack direction="row" alignItems="center" justifyContent="space-between" gap={1}>
                              <Link
                                href={resolveBackendMediaUrl(a.url)}
                                target="_blank"
                                rel="noopener noreferrer"
                                variant="body2"
                                sx={{ wordBreak: 'break-all' }}
                              >
                                {a.fileName}
                              </Link>
                              {canManage ? (
                                <IconButton
                                  size="small"
                                  aria-label="Remove attachment"
                                  onClick={() => setAttachments((prev) => prev.filter((_, i) => i !== idx))}
                                >
                                  <DeleteOutlineIcon fontSize="small" />
                                </IconButton>
                              ) : null}
                            </Stack>
                          </Paper>
                        ))}
                      </Stack>
                    ) : (
                      <Typography variant="caption" color="text.secondary">
                        No attachments yet.
                      </Typography>
                    )}
                  </Stack>

                  <Paper variant="outlined" sx={{ p: 2 }}>
                    <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 700 }}>
                      Sub-tasks
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                      Numbers follow the parent ticket (e.g. <Box component="span" sx={{ fontFamily: 'monospace', fontWeight: 700 }}>PF-12.1</Box>,{' '}
                      <Box component="span" sx={{ fontFamily: 'monospace', fontWeight: 700 }}>PF-12.2</Box>) in board order. The smaller monospace key is
                      the stored server id when it differs.
                    </Typography>
                    {subtasks.length ? (
                      <Stack spacing={0.75} sx={{ mb: 1.5 }}>
                        {subtasks.map((st) => {
                          const stLabel = hierarchicalIssueLabel(st, boardItems)
                          return (
                          <Paper key={st.id} variant="outlined" sx={{ px: 1.5, py: 1, borderLeftWidth: 3, borderLeftColor: 'primary.main' }}>
                            <Stack direction="row" alignItems="center" justifyContent="space-between" gap={1}>
                              <Box sx={{ minWidth: 0 }}>
                                <Stack direction="row" alignItems="center" gap={0.5} flexWrap="wrap">
                                  <Typography variant="caption" sx={{ fontFamily: 'monospace', color: 'primary.main', fontWeight: 700 }}>
                                    {stLabel}
                                  </Typography>
                                  {stLabel !== st.issueKey ? (
                                    <Typography variant="caption" sx={{ fontFamily: 'monospace', color: 'text.secondary' }}>
                                      {st.issueKey}
                                    </Typography>
                                  ) : null}
                                  <Chip size="small" label="Subtask" variant="outlined" sx={{ height: 20, fontSize: '0.6rem' }} />
                                </Stack>
                                <Typography variant="body2" sx={{ fontWeight: 500 }} noWrap title={st.title}>
                                  {st.title}
                                </Typography>
                              </Box>
                              {onNavigateItem ? (
                                <Button size="small" onClick={() => onNavigateItem(st.id)}>
                                  Open
                                </Button>
                              ) : null}
                            </Stack>
                          </Paper>
                          )
                        })}
                      </Stack>
                    ) : (
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                        No sub-tasks yet.
                      </Typography>
                    )}
                    {canManage ? (
                      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                        <TextField
                          size="small"
                          fullWidth
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
                        <Button
                          variant="contained"
                          disabled={creatingSubtask || !subtaskTitle.trim()}
                          onClick={() => void createSubtask()}
                        >
                          {creatingSubtask ? <CircularProgress size={18} color="inherit" /> : 'Add'}
                        </Button>
                      </Stack>
                    ) : null}
                  </Paper>

                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                    <FormControl fullWidth size="small" disabled={!canManage}>
                      <InputLabel>Status</InputLabel>
                      <Select
                        label="Status"
                        value={form.status ?? ''}
                        onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as TeamWorkItem['status'] }))}
                      >
                        {statuses.map((s) => (
                          <MenuItem key={s} value={s} sx={{ textTransform: 'capitalize' }}>
                            {s.replace(/_/g, ' ')}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    <FormControl fullWidth size="small" disabled={!canManage}>
                      <InputLabel>Priority</InputLabel>
                      <Select
                        label="Priority"
                        value={form.priority ?? ''}
                        onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value as TeamWorkItem['priority'] }))}
                      >
                        {priorities.map((p) => (
                          <MenuItem key={p} value={p} sx={{ textTransform: 'capitalize' }}>
                            {p}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Stack>

                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                    <FormControl fullWidth size="small" disabled={!canManage}>
                      <InputLabel>Type</InputLabel>
                      <Select
                        label="Type"
                        value={form.issueType ?? ''}
                        onChange={(e) => setForm((f) => ({ ...f, issueType: e.target.value as TeamWorkItem['issueType'] }))}
                      >
                        {issueTypes.map((t) => (
                          <MenuItem key={t} value={t} sx={{ textTransform: 'capitalize' }}>
                            {t}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    <TextField
                      label="Story points"
                      type="number"
                      size="small"
                      fullWidth
                      disabled={!canManage}
                      inputProps={{ min: 0, max: 100 }}
                      value={form.storyPoints ?? ''}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          storyPoints: e.target.value === '' ? undefined : Number(e.target.value),
                        }))
                      }
                    />
                  </Stack>

                  <FormControl fullWidth size="small" disabled={!canManage}>
                    <InputLabel>Epic</InputLabel>
                    <Select
                      label="Epic"
                      value={form.epicId || '__none__'}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, epicId: e.target.value === '__none__' ? undefined : String(e.target.value) }))
                      }
                    >
                      <MenuItem value="__none__">None</MenuItem>
                      {epics.map((ep) => (
                        <MenuItem key={ep.id} value={ep.id}>
                          {ep.issueKey} — {ep.title}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                    <TextField
                      label="Start"
                      type="datetime-local"
                      size="small"
                      fullWidth
                      disabled={!canManage}
                      InputLabelProps={{ shrink: true }}
                      value={form.startAt ? format(new Date(form.startAt), "yyyy-MM-dd'T'HH:mm") : ''}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          startAt: e.target.value ? new Date(e.target.value).toISOString() : undefined,
                        }))
                      }
                    />
                    <TextField
                      label="Due"
                      type="datetime-local"
                      size="small"
                      fullWidth
                      disabled={!canManage}
                      InputLabelProps={{ shrink: true }}
                      value={form.dueAt ? format(new Date(form.dueAt), "yyyy-MM-dd'T'HH:mm") : ''}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          dueAt: e.target.value ? new Date(e.target.value).toISOString() : undefined,
                        }))
                      }
                    />
                  </Stack>

                  <Paper variant="outlined" sx={{ p: 2 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                      Meetings
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                      Open Google Calendar with this issue prefilled.
                    </Typography>
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<EventIcon />}
                      sx={{ mt: 1 }}
                      onClick={() => setScheduleMeetingOpen(true)}
                    >
                      Schedule in Google Calendar
                    </Button>
                  </Paper>

                  {canManage ? (
                    <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ pt: 1 }}>
                      <Button variant="contained" disabled={saving} onClick={() => void save()}>
                        {saving ? <CircularProgress size={20} color="inherit" sx={{ mr: 1 }} /> : null}
                        Save changes
                      </Button>
                      <Button color="error" variant="outlined" startIcon={<DeleteOutlineIcon />} onClick={() => setDeleteOpen(true)}>
                        Delete
                      </Button>
                    </Stack>
                  ) : null}
                </Stack>
              )
              const commentsBody = (
                <Stack spacing={2} sx={{ height: '100%' }}>
                  <Stack spacing={1.5} sx={{ flex: 1, minHeight: 0, overflow: 'auto', pr: 0.5 }}>
                    {(item.comments || []).length === 0 ? (
                      <Typography variant="body2" color="text.secondary">
                        No comments yet.
                      </Typography>
                    ) : (
                      [...(item.comments || [])]
                        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
                        .map((c) => (
                          <Paper key={c.id} variant="outlined" sx={{ p: 1.5, bgcolor: 'hsl(var(--muted) / 0.2)' }}>
                            <Stack direction="row" justifyContent="space-between" alignItems="baseline" gap={1}>
                              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                {c.authorName || c.userId}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {format(new Date(c.createdAt), 'PPp')}
                              </Typography>
                            </Stack>
                            <Divider sx={{ my: 1 }} />
                            <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                              {c.body}
                            </Typography>
                          </Paper>
                        ))
                    )}
                  </Stack>
                  <Paper variant="outlined" sx={{ p: 2, flexShrink: 0 }}>
                    <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                      Add comment
                    </Typography>
                    <TextField
                      fullWidth
                      multiline
                      minRows={3}
                      placeholder="Context, blockers, handoff…"
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                    />
                    <Stack direction="row" justifyContent="flex-end" sx={{ mt: 1 }}>
                      <Button
                        variant="contained"
                        size="small"
                        disabled={posting || !comment.trim()}
                        onClick={() => void postComment()}
                      >
                        {posting ? <CircularProgress size={18} color="inherit" /> : 'Post'}
                      </Button>
                    </Stack>
                  </Paper>
                </Stack>
              )
              return (
                <>
                  {!isWideDrawer ? (
                    <Tabs
                      value={tab}
                      onChange={(_, v) => setTab(v)}
                      variant="fullWidth"
                      sx={{ minHeight: 42, flexShrink: 0, borderBottom: 1, borderColor: 'divider', px: 1 }}
                    >
                      <Tab icon={<EditNoteIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Details" sx={{ minHeight: 42 }} />
                      <Tab
                        icon={<CommentIcon sx={{ fontSize: 18 }} />}
                        iconPosition="start"
                        label={`Comments${item.comments?.length ? ` (${item.comments.length})` : ''}`}
                        sx={{ minHeight: 42 }}
                      />
                    </Tabs>
                  ) : null}
                  {isWideDrawer ? (
                    <PanelGroup
                      direction="horizontal"
                      autoSaveId="fixer-team-work-drawer-split"
                      style={{ flex: 1, minHeight: 0, display: 'flex', width: '100%' }}
                    >
                      <Panel defaultSize={62} minSize={32} style={{ minWidth: 0 }}>
                        <Box sx={{ height: '100%', overflow: 'auto', px: 2, py: 2 }}>{detailsBody}</Box>
                      </Panel>
                      <PanelResizeHandle
                        style={{
                          width: 6,
                          flexShrink: 0,
                          background: 'hsl(var(--border) / 0.5)',
                          cursor: 'col-resize',
                        }}
                      />
                      <Panel defaultSize={38} minSize={26} style={{ minWidth: 0 }}>
                        <Box
                          sx={{
                            height: '100%',
                            overflow: 'auto',
                            px: 2,
                            py: 2,
                            borderLeft: '1px solid',
                            borderColor: 'divider',
                          }}
                        >
                          {commentsBody}
                        </Box>
                      </Panel>
                    </PanelGroup>
                  ) : (
                    <Box sx={{ flex: 1, minHeight: 0, overflow: 'auto', px: 2, py: 2 }}>
                      {tab === 0 ? detailsBody : commentsBody}
                    </Box>
                  )}
                </>
              )
            })()
          : null}
      </Drawer>

      <Dialog open={unsavedCloseOpen} onClose={() => setUnsavedCloseOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Unsaved changes</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            You have edits or a draft comment that are not saved to the server. Choose how to close this issue.
            {canManage && comment.trim() ? (
              <>
                {' '}
                <Box component="span" sx={{ fontWeight: 600 }}>
                  Save & close
                </Box>{' '}
                only updates the issue fields — post the comment separately if needed.
              </>
            ) : null}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, gap: 1, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          <Button onClick={() => setUnsavedCloseOpen(false)}>Keep editing</Button>
          <Button color="warning" variant="outlined" onClick={discardAndClose}>
            Discard
          </Button>
          {canManage && item && computeSignature() !== baselineRef.current ? (
            <Button variant="contained" disabled={saving} onClick={() => void saveThenClose()}>
              {saving ? <CircularProgress size={18} color="inherit" sx={{ mr: 1 }} /> : null}
              Save & close
            </Button>
          ) : null}
          {comment.trim() ? (
            <Button variant="contained" color="secondary" disabled={posting} onClick={() => void postCommentThenClose()}>
              {posting ? <CircularProgress size={18} color="inherit" sx={{ mr: 1 }} /> : null}
              Post comment & close
            </Button>
          ) : null}
        </DialogActions>
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
