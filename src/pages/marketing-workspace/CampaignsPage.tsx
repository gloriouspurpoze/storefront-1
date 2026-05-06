import React, { useState } from 'react'
import { Pencil, Plus, Target, Trash2 } from 'lucide-react'
import { PageHeader } from '../../components/common/PageHeader'
import { MarketingWorkspaceSubnav } from '../../components/marketing-workspace/MarketingWorkspaceSubnav'
import { useMarketingWorkspace } from '../../hooks/useMarketingWorkspace'
import { marketingWorkspaceApi } from '../../services/api/marketingWorkspace.api'
import type { MarketingCampaign, MarketingCampaignStatus } from '../../types/marketingWorkspace.types'
import { CAMPAIGN_STATUS_LABEL } from '../../lib/marketingWorkspaceLabels'
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

const STATUSES: MarketingCampaignStatus[] = ['planning', 'active', 'paused', 'completed']

function emptyForm(): Partial<MarketingCampaign> {
  return {
    name: '',
    description: '',
    status: 'planning',
    startDate: '',
    endDate: '',
    budgetCents: undefined,
    kpiNotes: '',
    tags: [],
  }
}

export function CampaignsPage() {
  const { bundle, loading, reload } = useMarketingWorkspace()
  const campaigns = bundle?.campaigns ?? []

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<Partial<MarketingCampaign>>(emptyForm)
  const [tagsInput, setTagsInput] = useState('')

  const openCreate = () => {
    setEditingId(null)
    setForm(emptyForm())
    setTagsInput('')
    setDialogOpen(true)
  }

  const openEdit = (row: MarketingCampaign) => {
    setEditingId(row.id)
    setForm({
      name: row.name,
      description: row.description,
      status: row.status,
      startDate: row.startDate?.slice(0, 10),
      endDate: row.endDate?.slice(0, 10),
      budgetCents: row.budgetCents,
      kpiNotes: row.kpiNotes,
      tags: row.tags,
    })
    setTagsInput((row.tags || []).join(', '))
    setDialogOpen(true)
  }

  const save = async () => {
    const name = String(form.name || '').trim()
    if (!name) return
    const tags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean)
    const payload: Record<string, unknown> = {
      name,
      description: form.description || undefined,
      status: form.status || 'planning',
      startDate: form.startDate || undefined,
      endDate: form.endDate || undefined,
      budgetCents: form.budgetCents != null && form.budgetCents !== ('' as unknown as number) ? Number(form.budgetCents) : undefined,
      kpiNotes: form.kpiNotes || undefined,
      tags,
    }
    if (editingId) {
      await marketingWorkspaceApi.updateCampaign(editingId, payload)
    } else {
      await marketingWorkspaceApi.createCampaign(payload)
    }
    setDialogOpen(false)
    await reload()
  }

  const remove = async (id: string) => {
    await marketingWorkspaceApi.deleteCampaign(id)
    await reload()
  }

  return (
    <div className="container max-w-6xl py-6">
      <PageHeader
        title="Campaigns"
        subtitle="One parent object for launches: tie calendar, social, ideas, and tasks to the same program."
        icon={<Target className="h-8 w-8 text-primary" />}
        action={
          <Button onClick={openCreate}>
            <Plus className="mr-1.5 h-4 w-4" />
            New campaign
          </Button>
        }
      />
      <MarketingWorkspaceSubnav />

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Window</TableHead>
                <TableHead className="w-[100px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4} className="py-10 text-center text-muted-foreground">
                    Loading…
                  </TableCell>
                </TableRow>
              ) : campaigns.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="py-10 text-center text-muted-foreground">
                    No campaigns yet. Create one before attaching calendar rows and posts.
                  </TableCell>
                </TableRow>
              ) : (
                campaigns.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>
                      <div className="font-medium">{row.name}</div>
                      {row.kpiNotes ? (
                        <div className="line-clamp-1 text-xs text-muted-foreground">{row.kpiNotes}</div>
                      ) : null}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{CAMPAIGN_STATUS_LABEL[row.status]}</Badge>
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                      {row.startDate?.slice(0, 10) || '—'} → {row.endDate?.slice(0, 10) || '—'}
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
            <DialogTitle>{editingId ? 'Edit campaign' : 'New campaign'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="c-name">Name</Label>
              <Input
                id="c-name"
                value={form.name || ''}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select
                value={form.status || 'planning'}
                onValueChange={(v) => setForm((f) => ({ ...f, status: v as MarketingCampaignStatus }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUSES.map((st) => (
                    <SelectItem key={st} value={st}>
                      {CAMPAIGN_STATUS_LABEL[st]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="c-desc">Description</Label>
              <Textarea
                id="c-desc"
                className="min-h-[72px]"
                value={form.description || ''}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="c-start">Start</Label>
                <Input
                  id="c-start"
                  type="date"
                  value={form.startDate?.slice(0, 10) || ''}
                  onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="c-end">End</Label>
                <Input
                  id="c-end"
                  type="date"
                  value={form.endDate?.slice(0, 10) || ''}
                  onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="c-budget">Budget (cents)</Label>
              <Input
                id="c-budget"
                type="number"
                min={0}
                value={form.budgetCents ?? ''}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    budgetCents: e.target.value === '' ? undefined : Number(e.target.value),
                  }))
                }
                placeholder="e.g. 5000000 for ₹50,000 — optional"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="c-kpi">KPI notes</Label>
              <Textarea
                id="c-kpi"
                className="min-h-[60px]"
                value={form.kpiNotes || ''}
                onChange={(e) => setForm((f) => ({ ...f, kpiNotes: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="c-tags">Tags (comma-separated)</Label>
              <Input
                id="c-tags"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="Q3, linkedin, b2b"
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
