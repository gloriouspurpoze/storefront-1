import React, { useState, useEffect } from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  LinearProgress,
  Stack,
  Divider,
  Paper,
  Alert,
  IconButton,
  Tooltip,
  CircularProgress,
} from '@mui/material'
import Grid from '@mui/material/GridLegacy'
import {
  AttachMoney as MoneyIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Schedule as PendingIcon,
  CheckCircle as CheckIcon,
  CalendarToday as CalendarIcon,
  Receipt as ReceiptIcon,
  FileDownload as DownloadIcon,
  AccountBalance as BankIcon,
  Info as InfoIcon,
} from '@mui/icons-material'
import { PaymentsService } from '../../services/api/payments.service'
import type { Payment } from '../../types'
import { downloadCsv } from '../../lib/exportUtils'

export function ProviderEarnings() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Real earnings data from API
  const [earnings, setEarnings] = useState({
    totalEarnings: 0,
    pendingPayouts: 0,
    completedPayouts: 0,
    thisMonth: 0,
    lastMonth: 0,
    averagePerJob: 0,
    totalJobs: 0,
  })

  // Real transactions from API
  const [transactions, setTransactions] = useState<Payment[]>([])

  useEffect(() => {
    fetchEarningsData()
  }, [])

  const fetchEarningsData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Get earnings summary
      const statsRes = await PaymentsService.getProviderPaymentStats()
      if (statsRes?.success && statsRes.data) {
        setEarnings(statsRes.data)
      }
      
      // Get transactions (limit 10 for page)
      const transactionsRes = await PaymentsService.getProviderTransactions({ 
        page: 1, 
        limit: 10 
      })
      if (transactionsRes?.success && transactionsRes.data) {
        setTransactions(transactionsRes.data.payments || [])
      } else {
        setTransactions([])
      }
      
    } catch (err: any) {
      console.error('Error fetching earnings data:', err)
      setError(err?.message || 'Failed to load earnings data')
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'success'
      case 'processing':
        return 'info'
      case 'pending':
        return 'warning'
      default:
        return 'default'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <CheckIcon fontSize="small" />
      case 'processing':
      case 'pending':
        return <PendingIcon fontSize="small" />
      default:
        return <ReceiptIcon fontSize="small" />
    }
  }

  const monthlyGrowth = ((earnings.thisMonth - earnings.lastMonth) / earnings.lastMonth * 100).toFixed(1)
  const isGrowthPositive = parseFloat(monthlyGrowth) > 0

  const handleDownloadStatement = async () => {
    try {
      const res = await PaymentsService.getProviderTransactions({ page: 1, limit: 500 })
      const rows: unknown[][] = []
      const list =
        res?.success && res.data
          ? (res.data as { payments?: Payment[] }).payments || []
          : transactions
      rows.push(['Summary', 'Value'])
      rows.push(['Total earnings', earnings.totalEarnings])
      rows.push(['Pending payouts', earnings.pendingPayouts])
      rows.push(['Completed payouts', earnings.completedPayouts])
      rows.push(['This month', earnings.thisMonth])
      rows.push(['Last month', earnings.lastMonth])
      rows.push(['Average per job', earnings.averagePerJob])
      rows.push(['Total jobs', earnings.totalJobs])
      rows.push([])
      rows.push(['Transaction ID', 'Amount', 'Status', 'Method', 'Date', 'Booking'])
      for (const p of list) {
        const id = (p as any).id ?? (p as any)._id ?? ''
        const txn = (p as any).transaction_id ?? (p as any).transactionId ?? ''
        rows.push([
          txn || String(id),
          (p as any).amount ?? '',
          (p as any).status ?? '',
          (p as any).payment_method ?? (p as any).paymentMethod ?? '',
          String((p as any).created_at ?? (p as any).createdAt ?? ''),
          String((p as any).booking_id ?? (p as any).bookingId ?? ''),
        ])
      }
      const stamp = new Date().toISOString().slice(0, 10)
      downloadCsv(`earnings-statement-${stamp}.csv`, rows)
    } catch (e) {
      console.error(e)
    }
  }

  return (
    <Box>
      {/* Page Header */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
              My Earnings 💰
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Track your income, payouts, and transaction history
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<DownloadIcon />}
            sx={{ borderRadius: 2 }}
            onClick={handleDownloadStatement}
          >
            Download Statement
          </Button>
        </Box>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Info Alert */}
      <Alert severity="info" icon={<InfoIcon />} sx={{ mb: 3 }}>
        Payouts are processed within 2-3 business days after job completion. Pending earnings will be transferred to your bank account.
      </Alert>

      {/* Loading State */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6} lg={3}>
          <Card sx={{ height: '100%', borderRadius: 2, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: 2,
                    bgcolor: 'rgba(255,255,255,0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <MoneyIcon sx={{ color: 'white' }} />
                </Box>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
                ${earnings.totalEarnings.toLocaleString()}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                Total Earnings
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.7, mt: 1, display: 'block' }}>
                From {earnings.totalJobs} completed jobs
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6} lg={3}>
          <Card sx={{ height: '100%', borderRadius: 2 }}>
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
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
                ${earnings.pendingPayouts.toLocaleString()}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Pending Payouts
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                Will be paid in 2-3 days
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6} lg={3}>
          <Card sx={{ height: '100%', borderRadius: 2 }}>
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
                  <CheckIcon sx={{ color: 'success.main' }} />
                </Box>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
                ${earnings.completedPayouts.toLocaleString()}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Completed Payouts
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                Transferred to bank
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6} lg={3}>
          <Card sx={{ height: '100%', borderRadius: 2 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: 2,
                    bgcolor: isGrowthPositive ? 'success.light' : 'error.light',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {isGrowthPositive ? (
                    <TrendingUpIcon sx={{ color: 'success.main' }} />
                  ) : (
                    <TrendingDownIcon sx={{ color: 'error.main' }} />
                  )}
                </Box>
                <Chip
                  label={`${isGrowthPositive ? '+' : ''}${monthlyGrowth}%`}
                  color={isGrowthPositive ? 'success' : 'error'}
                  size="small"
                />
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
                ${earnings.thisMonth.toLocaleString()}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                This Month
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                vs ${earnings.lastMonth} last month
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Transaction History */}
        <Grid item xs={12} lg={8}>
          <Card sx={{ borderRadius: 2 }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Transaction History
                </Typography>
                <Button variant="outlined" size="small" sx={{ borderRadius: 1.5 }}>
                  View All
                </Button>
              </Box>

              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Booking</TableCell>
                      <TableCell>Customer</TableCell>
                      <TableCell>Service</TableCell>
                      <TableCell>Amount</TableCell>
                      <TableCell>Fee</TableCell>
                      <TableCell>Net Earning</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Date</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {transactions.map((transaction) => (
                      <TableRow key={transaction.id} hover>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {(transaction as any).booking_id ||
                              transaction.bookingId ||
                              `BK-${transaction.id.slice(0, 8)}`}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          {(transaction as any).customer_name ||
                            transaction.customerName ||
                            (transaction as any).customer?.name ||
                            'N/A'}
                        </TableCell>
                        <TableCell>
                          {(transaction as any).service_name || transaction.serviceName || 'N/A'}
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            ${transaction.amount || 0}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">
                            -${(transaction as any).platform_fee || transaction.platformFee || transaction.fee || 0}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 600, color: 'success.main' }}>
                            ${((transaction as any).provider_amount ||
                              transaction.providerAmount ||
                              (transaction as any).net_amount ||
                              transaction.netAmount ||
                              0)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={transaction.status}
                            color={getStatusColor(transaction.status)}
                            size="small"
                            icon={getStatusIcon(transaction.status)}
                            sx={{ textTransform: 'capitalize' }}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {(transaction as any).created_at || transaction.createdAt || 'N/A'}
                          </Typography>
                          {((transaction as any).payout_date || transaction.payoutDate) && (
                            <Typography variant="caption" color="text.secondary">
                              Paid: {(transaction as any).payout_date || transaction.payoutDate}
                            </Typography>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                    {transactions.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                          <Typography variant="body2" color="text.secondary">
                            No transactions found
                          </Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Earnings Summary & Bank Info */}
        <Grid item xs={12} lg={4}>
          <Stack spacing={3}>
            {/* Earnings Breakdown */}
            <Card sx={{ borderRadius: 2 }}>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                  Earnings Breakdown
                </Typography>

                <Stack spacing={3}>
                  <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        Average Per Job
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        ${earnings.averagePerJob}
                      </Typography>
                    </Box>
                  </Box>

                  <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        Platform Fee Rate
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        10%
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={10}
                      sx={{ height: 8, borderRadius: 1 }}
                    />
                  </Box>

                  <Divider />

                  <Box sx={{ p: 2, bgcolor: 'success.light', borderRadius: 2 }}>
                    <Typography variant="body2" color="success.dark" gutterBottom>
                      This Month's Progress
                    </Typography>
                    <Typography variant="h5" sx={{ fontWeight: 700, color: 'success.dark', mb: 1 }}>
                      ${earnings.thisMonth.toLocaleString()}
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={75}
                      sx={{
                        height: 8,
                        borderRadius: 1,
                        bgcolor: 'success.lighter',
                        '& .MuiLinearProgress-bar': {
                          bgcolor: 'success.dark',
                        },
                      }}
                    />
                    <Typography variant="caption" color="success.dark" sx={{ mt: 0.5, display: 'block' }}>
                      75% of monthly goal ($4,500)
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>

            {/* Bank Account Info */}
            <Card sx={{ borderRadius: 2 }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <BankIcon color="primary" />
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Payout Account
                  </Typography>
                </Box>

                <Paper sx={{ p: 2, bgcolor: 'grey.50', mb: 2 }}>
                  <Stack spacing={1}>
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Bank Name
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        Chase Bank
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Account Number
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        ******* 1234
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Account Holder
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        Mike Smith
                      </Typography>
                    </Box>
                  </Stack>
                </Paper>

                <Button variant="outlined" fullWidth sx={{ borderRadius: 1.5 }}>
                  Update Bank Details
                </Button>
              </CardContent>
            </Card>

            {/* Payout Schedule */}
            <Card sx={{ borderRadius: 2, bgcolor: 'primary.main', color: 'white' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <CalendarIcon />
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Payout Schedule
                  </Typography>
                </Box>

                <Typography variant="body2" sx={{ opacity: 0.9, mb: 2 }}>
                  Next payout on <strong>November 10, 2025</strong>
                </Typography>

                <Stack spacing={1}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" sx={{ opacity: 0.8 }}>
                      Pending Amount:
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      ${earnings.pendingPayouts.toLocaleString()}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" sx={{ opacity: 0.8 }}>
                      Payout Frequency:
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      Weekly
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Stack>
        </Grid>
      </Grid>
      </>
      )}
    </Box>
  )
}

