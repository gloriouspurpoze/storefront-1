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

import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  FormLabel,
  Stack,
  IconButton,
  Tooltip,
  Paper,
  alpha,
  LinearProgress,
} from '@mui/material';
import {
  AccountBalanceWallet,
  TrendingUp,
  AccessTime,
  CheckCircle,
  Send,
  History,
  AccountBalance,
  Payment,
  Receipt,
  Info,
  Refresh,
  Download as DownloadIcon,
  FileDownload,
  CalendarToday,
} from '@mui/icons-material'
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
} from 'recharts';
import { apiClient } from '../../services/apiClient';
import { useAppDispatch } from '../../store/hooks';
import { addToast } from '../../store/slices/uiSlice';

interface EarningsSummary {
  totalEarnings: number;
  totalBookings: number;
  pendingPayout: number;
  processingPayout: number;
  paidOut: number;
  awaitingCustomerPayment: number;
  awaitingVerification: number;
  thisMonthEarnings: number;
  thisMonthBookings: number;
  availableForWithdrawal: number;
}

interface Earning {
  _id: string;
  bookingId: any;
  customerId: any;
  serviceName: string;
  bookingAmount: number;
  platformCommission: number;
  professionalEarnings: number;
  commissionRate: number;
  paymentMethod: string;
  paymentStatus: 'pending' | 'customer_paid' | 'verified' | 'settled_to_professional';
  payoutStatus: 'pending' | 'requested' | 'processing' | 'paid' | 'on_hold';
  completedDate: string;
  customerPaidAt?: string;
  verifiedAt?: string;
  payoutDate?: string;
}

interface Payout {
  _id: string;
  payoutReference: string;
  grossAmount: number;
  tdsAmount: number;
  deductions: number;
  netAmount: number;
  payoutMethod: string;
  status: 'requested' | 'approved' | 'processing' | 'completed' | 'failed' | 'cancelled';
  requestedAt: string;
  completedAt?: string;
  earningIds: any[];
}

export function ProfessionalEarningsWallet() {
  const dispatch = useAppDispatch();
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<EarningsSummary | null>(null);
  const [earnings, setEarnings] = useState<Earning[]>([]);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [payoutDialogOpen, setPayoutDialogOpen] = useState(false);
  const [payoutMethod, setPayoutMethod] = useState('bank_transfer');
  const [bankDetails, setBankDetails] = useState({
    accountHolderName: '',
    accountNumber: '',
    ifscCode: '',
    bankName: '',
  });
  const [upiId, setUpiId] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load summary - apiClient already includes /api in baseURL
      try {
        const summaryRes = await apiClient.get('/earnings/professional/summary') as any;
        console.log('📊 Earnings Summary Response:', summaryRes);
        
        if (summaryRes?.success || summaryRes?.data?.success) {
          const summaryData = summaryRes.data?.data || summaryRes.data || summaryRes;
          setSummary(summaryData);
        } else {
          console.warn('⚠️ Summary response format unexpected:', summaryRes);
          // Set default summary if API fails
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
          });
        }
      } catch (summaryError: any) {
        console.error('❌ Failed to load summary:', summaryError);
        // Set default summary on error
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
        });
      }

      // Load earnings or payouts based on active tab
      if (activeTab === 0 || activeTab === 1) {
        try {
          const earningsRes = await apiClient.get('/earnings/professional/earnings?limit=50') as any;
          console.log('💰 Earnings List Response:', earningsRes);
          
          if (earningsRes?.success || earningsRes?.data?.success) {
            const earningsData = earningsRes.data?.data || earningsRes.data || earningsRes;
            // Handle both array and object with earnings property
            const earningsList = Array.isArray(earningsData) 
              ? earningsData 
              : (earningsData.earnings || earningsData.items || []);
            setEarnings(earningsList || []);
          } else {
            console.warn('⚠️ Earnings response format unexpected:', earningsRes);
            setEarnings([]);
          }
        } catch (earningsError: any) {
          console.error('❌ Failed to load earnings:', earningsError);
          setEarnings([]);
        }
      } else {
        try {
          const payoutsRes = await apiClient.get('/earnings/professional/payouts') as any;
          console.log('💸 Payouts Response:', payoutsRes);
          
          if (payoutsRes?.success || payoutsRes?.data?.success) {
            const payoutsData = payoutsRes.data?.data || payoutsRes.data || payoutsRes;
            const payoutsList = Array.isArray(payoutsData) 
              ? payoutsData 
              : (payoutsData.payouts || payoutsData.items || []);
            setPayouts(payoutsList || []);
          } else {
            console.warn('⚠️ Payouts response format unexpected:', payoutsRes);
            setPayouts([]);
          }
        } catch (payoutsError: any) {
          console.error('❌ Failed to load payouts:', payoutsError);
          setPayouts([]);
        }
      }
    } catch (error: any) {
      console.error('❌ Failed to load earnings data:', error);
      dispatch(addToast({ 
        message: error.response?.data?.message || error.message || 'Failed to load earnings data', 
        severity: 'error' 
      }));
      // Set empty arrays on error
      setEarnings([]);
      setPayouts([]);
      // Set default summary on error
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
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRequestPayout = async () => {
    try {
      if (!summary || summary.availableForWithdrawal < 500) {
        dispatch(addToast({ message: 'Minimum withdrawal amount is ₹500', severity: 'error' }));
        return;
      }

      const payoutData: any = {
        payoutMethod,
        notes,
      };

      if (payoutMethod === 'bank_transfer') {
        if (!bankDetails.accountHolderName || !bankDetails.accountNumber || !bankDetails.ifscCode) {
          dispatch(addToast({ message: 'Please fill in all bank details', severity: 'error' }));
          return;
        }
        payoutData.bankDetails = bankDetails;
      } else if (payoutMethod === 'upi' || payoutMethod === 'paytm') {
        if (!upiId) {
          dispatch(addToast({ message: 'Please enter UPI ID', severity: 'error' }));
          return;
        }
        payoutData.upiId = upiId;
      }

      const res = await apiClient.post('/earnings/professional/request-payout', payoutData) as any;
      if (res?.success || res?.data?.success) {
        dispatch(addToast({ message: 'Payout requested successfully! It will be processed within 2-3 business days.', severity: 'success' }));
        setPayoutDialogOpen(false);
        loadData();
      }
    } catch (error: any) {
      dispatch(addToast({ message: error.response?.data?.message || 'Failed to request payout', severity: 'error' }));
    }
  };

  const handleMarkPaid = async (earningId: string) => {
    try {
      const res = await apiClient.post(`/earnings/${earningId}/mark-paid`) as any;
      if (res?.success || res?.data?.success) {
        dispatch(addToast({ message: 'Payment marked as received. Waiting for admin verification.', severity: 'success' }));
        loadData();
      }
    } catch (error: any) {
      dispatch(addToast({ message: error.response?.data?.message || 'Failed to mark payment', severity: 'error' }));
    }
  };

  const getPaymentStatusChip = (status: string) => {
    const config: any = {
      pending: { label: 'Awaiting Payment', color: 'warning' },
      customer_paid: { label: 'Awaiting Verification', color: 'info' },
      verified: { label: 'Verified', color: 'success' },
      settled_to_professional: { label: 'Settled', color: 'default' },
    };
    const c = config[status] || config.pending;
    return <Chip label={c.label} color={c.color} size="small" />;
  };

  const getPayoutStatusChip = (status: string) => {
    const config: any = {
      pending: { label: 'Pending', color: 'default' },
      requested: { label: 'Requested', color: 'info' },
      processing: { label: 'Processing', color: 'warning' },
      paid: { label: 'Paid', color: 'success' },
      on_hold: { label: 'On Hold', color: 'error' },
    };
    const c = config[status] || config.pending;
    return <Chip label={c.label} color={c.color} size="small" />;
  };

  // Generate monthly earnings data for charts
  const generateMonthlyEarningsData = (earningsList: Earning[]) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentMonth = new Date().getMonth();
    const last6Months = months.slice(Math.max(0, currentMonth - 5), currentMonth + 1);
    
    return last6Months.map(month => {
      const monthIndex = months.indexOf(month);
      const monthEarnings = earningsList.filter(e => {
        if (!e.completedDate) return false;
        const date = new Date(e.completedDate);
        return date.getMonth() === monthIndex && date.getFullYear() === new Date().getFullYear();
      });
      
      return {
        month,
        earnings: monthEarnings.reduce((sum, e) => sum + e.professionalEarnings, 0),
        bookings: monthEarnings.length,
      };
    });
  };

  // Generate payment status distribution data
  const generatePaymentStatusData = (earningsList: Earning[]) => {
    const statusCounts: { [key: string]: number } = {};
    earningsList.forEach(e => {
      statusCounts[e.paymentStatus] = (statusCounts[e.paymentStatus] || 0) + 1;
    });

    const colors: { [key: string]: string } = {
      pending: '#f59e0b',
      customer_paid: '#06b6d4',
      verified: '#10b981',
      settled_to_professional: '#6b7280',
    };

    return Object.entries(statusCounts).map(([status, count]) => ({
      name: status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
      value: count,
      color: colors[status] || '#6b7280',
    }));
  };

  // Generate service-wise earnings data
  const generateServiceWiseData = (earningsList: Earning[]) => {
    const serviceMap: { [key: string]: { earnings: number; bookings: number } } = {};
    
    earningsList.forEach(e => {
      const serviceName = e.serviceName || 'Unknown Service';
      if (!serviceMap[serviceName]) {
        serviceMap[serviceName] = { earnings: 0, bookings: 0 };
      }
      serviceMap[serviceName].earnings += e.professionalEarnings;
      serviceMap[serviceName].bookings += 1;
    });

    return Object.entries(serviceMap)
      .map(([service, data]) => ({
        service: service.length > 20 ? service.substring(0, 20) + '...' : service,
        earnings: data.earnings,
        bookings: data.bookings,
      }))
      .sort((a, b) => b.earnings - a.earnings)
      .slice(0, 10); // Top 10 services
  };

  return (
    <Box sx={{ p: 3, position: 'relative' }}>
      {/* Show loading overlay */}
      {loading && !summary && earnings.length === 0 && payouts.length === 0 && (
        <Box 
          display="flex" 
          flexDirection="column" 
          justifyContent="center" 
          alignItems="center" 
          minHeight="400px"
          position="absolute"
          top={0}
          left={0}
          right={0}
          bottom={0}
          bgcolor="rgba(255, 255, 255, 0.9)"
          zIndex={1000}
        >
          <CircularProgress size={60} />
          <Typography variant="body1" sx={{ mt: 2 }}>Loading earnings data...</Typography>
        </Box>
      )}
      
      {/* Debug Info - Remove in production */}
      {process.env.NODE_ENV === 'development' && (
        <Alert severity="info" sx={{ mb: 2 }}>
          <Typography variant="caption">
            Debug: Loading={loading.toString()}, Summary={summary ? 'Loaded' : 'Null'}, Earnings={earnings.length}, Payouts={payouts.length}
          </Typography>
        </Alert>
      )}
      
      {/* Header */}
      <Box mb={3} display="flex" justifyContent="space-between" alignItems="center">
        <Typography variant="h4" fontWeight="700">
          💰 Earnings & Wallet
        </Typography>
        <Button
          variant="outlined"
          startIcon={<Refresh />}
          onClick={loadData}
          disabled={loading}
        >
          Refresh
        </Button>
      </Box>

      {/* Summary Cards */}
      {summary ? (
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ 
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white'
            }}>
              <CardContent>
                <Box display="flex" alignItems="center" mb={1}>
                  <AccountBalanceWallet sx={{ mr: 1 }} />
                  <Typography variant="body2">Total Earnings</Typography>
                </Box>
                <Typography variant="h4" fontWeight="700">
                  ₹{summary.totalEarnings.toLocaleString()}
                </Typography>
                <Typography variant="caption" sx={{ opacity: 0.9 }}>
                  From {summary.totalBookings} completed bookings
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ 
              background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
              color: 'white'
            }}>
              <CardContent>
                <Box display="flex" alignItems="center" mb={1}>
                  <TrendingUp sx={{ mr: 1 }} />
                  <Typography variant="body2">This Month</Typography>
                </Box>
                <Typography variant="h4" fontWeight="700">
                  ₹{summary.thisMonthEarnings.toLocaleString()}
                </Typography>
                <Typography variant="caption" sx={{ opacity: 0.9 }}>
                  From {summary.thisMonthBookings} bookings
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ 
              background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
              color: 'white'
            }}>
              <CardContent>
                <Box display="flex" alignItems="center" mb={1}>
                  <AccessTime sx={{ mr: 1 }} />
                  <Typography variant="body2">Pending Payout</Typography>
                </Box>
                <Typography variant="h4" fontWeight="700">
                  ₹{summary.pendingPayout.toLocaleString()}
                </Typography>
                <Typography variant="caption" sx={{ opacity: 0.9 }}>
                  Available: ₹{summary.availableForWithdrawal.toLocaleString()}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ 
              background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
              color: 'white'
            }}>
              <CardContent>
                <Box display="flex" alignItems="center" mb={1}>
                  <CheckCircle sx={{ mr: 1 }} />
                  <Typography variant="body2">Total Paid Out</Typography>
                </Box>
                <Typography variant="h4" fontWeight="700">
                  ₹{summary.paidOut.toLocaleString()}
                </Typography>
                <Typography variant="caption" sx={{ opacity: 0.9 }}>
                  Successfully transferred
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      ) : (
        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="body2">
            No earnings data available. Earnings will appear here once you complete bookings.
          </Typography>
        </Alert>
      )}

      {/* Withdrawal Button */}
      {summary && summary.availableForWithdrawal >= 500 && (
        <Alert severity="success" sx={{ mb: 3 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography>
              You have ₹{summary.availableForWithdrawal.toLocaleString()} available for withdrawal!
            </Typography>
            <Button
              variant="contained"
              startIcon={<Send />}
              onClick={() => setPayoutDialogOpen(true)}
            >
              Request Payout
            </Button>
          </Box>
        </Alert>
      )}

      {/* Analytics Charts */}
      {summary && earnings.length > 0 && (
        <Grid container spacing={3} sx={{ mb: 3 }}>
          {/* Monthly Earnings Trend */}
          <Grid item xs={12} md={8}>
            <Card sx={{ borderRadius: 2 }}>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="h6" fontWeight={600}>
                    Earnings Trend (Last 6 Months)
                  </Typography>
                  <Button size="small" startIcon={<DownloadIcon />} variant="outlined">
                    Export
                  </Button>
                </Box>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={generateMonthlyEarningsData(earnings)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <RechartsTooltip formatter={(value: any) => `₹${value.toLocaleString()}`} />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="earnings" 
                      stroke="#2563eb" 
                      strokeWidth={2}
                      name="Earnings"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="bookings" 
                      stroke="#10b981" 
                      strokeWidth={2}
                      name="Bookings"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>

          {/* Payment Status Distribution */}
          <Grid item xs={12} md={4}>
            <Card sx={{ borderRadius: 2 }}>
              <CardContent>
                <Typography variant="h6" fontWeight={600} mb={2}>
                  Payment Status
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={generatePaymentStatusData(earnings)}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
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
          </Grid>

          {/* Service-wise Earnings */}
          <Grid item xs={12}>
            <Card sx={{ borderRadius: 2 }}>
              <CardContent>
                <Typography variant="h6" fontWeight={600} mb={2}>
                  Earnings by Service
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={generateServiceWiseData(earnings)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="service" />
                    <YAxis />
                    <RechartsTooltip formatter={(value: any) => `₹${value.toLocaleString()}`} />
                    <Legend />
                    <Bar dataKey="earnings" fill="#2563eb" name="Earnings" />
                    <Bar dataKey="bookings" fill="#10b981" name="Bookings" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {summary && summary.availableForWithdrawal > 0 && summary.availableForWithdrawal < 500 && (
        <Alert severity="info" sx={{ mb: 3 }}>
          You have ₹{summary.availableForWithdrawal.toLocaleString()} earnings. Minimum withdrawal amount is ₹500.
        </Alert>
      )}

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={(e, newValue) => setActiveTab(newValue)}
          variant="fullWidth"
        >
          <Tab icon={<Receipt />} label="All Earnings" />
          <Tab icon={<AccessTime />} label="Pending Payments" />
          <Tab icon={<History />} label="Payout History" />
        </Tabs>
      </Paper>

      {/* Earnings Table */}
      {(activeTab === 0 || activeTab === 1) && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              {activeTab === 0 ? 'All Earnings' : 'Pending Customer Payments'}
            </Typography>
            {loading ? (
              <Box display="flex" justifyContent="center" py={4}>
                <CircularProgress />
              </Box>
            ) : earnings.length > 0 ? (
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>Service</TableCell>
                    <TableCell>Customer</TableCell>
                    <TableCell align="right">Booking Amount</TableCell>
                    <TableCell align="right">Commission ({earnings.length > 0 && earnings[0]?.commissionRate ? earnings[0].commissionRate : 18}%)</TableCell>
                    <TableCell align="right">Your Earnings</TableCell>
                    <TableCell>Payment Status</TableCell>
                    <TableCell>Payout Status</TableCell>
                    <TableCell>Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {earnings
                    .filter(e => activeTab === 0 || e.paymentStatus === 'pending')
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
                        <TableCell align="right">₹{earning.bookingAmount}</TableCell>
                        <TableCell align="right">₹{earning.platformCommission}</TableCell>
                        <TableCell align="right">
                          <Typography fontWeight="600">₹{earning.professionalEarnings}</Typography>
                        </TableCell>
                        <TableCell>{getPaymentStatusChip(earning.paymentStatus)}</TableCell>
                        <TableCell>{getPayoutStatusChip(earning.payoutStatus)}</TableCell>
                        <TableCell>
                          {earning.paymentStatus === 'pending' && 
                           earning.paymentMethod === 'pay_after_service' && (
                            <Tooltip title="Mark as received when customer pays you in cash">
                              <Button
                                size="small"
                                variant="outlined"
                                onClick={() => handleMarkPaid(earning._id)}
                              >
                                Mark Paid
                              </Button>
                            </Tooltip>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            ) : (
              <Alert severity="info" sx={{ mt: 2 }}>
                {loading ? 'Loading earnings...' : 'No earnings found. Earnings will appear here once you complete bookings.'}
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Payout History Table */}
      {activeTab === 2 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Payout History
            </Typography>
            {loading ? (
              <Box display="flex" justifyContent="center" py={4}>
                <CircularProgress />
              </Box>
            ) : payouts.length > 0 ? (
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Reference</TableCell>
                    <TableCell>Requested Date</TableCell>
                    <TableCell align="right">Gross Amount</TableCell>
                    <TableCell align="right">TDS</TableCell>
                    <TableCell align="right">Net Amount</TableCell>
                    <TableCell>Method</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Completed</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {payouts.map((payout) => (
                    <TableRow key={payout._id}>
                      <TableCell>
                        <Typography fontWeight="600">{payout.payoutReference}</Typography>
                      </TableCell>
                      <TableCell>
                        {new Date(payout.requestedAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell align="right">₹{payout.grossAmount.toLocaleString()}</TableCell>
                      <TableCell align="right">₹{payout.tdsAmount.toLocaleString()}</TableCell>
                      <TableCell align="right">
                        <Typography fontWeight="600" color="success.main">
                          ₹{payout.netAmount.toLocaleString()}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ textTransform: 'uppercase' }}>
                        {payout.payoutMethod.replace('_', ' ')}
                      </TableCell>
                      <TableCell>{getPayoutStatusChip(payout.status)}</TableCell>
                      <TableCell>
                        {payout.completedAt
                          ? new Date(payout.completedAt).toLocaleDateString()
                          : '-'
                        }
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <Alert severity="info">No payout requests yet</Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Request Payout Dialog */}
      <Dialog
        open={payoutDialogOpen}
        onClose={() => setPayoutDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Request Payout</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Alert severity="info" sx={{ mb: 3 }}>
              <Typography variant="body2">
                <strong>Available for withdrawal:</strong> ₹{summary?.availableForWithdrawal.toLocaleString()}
              </Typography>
              {summary && summary.availableForWithdrawal > 30000 && (
                <Typography variant="caption" display="block" mt={1}>
                  ⚠️ Note: 10% TDS will be deducted for earnings above ₹30,000/month
                </Typography>
              )}
            </Alert>

            <FormControl component="fieldset" fullWidth sx={{ mb: 3 }}>
              <FormLabel component="legend">Payout Method</FormLabel>
              <RadioGroup
                value={payoutMethod}
                onChange={(e) => setPayoutMethod(e.target.value)}
              >
                <FormControlLabel 
                  value="bank_transfer" 
                  control={<Radio />} 
                  label="Bank Transfer (NEFT/IMPS)" 
                />
                <FormControlLabel 
                  value="upi" 
                  control={<Radio />} 
                  label="UPI" 
                />
                <FormControlLabel 
                  value="paytm" 
                  control={<Radio />} 
                  label="PayTM" 
                />
              </RadioGroup>
            </FormControl>

            {payoutMethod === 'bank_transfer' && (
              <Stack spacing={2}>
                <TextField
                  fullWidth
                  label="Account Holder Name"
                  value={bankDetails.accountHolderName}
                  onChange={(e) => setBankDetails({ ...bankDetails, accountHolderName: e.target.value })}
                />
                <TextField
                  fullWidth
                  label="Account Number"
                  value={bankDetails.accountNumber}
                  onChange={(e) => setBankDetails({ ...bankDetails, accountNumber: e.target.value })}
                />
                <TextField
                  fullWidth
                  label="IFSC Code"
                  value={bankDetails.ifscCode}
                  onChange={(e) => setBankDetails({ ...bankDetails, ifscCode: e.target.value })}
                />
                <TextField
                  fullWidth
                  label="Bank Name"
                  value={bankDetails.bankName}
                  onChange={(e) => setBankDetails({ ...bankDetails, bankName: e.target.value })}
                />
              </Stack>
            )}

            {(payoutMethod === 'upi' || payoutMethod === 'paytm') && (
              <TextField
                fullWidth
                label="UPI ID / Phone Number"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                placeholder="yourname@upi or 9876543210"
              />
            )}

            <TextField
              fullWidth
              multiline
              rows={2}
              label="Notes (Optional)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              sx={{ mt: 2 }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPayoutDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleRequestPayout}>
            Request Payout
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

