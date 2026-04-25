import React, { useEffect, useState } from 'react'
import { Users, CheckCircle, Clock, Star } from 'lucide-react'
import { Card, CardContent } from '../ui/card'
import { ProvidersService, ProviderStats } from '../../services/api/providers.service'
import { cn } from '../../lib/utils'

interface ProviderStatsWidgetProps {
  onRefresh?: number
}

interface StatCardProps {
  title: string
  value: string | number
  icon: React.ReactNode
  accentClass: string
  iconBg: string
  subtitle?: string
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, accentClass, iconBg, subtitle }) => (
  <Card className="h-full rounded-lg">
    <CardContent className="pt-6">
      <div className="flex items-center gap-3">
        <div
          className={cn('flex h-12 w-12 items-center justify-center rounded-lg', iconBg, accentClass)}
        >
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-2xl font-semibold leading-tight">{value}</p>
          <p className="text-sm text-muted-foreground">{title}</p>
          {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
        </div>
      </div>
    </CardContent>
  </Card>
)

function StatCardSkeleton() {
  return (
    <Card className="h-full rounded-lg">
      <CardContent className="pt-6">
        <div className="flex animate-pulse items-center gap-3">
          <div className="h-12 w-12 rounded-lg bg-muted" />
          <div className="flex-1 space-y-2">
            <div className="h-8 w-20 rounded bg-muted" />
            <div className="h-4 w-28 rounded bg-muted" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

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
    void fetchStats()
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
    } catch (err: unknown) {
      console.error('Error fetching provider stats:', err)
      setError((err as { message?: string }).message || 'Failed to fetch provider statistics')

      try {
        const response = await ProvidersService.getProviders({ limit: 100 })

        const r = response.data as { providers?: unknown[]; serviceProviders?: unknown[] } | undefined
        if (r?.providers || r?.serviceProviders) {
          const allProviders = (r.providers || r.serviceProviders || []) as {
            verification_status?: string
            rating?: number
          }[]
          const verified = allProviders.filter((p) => p.verification_status === 'verified').length
          const pending = allProviders.filter((p) => p.verification_status === 'pending').length
          const rejected = allProviders.filter((p) => p.verification_status === 'rejected').length
          const avgRating =
            allProviders.reduce((sum, p) => sum + (p.rating || 0), 0) / (allProviders.length || 1) || 0

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
      } catch (fallbackError: unknown) {
        console.error('Fallback also failed:', fallbackError)
      }
    } finally {
      setLoading(false)
    }
  }

  if (error) {
    return (
      <div
        className="mb-6 rounded-md border border-amber-500/50 bg-amber-500/10 px-3 py-2 text-sm text-amber-950 dark:text-amber-100"
        role="status"
      >
        {error}. Showing fallback data.
      </div>
    )
  }

  if (loading) {
    return (
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
      </div>
    )
  }

  const totalProviders = Number(stats.total_providers || 0)
  const verifiedProviders = Number(stats.verified_providers || 0)
  const pendingProviders = Number(stats.pending_providers || 0)

  const verificationRate = totalProviders > 0 ? Math.round((verifiedProviders / totalProviders) * 100) : 0

  const pendingRate = totalProviders > 0 ? Math.round((pendingProviders / totalProviders) * 100) : 0

  const averageRatingRaw =
    stats.average_rating != null && !Number.isNaN(Number(stats.average_rating))
      ? Number(stats.average_rating)
      : null

  return (
    <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
      <StatCard
        title="Total Providers"
        value={stats.total_providers}
        icon={<Users className="h-6 w-6" />}
        accentClass="text-blue-600"
        iconBg="bg-blue-100 dark:bg-blue-950/50"
        subtitle="All registered providers"
      />
      <StatCard
        title="Verified Providers"
        value={stats.verified_providers}
        icon={<CheckCircle className="h-6 w-6" />}
        accentClass="text-emerald-600"
        iconBg="bg-emerald-100 dark:bg-emerald-950/50"
        subtitle={`${verificationRate}% of total`}
      />
      <StatCard
        title="Pending Verification"
        value={stats.pending_providers}
        icon={<Clock className="h-6 w-6" />}
        accentClass="text-amber-600"
        iconBg="bg-amber-100 dark:bg-amber-950/50"
        subtitle={`${pendingRate}% awaiting review`}
      />
      <StatCard
        title="Average Rating"
        value={averageRatingRaw !== null ? averageRatingRaw.toFixed(1) : '—'}
        icon={<Star className="h-6 w-6" />}
        accentClass="text-sky-600"
        iconBg="bg-sky-100 dark:bg-sky-950/50"
        subtitle="Provider rating"
      />
    </div>
  )
}
