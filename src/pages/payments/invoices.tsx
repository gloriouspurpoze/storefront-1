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

  // Statistics
  const [stats, setStats] = useState({
    totalRevenue: 0,
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
        const invoicesData = response.data.invoices || []
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
    const totalRevenue = invoicesData
      .filter(inv => inv.paymentStatus === 'paid')
      .reduce((sum, inv) => sum + inv.totalAmount, 0)
    
    const paidCount = invoicesData.filter(inv => inv.paymentStatus === 'paid').length
    const pendingCount = invoicesData.filter(inv => inv.paymentStatus === 'pending').length

    setStats({
      totalRevenue,
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
      filtered = filtered.filter(
        (invoice) =>
          invoice.invoiceNumber.toLowerCase().includes(query) ||
          `${invoice.customerId.firstName} ${invoice.customerId.lastName}`.toLowerCase().includes(query) ||
          invoice.customerId.email.toLowerCase().includes(query)
      )
    }

    // Apply tab filters
    switch (activeTab) {
      case 1: // Paid
        filtered = filtered.filter(inv => inv.paymentStatus === 'paid')
        break
      case 2: // Pending
        filtered = filtered.filter(inv => inv.paymentStatus === 'pending')
        break
      case 3: // Refunded
        filtered = filtered.filter(inv => inv.paymentStatus === 'refunded')
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return { color: '#4CAF50', bg: alpha('#4CAF50', 0.1) }
      case 'pending':
        return { color: '#FF9800', bg: alpha('#FF9800', 0.1) }
      case 'partially_paid':
        return { color: '#2196F3', bg: alpha('#2196F3', 0.1) }
      case 'refunded':
        return { color: '#9E9E9E', bg: alpha('#9E9E9E', 0.1) }
      default:
        return { color: '#9E9E9E', bg: alpha('#9E9E9E', 0.1) }
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
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
      label: 'Customer',
      sortable: true,
      valueGetter: (inv) => {
        const c = inv.customerId as any
        return c ? `${c.firstName ?? ''} ${c.lastName ?? ''} ${c.email ?? ''}` : ''
      },
      render: (_, inv) => {
        const c = inv.customerId as any
        if (!c) return '—'
        return (
          <Box display="flex" alignItems="center" gap={1}>
            <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
              {(c.firstName ?? '?')[0]}
            </Avatar>
            <Box>
              <Typography variant="body2" fontWeight="500">
                {c.firstName} {c.lastName}
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block">
                {c.email}
              </Typography>
            </Box>
          </Box>
        )
      },
    },
    {
      id: 'issuedDate',
      label: 'Issue Date',
      sortable: true,
      render: (_, inv) => (
        <Box display="flex" alignItems="center" gap={0.5}>
          <CalendarIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
          <Typography variant="body2">{formatDate(inv.issuedDate)}</Typography>
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
      render: (_, inv) => (
        <Typography variant="body2" fontWeight="600">
          {formatCurrency(inv.totalAmount)}
        </Typography>
      ),
    },
    {
      id: 'paymentStatus',
      label: 'Status',
      sortable: true,
      valueGetter: (inv) => inv.paymentStatus ?? (inv as any).payment_status ?? '',
      render: (_, inv) => {
        const status = inv.paymentStatus ?? (inv as any).payment_status ?? ''
        const config = getStatusColor(status)
        return (
          <Chip
            label={String(status).replace('_', ' ').toUpperCase()}
            size="small"
            icon={getStatusIcon(status)}
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
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Chip
              label="Coming Soon"
              color="info"
              size="small"
              sx={{ fontWeight: 600 }}
            />
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setGenerateDialogOpen(true)}
              disabled
              sx={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                opacity: 0.6,
                cursor: 'not-allowed',
                '&:hover': {
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                },
              }}
            >
              Generate Invoice
            </Button>
          </Box>
        }
      />

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
            }}
          >
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography variant="body2" sx={{ opacity: 0.9, mb: 1 }}>
                    Total Revenue
                  </Typography>
                  <Typography variant="h4" fontWeight="700">
                    {formatCurrency(stats.totalRevenue)}
                  </Typography>
                </Box>
                <MoneyIcon sx={{ fontSize: 48, opacity: 0.3 }} />
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
                    Paid Invoices
                  </Typography>
                  <Typography variant="h4" fontWeight="700" color="#4CAF50">
                    {stats.paidInvoices}
                  </Typography>
                </Box>
                <PaidIcon sx={{ fontSize: 48, color: '#4CAF50', opacity: 0.3 }} />
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
                    Pending Invoices
                  </Typography>
                  <Typography variant="h4" fontWeight="700" color="#FF9800">
                    {stats.pendingInvoices}
                  </Typography>
                </Box>
                <ScheduleIcon sx={{ fontSize: 48, color: '#FF9800', opacity: 0.3 }} />
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
              getRowId={(row) => row._id ?? row.id ?? ''}
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

      {/* Invoice Details Dialog */}
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
          {selectedInvoice && (
            <Stack spacing={2}>
              <Box>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Invoice Number
                </Typography>
                <Typography variant="body1" fontWeight="600">
                  {selectedInvoice.invoiceNumber}
                </Typography>
              </Box>

              <Divider />

              <Box>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Customer
                </Typography>
                <Typography variant="body1">
                  {selectedInvoice.customerId.firstName} {selectedInvoice.customerId.lastName}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {selectedInvoice.customerId.email}
                </Typography>
              </Box>

              <Divider />

              <Box>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Items
                </Typography>
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
                    {selectedInvoice.items.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>{item.description}</TableCell>
                        <TableCell align="center">{item.quantity}</TableCell>
                        <TableCell align="right">{formatCurrency(item.unitPrice)}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600 }}>
                          {formatCurrency(item.amount)}
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
                    <Typography variant="body2">Subtotal:</Typography>
                    <Typography variant="body2">{formatCurrency(selectedInvoice.subtotal)}</Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body2">Tax:</Typography>
                    <Typography variant="body2">{formatCurrency(selectedInvoice.tax)}</Typography>
                  </Box>
                  {selectedInvoice.discount > 0 && (
                    <Box display="flex" justifyContent="space-between">
                      <Typography variant="body2">Discount:</Typography>
                      <Typography variant="body2" color="error">
                        -{formatCurrency(selectedInvoice.discount)}
                      </Typography>
                    </Box>
                  )}
                  <Divider />
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="h6" fontWeight="700">Total:</Typography>
                    <Typography variant="h6" fontWeight="700">
                      {formatCurrency(selectedInvoice.totalAmount)}
                    </Typography>
                  </Box>
                </Stack>
              </Box>

              {selectedInvoice.notes && (
                <>
                  <Divider />
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Notes
                    </Typography>
                    <Typography variant="body2">{selectedInvoice.notes}</Typography>
                  </Box>
                </>
              )}
            </Stack>
          )}
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
        onClose={() => setGenerateDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <InvoiceIcon color="primary" />
          Generate New Invoice
          <Chip label="Coming Soon" color="info" size="small" sx={{ ml: 'auto' }} />
        </DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mt: 2, mb: 2 }}>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
              Manual Invoice Generation
            </Typography>
            <Typography variant="body2">
              Invoice generation from the admin panel is coming soon. Currently, invoices are automatically generated when bookings are completed.
            </Typography>
          </Alert>
          <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
              Current Invoice Generation:
            </Typography>
            <Stack spacing={1}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CheckCircleIcon color="success" fontSize="small" />
                <Typography variant="body2">
                  Automatically created when a booking is completed
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CheckCircleIcon color="success" fontSize="small" />
                <Typography variant="body2">
                  Generated when a professional is assigned to a booking
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <ScheduleIcon color="info" fontSize="small" />
                <Typography variant="body2" color="text.secondary">
                  Manual generation from admin panel - Coming soon
                </Typography>
              </Box>
            </Stack>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setGenerateDialogOpen(false)} variant="contained">
            Got it
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

