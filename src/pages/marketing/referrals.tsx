import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  FormControlLabel,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Switch,
  Tab,
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
  alpha,
  useTheme,
} from '@mui/material';
import Grid from '@mui/material/GridLegacy';
import {
  Add as AddIcon,
  Share as ShareIcon,
  Block as BlockIcon,
  TimerOff as TimerOffIcon,
} from '@mui/icons-material';
import { PageHeader } from '../../components/common/PageHeader';
import { appToast } from '../../lib/appToast';
import { useAppConfirm } from '../../components/providers/AppDialogsProvider';
import {
  ReferralsService,
  type ReferralRow,
  type ReferralStats,
  type ReferralPayoutReportResponse,
} from '../../services/api/referrals.service';

function formatMoney(amount: number, currency = 'INR') {
  const sym = currency === 'INR' ? '₹' : `${currency} `;
  return `${sym}${amount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
}

export default function Referrals() {
  const theme = useTheme();
  const confirm = useAppConfirm();

  const [mainTab, setMainTab] = useState(0);
  const [filterTab, setFilterTab] = useState(0);

  const [referrals, setReferrals] = useState<ReferralRow[]>([]);
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [loading, setLoading] = useState(true);

  const [progLoading, setProgLoading] = useState(false);
  const [progEnabled, setProgEnabled] = useState(false);
  const [creditRupee, setCreditRupee] = useState(0);
  /** Empty string = backend uses env default for that field */
  const [refereeRewardRupee, setRefereeRewardRupee] = useState('');
  const [referrerRewardRupee, setReferrerRewardRupee] = useState('');
  const [minQualifyingRupee, setMinQualifyingRupee] = useState('');
  const [savingProg, setSavingProg] = useState(false);

  const [payoutReport, setPayoutReport] = useState<ReferralPayoutReportResponse | null>(null);
  const [payoutLoading, setPayoutLoading] = useState(false);
  const [payoutPage, setPayoutPage] = useState(1);
  const [payoutUserInput, setPayoutUserInput] = useState('');
  const [payoutUserFilter, setPayoutUserFilter] = useState('');
  const [payoutWalletRole, setPayoutWalletRole] = useState<'all' | 'referee' | 'referrer'>('all');

  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState<{
    referrer_id: string;
    referee_id: string;
    reward_type: ReferralRow['reward_type'];
    referrer_reward: number;
    referee_reward: number;
    completion_requirement: 'first_order' | 'first_booking' | 'first_payment' | 'minimum_spend';
    minimum_spend: number;
  }>({
    referrer_id: '',
    referee_id: '',
    reward_type: 'credit',
    referrer_reward: 0,
    referee_reward: 0,
    completion_requirement: 'first_order',
    minimum_spend: 0,
  });

  const loadActivity = useCallback(async () => {
    setLoading(true);
    try {
      const [listRes, statsRes] = await Promise.all([
        ReferralsService.getAdminReferrals({ limit: 200, page: 1 }),
        ReferralsService.getStats(),
      ]);
      if (listRes.success && listRes.data?.referrals) {
        setReferrals(listRes.data.referrals);
      } else {
        setReferrals([]);
      }
      if (statsRes.success && statsRes.data) {
        setStats(statsRes.data);
      } else {
        setStats(null);
      }
    } catch {
      setReferrals([]);
      setStats(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadProgram = useCallback(async () => {
    setProgLoading(true);
    try {
      const res = await ReferralsService.getProgramSettings();
      if (res.success && res.data) {
        setProgEnabled(res.data.firstSignupCreditEnabled);
        setCreditRupee(res.data.firstSignupCreditAmountPaise / 100);
        setRefereeRewardRupee(
          res.data.referralDefaultRefereeRewardPaise != null
            ? String(res.data.referralDefaultRefereeRewardPaise / 100)
            : '',
        );
        setReferrerRewardRupee(
          res.data.referralDefaultReferrerRewardPaise != null
            ? String(res.data.referralDefaultReferrerRewardPaise / 100)
            : '',
        );
        setMinQualifyingRupee(
          res.data.referralMinQualifyingSpendPaise != null
            ? String(res.data.referralMinQualifyingSpendPaise / 100)
            : '',
        );
      }
    } finally {
      setProgLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadActivity();
  }, [loadActivity]);

  useEffect(() => {
    if (mainTab === 1) void loadProgram();
  }, [mainTab, loadProgram]);

  const loadPayoutReport = useCallback(async () => {
    setPayoutLoading(true);
    try {
      const res = await ReferralsService.getPayoutReport({
        page: payoutPage,
        limit: 50,
        user_id: payoutUserFilter.trim() || undefined,
        wallet_role: payoutWalletRole,
      });
      if (res.success && res.data) {
        setPayoutReport(res.data);
      } else {
        setPayoutReport(null);
      }
    } catch {
      setPayoutReport(null);
    } finally {
      setPayoutLoading(false);
    }
  }, [payoutPage, payoutUserFilter, payoutWalletRole]);

  useEffect(() => {
    if (mainTab === 2) void loadPayoutReport();
  }, [mainTab, loadPayoutReport]);

  const applyPayoutFilters = () => {
    setPayoutUserFilter(payoutUserInput.trim());
    setPayoutPage(1);
  };

  const filtered = referrals.filter((r) => {
    if (filterTab === 1) return r.status === 'completed';
    if (filterTab === 2) return r.status === 'pending';
    return true;
  });

  const saveProgram = async () => {
    const parsePaiseOrNull = (raw: string): number | null | 'invalid' => {
      const t = raw.trim();
      if (t === '') return null;
      const n = parseFloat(t);
      if (Number.isNaN(n) || n < 0) return 'invalid';
      return Math.round(n * 100);
    };

    const refP = parsePaiseOrNull(refereeRewardRupee);
    const referP = parsePaiseOrNull(referrerRewardRupee);
    const minP = parsePaiseOrNull(minQualifyingRupee);
    if (refP === 'invalid' || referP === 'invalid' || minP === 'invalid') {
      appToast('Enter valid non‑negative rupee amounts or leave blank for env defaults', 'error');
      return;
    }

    setSavingProg(true);
    try {
      const paise = Math.round(Math.max(0, creditRupee) * 100);
      const res = await ReferralsService.updateProgramSettings({
        firstSignupCreditEnabled: progEnabled,
        firstSignupCreditAmountPaise: paise,
        referralDefaultRefereeRewardPaise: refP,
        referralDefaultReferrerRewardPaise: referP,
        referralMinQualifyingSpendPaise: minP,
      });
      if (res.success) {
        appToast('Signup credit settings saved', 'success');
      } else {
        appToast(res.message || 'Could not save settings', 'error');
      }
    } catch {
      appToast('Could not save settings', 'error');
    } finally {
      setSavingProg(false);
    }
  };

  const handleCancel = async (row: ReferralRow) => {
    const ok = await confirm({
      title: 'Cancel referral?',
      message: `Cancel referral ${row.referral_code}?`,
      danger: true,
      confirmLabel: 'Cancel referral',
    });
    if (!ok) return;
    const res = await ReferralsService.cancelReferral(row.id);
    if (res.success) {
      appToast('Referral cancelled', 'success');
      void loadActivity();
    } else {
      appToast(res.message || 'Failed', 'error');
    }
  };

  const handleExpire = async (row: ReferralRow) => {
    const ok = await confirm({
      title: 'Mark referral expired?',
      message: `Expire referral ${row.referral_code}?`,
      danger: true,
      confirmLabel: 'Expire',
    });
    if (!ok) return;
    const res = await ReferralsService.expireReferral(row.id);
    if (res.success) {
      appToast('Referral expired', 'success');
      void loadActivity();
    } else {
      appToast(res.message || 'Failed', 'error');
    }
  };

  const submitCreate = async () => {
    if (!createForm.referrer_id.trim() || !createForm.referee_id.trim()) {
      appToast('Referrer and referee user IDs are required', 'error');
      return;
    }
    if (createForm.referrer_id.trim() === createForm.referee_id.trim()) {
      appToast('Referrer and referee must be different users', 'error');
      return;
    }
    setCreating(true);
    try {
      const res = await ReferralsService.createReferral({
        referrer_id: createForm.referrer_id.trim(),
        referee_id: createForm.referee_id.trim(),
        reward_type: createForm.reward_type,
        referrer_reward: createForm.referrer_reward,
        referee_reward: createForm.referee_reward,
        referrer_reward_currency: 'INR',
        referee_reward_currency: 'INR',
        completion_requirement: createForm.completion_requirement,
        minimum_spend:
          createForm.completion_requirement === 'minimum_spend'
            ? createForm.minimum_spend
            : undefined,
      });
      if (res.success) {
        appToast('Referral recorded', 'success');
        setCreateOpen(false);
        setCreateForm({
          referrer_id: '',
          referee_id: '',
          reward_type: 'credit',
          referrer_reward: 0,
          referee_reward: 0,
          completion_requirement: 'first_order',
          minimum_spend: 0,
        });
        void loadActivity();
      } else {
        appToast(res.message || 'Failed to create referral', 'error');
      }
    } finally {
      setCreating(false);
    }
  };

  const totalShown = stats?.total_referrals ?? referrals.length;
  const completedShown = stats?.completed_referrals ?? referrals.filter((r) => r.status === 'completed').length;
  const pendingShown = stats?.pending_referrals ?? referrals.filter((r) => r.status === 'pending').length;
  const rewardsShown =
    stats?.total_rewards_given ??
    referrals.reduce((s, r) => s + r.referrer_reward + r.referee_reward, 0);

  const statusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'pending':
        return 'warning';
      case 'expired':
        return 'error';
      case 'cancelled':
        return 'default';
      default:
        return 'default';
    }
  };

  return (
    <Box sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
      <PageHeader
        title="Referrals"
        subtitle="Referral rows, wallet payout ledger, and program defaults (signup credit + new-code rewards)"
        action={
          <Stack direction="row" spacing={1}>
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={() => setCreateOpen(true)}
              sx={{ borderRadius: 2 }}
            >
              Record referral
            </Button>
          </Stack>
        }
      />

      <Card sx={{ borderRadius: 2, mb: 3 }}>
        <Tabs value={mainTab} onChange={(_, v) => setMainTab(v)}>
          <Tab label="Referral activity" />
          <Tab label="Program settings" />
          <Tab label="Reward payouts" />
        </Tabs>
      </Card>

      {mainTab === 1 ? (
        <Card sx={{ borderRadius: 2 }}>
          <CardContent sx={{ p: 4 }}>
            {progLoading ? (
              <Box display="flex" justifyContent="center" py={6}>
                <CircularProgress />
              </Box>
            ) : (
              <Stack spacing={3} maxWidth={560}>
                <Typography variant="body2" color="text.secondary">
                  When enabled, new customers receive this wallet credit once after email / OAuth signup
                  (Mongo auth flow). Amount is stored in paise internally. If disabled here, the server falls back to
                  the <code>WALLET_SIGNUP_BONUS_PAISE</code> environment default.
                </Typography>
                <FormControlLabel
                  control={
                    <Switch
                      checked={progEnabled}
                      onChange={(e) => setProgEnabled(e.target.checked)}
                    />
                  }
                  label="Enable admin-controlled signup credit"
                />
                <TextField
                  label="Credit amount (₹)"
                  type="number"
                  value={creditRupee}
                  onChange={(e) => setCreditRupee(Number(e.target.value))}
                  inputProps={{ min: 0, step: 1 }}
                  helperText="Whole rupees; converted to paise for the wallet."
                />
                <Divider sx={{ my: 1 }} />
                <Typography variant="subtitle2" color="text.secondary">
                  Default referral rewards (new share codes)
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Applies when generating a new wallet referral row (customer app + admin). Leave a field empty to use
                  the server env defaults (<code>REFERRAL_DEFAULT_*</code> / <code>REFERRAL_MIN_QUALIFYING_SPEND_*</code>
                  ). Existing referral rows keep their stored amounts.
                </Typography>
                <TextField
                  label="Friend (referee) reward after qualifying order (₹)"
                  value={refereeRewardRupee}
                  onChange={(e) => setRefereeRewardRupee(e.target.value)}
                  placeholder="Env default"
                  helperText="Wallet credit for the new customer."
                />
                <TextField
                  label="Referrer reward after qualifying order (₹)"
                  value={referrerRewardRupee}
                  onChange={(e) => setReferrerRewardRupee(e.target.value)}
                  placeholder="Env default"
                  helperText="Wallet credit for the user who shared the code."
                />
                <TextField
                  label="Minimum qualifying first paid total (₹)"
                  value={minQualifyingRupee}
                  onChange={(e) => setMinQualifyingRupee(e.target.value)}
                  placeholder="Env default"
                  helperText="Order or booking paid total must meet this before rewards credit."
                />
                <Button
                  variant="contained"
                  onClick={() => void saveProgram()}
                  disabled={savingProg}
                  sx={{ alignSelf: 'flex-start', borderRadius: 2 }}
                >
                  {savingProg ? 'Saving…' : 'Save'}
                </Button>
              </Stack>
            )}
          </CardContent>
        </Card>
      ) : mainTab === 2 ? (
        <Card sx={{ borderRadius: 2 }}>
          <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Wallet credits issued when referrals complete (sources{' '}
              <code>referral_referee</code> / <code>referral_referrer</code>), plus any legacy ledger reward rows.
            </Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 3 }} alignItems={{ sm: 'flex-end' }}>
              <TextField
                label="User id (Mongo ObjectId)"
                size="small"
                value={payoutUserInput}
                onChange={(e) => setPayoutUserInput(e.target.value)}
                sx={{ minWidth: 260 }}
                helperText="Optional; filters both tables"
              />
              <FormControl size="small" sx={{ minWidth: 180 }}>
                <InputLabel>Wallet role</InputLabel>
                <Select
                  label="Wallet role"
                  value={payoutWalletRole}
                  onChange={(e) => {
                    setPayoutWalletRole(e.target.value as 'all' | 'referee' | 'referrer');
                    setPayoutPage(1);
                  }}
                >
                  <MenuItem value="all">All wallet payouts</MenuItem>
                  <MenuItem value="referee">Friend (referee) only</MenuItem>
                  <MenuItem value="referrer">Referrer only</MenuItem>
                </Select>
              </FormControl>
              <Button variant="contained" onClick={() => applyPayoutFilters()} sx={{ borderRadius: 2 }}>
                Apply filters
              </Button>
              <Button variant="outlined" onClick={() => void loadPayoutReport()} sx={{ borderRadius: 2 }}>
                Refresh
              </Button>
            </Stack>

            {payoutLoading ? (
              <Box display="flex" justifyContent="center" py={8}>
                <CircularProgress />
              </Box>
            ) : payoutReport ? (
              <Stack spacing={4}>
                <Box>
                  <Typography variant="h6" sx={{ mb: 1 }}>
                    Wallet referral credits
                  </Typography>
                  <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
                    Total matching rows: {payoutReport.wallet.pagination.total} — page{' '}
                    {payoutReport.wallet.pagination.page} of {payoutReport.wallet.pagination.totalPages}
                  </Typography>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>When</TableCell>
                        <TableCell>User</TableCell>
                        <TableCell>Role</TableCell>
                        <TableCell align="right">Amount</TableCell>
                        <TableCell>Code / referral id</TableCell>
                        <TableCell>Order / booking</TableCell>
                        <TableCell>Description</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {payoutReport.wallet.items.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7}>
                            <Typography variant="body2" color="text.secondary">
                              No wallet referral credits for this page.
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ) : (
                        payoutReport.wallet.items.map((w) => (
                          <TableRow key={w.id}>
                            <TableCell>{new Date(w.created_at).toLocaleString()}</TableCell>
                            <TableCell sx={{ fontFamily: 'monospace', fontSize: 12 }}>{w.user_id}</TableCell>
                            <TableCell>{w.role}</TableCell>
                            <TableCell align="right">{formatMoney(w.amount_rupees)}</TableCell>
                            <TableCell sx={{ fontFamily: 'monospace', fontSize: 11 }}>
                              {[w.referral_code, w.referral_id].filter(Boolean).join(' · ') || '—'}
                            </TableCell>
                            <TableCell sx={{ fontFamily: 'monospace', fontSize: 11 }}>
                              {[w.order_id, w.booking_id].filter(Boolean).join(' · ') || '—'}
                            </TableCell>
                            <TableCell>{w.description}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </Box>

                <Divider />

                <Box>
                  <Typography variant="h6" sx={{ mb: 1 }}>
                    Legacy ledger rewards
                  </Typography>
                  <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
                    Total matching rows: {payoutReport.ledger.pagination.total} — page{' '}
                    {payoutReport.ledger.pagination.page} of {payoutReport.ledger.pagination.totalPages}
                  </Typography>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>When</TableCell>
                        <TableCell>User</TableCell>
                        <TableCell>Referral ledger id</TableCell>
                        <TableCell align="right">Amount</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Type</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {payoutReport.ledger.items.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6}>
                            <Typography variant="body2" color="text.secondary">
                              No legacy ledger rewards for this page.
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ) : (
                        payoutReport.ledger.items.map((r) => (
                          <TableRow key={r.id}>
                            <TableCell>{new Date(r.created_at).toLocaleString()}</TableCell>
                            <TableCell sx={{ fontFamily: 'monospace', fontSize: 12 }}>{r.user_id}</TableCell>
                            <TableCell sx={{ fontFamily: 'monospace', fontSize: 11 }}>{r.referral_id}</TableCell>
                            <TableCell align="right">
                              {formatMoney(r.amount, r.currency || 'INR')}
                            </TableCell>
                            <TableCell>{r.status}</TableCell>
                            <TableCell>{r.reward_type}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </Box>

                <Stack direction="row" spacing={2} alignItems="center">
                  <Button
                    variant="outlined"
                    disabled={payoutPage <= 1}
                    onClick={() => setPayoutPage((p) => Math.max(1, p - 1))}
                  >
                    Previous page
                  </Button>
                  <Typography variant="body2">Page {payoutPage}</Typography>
                  <Button
                    variant="outlined"
                    disabled={
                      !payoutReport ||
                      payoutPage >=
                        Math.max(
                          payoutReport.wallet.pagination.totalPages,
                          payoutReport.ledger.pagination.totalPages,
                        )
                    }
                    onClick={() => setPayoutPage((p) => p + 1)}
                  >
                    Next page
                  </Button>
                </Stack>
              </Stack>
            ) : (
              <Typography color="text.secondary">Could not load payout report.</Typography>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Card
                sx={{
                  borderRadius: 2,
                  background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.primary.main, 0.05)} 100%)`,
                  border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                }}
              >
                <CardContent>
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>
                    {totalShown}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total referrals
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card
                sx={{
                  borderRadius: 2,
                  background: `linear-gradient(135deg, ${alpha(theme.palette.success.main, 0.1)} 0%, ${alpha(theme.palette.success.main, 0.05)} 100%)`,
                  border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`,
                }}
              >
                <CardContent>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: theme.palette.success.main }}>
                    {completedShown}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Completed
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card
                sx={{
                  borderRadius: 2,
                  background: `linear-gradient(135deg, ${alpha(theme.palette.warning.main, 0.1)} 0%, ${alpha(theme.palette.warning.main, 0.05)} 100%)`,
                  border: `1px solid ${alpha(theme.palette.warning.main, 0.2)}`,
                }}
              >
                <CardContent>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: theme.palette.warning.main }}>
                    {pendingShown}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Pending
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card
                sx={{
                  borderRadius: 2,
                  background: `linear-gradient(135deg, ${alpha(theme.palette.info.main, 0.1)} 0%, ${alpha(theme.palette.info.main, 0.05)} 100%)`,
                  border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
                }}
              >
                <CardContent>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: theme.palette.info.main }}>
                    {formatMoney(rewardsShown)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Rewards (reported)
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <Card sx={{ borderRadius: 2 }}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}>
              <Tabs value={filterTab} onChange={(_, v) => setFilterTab(v)}>
                <Tab label={`All (${referrals.length})`} />
                <Tab label={`Completed (${referrals.filter((r) => r.status === 'completed').length})`} />
                <Tab label={`Pending (${referrals.filter((r) => r.status === 'pending').length})`} />
              </Tabs>
            </Box>
            <CardContent>
              {loading ? (
                <Box display="flex" justifyContent="center" py={8}>
                  <CircularProgress />
                </Box>
              ) : filtered.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 8 }}>
                  <ShareIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                  <Typography color="text.secondary">
                    No referrals match this filter
                  </Typography>
                </Box>
              ) : (
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Code</TableCell>
                      <TableCell>Referrer</TableCell>
                      <TableCell>Referee</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Rewards</TableCell>
                      <TableCell>Requirement</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filtered.map((r) => (
                      <TableRow key={r.id} hover>
                        <TableCell sx={{ fontFamily: 'monospace', fontWeight: 600 }}>
                          {r.referral_code}
                        </TableCell>
                        <TableCell>{r.referrer_id || '—'}</TableCell>
                        <TableCell>{r.referee_id?.trim() ? r.referee_id : '—'}</TableCell>
                        <TableCell>
                          <Chip
                            size="small"
                            label={r.status}
                            color={statusColor(r.status) as 'success' | 'warning' | 'error' | 'default'}
                            sx={{ textTransform: 'capitalize' }}
                          />
                        </TableCell>
                        <TableCell>
                          {formatMoney(r.referrer_reward, r.referrer_reward_currency)} /{' '}
                          {formatMoney(r.referee_reward, r.referee_reward_currency)}
                        </TableCell>
                        <TableCell sx={{ textTransform: 'capitalize' }}>
                          {(r.completion_requirement || '').replace(/_/g, ' ')}
                        </TableCell>
                        <TableCell align="right">
                          {r.status === 'pending' ? (
                            <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                              <Tooltip title="Cancel">
                                <IconButton size="small" onClick={() => void handleCancel(r)}>
                                  <BlockIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Expire">
                                <IconButton size="small" onClick={() => void handleExpire(r)}>
                                  <TimerOffIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </Stack>
                          ) : (
                            '—'
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </>
      )}

      <Dialog open={createOpen} onClose={() => !creating && setCreateOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Record referral</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Creates a referral row between two users. Use MongoDB user id (24 hex), email, or phone as stored on the
              user. Invite-link codes for customers are managed separately in the app wallet flow.
            </Typography>
            <TextField
              label="Referrer (user id, email, or phone)"
              fullWidth
              value={createForm.referrer_id}
              onChange={(e) => setCreateForm({ ...createForm, referrer_id: e.target.value })}
            />
            <TextField
              label="Referee (user id, email, or phone)"
              fullWidth
              value={createForm.referee_id}
              onChange={(e) => setCreateForm({ ...createForm, referee_id: e.target.value })}
            />
            <FormControl fullWidth>
              <InputLabel>Reward type</InputLabel>
              <Select
                label="Reward type"
                value={createForm.reward_type}
                onChange={(e) =>
                  setCreateForm({ ...createForm, reward_type: e.target.value as ReferralRow['reward_type'] })
                }
              >
                <MenuItem value="credit">Credit</MenuItem>
                <MenuItem value="discount">Discount</MenuItem>
                <MenuItem value="cashback">Cashback</MenuItem>
                <MenuItem value="free_service">Free service</MenuItem>
              </Select>
            </FormControl>
            <Stack direction="row" spacing={2}>
              <TextField
                label="Referrer reward (₹)"
                type="number"
                fullWidth
                value={createForm.referrer_reward}
                onChange={(e) =>
                  setCreateForm({ ...createForm, referrer_reward: Number(e.target.value) })
                }
              />
              <TextField
                label="Referee reward (₹)"
                type="number"
                fullWidth
                value={createForm.referee_reward}
                onChange={(e) =>
                  setCreateForm({ ...createForm, referee_reward: Number(e.target.value) })
                }
              />
            </Stack>
            <FormControl fullWidth>
              <InputLabel>Completion rule</InputLabel>
              <Select
                label="Completion rule"
                value={createForm.completion_requirement}
                onChange={(e) =>
                  setCreateForm({
                    ...createForm,
                    completion_requirement: e.target.value as
                      | 'first_order'
                      | 'first_booking'
                      | 'first_payment'
                      | 'minimum_spend',
                  })
                }
              >
                <MenuItem value="first_order">First order</MenuItem>
                <MenuItem value="first_booking">First booking</MenuItem>
                <MenuItem value="first_payment">First payment</MenuItem>
                <MenuItem value="minimum_spend">Minimum spend</MenuItem>
              </Select>
            </FormControl>
            {createForm.completion_requirement === 'minimum_spend' ? (
              <TextField
                label="Minimum spend (₹)"
                type="number"
                fullWidth
                value={createForm.minimum_spend}
                onChange={(e) =>
                  setCreateForm({ ...createForm, minimum_spend: Number(e.target.value) })
                }
              />
            ) : null}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateOpen(false)} disabled={creating}>
            Cancel
          </Button>
          <Button variant="contained" onClick={() => void submitCreate()} disabled={creating}>
            {creating ? 'Saving…' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
