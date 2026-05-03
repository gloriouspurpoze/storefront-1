import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
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
  UserCircle2,
} from 'lucide-react'
import { PageHeader } from '../../components/common/PageHeader'
import { TeamWorkBoard } from '../../components/team-work/TeamWorkBoard'
import { TeamWorkItemDrawer } from '../../components/team-work/TeamWorkItemDrawer'
import { ScheduleMeetingDialog } from '../../components/team-work/ScheduleMeetingDialog'
import { teamWorkApi } from '../../services/api/teamWork.api'
import { usersService } from '../../services/api/users.service'
import type { TeamWorkItem, TeamWorkMeta, TeamWorkProject, TeamWorkStatus } from '../../types/teamWork.types'
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
import { teamWorkTagDisplayName } from '../../lib/teamWorkTags'
import { cn } from '../../lib/utils'

const STATUS_LABELS: Record<TeamWorkStatus, string> = {
  backlog: 'Backlog',
  todo: 'To do',
  in_progress: 'In progress',
  in_review: 'In review',
  blocked: 'Blocked',
  done: 'Done',
  cancelled: 'Cancelled',
}

function userLabel(u: { firstName?: string; lastName?: string; email?: string; id: string }): string {
  const n = `${u.firstName || ''} ${u.lastName || ''}`.trim()
  return n || u.email || u.id
}

export function TeamWorkHub() {
  const { checkPermission } = usePermissions()
  const authUser = useAppSelector((s) => s.auth.user)
  const canManage = checkPermission('manage_team_tasks')
  const canManageProjects = checkPermission('manage_team_projects')

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

  const [newTitle, setNewTitle] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [newPriority, setNewPriority] = useState<TeamWorkItem['priority']>('medium')
  const [newType, setNewType] = useState<TeamWorkItem['issueType']>('task')
  const [newAssigneeId, setNewAssigneeId] = useState<string>('__none__')
  const [creating, setCreating] = useState(false)

  const [projectSettingsOpen, setProjectSettingsOpen] = useState(false)
  const [newProjectOpen, setNewProjectOpen] = useState(false)
  const [newProjectName, setNewProjectName] = useState('')
  const [newProjectKey, setNewProjectKey] = useState('')
  const [accessMemberIds, setAccessMemberIds] = useState<string[]>([])
  const [savingAccess, setSavingAccess] = useState(false)
  const [savingNewProject, setSavingNewProject] = useState(false)
  const [scheduleMeetingOpen, setScheduleMeetingOpen] = useState(false)

  const currentProject = useMemo(
    () => projects.find((p) => p.id === projectId) ?? null,
    [projects, projectId],
  )

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
        setItems(list.items)
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
        const list = await teamWorkApi.listProjects()
        if (cancelled) return
        setProjects(list)
        const saved = typeof window !== 'undefined' ? window.localStorage.getItem(projectStorageKey) : null
        const pick = saved && list.some((p) => p.id === saved) ? saved : list[0]?.id ?? null
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
  }, [projectStorageKey])

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
    if (!currentProject?.memberUserIds?.length) return [] as string[]
    const allowed = new Set(currentProject.memberUserIds)
    return adminUsers
      .filter((u) => allowed.has(u.id) && u.email)
      .map((u) => u.email)
  }, [currentProject, adminUsers])

  const stats = useMemo(() => {
    const openStatuses = new Set(['backlog', 'todo', 'in_progress', 'in_review', 'blocked'])
    let open = 0
    let done = 0
    let blocked = 0
    for (const it of items) {
      if (it.status === 'blocked') blocked += 1
      if (it.status === 'done') done += 1
      if (openStatuses.has(it.status)) open += 1
    }
    return { open, done, blocked, total: items.length }
  }, [items])

  const onMoveItem = async (itemId: string, newStatus: TeamWorkStatus) => {
    if (!canManage) return
    await teamWorkApi.patchStatus(itemId, newStatus)
    await load()
  }

  const createItem = async () => {
    if (!newTitle.trim()) return
    setCreating(true)
    try {
      await teamWorkApi.createItem({
        projectId: projectId!,
        title: newTitle.trim(),
        description: newDesc.trim() || undefined,
        priority: newPriority,
        issueType: newType,
        status: 'backlog',
        assigneeUserId: newAssigneeId !== '__none__' ? newAssigneeId : undefined,
      })
      setCreateOpen(false)
      setNewTitle('')
      setNewDesc('')
      setNewAssigneeId('__none__')
      await load()
    } finally {
      setCreating(false)
    }
  }

  const onChangeProject = (id: string) => {
    setDrawerId(null)
    setTagFilters([])
    setProjectId(id)
    window.localStorage.setItem(projectStorageKey, id)
    setLoadError(null)
  }

  const refreshProjects = useCallback(async () => {
    const list = await teamWorkApi.listProjects()
    setProjects(list)
  }, [])

  const saveBoardAccess = async () => {
    if (!currentProject) return
    setSavingAccess(true)
    try {
      const updated = await teamWorkApi.patchProject(currentProject.id, { memberUserIds: accessMemberIds })
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
    }
  }, [projectSettingsOpen, currentProject])

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      <PageHeader
        title="Team work"
        subtitle="Each project is its own board. Restrict a board by adding members (Board access); leave members empty for a tenant-wide board. Super admins and users with manage_team_projects see every board and can create new ones."
        action={
          <Button variant="outline" size="sm" asChild>
            <Link to="/team-work/calendar">Team calendar</Link>
          </Button>
        }
      />

      <Card className="border-border/80">
        <CardContent className="flex flex-col gap-3 py-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-center">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <FolderKanban className="h-4 w-4 shrink-0" aria-hidden />
              Project board
            </div>
            <Select
              value={projectId ?? ''}
              onValueChange={onChangeProject}
              disabled={!projects.length}
            >
              <SelectTrigger className="w-full min-w-[220px] sm:max-w-md">
                <SelectValue placeholder="Select a board" />
              </SelectTrigger>
              <SelectContent>
                {projects.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    <span className="font-mono text-xs text-muted-foreground">{p.key}</span>{' '}
                    <span className="ml-1">{p.name}</span>
                    {p.memberUserIds.length > 0 ? (
                      <span className="ml-2 text-xs text-muted-foreground">(restricted)</span>
                    ) : (
                      <span className="ml-2 text-xs text-muted-foreground">(org-wide)</span>
                    )}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-wrap gap-2">
            {canManageProjects ? (
              <>
                <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={() => setNewProjectOpen(true)}>
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
                  Board access
                </Button>
              </>
            ) : null}
          </div>
        </CardContent>
      </Card>

      {loadError ? (
        <Card className="border-destructive/40 bg-destructive/5">
          <CardContent className="py-4 text-sm text-destructive">{loadError}</CardContent>
        </Card>
      ) : null}

      {projectsLoaded && !projects.length && !loadError ? (
        <Card className="border-border/80">
          <CardContent className="flex flex-col gap-3 py-8 text-center">
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
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: 'Active pipeline', value: stats.open, hint: 'Backlog through review' },
            { label: 'Blocked', value: stats.blocked, hint: 'Needs attention' },
            { label: 'Done (loaded)', value: stats.done, hint: 'In current page' },
            { label: 'Total (server)', value: total, hint: 'Matches filters' },
          ].map((s) => (
            <Card key={s.label} className="border-border/80 bg-gradient-to-br from-card to-muted/30">
              <CardContent className="pt-4">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{s.label}</p>
                <p className="mt-1 text-3xl font-semibold tabular-nums">{loading ? '—' : s.value}</p>
                <p className="mt-1 text-xs text-muted-foreground">{s.hint}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : null}

      {projectId ? (
      <Card className="border-border/80">
        <CardContent className="flex flex-col gap-4 py-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
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
                <UserCircle2 className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Assignee</span>
                <Select value={assigneeFilter} onValueChange={setAssigneeFilter} disabled={mineOnly}>
                  <SelectTrigger className="h-8 w-[160px] border-0 bg-transparent shadow-none">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">Everyone</SelectItem>
                    {adminUsers.map((u) => (
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
                  New issue
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
              items={items}
              canManage={canManage}
              assigneeMap={assigneeMap}
              onMoveItem={onMoveItem}
              onOpenItem={(id) => setDrawerId(id)}
            />
          ) : (
            <div className="overflow-x-auto rounded-lg border border-border/70">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead className="border-b bg-muted/40 text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2 font-medium">Key</th>
                    <th className="px-3 py-2 font-medium">Title</th>
                    <th className="px-3 py-2 font-medium">Status</th>
                    <th className="px-3 py-2 font-medium">Priority</th>
                    <th className="px-3 py-2 font-medium">Type</th>
                    <th className="px-3 py-2 font-medium">Assignee</th>
                    <th className="px-3 py-2 font-medium" />
                  </tr>
                </thead>
                <tbody>
                  {items.map((it) => (
                    <tr key={it.id} className="border-b border-border/50 hover:bg-muted/20">
                      <td className="px-3 py-2 font-mono text-xs font-semibold text-primary">{it.issueKey}</td>
                      <td className="max-w-[280px] px-3 py-2">
                        <span className="line-clamp-2 font-medium">{it.title}</span>
                      </td>
                      <td className="px-3 py-2 capitalize text-muted-foreground">{it.status.replace(/_/g, ' ')}</td>
                      <td className="px-3 py-2">
                        <span
                          className={cn(
                            'inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize',
                            PRIORITY_CHIP[it.priority],
                          )}
                        >
                          {priorityLabel(it.priority)}
                        </span>
                      </td>
                      <td className="px-3 py-2 capitalize">{it.issueType}</td>
                      <td className="px-3 py-2">
                        {it.assigneeUserId ? (
                          <div className="flex items-center gap-2">
                            <span
                              className={cn(
                                'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ring-2 ring-background',
                                assigneeSwatchClass(it.assigneeUserId),
                              )}
                            >
                              {initialsFromLabel(assigneeMap.get(it.assigneeUserId) || it.assigneeUserId)}
                            </span>
                            <span className="max-w-[140px] truncate text-xs text-foreground/90">
                              {assigneeMap.get(it.assigneeUserId) || it.assigneeUserId}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs italic text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-right">
                        <Button type="button" size="sm" variant="ghost" className="h-8" onClick={() => setDrawerId(it.id)}>
                          View
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {items.length === 0 ? (
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
          )}
        </CardContent>
      </Card>
      ) : null}

      <TeamWorkItemDrawer
        open={Boolean(drawerId)}
        itemId={drawerId}
        projectId={projectId}
        meta={meta}
        onClose={() => setDrawerId(null)}
        canManage={canManage}
        onUpdated={() => void load()}
        onDeleted={() => void load()}
        epics={epics.filter((e) => e.id !== drawerId)}
        adminUsers={adminUsers}
        assigneeMap={assigneeMap}
        currentUserId={authUser?.id}
        projectTagCatalog={currentProject?.tagCatalog ?? []}
        onProjectTagCatalogChanged={() => void refreshProjects()}
      />

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create issue</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-2">
              <Label htmlFor="nw-t">Title</Label>
              <Input id="nw-t" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="Short, actionable summary" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nw-d">Description</Label>
              <Textarea id="nw-d" rows={4} value={newDesc} onChange={(e) => setNewDesc(e.target.value)} placeholder="Context, acceptance criteria, links…" />
            </div>
            <div className="grid grid-cols-2 gap-3">
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
            </div>
            <div className="space-y-2">
              <Label>Assignee (optional)</Label>
              <Select value={newAssigneeId} onValueChange={setNewAssigneeId}>
                <SelectTrigger>
                  <SelectValue placeholder="Unassigned" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Unassigned</SelectItem>
                  {adminUsers.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {userLabel(u)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
        <DialogContent className="max-h-[85vh] max-w-lg overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Board access</DialogTitle>
            <DialogDescription>
              <span className="font-medium text-foreground">{currentProject?.name}</span> —{' '}
              {currentProject && currentProject.memberUserIds.length === 0 ? (
                <>Anyone in your organization with team-work access can use this board.</>
              ) : (
                <>Only listed people (plus admins who manage team projects) can open this board.</>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden py-2">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs text-muted-foreground">Select members from your dashboard directory.</p>
              <Button type="button" variant="ghost" size="sm" className="h-8 shrink-0" onClick={() => setAccessMemberIds([])}>
                Clear all (org-wide)
              </Button>
            </div>
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
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setProjectSettingsOpen(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={() => void saveBoardAccess()} disabled={savingAccess || !currentProject}>
              {savingAccess ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Save access
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
