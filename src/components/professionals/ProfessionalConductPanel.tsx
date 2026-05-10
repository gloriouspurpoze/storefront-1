import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Gavel, Loader2, Plus, RefreshCw } from 'lucide-react'
import { ProfessionalConductService } from '../../services/api/professional-conduct.service'
import { ProfessionalsService } from '../../services/api/professionals.service'
import type { Professional } from '../../types/professional.types'
import type {
  ProfessionalConductRecordDto,
  ProfessionalConductActionType,
  ProfessionalConductCategory,
  ProfessionalConductSeverity,
  ProfessionalConductStatus,
} from '../../types/professional-conduct.types'
import { usePermissions } from '../../hooks/usePermissions'
import { Button } from '../ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog'
import { formatCurrency } from '../../lib/utils'

const PROFESSIONALS_PAGE_LIMIT = 100

const ACTION_LABELS: Record<ProfessionalConductActionType, string> = {
  penalty: 'Penalty',
  warning: 'Warning',
  fine: 'Fine',
  reward: 'Reward',
}

const CATEGORY_LABELS: Record<ProfessionalConductCategory, string> = {
  attendance: 'Attendance',
  quality: 'Quality',
  safety: 'Safety',
  customer_complaint: 'Customer complaint',
  policy_breach: 'Policy breach',
  incentive: 'Incentive',
  performance_bonus: 'Performance bonus',
  referral: 'Referral',
  other: 'Other',
}

const STATUS_LABELS: Record<ProfessionalConductStatus, string> = {
  active: 'Active',
  appealed: 'Appealed',
  revoked: 'Revoked',
  closed: 'Closed',
}

function professionalRowId(p: Professional): string {
  const raw = p.id ?? (p as { _id?: unknown })._id ?? p.professionalId
  if (raw == null) return ''
  return String(raw).trim()
}

function professionalDisplayName(p: Professional): string {
  const name = `${p.firstName || ''} ${p.lastName || ''}`.trim()
  return name || (p.email || '').trim() || (p.phoneNumber || '').trim() || professionalRowId(p)
}

function actionBadgeVariant(
  t: ProfessionalConductActionType,
): 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' {
  if (t === 'reward') return 'success'
  if (t === 'warning') return 'warning'
  if (t === 'penalty') return 'destructive'
  if (t === 'fine') return 'secondary'
  return 'outline'
}

function fmtDate(iso?: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleString()
}

export type ProfessionalConductPanelProps = {
  /** Scope ledger to one technician (hides directory picker). */
  professionalIdFixed?: string
}

export function ProfessionalConductPanel({ professionalIdFixed }: ProfessionalConductPanelProps) {
  const { checkPermission } = usePermissions()
  const canView = checkPermission('view_professional_conduct')
  const canManage = checkPermission('manage_professional_conduct')

  const [rows, setRows] = useState<ProfessionalConductRecordDto[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState<string | null>(null)

  const [search, setSearch] = useState('')
  const [filterProfessionalId, setFilterProfessionalId] = useState('')
  const [filterAction, setFilterAction] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')

  const [professionalOptions, setProfessionalOptions] = useState<Array<{ id: string; label: string }>>([])
  const [proLoading, setProLoading] = useState(false)

  const [createOpen, setCreateOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formProId, setFormProId] = useState('')
  const [formAction, setFormAction] = useState<ProfessionalConductActionType>('warning')
  const [formCategory, setFormCategory] = useState<ProfessionalConductCategory>('other')
  const [formSeverity, setFormSeverity] = useState<ProfessionalConductSeverity>('medium')
  const [formTitle, setFormTitle] = useState('')
  const [formDesc, setFormDesc] = useState('')
  const [formAmount, setFormAmount] = useState('')
  const [formEffective, setFormEffective] = useState(() => new Date().toISOString().slice(0, 10))
  const [formBookingId, setFormBookingId] = useState('')
  const [formRef, setFormRef] = useState('')

  const [statusOpen, setStatusOpen] = useState(false)
  const [statusRow, setStatusRow] = useState<ProfessionalConductRecordDto | null>(null)
  const [statusNext, setStatusNext] = useState<ProfessionalConductStatus>('closed')
  const [statusNotes, setStatusNotes] = useState('')
  const [statusSaving, setStatusSaving] = useState(false)

  const effectiveFilterProId = professionalIdFixed?.trim() || filterProfessionalId.trim() || undefined

  const loadProfessionals = useCallback(async () => {
    if (professionalIdFixed?.trim()) return
    setProLoading(true)
    try {
      const byId = new Map<string, Professional>()
      let page = 1
      let totalPages = 1
      const silent = { showLoading: false, showErrorToast: false } as const
      do {
        const res = await ProfessionalsService.getProfessionals(
          { limit: PROFESSIONALS_PAGE_LIMIT, page },
          silent,
        )
        if (!res.success || !res.data) break
        for (const p of res.data.professionals ?? []) {
          const id = professionalRowId(p as Professional)
          if (id) byId.set(id, p as Professional)
        }
        totalPages = Math.max(1, res.data.pagination?.totalPages ?? 1)
        page += 1
      } while (page <= totalPages && page <= 40)

      setProfessionalOptions(
        Array.from(byId.values())
          .map((p) => {
            const id = professionalRowId(p)
            if (!id) return null
            return { id, label: professionalDisplayName(p) }
          })
          .filter((x): x is { id: string; label: string } => x != null)
          .sort((a, b) => a.label.localeCompare(b.label, undefined, { sensitivity: 'base' })),
      )
    } catch {
      setProfessionalOptions([])
    } finally {
      setProLoading(false)
    }
  }, [professionalIdFixed])

  const load = useCallback(async () => {
    if (!canView) return
    setLoading(true)
    setErr(null)
    try {
      const res = await ProfessionalConductService.list({
        page: 1,
        limit: 100,
        search: search.trim() || undefined,
        professionalId: effectiveFilterProId,
        actionType: filterAction !== 'all' ? filterAction : undefined,
        status: filterStatus !== 'all' ? filterStatus : undefined,
      })
      const payload = res.success ? res.data : null
      setRows(payload?.records ?? [])
      setTotal(payload?.total ?? 0)
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Failed to load ledger')
    } finally {
      setLoading(false)
    }
  }, [canView, search, effectiveFilterProId, filterAction, filterStatus])

  useEffect(() => {
    void loadProfessionals()
  }, [loadProfessionals])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    if (professionalIdFixed?.trim()) {
      setFormProId(professionalIdFixed.trim())
      setFilterProfessionalId('')
    }
  }, [professionalIdFixed])

  function openCreate() {
    setFormProId(professionalIdFixed?.trim() || filterProfessionalId || '')
    setFormAction('warning')
    setFormCategory('other')
    setFormSeverity('medium')
    setFormTitle('')
    setFormDesc('')
    setFormAmount('')
    setFormEffective(new Date().toISOString().slice(0, 10))
    setFormBookingId('')
    setFormRef('')
    setCreateOpen(true)
  }

  async function handleCreateSave() {
    const pid = formProId.trim()
    if (!pid || !formTitle.trim()) return
    setSaving(true)
    try {
      const body: Record<string, unknown> = {
        professionalId: pid,
        actionType: formAction,
        category: formCategory,
        title: formTitle.trim(),
        effectiveDate: formEffective ? new Date(formEffective).toISOString() : new Date().toISOString(),
      }
      if (formDesc.trim()) body.description = formDesc.trim()
      if (['penalty', 'warning'].includes(formAction)) body.severity = formSeverity
      if (['fine', 'reward'].includes(formAction) && formAmount.trim()) {
        body.amountInr = Number(formAmount)
      }
      if (formBookingId.trim()) body.relatedBookingId = formBookingId.trim()
      if (formRef.trim()) body.internalReference = formRef.trim()

      await ProfessionalConductService.create(body)
      setCreateOpen(false)
      await load()
    } catch {
      /* toast */
    } finally {
      setSaving(false)
    }
  }

  function openStatus(r: ProfessionalConductRecordDto) {
    setStatusRow(r)
    setStatusNext(r.status === 'active' ? 'closed' : 'closed')
    setStatusNotes('')
    setStatusOpen(true)
  }

  async function handleStatusSave() {
    if (!statusRow) return
    setStatusSaving(true)
    try {
      const body: Record<string, unknown> = { status: statusNext }
      if (statusNext === 'revoked') body.revokeReason = statusNotes.trim()
      if (statusNext === 'appealed' || statusNext === 'closed') {
        if (statusNotes.trim()) body.appealNotes = statusNotes.trim()
      }
      await ProfessionalConductService.patch(statusRow.id, body)
      setStatusOpen(false)
      setStatusRow(null)
      await load()
    } catch {
      /* toast */
    } finally {
      setStatusSaving(false)
    }
  }

  const showAmountFields = formAction === 'fine' || formAction === 'reward'
  const showSeverity = formAction === 'penalty' || formAction === 'warning'

  const professionalLabelMap = useMemo(() => {
    const m = new Map<string, string>()
    professionalOptions.forEach((o) => m.set(o.id, o.label))
    return m
  }, [professionalOptions])

  if (!canView) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          You don&apos;t have permission to view the conduct ledger.
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Gavel className="h-5 w-5 text-primary" aria-hidden />
              Conduct &amp; incentives
            </CardTitle>
            <CardDescription>
              Formal workforce actions: penalties, warnings, monetary fines, and rewards — immutable audit trail with
              status workflow (HR / ops).
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => void load()}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
            {canManage ? (
              <Button type="button" size="sm" onClick={openCreate}>
                <Plus className="mr-2 h-4 w-4" />
                Log action
              </Button>
            ) : null}
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-1">
              <Label htmlFor="pc-search">Search</Label>
              <Input
                id="pc-search"
                placeholder="Title, notes, reference…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-[200px]"
              />
            </div>
            {!professionalIdFixed?.trim() ? (
              <div className="space-y-1">
                <Label>Professional</Label>
                <Select
                  value={filterProfessionalId || '__all'}
                  onValueChange={(v) => setFilterProfessionalId(v === '__all' ? '' : v)}
                  disabled={proLoading}
                >
                  <SelectTrigger className="w-[220px]">
                    <SelectValue placeholder={proLoading ? 'Loading…' : 'All'} />
                  </SelectTrigger>
                  <SelectContent className="max-h-[280px] overflow-y-auto">
                    <SelectItem value="__all">All professionals</SelectItem>
                    {professionalOptions.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : null}
            <div className="space-y-1">
              <Label>Action</Label>
              <Select value={filterAction} onValueChange={setFilterAction}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {(Object.keys(ACTION_LABELS) as ProfessionalConductActionType[]).map((k) => (
                    <SelectItem key={k} value={k}>
                      {ACTION_LABELS[k]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Status</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {(Object.keys(STATUS_LABELS) as ProfessionalConductStatus[]).map((k) => (
                    <SelectItem key={k} value={k}>
                      {STATUS_LABELS[k]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {err ? <p className="text-sm text-destructive">{err}</p> : null}

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Effective</TableHead>
                  {!professionalIdFixed?.trim() ? <TableHead>Professional</TableHead> : null}
                  <TableHead>Action</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[100px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={professionalIdFixed?.trim() ? 7 : 8} className="py-10 text-center">
                      <Loader2 className="inline h-5 w-5 animate-spin text-muted-foreground" />
                    </TableCell>
                  </TableRow>
                ) : rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={professionalIdFixed?.trim() ? 7 : 8} className="py-10 text-center text-muted-foreground">
                      No records yet. Log a warning, penalty, fine, or reward to build an audit-grade history.
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                        {fmtDate(r.effectiveDate)}
                      </TableCell>
                      {!professionalIdFixed?.trim() ? (
                        <TableCell className="max-w-[180px] truncate text-sm">
                          {r.professionalName?.trim() ||
                            professionalLabelMap.get(r.professionalId) ||
                            r.professionalEmail ||
                            r.professionalId}
                        </TableCell>
                      ) : null}
                      <TableCell>
                        <Badge variant={actionBadgeVariant(r.actionType)}>{ACTION_LABELS[r.actionType]}</Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs text-muted-foreground">{CATEGORY_LABELS[r.category]}</span>
                      </TableCell>
                      <TableCell className="max-w-[240px]">
                        <div className="font-medium">{r.title}</div>
                        {r.internalReference ? (
                          <div className="font-mono text-[11px] text-muted-foreground">{r.internalReference}</div>
                        ) : null}
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        {r.amountInr != null && r.amountInr > 0 ? formatCurrency(Number(r.amountInr)) : '—'}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{STATUS_LABELS[r.status]}</Badge>
                      </TableCell>
                      <TableCell>
                        {canManage && r.status === 'active' ? (
                          <Button variant="ghost" size="sm" type="button" onClick={() => openStatus(r)}>
                            Update status
                          </Button>
                        ) : null}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          {!loading && total > rows.length ? (
            <p className="text-xs text-muted-foreground">Showing {rows.length} of {total} (raise limit in a follow-up).</p>
          ) : null}
        </CardContent>
      </Card>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Log conduct action</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            {!professionalIdFixed?.trim() ? (
              <div className="space-y-1">
                <Label>Professional</Label>
                <Select
                  value={formProId.trim() ? formProId : '__none'}
                  onValueChange={(v) => setFormProId(v === '__none' ? '' : v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select professional" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[280px] overflow-y-auto">
                    <SelectItem value="__none">Select professional…</SelectItem>
                    {professionalOptions.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Or paste a 24-character MongoDB id in directory filters on the operations page.
                </p>
              </div>
            ) : null}
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label>Action type</Label>
                <Select value={formAction} onValueChange={(v) => setFormAction(v as ProfessionalConductActionType)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(ACTION_LABELS) as ProfessionalConductActionType[]).map((k) => (
                      <SelectItem key={k} value={k}>
                        {ACTION_LABELS[k]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Category</Label>
                <Select value={formCategory} onValueChange={(v) => setFormCategory(v as ProfessionalConductCategory)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(CATEGORY_LABELS) as ProfessionalConductCategory[]).map((k) => (
                      <SelectItem key={k} value={k}>
                        {CATEGORY_LABELS[k]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {showSeverity ? (
              <div className="space-y-1">
                <Label>Severity</Label>
                <Select value={formSeverity} onValueChange={(v) => setFormSeverity(v as ProfessionalConductSeverity)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            ) : null}
            <div className="space-y-1">
              <Label>Title</Label>
              <Input value={formTitle} onChange={(e) => setFormTitle(e.target.value)} placeholder="Short summary" />
            </div>
            <div className="space-y-1">
              <Label>Description</Label>
              <Textarea value={formDesc} onChange={(e) => setFormDesc(e.target.value)} rows={3} placeholder="Facts, policy clause, agreement with technician…" />
            </div>
            {showAmountFields ? (
              <div className="space-y-1">
                <Label>Amount (INR)</Label>
                <Input
                  type="number"
                  min={0}
                  step={1}
                  value={formAmount}
                  onChange={(e) => setFormAmount(e.target.value)}
                  placeholder="Optional — payroll / wallet handled separately"
                />
              </div>
            ) : null}
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label>Effective date</Label>
                <Input type="date" value={formEffective} onChange={(e) => setFormEffective(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>Booking ID (optional)</Label>
                <Input
                  value={formBookingId}
                  onChange={(e) => setFormBookingId(e.target.value.trim())}
                  placeholder="Link to job"
                  className="font-mono text-xs"
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Internal reference</Label>
              <Input value={formRef} onChange={(e) => setFormRef(e.target.value)} placeholder="Ticket / HR case #" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" type="button" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              disabled={saving || !formProId.trim() || !formTitle.trim()}
              onClick={() => void handleCreateSave()}
            >
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Save record
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={statusOpen} onOpenChange={setStatusOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Update record status</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            {statusRow ? (
              <p className="text-sm text-muted-foreground">
                {ACTION_LABELS[statusRow.actionType]} — {statusRow.title}
              </p>
            ) : null}
            <div className="space-y-1">
              <Label>New status</Label>
              <Select value={statusNext} onValueChange={(v) => setStatusNext(v as ProfessionalConductStatus)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="closed">Closed (resolved / acknowledged)</SelectItem>
                  <SelectItem value="appealed">Appealed</SelectItem>
                  <SelectItem value="revoked">Revoked (void)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>
                {statusNext === 'revoked' ? 'Revocation reason' : 'Notes (resolution / appeal details)'}
              </Label>
              <Textarea value={statusNotes} onChange={(e) => setStatusNotes(e.target.value)} rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" type="button" onClick={() => setStatusOpen(false)}>
              Cancel
            </Button>
            <Button type="button" disabled={statusSaving} onClick={() => void handleStatusSave()}>
              {statusSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
