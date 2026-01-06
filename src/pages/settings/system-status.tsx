import React, { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  LinearProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Alert,
  Button,
  useTheme,
  alpha,
} from '@mui/material'
import {
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Refresh as RefreshIcon,
  Cloud as CloudIcon,
  Storage as DatabaseIcon,
  Security as SecurityIcon,
  Speed as SpeedIcon,
  Storage as StorageIcon,
  NetworkCheck as NetworkIcon,
  Memory as MemoryIcon,
  Memory as CpuIcon,
} from '@mui/icons-material'
import { PageHeader } from '../../components/common/PageHeader'

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

export function SystemStatus() {
  const theme = useTheme()
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
    {
      name: 'CPU Usage',
      value: 45,
      unit: '%',
      status: 'good',
      trend: 'stable',
    },
    {
      name: 'Memory Usage',
      value: 72,
      unit: '%',
      status: 'warning',
      trend: 'up',
    },
    {
      name: 'Disk Usage',
      value: 38,
      unit: '%',
      status: 'good',
      trend: 'stable',
    },
    {
      name: 'Network Latency',
      value: 23,
      unit: 'ms',
      status: 'good',
      trend: 'down',
    },
    {
      name: 'Active Connections',
      value: 1247,
      unit: 'connections',
      status: 'good',
      trend: 'up',
    },
    {
      name: 'Error Rate',
      value: 0.02,
      unit: '%',
      status: 'good',
      trend: 'down',
    },
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'operational':
        return theme.palette.success.main
      case 'degraded':
        return theme.palette.warning.main
      case 'outage':
        return theme.palette.error.main
      case 'maintenance':
        return theme.palette.info.main
      default:
        return theme.palette.grey[500]
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'operational':
        return <CheckCircleIcon />
      case 'degraded':
        return <WarningIcon />
      case 'outage':
        return <ErrorIcon />
      case 'maintenance':
        return <InfoIcon />
      default:
        return <InfoIcon />
    }
  }

  const getMetricColor = (status: string) => {
    switch (status) {
      case 'good':
        return theme.palette.success.main
      case 'warning':
        return theme.palette.warning.main
      case 'critical':
        return theme.palette.error.main
      default:
        return theme.palette.grey[500]
    }
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000))
    setLastUpdated(new Date())
    setIsRefreshing(false)
  }

  const overallStatus = systemComponents.every(c => c.status === 'operational') 
    ? 'operational' 
    : systemComponents.some(c => c.status === 'outage') 
    ? 'outage' 
    : 'degraded'

  return (
    <Box sx={{ flexGrow: 1 }}>
      <PageHeader
        title="System Status"
        subtitle="Monitor system health and performance"
        icon={<CloudIcon />}
        action={
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
        }
      />

      {/* Overall Status Alert */}
      <Alert 
        severity={overallStatus === 'operational' ? 'success' : overallStatus === 'outage' ? 'error' : 'warning'}
        sx={{ mb: 3 }}
      >
        <Typography variant="h6">
          All systems {overallStatus === 'operational' ? 'operational' : overallStatus === 'outage' ? 'experiencing outages' : 'experiencing issues'}
        </Typography>
        <Typography variant="body2">
          Last updated: {lastUpdated.toLocaleString()}
        </Typography>
      </Alert>

      <Grid container spacing={3}>
        {/* System Components */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 3 }}>
                System Components
              </Typography>
              <List>
                {systemComponents.map((component, index) => (
                  <React.Fragment key={component.id}>
                    <ListItem>
                      <ListItemIcon>
                        <Box
                          sx={{
                            color: getStatusColor(component.status),
                            display: 'flex',
                            alignItems: 'center',
                          }}
                        >
                          {getStatusIcon(component.status)}
                        </Box>
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                              {component.name}
                            </Typography>
                            <Chip
                              label={component.status}
                              size="small"
                              sx={{
                                backgroundColor: alpha(getStatusColor(component.status), 0.1),
                                color: getStatusColor(component.status),
                                textTransform: 'capitalize',
                              }}
                            />
                          </Box>
                        }
                        secondary={
                          <Box>
                            <Typography variant="body2" color="text.secondary">
                              {component.description}
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
                              <Typography variant="caption" color="text.secondary">
                                Uptime: {component.uptime}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                Response: {component.responseTime}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                Last checked: {component.lastChecked}
                              </Typography>
                            </Box>
                          </Box>
                        }
                      />
                    </ListItem>
                    {index < systemComponents.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* System Metrics */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 3 }}>
                System Metrics
              </Typography>
              <List>
                {systemMetrics.map((metric) => (
                  <ListItem key={metric.name} sx={{ flexDirection: 'column', alignItems: 'stretch' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {metric.name}
                      </Typography>
                      <Typography variant="body2" sx={{ color: getMetricColor(metric.status) }}>
                        {metric.value}{metric.unit}
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={metric.name === 'Error Rate' ? metric.value * 100 : metric.value}
                      sx={{
                        height: 6,
                        borderRadius: 3,
                        backgroundColor: alpha(getMetricColor(metric.status), 0.1),
                        '& .MuiLinearProgress-bar': {
                          backgroundColor: getMetricColor(metric.status),
                        },
                      }}
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Incidents */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 3 }}>
                Recent Incidents
              </Typography>
              {incidents.length > 0 ? (
                <List>
                  {incidents.map((incident, index) => (
                    <React.Fragment key={incident.id}>
                      <ListItem>
                        <ListItemIcon>
                          <Box
                            sx={{
                              color: incident.status === 'investigating' 
                                ? theme.palette.warning.main 
                                : theme.palette.info.main,
                            }}
                          >
                            {incident.status === 'investigating' ? <WarningIcon /> : <InfoIcon />}
                          </Box>
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                                {incident.title}
                              </Typography>
                              <Chip
                                label={incident.status}
                                size="small"
                                color={incident.status === 'investigating' ? 'warning' : 'info'}
                                variant="outlined"
                              />
                              <Chip
                                label={incident.impact}
                                size="small"
                                color={incident.impact === 'major' ? 'error' : 'default'}
                                variant="outlined"
                              />
                            </Box>
                          }
                          secondary={
                            <Box>
                              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                {incident.description}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                Started: {new Date(incident.started).toLocaleString()}
                              </Typography>
                              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                Affected: {incident.affected.join(', ')}
                              </Typography>
                            </Box>
                          }
                        />
                      </ListItem>
                      {index < incidents.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              ) : (
                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                  No recent incidents
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  )
}

export default SystemStatus
