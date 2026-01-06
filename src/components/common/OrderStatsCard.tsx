import React from 'react'
import { Box, Typography, Card, useTheme } from '@mui/material'
import { TrendingUp, TrendingDown, TrendingFlat } from '@mui/icons-material'

interface OrderStatsCardProps {
  title: string
  value: string | number
  subtitle?: string
  trend?: {
    value: number
    isPositive: boolean
    isNeutral?: boolean
  }
  icon?: React.ReactNode
  color?: 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info'
}

export const OrderStatsCard: React.FC<OrderStatsCardProps> = ({
  title,
  value,
  subtitle,
  trend,
  icon,
  color = 'primary'
}) => {
  const theme = useTheme()

  const getTrendIcon = () => {
    if (!trend) return null
    
    if (trend.isNeutral) {
      return <TrendingFlat sx={{ fontSize: 16, color: theme.palette.warning.main }} />
    }
    
    return trend.isPositive 
      ? <TrendingUp sx={{ fontSize: 16, color: theme.palette.success.main }} />
      : <TrendingDown sx={{ fontSize: 16, color: theme.palette.error.main }} />
  }

  const getTrendColor = () => {
    if (!trend) return theme.palette.text.secondary
    
    if (trend.isNeutral) return theme.palette.warning.main
    
    return trend.isPositive 
      ? theme.palette.success.main 
      : theme.palette.error.main
  }

  return (
    <Card sx={{ height: '100%' }}>
      <Box sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box>
            <Typography 
              variant="body2" 
              color="text.secondary" 
              sx={{ fontWeight: 500, mb: 0.5 }}
            >
              {title}
            </Typography>
            <Typography 
              variant="h4" 
              sx={{ 
                fontWeight: 700, 
                color: 'text.primary',
                fontSize: { xs: '1.5rem', sm: '2rem' }
              }}
            >
              {value}
            </Typography>
            {subtitle && (
              <Typography 
                variant="caption" 
                color="text.secondary"
                sx={{ fontSize: '0.75rem' }}
              >
                {subtitle}
              </Typography>
            )}
          </Box>
          {icon && (
            <Box sx={{ color: `${color}.main`, opacity: 0.8 }}>
              {icon}
            </Box>
          )}
        </Box>
        
        {trend && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            {getTrendIcon()}
            <Typography 
              variant="body2" 
              sx={{ 
                color: getTrendColor(),
                fontWeight: 600,
                fontSize: '0.875rem'
              }}
            >
              {trend.isPositive ? '+' : ''}{trend.value}%
            </Typography>
            <Typography 
              variant="caption" 
              color="text.secondary"
              sx={{ fontSize: '0.75rem' }}
            >
              from last month
            </Typography>
          </Box>
        )}
      </Box>
    </Card>
  )
}
