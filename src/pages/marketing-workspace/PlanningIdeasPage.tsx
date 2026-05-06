import React, { useMemo, useState } from 'react'
import { ChevronDown, ChevronUp, Lightbulb, Pencil, Plus, Trash2 } from 'lucide-react'
import { PageHeader } from '../../components/common/PageHeader'
import { MarketingWorkspaceSubnav } from '../../components/marketing-workspace/MarketingWorkspaceSubnav'
import { CampaignSelect } from '../../components/marketing-workspace/CampaignSelect'
import { useMarketingWorkspace } from '../../hooks/useMarketingWorkspace'
import { marketingWorkspaceApi } from '../../services/api/marketingWorkspace.api'
import type {
  IdeaStage,
  MarketingIdea,
  MarketingIdeaEffort,
  MarketingIdeaGoal,
  MarketingTaskPriority,
} from '../../types/marketingWorkspace.types'
import {
  IDEA_EFFORT_LABEL,
  IDEA_GOAL_LABEL,
  IDEA_STAGE_LABEL,
  TASK_PRIORITY_LABEL,
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

const STAGES: IdeaStage[] = [
  'new',
  'under_review',
  'approved',
  'in_development',
  'completed',
  'rejected',
]
const GOALS: MarketingIdeaGoal[] = ['awareness', 'conversion', 'retention', 'other']
const EFFORT: MarketingIdeaEffort[] = ['xs', 's', 'm', 'l', 'xl']
const PRIOS: MarketingTaskPriority[] = ['low', 'medium', 'high']

export function PlanningIdeasPage() {
  const { bundle, loading, reload } = useMarketingWorkspace()
  const campaigns = bundle?.campaigns ?? []
  const rows = useMemo(() => bundle?.ideas ?? [], [bundle?.ideas])

  const [stageFilter, setStageFilter] = useState<string>('__all__')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState({
    title: '',
    description: '',
    goal: 'other' as MarketingIdeaGoal,
    audience: '',
    urgency: 'medium' as MarketingTaskPriority,
    effort: 'm' as MarketingIdeaEffort,
    stage: 'new' as IdeaStage,
    riceReach: '' as string,
    riceImpact: '' as string,
    riceConfidence: '' as string,
    riceEffort: '' as string,
    tagsInput: '',
    owner: '',
    notes: '',
    campaignId: undefined as string | undefined,
  })

  const displayRows = useMemo(() => {
    let list = [...rows]
    if (stageFilter !== '__all__') list = list.filter((i) => i.stage === stageFilter)
    return list.sort((a, b) => {
      const si = STAGES.indexOf(a.stage) - STAGES.indexOf(b.stage)
      if (si !== 0) return si
      return (b.votesUp - a.votesUp) || (b.updatedAt || '').localeCompare(a.updatedAt || '')
    })
  }, [rows, stageFilter])

  const openCreate = () => {
    setEditingId(null)
    setForm({
      title: '',
      description: '',
      goal: 'other',
      audience: '',
      urgency: 'medium',
      effort: 'm',
      stage: 'new',
      riceReach: '',
      riceImpact: '',
      riceConfidence: '',
      riceEffort: '',
      tagsInput: '',
      owner: '',
      notes: '',
      campaignId: undefined,
    })
    setDialogOpen(true)
  }

  const openEdit = (row: MarketingIdea) => {
    setEditingId(row.id)
    setForm({
      title: row.title,
      description: row.description || '',
      goal: row.goal,
      audience: row.audience || '',
      urgency: row.urgency,
      effort: row.effort,
      stage: row.stage,
      riceReach: row.riceReach != null ? String(row.riceReach) : '',
      riceImpact: row.riceImpact != null ? String(row.riceImpact) : '',
      riceConfidence: row.riceConfidence != null ? String(row.riceConfidence) : '',
      riceEffort: row.riceEffort != null ? String(row.riceEffort) : '',
      tagsInput: (row.tags || []).join(', '),
      owner: row.owner || '',
      notes: row.notes || '',
      campaignId: row.campaignId,
    })
    setDialogOpen(true)
  }

  const save = async () => {
    if (!form.title.trim()) return
    const tags = form.tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean)
    const payload: Record<string, unknown> = {
      title: form.title.trim(),
      description: form.description || undefined,
      goal: form.goal,
      audience: form.audience || undefined,
      urgency: form.urgency,
      effort: form.effort,
      stage: form.stage,
      riceReach: form.riceReach === '' ? undefined : Number(form.riceReach),
      riceImpact: form.riceImpact === '' ? undefined : Number(form.riceImpact),
      riceConfidence: form.riceConfidence === '' ? undefined : Number(form.riceConfidence),
      riceEffort: form.riceEffort === '' ? undefined : Number(form.riceEffort),
      tags,
      owner: form.owner || undefined,
      notes: form.notes || undefined,
      campaignId: form.campaignId,
    }
    if (editingId) {
      await marketingWorkspaceApi.updateIdea(editingId, payload)
    } else {
      await marketingWorkspaceApi.createIdea(payload)
    }
    setDialogOpen(false)
    await reload()
  }

  const remove = async (id: string) => {
    await marketingWorkspaceApi.deleteIdea(id)
    await reload()
  }

  const vote = async (id: string, direction: 'up' | 'down') => {
    await marketingWorkspaceApi.voteIdea(id, direction)
    await reload()
  }

  return (
    <div className="container max-w-6xl py-6">
      <PageHeader
        title="Planning & ideas"
        subtitle="Intake with goals, T-shirt effort, RICE fields, and team votes."
        icon={<Lightbulb className="h-8 w-8 text-primary" />}
        action={
          <Button onClick={openCreate}>
            <Plus className="mr-1.5 h-4 w-4" />
            Add idea
          </Button>
        }
      />
      <MarketingWorkspaceSubnav />

      <div className="mb-4 flex flex-wrap items-end gap-3">
        <div className="space-y-1.5">
          <Label>Stage</Label>
          <Select value={stageFilter} onValueChange={setStageFilter}>
            <SelectTrigger className="w-[12rem]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All stages</SelectItem>
              {STAGES.map((st) => (
                <SelectItem key={st} value={st}>
                  {IDEA_STAGE_LABEL[st]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Idea</TableHead>
                <TableHead>Goal</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Stage</TableHead>
                <TableHead>Votes</TableHead>
                <TableHead className="w-[140px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                    Loading…
                  </TableCell>
                </TableRow>
              ) : displayRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                    No ideas yet.
                  </TableCell>
                </TableRow>
              ) : (
                displayRows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>
                      <div className="font-medium">{row.title}</div>
                      {row.description ? (
                        <div className="line-clamp-1 text-xs text-muted-foreground">{row.description}</div>
                      ) : null}
                    </TableCell>
                    <TableCell>{IDEA_GOAL_LABEL[row.goal]}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{TASK_PRIORITY_LABEL[row.urgency]}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{IDEA_STAGE_LABEL[row.stage]}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => void vote(row.id, 'up')}
                          aria-label="Upvote"
                        >
                          <ChevronUp className="h-4 w-4" />
                        </Button>
                        <span className="text-sm tabular-nums">{row.votesUp}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => void vote(row.id, 'down')}
                          aria-label="Downvote"
                        >
                          <ChevronDown className="h-4 w-4" />
                        </Button>
                        <span className="text-xs text-muted-foreground">{row.votesDown}</span>
                      </div>
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
            <DialogTitle>{editingId ? 'Edit idea' : 'New idea'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <CampaignSelect
              campaigns={campaigns}
              value={form.campaignId}
              onChange={(id) => setForm((f) => ({ ...f, campaignId: id }))}
            />
            <div className="space-y-1.5">
              <Label htmlFor="i-title">Title</Label>
              <Input
                id="i-title"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="i-desc">Description</Label>
              <Textarea
                id="i-desc"
                className="min-h-[72px]"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Goal</Label>
                <Select
                  value={form.goal}
                  onValueChange={(v) => setForm((f) => ({ ...f, goal: v as MarketingIdeaGoal }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {GOALS.map((g) => (
                      <SelectItem key={g} value={g}>
                        {IDEA_GOAL_LABEL[g]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Urgency</Label>
                <Select
                  value={form.urgency}
                  onValueChange={(v) => setForm((f) => ({ ...f, urgency: v as MarketingTaskPriority }))}
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
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Effort (T-shirt)</Label>
                <Select
                  value={form.effort}
                  onValueChange={(v) => setForm((f) => ({ ...f, effort: v as MarketingIdeaEffort }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EFFORT.map((e) => (
                      <SelectItem key={e} value={e}>
                        {IDEA_EFFORT_LABEL[e]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Stage</Label>
                <Select
                  value={form.stage}
                  onValueChange={(v) => setForm((f) => ({ ...f, stage: v as IdeaStage }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STAGES.map((st) => (
                      <SelectItem key={st} value={st}>
                        {IDEA_STAGE_LABEL[st]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5">
                <Label htmlFor="r-r">RICE reach</Label>
                <Input
                  id="r-r"
                  type="number"
                  value={form.riceReach}
                  onChange={(e) => setForm((f) => ({ ...f, riceReach: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="r-i">RICE impact</Label>
                <Input
                  id="r-i"
                  type="number"
                  value={form.riceImpact}
                  onChange={(e) => setForm((f) => ({ ...f, riceImpact: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="r-c">RICE confidence %</Label>
                <Input
                  id="r-c"
                  type="number"
                  min={0}
                  max={100}
                  value={form.riceConfidence}
                  onChange={(e) => setForm((f) => ({ ...f, riceConfidence: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="r-e">RICE effort</Label>
                <Input
                  id="r-e"
                  type="number"
                  value={form.riceEffort}
                  onChange={(e) => setForm((f) => ({ ...f, riceEffort: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="i-aud">Audience</Label>
              <Input
                id="i-aud"
                value={form.audience}
                onChange={(e) => setForm((f) => ({ ...f, audience: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="i-tags">Tags (comma)</Label>
              <Input
                id="i-tags"
                value={form.tagsInput}
                onChange={(e) => setForm((f) => ({ ...f, tagsInput: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="i-owner">Owner</Label>
              <Input
                id="i-owner"
                value={form.owner}
                onChange={(e) => setForm((f) => ({ ...f, owner: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="i-notes">Notes</Label>
              <Textarea
                id="i-notes"
                className="min-h-[80px]"
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
