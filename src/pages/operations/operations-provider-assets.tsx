import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Boxes, Loader2, Pencil, Plus, Archive, CheckCircle2, XCircle } from 'lucide-react'
import { ProviderAssetsService } from '../../services/api/provider-assets.service'
import { ProfessionalsService } from '../../services/api/professionals.service'
import type { Professional } from '../../types/professional.types'
import type {
  ProviderAssetDto,
  ProviderAssetCategory,
  ProviderAssetStatus,
  ProviderAssetRequestDto,
} from '../../types/provider-assets.types'
import { usePermissions } from '../../hooks/usePermissions'
import { Button } from '../../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { Badge } from '../../components/ui/badge'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { Textarea } from '../../components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog'
import { PageHeader } from '../../components/common'
import { Checkbox } from '../../components/ui/checkbox'

const CATEGORY_LABELS: Record<ProviderAssetCategory, string> = {
  tool: 'Tool',
  vehicle: 'Vehicle / van',
  kit: 'Job kit / bag',
  spare_part: 'Spare part',
  ppe: 'PPE / safety',
  consumable: 'Consumable',
  device: 'Device / meter',
  other: 'Other',
}

const STATUS_LABELS: Record<ProviderAssetStatus, string> = {
  active: 'Active',
  maintenance: 'Maintenance',
  retired: 'Retired',
  lost: 'Lost / missing',
}

function professionalRowId(p: Professional): string {
  const raw = p.id ?? (p as { _id?: unknown })._id ?? p.professionalId
  if (raw == null) return ''
  if (typeof raw === 'object' && raw !== null && '$oid' in raw) {
    return String((raw as { $oid?: string }).$oid ?? '').trim()
  }
  return String(raw).trim()
}

/** Mongo ObjectId hex — backend GET /professionals rejects limit > 100; keep in sync with validatePagination. */
const PROFESSIONALS_PAGE_LIMIT = 100

function isValidMongoObjectId(s: string): boolean {
  return /^[a-fA-F0-9]{24}$/.test(s.trim())
}

function professionalDisplayName(p: Professional): string {
  const name = `${p.firstName || ''} ${p.lastName || ''}`.trim()
  return name || (p.email || '').trim() || (p.phoneNumber || '').trim() || professionalRowId(p)
}

function fmtDate(iso?: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString()
}

export function OperationsProviderAssetsPage() {
  const { checkPermission } = usePermissions()
  const canManage = checkPermission('manage_provider_assets')

  const [rows, setRows] = useState<ProviderAssetDto[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState<string | null>(null)

  const [search, setSearch] = useState('')
  const [professionalFilter, setProfessionalFilter] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [includeArchived, setIncludeArchived] = useState(false)

  const [professionalOptions, setProfessionalOptions] = useState<Array<{ id: string; label: string }>>([])
  const [professionalsLoading, setProfessionalsLoading] = useState(false)
  const [professionalsLoadError, setProfessionalsLoadError] = useState<string | null>(null)

  const [pendingRequests, setPendingRequests] = useState<ProviderAssetRequestDto[]>([])
  const [requestsLoading, setRequestsLoading] = useState(true)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<ProviderAssetDto | null>(null)
  const [saving, setSaving] = useState(false)

  const [formProfessionalId, setFormProfessionalId] = useState('')
  const [formTag, setFormTag] = useState('')
  const [formName, setFormName] = useState('')
  const [formCategory, setFormCategory] = useState<ProviderAssetCategory>('tool')
  const [formStatus, setFormStatus] = useState<ProviderAssetStatus>('active')
  const [formQty, setFormQty] = useState('1')
  const [formSerial, setFormSerial] = useState('')
  const [formProductId, setFormProductId] = useState('')
  const [formServiceId, setFormServiceId] = useState('')
  const [formPurchase, setFormPurchase] = useState('')
  const [formWarranty, setFormWarranty] = useState('')
  const [formLocation, setFormLocation] = useState('')
  const [formNotes, setFormNotes] = useState('')

  const [approveOpen, setApproveOpen] = useState(false)
  const [approveReq, setApproveReq] = useState<ProviderAssetRequestDto | null>(null)
  const [approveTag, setApproveTag] = useState('')
  const [approveName, setApproveName] = useState('')
  const [approveCategory, setApproveCategory] = useState<ProviderAssetCategory>('other')
  const [approveQty, setApproveQty] = useState('1')
  const [approveStatus, setApproveStatus] = useState<ProviderAssetStatus>('active')
  const [approveReviewNotes, setApproveReviewNotes] = useState('')
  const [approveSaving, setApproveSaving] = useState(false)

  const [rejectOpen, setRejectOpen] = useState(false)
  const [rejectReq, setRejectReq] = useState<ProviderAssetRequestDto | null>(null)
  const [rejectNotes, setRejectNotes] = useState('')
  const [rejectSaving, setRejectSaving] = useState(false)

  const professionalLabelMap = useMemo(() => {
    const m = new Map<string, string>()
    professionalOptions.forEach((p) => m.set(p.id, p.label))
    return m
  }, [professionalOptions])

  const professionalSelectedFromList = useMemo(
    () => professionalOptions.some((o) => o.id === formProfessionalId.trim()),
    [professionalOptions, formProfessionalId],
  )

  const professionalIdOkForCreate = useMemo(() => {
    const s = formProfessionalId.trim()
    if (!s) return false
    return professionalSelectedFromList || isValidMongoObjectId(s)
  }, [formProfessionalId, professionalSelectedFromList])

  const loadProfessionals = useCallback(async () => {
    setProfessionalsLoading(true)
    setProfessionalsLoadError(null)
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
        if (!res.success || !res.data) {
          throw new Error(res.message?.trim() || 'Could not load professionals')
        }
        const batch = (res.data.professionals ?? []) as Professional[]
        for (const p of batch) {
          const id = professionalRowId(p)
          if (id) byId.set(id, p)
        }
        totalPages = Math.max(1, res.data.pagination?.totalPages ?? 1)
        page += 1
      } while (page <= totalPages && page <= 40)

      const opts = Array.from(byId.values())
        .map((p) => {
          const id = professionalRowId(p)
          if (!id) return null
          return { id, label: professionalDisplayName(p) }
        })
        .filter((x): x is { id: string; label: string } => x != null)
        .sort((a, b) => a.label.localeCompare(b.label, undefined, { sensitivity: 'base' }))

      setProfessionalOptions(opts)
      if (opts.length === 0) {
        setProfessionalsLoadError(
          'No professionals found in this environment. Paste a technician’s MongoDB _id below to register an asset.',
        )
      }
    } catch (e: unknown) {
      setProfessionalOptions([])
      const msg =
        e && typeof e === 'object' && 'message' in e && typeof (e as { message: unknown }).message === 'string'
          ? (e as { message: string }).message
          : 'Could not load professionals (check permissions or API).'
      setProfessionalsLoadError(msg)
    } finally {
      setProfessionalsLoading(false)
    }
  }, [])

  const loadRequests = useCallback(async () => {
    setRequestsLoading(true)
    try {
      const res = await ProviderAssetsService.listRequests({ status: 'pending', limit: 100, page: 1 })
      const payload = res.success ? res.data : null
      setPendingRequests(payload?.requests ?? [])
    } catch {
      setPendingRequests([])
    } finally {
      setRequestsLoading(false)
    }
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    setErr(null)
    try {
      const res = await ProviderAssetsService.list({
        page: 1,
        limit: 100,
        search: search.trim() || undefined,
        professionalId: professionalFilter.trim() || undefined,
        category: categoryFilter !== 'all' ? categoryFilter : undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        includeArchived,
      })
      const payload = res.success ? res.data : null
      setRows(payload?.assets ?? [])
      setTotal(payload?.total ?? 0)
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Failed to load assets')
    } finally {
      setLoading(false)
    }
  }, [search, professionalFilter, categoryFilter, statusFilter, includeArchived])

  useEffect(() => {
    void loadProfessionals()
  }, [loadProfessionals])

  useEffect(() => {
    void loadRequests()
  }, [loadRequests])

  useEffect(() => {
    void load()
  }, [load])

  function openCreate() {
    setEditing(null)
    setFormProfessionalId(professionalFilter || '')
    setFormTag('')
    setFormName('')
    setFormCategory('tool')
    setFormStatus('active')
    setFormQty('1')
    setFormSerial('')
    setFormProductId('')
    setFormServiceId('')
    setFormPurchase('')
    setFormWarranty('')
    setFormLocation('')
    setFormNotes('')
    setDialogOpen(true)
  }

  function openEdit(row: ProviderAssetDto) {
    setEditing(row)
    setFormProfessionalId(row.professionalId)
    setFormTag(row.assetTag)
    setFormName(row.name)
    setFormCategory(row.category)
    setFormStatus(row.status)
    setFormQty(String(row.quantity ?? 1))
    setFormSerial(row.serialNumber || '')
    setFormProductId(row.linkedProductId || '')
    setFormServiceId(row.linkedPlatformServiceId || '')
    setFormPurchase(row.purchaseDate ? String(row.purchaseDate).slice(0, 10) : '')
    setFormWarranty(row.warrantyExpiresAt ? String(row.warrantyExpiresAt).slice(0, 10) : '')
    setFormLocation(row.locationNotes || '')
    setFormNotes(row.notes || '')
    setDialogOpen(true)
  }

  function openApprove(r: ProviderAssetRequestDto) {
    setApproveReq(r)
    setApproveTag((r.suggestedAssetTag || '').trim())
    setApproveName(r.name)
    setApproveCategory(r.category)
    setApproveQty(String(r.quantity ?? 1))
    setApproveStatus('active')
    setApproveReviewNotes('')
    setApproveOpen(true)
  }

  function openReject(r: ProviderAssetRequestDto) {
    setRejectReq(r)
    setRejectNotes('')
    setRejectOpen(true)
  }

  async function handleSave() {
    setSaving(true)
    try {
      const body: Record<string, unknown> = {
        assetTag: formTag.trim(),
        name: formName.trim(),
        category: formCategory,
        status: formStatus,
        quantity: Number(formQty) || 0,
        serialNumber: formSerial.trim() || undefined,
        linkedProductId: formProductId.trim() || undefined,
        linkedPlatformServiceId: formServiceId.trim() || undefined,
        purchaseDate: formPurchase.trim() || undefined,
        warrantyExpiresAt: formWarranty.trim() || undefined,
        locationNotes: formLocation.trim() || undefined,
        notes: formNotes.trim() || undefined,
      }
      if (!editing) {
        body.professionalId = formProfessionalId.trim()
      }
      if (editing) {
        await ProviderAssetsService.patch(editing.id, body)
      } else {
        await ProviderAssetsService.create(body)
      }
      setDialogOpen(false)
      await load()
    } catch {
      /* toast via api client */
    } finally {
      setSaving(false)
    }
  }

  async function handleArchive(row: ProviderAssetDto) {
    if (!window.confirm(`Archive asset ${row.assetTag}?`)) return
    try {
      await ProviderAssetsService.archive(row.id)
      await load()
    } catch {
      /* toast */
    }
  }

  async function handleApproveSave() {
    if (!approveReq || !approveTag.trim()) return
    setApproveSaving(true)
    try {
      await ProviderAssetsService.approveRequest(approveReq.id, {
        assetTag: approveTag.trim(),
        name: approveName.trim(),
        category: approveCategory,
        quantity: Number(approveQty) || 1,
        status: approveStatus,
        reviewNotes: approveReviewNotes.trim() || undefined,
      })
      setApproveOpen(false)
      setApproveReq(null)
      await Promise.all([load(), loadRequests()])
    } catch {
      /* toast */
    } finally {
      setApproveSaving(false)
    }
  }

  async function handleRejectSave() {
    if (!rejectReq) return
    setRejectSaving(true)
    try {
      await ProviderAssetsService.rejectRequest(rejectReq.id, {
        reviewNotes: rejectNotes.trim(),
      })
      setRejectOpen(false)
      setRejectReq(null)
      await loadRequests()
    } catch {
      /* toast */
    } finally {
      setRejectSaving(false)
    }
  }

  function requestProfessionalLabel(r: ProviderAssetRequestDto): string {
    if (r.professionalName?.trim()) return r.professionalName.trim()
    if (r.professionalEmail?.trim()) return r.professionalEmail.trim()
    return professionalLabelMap.get(r.professionalId) || r.professionalId
  }

  return (
    <div className="flex flex-col gap-6 pb-10">
      <PageHeader
        title="Professional assets"
        subtitle="Registry tied to each technician (professional) account — tools, vans, spare stock, PPE. Technicians can request additions from the pro app; ops reviews and approves here to register the asset and set status."
        icon={<Boxes className="h-7 w-7 text-primary sm:h-8 sm:w-8" />}
      />

      {canManage ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Pending technician requests</CardTitle>
            <CardDescription>
              Approve after verifying purchase, serials, or insurance. Assign a unique asset tag before approving.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {requestsLoading ? (
              <div className="flex justify-center py-8 text-muted-foreground">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : pendingRequests.length === 0 ? (
              <p className="text-sm text-muted-foreground">No pending requests.</p>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Requested</TableHead>
                      <TableHead>Professional</TableHead>
                      <TableHead>Item</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead className="text-right">Qty</TableHead>
                      <TableHead>Suggested tag</TableHead>
                      <TableHead className="w-[140px]" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingRequests.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell className="text-xs text-muted-foreground">{fmtDate(r.createdAt)}</TableCell>
                        <TableCell className="max-w-[200px]">
                          <div className="truncate font-medium">{requestProfessionalLabel(r)}</div>
                          {r.professionalEmail ? (
                            <div className="truncate text-xs text-muted-foreground">{r.professionalEmail}</div>
                          ) : null}
                        </TableCell>
                        <TableCell>{r.name}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">{CATEGORY_LABELS[r.category]}</Badge>
                        </TableCell>
                        <TableCell className="text-right">{r.quantity}</TableCell>
                        <TableCell className="font-mono text-xs">{r.suggestedAssetTag || '—'}</TableCell>
                        <TableCell>
                          <div className="flex justify-end gap-1">
                            <Button variant="outline" size="sm" type="button" onClick={() => openApprove(r)}>
                              <CheckCircle2 className="mr-1 h-4 w-4" />
                              Approve
                            </Button>
                            <Button variant="ghost" size="sm" type="button" onClick={() => openReject(r)}>
                              <XCircle className="mr-1 h-4 w-4" />
                              Reject
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle className="text-lg">Fleet & toolkit registry</CardTitle>
            <CardDescription>
              Asset tags must be unique per professional. Rows can originate from admin registration or an approved
              technician request.
            </CardDescription>
          </div>
          {canManage ? (
            <Button size="sm" onClick={openCreate}>
              <Plus className="mr-2 h-4 w-4" />
              Register asset
            </Button>
          ) : null}
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-1">
              <Label htmlFor="pa-search">Search</Label>
              <Input
                id="pa-search"
                placeholder="Name, tag, serial…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-[220px]"
              />
            </div>
            <div className="space-y-1">
              <Label>Professional</Label>
              <Select
                value={professionalFilter || '__all'}
                onValueChange={(v) => setProfessionalFilter(v === '__all' ? '' : v)}
              >
                <SelectTrigger className="w-[240px]">
                  <SelectValue placeholder={professionalsLoading ? 'Loading…' : 'All professionals'} />
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
              {professionalsLoadError ? (
                <p className="max-w-[280px] text-xs text-bloom-coral dark:text-bloom-coral">{professionalsLoadError}</p>
              ) : null}
            </div>
            <div className="space-y-1">
              <Label>Category</Label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {(Object.keys(CATEGORY_LABELS) as ProviderAssetCategory[]).map((k) => (
                    <SelectItem key={k} value={k}>
                      {CATEGORY_LABELS[k]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {(Object.keys(STATUS_LABELS) as ProviderAssetStatus[]).map((k) => (
                    <SelectItem key={k} value={k}>
                      {STATUS_LABELS[k]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2 pb-2">
              <Checkbox
                id="pa-arch"
                checked={includeArchived}
                onCheckedChange={(c) => setIncludeArchived(c === true)}
              />
              <Label htmlFor="pa-arch" className="font-normal">
                Show archived
              </Label>
            </div>
          </div>

          {err ? <p className="text-sm text-destructive">{err}</p> : null}

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tag</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Professional</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead>Warranty</TableHead>
                  <TableHead className="w-[100px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="py-10 text-center text-muted-foreground">
                      <Loader2 className="inline h-5 w-5 animate-spin" />
                    </TableCell>
                  </TableRow>
                ) : rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="py-10 text-center text-muted-foreground">
                      No assets yet. Register equipment per technician or approve requests above.
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((r) => (
                    <TableRow key={r.id} className={r.archivedAt ? 'opacity-60' : ''}>
                      <TableCell className="font-mono text-xs">{r.assetTag}</TableCell>
                      <TableCell>{r.name}</TableCell>
                      <TableCell className="max-w-[200px] truncate text-sm text-muted-foreground">
                        {professionalLabelMap.get(r.professionalId) || r.professionalId}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{CATEGORY_LABELS[r.category]}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{STATUS_LABELS[r.status]}</Badge>
                      </TableCell>
                      <TableCell className="text-right">{r.quantity}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{fmtDate(r.warrantyExpiresAt)}</TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          {canManage ? (
                            <>
                              <Button variant="ghost" size="icon" type="button" onClick={() => openEdit(r)}>
                                <Pencil className="h-4 w-4" />
                              </Button>
                              {!r.archivedAt ? (
                                <Button variant="ghost" size="icon" type="button" onClick={() => handleArchive(r)}>
                                  <Archive className="h-4 w-4" />
                                </Button>
                              ) : null}
                            </>
                          ) : null}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          {!loading && total > rows.length ? (
            <p className="text-xs text-muted-foreground">
              Showing {rows.length} of {total}. Narrow filters or raise API limit for full export (future).
            </p>
          ) : null}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit asset' : 'Register asset'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            {!editing ? (
              <div className="space-y-2">
                <Label>Professional (technician)</Label>
                {professionalsLoading ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading professionals…
                  </div>
                ) : null}
                {professionalOptions.length > 0 ? (
                  <Select
                    value={professionalSelectedFromList ? formProfessionalId : undefined}
                    onValueChange={(v) => setFormProfessionalId(v)}
                    disabled={!!editing || professionalsLoading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose from directory" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[280px] overflow-y-auto">
                      {professionalOptions.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : null}
                {!professionalSelectedFromList || professionalOptions.length === 0 ? (
                  <div className="space-y-1">
                    <Label className="text-muted-foreground">
                      {professionalOptions.length > 0
                        ? 'Or paste professional MongoDB _id (24 hex chars)'
                        : 'Professional ID (required if directory is empty)'}
                    </Label>
                    <Input
                      value={professionalSelectedFromList ? '' : formProfessionalId}
                      onChange={(e) => setFormProfessionalId(e.target.value.trim())}
                      placeholder="e.g. 507f1f77bcf86cd799439011"
                      className="font-mono text-sm"
                      disabled={!!editing || professionalsLoading}
                      autoComplete="off"
                    />
                  </div>
                ) : null}
                {professionalsLoadError ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-xs text-bloom-coral dark:text-bloom-coral">{professionalsLoadError}</p>
                    <Button
                      type="button"
                      variant="link"
                      className="h-auto p-0 text-xs"
                      disabled={professionalsLoading}
                      onClick={() => void loadProfessionals()}
                    >
                      Retry load
                    </Button>
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="space-y-1">
                <Label>Professional (technician)</Label>
                <p className="text-sm text-muted-foreground">
                  {professionalLabelMap.get(formProfessionalId) || formProfessionalId}
                </p>
              </div>
            )}
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label>Asset tag</Label>
                <Input value={formTag} onChange={(e) => setFormTag(e.target.value)} placeholder="e.g. VAN-MUM-01" />
              </div>
              <div className="space-y-1">
                <Label>Quantity</Label>
                <Input value={formQty} onChange={(e) => setFormQty(e.target.value)} inputMode="numeric" />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Name</Label>
              <Input
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="e.g. Refrigerant recovery unit"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label>Category</Label>
                <Select value={formCategory} onValueChange={(v) => setFormCategory(v as ProviderAssetCategory)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(CATEGORY_LABELS) as ProviderAssetCategory[]).map((k) => (
                      <SelectItem key={k} value={k}>
                        {CATEGORY_LABELS[k]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Status</Label>
                <Select value={formStatus} onValueChange={(v) => setFormStatus(v as ProviderAssetStatus)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(STATUS_LABELS) as ProviderAssetStatus[]).map((k) => (
                      <SelectItem key={k} value={k}>
                        {STATUS_LABELS[k]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1">
              <Label>Serial number</Label>
              <Input value={formSerial} onChange={(e) => setFormSerial(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label>Linked product ID</Label>
                <Input
                  value={formProductId}
                  onChange={(e) => setFormProductId(e.target.value)}
                  placeholder="MongoDB Product id"
                  className="font-mono text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label>Linked service ID</Label>
                <Input
                  value={formServiceId}
                  onChange={(e) => setFormServiceId(e.target.value)}
                  placeholder="MongoDB PlatformService id"
                  className="font-mono text-xs"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label>Purchase date</Label>
                <Input type="date" value={formPurchase} onChange={(e) => setFormPurchase(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>Warranty ends</Label>
                <Input type="date" value={formWarranty} onChange={(e) => setFormWarranty(e.target.value)} />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Location / depot notes</Label>
              <Input
                value={formLocation}
                onChange={(e) => setFormLocation(e.target.value)}
                placeholder="Warehouse rack, van bay…"
              />
            </div>
            <div className="space-y-1">
              <Label>Notes</Label>
              <Textarea value={formNotes} onChange={(e) => setFormNotes(e.target.value)} rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" type="button" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              disabled={
                saving ||
                (!editing && !professionalIdOkForCreate) ||
                !formTag.trim() ||
                !formName.trim()
              }
              onClick={() => void handleSave()}
            >
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={approveOpen} onOpenChange={setApproveOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Approve request</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 py-2 text-sm">
            {approveReq ? (
              <p className="text-muted-foreground">
                Technician: <span className="font-medium text-foreground">{requestProfessionalLabel(approveReq)}</span>
              </p>
            ) : null}
            <div className="space-y-1">
              <Label>Asset tag (required)</Label>
              <Input value={approveTag} onChange={(e) => setApproveTag(e.target.value)} placeholder="Official tag" />
            </div>
            <div className="space-y-1">
              <Label>Name</Label>
              <Input value={approveName} onChange={(e) => setApproveName(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label>Category</Label>
                <Select value={approveCategory} onValueChange={(v) => setApproveCategory(v as ProviderAssetCategory)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(CATEGORY_LABELS) as ProviderAssetCategory[]).map((k) => (
                      <SelectItem key={k} value={k}>
                        {CATEGORY_LABELS[k]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Qty</Label>
                <Input value={approveQty} onChange={(e) => setApproveQty(e.target.value)} inputMode="numeric" />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Asset status</Label>
              <Select value={approveStatus} onValueChange={(v) => setApproveStatus(v as ProviderAssetStatus)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(STATUS_LABELS) as ProviderAssetStatus[]).map((k) => (
                    <SelectItem key={k} value={k}>
                      {STATUS_LABELS[k]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Internal review notes (optional)</Label>
              <Textarea value={approveReviewNotes} onChange={(e) => setApproveReviewNotes(e.target.value)} rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" type="button" onClick={() => setApproveOpen(false)}>
              Cancel
            </Button>
            <Button type="button" disabled={approveSaving || !approveTag.trim()} onClick={() => void handleApproveSave()}>
              {approveSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Approve & register
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reject request</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            {rejectReq ? (
              <p className="text-sm text-muted-foreground">
                {requestProfessionalLabel(rejectReq)} — {rejectReq.name}
              </p>
            ) : null}
            <div className="space-y-1">
              <Label>Reason (optional)</Label>
              <Textarea value={rejectNotes} onChange={(e) => setRejectNotes(e.target.value)} rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" type="button" onClick={() => setRejectOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" type="button" disabled={rejectSaving} onClick={() => void handleRejectSave()}>
              {rejectSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
