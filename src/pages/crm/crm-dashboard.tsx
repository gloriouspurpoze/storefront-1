import React, { useEffect, useMemo, useState } from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  List,
  ListItem,
  ListItemText,
  Chip,
  Stack,
  CircularProgress,
  Alert,
} from '@mui/material'
import Grid from '@mui/material/GridLegacy'
import {
  TrendingUp as PipelineIcon,
  AccountBalance as WeightedIcon,
  Handshake as DealsIcon,
  EmojiEvents as WonIcon,
  PersonSearch as LeadsIcon,
  AssignmentLate as OverdueIcon,
} from '@mui/icons-material'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts'
import { PageHeader } from '../../components/common/PageHeader'
import { CrmSubnav } from '../../components/crm/CrmSubnav'
import { crmService } from '../../services/api/crm.service'
import { usePermissions } from '../../hooks/usePermissions'
import type { CrmActivity, CrmDealStage, CrmMetrics } from '../../types/crm.types'

const STAGE_LABELS: Record<CrmDealStage, string> = {
  lead: 'Lead',
  qualified: 'Qualified',
  proposal: 'Proposal',
  negotiation: 'Negotiation',
  won: 'Won',
  lost: 'Lost',
}

const EMPTY_METRICS: CrmMetrics = {
  pipelineValue: 0,
  weightedPipeline: 0,
  openDeals: 0,
  wonThisMonth: 0,
  activeLeads: 0,
  overdueTasks: 0,
  dealsByStage: {
    lead: 0,
    qualified: 0,
    proposal: 0,
    negotiation: 0,
    won: 0,
    lost: 0,
  },
}

function formatMoney(amount: number, currency = 'GBP') {
  try {
    return new Intl.NumberFormat('en-GB', { style: 'currency', currency }).format(amount)
  } catch {
    return `${currency} ${amount.toFixed(0)}`
  }
}

export function CrmDashboard() {
  const { checkPermission } = usePermissions()
  const canManage = checkPermission('manage_crm')
  const [tick, setTick] = useState(0)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [metrics, setMetrics] = useState<CrmMetrics>(EMPTY_METRICS)
  const [recent, setRecent] = useState<CrmActivity[]>([])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setLoadError(null)
    Promise.all([crmService.getMetrics(), crmService.listActivities()])
      .then(([m, acts]) => {
        if (cancelled) return
        setMetrics(m)
        setRecent(
          [...acts]
            .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
            .slice(0, 6)
        )
      })
      .catch(() => {
        if (!cancelled) {
          setLoadError('Could not load CRM overview. Check your connection and try again.')
          setMetrics(EMPTY_METRICS)
          setRecent([])
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [tick])

  const chartData = useMemo(() => {
    return (Object.keys(metrics.dealsByStage) as CrmDealStage[]).map((k) => ({
      name: STAGE_LABELS[k],
      deals: metrics.dealsByStage[k],
    }))
  }, [metrics])

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <PageHeader
        title="CRM"
        subtitle="Pipeline, accounts, and activities — use local demo data or connect fixer-backend (REACT_APP_CRM_USE_API)."
        action={
          canManage ? (
            <Button
              variant="outlined"
              onClick={async () => {
                await crmService.resetDemoData()
                setTick((x) => x + 1)
              }}
            >
              Reset demo data
            </Button>
          ) : undefined
        }
      />
      <CrmSubnav />

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress />
        </Box>
      ) : loadError ? (
        <Alert
          severity="error"
          action={
            <Button color="inherit" size="small" onClick={() => setTick((x) => x + 1)}>
              Retry
            </Button>
          }
        >
          {loadError}
        </Alert>
      ) : (
        <>
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={4}>
          <Card variant="outlined" sx={{ height: '100%' }}>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                <PipelineIcon color="primary" />
                <Typography color="text.secondary" variant="body2">
                  Open pipeline
                </Typography>
              </Stack>
              <Typography variant="h5" fontWeight={700}>
                {formatMoney(metrics.pipelineValue)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Card variant="outlined" sx={{ height: '100%' }}>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                <WeightedIcon color="action" />
                <Typography color="text.secondary" variant="body2">
                  Weighted pipeline
                </Typography>
              </Stack>
              <Typography variant="h5" fontWeight={700}>
                {formatMoney(metrics.weightedPipeline)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Card variant="outlined" sx={{ height: '100%' }}>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                <DealsIcon color="action" />
                <Typography color="text.secondary" variant="body2">
                  Open deals
                </Typography>
              </Stack>
              <Typography variant="h5" fontWeight={700}>
                {metrics.openDeals}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Card variant="outlined" sx={{ height: '100%' }}>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                <WonIcon sx={{ color: 'success.main' }} />
                <Typography color="text.secondary" variant="body2">
                  Won (this month)
                </Typography>
              </Stack>
              <Typography variant="h5" fontWeight={700}>
                {metrics.wonThisMonth}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Card variant="outlined" sx={{ height: '100%' }}>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                <LeadsIcon color="action" />
                <Typography color="text.secondary" variant="body2">
                  Active funnel contacts
                </Typography>
              </Stack>
              <Typography variant="h5" fontWeight={700}>
                {metrics.activeLeads}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Card variant="outlined" sx={{ height: '100%' }}>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                <OverdueIcon color="warning" />
                <Typography color="text.secondary" variant="body2">
                  Overdue tasks
                </Typography>
              </Stack>
              <Typography variant="h5" fontWeight={700}>
                {metrics.overdueTasks}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={2}>
        <Grid item xs={12} lg={7}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
                Deals by stage
              </Typography>
              <Box sx={{ width: '100%', height: 320 }}>
                <ResponsiveContainer>
                  <BarChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.4} />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="deals" fill="#2563eb" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} lg={5}>
          <Card variant="outlined" sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} sx={{ mb: 1 }}>
                Recent activity
              </Typography>
              <List dense disablePadding>
                {recent.map((a) => (
                  <ListItem key={a.id} disableGutters sx={{ py: 0.75 }}>
                    <ListItemText
                      primary={a.subject}
                      secondary={
                        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                          <Chip size="small" label={a.type} variant="outlined" />
                          <Chip
                            size="small"
                            label={a.status}
                            color={a.status === 'done' ? 'success' : a.status === 'open' ? 'primary' : 'default'}
                          />
                        </Stack>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
        </>
      )}
    </Box>
  )
}
