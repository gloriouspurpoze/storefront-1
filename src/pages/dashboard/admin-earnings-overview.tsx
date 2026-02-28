/**
 * ============================================================================
 * ADMIN EARNINGS OVERVIEW PAGE
 * ============================================================================
 * Complete platform revenue and professional payout management:
 * - View platform earnings summary
 * - Track commission revenue
 * - See pending and completed payouts
 * - Approve payout requests
 * - Process payouts
 * - Verify cash/offline payments
 * 
 * @author CTO Team
 * @date November 10, 2025
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
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
  Stack,
  Paper,
  IconButton,
  Tooltip,
} from '@mui/material';
import Grid from '@mui/material/GridLegacy'
import {
  TrendingUp,
  AttachMoney,
  PendingActions,
  CheckCircle,
  AccountBalance,
  Refresh,
  Visibility,
  Check,
  Send,
} from '@mui/icons-material';
import { apiClient } from '../../services/apiClient';
import { useAppDispatch } from '../../store/hooks';
import { addToast } from '../../store/slices/uiSlice';

interface PlatformSummary {
  totalBookingAmount: number;
  totalPlatformCommission: number;
  totalProfessionalEarnings: number;
  totalBookings: number;
  pendingPayments: number;
  verifiedPayments: number;
  pendingPayouts: number;
  paidPayouts: number;
  cashInHand: number;
  outstandingToProvider: number;
}

interface Payout {
  _id: string;
  payoutReference: string;
  professionalId: any;
  grossAmount: number;
  tdsAmount: number;
  deductions: number;
  netAmount: number;
  payoutMethod: string;
  status: 'requested' | 'approved' | 'processing' | 'completed' | 'failed' | 'cancelled';
  requestedAt: string;
  approvedAt?: string;
  completedAt?: string;
  bankDetails?: any;
  upiId?: string;
  notes?: string;
  earningIds: any[];
}

interface Earning {
  _id: string;
  bookingId: any;
  professionalId: any;
  customerId: any;
  serviceName: string;
  bookingAmount: number;
  platformCommission: number;
  professionalEarnings: number;
  paymentMethod: string;
  paymentStatus: string;
  payoutStatus: string;
  completedDate: string;
}

export function AdminEarningsOverview() {
  const dispatch = useAppDispatch();
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<PlatformSummary | null>(null);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [earnings, setEarnings] = useState<Earning[]>([]);
  const [selectedPayout, setSelectedPayout] = useState<Payout | null>(null);
  const [completeDialogOpen, setCompleteDialogOpen] = useState(false);
  const [transactionRef, setTransactionRef] = useState('');

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load platform summary
      const summaryRes = (await apiClient.get('/api/earnings/admin/platform-summary')) as any;
      if (summaryRes.data.success) {
        setSummary(summaryRes.data.data);
      }

      // Load payouts
      if (activeTab === 0) {
        const payoutsRes = (await apiClient.get('/api/earnings/admin/payouts', {
          params: { status: 'requested' }
        })) as any;
        if (payoutsRes.data.success) {
          setPayouts(payoutsRes.data.data.payouts);
        }
      } else if (activeTab === 1) {
        const payoutsRes = (await apiClient.get('/api/earnings/admin/payouts', {
          params: { status: 'approved' }
        })) as any;
        if (payoutsRes.data.success) {
          setPayouts(payoutsRes.data.data.payouts);
        }
      } else if (activeTab === 2) {
        const payoutsRes = (await apiClient.get('/api/earnings/admin/payouts', {
          params: { status: 'completed' }
        })) as any;
        if (payoutsRes.data.success) {
          setPayouts(payoutsRes.data.data.payouts);
        }
      }
    } catch (error: any) {
      dispatch(addToast({ message: error.response?.data?.message || 'Failed to load earnings data', severity: 'error' }));
    } finally {
      setLoading(false);
    }
  };

  const handleApprovePayout = async (payoutId: string) => {
    try {
      const res = (await apiClient.post(`/api/earnings/admin/payouts/${payoutId}/approve`)) as any;
      if (res.data.success) {
        dispatch(addToast({ message: 'Payout approved successfully', severity: 'success' }));
        loadData();
      }
    } catch (error: any) {
      dispatch(addToast({ message: error.response?.data?.message || 'Failed to approve payout', severity: 'error' }));
    }
  };

  const handleCompletePayout = async () => {
    if (!selectedPayout || !transactionRef) {
      dispatch(addToast({ message: 'Please enter transaction reference', severity: 'error' }));
      return;
    }

    try {
      const res = (await apiClient.post(
        `/api/earnings/admin/payouts/${selectedPayout._id}/complete`,
        { transactionReference: transactionRef }
      )) as any;
      if (res.data.success) {
        dispatch(addToast({ message: 'Payout marked as completed', severity: 'success' }));
        setCompleteDialogOpen(false);
        setSelectedPayout(null);
        setTransactionRef('');
        loadData();
      }
    } catch (error: any) {
      dispatch(addToast({ message: error.response?.data?.message || 'Failed to complete payout', severity: 'error' }));
    }
  };

  const getStatusChip = (status: string) => {
    const config: any = {
      requested: { label: 'Requested', color: 'info' },
      approved: { label: 'Approved', color: 'warning' },
      processing: { label: 'Processing', color: 'warning' },
      completed: { label: 'Completed', color: 'success' },
      failed: { label: 'Failed', color: 'error' },
      cancelled: { label: 'Cancelled', color: 'default' },
    };
    const c = config[status] || config.requested;
    return <Chip label={c.label} color={c.color} size="small" />;
  };

  if (loading && !summary) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box mb={3} display="flex" justifyContent="space-between" alignItems="center">
        <Typography variant="h4" fontWeight="700">
          📊 Platform Earnings & Payouts
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
      {summary && (
        <Grid container spacing={3} mb={3}>
          <Grid item xs={12} md={3}>
            <Card sx={{ 
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white'
            }}>
              <CardContent>
                <Box display="flex" alignItems="center" mb={1}>
                  <AttachMoney sx={{ mr: 1 }} />
                  <Typography variant="body2">Total Revenue (GMV)</Typography>
                </Box>
                <Typography variant="h4" fontWeight="700">
                  ₹{summary.totalBookingAmount.toLocaleString()}
                </Typography>
                <Typography variant="caption" sx={{ opacity: 0.9 }}>
                  From {summary.totalBookings} bookings
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={3}>
            <Card sx={{ 
              background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
              color: 'white'
            }}>
              <CardContent>
                <Box display="flex" alignItems="center" mb={1}>
                  <TrendingUp sx={{ mr: 1 }} />
                  <Typography variant="body2">Platform Commission (Pending Receivable)</Typography>
                </Box>
                <Typography variant="h4" fontWeight="700">
                  ₹{summary.totalPlatformCommission.toLocaleString()}
                </Typography>
                <Typography variant="caption" sx={{ opacity: 0.9 }}>
                  Total receivable from completed bookings · {summary.totalBookingAmount ? ((summary.totalPlatformCommission / summary.totalBookingAmount) * 100).toFixed(1) : 0}% average
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={3}>
            <Card sx={{ 
              background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
              color: 'white'
            }}>
              <CardContent>
                <Box display="flex" alignItems="center" mb={1}>
                  <PendingActions sx={{ mr: 1 }} />
                  <Typography variant="body2">Pending Payouts</Typography>
                </Box>
                <Typography variant="h4" fontWeight="700">
                  ₹{summary.pendingPayouts.toLocaleString()}
                </Typography>
                <Typography variant="caption" sx={{ opacity: 0.9 }}>
                  Outstanding to professionals
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={3}>
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
                  ₹{summary.paidPayouts.toLocaleString()}
                </Typography>
                <Typography variant="caption" sx={{ opacity: 0.9 }}>
                  Successfully transferred
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Quick Stats */}
      {summary && (
        <Grid container spacing={2} mb={3}>
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Professional Earnings (Total)
              </Typography>
              <Typography variant="h6" fontWeight="600">
                ₹{summary.totalProfessionalEarnings.toLocaleString()}
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Pending Customer Payments
              </Typography>
              <Typography variant="h6" fontWeight="600" color="warning.main">
                ₹{summary.pendingPayments.toLocaleString()}
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Cash In Hand / Commission Received (Platform)
              </Typography>
              <Typography variant="h6" fontWeight="600" color="success.main">
                ₹{summary.cashInHand.toLocaleString()}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Commission available with platform
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      )}

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={(e, newValue) => setActiveTab(newValue)}
          variant="fullWidth"
        >
          <Tab icon={<PendingActions />} label="Payout Requests" />
          <Tab icon={<AccountBalance />} label="Approved Payouts" />
          <Tab icon={<CheckCircle />} label="Completed Payouts" />
        </Tabs>
      </Paper>

      {/* Payouts Table */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            {activeTab === 0 ? 'Payout Requests' : activeTab === 1 ? 'Approved Payouts' : 'Completed Payouts'}
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
                  <TableCell>Professional</TableCell>
                  <TableCell>Requested Date</TableCell>
                  <TableCell align="right">Gross Amount</TableCell>
                  <TableCell align="right">TDS</TableCell>
                  <TableCell align="right">Net Amount</TableCell>
                  <TableCell>Method</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {payouts.map((payout) => (
                  <TableRow key={payout._id}>
                    <TableCell>
                      <Typography fontWeight="600">{payout.payoutReference}</Typography>
                    </TableCell>
                    <TableCell>
                      {payout.professionalId?.firstName} {payout.professionalId?.lastName}
                      <Typography variant="caption" display="block">
                        {payout.professionalId?.phoneNumber}
                      </Typography>
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
                      {payout.payoutMethod === 'bank_transfer' && payout.bankDetails && (
                        <Tooltip title={`${payout.bankDetails.accountNumber} - ${payout.bankDetails.ifscCode}`}>
                          <IconButton size="small">
                            <Visibility fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                      {(payout.payoutMethod === 'upi' || payout.payoutMethod === 'paytm') && payout.upiId && (
                        <Typography variant="caption" display="block">
                          {payout.upiId}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>{getStatusChip(payout.status)}</TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={1}>
                        {activeTab === 0 && payout.status === 'requested' && (
                          <Button
                            size="small"
                            variant="contained"
                            color="success"
                            startIcon={<Check />}
                            onClick={() => handleApprovePayout(payout._id)}
                          >
                            Approve
                          </Button>
                        )}
                        {activeTab === 1 && payout.status === 'approved' && (
                          <Button
                            size="small"
                            variant="contained"
                            startIcon={<Send />}
                            onClick={() => {
                              setSelectedPayout(payout);
                              setCompleteDialogOpen(true);
                            }}
                          >
                            Mark Complete
                          </Button>
                        )}
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <Alert severity="info">
              No {activeTab === 0 ? 'pending' : activeTab === 1 ? 'approved' : 'completed'} payouts
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Complete Payout Dialog */}
      <Dialog
        open={completeDialogOpen}
        onClose={() => setCompleteDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Complete Payout</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            {selectedPayout && (
              <Box mb={3}>
                <Typography variant="body2" gutterBottom>
                  <strong>Payout Reference:</strong> {selectedPayout.payoutReference}
                </Typography>
                <Typography variant="body2" gutterBottom>
                  <strong>Professional:</strong> {selectedPayout.professionalId?.firstName} {selectedPayout.professionalId?.lastName}
                </Typography>
                <Typography variant="body2" gutterBottom>
                  <strong>Amount:</strong> ₹{selectedPayout.netAmount.toLocaleString()}
                </Typography>
                <Typography variant="body2" gutterBottom>
                  <strong>Method:</strong> {selectedPayout.payoutMethod.toUpperCase().replace('_', ' ')}
                </Typography>
              </Box>
            )}

            <TextField
              fullWidth
              label="Transaction Reference / UTR Number"
              value={transactionRef}
              onChange={(e) => setTransactionRef(e.target.value)}
              placeholder="Enter bank transaction reference"
              helperText="Enter the UTR/Transaction ID from your bank transfer"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCompleteDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCompletePayout}>
            Mark as Completed
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

