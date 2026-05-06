import React, { useMemo, useState } from 'react'
import { FlaskConical, Pencil, Plus, Trash2 } from 'lucide-react'
import { PageHeader } from '../../components/common/PageHeader'
import { MarketingWorkspaceSubnav } from '../../components/marketing-workspace/MarketingWorkspaceSubnav'
import { CampaignSelect } from '../../components/marketing-workspace/CampaignSelect'
import { useMarketingWorkspace } from '../../hooks/useMarketingWorkspace'
import { marketingWorkspaceApi } from '../../services/api/marketingWorkspace.api'
import type { BrainstormCategory, MarketingBrainstormItem } from '../../types/marketingWorkspace.types'
import { BRAINSTORM_CATEGORY_LABEL } from '../../lib/marketingWorkspaceLabels'
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

const CATS: BrainstormCategory[] = [
  'hypothesis',
  'experiment',
  'insight',
  'competitor',
  'session',
  'misc',
]

export function ResearchBrainstormPage() {
  const { bundle, loading, reload } = useMarketingWorkspace()
  const campaigns = bundle?.campaigns ?? []
  const rows = useMemo(() => bundle?.brainstorm ?? [], [bundle?.brainstorm])

  const [catFilter, setCatFilter] = useState<string>('__all__')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState({
    title: '',
    category: 'misc' as BrainstormCategory,
    body: '',
    sessionLabel: '',
    template: '',
    owner: '',
    campaignId: undefined as string | undefined,
  })

  const displayRows = useMemo(() => {
    let list = [...rows]
    if (catFilter !== '__all__') list = list.filter((b) => b.category === catFilter)
    return list.sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''))
  }, [rows, catFilter])

  const openCreate = () => {
    setEditingId(null)
    setForm({
      title: '',
      category: 'misc',
      body: '',
      sessionLabel: '',
      template: '',
      owner: '',
      campaignId: undefined,
    })
    setDialogOpen(true)
  }

  const openEdit = (row: MarketingBrainstormItem) => {
    setEditingId(row.id)
    setForm({
      title: row.title,
      category: row.category,
      body: row.body,
      sessionLabel: row.sessionLabel || '',
      template: row.template || '',
      owner: row.owner || '',
      campaignId: row.campaignId,
    })
    setDialogOpen(true)
  }

  const save = async () => {
    if (!form.title.trim() && !form.body.trim()) return
    const payload: Record<string, unknown> = {
      title: form.title.trim() || form.body.trim().slice(0, 80),
      body: form.body,
      category: form.category,
      sessionLabel: form.sessionLabel || undefined,
      template: form.template || undefined,
      owner: form.owner || undefined,
      campaignId: form.campaignId,
    }
    if (editingId) {
      await marketingWorkspaceApi.updateBrainstorm(editingId, payload)
    } else {
      await marketingWorkspaceApi.createBrainstorm(payload)
    }
    setDialogOpen(false)
    await reload()
  }

  const remove = async (id: string) => {
    await marketingWorkspaceApi.deleteBrainstorm(id)
    await reload()
  }

  return (
    <div className="container max-w-6xl py-6">
      <PageHeader
        title="R&D & brainstorm"
        subtitle="Hypotheses, experiments, session notes, and templates (SWOT, SCAMPER, etc.)."
        icon={<FlaskConical className="h-8 w-8 text-primary" />}
        action={
          <Button onClick={openCreate}>
            <Plus className="mr-1.5 h-4 w-4" />
            Add note
          </Button>
        }
      />
      <MarketingWorkspaceSubnav />

      <div className="mb-4 flex flex-wrap items-end gap-3">
        <div className="space-y-1.5">
          <Label>Category</Label>
          <Select value={catFilter} onValueChange={setCatFilter}>
            <SelectTrigger className="w-[12rem]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All</SelectItem>
              {CATS.map((c) => (
                <SelectItem key={c} value={c}>
                  {BRAINSTORM_CATEGORY_LABEL[c]}
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
                <TableHead>Title</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Session</TableHead>
                <TableHead>Note</TableHead>
                <TableHead className="w-[100px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                    Loading…
                  </TableCell>
                </TableRow>
              ) : displayRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                    No notes yet.
                  </TableCell>
                </TableRow>
              ) : (
                displayRows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="font-medium">{row.title}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{BRAINSTORM_CATEGORY_LABEL[row.category]}</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {row.sessionLabel || row.template || '—'}
                    </TableCell>
                    <TableCell className="max-w-md">
                      <p className="line-clamp-3 text-sm text-muted-foreground">{row.body || '—'}</p>
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
            <DialogTitle>{editingId ? 'Edit note' : 'New note'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <CampaignSelect
              campaigns={campaigns}
              value={form.campaignId}
              onChange={(id) => setForm((f) => ({ ...f, campaignId: id }))}
            />
            <div className="space-y-1.5">
              <Label htmlFor="b-title">Title (optional)</Label>
              <Input
                id="b-title"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Select
                value={form.category}
                onValueChange={(v) => setForm((f) => ({ ...f, category: v as BrainstormCategory }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATS.map((c) => (
                    <SelectItem key={c} value={c}>
                      {BRAINSTORM_CATEGORY_LABEL[c]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="b-session">Session label</Label>
              <Input
                id="b-session"
                value={form.sessionLabel}
                onChange={(e) => setForm((f) => ({ ...f, sessionLabel: e.target.value }))}
                placeholder="e.g. Q3 positioning retro"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="b-template">Template</Label>
              <Input
                id="b-template"
                value={form.template}
                onChange={(e) => setForm((f) => ({ ...f, template: e.target.value }))}
                placeholder="SWOT, SCAMPER, HMW…"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="b-body">Note</Label>
              <Textarea
                id="b-body"
                className="min-h-[160px]"
                value={form.body}
                onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="b-owner">Owner</Label>
              <Input
                id="b-owner"
                value={form.owner}
                onChange={(e) => setForm((f) => ({ ...f, owner: e.target.value }))}
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
