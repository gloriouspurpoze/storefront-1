import React, { useState, useEffect } from 'react'
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
} from '@mui/material'
import Grid from '@mui/material/GridLegacy'
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  MoreVert as MoreIcon,
  CheckCircle as CheckIcon,
  Cancel as CancelIcon,
  Schedule as PendingIcon,
  Receipt as ReceiptIcon,
  AttachMoney as MoneyIcon,
  TrendingUp as TrendingUpIcon,
  Person as PersonIcon,
  CalendarToday as CalendarIcon,
  CreditCard as CreditCardIcon,
  AccountBalance as BankIcon,
  Refresh as RefreshIcon,
  FileDownload as DownloadIcon,
} from '@mui/icons-material'
import { PageHeader } from '../../components/common/PageHeader'
import { PaymentsService } from '../../services/api/payments.service'
import type { Payment } from '../../types'

export function Payments() {
  const [searchQuery, setSearchQuery] = useState('')
  const [currentTab, setCurrentTab] = useState(0)
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [actionMenuAnchor, setActionMenuAnchor] = useState<null | HTMLElement>(null)
  const [actionPayment, setActionPayment] = useState<Payment | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Real payments data from API
  const [payments, setPayments] = useState<Payment[]>([])
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  })

  // Real stats from API
  const [stats, setStats] = useState({
    totalRevenue: 0,
    pendingPayments: 0,
    completedPayments: 0,
    refundedAmount: 0,
  })

  useEffect(() => {
    // Reset to first page when filter context changes
    setPagination((prev) => ({ ...prev, page: 1 }))
  }, [currentTab, searchQuery])

  useEffect(() => {
    fetchPaymentsData()
  }, [currentTab, searchQuery, pagination.page, pagination.limit])

  const fetchPaymentsData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Fetch payment stats
      const statsResponse = await PaymentsService.getPaymentStats()
      if (statsResponse.success && statsResponse.data) {
        setStats({
          totalRevenue: statsResponse.data.totalRevenue || 0,
          pendingPayments: statsResponse.data.byStatus?.pending || 0,
          completedPayments: statsResponse.data.byStatus?.completed || 0,
          refundedAmount: statsResponse.data.totalRefunds || 0,
        })
      }
      
      // Fetch payments list
      const status = tabs[currentTab].value
      const query: any = { 
        page: pagination.page, 
        limit: pagination.limit 
      }
      if (status !== 'all') query.status = status
      if (searchQuery) query.search = searchQuery
      
      const paymentsResponse = await PaymentsService.getPayments(query)
      if (paymentsResponse.success && paymentsResponse.data) {
        setPayments(paymentsResponse.data.payments || [])
        if (paymentsResponse.data.pagination) {
          setPagination((prev) => ({ ...prev, ...paymentsResponse.data.pagination }))
        }
      } else {
        setPayments([])
      }
      
    } catch (err: any) {
      console.error('Error fetching payments:', err)
      setError(err?.message || 'Failed to load payments')
    } finally {
      setLoading(false)
    }
  }

  const tabs = [
    { label: 'All Payments', value: 'all' },
    { label: 'Completed', value: 'completed' },
    { label: 'Pending', value: 'pending' },
    { label: 'Failed', value: 'failed' },
    { label: 'Refunded', value: 'refunded' },
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'warning'
      case 'paid':
      case 'completed':
        return 'success'
      case 'failed':
        return 'error'
      case 'refunded':
        return 'info'
      default:
        return 'default'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <PendingIcon fontSize="small" />
      case 'paid':
      case 'completed':
        return <CheckIcon fontSize="small" />
      case 'failed':
      case 'refunded':
        return <CancelIcon fontSize="small" />
      default:
        return <ReceiptIcon fontSize="small" />
    }
  }

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'card':
        return <CreditCardIcon fontSize="small" />
      case 'bank':
        return <BankIcon fontSize="small" />
      case 'wallet':
      case 'cash':
        return <MoneyIcon fontSize="small" />
      default:
        return <MoneyIcon fontSize="small" />
    }
  }

  const filteredPayments = payments

  const handleActionMenuOpen = (event: React.MouseEvent<HTMLElement>, payment: Payment) => {
    setActionMenuAnchor(event.currentTarget)
    setActionPayment(payment)
  }

  const handleActionMenuClose = () => {
    setActionMenuAnchor(null)
    setActionPayment(null)
  }

  const handleViewDetails = (payment: Payment) => {
    setSelectedPayment(payment)
    setDetailsOpen(true)
    handleActionMenuClose()
  }

  const handleRefund = async () => {
    if (!actionPayment) return
    try {
      await PaymentsService.refundPayment(actionPayment.id)
      fetchPaymentsData() // Refresh list
      handleActionMenuClose()
    } catch (err: any) {
      setError(err?.message || 'Failed to process refund')
    }
  }

  const handleDownloadReceipt = () => {
    if (actionPayment) {
      alert(`Download receipt for ${actionPayment.id} - Feature coming soon!`)
      handleActionMenuClose()
    }
  }

  return (
    <Box>
      {/* Page Header */}
      <PageHeader
        title="Payments & Transactions"
        subtitle="Manage payments, transactions, and refunds"
        action={
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              sx={{ borderRadius: 2 }}
              onClick={() => alert('Export feature coming soon!')}
            >
              Export Report
            </Button>
            <Button
              variant="contained"
              startIcon={<RefreshIcon />}
              sx={{ borderRadius: 2 }}
              onClick={fetchPaymentsData}
              disabled={loading}
            >
              Refresh
            </Button>
          </Box>
        }
      />

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderRadius: 2 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: 2,
                    bgcolor: 'success.light',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <MoneyIcon sx={{ color: 'success.main' }} />
                </Box>
                <Chip label="+12%" color="success" size="small" />
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
                ${stats.totalRevenue.toLocaleString()}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Revenue
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderRadius: 2 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: 2,
                    bgcolor: 'warning.light',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <PendingIcon sx={{ color: 'warning.main' }} />
                </Box>
                <Chip label={stats.pendingPayments} size="small" />
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
                {stats.pendingPayments}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Pending Payments
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderRadius: 2 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: 2,
                    bgcolor: 'primary.light',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <CheckIcon sx={{ color: 'primary.main' }} />
                </Box>
                <Chip label="+8%" color="success" size="small" />
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
                {stats.completedPayments}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Completed Payments
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderRadius: 2 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: 2,
                    bgcolor: 'info.light',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <RefreshIcon sx={{ color: 'info.main' }} />
                </Box>
                <Typography variant="caption" color="text.secondary">
                  This Month
                </Typography>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
                ${stats.refundedAmount.toFixed(2)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Refunded Amount
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters and Search */}
      <Card sx={{ mb: 3, borderRadius: 2 }}>
        <CardContent>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
            <TextField
              placeholder="Search by transaction ID, booking ID, customer, or provider..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              size="small"
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
              startIcon={<FilterIcon />}
              sx={{ borderRadius: 1.5 }}
            >
              Filters
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Card sx={{ borderRadius: 2 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs
            value={currentTab}
            onChange={(_, newValue) => setCurrentTab(newValue)}
            variant="scrollable"
            scrollButtons="auto"
          >
            {tabs.map((tab, index) => (
              <Tab key={index} label={tab.label} />
            ))}
          </Tabs>
        </Box>

        <CardContent>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Transaction ID</TableCell>
                  <TableCell>Booking</TableCell>
                  <TableCell>Customer</TableCell>
                  <TableCell>Provider</TableCell>
                  <TableCell>Service</TableCell>
                  <TableCell>Payment Method</TableCell>
                  <TableCell>Amount</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={10} align="center" sx={{ py: 4 }}>
                      <CircularProgress />
                    </TableCell>
                  </TableRow>
                ) : filteredPayments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} align="center" sx={{ py: 4 }}>
                      <Typography variant="body1" color="text.secondary">
                        No payments found
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPayments.map((payment) => (
                    <TableRow key={payment.id} hover>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {(payment as any).transaction_id || payment.transactionId || `TXN-${payment.id.slice(0, 8)}`}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {(payment as any).booking_id || payment.bookingId || 'N/A'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Avatar sx={{ width: 32, height: 32 }}>
                            {(payment as any).customer_name?.charAt(0) ||
                              payment.customerName?.charAt(0) ||
                              (payment as any).customer?.name?.charAt(0) ||
                              'C'}
                          </Avatar>
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              {(payment as any).customer_name ||
                                payment.customerName ||
                                (payment as any).customer?.name ||
                                'N/A'}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {(payment as any).customer_email ||
                                payment.customerEmail ||
                                (payment as any).customer?.email ||
                                ''}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {(payment as any).provider_name ||
                            payment.providerName ||
                            (payment as any).provider?.name ||
                            'N/A'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {(payment as any).provider_email ||
                            payment.providerEmail ||
                            (payment as any).provider?.email ||
                            ''}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {(payment as any).service_name ||
                            payment.serviceName ||
                            (payment as any).service ||
                            'N/A'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {payment.category || ''}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {(() => {
                          const method =
                            (payment as any).payment_method || payment.paymentMethod || 'card'
                          return (
                        <Chip
                          icon={getPaymentMethodIcon(method)}
                          label={String(method).toUpperCase()}
                          size="small"
                          variant="outlined"
                        />
                          )
                        })()}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          ${payment.amount || 0}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Fee: ${(payment as any).platform_fee || payment.platformFee || payment.fee || 0}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={payment.status}
                          color={getStatusColor(payment.status)}
                          size="small"
                          icon={getStatusIcon(payment.status)}
                          sx={{ textTransform: 'capitalize' }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {(payment as any).created_at || payment.createdAt || 'N/A'}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <IconButton
                          size="small"
                          onClick={(e) => handleActionMenuOpen(e, payment)}
                        >
                          <MoreIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Action Menu */}
      <Menu
        anchorEl={actionMenuAnchor}
        open={Boolean(actionMenuAnchor)}
        onClose={handleActionMenuClose}
      >
        <MenuItem onClick={() => actionPayment && handleViewDetails(actionPayment)}>
          View Details
        </MenuItem>
        <MenuItem onClick={handleDownloadReceipt}>
          Download Receipt
        </MenuItem>
        {actionPayment?.status === 'completed' && (
          <>
            <Divider />
            <MenuItem onClick={handleRefund} sx={{ color: 'error.main' }}>
              Process Refund
            </MenuItem>
          </>
        )}
      </Menu>

      {/* Payment Details Dialog */}
      <Dialog
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Payment Details
          </Typography>
        </DialogTitle>
        <DialogContent dividers>
          {selectedPayment && (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Paper sx={{ p: 2, bgcolor: 'primary.main', color: 'white' }}>
                  <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
                    {selectedPayment.transactionId}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Chip
                      label={selectedPayment.status}
                      size="small"
                      sx={{
                        bgcolor: 'white',
                        color: 'primary.main',
                        fontWeight: 600,
                        textTransform: 'capitalize',
                      }}
                    />
                    <Chip
                      label={`Booking: ${selectedPayment.bookingId}`}
                      size="small"
                      sx={{
                        bgcolor: 'rgba(255,255,255,0.2)',
                        color: 'white',
                      }}
                    />
                  </Box>
                </Paper>
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Customer Information
                </Typography>
                <Stack spacing={1.5}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PersonIcon fontSize="small" color="action" />
                    <Typography variant="body2">
                      {selectedPayment.customerName || (selectedPayment as any).customer?.name || 'N/A'}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body2">
                      {selectedPayment.customerEmail || (selectedPayment as any).customer?.email || ''}
                    </Typography>
                  </Box>
                </Stack>
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Provider Information
                </Typography>
                <Stack spacing={1.5}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PersonIcon fontSize="small" color="action" />
                    <Typography variant="body2">
                      {selectedPayment.providerName || (selectedPayment as any).provider?.name || 'N/A'}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body2">
                      {selectedPayment.providerEmail || (selectedPayment as any).provider?.email || ''}
                    </Typography>
                  </Box>
                </Stack>
              </Grid>

              <Grid item xs={12}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Payment Breakdown
                </Typography>
                <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                  <Stack spacing={1.5}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2">Service Amount:</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        ${selectedPayment.amount}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">
                        Platform Fee (10%):
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        -${selectedPayment.fee}
                      </Typography>
                    </Box>
                    <Divider />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body1" sx={{ fontWeight: 600 }}>
                        Net Amount to Provider:
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 700, color: 'success.main' }}>
                        ${selectedPayment.netAmount}
                      </Typography>
                    </Box>
                  </Stack>
                </Paper>
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Service Details
                </Typography>
                <Stack spacing={1}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {selectedPayment.serviceName || (selectedPayment as any).service_name || (selectedPayment as any).service || 'N/A'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {selectedPayment.category || (selectedPayment as any).category_name || ''}
                  </Typography>
                </Stack>
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Payment Information
                </Typography>
                <Stack spacing={1}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {getPaymentMethodIcon(selectedPayment.paymentMethod)}
                    <Typography variant="body2">
                      {selectedPayment.paymentMethod.toUpperCase()}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CalendarIcon fontSize="small" color="action" />
                    <Typography variant="body2">{selectedPayment.createdAt}</Typography>
                  </Box>
                  {selectedPayment.completedAt && (
                    <Typography variant="caption" color="text.secondary">
                      Completed: {selectedPayment.completedAt}
                    </Typography>
                  )}
                </Stack>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsOpen(false)}>Close</Button>
          <Button variant="outlined" onClick={handleDownloadReceipt}>
            Download Receipt
          </Button>
          {selectedPayment?.status === 'completed' && (
            <Button variant="contained" color="error" onClick={handleRefund}>
              Process Refund
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  )
}

