import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ClipboardList,
  KanbanSquare,
  LayoutList,
  Loader2,
  Mail,
  Plus,
  Search,
  UserCircle2,
} from 'lucide-react'
import { PageHeader } from '../../components/common/PageHeader'
import { TeamWorkBoard } from '../../components/team-work/TeamWorkBoard'
import { TeamWorkItemDrawer } from '../../components/team-work/TeamWorkItemDrawer'
import { teamWorkApi } from '../../services/api/teamWork.api'
import { usersService } from '../../services/api/users.service'
import type { TeamWorkItem, TeamWorkMeta, TeamWorkStatus } from '../../types/teamWork.types'
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
import { assigneeSwatchClass, initialsFromLabel, PRIORITY_CHIP, priorityLabel } from '../../lib/teamWorkVisuals'
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
  const [createOpen, setCreateOpen] = useState(false)
  const [drawerId, setDrawerId] = useState<string | null>(null)

  const [newTitle, setNewTitle] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [newPriority, setNewPriority] = useState<TeamWorkItem['priority']>('medium')
  const [newType, setNewType] = useState<TeamWorkItem['issueType']>('task')
  const [newAssigneeId, setNewAssigneeId] = useState<string>('__none__')
  const [creating, setCreating] = useState(false)

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
      setLoadError(null)
      const qEff = (override?.q !== undefined ? override.q : searchApplied).trim() || undefined
      try {
        const [m, list, epicList, admins] = await Promise.all([
          teamWorkApi.getMeta(),
          teamWorkApi.listItems({
            limit: '100',
            q: qEff,
            assigneeUserId:
              mineOnly && authUser?.id
                ? authUser.id
                : assigneeFilter !== '__all__'
                  ? assigneeFilter
                  : undefined,
          }),
          teamWorkApi.listItems({ issueType: 'epic', limit: '80' }),
          usersService.getUsers({ user_type: 'admin', limit: 100, page: 1 }),
        ])
        setMeta(m)
        setItems(list.items)
        setTotal(list.total)
        setEpics(epicList.items.filter((e) => e.issueType === 'epic'))
        setAdminUsers(admins.users)
      } catch {
        setLoadError('Could not load team work. Confirm the backend is running and you have team-work permissions.')
      }
    },
    [searchApplied, assigneeFilter, mineOnly, authUser?.id],
  )

  useEffect(() => {
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
  }, [load])

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

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      <PageHeader
        title="Team work"
        subtitle="Plan and track internal issues on the board or list. Open an issue → Details → Assignee to route work to someone; they get an email when SMTP is configured on the API server (see FIXER_ADMIN_ORIGIN in backend .env.example)."
      />

      {loadError ? (
        <Card className="border-destructive/40 bg-destructive/5">
          <CardContent className="py-4 text-sm text-destructive">{loadError}</CardContent>
        </Card>
      ) : null}

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
                <Button type="button" className="gap-1.5 shadow-sm" onClick={() => setCreateOpen(true)}>
                  <Plus className="h-4 w-4" />
                  New issue
                </Button>
              ) : null}
            </div>
          </div>

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

      <TeamWorkItemDrawer
        open={Boolean(drawerId)}
        itemId={drawerId}
        meta={meta}
        onClose={() => setDrawerId(null)}
        canManage={canManage}
        onUpdated={() => void load()}
        onDeleted={() => void load()}
        epics={epics.filter((e) => e.id !== drawerId)}
        adminUsers={adminUsers}
        assigneeMap={assigneeMap}
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
            <Button type="button" onClick={() => void createItem()} disabled={creating || !newTitle.trim()}>
              {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
