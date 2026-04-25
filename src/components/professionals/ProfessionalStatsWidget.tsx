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
    </div>
  )
}
