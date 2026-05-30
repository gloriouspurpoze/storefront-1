/**
 * Subscriptions Hub — admin overview, plan catalogue and subscriber lifecycle.
 *
 * Single page, three deep-linkable tabs:
 *   - overview     — KPI strip (MRR/ARR, churn), plan revenue split
 *   - plans        — CRUD list of subscription plans
 *   - subscribers  — searchable list with cancel/pause/resume/extend actions
 *
 * Routes:
 *   /subscriptions                    → overview
 *   /subscriptions/plans              → plans
 *   /subscriptions/subscribers        → subscribers
 *   /subscriptions/plans/new          → plan editor (create)
 *   /subscriptions/plans/:id/edit     → plan editor (edit)
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  Repeat,
  Sparkles,
  Wallet,
  TrendingUp,
  TrendingDown,
  Users,
  CircleDollarSign,
  PlusCircle,
  Search,
  RefreshCw,
  MoreVertical,
  PauseCircle,
  PlayCircle,
  XCircle,
  CalendarPlus,
  Archive,
  ArchiveRestore,
  Pencil,
  Trash2,
  Crown,
  Zap,
} from 'lucide-react'

import { PageHeader } from '../../components/common/PageHeader'
import { KpiStatCard } from '../../components/common/KpiStatCard'
import { EmptyState } from '../../components/common/EmptyState'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Badge } from '../../components/ui/badge'
import { Input } from '../../components/ui/input'
import { Tabs, TabsList, TabsTrigger } from '../../components/ui/tabs'
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
  DialogDescription,
} from '../../components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select'
import { Avatar, AvatarFallback } from '../../components/ui/avatar'
import { Label } from '../../components/ui/label'
import { Textarea } from '../../components/ui/textarea'
import { Checkbox } from '../../components/ui/checkbox'

import {
  SubscriptionsService,
  type SubscriptionPlan,
  type SubscriberRow,
  type SubscriberFilters,
  type SubscriberPlanSummary,
  type SubscriberUserSummary,
  type SubscriptionStats,
  type SubscriptionStatus,
  type PlanStatus,
  type PlanType,
} from '../../services/api/subscriptions.service'
import { cn } from '../../lib/utils'
import {
  BILLING_CYCLE_LABEL,
  PLAN_STATUS_LABEL,
  PLAN_TYPE_LABEL,
  SUBSCRIPTION_STATUS_LABEL,
  billingCycleSuffix,
  formatINR,
  paiseToRupees,
  planStatusBadgeClass,
  relativeDays,
  shortDate,
  subscriptionStatusBadgeClass,
  userDisplayName,
} from './subscriptionFormatters'

import { PlanEditor } from './PlanEditor'

type HubTab = 'overview' | 'plans' | 'subscribers'

const TAB_FOR_PATH: Record<string, HubTab> = {
  '/subscriptions': 'overview',
  '/subscriptions/plans': 'plans',
  '/subscriptions/subscribers': 'subscribers',
}

function planTypeBadge(type?: PlanType): string {
  return type === 'provider'
    ? 'border-primary-deep/40 bg-primary-deep/10 text-primary-deep dark:text-primary-deep'
    : 'border-primary/40 bg-primary/10 text-primary dark:text-primary'
}

export function SubscriptionsHub() {
  const navigate = useNavigate()
  const params = useParams<{ tab?: string; id?: string }>()

  // Determine which tab to render from the URL
  const pathname = window.location.pathname.replace(/\/+$/, '') || '/subscriptions'
  const initialTab: HubTab =
    TAB_FOR_PATH[pathname] ??
    (pathname.startsWith('/subscriptions/plans') ? 'plans' : 'overview')

  const [tab, setTab] = useState<HubTab>(initialTab)
  useEffect(() => {
    setTab(initialTab)
  }, [initialTab])

  const goTab = (next: HubTab) => {
    setTab(next)
    const target = next === 'overview' ? '/subscriptions' : `/subscriptions/${next}`
    if (window.location.pathname !== target) navigate(target)
  }

  // If we're on the plan editor sub-route, render the editor instead of tabs.
  if (params.id || pathname.endsWith('/subscriptions/plans/new')) {
    return <PlanEditor planId={params.id} onDone={() => navigate('/subscriptions/plans')} />
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Subscriptions"
        subtitle="Recurring revenue plans, subscriber lifecycle and retention metrics."
        icon={<Repeat className="h-7 w-7" />}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => goTab('subscribers')}>
              <Users className="mr-1.5 h-4 w-4" />
              Subscribers
            </Button>
            <Button size="sm" onClick={() => navigate('/subscriptions/plans/new')}>
              <PlusCircle className="mr-1.5 h-4 w-4" />
              New plan
            </Button>
          </div>
        }
      />

      <Tabs value={tab} onValueChange={(v) => goTab(v as HubTab)} className="w-full">
        <TabsList className="w-full justify-start overflow-x-auto sm:w-auto">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="plans">Plans</TabsTrigger>
          <TabsTrigger value="subscribers">Subscribers</TabsTrigger>
        </TabsList>
      </Tabs>

      {tab === 'overview' && <OverviewTab onJumpToPlans={() => goTab('plans')} />}
      {tab === 'plans' && <PlansTab />}
      {tab === 'subscribers' && <SubscribersTab />}
    </div>
  )
}

/* ============================ overview tab ============================ */

function OverviewTab({ onJumpToPlans }: { onJumpToPlans: () => void }) {
  const [stats, setStats] = useState<SubscriptionStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const load = useCallback(async () => {
    try {
      setRefreshing(true)
      const s = await SubscriptionsService.stats()
      setStats(s)
    } catch {
      // Toast handled in API base
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const churnTone =
    !stats ? 'primary'
    : stats.churnRate30dPct >= 8 ? 'destructive'
    : stats.churnRate30dPct >= 4 ? 'amber'
    : 'emerald'

  const netDelta = stats ? stats.newLast30 - stats.cancelledLast30 : 0

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Snapshot of live recurring revenue across customer and provider plans.
        </p>
        <Button size="sm" variant="outline" onClick={load} disabled={refreshing}>
          <RefreshCw className={cn('mr-1.5 h-4 w-4', refreshing && 'animate-spin')} />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiStatCard
          icon={<Wallet className="h-5 w-5" />}
          tone="primary"
          value={loading ? '—' : formatINR(stats?.mrrInRupees ?? 0)}
          label="Monthly recurring revenue"
          hint={loading ? '' : `ARR ${formatINR(stats?.arrInRupees ?? 0, { compact: true })}`}
        />
        <KpiStatCard
          icon={<Sparkles className="h-5 w-5" />}
          tone="emerald"
          value={loading ? '—' : (stats?.counts.active ?? 0) + (stats?.counts.trial ?? 0)}
          label="Active subscribers"
          hint={
            loading
              ? ''
              : `${stats?.counts.active ?? 0} paying · ${stats?.counts.trial ?? 0} on trial`
          }
        />
        <KpiStatCard
          icon={netDelta >= 0 ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
          tone={netDelta >= 0 ? 'emerald' : 'destructive'}
          value={
            loading
              ? '—'
              : `${netDelta >= 0 ? '+' : ''}${netDelta}`
          }
          label="Net new (last 30d)"
          hint={
            loading
              ? ''
              : `${stats?.newLast30 ?? 0} added · ${stats?.cancelledLast30 ?? 0} cancelled`
          }
        />
        <KpiStatCard
          icon={<TrendingDown className="h-5 w-5" />}
          tone={churnTone}
          value={loading ? '—' : `${(stats?.churnRate30dPct ?? 0).toFixed(2)}%`}
          label="30-day churn"
          hint={
            loading
              ? ''
              : `${stats?.cancelledPrev30 ?? 0} cancelled prev. 30d`
          }
        />
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0 pb-3">
          <div>
            <CardTitle className="text-base">Revenue split by plan</CardTitle>
            <p className="text-xs text-muted-foreground">
              Active + trial subscribers and gross revenue per cycle.
            </p>
          </div>
          <Button size="sm" variant="outline" onClick={onJumpToPlans}>
            Manage plans
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : !stats || stats.breakdownByPlan.length === 0 ? (
            <EmptyState
              size="small"
              icon={<CircleDollarSign className="h-10 w-10" />}
              title="No active subscriptions yet"
              description="Publish a plan and share the upgrade flow with your customers or providers."
              action={{ label: 'Create your first plan', onClick: onJumpToPlans }}
            />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Plan</TableHead>
                    <TableHead>Audience</TableHead>
                    <TableHead className="text-right">Subscribers</TableHead>
                    <TableHead className="text-right">Gross revenue</TableHead>
                    <TableHead className="text-right">Share</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats.breakdownByPlan.map((row) => {
                    const totalRev = stats.breakdownByPlan.reduce(
                      (acc, r) => acc + r.revenueInRupees,
                      0
                    )
                    const share = totalRev > 0 ? (row.revenueInRupees / totalRev) * 100 : 0
                    return (
                      <TableRow key={row.planId}>
                        <TableCell className="font-medium">{row.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={cn('text-xs', planTypeBadge(row.type))}>
                            {PLAN_TYPE_LABEL[row.type]}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right tabular-nums">{row.subscribers}</TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatINR(row.revenueInRupees)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums text-muted-foreground">
                          {share.toFixed(1)}%
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        <Card>
          <CardContent className="space-y-1.5 p-4">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Crown className="h-4 w-4 text-bloom-coral" /> Past due
            </div>
            <p className="text-2xl font-bold tabular-nums">{stats?.counts.pastDue ?? 0}</p>
            <p className="text-xs text-muted-foreground">
              Failed payments waiting on retry or manual recovery.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="space-y-1.5 p-4">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <PauseCircle className="h-4 w-4 text-primary-deep" /> Paused
            </div>
            <p className="text-2xl font-bold tabular-nums">{stats?.counts.paused ?? 0}</p>
            <p className="text-xs text-muted-foreground">
              Manually paused — billing skipped until resumed.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="space-y-1.5 p-4">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Zap className="h-4 w-4 text-storm-deep" /> Trial pipeline
            </div>
            <p className="text-2xl font-bold tabular-nums">{stats?.counts.trial ?? 0}</p>
            <p className="text-xs text-muted-foreground">
              Users currently in trial — convert before the trial ends.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

/* ============================== plans tab ============================== */

function PlansTab() {
  const navigate = useNavigate()
  const [plans, setPlans] = useState<SubscriptionPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [typeFilter, setTypeFilter] = useState<'all' | PlanType>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | PlanStatus>('all')
  const [search, setSearch] = useState('')
  const [confirmDelete, setConfirmDelete] = useState<SubscriptionPlan | null>(null)
  const [acting, setActing] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      setLoading(true)
      const { plans } = await SubscriptionsService.listPlans({
        type: typeFilter === 'all' ? undefined : typeFilter,
        status: statusFilter === 'all' ? undefined : statusFilter,
        search: search.trim() || undefined,
      })
      setPlans(plans)
    } finally {
      setLoading(false)
    }
  }, [typeFilter, statusFilter, search])

  useEffect(() => {
    const t = setTimeout(load, 250)
    return () => clearTimeout(t)
  }, [load])

  const onStatus = async (plan: SubscriptionPlan, status: PlanStatus) => {
    try {
      setActing(plan._id)
      const updated = await SubscriptionsService.setPlanStatus(plan._id, status)
      setPlans((p) => p.map((x) => (x._id === plan._id ? { ...x, status: updated.status } : x)))
    } finally {
      setActing(null)
    }
  }

  const doDelete = async () => {
    if (!confirmDelete) return
    try {
      setActing(confirmDelete._id)
      await SubscriptionsService.deletePlan(confirmDelete._id)
      setConfirmDelete(null)
      await load()
    } finally {
      setActing(null)
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 flex-wrap items-center gap-2">
            <div className="relative w-full max-w-xs">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search plan name / slug…"
                className="pl-8"
              />
            </div>
            <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as typeof typeFilter)}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All audiences</SelectItem>
                <SelectItem value="customer">Customer plans</SelectItem>
                <SelectItem value="provider">Provider plans</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={load} disabled={loading}>
              <RefreshCw className={cn('mr-1.5 h-4 w-4', loading && 'animate-spin')} />
              Refresh
            </Button>
            <Button size="sm" onClick={() => navigate('/subscriptions/plans/new')}>
              <PlusCircle className="mr-1.5 h-4 w-4" />
              New plan
            </Button>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <Card><CardContent className="p-6 text-sm text-muted-foreground">Loading plans…</CardContent></Card>
      ) : plans.length === 0 ? (
        <EmptyState
          icon={<CircleDollarSign className="h-12 w-12" />}
          title="No plans yet"
          description="Create a customer or provider subscription plan to unlock recurring revenue."
          action={{ label: 'Create plan', onClick: () => navigate('/subscriptions/plans/new') }}
        />
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {plans.map((p) => (
            <PlanCard
              key={p._id}
              plan={p}
              busy={acting === p._id}
              onEdit={() => navigate(`/subscriptions/plans/${p._id}/edit`)}
              onSetStatus={(s) => onStatus(p, s)}
              onDelete={() => setConfirmDelete(p)}
            />
          ))}
        </div>
      )}

      <Dialog open={!!confirmDelete} onOpenChange={(o) => !o && setConfirmDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete subscription plan?</DialogTitle>
            <DialogDescription>
              <span className="font-medium text-foreground">{confirmDelete?.name}</span> will be
              removed. If subscribers exist, it will be archived instead to preserve history.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDelete(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={doDelete} disabled={!!acting}>
              <Trash2 className="mr-1.5 h-4 w-4" />
              Delete plan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function PlanCard({
  plan,
  busy,
  onEdit,
  onSetStatus,
  onDelete,
}: {
  plan: SubscriptionPlan
  busy: boolean
  onEdit: () => void
  onSetStatus: (s: PlanStatus) => void
  onDelete: () => void
}) {
  const isArchived = plan.status === 'archived'
  return (
    <Card className={cn('flex flex-col', plan.isPopular && 'ring-1 ring-primary/40')}>
      <CardContent className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="truncate text-base font-semibold">{plan.name}</h3>
              {plan.isPopular && (
                <Badge variant="outline" className="border-bloom-coral/45 bg-bloom-coral/10 text-bloom-coral dark:text-bloom-coral">
                  <Crown className="mr-1 h-3 w-3" /> Popular
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground">/{plan.slug}</p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8" disabled={busy}>
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>Manage plan</DropdownMenuLabel>
              <DropdownMenuItem onClick={onEdit}>
                <Pencil className="mr-2 h-4 w-4" /> Edit
              </DropdownMenuItem>
              {plan.status !== 'active' && (
                <DropdownMenuItem onClick={() => onSetStatus('active')}>
                  <ArchiveRestore className="mr-2 h-4 w-4" /> Mark active
                </DropdownMenuItem>
              )}
              {plan.status !== 'inactive' && (
                <DropdownMenuItem onClick={() => onSetStatus('inactive')}>
                  <PauseCircle className="mr-2 h-4 w-4" /> Pause (inactive)
                </DropdownMenuItem>
              )}
              {plan.status !== 'archived' && (
                <DropdownMenuItem onClick={() => onSetStatus('archived')}>
                  <Archive className="mr-2 h-4 w-4" /> Archive
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onDelete} className="text-destructive">
                <Trash2 className="mr-2 h-4 w-4" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="outline" className={cn('text-xs', planTypeBadge(plan.type))}>
            {PLAN_TYPE_LABEL[plan.type]}
          </Badge>
          <Badge variant="outline" className={cn('text-xs', planStatusBadgeClass(plan.status))}>
            {PLAN_STATUS_LABEL[plan.status]}
          </Badge>
          {plan.trialDays ? (
            <Badge variant="outline" className="border-primary/40 bg-primary/10 text-primary dark:text-primary text-xs">
              {plan.trialDays}-day trial
            </Badge>
          ) : null}
        </div>

        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-bold tabular-nums">{formatINR(plan.priceInRupees)}</span>
          <span className="text-sm text-muted-foreground">{billingCycleSuffix(plan.billingCycle)}</span>
        </div>

        {plan.description ? (
          <p className="line-clamp-3 text-sm text-muted-foreground">{plan.description}</p>
        ) : null}

        {plan.features?.length ? (
          <ul className="space-y-1 text-sm">
            {plan.features.slice(0, 4).map((f, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="mt-1 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                <span className="text-muted-foreground">{f}</span>
              </li>
            ))}
            {plan.features.length > 4 && (
              <li className="text-xs text-muted-foreground">+{plan.features.length - 4} more…</li>
            )}
          </ul>
        ) : null}

        <div className="mt-auto flex items-center justify-between border-t pt-3 text-xs text-muted-foreground">
          <span>
            {plan.activeSubscribers ?? 0} active subscribers
          </span>
          <span>
            {BILLING_CYCLE_LABEL[plan.billingCycle]}
            {isArchived ? ' · read-only' : ''}
          </span>
        </div>
      </CardContent>
    </Card>
  )
}

/* =========================== subscribers tab =========================== */

function SubscribersTab() {
  const navigate = useNavigate()
  const [rows, setRows] = useState<SubscriberRow[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState<SubscriberFilters>({ page: 1, limit: 25 })
  const [pagination, setPagination] = useState({ page: 1, limit: 25, total: 0, totalPages: 1 })
  const [search, setSearch] = useState('')
  const [allPlans, setAllPlans] = useState<SubscriptionPlan[]>([])
  const [extendOpen, setExtendOpen] = useState<SubscriberRow | null>(null)
  const [extendDays, setExtendDays] = useState(7)
  const [changePlanOpen, setChangePlanOpen] = useState<SubscriberRow | null>(null)
  const [newPlanId, setNewPlanId] = useState<string>('')
  const [cancelOpen, setCancelOpen] = useState<SubscriberRow | null>(null)
  const [cancelImmediate, setCancelImmediate] = useState(false)
  const [cancelReason, setCancelReason] = useState('')
  const [acting, setActing] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      setLoading(true)
      const data = await SubscriptionsService.listSubscribers({
        ...filters,
        search: search.trim() || undefined,
      })
      setRows(data.subscriptions)
      setPagination(data.pagination)
    } finally {
      setLoading(false)
    }
  }, [filters, search])

  useEffect(() => {
    const t = setTimeout(load, 200)
    return () => clearTimeout(t)
  }, [load])

  useEffect(() => {
    SubscriptionsService.listPlans({ status: 'active' })
      .then((r) => setAllPlans(r.plans))
      .catch(() => undefined)
  }, [])

  const refreshRow = (updated: SubscriberRow) => {
    setRows((rs) => rs.map((r) => (r._id === updated._id ? { ...r, ...updated } : r)))
  }

  const onPause = async (row: SubscriberRow) => {
    try {
      setActing(row._id)
      const r = await SubscriptionsService.pauseSubscriber(row._id)
      refreshRow(r)
    } finally {
      setActing(null)
    }
  }

  const onResume = async (row: SubscriberRow) => {
    try {
      setActing(row._id)
      const r = await SubscriptionsService.resumeSubscriber(row._id)
      refreshRow(r)
    } finally {
      setActing(null)
    }
  }

  const onExtendSubmit = async () => {
    if (!extendOpen) return
    try {
      setActing(extendOpen._id)
      const r = await SubscriptionsService.extendSubscriber(extendOpen._id, extendDays)
      refreshRow(r)
      setExtendOpen(null)
    } finally {
      setActing(null)
    }
  }

  const onChangePlanSubmit = async () => {
    if (!changePlanOpen || !newPlanId) return
    try {
      setActing(changePlanOpen._id)
      await SubscriptionsService.changeSubscriberPlan(changePlanOpen._id, newPlanId)
      setChangePlanOpen(null)
      setNewPlanId('')
      await load()
    } finally {
      setActing(null)
    }
  }

  const onCancelSubmit = async () => {
    if (!cancelOpen) return
    try {
      setActing(cancelOpen._id)
      const r = await SubscriptionsService.cancelSubscriber(cancelOpen._id, {
        immediate: cancelImmediate,
        reason: cancelReason.trim() || undefined,
      })
      refreshRow(r)
      setCancelOpen(null)
      setCancelImmediate(false)
      setCancelReason('')
    } finally {
      setActing(null)
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 flex-wrap items-center gap-2">
            <div className="relative w-full max-w-xs">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search user / email / plan…"
                className="pl-8"
              />
            </div>
            <Select
              value={filters.status ?? 'all'}
              onValueChange={(v) =>
                setFilters((f) => ({
                  ...f,
                  page: 1,
                  status: v === 'all' ? undefined : (v as SubscriptionStatus),
                }))
              }
            >
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="trial">In trial</SelectItem>
                <SelectItem value="past_due">Past due</SelectItem>
                <SelectItem value="paused">Paused</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={filters.planId ?? 'all'}
              onValueChange={(v) =>
                setFilters((f) => ({ ...f, page: 1, planId: v === 'all' ? undefined : v }))
              }
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Plan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All plans</SelectItem>
                {allPlans.map((p) => (
                  <SelectItem key={p._id} value={p._id}>
                    {p.name} · {PLAN_TYPE_LABEL[p.type]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            <RefreshCw className={cn('mr-1.5 h-4 w-4', loading && 'animate-spin')} />
            Refresh
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Subscriber</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Renewal</TableHead>
                  <TableHead className="text-right">Started</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-10 text-center text-sm text-muted-foreground">
                      Loading subscribers…
                    </TableCell>
                  </TableRow>
                ) : rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-10 text-center text-sm text-muted-foreground">
                      No subscriptions match the current filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((row) => {
                    const user =
                      (row.userId && typeof row.userId === 'object'
                        ? (row.userId as SubscriberUserSummary)
                        : undefined) || undefined
                    const plan =
                      (row.planId && typeof row.planId === 'object'
                        ? (row.planId as SubscriberPlanSummary)
                        : undefined) || undefined
                    const name = userDisplayName(user)
                    const initials = name
                      .split(/\s+/)
                      .map((s) => s[0])
                      .filter(Boolean)
                      .slice(0, 2)
                      .join('')
                      .toUpperCase()
                    return (
                      <TableRow key={row._id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="text-xs">{initials || '?'}</AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <div className="truncate text-sm font-medium">{name}</div>
                              <div className="truncate text-xs text-muted-foreground">
                                {user?.email ?? user?.phone ?? '—'}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm font-medium">{plan?.name ?? '—'}</div>
                          <div className="text-xs text-muted-foreground">
                            {plan?.billingCycle ? BILLING_CYCLE_LABEL[plan.billingCycle] : ''}
                            {plan?.price != null
                              ? ` · ${formatINR(paiseToRupees(plan.price))}`
                              : ''}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={cn('text-xs', subscriptionStatusBadgeClass(row.status))}>
                            {SUBSCRIPTION_STATUS_LABEL[row.status]}
                          </Badge>
                          {row.cancelAtPeriodEnd && row.status !== 'cancelled' && (
                            <div className="mt-1 text-[10px] uppercase tracking-wide text-bloom-coral dark:text-bloom-coral">
                              Ends at period
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">{shortDate(row.currentPeriodEnd)}</div>
                          <div className="text-xs text-muted-foreground">
                            {relativeDays(row.currentPeriodEnd)}
                          </div>
                        </TableCell>
                        <TableCell className="text-right text-sm text-muted-foreground">
                          {shortDate(row.startDate)}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                disabled={acting === row._id}
                              >
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56">
                              <DropdownMenuLabel>Lifecycle</DropdownMenuLabel>
                              {row.status === 'paused' ? (
                                <DropdownMenuItem onClick={() => onResume(row)}>
                                  <PlayCircle className="mr-2 h-4 w-4" /> Resume
                                </DropdownMenuItem>
                              ) : ['active', 'trial', 'past_due'].includes(row.status) ? (
                                <DropdownMenuItem onClick={() => onPause(row)}>
                                  <PauseCircle className="mr-2 h-4 w-4" /> Pause
                                </DropdownMenuItem>
                              ) : null}
                              <DropdownMenuItem
                                onClick={() => {
                                  setExtendDays(7)
                                  setExtendOpen(row)
                                }}
                              >
                                <CalendarPlus className="mr-2 h-4 w-4" /> Extend renewal
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  setNewPlanId('')
                                  setChangePlanOpen(row)
                                }}
                              >
                                <Repeat className="mr-2 h-4 w-4" /> Change plan
                              </DropdownMenuItem>
                              {!['cancelled', 'expired'].includes(row.status) && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() => {
                                      setCancelImmediate(false)
                                      setCancelReason('')
                                      setCancelOpen(row)
                                    }}
                                    className="text-destructive"
                                  >
                                    <XCircle className="mr-2 h-4 w-4" /> Cancel subscription
                                  </DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between border-t px-4 py-3">
              <span className="text-xs text-muted-foreground">
                Page {pagination.page} of {pagination.totalPages} · {pagination.total} total
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page <= 1 || loading}
                  onClick={() =>
                    setFilters((f) => ({ ...f, page: Math.max(1, (f.page ?? 1) - 1) }))
                  }
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page >= pagination.totalPages || loading}
                  onClick={() =>
                    setFilters((f) => ({ ...f, page: (f.page ?? 1) + 1 }))
                  }
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Extend dialog */}
      <Dialog open={!!extendOpen} onOpenChange={(o) => !o && setExtendOpen(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Extend renewal</DialogTitle>
            <DialogDescription>
              Push the next renewal date forward without charging the subscriber.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="extend-days">Days to add</Label>
            <Input
              id="extend-days"
              type="number"
              min={1}
              max={365}
              value={extendDays}
              onChange={(e) => setExtendDays(Math.max(1, Math.min(365, Number(e.target.value) || 1)))}
            />
            <p className="text-xs text-muted-foreground">
              Current renewal: <span className="font-medium text-foreground">
                {extendOpen ? shortDate(extendOpen.currentPeriodEnd) : '—'}
              </span>
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setExtendOpen(null)}>
              Cancel
            </Button>
            <Button onClick={onExtendSubmit} disabled={!!acting}>
              <CalendarPlus className="mr-1.5 h-4 w-4" /> Extend by {extendDays} day
              {extendDays === 1 ? '' : 's'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change plan dialog */}
      <Dialog open={!!changePlanOpen} onOpenChange={(o) => !o && setChangePlanOpen(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change subscriber plan</DialogTitle>
            <DialogDescription>
              Closes the current subscription and starts a new one on the chosen plan.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Target plan</Label>
            <Select value={newPlanId} onValueChange={setNewPlanId}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a plan…" />
              </SelectTrigger>
              <SelectContent>
                {allPlans.map((p) => (
                  <SelectItem key={p._id} value={p._id}>
                    {p.name} · {formatINR(p.priceInRupees)}{billingCycleSuffix(p.billingCycle)} · {PLAN_TYPE_LABEL[p.type]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setChangePlanOpen(null)}>
              Cancel
            </Button>
            <Button onClick={onChangePlanSubmit} disabled={!newPlanId || !!acting}>
              Move subscriber
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel dialog */}
      <Dialog open={!!cancelOpen} onOpenChange={(o) => !o && setCancelOpen(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel subscription</DialogTitle>
            <DialogDescription>
              By default the subscription continues until the current period ends. Choose
              immediate cancellation only when refunding or off-boarding.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="flex items-start gap-2 rounded-md border border-border bg-muted/40 p-3">
              <Checkbox
                id="cancel-immediate"
                checked={cancelImmediate}
                onCheckedChange={(c) => setCancelImmediate(c === true)}
              />
              <div>
                <Label htmlFor="cancel-immediate" className="text-sm font-medium">
                  Cancel immediately
                </Label>
                <p className="text-xs text-muted-foreground">
                  Ends access right now. Refunds are handled separately under Payments.
                </p>
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="cancel-reason">Reason (optional)</Label>
              <Textarea
                id="cancel-reason"
                rows={3}
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Customer requested refund / churned to competitor / …"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelOpen(null)}>
              Keep subscription
            </Button>
            <Button variant="destructive" onClick={onCancelSubmit} disabled={!!acting}>
              <XCircle className="mr-1.5 h-4 w-4" />
              {cancelImmediate ? 'Cancel immediately' : 'Cancel at period end'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default SubscriptionsHub
