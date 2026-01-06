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
import { Box, Grid, Card, CardContent, Typography, CircularProgress } from '@mui/material'
import {
  People as PeopleIcon,
  CheckCircle as VerifiedIcon,
  AccessTime as AvailableIcon,
  Star as RatingIcon,
} from '@mui/icons-material'
import { ProfessionalsService } from '../../services/api/professionals.service'
import { ProfessionalStats } from '../../types/professional.types'

interface ProfessionalStatsWidgetProps {
  onRefresh?: number
}

export function ProfessionalStatsWidget({ onRefresh }: ProfessionalStatsWidgetProps) {
  const [stats, setStats] = useState<ProfessionalStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
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
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    )
  }

  if (!stats) return null

  const statCards = [
    {
      title: 'Total Professionals',
      value: stats.totalProfessionals,
      icon: PeopleIcon,
      color: '#2563eb',
      bgColor: '#eff6ff',
    },
    {
      title: 'Verified',
      value: stats.verifiedProfessionals,
      icon: VerifiedIcon,
      color: '#16a34a',
      bgColor: '#f0fdf4',
    },
    {
      title: 'Available',
      value: stats.availableProfessionals,
      icon: AvailableIcon,
      color: '#ea580c',
      bgColor: '#fff7ed',
    },
    {
      title: 'Average Rating',
      value: stats.averageRating.toFixed(1),
      icon: RatingIcon,
      color: '#eab308',
      bgColor: '#fef9e7',
    },
  ]

  return (
    <Box sx={{ mb: 3 }}>
      <Grid container spacing={3}>
        {statCards.map((stat, index) => {
          const Icon = stat.icon
          return (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Card
                sx={{
                  borderRadius: 2,
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                  },
                }}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography
                        variant="body2"
                        sx={{
                          color: 'text.secondary',
                          fontWeight: 500,
                          mb: 1,
                        }}
                      >
                        {stat.title}
                      </Typography>
                      <Typography
                        variant="h4"
                        sx={{
                          fontWeight: 700,
                          color: stat.color,
                        }}
                      >
                        {stat.value}
                      </Typography>
                    </Box>
                    <Box
                      sx={{
                        width: 56,
                        height: 56,
                        borderRadius: 2,
                        bgcolor: stat.bgColor,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Icon sx={{ fontSize: 28, color: stat.color }} />
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          )
        })}
      </Grid>
    </Box>
  )
}

