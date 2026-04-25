import React, { useState } from 'react'
import { Cloud, RefreshCw, CheckCircle2, AlertTriangle, XCircle, Info } from 'lucide-react'
import { Card, CardContent } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Badge } from '../../components/ui/badge'
import { Separator } from '../../components/ui/separator'
import { PageHeader } from '../../components/common/PageHeader'
import { cn } from '../../lib/utils'

interface SystemComponent {
  id: string
  name: string
  status: 'operational' | 'degraded' | 'outage' | 'maintenance'
  uptime: string
  responseTime: string
  lastChecked: string
  description: string
}

interface SystemMetric {
  name: string
  value: number
  unit: string
  status: 'good' | 'warning' | 'critical'
  trend: 'up' | 'down' | 'stable'
}

const statusConfig: Record<
  string,
  { className: string; icon: React.ElementType<{ className?: string }> }
> = {
  operational: { className: 'text-emerald-600', icon: CheckCircle2 },
  degraded: { className: 'text-amber-600', icon: AlertTriangle },
  outage: { className: 'text-destructive', icon: XCircle },
  maintenance: { className: 'text-sky-600', icon: Info },
}

const metricBarClass: Record<string, string> = {
  good: 'bg-emerald-500',
  warning: 'bg-amber-500',
  critical: 'bg-destructive',
}

const metricTextClass: Record<string, string> = {
  good: 'text-emerald-600',
  warning: 'text-amber-600',
  critical: 'text-destructive',
}

function metricBarWidth(metric: SystemMetric): number {
  if (metric.name === 'Error Rate') return Math.min(100, metric.value * 100)
  if (metric.unit === '%') return Math.min(100, metric.value)
  if (metric.unit === 'connections') return Math.min(100, (metric.value / 2000) * 100)
  if (metric.unit === 'ms') return Math.min(100, (metric.value / 100) * 100)
  return Math.min(100, metric.value)
}

export function SystemStatus() {
  const [lastUpdated, setLastUpdated] = useState(new Date())
  const [isRefreshing, setIsRefreshing] = useState(false)

  const systemComponents: SystemComponent[] = [
    {
      id: 'api',
      name: 'API Server',
      status: 'operational',
      uptime: '99.9%',
      responseTime: '45ms',
      lastChecked: '2 minutes ago',
      description: 'Main API endpoints and services',
    },
    {
      id: 'database',
      name: 'Database',
      status: 'operational',
      uptime: '99.8%',
      responseTime: '12ms',
      lastChecked: '1 minute ago',
      description: 'Primary database cluster',
    },
    {
      id: 'auth',
      name: 'Authentication',
      status: 'operational',
      uptime: '99.9%',
      responseTime: '23ms',
      lastChecked: '30 seconds ago',
      description: 'User authentication and authorization',
    },
    {
      id: 'storage',
      name: 'File Storage',
      status: 'degraded',
      uptime: '98.5%',
      responseTime: '120ms',
      lastChecked: '5 minutes ago',
      description: 'Image and file storage service',
    },
    {
      id: 'notifications',
      name: 'Notifications',
      status: 'operational',
      uptime: '99.7%',
      responseTime: '67ms',
      lastChecked: '1 minute ago',
      description: 'Email and push notification service',
    },
    {
      id: 'payments',
      name: 'Payment Gateway',
      status: 'operational',
      uptime: '99.9%',
      responseTime: '89ms',
      lastChecked: '2 minutes ago',
      description: 'Payment processing and transactions',
    },
  ]

  const systemMetrics: SystemMetric[] = [
    { name: 'CPU Usage', value: 45, unit: '%', status: 'good', trend: 'stable' },
    { name: 'Memory Usage', value: 72, unit: '%', status: 'warning', trend: 'up' },
    { name: 'Disk Usage', value: 38, unit: '%', status: 'good', trend: 'stable' },
    { name: 'Network Latency', value: 23, unit: 'ms', status: 'good', trend: 'down' },
    { name: 'Active Connections', value: 1247, unit: 'connections', status: 'good', trend: 'up' },
    { name: 'Error Rate', value: 0.02, unit: '%', status: 'good', trend: 'down' },
  ]

  const incidents = [
    {
      id: '1',
      title: 'File Storage Performance Issue',
      status: 'investigating',
      impact: 'minor',
      description: 'Some users may experience slower file uploads',
      started: '2024-01-15T10:30:00Z',
      affected: ['File Storage'],
    },
    {
      id: '2',
      title: 'Scheduled Maintenance - Database',
      status: 'scheduled',
      impact: 'major',
      description: 'Database maintenance scheduled for tonight 2 AM EST',
      started: '2024-01-16T02:00:00Z',
      affected: ['Database', 'API Server'],
    },
  ]

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await new Promise((resolve) => setTimeout(resolve, 2000))
    setLastUpdated(new Date())
    setIsRefreshing(false)
  }

  const overallStatus = systemComponents.every((c) => c.status === 'operational')
    ? 'operational'
    : systemComponents.some((c) => c.status === 'outage')
      ? 'outage'
      : 'degraded'

  return (
    <div className="min-h-0 flex-1">
      <PageHeader
        title="System Status"
        subtitle="Monitor system health and performance"
        icon={<Cloud className="h-8 w-8" aria-hidden />}
        action={
          <Button variant="outline" onClick={handleRefresh} disabled={isRefreshing}>
            <RefreshCw className={cn('mr-2 h-4 w-4', isRefreshing && 'animate-spin')} />
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
        }
      />

      <div
        className={cn(
          'mb-6 rounded-md border p-4',
          overallStatus === 'operational' && 'border-emerald-200 bg-emerald-50/80 dark:border-emerald-900 dark:bg-emerald-950/30',
          overallStatus === 'outage' && 'border-destructive/50 bg-destructive/10',
          overallStatus === 'degraded' && 'border-amber-200 bg-amber-50/80 dark:border-amber-900 dark:bg-amber-950/30'
        )}
      >
        <h2 className="text-lg font-semibold">
          All systems{' '}
          {overallStatus === 'operational'
            ? 'operational'
            : overallStatus === 'outage'
              ? 'experiencing outages'
              : 'experiencing issues'}
        </h2>
        <p className="text-sm text-muted-foreground">Last updated: {lastUpdated.toLocaleString()}</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <Card>
            <CardContent className="pt-6">
              <h2 className="mb-4 text-lg font-semibold">System Components</h2>
              <ul className="space-y-0">
                {systemComponents.map((component, index) => {
                  const sc = statusConfig[component.status] ?? statusConfig.maintenance
                  const StatusIcon = sc.icon
                  return (
                    <li key={component.id}>
                      {index > 0 && <Separator className="my-3" />}
                      <div className="flex gap-3">
                        <div className={cn('mt-0.5 flex h-6 w-6 items-center justify-center', sc.className)}>
                          <StatusIcon className="h-5 w-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="mb-0.5 flex flex-wrap items-center gap-2">
                            <p className="font-semibold">{component.name}</p>
                            <Badge
                              variant="outline"
                              className="capitalize text-foreground"
                              style={{ borderColor: 'currentColor' }}
                            >
                              {component.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{component.description}</p>
                          <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
                            <span>Uptime: {component.uptime}</span>
                            <span>Response: {component.responseTime}</span>
                            <span>Last checked: {component.lastChecked}</span>
                          </div>
                        </div>
                      </div>
                    </li>
                  )
                })}
              </ul>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-4">
          <Card>
            <CardContent className="pt-6">
              <h2 className="mb-4 text-lg font-semibold">System Metrics</h2>
              <ul className="space-y-4">
                {systemMetrics.map((metric) => (
                  <li key={metric.name}>
                    <div className="mb-1 flex justify-between text-sm">
                      <span className="font-medium">{metric.name}</span>
                      <span className={cn('font-medium', metricTextClass[metric.status] ?? 'text-foreground')}>
                        {metric.value}
                        {metric.unit}
                      </span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className={cn('h-full rounded-full transition-all', metricBarClass[metric.status] ?? 'bg-primary')}
                        style={{ width: `${metricBarWidth(metric)}%` }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-12">
          <Card>
            <CardContent className="pt-6">
              <h2 className="mb-4 text-lg font-semibold">Recent Incidents</h2>
              {incidents.length > 0 ? (
                <ul>
                  {incidents.map((incident, index) => (
                    <li key={incident.id}>
                      {index > 0 && <Separator className="my-3" />}
                      <div className="flex gap-3">
                        <div
                          className={cn(
                            'mt-0.5 flex h-6 w-6 items-center justify-center',
                            incident.status === 'investigating' ? 'text-amber-600' : 'text-sky-600'
                          )}
                        >
                          {incident.status === 'investigating' ? (
                            <AlertTriangle className="h-5 w-5" />
                          ) : (
                            <Info className="h-5 w-5" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="mb-0.5 flex flex-wrap items-center gap-2">
                            <p className="font-semibold">{incident.title}</p>
                            <Badge variant="outline" className="capitalize">
                              {incident.status}
                            </Badge>
                            <Badge
                              variant="outline"
                              className={incident.impact === 'major' ? 'border-destructive text-destructive' : ''}
                            >
                              {incident.impact}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{incident.description}</p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            Started: {new Date(incident.started).toLocaleString()}
                          </p>
                          <p className="text-xs text-muted-foreground">Affected: {incident.affected.join(', ')}</p>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="py-8 text-center text-sm text-muted-foreground">No recent incidents</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default SystemStatus
