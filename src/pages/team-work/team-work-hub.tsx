import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  Archive,
  CalendarPlus,
  ClipboardList,
  FolderKanban,
  KanbanSquare,
  LayoutList,
  Loader2,
  Mail,
  Plus,
  Search,
  Settings2,
  Tag,
  Trash2,
  UserCircle2,
} from 'lucide-react'
import { PageHeader } from '../../components/common/PageHeader'
import { ConfirmDialog } from '../../components/common/ConfirmDialog'
import { TeamWorkBoard } from '../../components/team-work/TeamWorkBoard'
import { TeamWorkItemDrawer } from '../../components/team-work/TeamWorkItemDrawer'
import { TeamWorkSprintPanel } from '../../components/team-work/TeamWorkSprintPanel'
import { ScheduleMeetingDialog } from '../../components/team-work/ScheduleMeetingDialog'
import { teamWorkApi } from '../../services/api/teamWork.api'
import { usersService } from '../../services/api/users.service'
import type {
  TeamWorkItem,
  TeamWorkIssueType,
  TeamWorkMeta,
  TeamWorkProject,
  TeamWorkSprint,
  TeamWorkStatus,
  TeamWorkTagCatalogEntry,
} from '../../types/teamWork.types'
import { usePermissions } from '../../hooks/usePermissions'
import { useAppSelector } from '../../store/hooks'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Badge } from '../../components/ui/badge'
import { Card, CardContent } from '../../components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '../../components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog'
import { Label } from '../../components/ui/label'
import { Textarea } from '../../components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select'
import { Switch } from '../../components/ui/switch'
import { Checkbox } from '../../components/ui/checkbox'
import { assigneeSwatchClass, initialsFromLabel, PRIORITY_CHIP, priorityLabel } from '../../lib/teamWorkVisuals'
import { teamWorkTagDisplayName, teamWorkTagSlug } from '../../lib/teamWorkTags'
import { assigneeIdsFromItem, primaryAssigneeUserId } from '../../lib/teamWorkAssignees'
import { getProjectTeamUsersForAssignee } from '../../lib/teamWorkProjectTeam'
import {
  getActiveSprint,
  loadSprintAssignmentsFromStorage,
  mergeSprintOntoItems,
  saveSprintAssignmentsToStorage,
} from '../../lib/teamWorkSprintLocal'
import { cn } from '../../lib/utils'
import { sprintIdForTeamWorkApi } from '../../lib/mongoObjectId'
import { hierarchicalIssueLabel } from '../../lib/teamWorkIssueDisplay'
import { RichTextField } from '../../components/forms/RichTextField'

const STATUS_LABELS: Record<TeamWorkStatus, string> = {
  backlog: 'Backlog',
  todo: 'To do',
  in_progress: 'In progress',
  in_review: 'In review',
  blocked: 'Blocked',
  done: 'Done',
  cancelled: 'Cancelled',
}

type ListSortKey = 'issueKey' | 'title' | 'status' | 'priority' | 'type' | 'sprint' | 'assignee'

const LIST_COL_STORAGE_KEY = 'fixer-team-work-list-cols-v1'

const DEFAULT_LIST_COL_WIDTHS: Record<string, number> = {
  key: 136,
  title: 268,
  status: 124,
  priority: 104,
  type: 92,
  sprint: 128,
  assignee: 200,
  actions: 76,
}

function loadListColWidths(): Record<string, number> {
  if (typeof window === 'undefined') return { ...DEFAULT_LIST_COL_WIDTHS }
  try {
    const raw = window.localStorage.getItem(LIST_COL_STORAGE_KEY)
    if (!raw) return { ...DEFAULT_LIST_COL_WIDTHS }
    const parsed = JSON.parse(raw) as Record<string, number>
    return { ...DEFAULT_LIST_COL_WIDTHS, ...parsed }
  } catch {
    return { ...DEFAULT_LIST_COL_WIDTHS }
  }
}

function ResizableTh({
  width,
  minWidth,
  children,
  onResize,
  sortable,
  onSortClick,
  sortActive,
  sortDir,
}: {
  width: number
  minWidth: number
  children: React.ReactNode
  onResize: (next: number) => void
  sortable?: boolean
  onSortClick?: () => void
  sortActive?: boolean
  sortDir?: 'asc' | 'desc'
}) {
  const onMouseDownResize = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const startX = e.clientX
    const startW = width
    const onMove = (ev: MouseEvent) => onResize(Math.max(minWidth, Math.round(startW + ev.clientX - startX)))
    const onUp = () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }

  return (
    <th
      className="relative border-b bg-muted/40 px-1 py-2 text-left text-xs font-medium uppercase text-muted-foreground"
      style={{ width, minWidth, maxWidth: width }}
    >
      <button
        type="button"
        className={cn(
          'flex w-full min-w-0 items-center gap-0.5 text-left font-medium',
          sortable && 'cursor-pointer select-none hover:text-foreground',
        )}
        onClick={sortable ? onSortClick : undefined}
      >
        <span className="truncate">{children}</span>
        {sortActive ? <span className="shrink-0 text-[10px] text-foreground">{sortDir === 'asc' ? '▲' : '▼'}</span> : null}
      </button>
      <span
        role="separator"
        aria-hidden
        className="absolute right-0 top-0 z-10 h-full w-1.5 cursor-col-resize hover:bg-primary/25"
        onMouseDown={onMouseDownResize}
      />
    </th>
  )
}

function userLabel(u: { username?: string; firstName?: string; lastName?: string; email?: string; id: string }): string {
  if (u.username?.trim()) return u.username.trim()
  const n = `${u.firstName || ''} ${u.lastName || ''}`.trim()
  return n || u.email || u.id
}

function normalizeBoardEmail(email: string | undefined): string {
  return String(email || '')
    .trim()
    .toLowerCase()
}

export function TeamWorkHub() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { checkPermission } = usePermissions()
  const authUser = useAppSelector((s) => s.auth.user)
  const canManage = checkPermission('manage_team_tasks')
  const canManageProjects = checkPermission('manage_team_projects')
  const showProjectSwitcherPanel =
    authUser?.userType === 'admin' || authUser?.userType === 'super_admin'

  const projectStorageKey = useMemo(
    () => `fixer-team-work-project:${authUser?.tenant?.id ?? '_'}`,
    [authUser?.tenant?.id],
  )

  const [projects, setProjects] = useState<TeamWorkProject[]>([])
  const [projectId, setProjectId] = useState<string | null>(null)
  const [projectsLoaded, setProjectsLoaded] = useState(false)

  const [meta, setMeta] = useState<TeamWorkMeta | null>(null)
  const [items, setItems] = useState<TeamWorkItem[]>([])
  const [total, setTotal] = useState(0)
  const [epics, setEpics] = useState<TeamWorkItem[]>([])
  const [adminUsers, setAdminUsers] = useState<Awaited<ReturnType<typeof usersService.getUsers>>['users']>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const [view, setView] = useState<'board' | 'list'>('board')
  const [q, setQ] = useState('')
  const [searchApplied, setSearchApplied] = useState('')
  const [assigneeFilter, setAssigneeFilter] = useState<string>('__all__')
  const [mineOnly, setMineOnly] = useState(false)
  const [tagFilters, setTagFilters] = useState<string[]>([])
  const [createOpen, setCreateOpen] = useState(false)
  const [drawerId, setDrawerId] = useState<string | null>(null)

  const openWorkItemDrawer = useCallback(
    (id: string | null) => {
      setDrawerId(id)
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev)
          if (id) next.set('issue', id)
          else next.delete('issue')
          return next
        },
        { replace: true },
      )
    },
    [setSearchParams],
  )

  useEffect(() => {
    const q = searchParams.get('issue')?.trim() || null
    if (!q) {
      setDrawerId(null)
      return
    }
    setDrawerId((d) => (d === q ? d : q))
  }, [searchParams])

  const [newTitle, setNewTitle] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [newPriority, setNewPriority] = useState<TeamWorkItem['priority']>('medium')
  const [newType, setNewType] = useState<TeamWorkItem['issueType']>('task')
  const [newAssigneeIds, setNewAssigneeIds] = useState<string[]>([])
  const [newStatus, setNewStatus] = useState<TeamWorkStatus>('backlog')
  const [newStartAt, setNewStartAt] = useState('')
  const [newDueAt, setNewDueAt] = useState('')
  const [createTagSlugs, setCreateTagSlugs] = useState<string[]>([])
  const [newCustomCreateTag, setNewCustomCreateTag] = useState('')
  const [createTagOptions, setCreateTagOptions] = useState<{ catalog: TeamWorkTagCatalogEntry[]; inUse: string[] } | null>(
    null,
  )
  const [savingCreateCatalog, setSavingCreateCatalog] = useState(false)
  const [newEpicId, setNewEpicId] = useState<string>('__none__')
  const [newStoryPoints, setNewStoryPoints] = useState('')
  const [creating, setCreating] = useState(false)

  const [projectSettingsOpen, setProjectSettingsOpen] = useState(false)
  const [projectDetailName, setProjectDetailName] = useState('')
  const [projectDetailKey, setProjectDetailKey] = useState('')
  const [projectDetailDesc, setProjectDetailDesc] = useState('')
  const [archiveConfirmOpen, setArchiveConfirmOpen] = useState(false)
  const [archiving, setArchiving] = useState(false)
  const [deleteBoardConfirmOpen, setDeleteBoardConfirmOpen] = useState(false)
  const [deleteBoardSaving, setDeleteBoardSaving] = useState(false)
  const [unarchiveSaving, setUnarchiveSaving] = useState(false)
  const [newProjectOpen, setNewProjectOpen] = useState(false)
  const [newProjectName, setNewProjectName] = useState('')
  const [newProjectKey, setNewProjectKey] = useState('')
  const [accessMemberIds, setAccessMemberIds] = useState<string[]>([])
  const [savingAccess, setSavingAccess] = useState(false)
  const [savingNewProject, setSavingNewProject] = useState(false)
  const [scheduleMeetingOpen, setScheduleMeetingOpen] = useState(false)

  const tenantId = authUser?.tenant?.id ?? '_'
  const [sprintRows, setSprintRows] = useState<TeamWorkSprint[]>([])
  const [sprintAssignments, setSprintAssignments] = useState<Record<string, string>>({})
  const [sprintViewFilter, setSprintViewFilter] = useState<string>('__all__')
  const [newSprintIdForCreate, setNewSprintIdForCreate] = useState<string>('__none__')
  const [listSortKey, setListSortKey] = useState<ListSortKey>('issueKey')
  const [listSortDir, setListSortDir] = useState<'asc' | 'desc'>('asc')
  const [listFilterStatus, setListFilterStatus] = useState<string>('__all__')
  const [listFilterPriority, setListFilterPriority] = useState<string>('__all__')
  const [listFilterType, setListFilterType] = useState<string>('__all__')
  const [listColWidths, setListColWidths] = useState<Record<string, number>>(loadListColWidths)

  const currentProject = useMemo(
    () => projects.find((p) => p.id === projectId) ?? null,
    [projects, projectId],
  )

  const sortedProjectsForPicker = useMemo(() => {
    const live = projects.filter((p) => !p.isArchived)
    const archived = projects.filter((p) => p.isArchived)
    const byName = (a: TeamWorkProject, b: TeamWorkProject) => a.name.localeCompare(b.name)
    return [...[...live].sort(byName), ...[...archived].sort(byName)]
  }, [projects])

  const boardTagOptions = useMemo(() => {
    const s = new Set<string>()
    for (const t of currentProject?.tagCatalog ?? []) s.add(t.slug)
    for (const it of items) {
      for (const l of it.labels ?? []) s.add(l)
    }
    return Array.from(s).sort()
  }, [currentProject, items])

  /** Include active filters so chips stay visible when the filtered list is empty. */
  const tagFilterChipSlugs = useMemo(
    () => Array.from(new Set([...boardTagOptions, ...tagFilters])).sort(),
    [boardTagOptions, tagFilters],
  )

  const createCatalogMerged = useMemo(() => {
    const m = new Map<string, TeamWorkTagCatalogEntry>()
    for (const t of currentProject?.tagCatalog ?? []) m.set(t.slug, t)
    for (const t of createTagOptions?.catalog ?? []) {
      if (!m.has(t.slug)) m.set(t.slug, t)
    }
    return Array.from(m.values()).sort((a, b) => a.name.localeCompare(b.name))
  }, [currentProject?.tagCatalog, createTagOptions])

  const createExtraLabelSlugs = useMemo(() => {
    const known = new Set(createCatalogMerged.map((t) => t.slug))
    const out: string[] = []
    for (const slug of createTagOptions?.inUse ?? []) {
      if (!known.has(slug)) out.push(slug)
    }
    for (const slug of createTagSlugs) {
      if (!known.has(slug)) out.push(slug)
    }
    return Array.from(new Set(out)).sort()
  }, [createCatalogMerged, createTagOptions, createTagSlugs])

  const statuses = useMemo(() => meta?.statuses ?? (Object.keys(STATUS_LABELS) as TeamWorkStatus[]), [meta])

  const assigneeMap = useMemo(() => {
    const m = new Map<string, string>()
    for (const u of adminUsers) m.set(u.id, userLabel(u))
    if (authUser?.id) {
      const self = `${authUser.firstName || ''} ${authUser.lastName || ''}`.trim() || authUser.email || authUser.id
      m.set(authUser.id, self)
    }
    return m
  }, [adminUsers, authUser])

  /** Assignees = board roster when restricted; otherwise directory members from API. */
  const teamMembers = useMemo(
    () => getProjectTeamUsersForAssignee(currentProject, adminUsers),
    [currentProject, adminUsers],
  )

  useEffect(() => {
    if (!projectId) {
      setSprintRows([])
      setSprintAssignments({})
      return
    }
    let cancelled = false
    setSprintAssignments(loadSprintAssignmentsFromStorage(tenantId, projectId))
    void teamWorkApi
      .listSprints(projectId)
      .then((rows) => {
        if (!cancelled) setSprintRows(rows)
      })
      .catch(() => {
        // If the backend doesn't have sprints enabled, keep the UI alive with no rows.
        if (!cancelled) setSprintRows([])
      })
    return () => {
      cancelled = true
    }
  }, [projectId, tenantId])

  useEffect(() => {
    if (!projectId) return
    setSprintAssignments((prev) => {
      const next = { ...prev }
      let changed = false
      for (const it of items) {
        if (it.sprintId && next[it.id] !== it.sprintId) {
          next[it.id] = it.sprintId
          changed = true
        }
      }
      if (changed) saveSprintAssignmentsToStorage(tenantId, projectId, next)
      return changed ? next : prev
    })
  }, [items, projectId, tenantId])

  const mergedItems = useMemo(() => mergeSprintOntoItems(items, sprintAssignments), [items, sprintAssignments])

  const sprintNameById = useMemo(() => {
    const m = new Map<string, string>()
    for (const s of sprintRows) m.set(s.id, s.name)
    return m
  }, [sprintRows])

  const activeSprintRow = useMemo(() => getActiveSprint(sprintRows), [sprintRows])

  const visibleItems = useMemo(() => {
    if (sprintViewFilter === '__all__') return mergedItems
    if (sprintViewFilter === '__backlog__') return mergedItems.filter((i) => !i.sprintId)
    if (sprintViewFilter === '__active__') {
      const a = getActiveSprint(sprintRows)
      return a ? mergedItems.filter((i) => i.sprintId === a.id) : []
    }
    return mergedItems.filter((i) => i.sprintId === sprintViewFilter)
  }, [mergedItems, sprintViewFilter, sprintRows])

  useEffect(() => {
    try {
      window.localStorage.setItem(LIST_COL_STORAGE_KEY, JSON.stringify(listColWidths))
    } catch {
      /* ignore */
    }
  }, [listColWidths])

  const toggleListSort = useCallback((key: ListSortKey) => {
    setListSortKey((prevKey) => {
      if (prevKey === key) {
        setListSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
        return prevKey
      }
      setListSortDir('asc')
      return key
    })
  }, [])

  const listRows = useMemo(() => {
    let rows = [...visibleItems]
    if (listFilterStatus !== '__all__') rows = rows.filter((r) => r.status === listFilterStatus)
    if (listFilterPriority !== '__all__') rows = rows.filter((r) => r.priority === listFilterPriority)
    if (listFilterType !== '__all__') rows = rows.filter((r) => r.issueType === listFilterType)
    const dir = listSortDir === 'asc' ? 1 : -1
    const priOrder: Record<string, number> = { urgent: 0, high: 1, medium: 2, low: 3 }
    rows.sort((a, b) => {
      let c = 0
      switch (listSortKey) {
        case 'issueKey':
          c = a.issueKey.localeCompare(b.issueKey)
          break
        case 'title':
          c = a.title.localeCompare(b.title)
          break
        case 'status':
          c = a.status.localeCompare(b.status)
          break
        case 'priority':
          c = (priOrder[a.priority] ?? 9) - (priOrder[b.priority] ?? 9)
          break
        case 'type':
          c = a.issueType.localeCompare(b.issueType)
          break
        case 'sprint': {
          const sa = a.sprintId ? sprintNameById.get(a.sprintId) ?? a.sprintId : ''
          const sb = b.sprintId ? sprintNameById.get(b.sprintId) ?? b.sprintId : ''
          c = sa.localeCompare(sb)
          break
        }
        case 'assignee': {
          const la = assigneeIdsFromItem(a)
            .map((id) => assigneeMap.get(id) || id)
            .join(', ')
          const lb = assigneeIdsFromItem(b)
            .map((id) => assigneeMap.get(id) || id)
            .join(', ')
          c = la.localeCompare(lb)
          break
        }
        default:
          c = 0
      }
      return c * dir
    })
    return rows
  }, [
    visibleItems,
    listSortKey,
    listSortDir,
    listFilterStatus,
    listFilterPriority,
    listFilterType,
    sprintNameById,
    assigneeMap,
  ])

  const load = useCallback(
    async (override?: { q?: string }) => {
      if (!projectId) return
      setLoadError(null)
      const qEff = (override?.q !== undefined ? override.q : searchApplied).trim() || undefined
      try {
        const [m, list, epicList, admins] = await Promise.all([
          teamWorkApi.getMeta(),
          teamWorkApi.listItems({
            projectId,
            limit: '100',
            q: qEff,
            tags: tagFilters.length ? tagFilters.join(',') : undefined,
            assigneeUserId:
              mineOnly && authUser?.id
                ? authUser.id
                : assigneeFilter !== '__all__'
                  ? assigneeFilter
                  : undefined,
          }),
          teamWorkApi.listItems({ projectId, issueType: 'epic', limit: '80' }),
          usersService.getUsers({ scope: 'members', limit: 100, page: 1 }),
        ])
        setMeta(m)
        let boardItems = list.items
        if (mineOnly && authUser?.id) {
          boardItems = boardItems.filter((it) => assigneeIdsFromItem(it).includes(authUser.id))
        }
        setItems(boardItems)
        setTotal(list.total)
        setEpics(epicList.items.filter((e) => e.issueType === 'epic'))
        setAdminUsers(admins.users)
      } catch {
        setLoadError(
          'Could not load this board. You may not be on the member list for a restricted project, or the API rejected the request.',
        )
      }
    },
    [projectId, searchApplied, assigneeFilter, mineOnly, authUser?.id, tagFilters],
  )

  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const list = await teamWorkApi.listProjects({ includeArchived: canManageProjects })
        if (cancelled) return
        setProjects(list)
        const saved = typeof window !== 'undefined' ? window.localStorage.getItem(projectStorageKey) : null
        const pick =
          saved && list.some((p) => p.id === saved)
            ? saved
            : list.find((p) => !p.isArchived)?.id ?? list[0]?.id ?? null
        setProjectId(pick)
        if (pick) window.localStorage.setItem(projectStorageKey, pick)
      } catch {
        if (!cancelled) setLoadError('Could not load team work projects.')
      } finally {
        if (!cancelled) setProjectsLoaded(true)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [projectStorageKey, canManageProjects])

  useEffect(() => {
    if (!projectsLoaded || !projectId) return
    let cancelled = false
    setLoading(true)
    load()
      .then(() => {
        if (!cancelled) setLoading(false)
      })
      .catch(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [load, projectsLoaded, projectId])

  useEffect(() => {
    if (projectsLoaded && !projectId) setLoading(false)
  }, [projectsLoaded, projectId])

  const sortedMembersForAccess = useMemo(() => {
    return [...adminUsers].sort((a, b) => userLabel(a).localeCompare(userLabel(b)))
  }, [adminUsers])

  /** Pre-fill Calendar guests when the board is restricted to a roster. */
  const boardMemberGuestEmails = useMemo(() => {
    const idRestricted = (currentProject?.memberUserIds?.length ?? 0) > 0
    const emailRestricted = (currentProject?.memberEmails?.length ?? 0) > 0
    if (!currentProject || (!idRestricted && !emailRestricted)) return [] as string[]
    const allowedIds = new Set(currentProject.memberUserIds)
    const allowedEmails = new Set(
      (currentProject.memberEmails ?? []).map((e) => normalizeBoardEmail(e)).filter(Boolean),
    )
    return adminUsers
      .filter(
        (u) =>
          allowedIds.has(u.id) || Boolean(u.email && allowedEmails.has(normalizeBoardEmail(u.email))),
      )
      .map((u) => u.email)
      .filter(Boolean) as string[]
  }, [currentProject, adminUsers])

  const stats = useMemo(() => {
    const openStatuses = new Set(['backlog', 'todo', 'in_progress', 'in_review', 'blocked'])
    let open = 0
    let done = 0
    let blocked = 0
    for (const it of visibleItems) {
      if (it.status === 'blocked') blocked += 1
      if (it.status === 'done') done += 1
      if (openStatuses.has(it.status)) open += 1
    }
    return { open, done, blocked, total: visibleItems.length }
  }, [visibleItems])

  const onMoveItem = async (itemId: string, newStatus: TeamWorkStatus) => {
    if (!canManage) return
    await teamWorkApi.patchStatus(itemId, newStatus)
    await load()
  }

  const persistItemSprint = useCallback(
    (itemId: string, sprintId: string | undefined) => {
      setSprintAssignments((prev) => {
        const next = { ...prev }
        if (sprintId) next[itemId] = sprintId
        else delete next[itemId]
        if (projectId) saveSprintAssignmentsToStorage(tenantId, projectId, next)
        return next
      })
    },
    [projectId, tenantId],
  )

  const handleSprintDeleted = useCallback(
    (sprintId: string) => {
      setSprintAssignments((prev) => {
        const next = { ...prev }
        for (const [itemId, sid] of Object.entries(next)) {
          if (sid === sprintId) delete next[itemId]
        }
        if (projectId) saveSprintAssignmentsToStorage(tenantId, projectId, next)
        return next
      })
    },
    [projectId, tenantId],
  )

  const handleSprintCloseAssignments = async (nextMap: Record<string, string>) => {
    const prev = sprintAssignments
    setSprintAssignments(nextMap)
    if (projectId) saveSprintAssignmentsToStorage(tenantId, projectId, nextMap)
    const allIds = Array.from(new Set([...Object.keys(prev), ...Object.keys(nextMap)]))
    for (const id of allIds) {
      const before = prev[id]
      const after = nextMap[id]
      if (before === after) continue
      const apiSprint = sprintIdForTeamWorkApi(after)
      if (after && apiSprint === undefined) continue
      try {
        await teamWorkApi.updateItem(id, { sprintId: apiSprint })
      } catch {
        /* API may not persist sprintId yet */
      }
    }
    await load()
  }

  const createItem = async () => {
    if (!newTitle.trim()) return
    setCreating(true)
    try {
      const sp = newStoryPoints.trim()
      const poolIds = new Set(teamMembers.map((u) => u.id))
      const cleanedAssignees = newAssigneeIds.filter((id) => poolIds.has(id))
      const primaryAssignee = primaryAssigneeUserId(cleanedAssignees)
      const descPlain = newDesc.replace(/<[^>]*>/g, '').replace(/&nbsp;/gi, ' ').trim()
      const sprintIdCreate = newSprintIdForCreate !== '__none__' ? newSprintIdForCreate : undefined
      const sprintIdForApi = sprintIdForTeamWorkApi(sprintIdCreate)
      const created = await teamWorkApi.createItem({
        projectId: projectId!,
        title: newTitle.trim(),
        description: descPlain ? newDesc : undefined,
        priority: newPriority,
        issueType: newType,
        status: newStatus,
        assigneeUserId: primaryAssignee,
        assigneeUserIds: cleanedAssignees.length ? cleanedAssignees : undefined,
        sprintId: sprintIdForApi,
        labels: createTagSlugs.length ? createTagSlugs : undefined,
        startAt: newStartAt ? new Date(newStartAt).toISOString() : undefined,
        dueAt: newDueAt ? new Date(newDueAt).toISOString() : undefined,
        epicId: newEpicId !== '__none__' ? newEpicId : undefined,
        storyPoints:
          sp !== '' && !Number.isNaN(Number(sp)) ? Math.min(100, Math.max(0, Math.floor(Number(sp)))) : undefined,
      })
      if (sprintIdCreate && projectId) {
        setSprintAssignments((prev) => {
          const next = { ...prev, [created.id]: sprintIdCreate }
          saveSprintAssignmentsToStorage(tenantId, projectId, next)
          return next
        })
        if (sprintIdForApi) {
          try {
            await teamWorkApi.updateItem(created.id, { sprintId: sprintIdForApi })
          } catch {
            /* overlay already saved */
          }
        }
      }
      setCreateOpen(false)
      resetNewIssueForm()
      await load()
    } finally {
      setCreating(false)
    }
  }

  const onChangeProject = (id: string) => {
    openWorkItemDrawer(null)
    setTagFilters([])
    setSprintViewFilter('__all__')
    setProjectId(id)
    window.localStorage.setItem(projectStorageKey, id)
    setLoadError(null)
  }

  const refreshProjects = useCallback(async () => {
    const list = await teamWorkApi.listProjects({ includeArchived: canManageProjects })
    setProjects(list)
  }, [canManageProjects])

  const resetNewIssueForm = useCallback(() => {
    setNewTitle('')
    setNewDesc('')
    setNewPriority('medium')
    setNewType('task')
    setNewAssigneeIds([])
    setNewStatus('backlog')
    setNewStartAt('')
    setNewDueAt('')
    setCreateTagSlugs([])
    setNewCustomCreateTag('')
    setCreateTagOptions(null)
    setNewEpicId('__none__')
    setNewStoryPoints('')
    setNewSprintIdForCreate('__none__')
  }, [])

  useEffect(() => {
    if (!createOpen || !projectId) {
      setCreateTagOptions(null)
      return
    }
    let cancelled = false
    void teamWorkApi
      .getProjectTags(projectId)
      .then((d) => {
        if (!cancelled) setCreateTagOptions(d)
      })
      .catch(() => {
        if (!cancelled) setCreateTagOptions({ catalog: [], inUse: [] })
      })
    return () => {
      cancelled = true
    }
  }, [createOpen, projectId])

  const toggleCreateTag = (slug: string) => {
    setCreateTagSlugs((prev) => (prev.includes(slug) ? prev.filter((x) => x !== slug) : [...prev, slug]))
  }

  const addCustomCreateTagFromInput = () => {
    const raw = newCustomCreateTag.trim()
    if (!raw) return
    const slug = teamWorkTagSlug(raw)
    setCreateTagSlugs((prev) => (prev.includes(slug) ? prev : [...prev, slug]))
    setNewCustomCreateTag('')
  }

  const saveCreateTagPreset = async (slug: string, displayName: string) => {
    if (!projectId || !canManage) return
    setSavingCreateCatalog(true)
    try {
      const cat = currentProject?.tagCatalog ?? []
      const next = [...cat]
      if (!next.some((t) => t.slug === slug)) next.push({ slug, name: displayName.slice(0, 64) })
      await teamWorkApi.patchProject(projectId, { tagCatalog: next })
      await refreshProjects()
      const d = await teamWorkApi.getProjectTags(projectId)
      setCreateTagOptions(d)
    } finally {
      setSavingCreateCatalog(false)
    }
  }

  const saveBoardSettings = async () => {
    if (!currentProject) return
    const name = projectDetailName.trim()
    if (!name) return
    setSavingAccess(true)
    try {
      const emailFromMemberId = (id: string): string => {
        if (authUser?.id === id && authUser.email) return normalizeBoardEmail(authUser.email)
        const u = adminUsers.find((x) => x.id === id)
        return u?.email ? normalizeBoardEmail(u.email) : ''
      }
      const memberEmails = Array.from(
        new Set(accessMemberIds.map(emailFromMemberId).filter(Boolean)),
      ) as string[]
      const description = projectDetailDesc.trim()
      const keyNormalized = projectDetailKey.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '').slice(0, 12)
      const patch: Parameters<typeof teamWorkApi.patchProject>[1] = {
        name,
        description: description || undefined,
        memberUserIds: accessMemberIds,
        memberEmails,
      }
      if (keyNormalized && keyNormalized !== currentProject.key) {
        patch.key = keyNormalized
      }
      const updated = await teamWorkApi.patchProject(currentProject.id, patch)
      setProjects((prev) => prev.map((p) => (p.id === updated.id ? updated : p)))
      setProjectSettingsOpen(false)
      void load()
    } finally {
      setSavingAccess(false)
    }
  }

  const createProjectBoard = async () => {
    if (!newProjectName.trim()) return
    setSavingNewProject(true)
    try {
      const p = await teamWorkApi.createProject({
        name: newProjectName.trim(),
        key: newProjectKey.trim() || undefined,
        memberUserIds: authUser?.id ? [authUser.id] : [],
      })
      setProjects((prev) => [...prev, p])
      onChangeProject(p.id)
      setNewProjectOpen(false)
      setNewProjectName('')
      setNewProjectKey('')
      void load()
    } finally {
      setSavingNewProject(false)
    }
  }

  useEffect(() => {
    if (projectSettingsOpen && currentProject) {
      setAccessMemberIds([...currentProject.memberUserIds])
      setProjectDetailName(currentProject.name)
      setProjectDetailKey(currentProject.key)
      setProjectDetailDesc(currentProject.description ?? '')
    }
  }, [projectSettingsOpen, currentProject])

  const unarchiveCurrentBoard = async () => {
    if (!currentProject || !canManageProjects) return
    setUnarchiveSaving(true)
    try {
      const updated = await teamWorkApi.patchProject(currentProject.id, { isArchived: false })
      setProjects((prev) => prev.map((p) => (p.id === updated.id ? updated : p)))
      await refreshProjects()
      setProjectSettingsOpen(false)
    } finally {
      setUnarchiveSaving(false)
    }
  }

  const deleteCurrentBoard = async () => {
    if (!currentProject || !canManageProjects) return
    setDeleteBoardSaving(true)
    try {
      await teamWorkApi.deleteProject(currentProject.id)
      const list = await teamWorkApi.listProjects({ includeArchived: canManageProjects })
      setProjects(list)
      setDeleteBoardConfirmOpen(false)
      setProjectSettingsOpen(false)
      const nextId = list.find((p) => !p.isArchived)?.id ?? null
      if (nextId) onChangeProject(nextId)
      else {
        setProjectId(null)
        window.localStorage.removeItem(projectStorageKey)
      }
    } finally {
      setDeleteBoardSaving(false)
    }
  }

  const archiveCurrentBoard = async () => {
    if (!currentProject) return
    setArchiving(true)
    try {
      await teamWorkApi.patchProject(currentProject.id, { isArchived: true })
      const list = await teamWorkApi.listProjects({ includeArchived: canManageProjects })
      setProjects(list)
      setArchiveConfirmOpen(false)
      setProjectSettingsOpen(false)
      const nextId = list.find((p) => !p.isArchived)?.id ?? null
      if (nextId) onChangeProject(nextId)
      else {
        setProjectId(null)
        window.localStorage.removeItem(projectStorageKey)
      }
    } catch {
      /* toast via api client */
    } finally {
      setArchiving(false)
    }
  }

  return (
    <div className="flex flex-col gap-3 p-3 md:p-4">
      <PageHeader
        className="mb-3 gap-1.5 sm:mb-4 md:mb-5"
        title="Team work"
        subtitle="Each project is its own board. Restrict a board by adding members (Board access); leave members empty for a tenant-wide board. Super admins and users with manage_team_projects see every board and can create new ones."
        action={
          <Button variant="outline" size="sm" asChild>
            <Link to="/team-work/calendar">Team calendar</Link>
          </Button>
        }
      />

      {showProjectSwitcherPanel ? (
        <Card className="border-border/80">
          <CardContent className="flex flex-col gap-2 py-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
            <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-center">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <FolderKanban className="h-4 w-4 shrink-0" aria-hidden />
                Project board
              </div>
              <Select
                value={projectId ?? ''}
                onValueChange={onChangeProject}
                    disabled={!sortedProjectsForPicker.length}
              >
                <SelectTrigger className="w-full min-w-[220px] sm:max-w-md">
                  <SelectValue placeholder="Select a board" />
                </SelectTrigger>
                <SelectContent>
                  {sortedProjectsForPicker.map((p) => {
                    const restricted =
                      p.memberUserIds.length > 0 || (p.memberEmails?.length ?? 0) > 0
                    return (
                      <SelectItem key={p.id} value={p.id}>
                        <span className="font-mono text-xs text-muted-foreground">{p.key}</span>{' '}
                        <span className="ml-1">{p.name}</span>
                        {p.isArchived ? (
                          <span className="ml-2 text-xs text-amber-700 dark:text-amber-500">(archived)</span>
                        ) : restricted ? (
                          <span className="ml-2 text-xs text-muted-foreground">(restricted)</span>
                        ) : (
                          <span className="ml-2 text-xs text-muted-foreground">(org-wide)</span>
                        )}
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-wrap gap-2">
              {canManageProjects ? (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="gap-1.5"
                    onClick={() => setNewProjectOpen(true)}
                  >
                    <Plus className="h-3.5 w-3.5" />
                    New project
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="gap-1.5"
                    disabled={!currentProject}
                    onClick={() => setProjectSettingsOpen(true)}
                  >
                    <Settings2 className="h-3.5 w-3.5" />
                    Board settings
                  </Button>
                </>
              ) : null}
            </div>
          </CardContent>
        </Card>
      ) : null}

      {loadError ? (
        <Card className="border-destructive/40 bg-destructive/5">
          <CardContent className="py-4 text-sm text-destructive">{loadError}</CardContent>
        </Card>
      ) : null}

      {projectsLoaded && !projects.length && !loadError ? (
        <Card className="border-border/80">
          <CardContent className="flex flex-col gap-2 py-6 text-center">
            <FolderKanban className="mx-auto h-10 w-10 text-muted-foreground/50" aria-hidden />
            <p className="text-sm text-muted-foreground">
              No project boards yet. Ask someone with <span className="font-medium text-foreground">manage team projects</span>{' '}
              permission to create one, or create the first board if you have that access.
            </p>
            {canManageProjects ? (
              <Button type="button" className="mx-auto w-fit gap-1.5" onClick={() => setNewProjectOpen(true)}>
                <Plus className="h-4 w-4" />
                Create first project
              </Button>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      {projectId ? (
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: 'Active pipeline', value: stats.open, hint: 'Open work in current view' },
            { label: 'Blocked', value: stats.blocked, hint: 'In current view' },
            { label: 'Done', value: stats.done, hint: 'In current view' },
            { label: 'Total (server)', value: total, hint: 'Matches search & tags (not sprint scope)' },
          ].map((s) => (
            <Card key={s.label} className="border-border/80 bg-gradient-to-br from-card to-muted/30">
              <CardContent className="pt-3 pb-3">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{s.label}</p>
                <p className="mt-1 text-3xl font-semibold tabular-nums">{loading ? '—' : s.value}</p>
                <p className="mt-1 text-xs text-muted-foreground">{s.hint}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : null}

      {projectId ? (
        <TeamWorkSprintPanel
          projectId={projectId}
          items={mergedItems}
          canManage={canManage}
          sprints={sprintRows}
          sprintAssignments={sprintAssignments}
          onSprintsUpdated={setSprintRows}
          onAssignmentsAfterClose={handleSprintCloseAssignments}
          onSprintDeleted={handleSprintDeleted}
        />
      ) : null}

      {projectId ? (
      <Card className="border-border/80">
        <CardContent className="flex flex-col gap-3 py-3">
          <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-1 flex-wrap items-center gap-2">
              <div className="relative min-w-[200px] flex-1 max-w-md">
                <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="pl-9"
                  placeholder="Search title, key, description…"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const t = q.trim()
                      setSearchApplied(t)
                      void load({ q: t })
                    }
                  }}
                />
              </div>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => {
                  const t = q.trim()
                  setSearchApplied(t)
                  void load({ q: t })
                }}
              >
                Apply
              </Button>
              <Button type="button" variant="ghost" size="sm" onClick={() => void load()}>
                Refresh
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-1.5"
                disabled={!projectId}
                onClick={() => setScheduleMeetingOpen(true)}
              >
                <CalendarPlus className="h-3.5 w-3.5" aria-hidden />
                Schedule meeting
              </Button>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 rounded-lg border border-border/70 bg-muted/30 px-3 py-1.5">
                <span className="text-xs text-muted-foreground">Sprint scope</span>
                <Select value={sprintViewFilter} onValueChange={setSprintViewFilter}>
                  <SelectTrigger className="h-8 w-[200px] border-0 bg-transparent shadow-none">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">All issues</SelectItem>
                    <SelectItem value="__backlog__">Backlog (no sprint)</SelectItem>
                    <SelectItem value="__active__">
                      Active sprint{activeSprintRow ? `: ${activeSprintRow.name}` : ''}
                    </SelectItem>
                    {sprintRows
                      .filter((s) => s.state === 'planned')
                      .map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          Planned: {s.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2 rounded-lg border border-border/70 bg-muted/30 px-3 py-1.5">
                <UserCircle2 className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Assignee</span>
                <Select value={assigneeFilter} onValueChange={setAssigneeFilter} disabled={mineOnly}>
                  <SelectTrigger className="h-8 w-[160px] border-0 bg-transparent shadow-none">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">Everyone</SelectItem>
                    {teamMembers.map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        {userLabel(u)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <Switch id="mine" checked={mineOnly} onCheckedChange={setMineOnly} />
                <Label htmlFor="mine" className="text-sm">
                  My work
                </Label>
              </div>
              {canManage ? (
                <Button
                  type="button"
                  className="gap-1.5 shadow-sm"
                  disabled={!projectId}
                  onClick={() => setCreateOpen(true)}
                >
                  <Plus className="h-4 w-4" />
                  New Task
                </Button>
              ) : null}
            </div>
          </div>

          {tagFilterChipSlugs.length > 0 ? (
            <div className="flex flex-wrap items-start gap-3 rounded-lg border border-border/60 bg-muted/20 px-3 py-2.5">
              <Tag className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
              <div className="flex min-w-0 flex-1 flex-col gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Filter by tag</span>
                  {tagFilters.length ? (
                    <Button type="button" variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => setTagFilters([])}>
                      Clear tags
                    </Button>
                  ) : null}
                </div>
                <p className="text-xs text-muted-foreground">
                  Shows issues that include at least one of the selected tags.
                </p>
                <div className="flex flex-wrap gap-2">
                  {tagFilterChipSlugs.map((slug) => {
                    const active = tagFilters.includes(slug)
                    const label = teamWorkTagDisplayName(slug, currentProject?.tagCatalog ?? [])
                    return (
                      <Button
                        key={slug}
                        type="button"
                        size="sm"
                        variant={active ? 'default' : 'outline'}
                        className="h-8 rounded-full px-3 text-xs"
                        onClick={() =>
                          setTagFilters((prev) => (prev.includes(slug) ? prev.filter((x) => x !== slug) : [...prev, slug]))
                        }
                      >
                        {label}
                      </Button>
                    )
                  })}
                </div>
              </div>
            </div>
          ) : null}

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Tabs value={view} onValueChange={(v) => setView(v as 'board' | 'list')}>
              <TabsList>
                <TabsTrigger value="board" className="gap-1.5">
                  <KanbanSquare className="h-4 w-4" />
                  Board
                </TabsTrigger>
                <TabsTrigger value="list" className="gap-1.5">
                  <LayoutList className="h-4 w-4" />
                  List
                </TabsTrigger>
              </TabsList>
            </Tabs>
            {!canManage ? (
              <Badge variant="outline" className="w-fit text-xs font-normal text-muted-foreground">
                View-only: you can browse and comment; ask an admin for manage access to edit or drag cards.
              </Badge>
            ) : null}
          </div>

          {loading ? (
            <div className="flex items-center justify-center gap-2 py-20 text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin" />
              Loading work items…
            </div>
          ) : view === 'board' ? (
            <TeamWorkBoard
              statuses={statuses}
              statusLabels={STATUS_LABELS}
              items={visibleItems}
              hierarchyItems={mergedItems}
              canManage={canManage}
              assigneeMap={assigneeMap}
              sprintNameById={sprintNameById}
              onMoveItem={onMoveItem}
              onOpenItem={(id) => openWorkItemDrawer(id)}
            />
          ) : (
            <div className="space-y-3">
              <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-end">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Table · Status</Label>
                  <Select value={listFilterStatus} onValueChange={setListFilterStatus}>
                    <SelectTrigger className="h-9 w-[168px]">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__all__">All statuses</SelectItem>
                      {statuses.map((s) => (
                        <SelectItem key={s} value={s}>
                          {STATUS_LABELS[s]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Table · Priority</Label>
                  <Select value={listFilterPriority} onValueChange={setListFilterPriority}>
                    <SelectTrigger className="h-9 w-[168px]">
                      <SelectValue placeholder="Priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__all__">All priorities</SelectItem>
                      {(meta?.priorities ?? ['lowest', 'low', 'medium', 'high', 'highest']).map((p) => (
                        <SelectItem key={p} value={p}>
                          {priorityLabel(p)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Table · Type</Label>
                  <Select value={listFilterType} onValueChange={setListFilterType}>
                    <SelectTrigger className="h-9 w-[168px]">
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__all__">All types</SelectItem>
                      {(meta?.issueTypes ?? (['task', 'bug', 'story', 'epic'] as TeamWorkIssueType[])).map((t) => (
                        <SelectItem key={t} value={t}>
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-9"
                  onClick={() => {
                    setListFilterStatus('__all__')
                    setListFilterPriority('__all__')
                    setListFilterType('__all__')
                  }}
                >
                  Clear table filters
                </Button>
              </div>

              <div className="overflow-x-auto rounded-lg border border-border/70">
                <table className="w-full table-fixed text-left text-sm" style={{ minWidth: 720 }}>
                  <thead>
                    <tr>
                      <ResizableTh
                        width={listColWidths.key}
                        minWidth={80}
                        onResize={(n) => setListColWidths((p) => ({ ...p, key: n }))}
                        sortable
                        onSortClick={() => toggleListSort('issueKey')}
                        sortActive={listSortKey === 'issueKey'}
                        sortDir={listSortDir}
                      >
                        Key
                      </ResizableTh>
                      <ResizableTh
                        width={listColWidths.title}
                        minWidth={120}
                        onResize={(n) => setListColWidths((p) => ({ ...p, title: n }))}
                        sortable
                        onSortClick={() => toggleListSort('title')}
                        sortActive={listSortKey === 'title'}
                        sortDir={listSortDir}
                      >
                        Title
                      </ResizableTh>
                      <ResizableTh
                        width={listColWidths.status}
                        minWidth={88}
                        onResize={(n) => setListColWidths((p) => ({ ...p, status: n }))}
                        sortable
                        onSortClick={() => toggleListSort('status')}
                        sortActive={listSortKey === 'status'}
                        sortDir={listSortDir}
                      >
                        Status
                      </ResizableTh>
                      <ResizableTh
                        width={listColWidths.priority}
                        minWidth={80}
                        onResize={(n) => setListColWidths((p) => ({ ...p, priority: n }))}
                        sortable
                        onSortClick={() => toggleListSort('priority')}
                        sortActive={listSortKey === 'priority'}
                        sortDir={listSortDir}
                      >
                        Priority
                      </ResizableTh>
                      <ResizableTh
                        width={listColWidths.type}
                        minWidth={72}
                        onResize={(n) => setListColWidths((p) => ({ ...p, type: n }))}
                        sortable
                        onSortClick={() => toggleListSort('type')}
                        sortActive={listSortKey === 'type'}
                        sortDir={listSortDir}
                      >
                        Type
                      </ResizableTh>
                      <ResizableTh
                        width={listColWidths.sprint}
                        minWidth={88}
                        onResize={(n) => setListColWidths((p) => ({ ...p, sprint: n }))}
                        sortable
                        onSortClick={() => toggleListSort('sprint')}
                        sortActive={listSortKey === 'sprint'}
                        sortDir={listSortDir}
                      >
                        Sprint
                      </ResizableTh>
                      <ResizableTh
                        width={listColWidths.assignee}
                        minWidth={100}
                        onResize={(n) => setListColWidths((p) => ({ ...p, assignee: n }))}
                        sortable
                        onSortClick={() => toggleListSort('assignee')}
                        sortActive={listSortKey === 'assignee'}
                        sortDir={listSortDir}
                      >
                        Assignee
                      </ResizableTh>
                      <th
                        className="border-b bg-muted/40 px-2 py-2 text-right text-xs font-medium uppercase text-muted-foreground"
                        style={{ width: listColWidths.actions, minWidth: listColWidths.actions }}
                      >
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {listRows.map((it) => {
                      const rowAssignees = assigneeIdsFromItem(it)
                      const rowLabel = hierarchicalIssueLabel(it, mergedItems)
                      return (
                        <tr key={it.id} className="border-b border-border/50 hover:bg-muted/20">
                          <td className="overflow-hidden px-2 py-2 align-top">
                            <div className="font-mono text-xs font-semibold text-primary">{rowLabel}</div>
                            {rowLabel !== it.issueKey ? (
                              <div className="mt-0.5 font-mono text-[10px] text-muted-foreground">{it.issueKey}</div>
                            ) : null}
                            {it.parentWorkItemId ? (
                              <Badge variant="secondary" className="mt-1 h-5 px-1.5 text-[10px] font-normal">
                                Subtask
                              </Badge>
                            ) : null}
                          </td>
                          <td className="overflow-hidden px-2 py-2 align-top">
                            <span className="line-clamp-2 font-medium">{it.title}</span>
                          </td>
                          <td className="overflow-hidden px-2 py-2 align-top capitalize text-muted-foreground">
                            {it.status.replace(/_/g, ' ')}
                          </td>
                          <td className="overflow-hidden px-2 py-2 align-top">
                            <span
                              className={cn(
                                'inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize',
                                PRIORITY_CHIP[it.priority],
                              )}
                            >
                              {priorityLabel(it.priority)}
                            </span>
                          </td>
                          <td className="overflow-hidden px-2 py-2 align-top capitalize">{it.issueType}</td>
                          <td className="overflow-hidden truncate px-2 py-2 align-top text-xs text-muted-foreground">
                            {it.sprintId ? sprintNameById.get(it.sprintId) ?? it.sprintId.slice(0, 8) : '—'}
                          </td>
                          <td className="overflow-hidden px-2 py-2 align-top">
                            {rowAssignees.length ? (
                              <div className="flex flex-wrap items-center gap-1.5">
                                <div className="flex -space-x-1.5">
                                  {rowAssignees.slice(0, 3).map((aid) => (
                                    <span
                                      key={aid}
                                      className={cn(
                                        'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ring-2 ring-background',
                                        assigneeSwatchClass(aid),
                                      )}
                                      title={assigneeMap.get(aid) || aid}
                                    >
                                      {initialsFromLabel(assigneeMap.get(aid) || aid)}
                                    </span>
                                  ))}
                                </div>
                                <span className="max-w-[min(160px,100%)] truncate text-xs text-foreground/90">
                                  {rowAssignees.map((aid) => assigneeMap.get(aid) || aid).join(', ')}
                                </span>
                              </div>
                            ) : (
                              <span className="text-xs italic text-muted-foreground">—</span>
                            )}
                          </td>
                          <td className="px-2 py-2 text-right align-top">
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              className="h-8"
                              onClick={() => openWorkItemDrawer(it.id)}
                            >
                              View
                            </Button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
                {listRows.length === 0 ? (
                  <div className="flex flex-col items-center gap-2 py-16 text-center text-muted-foreground">
                    <ClipboardList className="h-10 w-10 opacity-40" />
                    <p className="text-sm">No issues match your filters.</p>
                    {canManage ? (
                      <Button type="button" variant="outline" size="sm" onClick={() => setCreateOpen(true)}>
                        Create the first issue
                      </Button>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      ) : null}

      <TeamWorkItemDrawer
        open={Boolean(drawerId)}
        itemId={drawerId}
        tenantId={tenantId}
        boardItems={mergedItems}
        projectId={projectId}
        meta={meta}
        onClose={() => openWorkItemDrawer(null)}
        canManage={canManage}
        onUpdated={() => void load()}
        onDeleted={() => void load()}
        onNavigateItem={(id) => openWorkItemDrawer(id)}
        epics={epics.filter((e) => e.id !== drawerId)}
        assigneePoolUsers={teamMembers}
        assigneeMap={assigneeMap}
        sprints={sprintRows}
        sprintAssignmentMap={sprintAssignments}
        onItemSprintPersist={persistItemSprint}
        currentUserId={authUser?.id}
        projectTagCatalog={currentProject?.tagCatalog ?? []}
        onProjectTagCatalogChanged={() => void refreshProjects()}
      />

      <Dialog
        open={createOpen}
        onOpenChange={(o) => {
          setCreateOpen(o)
          if (!o) resetNewIssueForm()
        }}
      >
        <DialogContent className="max-h-[min(90vh,720px)] max-w-lg overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Task</DialogTitle>
            {/* <DialogDescription className="text-left text-sm text-muted-foreground">
              Set board tags, dates, and workflow fields before creating. Start and due dates appear on the team calendar.
            </DialogDescription> */}
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="nw-t">Title</Label>
              <Input
                id="nw-t"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Short, actionable summary"
              />
            </div>
            <RichTextField
              label="Description"
              value={newDesc}
              onChange={setNewDesc}
              placeholder="Context, acceptance criteria, links…"
              height={160}
              // helperText="Same rich description editor as the issue drawer."
            />
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={newStatus} onValueChange={(v) => setNewStatus(v as TeamWorkStatus)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statuses.map((s) => (
                      <SelectItem key={s} value={s} className="capitalize">
                        {STATUS_LABELS[s]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select value={newPriority} onValueChange={(v) => setNewPriority(v as TeamWorkItem['priority'])}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(meta?.priorities ?? ['lowest', 'low', 'medium', 'high', 'highest']).map((p) => (
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
                <Select value={newType} onValueChange={(v) => setNewType(v as TeamWorkItem['issueType'])}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(meta?.issueTypes ?? ['task', 'bug', 'story', 'epic']).map((t) => (
                      <SelectItem key={t} value={t} className="capitalize">
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="nw-sp">Story points</Label>
                <Input
                  id="nw-sp"
                  type="number"
                  min={0}
                  max={100}
                  value={newStoryPoints}
                  onChange={(e) => setNewStoryPoints(e.target.value)}
                  placeholder="Optional"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="nw-start">Start date</Label>
                <Input id="nw-start" type="datetime-local" value={newStartAt} onChange={(e) => setNewStartAt(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nw-due">Due date</Label>
                <Input id="nw-due" type="datetime-local" value={newDueAt} onChange={(e) => setNewDueAt(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Epic (optional)</Label>
              <Select value={newEpicId} onValueChange={setNewEpicId}>
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
              <Label>Sprint (optional)</Label>
              <Select value={newSprintIdForCreate} onValueChange={setNewSprintIdForCreate}>
                <SelectTrigger>
                  <SelectValue placeholder="Backlog" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Backlog (no sprint)</SelectItem>
                  {activeSprintRow ? (
                    <SelectItem value={activeSprintRow.id}>Active: {activeSprintRow.name}</SelectItem>
                  ) : null}
                  {sprintRows
                    .filter((s) => s.state === 'planned')
                    .map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        Planned: {s.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              {/* <p className="text-xs text-muted-foreground">New issues can jump straight into the active or a planned sprint.</p> */}
            </div>
            <div className="space-y-2 rounded-lg border border-border/60 bg-muted/15 p-3">
              <div className="flex items-center gap-2">
                <Tag className="h-4 w-4 text-muted-foreground" aria-hidden />
                <Label className="text-base">Tags</Label>
              </div>
              {/* <p className="text-xs text-muted-foreground">
                Select board tags or add a custom label. Save new names as board presets so filters stay useful for everyone.
              </p> */}
              <div className="flex flex-wrap gap-1.5">
                {createCatalogMerged.map((t) => {
                  const on = createTagSlugs.includes(t.slug)
                  return (
                    <Button
                      key={t.slug}
                      type="button"
                      size="sm"
                      variant={on ? 'default' : 'outline'}
                      className="h-8 rounded-full px-3 text-xs font-normal"
                      disabled={!canManage}
                      onClick={() => toggleCreateTag(t.slug)}
                    >
                      {t.name}
                    </Button>
                  )
                })}
                {createExtraLabelSlugs.map((slug) => {
                  const on = createTagSlugs.includes(slug)
                  const name = teamWorkTagDisplayName(slug, createCatalogMerged)
                  return (
                    <Button
                      key={`extra-${slug}`}
                      type="button"
                      size="sm"
                      variant={on ? 'default' : 'secondary'}
                      className="h-8 rounded-full px-3 text-xs font-normal"
                      disabled={!canManage}
                      onClick={() => toggleCreateTag(slug)}
                    >
                      {name}
                    </Button>
                  )
                })}
              </div>
              {canManage ? (
                <div className="flex flex-col gap-2 pt-1 sm:flex-row sm:items-end">
                  <div className="min-w-0 flex-1 space-y-1">
                    <Label htmlFor="nw-newtag" className="text-xs">
                      New tag
                    </Label>
                    <Input
                      id="nw-newtag"
                      placeholder="e.g. Marketing team"
                      value={newCustomCreateTag}
                      onChange={(e) => setNewCustomCreateTag(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          addCustomCreateTagFromInput()
                        }
                      }}
                    />
                  </div>
                  <Button type="button" variant="secondary" size="sm" onClick={addCustomCreateTagFromInput}>
                    Add tag
                  </Button>
                </div>
              ) : null}
              {canManage && projectId
                ? createTagSlugs.map((slug) => {
                    const inPreset = (currentProject?.tagCatalog ?? []).some((t) => t.slug === slug)
                    if (inPreset) return null
                    return (
                      <div key={`preset-hint-${slug}`} className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                        <span>“{teamWorkTagDisplayName(slug, createCatalogMerged)}” is new on this issue.</span>
                        <Button
                          type="button"
                          variant="link"
                          className="h-auto p-0 text-xs"
                          disabled={savingCreateCatalog}
                          onClick={() => void saveCreateTagPreset(slug, teamWorkTagDisplayName(slug, createCatalogMerged))}
                        >
                          Save as board tag
                        </Button>
                      </div>
                    )
                  })
                : null}
            </div>
            <div className="space-y-2 rounded-lg border border-border/60 bg-muted/15 p-3">
              <Label>Assignees (optional)</Label>
              {/* <p className="text-xs text-muted-foreground">
                Pick everyone working this issue — same model as Jira multi-assignee.
              </p> */}
              <div className="max-h-40 space-y-2 overflow-y-auto pr-1">
                {adminUsers.map((u) => (
                  <label key={u.id} className="flex cursor-pointer items-center gap-2 text-sm">
                    <Checkbox
                      checked={newAssigneeIds.includes(u.id)}
                      onCheckedChange={(on) =>
                        setNewAssigneeIds((prev) =>
                          on ? [...prev, u.id] : prev.filter((id) => id !== u.id),
                        )
                      }
                    />
                    <span>{userLabel(u)}</span>
                  </label>
                ))}
              </div>
              <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
                <Mail className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary/80" aria-hidden />
                If you pick someone other than yourself, the API emails them when SMTP is configured.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => void createItem()}
              disabled={creating || !newTitle.trim() || !projectId}
            >
              {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={newProjectOpen} onOpenChange={setNewProjectOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>New project board</DialogTitle>
            <DialogDescription>
              Creates a separate backlog and issue keys for this project. You start as the only member; add teammates under Board access, or leave the roster empty later for an organization-wide board.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-2">
              <Label htmlFor="np-name">Name</Label>
              <Input
                id="np-name"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                placeholder="e.g. Mobile app relaunch"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="np-key">Key (optional)</Label>
              <Input
                id="np-key"
                value={newProjectKey}
                onChange={(e) => setNewProjectKey(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                placeholder="MOB"
                maxLength={12}
                className="font-mono uppercase"
              />
              <p className="text-xs text-muted-foreground">Short prefix for issue keys (e.g. MOB-42). Leave blank to let the server assign one.</p>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setNewProjectOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => void createProjectBoard()}
              disabled={savingNewProject || !newProjectName.trim()}
            >
              {savingNewProject ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Create board
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={projectSettingsOpen} onOpenChange={setProjectSettingsOpen}>
        <DialogContent className="flex max-h-[85vh] max-w-lg flex-col overflow-hidden">
          <DialogHeader>
            <DialogTitle>Project board</DialogTitle>
            <DialogDescription>
              Update name and access for{' '}
              <span className="font-mono text-xs text-foreground">{currentProject?.key}</span>.{' '}
              {currentProject && currentProject.memberUserIds.length === 0 ? (
                <>Anyone in your organization with team-work access can use this board.</>
              ) : (
                <>Only listed people (plus admins who manage team projects) can open this board.</>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto py-2">
            <div className="space-y-2">
              <Label htmlFor="board-name">Board name</Label>
              <Input
                id="board-name"
                value={projectDetailName}
                onChange={(e) => setProjectDetailName(e.target.value)}
                placeholder="e.g. Platform squad"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="board-key">Issue key prefix</Label>
              <Input
                id="board-key"
                value={projectDetailKey}
                onChange={(e) =>
                  setProjectDetailKey(e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, '').slice(0, 12))
                }
                placeholder="PF"
                maxLength={12}
                className="font-mono uppercase"
              />
              <p className="text-xs text-muted-foreground">
                New tasks use this prefix (e.g. PF-1). Existing keys are not renamed if you change the prefix.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="board-desc">Description (optional)</Label>
              <Textarea
                id="board-desc"
                rows={2}
                className="resize-none text-sm"
                value={projectDetailDesc}
                onChange={(e) => setProjectDetailDesc(e.target.value)}
                placeholder="What this board is for — visible to your team in admin."
              />
            </div>
            <div className="flex items-center justify-between gap-2 border-t border-border/60 pt-3">
              <p className="text-xs font-medium text-muted-foreground">Board access</p>
              <Button type="button" variant="ghost" size="sm" className="h-8 shrink-0" onClick={() => setAccessMemberIds([])}>
                Clear all (org-wide)
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">Select members from your dashboard directory.</p>
            <div className="min-h-0 flex-1 overflow-y-auto rounded-md border border-border/70 p-2">
              {sortedMembersForAccess.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">Load the board once to fetch the member directory, or no users were returned.</p>
              ) : (
                <ul className="space-y-1">
                  {sortedMembersForAccess.map((u) => {
                    const checked = accessMemberIds.includes(u.id)
                    return (
                      <li key={u.id}>
                        <label className="flex cursor-pointer items-center gap-3 rounded-md px-2 py-2 hover:bg-muted/50">
                          <Checkbox
                            checked={checked}
                            onCheckedChange={(v) => {
                              const on = v === true
                              setAccessMemberIds((prev) =>
                                on ? (prev.includes(u.id) ? prev : [...prev, u.id]) : prev.filter((x) => x !== u.id),
                              )
                            }}
                          />
                          <span className="text-sm">{userLabel(u)}</span>
                          <span className="ml-auto truncate font-mono text-[11px] text-muted-foreground">{u.email}</span>
                        </label>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
          </div>
          <DialogFooter className="flex-col gap-3 border-t border-border/60 pt-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex w-full flex-wrap gap-2 sm:max-w-md">
              {currentProject?.isArchived ? (
                <Button
                  type="button"
                  variant="secondary"
                  className="gap-1.5"
                  disabled={!canManageProjects || unarchiveSaving}
                  onClick={() => void unarchiveCurrentBoard()}
                >
                  {unarchiveSaving ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
                  Unarchive board
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  className="gap-1.5 text-destructive hover:bg-destructive/10 hover:text-destructive"
                  disabled={!currentProject || archiving}
                  onClick={() => setArchiveConfirmOpen(true)}
                >
                  <Archive className="h-4 w-4" aria-hidden />
                  Archive board
                </Button>
              )}
              <Button
                type="button"
                variant="outline"
                className="gap-1.5 text-destructive hover:bg-destructive/10 hover:text-destructive"
                disabled={!currentProject || !canManageProjects || deleteBoardSaving}
                onClick={() => setDeleteBoardConfirmOpen(true)}
              >
                <Trash2 className="h-4 w-4" aria-hidden />
                Delete board…
              </Button>
            </div>
            <div className="flex w-full flex-wrap justify-end gap-2 sm:w-auto">
              <Button type="button" variant="outline" onClick={() => setProjectSettingsOpen(false)}>
                Cancel
              </Button>
              <Button
                type="button"
                onClick={() => void saveBoardSettings()}
                disabled={savingAccess || !currentProject || !projectDetailName.trim()}
              >
                {savingAccess ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Save changes
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={archiveConfirmOpen}
        onCancel={() => !archiving && setArchiveConfirmOpen(false)}
        onConfirm={() => void archiveCurrentBoard()}
        title="Archive this project board?"
        message={`Board “${currentProject?.name ?? ''}” (${currentProject?.key ?? ''}) will be archived. Users with manage team projects still see it in the board picker and can unarchive it from Board settings.`}
        confirmText="Archive board"
        severity="error"
        loading={archiving}
      />

      <ConfirmDialog
        open={deleteBoardConfirmOpen}
        onCancel={() => !deleteBoardSaving && setDeleteBoardConfirmOpen(false)}
        onConfirm={() => void deleteCurrentBoard()}
        title="Delete this project board?"
        message="Permanently removes the board only if it has no tasks, ceremonies, or sprints. The default organization board cannot be deleted."
        confirmText="Delete board"
        severity="error"
        loading={deleteBoardSaving}
      />

      <ScheduleMeetingDialog
        open={scheduleMeetingOpen}
        onOpenChange={setScheduleMeetingOpen}
        defaultTitle={currentProject ? `Team sync — ${currentProject.name}` : 'Team meeting'}
        defaultDetails={
          currentProject
            ? `Project board: ${currentProject.key} — ${currentProject.name}\n\nCreated from Fixer Admin → Team work.`
            : 'Created from Fixer Admin → Team work.'
        }
        defaultGuestEmails={boardMemberGuestEmails}
      />
    </div>
  )
}
