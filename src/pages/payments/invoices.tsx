/**
 * ============================================================================
 * INVOICES PAGE - COMPREHENSIVE BILLING MANAGEMENT
 * ============================================================================
 * Professional invoicing system for administrators
 *
 * @author CTO Team
 * @date November 9, 2025
 */

import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search,
  Filter,
  MoreVertical,
  Receipt,
  IndianRupee,
  Calendar,
  Download,
  Mail,
  RefreshCw,
  Plus,
  Eye,
  CheckCircle2,
  Clock,
  Ban,
  FileText,
} from 'lucide-react'
import { PageHeader } from '../../components/common/PageHeader'
import { StandardTable, type StandardTableColumn } from '../../components/common'
import { InvoicesService } from '../../services/api/invoices.service'
import type { Invoice } from '../../services/api/invoices.service'
import { appToast } from '../../lib/appToast'
import { cn } from '../../lib/utils'
import { Button } from '../../components/ui/button'
import { Card, CardContent } from '../../components/ui/card'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { Badge } from '../../components/ui/badge'
import { Avatar, AvatarFallback } from '../../components/ui/avatar'
import { HStack } from '../../components/ui/spacing'
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu'
import { Tabs, TabsList, TabsTrigger } from '../../components/ui/tabs'
import { Separator } from '../../components/ui/separator'

function statusTone(
  status: string
): { badge: string; Icon: React.FC<{ className?: string }> } {
  switch (String(status).toLowerCase()) {
    case 'paid':
      return { badge: 'border-green-500/45 bg-green-500/10 text-green-800 dark:text-green-300', Icon: CheckCircle2 }
    case 'pending':
    case 'issued':
      return { badge: 'border-orange-500/45 bg-orange-500/10 text-orange-900 dark:text-orange-200', Icon: Clock }
    case 'partially_paid':
      return { badge: 'border-sky-500/45 bg-sky-500/10 text-sky-900 dark:text-sky-200', Icon: Clock }
    case 'refunded':
    case 'cancelled':
      return { badge: 'border-neutral-500/45 bg-neutral-500/10 text-neutral-700 dark:text-neutral-300', Icon: Ban }
    default:
      return { badge: 'border-border bg-muted/80 text-muted-foreground', Icon: Clock }
  }
}

export function Invoices() {
  const navigate = useNavigate()
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [filteredInvoices, setFilteredInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState('0')
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)

  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false)
  const [generateDialogOpen, setGenerateDialogOpen] = useState(false)
  const [bookingIdForGenerate, setBookingIdForGenerate] = useState('')
  const [generateSubmitting, setGenerateSubmitting] = useState(false)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [bulkDownloading, setBulkDownloading] = useState(false)
  const [bulkBookingsOpen, setBulkBookingsOpen] = useState(false)
  const [bulkBookingsText, setBulkBookingsText] = useState('')
  const [bulkBookingsRunning, setBulkBookingsRunning] = useState(false)

  const [stats, setStats] = useState({
    totalPaidAmount: 0,
    totalPendingAmount: 0,
    totalInvoices: 0,
    paidInvoices: 0,
    pendingInvoices: 0,
  })

  useEffect(() => {
    loadInvoices()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [invoices, searchQuery, activeTab])

  const loadInvoices = async () => {
    setLoading(true)
    setError(null)
    try {
      console.log('📋 Loading invoices...')
      const response = await InvoicesService.getInvoices({
        page: 1,
        limit: 1000,
      })

      if (response.success && response.data) {
        const raw = response.data.invoices || response.data || []
        const invoicesData = Array.isArray(raw) ? raw.map(normalizeInvoice) : []
        setInvoices(invoicesData)
        calculateStats(invoicesData)
        console.log(`✅ Loaded ${invoicesData.length} invoices`)
      } else {
        const err =
          typeof response.error === 'string'
            ? response.error
            : (response.error as any)?.message
        throw new Error(err || 'Failed to load invoices')
      }
    } catch (err: any) {
      console.error('❌ Failed to load invoices:', err)
      setError(err.message || 'Failed to load invoices')
      setInvoices([])
    } finally {
      setLoading(false)
    }
  }

  const calculateStats = (invoicesData: Invoice[]) => {
    const isPaid = (inv: Invoice) => (inv.paymentStatus ?? (inv as any).payment_status) === 'paid'
    const isPending = (inv: Invoice) =>
      (inv.paymentStatus ?? (inv as any).payment_status) === 'pending' || (inv as any).status === 'issued'

    const totalPaidAmount = invoicesData
      .filter(isPaid)
      .reduce((sum, inv) => sum + (inv.totalAmount ?? (inv as any).total ?? (inv as any).amountPaid ?? 0), 0)

    const totalPendingAmount = invoicesData
      .filter(isPending)
      .reduce((sum, inv) => {
        const due = (inv as any).amountDue
        const total = inv.totalAmount ?? (inv as any).total ?? 0
        return sum + (typeof due === 'number' ? due : total)
      }, 0)

    const paidCount = invoicesData.filter(isPaid).length
    const pendingCount = invoicesData.filter(isPending).length

    setStats({
      totalPaidAmount,
      totalPendingAmount,
      totalInvoices: invoicesData.length,
      paidInvoices: paidCount,
      pendingInvoices: pendingCount,
    })
  }

  const applyFilters = () => {
    let filtered = [...invoices]

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter((invoice) => {
        const c = invoice.customerId as any
        const name = c ? `${c.firstName ?? ''} ${c.lastName ?? ''}`.trim() : (invoice as any).billingTo?.name ?? ''
        const email = c?.email ?? (invoice as any).billingTo?.email ?? ''
        return (
          (invoice.invoiceNumber || '').toLowerCase().includes(query) ||
          name.toLowerCase().includes(query) ||
          email.toLowerCase().includes(query)
        )
      })
    }

    const getPaymentStatus = (inv: Invoice) =>
      inv.paymentStatus ?? (inv as any).payment_status ?? ((inv as any).status === 'paid' ? 'paid' : 'pending')
    switch (activeTab) {
      case '1':
        filtered = filtered.filter((inv) => getPaymentStatus(inv) === 'paid')
        break
      case '2':
        filtered = filtered.filter((inv) => getPaymentStatus(inv) === 'pending')
        break
      case '3':
        filtered = filtered.filter((inv) => getPaymentStatus(inv) === 'refunded')
        break
    }

    setFilteredInvoices(filtered)
  }

  const openDetails = (invoice: Invoice) => {
    setSelectedInvoice(invoice)
    setDetailsDialogOpen(true)
  }

  const downloadPdfFor = async (invoice: Invoice) => {
    try {
      const r = await InvoicesService.downloadInvoicePDF(invoice._id, (invoice as any).invoiceNumber)
      if (!r?.success) {
        appToast((r as any)?.error || 'Download failed', 'error')
      } else {
        appToast('Invoice downloaded', 'success')
      }
    } catch (error: any) {
      console.error('Failed to download invoice:', error)
      appToast(error?.message || 'Download failed', 'error')
    }
  }

  const handleDownloadSelectedPdfs = async () => {
    if (selectedIds.length === 0) return
    setBulkDownloading(true)
    try {
      const byId = new Map(filteredInvoices.map((i) => [i._id, i]))
      const entries = selectedIds
        .map((id) => {
          const inv = byId.get(id)
          return inv
            ? { id, fileNameBase: (inv as any).invoiceNumber || id }
            : { id, fileNameBase: id }
        })
      const r = await InvoicesService.downloadInvoicePDFsBatch(entries, { delayMs: 500 })
      if (r.fail === 0) {
        appToast(`Downloaded ${r.ok} PDF(s).`, 'success')
      } else {
        appToast(
          `Downloaded ${r.ok}, failed ${r.fail}. ${r.errors.slice(0, 3).join('; ')}`,
          r.ok > 0 ? 'warning' : 'error'
        )
      }
    } catch (e: any) {
      appToast(e?.message || 'Batch download failed', 'error')
    } finally {
      setBulkDownloading(false)
    }
  }

  const handleBulkGenerateFromBookings = async () => {
    const idRe = /^[a-f0-9]{24}$/i
    const raw = bulkBookingsText
      .split(/[\r\n,;\s]+/)
      .map((s) => s.trim())
      .filter(Boolean)
    const unique = Array.from(new Set(raw)).filter((id) => idRe.test(id))
    if (unique.length === 0) {
      appToast('Add at least one valid 24-character booking ID (one per line).', 'warning')
      return
    }
    setBulkBookingsRunning(true)
    let ok = 0
    let fail = 0
    for (const bookingId of unique) {
      try {
        const res = await InvoicesService.generateInvoiceForBooking(bookingId, {
          showSuccessToast: false,
          showLoading: false,
          loadingMessage: '',
        })
        if (res?.success) ok++
        else fail++
      } catch {
        fail++
      }
    }
    setBulkBookingsRunning(false)
    setBulkBookingsOpen(false)
    setBulkBookingsText('')
    await loadInvoices()
    appToast(`Bulk generate: ${ok} OK, ${fail} failed (${unique.length} booking IDs).`, fail ? 'warning' : 'success')
  }

  const emailInvoiceFor = async (invoice: Invoice) => {
    try {
      await InvoicesService.emailInvoiceToCustomer(invoice._id)
    } catch (error: any) {
      console.error('Failed to email invoice:', error)
    }
  }

  const handleGenerateFromBooking = async () => {
    const id = bookingIdForGenerate.trim()
    if (!id) return
    setGenerateSubmitting(true)
    try {
      const res = await InvoicesService.generateInvoiceForBooking(id)
      if (res?.success) {
        await loadInvoices()
        setGenerateDialogOpen(false)
        setBookingIdForGenerate('')
      }
    } catch (err: any) {
      console.error('Generate invoice failed:', err)
      setError(err?.message || 'Failed to generate invoice')
    } finally {
      setGenerateSubmitting(false)
    }
  }

  const formatCurrency = (amount: number, currency = 'INR') => {
    if (amount == null) return '—'
    const num = Number(amount)
    if (currency === 'INR') {
      return `₹${num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    }
    return `${currency} ${num.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
  }

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return '—'
    const d = new Date(dateString)
    if (Number.isNaN(d.getTime())) return String(dateString)
    return d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }

  const normalizeInvoice = (inv: any): Invoice => {
    const totalAmount = inv.total ?? inv.totalAmount ?? 0
    const status = inv.status ?? inv.paymentStatus ?? 'issued'
    const paymentStatus = status === 'paid' ? 'paid' : status === 'refunded' ? 'refunded' : 'pending'
    const customer = inv.customerId
      ? inv.customerId
      : inv.billingTo
        ? {
            _id: '',
            firstName: (inv.billingTo.name || '').split(' ')[0] || 'Customer',
            lastName: (inv.billingTo.name || '').split(' ').slice(1).join(' ') || '',
            email: inv.billingTo.email || '',
            phone: inv.billingTo.phone,
          }
        : null
    const items = (inv.items || []).map((item: any) => ({
      description: item.description || 'Service',
      quantity: item.quantity ?? 1,
      unitPrice: item.unitPrice ?? 0,
      amount: item.total ?? item.amount ?? (item.unitPrice ?? 0) * (item.quantity ?? 1),
    }))
    return {
      ...inv,
      _id: inv._id ?? inv.id,
      invoiceNumber: inv.invoiceNumber ?? `INV-${(inv._id || '').slice(-6)}`,
      totalAmount,
      paymentStatus,
      status,
      issuedDate: inv.invoiceDate ?? inv.issuedDate ?? inv.createdAt,
      dueDate: inv.dueDate,
      paidDate: inv.paymentDate,
      customerId: customer,
      subtotal: inv.subtotal ?? totalAmount,
      tax: inv.totalTax ?? inv.tax ?? 0,
      discount: inv.discount ?? 0,
      items,
    }
  }

  const invoiceColumns: StandardTableColumn<Invoice>[] = [
    {
      id: 'invoiceNumber',
      label: 'Invoice #',
      sortable: true,
      render: (_, inv) => (
        <>
          <span className="text-sm font-semibold">{inv.invoiceNumber}</span>
          {inv.bookingId && (
            <span className="mt-0.5 block text-xs text-muted-foreground">Booking: {inv.bookingId}</span>
          )}
        </>
      ),
    },
    {
      id: 'customer',
      label: 'Customer / Billing To',
      sortable: true,
      valueGetter: (inv) => {
        const c = inv.customerId as any
        const name = c ? `${c.firstName ?? ''} ${c.lastName ?? ''}`.trim() : (inv as any).billingTo?.name ?? ''
        const email = c?.email ?? (inv as any).billingTo?.email ?? ''
        return `${name} ${email}`.trim()
      },
      render: (_, inv) => {
        const c = inv.customerId as any
        const name = c ? `${c.firstName ?? ''} ${c.lastName ?? ''}`.trim() : (inv as any).billingTo?.name ?? '—'
        const email = c?.email ?? (inv as any).billingTo?.email ?? ''
        if (!name && !email) return <span className="text-sm text-muted-foreground">—</span>
        const initial = (name || '?')[0]?.toUpperCase() ?? '?'
        return (
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-primary text-xs text-primary-foreground">{initial}</AvatarFallback>
            </Avatar>
            <div>
              <span className="text-sm font-medium">{name || '—'}</span>
              {email && <span className="block text-xs text-muted-foreground">{email}</span>}
            </div>
          </div>
        )
      },
    },
    {
      id: 'issuedDate',
      label: 'Invoice Date',
      sortable: true,
      render: (_, inv) => (
        <div className="flex items-center gap-1">
          <Calendar className="h-4 w-4 shrink-0 text-muted-foreground" />
          <span className="text-sm">{formatDate(inv.issuedDate ?? (inv as any).invoiceDate)}</span>
        </div>
      ),
    },
    {
      id: 'dueDate',
      label: 'Due Date',
      sortable: true,
      render: (_, inv) =>
        inv.dueDate ? (
          <span className="text-sm">{formatDate(inv.dueDate)}</span>
        ) : (
          <span className="text-sm text-muted-foreground">N/A</span>
        ),
    },
    {
      id: 'totalAmount',
      label: 'Amount',
      align: 'right',
      sortable: true,
      render: (_, inv) => {
        const total = inv.totalAmount ?? (inv as any).total ?? 0
        const due = (inv as any).amountDue
        return (
          <div className="text-right">
            <span className="text-sm font-semibold">{formatCurrency(total)}</span>
            {due != null && Number(due) > 0 && (
              <span className="mt-0.5 block text-xs text-muted-foreground">Due: {formatCurrency(Number(due))}</span>
            )}
          </div>
        )
      },
    },
    {
      id: 'paymentStatus',
      label: 'Status',
      sortable: true,
      valueGetter: (inv) => inv.paymentStatus ?? (inv as any).payment_status ?? (inv as any).status ?? '',
      render: (_, inv) => {
        const raw = String(
          inv.paymentStatus ?? (inv as any).payment_status ?? (inv as any).status ?? 'issued'
        )
        const display = raw === 'issued' ? 'Pending' : raw.replace('_', ' ')
        const key = raw === 'issued' ? 'pending' : raw
        const { badge, Icon } = statusTone(key)
        return (
          <Badge variant="outline" className={cn('gap-1 font-semibold', badge)}>
            <Icon className="h-3.5 w-3.5" />
            {display}
          </Badge>
        )
      },
    },
  ]

  return (
    <div className="p-4 sm:p-6">
      <PageHeader
        title="Invoices"
        subtitle="Manage and track all billing documents"
        icon={<Receipt className="h-7 w-7" />}
        action={
          <HStack className="flex-wrap justify-end gap-2">
            <Button variant="outline" onClick={() => navigate('/invoices/branding')}>
              Invoice appearance
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setSelectedIds([])
                navigate('/invoices/create')
              }}
            >
              Create manual invoice
            </Button>
            <Button variant="outline" onClick={() => setBulkBookingsOpen(true)}>
              Multiple from bookings
            </Button>
            <Button
              className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:from-indigo-600 hover:to-purple-700"
              onClick={() => setGenerateDialogOpen(true)}
            >
              <Plus className="mr-2 h-4 w-4" />
              One from booking
            </Button>
          </HStack>
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="overflow-hidden border-0 bg-gradient-to-br from-green-600 to-green-800 text-white shadow-md">
          <CardContent className="flex items-start justify-between p-6">
            <div>
              <p className="mb-1 text-sm opacity-90">Total Paid Amount</p>
              <p className="text-2xl font-bold sm:text-3xl">{formatCurrency(stats.totalPaidAmount)}</p>
              <p className="mt-1 text-xs opacity-90">
                {stats.paidInvoices} invoice{stats.paidInvoices !== 1 ? 's' : ''} paid
              </p>
            </div>
            <CheckCircle2 className="h-12 w-12 shrink-0 opacity-30" />
          </CardContent>
        </Card>

        <Card className="overflow-hidden border-0 bg-gradient-to-br from-orange-500 to-orange-800 text-white shadow-md">
          <CardContent className="flex items-start justify-between p-6">
            <div>
              <p className="mb-1 text-sm opacity-90">Total Pending Amount</p>
              <p className="text-2xl font-bold sm:text-3xl">{formatCurrency(stats.totalPendingAmount)}</p>
              <p className="mt-1 text-xs opacity-90">
                {stats.pendingInvoices} invoice{stats.pendingInvoices !== 1 ? 's' : ''} pending
              </p>
            </div>
            <Clock className="h-12 w-12 shrink-0 opacity-30" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-start justify-between p-6">
            <div>
              <p className="mb-1 text-sm text-muted-foreground">Total Invoices</p>
              <p className="text-2xl font-bold sm:text-3xl">{stats.totalInvoices}</p>
            </div>
            <FileText className="h-12 w-12 shrink-0 text-sky-500/30" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-start justify-between p-6">
            <div>
              <p className="mb-1 text-sm text-muted-foreground">Summary</p>
              <p className="text-sm font-semibold text-green-600 dark:text-green-400">Paid: {formatCurrency(stats.totalPaidAmount)}</p>
              <p className="text-sm font-semibold text-orange-600 dark:text-orange-400">
                Pending: {formatCurrency(stats.totalPendingAmount)}
              </p>
            </div>
            <IndianRupee className="h-12 w-12 shrink-0 text-muted-foreground/30" />
          </CardContent>
        </Card>
      </div>

      <Card className="mb-6">
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-wrap gap-2">
            <div className="relative min-w-[280px] flex-1">
              <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Search by invoice number, customer name, or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button variant="outline" onClick={loadInvoices}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
            <Button
              variant="outline"
              disabled={selectedIds.length === 0 || bulkDownloading}
              onClick={handleDownloadSelectedPdfs}
            >
              <Download className="mr-2 h-4 w-4" />
              {bulkDownloading ? 'Downloading…' : `Download PDFs (${selectedIds.length})`}
            </Button>
            <Button variant="outline" type="button">
              <Filter className="mr-2 h-4 w-4" />
              Advanced Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid h-auto w-full grid-cols-2 gap-1 rounded-none border-b bg-transparent p-0 sm:grid-cols-4">
            <TabsTrigger value="0" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary">
              All Invoices
            </TabsTrigger>
            <TabsTrigger value="1" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary">
              Paid
            </TabsTrigger>
            <TabsTrigger value="2" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary">
              Pending
            </TabsTrigger>
            <TabsTrigger value="3" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary">
              Refunded
            </TabsTrigger>
          </TabsList>
        </Tabs>
        {error ? (
          <div className="p-6">
            <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-900 dark:border-red-900 dark:bg-red-950/40 dark:text-red-100">
              {error}
            </div>
          </div>
        ) : (
          <div className="px-2 pb-4 pt-2 sm:px-4">
            <StandardTable<Invoice>
              columns={invoiceColumns}
              data={filteredInvoices}
              getRowId={(row) => row._id ?? ''}
              loading={loading}
              selectable
              selectedIds={selectedIds}
              onSelectionChange={setSelectedIds}
              rowsPerPage={100}
              rowsPerPageOptions={[25, 50, 100, 200, 500]}
              emptyMessage="No invoices found"
              emptyDescription={
                searchQuery || activeTab !== '0'
                  ? 'Try adjusting your filters'
                  : 'Generate your first invoice to get started'
              }
              error={null}
              showSearch={false}
              renderActions={(invoice) => (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => openDetails(invoice)}>
                      <Eye className="mr-2 h-4 w-4" />
                      View Details
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => void downloadPdfFor(invoice)}>
                      <Download className="mr-2 h-4 w-4" />
                      Download PDF
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => void emailInvoiceFor(invoice)}>
                      <Mail className="mr-2 h-4 w-4" />
                      Email to Customer
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
              size="small"
              minHeight={380}
            />
          </div>
        )}
      </Card>

      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Invoice Details</DialogTitle>
          </DialogHeader>
          {selectedInvoice &&
            (() => {
              const inv = selectedInvoice as any
              const cust = inv.customerId ?? inv.billingTo
              const customerName = cust
                ? cust.firstName && cust.lastName
                  ? `${cust.firstName} ${cust.lastName}`
                  : cust.name || '—'
                : '—'
              const customerEmail = cust?.email ?? ''
              const lineItems = inv.items || []
              const subtotal = inv.subtotal ?? 0
              const totalTax = inv.totalTax ?? inv.tax ?? 0
              const total = inv.total ?? inv.totalAmount ?? 0
              const amountPaid = inv.amountPaid ?? 0
              const amountDue = inv.amountDue ?? 0
              const taxBreakdown = inv.taxBreakdown
              return (
                <div className="space-y-4">
                  <div>
                    <p className="text-xs font-medium uppercase text-muted-foreground">Invoice Number</p>
                    <p className="font-semibold">{inv.invoiceNumber}</p>
                    {inv.bookingId && (
                      <span className="text-xs text-muted-foreground">Booking: {inv.bookingId}</span>
                    )}
                  </div>
                  <Separator />
                  <div>
                    <p className="text-xs font-medium uppercase text-muted-foreground">Bill To</p>
                    <p>{customerName}</p>
                    {customerEmail && <p className="text-sm text-muted-foreground">{customerEmail}</p>}
                    {cust?.phone && <p className="text-sm text-muted-foreground">{cust.phone}</p>}
                    {cust?.addressLine1 && (
                      <p className="text-xs">
                        {cust.addressLine1}, {cust.city} {cust.pincode}
                      </p>
                    )}
                  </div>
                  <Separator />
                  <div>
                    <p className="mb-2 text-xs font-medium uppercase text-muted-foreground">Line Items</p>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Description</TableHead>
                          <TableHead className="text-center">Qty</TableHead>
                          <TableHead className="text-right">Unit Price</TableHead>
                          <TableHead className="text-right">Amount</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {lineItems.map((item: any, index: number) => (
                          <TableRow key={index}>
                            <TableCell>{item.description}</TableCell>
                            <TableCell className="text-center">{item.quantity ?? 1}</TableCell>
                            <TableCell className="text-right">{formatCurrency(item.unitPrice)}</TableCell>
                            <TableCell className="text-right font-semibold">
                              {formatCurrency(
                                item.total ?? item.amount ?? (item.unitPrice ?? 0) * (item.quantity ?? 1)
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Subtotal</span>
                      <span>{formatCurrency(subtotal)}</span>
                    </div>
                    {(inv.discount ?? 0) > 0 && (
                      <div className="flex justify-between text-sm">
                        <span>Discount</span>
                        <span className="text-destructive">-{formatCurrency(inv.discount)}</span>
                      </div>
                    )}
                    {totalTax > 0 && (
                      <>
                        {taxBreakdown && (taxBreakdown.cgst != null || taxBreakdown.sgst != null) && (
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>GST (CGST + SGST)</span>
                            <span>{formatCurrency(taxBreakdown.totalGst ?? totalTax)}</span>
                          </div>
                        )}
                        <div className="flex justify-between text-sm">
                          <span>Tax (GST)</span>
                          <span>{formatCurrency(totalTax)}</span>
                        </div>
                      </>
                    )}
                    <Separator />
                    <div className="flex justify-between text-base font-bold">
                      <span>Total</span>
                      <span>{formatCurrency(total)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-green-600 dark:text-green-400">Amount Paid</span>
                      <span className="font-semibold">{formatCurrency(amountPaid)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Amount Due</span>
                      <span className="font-semibold">{formatCurrency(amountDue)}</span>
                    </div>
                  </div>
                  {inv.notes && (
                    <>
                      <Separator />
                      <div>
                        <p className="text-xs font-medium uppercase text-muted-foreground">Notes</p>
                        <p className="text-sm">{inv.notes}</p>
                      </div>
                    </>
                  )}
                </div>
              )
            })()}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDetailsDialogOpen(false)}>
              Close
            </Button>
            <Button type="button" onClick={() => selectedInvoice && void downloadPdfFor(selectedInvoice)}>
              <Download className="mr-2 h-4 w-4" />
              Download PDF
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={generateDialogOpen} onOpenChange={(o) => !generateSubmitting && setGenerateDialogOpen(o)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Generate invoice from booking
            </DialogTitle>
          </DialogHeader>
          <div
            className="rounded-md border border-sky-200 bg-sky-50 p-3 text-sm dark:border-sky-900 dark:bg-sky-950/40"
            role="status"
          >
            Enter a booking ID. The server will create or refresh the invoice for that booking (same flow as when a job
            completes).
          </div>
          <div className="space-y-2">
            <Label htmlFor="booking-gen">Booking ID</Label>
            <Input
              id="booking-gen"
              placeholder="MongoDB ObjectId of the booking"
              value={bookingIdForGenerate}
              onChange={(e) => setBookingIdForGenerate(e.target.value)}
              disabled={generateSubmitting}
            />
            <p className="text-xs text-muted-foreground">You can copy this from the Bookings screen or booking details URL.</p>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" disabled={generateSubmitting} onClick={() => setGenerateDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              disabled={generateSubmitting || !bookingIdForGenerate.trim()}
              onClick={handleGenerateFromBooking}
            >
              {generateSubmitting ? 'Generating…' : 'Generate'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={bulkBookingsOpen} onOpenChange={(o) => !bulkBookingsRunning && setBulkBookingsOpen(o)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generate multiple invoices from bookings</DialogTitle>
          </DialogHeader>
          <div
            className="rounded-md border border-sky-200 bg-sky-50 p-3 text-sm dark:border-sky-900 dark:bg-sky-950/40"
            role="status"
          >
            Paste one booking Mongo ID per line (or separate with spaces/commas). The server runs the same flow as
            &quot;One from booking&quot; for each ID. Skips invalid lines.
          </div>
          <textarea
            className="flex min-h-[200px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            value={bulkBookingsText}
            onChange={(e) => setBulkBookingsText(e.target.value)}
            disabled={bulkBookingsRunning}
            placeholder={'507f1f77bcf86cd799439011\n507f191e810c19729de860ea'}
          />
          <DialogFooter>
            <Button type="button" variant="outline" disabled={bulkBookingsRunning} onClick={() => setBulkBookingsOpen(false)}>
              Cancel
            </Button>
            <Button type="button" disabled={bulkBookingsRunning} onClick={handleBulkGenerateFromBookings}>
              {bulkBookingsRunning ? 'Running…' : 'Generate all'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
