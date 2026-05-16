import React, { useState, useEffect, useCallback } from 'react';
import {
  Loader2,
  Plus,
  Share2,
  Ban,
  TimerOff,
} from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { appToast } from '../../lib/appToast';
import { cn } from '../../lib/utils';
import { useAppConfirm } from '../../components/providers/AppDialogsProvider';
import {
  ReferralsService,
  type ReferralRow,
  type ReferralStats,
  type ReferralPayoutReportResponse,
} from '../../services/api/referrals.service';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Separator,
  Switch,
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
  TooltipProvider,
  TooltipTrigger,
} from '../../components/ui';

function formatMoney(amount: number, currency = 'INR') {
  const sym = currency === 'INR' ? '₹' : `${currency} `;
  return `${sym}${amount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
}

export default function Referrals() {
  const confirm = useAppConfirm();

  const [mainTab, setMainTab] = useState(0);
  const [filterTab, setFilterTab] = useState(0);

  const [referrals, setReferrals] = useState<ReferralRow[]>([]);
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [loading, setLoading] = useState(true);

  const [progLoading, setProgLoading] = useState(false);
  const [progEnabled, setProgEnabled] = useState(false);
  /** Rupees as string so empty input is not coerced to 0 on save. */
  const [creditRupeeInput, setCreditRupeeInput] = useState('100');
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
        const rupees = res.data.firstSignupCreditAmountPaise / 100;
        setCreditRupeeInput(rupees > 0 ? String(rupees) : '100');
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

    if (progEnabled) {
      const trimmed = creditRupeeInput.trim();
      if (trimmed === '') {
        appToast('Enter a signup credit amount (₹) or turn off admin control to use the server env default only', 'error');
        return;
      }
      const rupees = parseFloat(trimmed);
      if (Number.isNaN(rupees) || rupees < 1) {
        appToast('Signup credit must be at least ₹1 when admin control is enabled', 'error');
        return;
      }
    }

    setSavingProg(true);
    try {
      const creditRupee = progEnabled ? parseFloat(creditRupeeInput.trim()) : 0;
      const paise = progEnabled ? Math.round(Math.max(0, creditRupee) * 100) : 0;
      const res = await ReferralsService.updateProgramSettings({
        firstSignupCreditEnabled: progEnabled,
        firstSignupCreditAmountPaise: paise,
        referralDefaultRefereeRewardPaise: refP,
        referralDefaultReferrerRewardPaise: referP,
        referralMinQualifyingSpendPaise: minP,
      });
      if (res.success) {
        appToast('Signup credit settings saved', 'success');
        if (res.data) {
          setProgEnabled(res.data.firstSignupCreditEnabled);
          const savedRupees = res.data.firstSignupCreditAmountPaise / 100;
          setCreditRupeeInput(
            res.data.firstSignupCreditEnabled && savedRupees > 0 ? String(savedRupees) : '100',
          );
        } else {
          void loadProgram();
        }
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

  const statusVariant = (status: string): 'success' | 'warning' | 'destructive' | 'secondary' | 'outline' => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'pending':
        return 'warning';
      case 'expired':
        return 'destructive';
      case 'cancelled':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  return (
    <TooltipProvider>
      <div className="p-4 sm:p-6 md:p-8">
        <PageHeader
          title="Referrals"
          subtitle="Referral rows, wallet payout ledger, and program defaults (signup credit + new-code rewards)"
          action={
            <div className="flex flex-row gap-1">
              <Button variant="outline" className="rounded-lg" onClick={() => setCreateOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Record referral
              </Button>
            </div>
          }
        />

        <Card className="mb-6 rounded-lg">
          <Tabs value={String(mainTab)} onValueChange={(v) => setMainTab(Number(v))}>
            <TabsList className="grid h-auto w-full grid-cols-3 rounded-none border-b bg-transparent p-0">
              <TabsTrigger
                value="0"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
              >
                Referral activity
              </TabsTrigger>
              <TabsTrigger
                value="1"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
              >
                Program settings
              </TabsTrigger>
              <TabsTrigger
                value="2"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
              >
                Reward payouts
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </Card>

        {mainTab === 1 ? (
          <Card className="rounded-lg">
            <CardContent className="p-8">
              {progLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="flex max-w-xl flex-col gap-6">
                  <p className="text-sm text-muted-foreground">
                    New customers (email register or Google sign-in) receive a one-time{' '}
                    <code className="rounded bg-muted px-1">signup_bonus</code> wallet credit after account creation.
                  </p>
                  <div
                    className={cn(
                      'rounded-lg border px-4 py-3 text-sm',
                      progEnabled
                        ? 'border-primary/30 bg-primary/5 text-foreground'
                        : 'border-border bg-muted/40 text-muted-foreground',
                    )}
                  >
                    {progEnabled ? (
                      <>
                        <strong className="font-medium">Admin amount active.</strong> New users get ₹
                        {creditRupeeInput.trim() || '—'} once. Set at least ₹1 before saving.
                      </>
                    ) : (
                      <>
                        <strong className="font-medium">Server env default.</strong> Uses API env{' '}
                        <code className="rounded bg-muted px-1">WALLET_SIGNUP_BONUS_PAISE</code> (often ₹100). Enable
                        admin control below to set a fixed ₹ amount.
                      </>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      id="prog-enabled"
                      checked={progEnabled}
                      onCheckedChange={(checked) => {
                        setProgEnabled(checked);
                        if (checked && (!creditRupeeInput.trim() || Number(creditRupeeInput) < 1)) {
                          setCreditRupeeInput('100');
                        }
                      }}
                    />
                    <Label htmlFor="prog-enabled">Use admin signup credit amount (override env default)</Label>
                  </div>
                  <div className={cn('space-y-2', !progEnabled && 'pointer-events-none opacity-50')}>
                    <Label htmlFor="credit-rupee">Credit amount (₹)</Label>
                    <Input
                      id="credit-rupee"
                      type="number"
                      min={1}
                      step={1}
                      value={creditRupeeInput}
                      disabled={!progEnabled}
                      onChange={(e) => setCreditRupeeInput(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Required when admin control is on (₹50–₹150 typical). Saving ₹0 with the toggle on previously
                      blocked welcome credits for new users.
                    </p>
                  </div>
                  <Separator />
                  <p className="text-sm font-medium text-muted-foreground">Default referral rewards (new share codes)</p>
                  <p className="text-sm text-muted-foreground">
                    Applies when generating a new wallet referral row (customer app + admin). Leave a field empty to use
                    the server env defaults (<code className="rounded bg-muted px-1">REFERRAL_DEFAULT_*</code> /{' '}
                    <code className="rounded bg-muted px-1">REFERRAL_MIN_QUALIFYING_SPEND_*</code>
                    ). Existing referral rows keep their stored amounts.
                  </p>
                  <div className="space-y-2">
                    <Label htmlFor="referee-reward">Friend (referee) reward after qualifying order (₹)</Label>
                    <Input
                      id="referee-reward"
                      value={refereeRewardRupee}
                      onChange={(e) => setRefereeRewardRupee(e.target.value)}
                      placeholder="Env default"
                    />
                    <p className="text-xs text-muted-foreground">Wallet credit for the new customer.</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="referrer-reward">Referrer reward after qualifying order (₹)</Label>
                    <Input
                      id="referrer-reward"
                      value={referrerRewardRupee}
                      onChange={(e) => setReferrerRewardRupee(e.target.value)}
                      placeholder="Env default"
                    />
                    <p className="text-xs text-muted-foreground">Wallet credit for the user who shared the code.</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="min-qual">Minimum qualifying first paid total (₹)</Label>
                    <Input
                      id="min-qual"
                      value={minQualifyingRupee}
                      onChange={(e) => setMinQualifyingRupee(e.target.value)}
                      placeholder="Env default"
                    />
                    <p className="text-xs text-muted-foreground">
                      Order or booking paid total must meet this before rewards credit.
                    </p>
                  </div>
                  <Button className="self-start rounded-lg" onClick={() => void saveProgram()} disabled={savingProg}>
                    {savingProg ? 'Saving…' : 'Save'}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ) : mainTab === 2 ? (
          <Card className="rounded-lg">
            <CardContent className="p-4 sm:p-6">
              <p className="mb-4 text-sm text-muted-foreground">
                Wallet credits issued when referrals complete (sources{' '}
                <code className="rounded bg-muted px-1">referral_referee</code> /{' '}
                <code className="rounded bg-muted px-1">referral_referrer</code>), plus any legacy ledger reward rows.
              </p>
              <div className="mb-6 flex flex-col items-stretch gap-4 sm:flex-row sm:items-end">
                <div className="min-w-[260px] flex-1 space-y-2">
                  <Label htmlFor="payout-user">User id (Mongo ObjectId)</Label>
                  <Input
                    id="payout-user"
                    value={payoutUserInput}
                    onChange={(e) => setPayoutUserInput(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">Optional; filters both tables</p>
                </div>
                <div className="w-full min-w-[180px] space-y-2 sm:w-auto">
                  <Label>Wallet role</Label>
                  <Select
                    value={payoutWalletRole}
                    onValueChange={(v) => {
                      setPayoutWalletRole(v as 'all' | 'referee' | 'referrer');
                      setPayoutPage(1);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Wallet role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All wallet payouts</SelectItem>
                      <SelectItem value="referee">Friend (referee) only</SelectItem>
                      <SelectItem value="referrer">Referrer only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button className="rounded-lg" onClick={() => applyPayoutFilters()}>
                  Apply filters
                </Button>
                <Button variant="outline" className="rounded-lg" onClick={() => void loadPayoutReport()}>
                  Refresh
                </Button>
              </div>

              {payoutLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : payoutReport ? (
                <div className="flex flex-col gap-8">
                  <div>
                    <h3 className="mb-1 text-lg font-semibold">Wallet referral credits</h3>
                    <p className="mb-2 block text-xs text-muted-foreground">
                      Total matching rows: {payoutReport.wallet.pagination.total} — page{' '}
                      {payoutReport.wallet.pagination.page} of {payoutReport.wallet.pagination.totalPages}
                    </p>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>When</TableHead>
                          <TableHead>User</TableHead>
                          <TableHead>Role</TableHead>
                          <TableHead className="text-right">Amount</TableHead>
                          <TableHead>Code / referral id</TableHead>
                          <TableHead>Order / booking</TableHead>
                          <TableHead>Description</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {payoutReport.wallet.items.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={7}>
                              <p className="text-sm text-muted-foreground">No wallet referral credits for this page.</p>
                            </TableCell>
                          </TableRow>
                        ) : (
                          payoutReport.wallet.items.map((w) => (
                            <TableRow key={w.id}>
                              <TableCell>{new Date(w.created_at).toLocaleString()}</TableCell>
                              <TableCell className="font-mono text-xs">{w.user_id}</TableCell>
                              <TableCell>{w.role}</TableCell>
                              <TableCell className="text-right">{formatMoney(w.amount_rupees)}</TableCell>
                              <TableCell className="font-mono text-[11px]">
                                {[w.referral_code, w.referral_id].filter(Boolean).join(' · ') || '—'}
                              </TableCell>
                              <TableCell className="font-mono text-[11px]">
                                {[w.order_id, w.booking_id].filter(Boolean).join(' · ') || '—'}
                              </TableCell>
                              <TableCell>{w.description}</TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="mb-1 text-lg font-semibold">Legacy ledger rewards</h3>
                    <p className="mb-2 block text-xs text-muted-foreground">
                      Total matching rows: {payoutReport.ledger.pagination.total} — page{' '}
                      {payoutReport.ledger.pagination.page} of {payoutReport.ledger.pagination.totalPages}
                    </p>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>When</TableHead>
                          <TableHead>User</TableHead>
                          <TableHead>Referral ledger id</TableHead>
                          <TableHead className="text-right">Amount</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Type</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {payoutReport.ledger.items.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={6}>
                              <p className="text-sm text-muted-foreground">No legacy ledger rewards for this page.</p>
                            </TableCell>
                          </TableRow>
                        ) : (
                          payoutReport.ledger.items.map((r) => (
                            <TableRow key={r.id}>
                              <TableCell>{new Date(r.created_at).toLocaleString()}</TableCell>
                              <TableCell className="font-mono text-xs">{r.user_id}</TableCell>
                              <TableCell className="font-mono text-[11px]">{r.referral_id}</TableCell>
                              <TableCell className="text-right">
                                {formatMoney(r.amount, r.currency || 'INR')}
                              </TableCell>
                              <TableCell>{r.status}</TableCell>
                              <TableCell>{r.reward_type}</TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>

                  <div className="flex flex-row items-center gap-4">
                    <Button
                      variant="outline"
                      disabled={payoutPage <= 1}
                      onClick={() => setPayoutPage((p) => Math.max(1, p - 1))}
                    >
                      Previous page
                    </Button>
                    <p className="text-sm">Page {payoutPage}</p>
                    <Button
                      variant="outline"
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
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground">Could not load payout report.</p>
              )}
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
              <Card className="rounded-lg border border-primary/20 bg-gradient-to-br from-primary/10 to-primary/5">
                <CardContent className="pt-6">
                  <p className="text-2xl font-bold">{totalShown}</p>
                  <p className="text-sm text-muted-foreground">Total referrals</p>
                </CardContent>
              </Card>
              <Card className="rounded-lg border border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 to-emerald-500/5">
                <CardContent className="pt-6">
                  <p className="text-2xl font-bold text-emerald-600">{completedShown}</p>
                  <p className="text-sm text-muted-foreground">Completed</p>
                </CardContent>
              </Card>
              <Card className="rounded-lg border border-amber-500/20 bg-gradient-to-br from-amber-500/10 to-amber-500/5">
                <CardContent className="pt-6">
                  <p className="text-2xl font-bold text-amber-600">{pendingShown}</p>
                  <p className="text-sm text-muted-foreground">Pending</p>
                </CardContent>
              </Card>
              <Card className="rounded-lg border border-sky-500/20 bg-gradient-to-br from-sky-500/10 to-sky-500/5">
                <CardContent className="pt-6">
                  <p className="text-2xl font-bold text-sky-600">{formatMoney(rewardsShown)}</p>
                  <p className="text-sm text-muted-foreground">Rewards (reported)</p>
                </CardContent>
              </Card>
            </div>

            <Card className="rounded-lg">
              <div className="border-b px-2">
                <Tabs value={String(filterTab)} onValueChange={(v) => setFilterTab(Number(v))}>
                  <TabsList className="grid h-auto w-full grid-cols-3 rounded-none border-0 bg-transparent p-0">
                    <TabsTrigger
                      value="0"
                      className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
                    >
                      All ({referrals.length})
                    </TabsTrigger>
                    <TabsTrigger
                      value="1"
                      className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
                    >
                      Completed ({referrals.filter((r) => r.status === 'completed').length})
                    </TabsTrigger>
                    <TabsTrigger
                      value="2"
                      className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
                    >
                      Pending ({referrals.filter((r) => r.status === 'pending').length})
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
              <CardContent>
                {loading ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : filtered.length === 0 ? (
                  <div className="py-12 text-center">
                    <Share2 className="mx-auto mb-2 h-12 w-12 text-muted-foreground" />
                    <p className="text-muted-foreground">No referrals match this filter</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Code</TableHead>
                        <TableHead>Referrer</TableHead>
                        <TableHead>Referee</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Rewards</TableHead>
                        <TableHead>Requirement</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filtered.map((r) => (
                        <TableRow key={r.id} className="hover:bg-muted/50">
                          <TableCell className="font-mono font-semibold">{r.referral_code}</TableCell>
                          <TableCell>{r.referrer_id || '—'}</TableCell>
                          <TableCell>{r.referee_id?.trim() ? r.referee_id : '—'}</TableCell>
                          <TableCell>
                            <Badge variant={statusVariant(r.status)} className="capitalize">
                              {r.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {formatMoney(r.referrer_reward, r.referrer_reward_currency)} /{' '}
                            {formatMoney(r.referee_reward, r.referee_reward_currency)}
                          </TableCell>
                          <TableCell className="capitalize">
                            {(r.completion_requirement || '').replace(/_/g, ' ')}
                          </TableCell>
                          <TableCell className="text-right">
                            {r.status === 'pending' ? (
                              <div className="flex justify-end gap-1">
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => void handleCancel(r)}>
                                      <Ban className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Cancel</TooltipContent>
                                </Tooltip>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => void handleExpire(r)}>
                                      <TimerOff className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Expire</TooltipContent>
                                </Tooltip>
                              </div>
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

        <Dialog open={createOpen} onOpenChange={(o) => !creating && setCreateOpen(o)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Record referral</DialogTitle>
            </DialogHeader>
            <div className="mt-2 flex flex-col gap-4">
              <p className="text-sm text-muted-foreground">
                Creates a referral row between two users. Use MongoDB user id (24 hex), email, or phone as stored on the
                user. Invite-link codes for customers are managed separately in the app wallet flow.
              </p>
              <div className="space-y-2">
                <Label htmlFor="create-referrer">Referrer (user id, email, or phone)</Label>
                <Input
                  id="create-referrer"
                  value={createForm.referrer_id}
                  onChange={(e) => setCreateForm({ ...createForm, referrer_id: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-referee">Referee (user id, email, or phone)</Label>
                <Input
                  id="create-referee"
                  value={createForm.referee_id}
                  onChange={(e) => setCreateForm({ ...createForm, referee_id: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Reward type</Label>
                <Select
                  value={createForm.reward_type}
                  onValueChange={(v) =>
                    setCreateForm({ ...createForm, reward_type: v as ReferralRow['reward_type'] })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Reward type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="credit">Credit</SelectItem>
                    <SelectItem value="discount">Discount</SelectItem>
                    <SelectItem value="cashback">Cashback</SelectItem>
                    <SelectItem value="free_service">Free service</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-4 sm:flex-row">
                <div className="flex-1 space-y-2">
                  <Label htmlFor="create-ref-reward">Referrer reward (₹)</Label>
                  <Input
                    id="create-ref-reward"
                    type="number"
                    value={createForm.referrer_reward}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, referrer_reward: Number(e.target.value) })
                    }
                  />
                </div>
                <div className="flex-1 space-y-2">
                  <Label htmlFor="create-ree-reward">Referee reward (₹)</Label>
                  <Input
                    id="create-ree-reward"
                    type="number"
                    value={createForm.referee_reward}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, referee_reward: Number(e.target.value) })
                    }
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Completion rule</Label>
                <Select
                  value={createForm.completion_requirement}
                  onValueChange={(v) =>
                    setCreateForm({
                      ...createForm,
                      completion_requirement: v as
                        | 'first_order'
                        | 'first_booking'
                        | 'first_payment'
                        | 'minimum_spend',
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Completion rule" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="first_order">First order</SelectItem>
                    <SelectItem value="first_booking">First booking</SelectItem>
                    <SelectItem value="first_payment">First payment</SelectItem>
                    <SelectItem value="minimum_spend">Minimum spend</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {createForm.completion_requirement === 'minimum_spend' ? (
                <div className="space-y-2">
                  <Label htmlFor="create-min-spend">Minimum spend (₹)</Label>
                  <Input
                    id="create-min-spend"
                    type="number"
                    value={createForm.minimum_spend}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, minimum_spend: Number(e.target.value) })
                    }
                  />
                </div>
              ) : null}
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={() => setCreateOpen(false)} disabled={creating}>
                Cancel
              </Button>
              <Button onClick={() => void submitCreate()} disabled={creating}>
                {creating ? 'Saving…' : 'Save'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
}
