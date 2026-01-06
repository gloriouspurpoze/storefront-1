import React from 'react'
import {
  Card,
  CardContent,
  Box,
  Typography,
} from '@mui/material'
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
} from '@mui/icons-material'

export interface StatCardProps {
  title: string
  value: string | number
  change?: number
  icon: React.ReactNode
  color?: 'primary' | 'secondary' | 'success' | 'error' | 'info' | 'warning'
  subtitle?: string
}

export function StatCard({ 
  title, 
  value, 
  change, 
  icon: Icon, 
  color = 'primary', 
  subtitle 
}: StatCardProps) {
  const isPositive = change !== undefined ? change > 0 : null

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h6" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
            {title}
          </Typography>
          <Box sx={{ color: `${color}.main`, fontSize: 24 }}>
            {Icon}
          </Box>
        </Box>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
          {value}
        </Typography>
        {subtitle && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            {subtitle}
          </Typography>
        )}
        {change !== undefined && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            {isPositive ? (
              <TrendingUpIcon sx={{ color: 'success.main', fontSize: 16 }} />
            ) : (
              <TrendingDownIcon sx={{ color: 'error.main', fontSize: 16 }} />
            )}
            <Typography
              variant="body2"
              sx={{
                color: isPositive ? 'success.main' : 'error.main',
                fontWeight: 600,
              }}
            >
              {isPositive ? '+' : ''}{change}% from last month
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  )
}

