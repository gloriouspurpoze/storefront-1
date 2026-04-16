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
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  TextField,
  InputAdornment,
  Tab,
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Avatar,
  Stack,
  Divider,
  Paper,
  Alert,
  CircularProgress,
  Tooltip,
  alpha,
} from '@mui/material'
import Grid from '@mui/material/GridLegacy'
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  MoreVert as MoreIcon,
  Receipt as ReceiptIcon,
  AttachMoney as MoneyIcon,
  TrendingUp as TrendingUpIcon,
  Person as PersonIcon,
  CalendarToday as CalendarIcon,
  FileDownload as DownloadIcon,
  Email as EmailIcon,
  Refresh as RefreshIcon,
  Add as AddIcon,
  Visibility as ViewIcon,
  CheckCircle as PaidIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  Cancel as CancelledIcon,
  Description as InvoiceIcon,
} from '@mui/icons-material'
import { PageHeader } from '../../components/common/PageHeader'
import { StandardTable, type StandardTableColumn } from '../../components/common'
import { InvoicesService } from '../../services/api/invoices.service'
import type { Invoice } from '../../services/api/invoices.service'

export function Invoices() {
  const navigate = useNavigate()
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [filteredInvoices, setFilteredInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Filters and search
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState(0)
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)
  
  // Dialog states
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false)
  const [generateDialogOpen, setGenerateDialogOpen] = useState(false)
  const [bookingIdForGenerate, setBookingIdForGenerate] = useState('')
  const [generateSubmitting, setGenerateSubmitting] = useState(false)

  // Statistics
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

    // Apply search
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

    // Apply tab filters
    const getPaymentStatus = (inv: Invoice) => inv.paymentStatus ?? (inv as any).payment_status ?? ((inv as any).status === 'paid' ? 'paid' : 'pending')
    switch (activeTab) {
      case 1:
        filtered = filtered.filter(inv => getPaymentStatus(inv) === 'paid')
        break
      case 2:
        filtered = filtered.filter(inv => getPaymentStatus(inv) === 'pending')
        break
      case 3:
        filtered = filtered.filter(inv => getPaymentStatus(inv) === 'refunded')
        break
    }

    setFilteredInvoices(filtered)
  }

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, invoice: Invoice) => {
    setAnchorEl(event.currentTarget)
    setSelectedInvoice(invoice)
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
  }

  const handleViewDetails = () => {
    setDetailsDialogOpen(true)
    handleMenuClose()
  }

  const handleDownloadPDF = async () => {
    if (!selectedInvoice) return
    
    handleMenuClose()
    try {
      await InvoicesService.downloadInvoicePDF(selectedInvoice._id)
    } catch (error: any) {
      console.error('Failed to download invoice:', error)
    }
  }

  const handleEmailInvoice = async () => {
    if (!selectedInvoice) return
    
    handleMenuClose()
    try {
      await InvoicesService.emailInvoiceToCustomer(selectedInvoice._id)
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

  const getStatusColor = (status: string) => {
    switch (String(status).toLowerCase()) {
      case 'paid':
        return { color: '#4CAF50', bg: alpha('#4CAF50', 0.1) }
      case 'pending':
      case 'issued':
        return { color: '#FF9800', bg: alpha('#FF9800', 0.1) }
      case 'partially_paid':
        return { color: '#2196F3', bg: alpha('#2196F3', 0.1) }
      case 'refunded':
      case 'cancelled':
        return { color: '#9E9E9E', bg: alpha('#9E9E9E', 0.1) }
      default:
        return { color: '#757575', bg: alpha('#757575', 0.1) }
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <PaidIcon />
      case 'pending':
        return <ScheduleIcon />
      case 'refunded':
        return <CancelledIcon />
      default:
        return <ScheduleIcon />
    }
  }

  // Indian Rupee (INR) – industry standard for India
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

  // Normalize API invoice to a consistent shape (backend may send total, invoiceDate, status, billingTo)
  const normalizeInvoice = (inv: any): Invoice => {
    const totalAmount = inv.total ?? inv.totalAmount ?? 0
    const status = inv.status ?? inv.paymentStatus ?? 'issued'
    const paymentStatus = status === 'paid' ? 'paid' : status === 'refunded' ? 'refunded' : 'pending'
    const customer = inv.customerId ?? (inv.billingTo ? {
      _id: '',
      firstName: (inv.billingTo.name || '').split(' ')[0] || 'Customer',
      lastName: (inv.billingTo.name || '').split(' ').slice(1).join(' ') || '',
      email: inv.billingTo.email || '',
      phone: inv.billingTo.phone,
    } : null)
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
          <Typography variant="body2" fontWeight="600">
            {inv.invoiceNumber}
          </Typography>
          {inv.bookingId && (
            <Typography variant="caption" color="text.secondary" display="block">
              Booking: {inv.bookingId}
            </Typography>
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
        if (!name && !email) return <Typography variant="body2" color="text.secondary">—</Typography>
        return (
          <Box display="flex" alignItems="center" gap={1}>
            <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
              {(name || '?')[0]}
            </Avatar>
            <Box>
              <Typography variant="body2" fontWeight="500">{name || '—'}</Typography>
              {email && <Typography variant="caption" color="text.secondary" display="block">{email}</Typography>}
            </Box>
          </Box>
        )
      },
    },
    {
      id: 'issuedDate',
      label: 'Invoice Date',
      sortable: true,
      render: (_, inv) => (
        <Box display="flex" alignItems="center" gap={0.5}>
          <CalendarIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
          <Typography variant="body2">{formatDate(inv.issuedDate ?? (inv as any).invoiceDate)}</Typography>
        </Box>
      ),
    },
    {
      id: 'dueDate',
      label: 'Due Date',
      sortable: true,
      render: (_, inv) =>
        inv.dueDate ? (
          <Typography variant="body2">{formatDate(inv.dueDate)}</Typography>
        ) : (
          <Typography variant="body2" color="text.secondary">
            N/A
          </Typography>
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
          <Box sx={{ textAlign: 'right' }}>
            <Typography variant="body2" fontWeight="600">{formatCurrency(total)}</Typography>
            {due != null && Number(due) > 0 && (
              <Typography variant="caption" color="text.secondary">Due: {formatCurrency(Number(due))}</Typography>
            )}
          </Box>
        )
      },
    },
    {
      id: 'paymentStatus',
      label: 'Status',
      sortable: true,
      valueGetter: (inv) => inv.paymentStatus ?? (inv as any).payment_status ?? (inv as any).status ?? '',
      render: (_, inv) => {
        const status = String(
          inv.paymentStatus ?? (inv as any).payment_status ?? (inv as any).status ?? 'issued'
        )
        const display = status === 'issued' ? 'Pending' : status.replace('_', ' ')
        const config = getStatusColor(status === 'issued' ? 'pending' : status)
        return (
          <Chip
            label={display}
            size="small"
            icon={getStatusIcon(status === 'issued' ? 'pending' : status)}
            sx={{ bgcolor: config.bg, color: config.color, fontWeight: 600 }}
          />
        )
      },
    },
  ]

  return (
    <Box sx={{ p: 3 }}>
      <PageHeader
        title="Invoices"
        subtitle="Manage and track all billing documents"
        icon={<ReceiptIcon />}
        action={
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setGenerateDialogOpen(true)}
            sx={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            }}
          >
            Generate from booking
          </Button>
        }
      />

      {/* Stats Cards – Total Paid Amount, Total Pending Amount, counts */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              background: 'linear-gradient(135deg, #4CAF50 0%, #2E7D32 100%)',
              color: 'white',
            }}
          >
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography variant="body2" sx={{ opacity: 0.9, mb: 1 }}>
                    Total Paid Amount
                  </Typography>
                  <Typography variant="h4" fontWeight="700">
                    {formatCurrency(stats.totalPaidAmount)}
                  </Typography>
                  <Typography variant="caption" sx={{ opacity: 0.9 }}>
                    {stats.paidInvoices} invoice{stats.paidInvoices !== 1 ? 's' : ''} paid
                  </Typography>
                </Box>
                <PaidIcon sx={{ fontSize: 48, opacity: 0.3 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              background: 'linear-gradient(135deg, #FF9800 0%, #E65100 100%)',
              color: 'white',
            }}
          >
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography variant="body2" sx={{ opacity: 0.9, mb: 1 }}>
                    Total Pending Amount
                  </Typography>
                  <Typography variant="h4" fontWeight="700">
                    {formatCurrency(stats.totalPendingAmount)}
                  </Typography>
                  <Typography variant="caption" sx={{ opacity: 0.9 }}>
                    {stats.pendingInvoices} invoice{stats.pendingInvoices !== 1 ? 's' : ''} pending
                  </Typography>
                </Box>
                <ScheduleIcon sx={{ fontSize: 48, opacity: 0.3 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    Total Invoices
                  </Typography>
                  <Typography variant="h4" fontWeight="700">
                    {stats.totalInvoices}
                  </Typography>
                </Box>
                <InvoiceIcon sx={{ fontSize: 48, color: '#2196F3', opacity: 0.3 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    Summary
                  </Typography>
                  <Typography variant="body2" fontWeight="600" color="success.main">
                    Paid: {formatCurrency(stats.totalPaidAmount)}
                  </Typography>
                  <Typography variant="body2" fontWeight="600" color="warning.main">
                    Pending: {formatCurrency(stats.totalPendingAmount)}
                  </Typography>
                </Box>
                <MoneyIcon sx={{ fontSize: 48, color: '#9E9E9E', opacity: 0.3 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Search and Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" gap={2} flexWrap="wrap">
            <TextField
              placeholder="Search by invoice number, customer name, or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              sx={{ flex: 1, minWidth: 300 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={loadInvoices}
            >
              Refresh
            </Button>
            <Button
              variant="outlined"
              startIcon={<FilterIcon />}
            >
              Advanced Filters
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Tabs and Table */}
      <Card>
        <Tabs
          value={activeTab}
          onChange={(_, newValue) => setActiveTab(newValue)}
          sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}
        >
          <Tab label="All Invoices" />
          <Tab label="Paid" />
          <Tab label="Pending" />
          <Tab label="Refunded" />
        </Tabs>

        {error ? (
          <Box p={3}>
            <Alert severity="error">{error}</Alert>
          </Box>
        ) : (
          <Box sx={{ px: 2, pb: 2 }}>
            <StandardTable<Invoice>
              columns={invoiceColumns}
              data={filteredInvoices}
              getRowId={(row) => row._id ?? ''}
              loading={loading}
              emptyMessage="No invoices found"
              emptyDescription={
                searchQuery || activeTab !== 0
                  ? 'Try adjusting your filters'
                  : 'Generate your first invoice to get started'
              }
              error={null}
              showSearch={false}
              renderActions={(invoice) => (
                <IconButton
                  size="small"
                  onClick={(e) => handleMenuOpen(e, invoice)}
                >
                  <MoreIcon />
                </IconButton>
              )}
              size="small"
              minHeight={380}
            />
          </Box>
        )}
      </Card>

      {/* Actions Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleViewDetails}>
          <ViewIcon sx={{ mr: 1, fontSize: 20 }} />
          View Details
        </MenuItem>
        <MenuItem onClick={handleDownloadPDF}>
          <DownloadIcon sx={{ mr: 1, fontSize: 20 }} />
          Download PDF
        </MenuItem>
        <MenuItem onClick={handleEmailInvoice}>
          <EmailIcon sx={{ mr: 1, fontSize: 20 }} />
          Email to Customer
        </MenuItem>
      </Menu>

      {/* Invoice Details Dialog – industry standard (INR, GST, paid/due) */}
      <Dialog
        open={detailsDialogOpen}
        onClose={() => setDetailsDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Typography variant="h6" fontWeight="600">
            Invoice Details
          </Typography>
        </DialogTitle>
        <DialogContent dividers>
          {selectedInvoice && (() => {
            const inv = selectedInvoice as any
            const cust = inv.customerId ?? inv.billingTo
            const customerName = cust ? (cust.firstName && cust.lastName ? `${cust.firstName} ${cust.lastName}` : cust.name || '—') : '—'
            const customerEmail = cust?.email ?? ''
            const items = inv.items || []
            const subtotal = inv.subtotal ?? 0
            const totalTax = inv.totalTax ?? inv.tax ?? 0
            const total = inv.total ?? inv.totalAmount ?? 0
            const amountPaid = inv.amountPaid ?? 0
            const amountDue = inv.amountDue ?? 0
            const taxBreakdown = inv.taxBreakdown
            return (
              <Stack spacing={2}>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>Invoice Number</Typography>
                  <Typography variant="body1" fontWeight="600">{inv.invoiceNumber}</Typography>
                  {inv.bookingId && (
                    <Typography variant="caption" color="text.secondary">Booking: {inv.bookingId}</Typography>
                  )}
                </Box>
                <Divider />
                <Box>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>Bill To</Typography>
                  <Typography variant="body1">{customerName}</Typography>
                  {customerEmail && <Typography variant="body2" color="text.secondary">{customerEmail}</Typography>}
                  {cust?.phone && <Typography variant="body2" color="text.secondary">{cust.phone}</Typography>}
                  {cust?.addressLine1 && <Typography variant="caption" display="block">{cust.addressLine1}, {cust.city} {cust.pincode}</Typography>}
                </Box>
                <Divider />
                <Box>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>Line Items</Typography>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Description</TableCell>
                        <TableCell align="center">Qty</TableCell>
                        <TableCell align="right">Unit Price</TableCell>
                        <TableCell align="right">Amount</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {items.map((item: any, index: number) => (
                        <TableRow key={index}>
                          <TableCell>{item.description}</TableCell>
                          <TableCell align="center">{item.quantity ?? 1}</TableCell>
                          <TableCell align="right">{formatCurrency(item.unitPrice)}</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 600 }}>
                            {formatCurrency(item.total ?? item.amount ?? (item.unitPrice ?? 0) * (item.quantity ?? 1))}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Box>
                <Divider />
                <Box>
                  <Stack spacing={1}>
                    <Box display="flex" justifyContent="space-between">
                      <Typography variant="body2">Subtotal</Typography>
                      <Typography variant="body2">{formatCurrency(subtotal)}</Typography>
                    </Box>
                    {(inv.discount ?? 0) > 0 && (
                      <Box display="flex" justifyContent="space-between">
                        <Typography variant="body2">Discount</Typography>
                        <Typography variant="body2" color="error">-{formatCurrency(inv.discount)}</Typography>
                      </Box>
                    )}
                    {totalTax > 0 && (
                      <>
                        {taxBreakdown && (taxBreakdown.cgst != null || taxBreakdown.sgst != null) && (
                          <Box display="flex" justifyContent="space-between">
                            <Typography variant="caption" color="text.secondary">GST (CGST + SGST)</Typography>
                            <Typography variant="caption">{formatCurrency(taxBreakdown.totalGst ?? totalTax)}</Typography>
                          </Box>
                        )}
                        <Box display="flex" justifyContent="space-between">
                          <Typography variant="body2">Tax (GST)</Typography>
                          <Typography variant="body2">{formatCurrency(totalTax)}</Typography>
                        </Box>
                      </>
                    )}
                    <Divider />
                    <Box display="flex" justifyContent="space-between">
                      <Typography variant="body1" fontWeight="700">Total</Typography>
                      <Typography variant="body1" fontWeight="700">{formatCurrency(total)}</Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between">
                      <Typography variant="body2" color="success.main">Amount Paid</Typography>
                      <Typography variant="body2" fontWeight="600">{formatCurrency(amountPaid)}</Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between">
                      <Typography variant="body2" color="text.secondary">Amount Due</Typography>
                      <Typography variant="body2" fontWeight="600">{formatCurrency(amountDue)}</Typography>
                    </Box>
                  </Stack>
                </Box>
                {inv.notes && (
                  <>
                    <Divider />
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>Notes</Typography>
                      <Typography variant="body2">{inv.notes}</Typography>
                    </Box>
                  </>
                )}
              </Stack>
            )
          })()}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsDialogOpen(false)}>Close</Button>
          <Button
            variant="contained"
            startIcon={<DownloadIcon />}
            onClick={handleDownloadPDF}
          >
            Download PDF
          </Button>
        </DialogActions>
      </Dialog>

      {/* Generate Invoice Dialog */}
      <Dialog
        open={generateDialogOpen}
        onClose={() => !generateSubmitting && setGenerateDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <InvoiceIcon color="primary" />
          Generate invoice from booking
        </DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mt: 1, mb: 2 }}>
            Enter a booking ID. The server will create or refresh the invoice for that booking (same flow as when a job completes).
          </Alert>
          <TextField
            fullWidth
            label="Booking ID"
            placeholder="MongoDB ObjectId of the booking"
            value={bookingIdForGenerate}
            onChange={(e) => setBookingIdForGenerate(e.target.value)}
            disabled={generateSubmitting}
            sx={{ mt: 1 }}
            helperText="You can copy this from the Bookings screen or booking details URL."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setGenerateDialogOpen(false)} disabled={generateSubmitting}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleGenerateFromBooking}
            disabled={generateSubmitting || !bookingIdForGenerate.trim()}
          >
            {generateSubmitting ? 'Generating…' : 'Generate'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

