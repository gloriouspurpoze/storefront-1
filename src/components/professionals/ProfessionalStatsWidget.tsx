/**
 * ============================================================================
 * PROFESSIONAL STATS WIDGET
 * ============================================================================
 * Displays professional statistics cards
 *
 * @author CTO Team
 * @date November 7, 2025
 */

import React, { useState, useEffect } from 'react'
import { Users, CheckCircle, Clock, Star, Loader2 } from 'lucide-react'
import { Card, CardContent } from '../ui/card'
import { ProfessionalsService } from '../../services/api/professionals.service'
import { ProfessionalStats } from '../../types/professional.types'
import { getProfessionalCategoryLabel } from '../../constants/professionalCategories'

interface ProfessionalStatsWidgetProps {
  onRefresh?: number
}

export function ProfessionalStatsWidget({ onRefresh }: ProfessionalStatsWidgetProps) {
  const [stats, setStats] = useState<ProfessionalStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    void fetchStats()
  }, [onRefresh])

  const fetchStats = async () => {
    try {
      setLoading(true)
      const response = await ProfessionalsService.getProfessionalStats()
      if (response.data) {
        setStats(response.data)
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!stats) return null

  const moderationCards: {
    title: string
    value: string | number
    icon: typeof Users
    color: string
    bgColor: string
  }[] = []

  if (stats.suspendedProfessionals != null && stats.suspendedProfessionals > 0) {
    moderationCards.push({
      title: 'Suspended (fleet)',
      value: stats.suspendedProfessionals,
      icon: Clock,
      color: '#ca8a04',
      bgColor: '#fefce8',
    })
  }
  if (stats.blockedProfessionals != null && stats.blockedProfessionals > 0) {
    moderationCards.push({
      title: 'Blocked (fleet)',
      value: stats.blockedProfessionals,
      icon: Users,
      color: '#b91c1c',
      bgColor: '#fef2f2',
    })
  }
  if (stats.inactiveProfessionals != null && stats.inactiveProfessionals > 0) {
    moderationCards.push({
      title: 'Inactive (fleet)',
      value: stats.inactiveProfessionals,
      icon: Users,
      color: '#64748b',
      bgColor: '#f8fafc',
    })
  }

  const statCards: {
    title: string
    value: string | number
    icon: typeof Users
    color: string
    bgColor: string
  }[] = [
    {
      title: 'Total Professionals',
      value: stats.totalProfessionals,
      icon: Users,
      color: '#2563eb',
      bgColor: '#eff6ff',
    },
    {
      title: 'Verified',
      value: stats.verifiedProfessionals,
      icon: CheckCircle,
      color: '#16a34a',
      bgColor: '#f0fdf4',
    },
    {
      title: 'Available',
      value: stats.availableProfessionals,
      icon: Clock,
      color: '#ea580c',
      bgColor: '#fff7ed',
    },
    {
      title: 'Average Rating',
      value: stats.averageRating.toFixed(1),
      icon: Star,
      color: '#eab308',
      bgColor: '#fef9e7',
    },
  ]

  const byCategory = (stats.professionalsByCategory || [])
    .filter((r) => r && (r.count ?? 0) > 0)
    .sort((a, b) => (b.count ?? 0) - (a.count ?? 0))
  const topSkills = (stats.topSkills || []).filter((r) => r && (r.count ?? 0) > 0).slice(0, 8)

  return (
    <div className="mb-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
        {statCards.map((stat, index) => {
          const Icon = stat.icon
          return (
            <Card
              key={index}
              className="transition-shadow duration-300 hover:-translate-y-1 hover:shadow-md"
            >
              <CardContent className="pt-6">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="mb-1 text-sm font-medium text-muted-foreground">{stat.title}</p>
                    <p className="text-3xl font-bold" style={{ color: stat.color }}>
                      {stat.value}
                    </p>
                  </div>
                  <div
                    className="flex h-14 w-14 shrink-0 items-center justify-center rounded-md"
                    style={{ backgroundColor: stat.bgColor }}
                  >
                    <Icon className="h-7 w-7" style={{ color: stat.color }} aria-hidden />
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {moderationCards.length > 0 && (
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {moderationCards.map((stat, index) => {
            const Icon = stat.icon
            return (
              <Card key={`mod-${index}`} className="border-amber-200/80">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="mb-1 text-sm font-medium text-muted-foreground">{stat.title}</p>
                      <p className="text-2xl font-bold" style={{ color: stat.color }}>
                        {stat.value}
                      </p>
                    </div>
                    <div
                      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md"
                      style={{ backgroundColor: stat.bgColor }}
                    >
                      <Icon className="h-6 w-6" style={{ color: stat.color }} aria-hidden />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* {byCategory.length > 0 && (
        <Card className="mt-4">
          <CardContent className="p-4">
            <p className="mb-3 text-sm font-medium text-muted-foreground">Professionals by trade / category</p>
            <div className="flex flex-wrap gap-2">
              {byCategory.map((row) => (
                <div
                  key={row.category}
                  className="inline-flex items-center gap-2 rounded-md border border-border bg-muted/40 px-3 py-1.5 text-sm"
                >
                  <span className="font-medium">{getProfessionalCategoryLabel(row.category)}</span>
                  <span className="tabular-nums text-muted-foreground">{row.count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {topSkills.length > 0 && (
        <Card className="mt-4">
          <CardContent className="p-4">
            <p className="mb-3 text-sm font-medium text-muted-foreground">Top skills (counts)</p>
            <div className="flex flex-wrap gap-2">
              {topSkills.map((row) => (
                <div
                  key={row.skill}
                  className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-3 py-1.5 text-sm"
                >
                  <span className="max-w-[160px] truncate" title={row.skill}>
                    {row.skill}
                  </span>
                  <span className="tabular-nums text-muted-foreground">{row.count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )} */}
    </div>
  )
}
