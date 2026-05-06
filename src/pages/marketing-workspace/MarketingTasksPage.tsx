import React, { useEffect, useMemo, useState } from 'react'
import { CheckCircle2, Circle, ListTodo, Pencil, Plus, Trash2 } from 'lucide-react'
import { PageHeader } from '../../components/common/PageHeader'
import { MarketingWorkspaceSubnav } from '../../components/marketing-workspace/MarketingWorkspaceSubnav'
import { CampaignSelect } from '../../components/marketing-workspace/CampaignSelect'
import { useMarketingWorkspace } from '../../hooks/useMarketingWorkspace'
import { marketingWorkspaceApi } from '../../services/api/marketingWorkspace.api'
import type {
  MarketingTask,
  MarketingTaskColumn,
  MarketingTaskPriority,
  MarketingTaskTemplate,
  MarketingTaskType,
} from '../../types/marketingWorkspace.types'
import { TASK_COLUMN_LABEL, TASK_PRIORITY_LABEL, TASK_TYPE_LABEL } from '../../lib/marketingWorkspaceLabels'
import { Button } from '../../components/ui/button'
import { Card, CardContent } from '../../components/ui/card'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { Textarea } from '../../components/ui/textarea'
import { Badge } from '../../components/ui/badge'
import { Checkbox } from '../../components/ui/checkbox'
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

const COLUMNS: MarketingTaskColumn[] = ['todo', 'in_progress', 'in_review', 'done']
const TYPES: MarketingTaskType[] = [
  'writing',
  'design',
  'review',
  'approval',
  'publishing',
  'reporting',
  'other',
]
const PRIOS: MarketingTaskPriority[] = ['low', 'medium', 'high']

export function MarketingTasksPage() {
  const { bundle, loading, reload } = useMarketingWorkspace()
  const campaigns = bundle?.campaigns ?? []
  const allTasks = bundle?.tasks ?? []
  const [templates, setTemplates] = useState<MarketingTaskTemplate[]>([])

  useEffect(() => {
    let cancelled = false
    void marketingWorkspaceApi.listTaskTemplates().then((t) => {
      if (!cancelled) setTemplates(t)
    })
    return () => {
      cancelled = true
    }
  }, [])

  const [columnTab, setColumnTab] = useState<string>('__all__')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState({
    title: '',
    dueDate: '',
    priority: 'medium' as MarketingTaskPriority,
    column: 'todo' as MarketingTaskColumn,
    taskType: 'other' as MarketingTaskType,
    assigneesInput: '',
    timeEstimateMinutes: '',
    timeLoggedMinutes: '',
    notes: '',
    owner: '',
    done: false,
    campaignId: undefined as string | undefined,
    templateId: '__none__' as string,
    dependsOnTaskId: '__none__' as string,
  })

  const rows = useMemo(() => {
    let list = [...allTasks]
    if (columnTab !== '__all__') {
      list = list.filter((t) => t.column === columnTab)
    }
    return list.sort((a, b) => {
      if (a.done !== b.done) return a.done ? 1 : -1
      const da = a.dueDate || '9999'
      const db = b.dueDate || '9999'
      return da.localeCompare(db)
    })
  }, [allTasks, columnTab])

  const toggleDone = async (row: MarketingTask) => {
    const nextDone = !row.done
    await marketingWorkspaceApi.updateTask(row.id, {
      done: nextDone,
      column: nextDone ? 'done' : row.column === 'done' ? 'todo' : row.column,
    })
    await reload()
  }

  const openCreate = () => {
    setEditingId(null)
    setForm({
      title: '',
      dueDate: '',
      priority: 'medium',
      column: columnTab !== '__all__' ? (columnTab as MarketingTaskColumn) : 'todo',
      taskType: 'other',
      assigneesInput: '',
      timeEstimateMinutes: '',
      timeLoggedMinutes: '',
      notes: '',
      owner: '',
      done: false,
      campaignId: undefined,
      templateId: '__none__',
      dependsOnTaskId: '__none__',
    })
    setDialogOpen(true)
  }

  const openEdit = (row: MarketingTask) => {
    setEditingId(row.id)
    setForm({
      title: row.title,
      dueDate: row.dueDate?.slice(0, 10) ?? '',
      priority: row.priority,
      column: row.column,
      taskType: row.taskType,
      assigneesInput: (row.assigneeUserIds || []).join(', '),
      timeEstimateMinutes: row.timeEstimateMinutes != null ? String(row.timeEstimateMinutes) : '',
      timeLoggedMinutes: row.timeLoggedMinutes != null ? String(row.timeLoggedMinutes) : '',
      notes: row.notes || '',
      owner: row.owner || '',
      done: row.done,
      campaignId: row.campaignId,
      templateId: '__none__',
      dependsOnTaskId: row.dependsOnTaskId || '__none__',
    })
    setDialogOpen(true)
  }

  const save = async () => {
    if (!editingId && form.templateId !== '__none__') {
      await marketingWorkspaceApi.createTaskFromTemplate({
        templateId: form.templateId,
        titleSuffix: form.title.trim() || undefined,
        dueDate: form.dueDate || undefined,
        priority: form.priority,
        campaignId: form.campaignId,
        notes: form.notes || undefined,
        owner: form.owner || undefined,
        dependsOnTaskId: form.dependsOnTaskId !== '__none__' ? form.dependsOnTaskId : undefined,
      })
      setDialogOpen(false)
      await reload()
      return
    }

    if (!form.title.trim()) return
    const assigneeUserIds = form.assigneesInput
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
    const payload: Record<string, unknown> = {
      title: form.title.trim(),
      dueDate: form.dueDate || undefined,
      priority: form.priority,
      column: form.done ? 'done' : form.column,
      taskType: form.taskType,
      assigneeUserIds,
      timeEstimateMinutes: form.timeEstimateMinutes === '' ? undefined : Number(form.timeEstimateMinutes),
      timeLoggedMinutes: form.timeLoggedMinutes === '' ? undefined : Number(form.timeLoggedMinutes),
      notes: form.notes || undefined,
      owner: form.owner || undefined,
      done: form.done,
      campaignId: form.campaignId,
      dependsOnTaskId: form.dependsOnTaskId !== '__none__' ? form.dependsOnTaskId : undefined,
    }
    if (editingId) {
      await marketingWorkspaceApi.updateTask(editingId, payload)
    } else {
      await marketingWorkspaceApi.createTask(payload)
    }
    setDialogOpen(false)
    await reload()
  }

  const remove = async (id: string) => {
    await marketingWorkspaceApi.deleteTask(id)
    await reload()
  }

  return (
    <div className="container max-w-6xl py-6">
      <PageHeader
        title="Marketing tasks"
        subtitle="Kanban columns and task types for execution — separate from generic team-work boards."
        icon={<ListTodo className="h-8 w-8 text-primary" />}
        action={
          <Button onClick={openCreate}>
            <Plus className="mr-1.5 h-4 w-4" />
            Add task
          </Button>
        }
      />
      <MarketingWorkspaceSubnav />

      <Tabs value={columnTab} onValueChange={setColumnTab} className="mb-4">
        <TabsList className="flex flex-wrap h-auto gap-1">
          <TabsTrigger value="__all__">All</TabsTrigger>
          {COLUMNS.map((c) => (
            <TabsTrigger key={c} value={c}>
              {TASK_COLUMN_LABEL[c]}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[52px]" />
                <TableHead>Task</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Column</TableHead>
                <TableHead>Due</TableHead>
                <TableHead>Depends on</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead className="w-[100px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="py-10 text-center text-muted-foreground">
                    Loading…
                  </TableCell>
                </TableRow>
              ) : rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="py-10 text-center text-muted-foreground">
                    No tasks in this view.
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((row) => (
                  <TableRow key={row.id} className={row.done ? 'opacity-60' : undefined}>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => void toggleDone(row)}
                        aria-label={row.done ? 'Mark incomplete' : 'Mark complete'}
                      >
                        {row.done ? (
                          <CheckCircle2 className="h-4 w-4 text-primary" />
                        ) : (
                          <Circle className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                    </TableCell>
                    <TableCell>
                      <div className={row.done ? 'line-through' : 'font-medium'}>{row.title}</div>
                      {row.notes ? (
                        <div className="line-clamp-1 text-xs text-muted-foreground">{row.notes}</div>
                      ) : null}
                    </TableCell>
                    <TableCell className="text-sm">{TASK_TYPE_LABEL[row.taskType]}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{TASK_COLUMN_LABEL[row.column]}</Badge>
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-sm">{row.dueDate?.slice(0, 10) || '—'}</TableCell>
                    <TableCell className="max-w-[140px] truncate text-xs text-muted-foreground">
                      {row.dependsOnTaskId
                        ? allTasks.find((t) => t.id === row.dependsOnTaskId)?.title || row.dependsOnTaskId
                        : '—'}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{TASK_PRIORITY_LABEL[row.priority]}</Badge>
                    </TableCell>
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
            <DialogTitle>{editingId ? 'Edit task' : 'New task'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <CampaignSelect
              campaigns={campaigns}
              value={form.campaignId}
              onChange={(id) => setForm((f) => ({ ...f, campaignId: id }))}
            />
            {!editingId && templates.length > 0 ? (
              <div className="space-y-1.5">
                <Label>Playbook template</Label>
                <Select
                  value={form.templateId}
                  onValueChange={(v) => setForm((f) => ({ ...f, templateId: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Blank task" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Blank task</SelectItem>
                    {templates.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.name} ({t.subtaskCount} subtasks)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Templates pre-fill the checklist. Optional title suffix customizes the task name.
                </p>
              </div>
            ) : null}
            <div className="space-y-1.5">
              <Label htmlFor="t-title">{form.templateId !== '__none__' && !editingId ? 'Title suffix (optional)' : 'Title'}</Label>
              <Input
                id="t-title"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Blocked by (dependency)</Label>
              <Select
                value={form.dependsOnTaskId}
                onValueChange={(v) => setForm((f) => ({ ...f, dependsOnTaskId: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="None" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">None</SelectItem>
                  {allTasks
                    .filter((t) => t.id !== editingId)
                    .map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.title}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Column</Label>
                <Select
                  value={form.column}
                  onValueChange={(v) => setForm((f) => ({ ...f, column: v as MarketingTaskColumn }))}
                  disabled={form.done}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {COLUMNS.map((c) => (
                      <SelectItem key={c} value={c}>
                        {TASK_COLUMN_LABEL[c]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Type</Label>
                <Select
                  value={form.taskType}
                  onValueChange={(v) => setForm((f) => ({ ...f, taskType: v as MarketingTaskType }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TYPES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {TASK_TYPE_LABEL[t]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="t-due">Due date</Label>
                <Input
                  id="t-due"
                  type="date"
                  value={form.dueDate}
                  onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Priority</Label>
                <Select
                  value={form.priority}
                  onValueChange={(v) => setForm((f) => ({ ...f, priority: v as MarketingTaskPriority }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PRIOS.map((p) => (
                      <SelectItem key={p} value={p}>
                        {TASK_PRIORITY_LABEL[p]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="t-done"
                checked={form.done}
                onCheckedChange={(c) => setForm((f) => ({ ...f, done: c === true }))}
              />
              <Label htmlFor="t-done" className="cursor-pointer font-normal">
                Completed
              </Label>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="t-assign">Assignee user IDs (comma)</Label>
              <Input
                id="t-assign"
                value={form.assigneesInput}
                onChange={(e) => setForm((f) => ({ ...f, assigneesInput: e.target.value }))}
                placeholder="Mongo user ids — wire picker later"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="t-est">Est. minutes</Label>
                <Input
                  id="t-est"
                  type="number"
                  min={0}
                  value={form.timeEstimateMinutes}
                  onChange={(e) => setForm((f) => ({ ...f, timeEstimateMinutes: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="t-log">Logged minutes</Label>
                <Input
                  id="t-log"
                  type="number"
                  min={0}
                  value={form.timeLoggedMinutes}
                  onChange={(e) => setForm((f) => ({ ...f, timeLoggedMinutes: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="t-owner">Owner label</Label>
              <Input
                id="t-owner"
                value={form.owner}
                onChange={(e) => setForm((f) => ({ ...f, owner: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="t-notes">Notes</Label>
              <Textarea
                id="t-notes"
                className="min-h-[72px]"
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
