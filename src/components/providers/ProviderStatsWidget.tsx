import React, { useEffect, useState } from 'react'
import {
  Card,
  CardContent,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Skeleton,
} from '@mui/material'
import Grid from '@mui/material/GridLegacy'
import {
  People as PeopleIcon,
  CheckCircle as VerifiedIcon,
  Pending as PendingIcon,
  Star as StarIcon,
  Work as WorkIcon,
  TrendingUp as TrendingUpIcon,
} from '@mui/icons-material'
import { ProvidersService, ProviderStats } from '../../services/api/providers.service'

interface ProviderStatsWidgetProps {
  onRefresh?: number // timestamp to trigger refresh
}

interface StatCardProps {
  title: string
  value: string | number
  icon: React.ReactNode
  color: string
  subtitle?: string
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color, subtitle }) => (
  <Card sx={{ borderRadius: 2, height: '100%' }}>
    <CardContent>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Box
          sx={{
            p: 1.5,
            borderRadius: 2,
            bgcolor: `${color}.100`,
            color: `${color}.main`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {icon}
        </Box>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h4" fontWeight="600" sx={{ mb: 0.5 }}>
            {value}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {title}
          </Typography>
          {subtitle && (
            <Typography variant="caption" color="text.secondary">
              {subtitle}
            </Typography>
          )}
        </Box>
      </Box>
    </CardContent>
  </Card>
)

const StatCardSkeleton: React.FC = () => (
  <Card sx={{ borderRadius: 2, height: '100%' }}>
    <CardContent>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Skeleton variant="rectangular" width={56} height={56} sx={{ borderRadius: 2 }} />
        <Box sx={{ flex: 1 }}>
          <Skeleton variant="text" width={80} height={40} />
          <Skeleton variant="text" width={120} height={24} />
        </Box>
      </Box>
    </CardContent>
  </Card>
)

export function ProviderStatsWidget({ onRefresh }: ProviderStatsWidgetProps) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState({
    total_providers: 0,
    verified_providers: 0,
    pending_providers: 0,
    rejected_providers: 0,
    average_rating: 0,
    total_services: 0,
    total_bookings: 0,
  })

  useEffect(() => {
    fetchStats()
  }, [onRefresh])

  const fetchStats = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await ProvidersService.getProviderStats()
      
      if (response.data) {
        const d = response.data as ProviderStats
        setStats({
          total_providers: d.total_providers ?? 0,
          verified_providers: d.verified_providers ?? 0,
          pending_providers: d.pending_providers ?? 0,
          rejected_providers: d.rejected_providers ?? 0,
          average_rating: d.average_rating ?? 0,
          total_services: d.total_services ?? 0,
          total_bookings: d.total_bookings ?? 0,
        })
      }
    } catch (err: any) {
      console.error('Error fetching provider stats:', err)
      setError(err.message || 'Failed to fetch provider statistics')
      
      // Try fallback approach
      try {
        const response = await ProvidersService.getProviders({ limit: 100 })
        
        if (response.data?.providers || response.data?.serviceProviders) {
          const allProviders = response.data?.providers || response.data?.serviceProviders || []
          const verified = allProviders.filter(p => p.verification_status === 'verified').length
          const pending = allProviders.filter(p => p.verification_status === 'pending').length
          const rejected = allProviders.filter(p => p.verification_status === 'rejected').length
          const avgRating = allProviders.reduce((sum, p) => sum + (p.rating || 0), 0) / allProviders.length || 0

          setStats({
            total_providers: allProviders.length,
            verified_providers: verified,
            pending_providers: pending,
            rejected_providers: rejected,
            average_rating: avgRating,
            total_services: 0,
            total_bookings: 0,
          })
          setError(null)
        }
      } catch (fallbackError: any) {
        console.error('Fallback also failed:', fallbackError)
      }
    } finally {
      setLoading(false)
    }
  }

  if (error) {
    return (
      <Alert severity="warning" sx={{ mb: 3, borderRadius: 2 }}>
        {error}. Showing fallback data.
      </Alert>
    )
  }

  if (loading) {
    return (
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCardSkeleton />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCardSkeleton />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCardSkeleton />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCardSkeleton />
        </Grid>
      </Grid>
    )
  }

  // Coerce statistics to numbers and guard against undefined/null to avoid runtime errors
  const totalProviders = Number(stats.total_providers || 0)
  const verifiedProviders = Number(stats.verified_providers || 0)
  const pendingProviders = Number(stats.pending_providers || 0)

  const verificationRate = totalProviders > 0
    ? Math.round((verifiedProviders / totalProviders) * 100)
    : 0

  const pendingRate = totalProviders > 0
    ? Math.round((pendingProviders / totalProviders) * 100)
    : 0

  const averageRatingRaw = stats.average_rating != null && !Number.isNaN(Number(stats.average_rating))
    ? Number(stats.average_rating)
    : null

  return (
    <Grid container spacing={3} sx={{ mb: 3 }}>
      <Grid item xs={12} sm={6} md={3}>
        <StatCard
          title="Total Providers"
          value={stats.total_providers}
          icon={<PeopleIcon />}
          color="primary"
          subtitle="All registered providers"
        />
      </Grid>

      <Grid item xs={12} sm={6} md={3}>
        <StatCard
          title="Verified Providers"
          value={stats.verified_providers}
          icon={<VerifiedIcon />}
          color="success"
          subtitle={`${verificationRate}% of total`}
        />
      </Grid>

      <Grid item xs={12} sm={6} md={3}>
        <StatCard
          title="Pending Verification"
          value={stats.pending_providers}
          icon={<PendingIcon />}
          color="warning"
          subtitle={`${pendingRate}% awaiting review`}
        />
      </Grid>

      <Grid item xs={12} sm={6} md={3}>
        <StatCard
          title="Average Rating"
          value={averageRatingRaw !== null ? averageRatingRaw.toFixed(1) : '—'}
          icon={<StarIcon />}
          color="info"
          subtitle="Provider rating"
        />
      </Grid>
    </Grid>
  )
}

