import React, { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Download, Loader2, Pencil, Plus } from 'lucide-react'
import { AmcProfessionalPicker } from '../../components/amc/AmcProfessionalPicker'
import { AmcService } from '../../services/api/amc.service'
import type { AmcContract, AmcContractStatus, AmcVisit, AmcVisitStatus } from '../../types/amc.types'
import { formatMoney } from '../../lib/financeFormat'
import { usePermissions } from '../../hooks/usePermissions'
import { appToast } from '../../lib/appToast'
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
import { Separator } from '../../components/ui/separator'
import { InvoicesService, type Invoice } from '../../services/api/invoices.service'

const OID = /^[a-f\d]{24}$/i

function toDatetimeLocalValue(iso: string | undefined): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function invoicesFromListResponse(
  response: Awaited<ReturnType<typeof InvoicesService.getInvoices>>
): Invoice[] {
  if (!response.success || !response.data) return []
  const d = response.data as { invoices?: Invoice[] }
  const raw = d.invoices ?? response.data
  return Array.isArray(raw) ? raw : []
}

export function AmcContractDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { checkPermission } = usePermissions()
  const canManage = checkPermission('manage_amc')

  const [c, setC] = useState<AmcContract | null>(null)
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState<string | null>(null)

  const [statusDraft, setStatusDraft] = useState<AmcContractStatus>('draft')
  const [paidDraft, setPaidDraft] = useState('')
  const [payStatusDraft, setPayStatusDraft] = useState<AmcContract['paymentStatus']>('unpaid')
  const [internalDraft, setInternalDraft] = useState('')
  const [customerNotesDraft, setCustomerNotesDraft] = useState('')
  const [visitsIncDraft, setVisitsIncDraft] = useState('')
  const [primaryProfessionalDraft, setPrimaryProfessionalDraft] = useState<string | undefined>(undefined)
  const [invoiceIdDraft, setInvoiceIdDraft] = useState('')
  const [customerInvoices, setCustomerInvoices] = useState<Invoice[]>([])
  const [linkedInvoice, setLinkedInvoice] = useState<Invoice | null>(null)
  const [invoicesLoading, setInvoicesLoading] = useState(false)
  const [savingMeta, setSavingMeta] = useState(false)

  const [visitOpen, setVisitOpen] = useState(false)
  const [visitSched, setVisitSched] = useState('')
  const [visitNotes, setVisitNotes] = useState('')
  const [visitBooking, setVisitBooking] = useState('')
  const [visitProfessionalId, setVisitProfessionalId] = useState<string | undefined>(undefined)
  const [visitSaving, setVisitSaving] = useState(false)

  const [visitEditOpen, setVisitEditOpen] = useState(false)
  const [visitEditRow, setVisitEditRow] = useState<AmcVisit | null>(null)
  const [visitEditSched, setVisitEditSched] = useState('')
  const [visitEditBooking, setVisitEditBooking] = useState('')
  const [visitEditNotes, setVisitEditNotes] = useState('')
  const [visitEditPro, setVisitEditPro] = useState<string | undefined>(undefined)
  const [visitEditSaving, setVisitEditSaving] = useState(false)

  const load = useCallback(async () => {
    if (!id || !OID.test(id)) {
      setErr('Invalid contract id')
      setLoading(false)
      return
    }
    setLoading(true)
    setErr(null)
    try {
      const res = await AmcService.getContract(id)
      const doc = res.data
      setC(doc)
      setStatusDraft(doc.status)
      setPaidDraft(String(doc.amountPaid ?? 0))
      setPayStatusDraft(doc.paymentStatus)
      setInternalDraft(doc.internalNotes ?? '')
      setCustomerNotesDraft(doc.customerNotes ?? '')
      setVisitsIncDraft(String(doc.visitsIncluded ?? 0))
      setPrimaryProfessionalDraft(
        doc.primaryProfessionalId && OID.test(doc.primaryProfessionalId)
          ? doc.primaryProfessionalId
          : undefined
      )
      setInvoiceIdDraft(doc.invoiceId && OID.test(doc.invoiceId) ? doc.invoiceId : '')
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Failed to load contract')
      setC(null)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    if (!canManage || !c?.customerId) return
    let cancelled = false
    setInvoicesLoading(true)
    void (async () => {
      try {
        const response = await InvoicesService.getInvoices({
          customerId: c.customerId,
          limit: 80,
          page: 1,
        })
        if (cancelled) return
        setCustomerInvoices(invoicesFromListResponse(response))
      } catch {
        if (!cancelled) setCustomerInvoices([])
      } finally {
        if (!cancelled) setInvoicesLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [canManage, c?.customerId])

  useEffect(() => {
    if (!invoiceIdDraft || !OID.test(invoiceIdDraft)) {
      setLinkedInvoice(null)
      return
    }
    let cancelled = false
    void (async () => {
      try {
        const res = await InvoicesService.getInvoiceById(invoiceIdDraft)
        if (cancelled) return
        const inv = res.data?.invoice
        setLinkedInvoice(inv && typeof inv === 'object' && '_id' in inv ? inv : null)
      } catch {
        if (!cancelled) setLinkedInvoice(null)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [invoiceIdDraft])

  const saveMeta = async () => {
    if (!id || !canManage) return
    const amountPaid = parseFloat(paidDraft)
    const visitsIncluded = parseInt(visitsIncDraft, 10)
    if (Number.isNaN(amountPaid) || amountPaid < 0) {
      setErr('Invalid amount paid')
      return
    }
    setSavingMeta(true)
    setErr(null)
    try {
      await AmcService.patchContract(id, {
        status: statusDraft,
        amountPaid,
        paymentStatus: payStatusDraft,
        internalNotes: internalDraft.trim() || undefined,
        customerNotes: customerNotesDraft.trim() || undefined,
        visitsIncluded: Number.isNaN(visitsIncluded) ? undefined : Math.max(0, visitsIncluded),
        primaryProfessionalId: primaryProfessionalDraft ?? null,
        invoiceId: invoiceIdDraft.trim() && OID.test(invoiceIdDraft.trim()) ? invoiceIdDraft.trim() : null,
      })
      void load()
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Save failed')
    } finally {
      setSavingMeta(false)
    }
  }

  const addVisit = async () => {
    if (!id || !canManage) return
    setVisitSaving(true)
    setErr(null)
    try {
      await AmcService.addVisit(id, {
        scheduledFor: visitSched ? new Date(visitSched).toISOString() : undefined,
        notes: visitNotes.trim() || undefined,
        status: 'scheduled',
        ...(visitBooking.trim() && OID.test(visitBooking.trim())
          ? { bookingId: visitBooking.trim() }
          : {}),
        ...(visitProfessionalId ? { professionalId: visitProfessionalId } : {}),
      })
      setVisitOpen(false)
      setVisitSched('')
      setVisitNotes('')
      setVisitBooking('')
      setVisitProfessionalId(undefined)
      void load()
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Could not add visit')
    } finally {
      setVisitSaving(false)
    }
  }

  const patchVisitRow = async (visitId: string, patch: Record<string, unknown>) => {
    if (!id || !canManage) return
    try {
      await AmcService.patchVisit(id, visitId, patch)
      void load()
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Visit update failed')
    }
  }

  const openVisitEdit = (v: AmcVisit) => {
    setVisitEditRow(v)
    setVisitEditSched(toDatetimeLocalValue(v.scheduledFor))
    setVisitEditBooking(v.bookingId && OID.test(v.bookingId) ? v.bookingId : '')
    setVisitEditNotes(v.notes ?? '')
    setVisitEditPro(v.professionalId && OID.test(v.professionalId) ? v.professionalId : undefined)
    setVisitEditOpen(true)
  }

  const saveVisitEdit = async () => {
    if (!id || !visitEditRow || !canManage) return
    setVisitEditSaving(true)
    setErr(null)
    try {
      await AmcService.patchVisit(id, visitEditRow._id, {
        scheduledFor: visitEditSched ? new Date(visitEditSched).toISOString() : null,
        bookingId:
          visitEditBooking.trim() && OID.test(visitEditBooking.trim()) ? visitEditBooking.trim() : null,
        notes: visitEditNotes.trim() || undefined,
        professionalId: visitEditPro ?? null,
      })
      setVisitEditOpen(false)
      setVisitEditRow(null)
      void load()
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Visit save failed')
    } finally {
      setVisitEditSaving(false)
    }
  }

  const downloadLinkedPdf = async () => {
    if (!linkedInvoice?._id) return
    const r = await InvoicesService.downloadInvoicePDF(linkedInvoice._id, linkedInvoice.invoiceNumber)
    if (!r.success) {
      appToast(typeof r.error === 'string' ? r.error : 'PDF download failed', 'error')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin" />
        Loading contract…
      </div>
    )
  }

  if (!c) {
    return (
      <div className="rounded-md border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
        {err || 'Contract not found'}
        <div className="mt-2">
          <Link to="/amc/contracts" className="font-medium text-primary hover:underline">
            Back to contracts
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="outline" size="sm" asChild>
          <Link to="/amc/contracts">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Contracts
          </Link>
        </Button>
        <div className="min-w-0 flex-1">
          <h2 className="truncate font-mono text-xl font-bold tracking-tight">{c.contractNumber}</h2>
          <p className="text-sm text-muted-foreground">{c.planName}</p>
        </div>
        <Badge variant={c.status === 'active' ? 'default' : 'secondary'} className="capitalize">
          {c.status}
        </Badge>
      </div>

      {err && (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {err}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Customer</CardTitle>
            <CardDescription>
              Snapshot from contract creation — update CRM for permanent profile changes.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <p className="font-semibold">{c.customerName || '—'}</p>
            <p className="text-muted-foreground">{c.customerPhone || '—'}</p>
            <p className="text-muted-foreground">{c.customerEmail || '—'}</p>
            <p className="font-mono text-[11px] text-muted-foreground">User ID: {c.customerId}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Service location</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {c.propertyAddress?.line1 || c.propertyAddress?.city ? (
              <>
                <p>{c.propertyAddress?.line1}</p>
                <p>
                  {[c.propertyAddress?.city, c.propertyAddress?.state, c.propertyAddress?.pincode]
                    .filter(Boolean)
                    .join(', ')}
                </p>
                {c.propertyAddress?.landmark ? <p>Landmark: {c.propertyAddress.landmark}</p> : null}
              </>
            ) : (
              <p>No address on file.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Linked invoice</CardTitle>
          <CardDescription>
            Attach the billing document for this AMC. Customer invoices are filtered by this contract&apos;s user id.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {canManage ? (
            <div className="grid gap-2 md:max-w-md">
              <Label>Invoice</Label>
              <Select
                disabled={invoicesLoading}
                value={invoiceIdDraft && OID.test(invoiceIdDraft) ? invoiceIdDraft : '__none__'}
                onValueChange={(v) => setInvoiceIdDraft(v === '__none__' ? '' : v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder={invoicesLoading ? 'Loading…' : 'Choose invoice'} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">No invoice linked</SelectItem>
                  {customerInvoices.map((inv) => (
                    <SelectItem key={inv._id} value={inv._id}>
                      {inv.invoiceNumber} · {formatMoney(inv.totalAmount)} · {inv.status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Pick from this customer&apos;s invoices or clear the link. Saving happens with &quot;Save changes&quot;
                below.
              </p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              {invoiceIdDraft && OID.test(invoiceIdDraft)
                ? `Linked invoice id: ${invoiceIdDraft}`
                : 'No invoice linked.'}
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            {linkedInvoice ? (
              <>
                <Badge variant="outline">{linkedInvoice.invoiceNumber}</Badge>
                <span className="text-sm text-muted-foreground capitalize">{linkedInvoice.status}</span>
                <Button type="button" size="sm" variant="secondary" onClick={() => void downloadLinkedPdf()}>
                  <Download className="mr-2 h-4 w-4" />
                  PDF
                </Button>
              </>
            ) : invoiceIdDraft && OID.test(invoiceIdDraft) ? (
              <span className="text-xs text-muted-foreground">Could not load invoice metadata.</span>
            ) : null}
            {canManage ? (
              <Button type="button" size="sm" variant="outline" asChild>
                <Link
                  to={`/invoices/create?customerId=${encodeURIComponent(c.customerId)}&amcContract=${encodeURIComponent(c.contractNumber)}`}
                >
                  Create invoice…
                </Link>
              </Button>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Coverage &amp; term</CardTitle>
          <CardDescription>
            What this AMC includes — align with catalogue SKUs (e.g. Water Purifier AMC).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {(c.coveredCategories || []).map((x) => (
              <Badge key={x} variant="outline">
                {x}
              </Badge>
            ))}
          </div>
          {c.planDescription ? (
            <p className="text-sm leading-relaxed text-muted-foreground">{c.planDescription}</p>
          ) : null}
          <Separator />
          <div className="grid gap-2 text-sm sm:grid-cols-2">
            <div>
              <span className="text-muted-foreground">Start</span>
              <p className="font-medium tabular-nums">{new Date(c.startDate).toLocaleString()}</p>
            </div>
            <div>
              <span className="text-muted-foreground">End</span>
              <p className="font-medium tabular-nums">{new Date(c.endDate).toLocaleString()}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Visit entitlement</span>
              <p className="font-medium tabular-nums">
                {c.visitsUsed} used / {c.visitsIncluded} included
              </p>
            </div>
            <div>
              <span className="text-muted-foreground">Contract value</span>
              <p className="font-semibold tabular-nums">{formatMoney(c.totalAmount, c.currency)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
          <div>
            <CardTitle className="text-base">Operations &amp; billing</CardTitle>
            <CardDescription>
              Status, collections, assignment, and internal notes visible only to dashboard users.
            </CardDescription>
          </div>
          {canManage ? (
            <Button type="button" size="sm" onClick={() => void saveMeta()} disabled={savingMeta}>
              {savingMeta ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save changes'}
            </Button>
          ) : null}
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <AmcProfessionalPicker
              label="Primary technician"
              value={primaryProfessionalDraft}
              onChange={setPrimaryProfessionalDraft}
              disabled={!canManage}
            />
          </div>
          <div className="grid gap-2">
            <Label>Contract status</Label>
            <Select
              disabled={!canManage}
              value={statusDraft}
              onValueChange={(v) => setStatusDraft(v as AmcContractStatus)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(['draft', 'active', 'suspended', 'expired', 'cancelled', 'renewed'] as const).map((s) => (
                  <SelectItem key={s} value={s} className="capitalize">
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label>Payment status</Label>
            <Select
              disabled={!canManage}
              value={payStatusDraft}
              onValueChange={(v) => setPayStatusDraft(v as AmcContract['paymentStatus'])}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unpaid">Unpaid</SelectItem>
                <SelectItem value="partial">Partial</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="refunded">Refunded</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label>Amount paid ({c.currency})</Label>
            <Input
              disabled={!canManage}
              inputMode="decimal"
              value={paidDraft}
              onChange={(e) => setPaidDraft(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label>Visits included</Label>
            <Input
              disabled={!canManage}
              inputMode="numeric"
              value={visitsIncDraft}
              onChange={(e) => setVisitsIncDraft(e.target.value)}
            />
          </div>
          <div className="md:col-span-2 grid gap-2">
            <Label>Internal notes</Label>
            <Textarea
              disabled={!canManage}
              rows={3}
              value={internalDraft}
              onChange={(e) => setInternalDraft(e.target.value)}
              placeholder="Renewal quotes sent, spare parts policy, escalation…"
            />
          </div>
          <div className="md:col-span-2 grid gap-2">
            <Label>Customer-facing notes</Label>
            <Textarea
              disabled={!canManage}
              rows={2}
              value={customerNotesDraft}
              onChange={(e) => setCustomerNotesDraft(e.target.value)}
              placeholder="Shown on job cards or communications when you expose them downstream."
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
          <div>
            <CardTitle className="text-base">Visit schedule &amp; completion</CardTitle>
            <CardDescription>
              Tie visits to bookings and technicians — completed visits consume entitlement.
            </CardDescription>
          </div>
          {canManage ? (
            <Button type="button" size="sm" variant="secondary" onClick={() => setVisitOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Log visit
            </Button>
          ) : null}
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {(c.visits || []).length === 0 ? (
            <p className="text-sm text-muted-foreground">No visits logged yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Scheduled</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Booking</TableHead>
                  <TableHead>Technician</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead className="w-[180px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {(c.visits || []).map((v) => (
                  <TableRow key={v._id}>
                    <TableCell className="whitespace-nowrap text-xs tabular-nums">
                      {v.scheduledFor ? new Date(v.scheduledFor).toLocaleString() : '—'}
                    </TableCell>
                    <TableCell>
                      {canManage ? (
                        <Select
                          value={v.status}
                          onValueChange={(nv) =>
                            void patchVisitRow(v._id, {
                              status: nv as AmcVisitStatus,
                              ...(nv === 'completed' ? { completedAt: new Date().toISOString() } : {}),
                            })
                          }
                        >
                          <SelectTrigger className="h-8 w-[130px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="scheduled">Scheduled</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                            <SelectItem value="skipped">Skipped</SelectItem>
                            <SelectItem value="no_show">No show</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <Badge variant="outline" className="capitalize">
                          {v.status.replace(/_/g, ' ')}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {v.bookingId && OID.test(v.bookingId) ? (
                        <Link className="text-primary hover:underline" to={`/bookings/${v.bookingId}`}>
                          Open booking
                        </Link>
                      ) : (
                        '—'
                      )}
                    </TableCell>
                    <TableCell>
                      {v.professionalId && OID.test(v.professionalId) ? (
                        <Link
                          className="text-xs text-primary hover:underline"
                          to={`/professionals/edit/${v.professionalId}`}
                        >
                          Profile
                        </Link>
                      ) : (
                        '—'
                      )}
                    </TableCell>
                    <TableCell className="max-w-[220px] truncate text-xs text-muted-foreground">
                      {v.notes || '—'}
                    </TableCell>
                    <TableCell className="text-right">
                      {canManage ? (
                        <div className="flex justify-end gap-1">
                          <Button type="button" variant="ghost" size="sm" onClick={() => openVisitEdit(v)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          {v.status === 'scheduled' ? (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                void patchVisitRow(v._id, {
                                  status: 'completed',
                                  completedAt: new Date().toISOString(),
                                })
                              }
                            >
                              Complete
                            </Button>
                          ) : null}
                        </div>
                      ) : null}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={visitOpen} onOpenChange={setVisitOpen}>
        <DialogContent className="max-h-[min(90vh,720px)] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Log visit</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-1">
              <Label>Scheduled for (optional)</Label>
              <Input type="datetime-local" value={visitSched} onChange={(e) => setVisitSched(e.target.value)} />
            </div>
            <div className="grid gap-1">
              <Label>Booking ID (optional)</Label>
              <Input
                placeholder="24-char Mongo id"
                value={visitBooking}
                onChange={(e) => setVisitBooking(e.target.value)}
                className="font-mono text-xs"
              />
            </div>
            <AmcProfessionalPicker
              label="Technician (optional)"
              value={visitProfessionalId}
              onChange={setVisitProfessionalId}
            />
            <div className="grid gap-1">
              <Label>Notes</Label>
              <Textarea rows={3} value={visitNotes} onChange={(e) => setVisitNotes(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => setVisitOpen(false)}>
              Cancel
            </Button>
            <Button type="button" disabled={visitSaving} onClick={() => void addVisit()}>
              {visitSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Add'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={visitEditOpen}
        onOpenChange={(o) => {
          setVisitEditOpen(o)
          if (!o) setVisitEditRow(null)
        }}
      >
        <DialogContent className="max-h-[min(90vh,720px)] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit visit</DialogTitle>
          </DialogHeader>
          {visitEditRow ? (
            <>
              <div className="grid gap-4 py-2">
                <div className="grid gap-1">
                  <Label>Scheduled for</Label>
                  <Input
                    type="datetime-local"
                    value={visitEditSched}
                    onChange={(e) => setVisitEditSched(e.target.value)}
                  />
                </div>
                <div className="grid gap-1">
                  <Label>Booking ID</Label>
                  <Input
                    placeholder="24-char Mongo id"
                    value={visitEditBooking}
                    onChange={(e) => setVisitEditBooking(e.target.value)}
                    className="font-mono text-xs"
                  />
                </div>
                <AmcProfessionalPicker label="Technician" value={visitEditPro} onChange={setVisitEditPro} />
                <div className="grid gap-1">
                  <Label>Notes</Label>
                  <Textarea rows={3} value={visitEditNotes} onChange={(e) => setVisitEditNotes(e.target.value)} />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="secondary" onClick={() => setVisitEditOpen(false)}>
                  Cancel
                </Button>
                <Button type="button" disabled={visitEditSaving} onClick={() => void saveVisitEdit()}>
                  {visitEditSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save visit'}
                </Button>
              </DialogFooter>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  )
}
