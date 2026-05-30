/**
 * ============================================================================
 * PROFESSIONAL EARNINGS & WALLET PAGE
 * ============================================================================
 * Complete earnings management for professionals:
 * - View earnings summary
 * - See detailed earnings list with payment status
 * - Request payouts
 * - View payout history
 * - Mark cash payments as received
 *
 * @author CTO Team
 * @date November 10, 2025
 */

import React, { useState, useEffect } from 'react'
import {
  Loader2,
  Wallet,
  TrendingUp,
  Clock,
  CircleCheck,
  Send,
  History,
  Receipt,
  RefreshCw,
  Download,
} from 'lucide-react'
import {
  Button,
  Card,
  CardContent,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Textarea,
  Tabs,
  TabsList,
  TabsTrigger,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Badge,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '../../components/ui'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import { CHART_PALETTE, CHART_TOKENS } from '../../lib/chartPalette'
import { apiClient } from '../../services/apiClient'
import { useAppDispatch } from '../../store/hooks'
import { addToast } from '../../store/slices/uiSlice'
import { cn } from '../../lib/utils'

interface EarningsSummary {
  totalEarnings: number
  totalBookings: number
  pendingPayout: number
  processingPayout: number
  paidOut: number
  awaitingCustomerPayment: number
  awaitingVerification: number
  thisMonthEarnings: number
  thisMonthBookings: number
  availableForWithdrawal: number
}

interface Earning {
  _id: string
  bookingId: any
  customerId: any
  serviceName: string
  bookingAmount: number
  platformCommission: number
  professionalEarnings: number
  commissionRate: number
  paymentMethod: string
  paymentStatus: 'pending' | 'customer_paid' | 'verified' | 'settled_to_professional'
  payoutStatus: 'pending' | 'requested' | 'processing' | 'paid' | 'on_hold'
  completedDate: string
  customerPaidAt?: string
  verifiedAt?: string
  payoutDate?: string
}

interface Payout {
  _id: string
  payoutReference: string
  grossAmount: number
  tdsAmount: number
  deductions: number
  netAmount: number
  payoutMethod: string
  status: 'requested' | 'approved' | 'processing' | 'completed' | 'failed' | 'cancelled'
  requestedAt: string
  completedAt?: string
  earningIds: any[]
}

function InfoAlert({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      role="status"
      className={cn(
        'rounded-lg border border-primary/40 bg-primary/10 px-4 py-3 text-sm text-foreground',
        className
      )}
    >
      {children}
    </div>
  )
}

export function ProfessionalEarningsWallet() {
  const dispatch = useAppDispatch()
  const [activeTab, setActiveTab] = useState('0')
  const [loading, setLoading] = useState(true)
  const [summary, setSummary] = useState<EarningsSummary | null>(null)
  const [earnings, setEarnings] = useState<Earning[]>([])
  const [payouts, setPayouts] = useState<Payout[]>([])
  const [payoutDialogOpen, setPayoutDialogOpen] = useState(false)
  const [payoutMethod, setPayoutMethod] = useState('bank_transfer')
  const [bankDetails, setBankDetails] = useState({
    accountHolderName: '',
    accountNumber: '',
    ifscCode: '',
    bankName: '',
  })
  const [upiId, setUpiId] = useState('')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    loadData()
  }, [activeTab])

  const loadData = async () => {
    setLoading(true)
    try {
      try {
        const summaryRes = (await apiClient.get('/earnings/professional/summary')) as any
        console.log('📊 Earnings Summary Response:', summaryRes)

        if (summaryRes?.success || summaryRes?.data?.success) {
          const summaryData = summaryRes.data?.data || summaryRes.data || summaryRes
          setSummary(summaryData)
        } else {
          console.warn('⚠️ Summary response format unexpected:', summaryRes)
          setSummary({
            totalEarnings: 0,
            totalBookings: 0,
            pendingPayout: 0,
            processingPayout: 0,
            paidOut: 0,
            awaitingCustomerPayment: 0,
            awaitingVerification: 0,
            thisMonthEarnings: 0,
            thisMonthBookings: 0,
            availableForWithdrawal: 0,
          })
        }
      } catch (summaryError: any) {
        console.error('❌ Failed to load summary:', summaryError)
        setSummary({
          totalEarnings: 0,
          totalBookings: 0,
          pendingPayout: 0,
          processingPayout: 0,
          paidOut: 0,
          awaitingCustomerPayment: 0,
          awaitingVerification: 0,
          thisMonthEarnings: 0,
          thisMonthBookings: 0,
          availableForWithdrawal: 0,
        })
      }

      if (activeTab === '0' || activeTab === '1') {
        try {
          const earningsRes = (await apiClient.get('/earnings/professional/earnings?limit=50')) as any
          console.log('💰 Earnings List Response:', earningsRes)

          if (earningsRes?.success || earningsRes?.data?.success) {
            const earningsData = earningsRes.data?.data || earningsRes.data || earningsRes
            const earningsList = Array.isArray(earningsData)
              ? earningsData
              : earningsData.earnings || earningsData.items || []
            setEarnings(earningsList || [])
          } else {
            console.warn('⚠️ Earnings response format unexpected:', earningsRes)
            setEarnings([])
          }
        } catch (earningsError: any) {
          console.error('❌ Failed to load earnings:', earningsError)
          setEarnings([])
        }
      } else {
        try {
          const payoutsRes = (await apiClient.get('/earnings/professional/payouts')) as any
          console.log('💸 Payouts Response:', payoutsRes)

          if (payoutsRes?.success || payoutsRes?.data?.success) {
            const payoutsData = payoutsRes.data?.data || payoutsRes.data || payoutsRes
            const payoutsList = Array.isArray(payoutsData)
              ? payoutsData
              : payoutsData.payouts || payoutsData.items || []
            setPayouts(payoutsList || [])
          } else {
            console.warn('⚠️ Payouts response format unexpected:', payoutsRes)
            setPayouts([])
          }
        } catch (payoutsError: any) {
          console.error('❌ Failed to load payouts:', payoutsError)
          setPayouts([])
        }
      }
    } catch (error: any) {
      console.error('❌ Failed to load earnings data:', error)
      dispatch(
        addToast({
          message: error.response?.data?.message || error.message || 'Failed to load earnings data',
          severity: 'error',
        })
      )
      setEarnings([])
      setPayouts([])
      if (!summary) {
        setSummary({
          totalEarnings: 0,
          totalBookings: 0,
          pendingPayout: 0,
          processingPayout: 0,
          paidOut: 0,
          awaitingCustomerPayment: 0,
          awaitingVerification: 0,
          thisMonthEarnings: 0,
          thisMonthBookings: 0,
          availableForWithdrawal: 0,
        })
      }
    } finally {
      setLoading(false)
    }
  }

  const handleRequestPayout = async () => {
    try {
      if (!summary || summary.availableForWithdrawal < 500) {
        dispatch(addToast({ message: 'Minimum withdrawal amount is ₹500', severity: 'error' }))
        return
      }

      const payoutData: any = {
        payoutMethod,
        notes,
      }

      if (payoutMethod === 'bank_transfer') {
        if (!bankDetails.accountHolderName || !bankDetails.accountNumber || !bankDetails.ifscCode) {
          dispatch(addToast({ message: 'Please fill in all bank details', severity: 'error' }))
          return
        }
        payoutData.bankDetails = bankDetails
      } else if (payoutMethod === 'upi' || payoutMethod === 'paytm') {
        if (!upiId) {
          dispatch(addToast({ message: 'Please enter UPI ID', severity: 'error' }))
          return
        }
        payoutData.upiId = upiId
      }

      const res = (await apiClient.post('/earnings/professional/request-payout', payoutData)) as any
      if (res?.success || res?.data?.success) {
        dispatch(
          addToast({
            message:
              'Payout requested successfully! It will be processed within 2-3 business days.',
            severity: 'success',
          })
        )
        setPayoutDialogOpen(false)
        loadData()
      }
    } catch (error: any) {
      dispatch(
        addToast({
          message: error.response?.data?.message || 'Failed to request payout',
          severity: 'error',
        })
      )
    }
  }

  const handleMarkPaid = async (earningId: string) => {
    try {
      const res = (await apiClient.post(`/earnings/${earningId}/mark-paid`)) as any
      if (res?.success || res?.data?.success) {
        dispatch(
          addToast({
            message:
              'Payment marked as received. Waiting for admin verification.',
            severity: 'success',
          })
        )
        loadData()
      }
    } catch (error: any) {
      dispatch(
        addToast({
          message: error.response?.data?.message || 'Failed to mark payment',
          severity: 'error',
        })
      )
    }
  }

  const getPaymentStatusBadge = (status: string) => {
    const config: Record<string, { label: string; variant: 'warning' | 'outline' | 'success' | 'secondary' }> = {
      pending: { label: 'Awaiting Payment', variant: 'warning' },
      customer_paid: { label: 'Awaiting Verification', variant: 'outline' },
      verified: { label: 'Verified', variant: 'success' },
      settled_to_professional: { label: 'Settled', variant: 'secondary' },
    }
    const c = config[status] || config.pending
    return (
      <Badge variant={c.variant} className="font-normal">
        {c.label}
      </Badge>
    )
  }

  const getPayoutStatusBadge = (status: string) => {
    const config: Record<string, { label: string; variant: 'secondary' | 'outline' | 'warning' | 'success' | 'destructive' }> = {
      pending: { label: 'Pending', variant: 'secondary' },
      requested: { label: 'Requested', variant: 'outline' },
      processing: { label: 'Processing', variant: 'warning' },
      paid: { label: 'Paid', variant: 'success' },
      on_hold: { label: 'On Hold', variant: 'destructive' },
    }
    const c = config[status] || config.pending
    return (
      <Badge variant={c.variant} className="font-normal">
        {c.label}
      </Badge>
    )
  }

  const generateMonthlyEarningsData = (earningsList: Earning[]) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const currentMonth = new Date().getMonth()
    const last6Months = months.slice(Math.max(0, currentMonth - 5), currentMonth + 1)

    return last6Months.map((month) => {
      const monthIndex = months.indexOf(month)
      const monthEarnings = earningsList.filter((e) => {
        if (!e.completedDate) return false
        const date = new Date(e.completedDate)
        return date.getMonth() === monthIndex && date.getFullYear() === new Date().getFullYear()
      })

      return {
        month,
        earnings: monthEarnings.reduce((sum, e) => sum + e.professionalEarnings, 0),
        bookings: monthEarnings.length,
      }
    })
  }

  const generatePaymentStatusData = (earningsList: Earning[]) => {
    const statusCounts: { [key: string]: number } = {}
    earningsList.forEach((e) => {
      statusCounts[e.paymentStatus] = (statusCounts[e.paymentStatus] || 0) + 1
    })

    const colors: { [key: string]: string } = {
      pending: CHART_PALETTE.bloomCoral,
      customer_paid: CHART_PALETTE.primaryBright,
      verified: CHART_PALETTE.stormDeep,
      settled_to_professional: CHART_PALETTE.graphite,
    }

    return Object.entries(statusCounts).map(([status, count]) => ({
      name: status.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
      value: count,
      color: colors[status] || CHART_PALETTE.graphite,
    }))
  }

  const generateServiceWiseData = (earningsList: Earning[]) => {
    const serviceMap: { [key: string]: { earnings: number; bookings: number } } = {}

    earningsList.forEach((e) => {
      const serviceName = e.serviceName || 'Unknown Service'
      if (!serviceMap[serviceName]) {
        serviceMap[serviceName] = { earnings: 0, bookings: 0 }
      }
      serviceMap[serviceName].earnings += e.professionalEarnings
      serviceMap[serviceName].bookings += 1
    })

    return Object.entries(serviceMap)
      .map(([service, data]) => ({
        service: service.length > 20 ? service.substring(0, 20) + '...' : service,
        earnings: data.earnings,
        bookings: data.bookings,
      }))
      .sort((a, b) => b.earnings - a.earnings)
      .slice(0, 10)
  }

  return (
    <div className="relative p-6">
      {loading && !summary && earnings.length === 0 && payouts.length === 0 && (
        <div className="absolute inset-0 z-[1000] flex min-h-[400px] flex-col items-center justify-center bg-background/90">
          <Loader2 className="h-12 w-12 animate-spin text-muted-foreground" />
          <p className="mt-2 text-sm text-muted-foreground">Loading earnings data...</p>
        </div>
      )}

      {process.env.NODE_ENV === 'development' && (
        <InfoAlert className="mb-2">
          <span className="text-xs">
            Debug: Loading={loading.toString()}, Summary={summary ? 'Loaded' : 'Null'}, Earnings=
            {earnings.length}, Payouts={payouts.length}
          </span>
        </InfoAlert>
      )}

      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Earnings & Wallet</h1>
        <Button variant="outline" onClick={loadData} disabled={loading}>
          <RefreshCw className={cn('mr-2 h-4 w-4', loading && 'animate-spin')} />
          Refresh
        </Button>
      </div>

      {summary ? (
        <div className="mb-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <Card
            className="border-0 text-white shadow-md"
            style={{
              background: `linear-gradient(135deg, ${CHART_PALETTE.primary} 0%, ${CHART_PALETTE.primaryDeep} 100%)`,
            }}
          >
            <CardContent className="pt-6">
              <div className="mb-1 flex items-center">
                <Wallet className="mr-1 h-5 w-5 opacity-90" />
                <span className="text-sm opacity-90">Total Earnings</span>
              </div>
              <p className="text-3xl font-bold">₹{summary.totalEarnings.toLocaleString()}</p>
              <p className="mt-1 text-xs opacity-90">
                From {summary.totalBookings} completed bookings
              </p>
            </CardContent>
          </Card>

          <Card
            className="border-0 text-white shadow-md"
            style={{
              background: `linear-gradient(135deg, ${CHART_PALETTE.bloomCoral} 0%, ${CHART_PALETTE.bloomDeep} 100%)`,
            }}
          >
            <CardContent className="pt-6">
              <div className="mb-1 flex items-center">
                <TrendingUp className="mr-1 h-5 w-5 opacity-90" />
                <span className="text-sm opacity-90">This Month</span>
              </div>
              <p className="text-3xl font-bold">₹{summary.thisMonthEarnings.toLocaleString()}</p>
              <p className="mt-1 text-xs opacity-90">
                From {summary.thisMonthBookings} bookings
              </p>
            </CardContent>
          </Card>

          <Card
            className="border-0 text-white shadow-md"
            style={{
              background: `linear-gradient(135deg, ${CHART_PALETTE.primaryBright} 0%, ${CHART_PALETTE.primary} 100%)`,
            }}
          >
            <CardContent className="pt-6">
              <div className="mb-1 flex items-center">
                <Clock className="mr-1 h-5 w-5 opacity-90" />
                <span className="text-sm opacity-90">Pending Payout</span>
              </div>
              <p className="text-3xl font-bold">₹{summary.pendingPayout.toLocaleString()}</p>
              <p className="mt-1 text-xs opacity-90">
                Available: ₹{summary.availableForWithdrawal.toLocaleString()}
              </p>
            </CardContent>
          </Card>

          <Card
            className="border-0 text-white shadow-md"
            style={{
              background: `linear-gradient(135deg, ${CHART_PALETTE.stormSea} 0%, ${CHART_PALETTE.stormDeep} 100%)`,
            }}
          >
            <CardContent className="pt-6">
              <div className="mb-1 flex items-center">
                <CircleCheck className="mr-1 h-5 w-5 opacity-90" />
                <span className="text-sm opacity-90">Total Paid Out</span>
              </div>
              <p className="text-3xl font-bold">₹{summary.paidOut.toLocaleString()}</p>
              <p className="mt-1 text-xs opacity-90">Successfully transferred</p>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div
          role="status"
          className="mb-6 rounded-lg border border-primary/40 bg-primary/10 px-4 py-3 text-sm"
        >
          No earnings data available. Earnings will appear here once you complete bookings.
        </div>
      )}

      {summary && summary.availableForWithdrawal >= 500 && (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-lg border border-storm-deep/40 bg-storm-deep/10 px-4 py-3 text-sm">
          <p>
            You have ₹{summary.availableForWithdrawal.toLocaleString()} available for withdrawal!
          </p>
          <Button onClick={() => setPayoutDialogOpen(true)}>
            <Send className="mr-2 h-4 w-4" />
            Request Payout
          </Button>
        </div>
      )}

      {summary && earnings.length > 0 && (
        <div className="mb-6 grid gap-6 lg:grid-cols-12">
          <Card className="rounded-lg border shadow-sm lg:col-span-8">
            <CardContent className="pt-6">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-lg font-semibold">Earnings Trend (Last 6 Months)</h2>
                <Button size="sm" variant="outline" type="button">
                  <Download className="mr-2 h-4 w-4" />
                  Export
                </Button>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={generateMonthlyEarningsData(earnings)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <RechartsTooltip formatter={(value: any) => `₹${Number(value).toLocaleString()}`} />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="earnings"
                    stroke={CHART_TOKENS.primary}
                    strokeWidth={2}
                    name="Earnings"
                  />
                  <Line
                    type="monotone"
                    dataKey="bookings"
                    stroke={CHART_TOKENS.success}
                    strokeWidth={2}
                    name="Bookings"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="rounded-lg border shadow-sm lg:col-span-4">
            <CardContent className="pt-6">
              <h2 className="mb-4 text-lg font-semibold">Payment Status</h2>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={generatePaymentStatusData(earnings)}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }: any) =>
                      `${name ?? 'Unknown'}: ${(
                        (typeof percent === 'number' ? percent : 0) * 100
                      ).toFixed(0)}%`
                    }
                    outerRadius={80}
                    fill={CHART_TOKENS.primary}
                    dataKey="value"
                  >
                    {generatePaymentStatusData(earnings).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="rounded-lg border shadow-sm lg:col-span-12">
            <CardContent className="pt-6">
              <h2 className="mb-4 text-lg font-semibold">Earnings by Service</h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={generateServiceWiseData(earnings)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="service" />
                  <YAxis />
                  <RechartsTooltip formatter={(value: any) => `₹${Number(value).toLocaleString()}`} />
                  <Legend />
                  <Bar dataKey="earnings" fill={CHART_TOKENS.primary} name="Earnings" />
                  <Bar dataKey="bookings" fill={CHART_TOKENS.success} name="Bookings" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {summary && summary.availableForWithdrawal > 0 && summary.availableForWithdrawal < 500 && (
        <div
          role="status"
          className="mb-6 rounded-lg border border-primary/40 bg-primary/10 px-4 py-3 text-sm"
        >
          You have ₹{summary.availableForWithdrawal.toLocaleString()} earnings. Minimum withdrawal
          amount is ₹500.
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList className="grid h-auto w-full grid-cols-3 p-1">
          <TabsTrigger value="0" className="gap-2">
            <Receipt className="h-4 w-4" />
            All Earnings
          </TabsTrigger>
          <TabsTrigger value="1" className="gap-2">
            <Clock className="h-4 w-4" />
            Pending Payments
          </TabsTrigger>
          <TabsTrigger value="2" className="gap-2">
            <History className="h-4 w-4" />
            Payout History
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {(activeTab === '0' || activeTab === '1') && (
        <Card>
          <CardContent className="pt-6">
            <h2 className="mb-4 text-lg font-semibold">
              {activeTab === '0' ? 'All Earnings' : 'Pending Customer Payments'}
            </h2>
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : earnings.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Service</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead className="text-right">Booking Amount</TableHead>
                    <TableHead className="text-right">
                      Commission (
                      {earnings.length > 0 && earnings[0]?.commissionRate
                        ? earnings[0].commissionRate
                        : 18}
                      %)
                    </TableHead>
                    <TableHead className="text-right">Your Earnings</TableHead>
                    <TableHead>Payment Status</TableHead>
                    <TableHead>Payout Status</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {earnings
                    .filter((e) => activeTab === '0' || e.paymentStatus === 'pending')
                    .map((earning) => (
                      <TableRow key={earning._id}>
                        <TableCell>
                          {earning.completedDate
                            ? new Date(earning.completedDate).toLocaleDateString()
                            : 'N/A'}
                        </TableCell>
                        <TableCell>
                          {earning.serviceName ||
                            earning.bookingId?.services?.[0]?.serviceName ||
                            'Service'}
                        </TableCell>
                        <TableCell>
                          {earning.customerId?.firstName || earning.customerId?.name
                            ? `${earning.customerId.firstName || earning.customerId.name} ${earning.customerId.lastName || ''}`.trim()
                            : 'Customer'}
                        </TableCell>
                        <TableCell className="text-right">₹{earning.bookingAmount}</TableCell>
                        <TableCell className="text-right">₹{earning.platformCommission}</TableCell>
                        <TableCell className="text-right font-semibold">
                          ₹{earning.professionalEarnings}
                        </TableCell>
                        <TableCell>{getPaymentStatusBadge(earning.paymentStatus)}</TableCell>
                        <TableCell>{getPayoutStatusBadge(earning.payoutStatus)}</TableCell>
                        <TableCell>
                          {earning.paymentStatus === 'pending' &&
                            earning.paymentMethod === 'pay_after_service' && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleMarkPaid(earning._id)}
                                  >
                                    Mark Paid
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  Mark as received when customer pays you in cash
                                </TooltipContent>
                              </Tooltip>
                            )}
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            ) : (
              <div
                role="status"
                className="mt-2 rounded-lg border border-primary/40 bg-primary/10 px-4 py-3 text-sm"
              >
                {loading
                  ? 'Loading earnings...'
                  : 'No earnings found. Earnings will appear here once you complete bookings.'}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === '2' && (
        <Card>
          <CardContent className="pt-6">
            <h2 className="mb-4 text-lg font-semibold">Payout History</h2>
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : payouts.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Reference</TableHead>
                    <TableHead>Requested Date</TableHead>
                    <TableHead className="text-right">Gross Amount</TableHead>
                    <TableHead className="text-right">TDS</TableHead>
                    <TableHead className="text-right">Net Amount</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Completed</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payouts.map((payout) => (
                    <TableRow key={payout._id}>
                      <TableCell className="font-semibold">{payout.payoutReference}</TableCell>
                      <TableCell>
                        {new Date(payout.requestedAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        ₹{payout.grossAmount.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        ₹{payout.tdsAmount.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right font-semibold text-storm-deep">
                        ₹{payout.netAmount.toLocaleString()}
                      </TableCell>
                      <TableCell className="uppercase">
                        {payout.payoutMethod.replace('_', ' ')}
                      </TableCell>
                      <TableCell>{getPayoutStatusBadge(payout.status)}</TableCell>
                      <TableCell>
                        {payout.completedAt
                          ? new Date(payout.completedAt).toLocaleDateString()
                          : '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div
                role="status"
                className="rounded-lg border border-primary/40 bg-primary/10 px-4 py-3 text-sm"
              >
                No payout requests yet
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Dialog open={payoutDialogOpen} onOpenChange={setPayoutDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Request Payout</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div
              role="status"
              className="rounded-lg border border-primary/40 bg-primary/10 px-4 py-3 text-sm"
            >
              <p>
                <strong>Available for withdrawal:</strong> ₹
                {summary?.availableForWithdrawal.toLocaleString()}
              </p>
              {summary && summary.availableForWithdrawal > 30000 && (
                <p className="mt-2 text-xs text-muted-foreground">
                  Note: 10% TDS will be deducted for earnings above ₹30,000/month
                </p>
              )}
            </div>

            <fieldset className="space-y-2">
              <legend className="text-sm font-medium">Payout Method</legend>
              <label className="flex cursor-pointer items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="payoutMethod"
                  className="h-4 w-4 accent-primary"
                  checked={payoutMethod === 'bank_transfer'}
                  onChange={() => setPayoutMethod('bank_transfer')}
                />
                Bank Transfer (NEFT/IMPS)
              </label>
              <label className="flex cursor-pointer items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="payoutMethod"
                  className="h-4 w-4 accent-primary"
                  checked={payoutMethod === 'upi'}
                  onChange={() => setPayoutMethod('upi')}
                />
                UPI
              </label>
              <label className="flex cursor-pointer items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="payoutMethod"
                  className="h-4 w-4 accent-primary"
                  checked={payoutMethod === 'paytm'}
                  onChange={() => setPayoutMethod('paytm')}
                />
                PayTM
              </label>
            </fieldset>

            {payoutMethod === 'bank_transfer' && (
              <div className="space-y-3">
                <div>
                  <Label htmlFor="accName">Account Holder Name</Label>
                  <Input
                    id="accName"
                    className="mt-1"
                    value={bankDetails.accountHolderName}
                    onChange={(e) =>
                      setBankDetails({ ...bankDetails, accountHolderName: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="accNo">Account Number</Label>
                  <Input
                    id="accNo"
                    className="mt-1"
                    value={bankDetails.accountNumber}
                    onChange={(e) =>
                      setBankDetails({ ...bankDetails, accountNumber: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="ifsc">IFSC Code</Label>
                  <Input
                    id="ifsc"
                    className="mt-1"
                    value={bankDetails.ifscCode}
                    onChange={(e) => setBankDetails({ ...bankDetails, ifscCode: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="bank">Bank Name</Label>
                  <Input
                    id="bank"
                    className="mt-1"
                    value={bankDetails.bankName}
                    onChange={(e) => setBankDetails({ ...bankDetails, bankName: e.target.value })}
                  />
                </div>
              </div>
            )}

            {(payoutMethod === 'upi' || payoutMethod === 'paytm') && (
              <div>
                <Label htmlFor="upi">UPI ID / Phone Number</Label>
                <Input
                  id="upi"
                  className="mt-1"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  placeholder="yourname@upi or 9876543210"
                />
              </div>
            )}

            <div>
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                className="mt-1"
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPayoutDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleRequestPayout}>Request Payout</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
