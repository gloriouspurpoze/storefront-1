import React, { useMemo, useState } from 'react'
import { format } from 'date-fns'
import { Flag, PlayCircle, Plus, StopCircle } from 'lucide-react'
import type { TeamWorkItem, TeamWorkSprint } from '../../types/teamWork.types'
import {
  getActiveSprint,
  spillAssignmentsForSprintClose,
} from '../../lib/teamWorkSprintLocal'
import { buildSprintWindow } from '../../lib/teamWorkSprintLocal'
import { teamWorkApi } from '../../services/api/teamWork.api'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { Card, CardContent } from '../ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog'
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
type Props = {
  projectId: string | null
  /** Items already merged with sprint assignments (for counts / spillover). */
  items: TeamWorkItem[]
  canManage: boolean
  onSprintsUpdated: (rows: TeamWorkSprint[]) => void
  /** Current sprint definitions (controlled by parent). */
  sprints: TeamWorkSprint[]
  /** Called after close sprint with new assignment map. */
  onAssignmentsAfterClose: (assignments: Record<string, string>) => void
  /** Current assignment map (parent state). */
  sprintAssignments: Record<string, string>
}

const DURATION_PRESETS = [
  { label: '1 week', days: 7 },
  { label: '2 weeks', days: 14 },
  { label: '3 weeks', days: 21 },
  { label: '4 weeks', days: 28 },
] as const

export function TeamWorkSprintPanel({
  projectId,
  items,
  canManage,
  onSprintsUpdated,
  sprints,
  onAssignmentsAfterClose,
  sprintAssignments,
}: Props) {
  const [createOpen, setCreateOpen] = useState(false)
  const [closeOpen, setCloseOpen] = useState(false)
  const [closingSprintId, setClosingSprintId] = useState<string | null>(null)

  const [newName, setNewName] = useState('')
  const [newGoal, setNewGoal] = useState('')
  const [newStart, setNewStart] = useState(() => format(new Date(), 'yyyy-MM-dd'))
  const [newDuration, setNewDuration] = useState<string>('14')

  const [spillTarget, setSpillTarget] = useState<string>('__backlog__')

  const active = useMemo(() => getActiveSprint(sprints), [sprints])
  const planned = useMemo(() => sprints.filter((s) => s.state === 'planned'), [sprints])
  const completed = useMemo(() => sprints.filter((s) => s.state === 'completed').slice(-5).reverse(), [sprints])

  const refresh = async () => {
    if (!projectId) return
    const rows = await teamWorkApi.listSprints(projectId)
    onSprintsUpdated(rows)
  }

  const openCloseDialog = (sprintId: string) => {
    setClosingSprintId(sprintId)
    const plannedPick = planned.find((s) => s.id !== sprintId)?.id
    setSpillTarget(plannedPick ?? '__backlog__')
    setCloseOpen(true)
  }

  const incompleteCountForClosing = useMemo(() => {
    if (!closingSprintId) return 0
    return items.filter((it) => it.sprintId === closingSprintId && it.status !== 'done' && it.status !== 'cancelled')
      .length
  }, [items, closingSprintId])

  const handleCreate = async () => {
    if (!projectId || !newName.trim()) return
    const duration = Number(newDuration) || 14
    const start = new Date(`${newStart}T12:00:00`)
    const { startIso, endIso } = buildSprintWindow(start, duration)
    await teamWorkApi.createSprint(projectId, {
      name: newName.trim(),
      goal: newGoal.trim() || undefined,
      startAt: startIso,
      endAt: endIso,
      durationDays: duration,
    })
    await refresh()
    setCreateOpen(false)
    setNewName('')
    setNewGoal('')
    setNewStart(format(new Date(), 'yyyy-MM-dd'))
    setNewDuration('14')
  }

  const handleStart = async (id: string) => {
    try {
      await teamWorkApi.patchSprint(id, { state: 'active' })
      await refresh()
    } catch (e) {
      window.alert(e instanceof Error ? e.message : 'Cannot start sprint')
    }
  }

  const handleConfirmClose = async () => {
    if (!projectId || !closingSprintId) return
    await teamWorkApi.patchSprint(closingSprintId, { state: 'completed' })
    await refresh()

    const target =
      spillTarget === '__backlog__'
        ? ({ mode: 'backlog' } as const)
        : ({ mode: 'sprint', sprintId: spillTarget } as const)

    const nextAsg = spillAssignmentsForSprintClose(items, closingSprintId, target, sprintAssignments)
    onAssignmentsAfterClose(nextAsg)

    setCloseOpen(false)
    setClosingSprintId(null)
  }

  if (!projectId) return null

  return (
    <>
      <Card className="border-border/80 border-dashed bg-muted/10">
        <CardContent className="flex flex-col gap-4 py-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex items-start gap-2">
              <Flag className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden />
              <div>
                <p className="text-sm font-semibold">Sprints</p>
                <p className="mt-0.5 max-w-xl text-xs text-muted-foreground">
                  Plan fixed-length iterations (Scrum-style). Sprint definitions and state live on the server.
                </p>
              </div>
            </div>
            {canManage ? (
              <Button type="button" size="sm" className="gap-1.5" onClick={() => setCreateOpen(true)}>
                <Plus className="h-4 w-4" />
                New sprint
              </Button>
            ) : null}
          </div>

          {active ? (
            <div className="rounded-lg border border-primary/30 bg-primary/5 px-3 py-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-primary">Active sprint</p>
                  <p className="text-base font-semibold">{active.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(active.startAt), 'MMM d')} — {format(new Date(active.endAt), 'MMM d, yyyy')}
                  </p>
                  {active.goal ? <p className="mt-1 text-sm text-muted-foreground">{active.goal}</p> : null}
                </div>
                {canManage ? (
                  <Button type="button" size="sm" variant="outline" className="gap-1.5" onClick={() => openCloseDialog(active.id)}>
                    <StopCircle className="h-4 w-4" />
                    Complete sprint
                  </Button>
                ) : null}
              </div>
              <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-muted-foreground">
                <span>
                  Issues in this sprint:{' '}
                  <strong className="text-foreground">{items.filter((i) => i.sprintId === active.id).length}</strong>
                </span>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No active sprint — start a planned one or create a new sprint.</p>
          )}

          {planned.length > 0 ? (
            <div className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Planned</p>
              <div className="flex flex-col gap-2">
                {planned.map((s) => (
                  <div
                    key={s.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border/70 bg-card px-3 py-2"
                  >
                    <div>
                      <p className="text-sm font-medium">{s.name}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {format(new Date(s.startAt), 'MMM d')} — {format(new Date(s.endAt), 'MMM d')} · {s.durationDays}d
                      </p>
                    </div>
                    {canManage ? (
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        className="gap-1"
                        disabled={Boolean(active)}
                        onClick={() => handleStart(s.id)}
                        title={active ? 'Complete the active sprint first' : 'Start this sprint'}
                      >
                        <PlayCircle className="h-4 w-4" />
                        Start
                      </Button>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {completed.length > 0 ? (
            <div className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Recently completed</p>
              <div className="flex flex-wrap gap-2">
                {completed.map((s) => (
                  <Badge key={s.id} variant="outline" className="font-normal">
                    {s.name}
                    {s.completedAt ? ` · ${format(new Date(s.completedAt), 'MMM d')}` : ''}
                  </Badge>
                ))}
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create sprint</DialogTitle>
            <DialogDescription>
              Choose duration and start date. Then drag issues into the sprint using the board filter and issue drawer.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-2">
              <Label htmlFor="sp-name">Sprint name</Label>
              <Input id="sp-name" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="e.g. Sprint 24 — Checkout" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sp-goal">Goal (optional)</Label>
              <Textarea id="sp-goal" rows={2} value={newGoal} onChange={(e) => setNewGoal(e.target.value)} placeholder="What outcome defines success?" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="sp-start">Start date</Label>
                <Input id="sp-start" type="date" value={newStart} onChange={(e) => setNewStart(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Duration</Label>
                <Select value={newDuration} onValueChange={setNewDuration}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DURATION_PRESETS.map((p) => (
                      <SelectItem key={p.days} value={String(p.days)}>
                        {p.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button type="button" disabled={!newName.trim()} onClick={handleCreate}>
              Create planned sprint
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={closeOpen} onOpenChange={setCloseOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Complete sprint</DialogTitle>
            <DialogDescription>
              Incomplete work (everything except Done / Cancelled) will move to the target you choose — classic spillover.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-sm">
              Open issues still in this sprint:{' '}
              <strong>{incompleteCountForClosing}</strong>
            </p>
            <div className="space-y-2">
              <Label>Move incomplete work to</Label>
              <Select value={spillTarget} onValueChange={setSpillTarget}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__backlog__">Product backlog (no sprint)</SelectItem>
                  {planned
                    .filter((s) => s.id !== closingSprintId)
                    .map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        Planned: {s.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setCloseOpen(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={handleConfirmClose}>
              Complete & spill over
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
