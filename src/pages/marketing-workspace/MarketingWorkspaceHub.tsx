import React, { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { formatDistanceToNow, parseISO } from 'date-fns'
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  Activity,
  BarChart3,
  CalendarDays,
  FlaskConical,
  Lightbulb,
  ListTodo,
  Megaphone,
  Share2,
  Target,
  TrendingUp,
} from 'lucide-react'
import { PageHeader } from '../../components/common/PageHeader'
import { MarketingWorkspaceSubnav } from '../../components/marketing-workspace/MarketingWorkspaceSubnav'
import { useMarketingWorkspace } from '../../hooks/useMarketingWorkspace'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { Badge } from '../../components/ui/badge'
import { cn } from '../../lib/utils'
import {
  CAMPAIGN_STATUS_LABEL,
  CONTENT_STATUS_LABEL,
  IDEA_STAGE_LABEL,
  TASK_COLUMN_LABEL,
} from '../../lib/marketingWorkspaceLabels'

const ACCENTS = [
  'border-l-primary bg-primary/[0.06]',
  'border-l-violet-500 bg-violet-500/[0.06]',
  'border-l-teal-600 bg-teal-600/[0.06]',
  'border-l-amber-600 bg-amber-600/[0.06]',
  'border-l-sky-600 bg-sky-600/[0.06]',
  'border-l-rose-600 bg-rose-600/[0.06]',
]

function countsToChartData(
  m: Record<string, number> | undefined,
  labelMap: Record<string, string>,
): { name: string; count: number }[] {
  if (!m) return []
  return Object.entries(m).map(([k, v]) => ({
    name: labelMap[k] ?? k.replace(/_/g, ' '),
    count: v,
  }))
}

function MiniBarChart({
  title,
  data,
  loading: ld,
}: {
  title: string
  data: { name: string; count: number }[]
  loading: boolean
}) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <BarChart3 className="h-4 w-4 text-muted-foreground" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="pb-3">
        {ld ? (
          <div className="flex h-[180px] items-center justify-center text-sm text-muted-foreground">Loading…</div>
        ) : data.length === 0 ? (
          <div className="flex h-[180px] items-center justify-center text-sm text-muted-foreground">No data yet</div>
        ) : (
          <div className="h-[180px] w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-18} textAnchor="end" height={56} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} width={32} />
                <Tooltip
                  contentStyle={{ fontSize: 12 }}
                  formatter={(value: number) => [value, 'Count']}
                />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export function MarketingWorkspaceHub() {
  const { bundle, loading, error, reload } = useMarketingWorkspace()

  const stats = bundle?.overview
  const analytics = bundle?.analytics

  const calendarChart = useMemo(
    () => countsToChartData(analytics?.calendarByStatus, CONTENT_STATUS_LABEL),
    [analytics?.calendarByStatus],
  )
  const socialChart = useMemo(
    () => countsToChartData(analytics?.socialByStatus, CONTENT_STATUS_LABEL),
    [analytics?.socialByStatus],
  )
  const ideasChart = useMemo(
    () => countsToChartData(analytics?.ideasByStage, IDEA_STAGE_LABEL),
    [analytics?.ideasByStage],
  )
  const tasksChart = useMemo(
    () => countsToChartData(analytics?.tasksByColumn, TASK_COLUMN_LABEL),
    [analytics?.tasksByColumn],
  )
  const campaignsChart = useMemo(
    () => countsToChartData(analytics?.campaignsByStatus, CAMPAIGN_STATUS_LABEL),
    [analytics?.campaignsByStatus],
  )

  const tiles = useMemo(() => {
    const o = bundle?.overview
    return [
      {
        to: '/marketing/campaigns',
        title: 'Campaigns',
        description: 'Group content, social, and tasks under one timeline, budget, and KPIs.',
        icon: Target,
        badge: loading ? '…' : `${o?.campaignCount ?? 0} total`,
      },
      {
        to: '/marketing/calendar',
        title: 'Content calendar',
        description: 'Editorial beats, content types, approvals, and asset links.',
        icon: CalendarDays,
        badge: loading ? '…' : `${o?.calendarUpcoming ?? 0} upcoming`,
      },
      {
        to: '/marketing/social',
        title: 'Social posts',
        description: 'Multi-channel drafts, scheduling, UTMs, and campaign tags.',
        icon: Share2,
        badge: loading ? '…' : `${o?.socialQueue ?? 0} in queue`,
      },
      {
        to: '/marketing/planning',
        title: 'Planning & ideas',
        description: 'Intake, RICE, votes, and stage gates before production.',
        icon: Lightbulb,
        badge: loading ? '…' : `${o?.ideasActive ?? 0} active`,
      },
      {
        to: '/marketing/tasks',
        title: 'Marketing tasks',
        description: 'Kanban execution: writing, design, approval, publishing.',
        icon: ListTodo,
        badge: loading ? '…' : `${o?.tasksOpen ?? 0} open`,
      },
      {
        to: '/marketing/lab',
        title: 'R&D & brainstorm',
        description: 'Hypotheses, experiments, sessions, and learnings.',
        icon: FlaskConical,
        badge: loading ? '…' : `${o?.brainstormCount ?? 0} notes`,
      },
    ]
  }, [bundle?.overview, loading])

  const inMotion = stats
    ? stats.calendarUpcoming + stats.socialQueue + stats.ideasActive
    : 0

  return (
    <div className="container max-w-6xl py-6">
      <PageHeader
        title="Marketing workspace"
        subtitle="Command center backed by the API — campaigns, calendar, social, ideas, tasks, and R&D in one tenant-scoped store."
        icon={<Megaphone className="h-8 w-8 text-primary" />}
        action={
          <button
            type="button"
            className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            onClick={() => void reload()}
          >
            Refresh
          </button>
        }
      />
      <MarketingWorkspaceSubnav />

      {error ? (
        <div
          className="mb-6 rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive"
          role="alert"
        >
          <p className="font-medium">Could not load workspace</p>
          <p className="mt-1 text-destructive/90">
            {error}. Check that the backend is running and{' '}
            <code className="rounded bg-background/80 px-1 text-xs">REACT_APP_API_URL</code> points to{' '}
            <code className="rounded bg-background/80 px-1 text-xs">/api</code>.
          </p>
        </div>
      ) : null}

      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-dashed">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <TrendingUp className="h-4 w-4" />
              Pipeline snapshot
            </CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold tracking-tight">
            {loading ? '…' : inMotion}
            <span className="ml-2 text-sm font-normal text-muted-foreground">items in motion (30d calendar + queue)</span>
          </CardContent>
        </Card>
      </div>

      <div className="mb-8 grid gap-4 lg:grid-cols-2">
        <MiniBarChart title="Content calendar by status" data={calendarChart} loading={loading} />
        <MiniBarChart title="Social posts by status" data={socialChart} loading={loading} />
        <MiniBarChart title="Ideas by stage" data={ideasChart} loading={loading} />
        <MiniBarChart title="Tasks by column" data={tasksChart} loading={loading} />
      </div>

      <div className="mb-8 grid gap-4 lg:grid-cols-2">
        <MiniBarChart title="Campaigns by status" data={campaignsChart} loading={loading} />
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <Activity className="h-4 w-4 text-muted-foreground" />
              Recent activity
            </CardTitle>
            <CardDescription className="text-xs">
              Tenant-scoped audit trail (reschedules, approvals, imports, votes).
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading…</p>
            ) : !bundle?.recentActivity?.length ? (
              <p className="text-sm text-muted-foreground">No activity recorded yet.</p>
            ) : (
              <ul className="max-h-[320px] space-y-3 overflow-y-auto pr-1 text-sm">
                {bundle.recentActivity.map((row) => (
                  <li
                    key={row.id}
                    className="border-l-2 border-primary/40 pl-3 text-[0.8125rem] leading-snug"
                  >
                    <div className="text-muted-foreground">
                      <span className="font-medium text-foreground">{row.action}</span>
                      <span className="mx-1">·</span>
                      {row.entityType}
                      <span className="mx-1">·</span>
                      {formatDistanceToNow(parseISO(row.createdAt), { addSuffix: true })}
                    </div>
                    <p className="mt-0.5 text-foreground">{row.summary}</p>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {tiles.map((tile, i) => (
          <Link
            key={tile.to}
            to={tile.to}
            className="group block rounded-lg outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Card
              className={cn(
                'h-full border-l-4 transition-shadow group-hover:shadow-md',
                ACCENTS[i % ACCENTS.length],
              )}
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <tile.icon className="h-5 w-5 text-primary" />
                    <CardTitle className="text-base">{tile.title}</CardTitle>
                  </div>
                  <Badge variant="secondary" className="shrink-0">
                    {tile.badge}
                  </Badge>
                </div>
                <CardDescription className="text-[0.8125rem] leading-snug">{tile.description}</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
