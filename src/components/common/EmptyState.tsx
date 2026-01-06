import React from 'react'
import { Box, Typography, Button, Paper } from '@mui/material'

interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description: string
  action?: {
    label: string
    onClick: () => void
  }
  size?: 'small' | 'medium' | 'large'
}

export function EmptyState({ 
  icon, 
  title, 
  description, 
  action, 
  size = 'medium' 
}: EmptyStateProps) {
  const getIconSize = () => {
    switch (size) {
      case 'small':
        return 48
      case 'large':
        return 96
      default:
        return 64
    }
  }

  const getPadding = () => {
    switch (size) {
      case 'small':
        return 3
      case 'large':
        return 8
      default:
        return 6
    }
  }

  return (
    <Paper sx={{ 
      p: getPadding(), 
      textAlign: 'center',
      backgroundColor: 'background.default'
    }}>
      {icon && (
        <Box sx={{ 
          mb: 2,
          display: 'flex',
          justifyContent: 'center'
        }}>
          <Box sx={{ 
            fontSize: getIconSize(),
            color: 'text.secondary'
          }}>
            {icon}
          </Box>
        </Box>
      )}
      
      <Typography variant="h6" sx={{ 
        mb: 1,
        fontWeight: 600,
        fontSize: { xs: '1rem', sm: '1.25rem' }
      }}>
        {title}
      </Typography>
      
      <Typography variant="body2" color="text.secondary" sx={{ 
        mb: 3,
        fontSize: { xs: '0.875rem', sm: '1rem' }
      }}>
        {description}
      </Typography>
      
      {action && (
        <Button
          variant="contained"
          onClick={action.onClick}
          size="large"
        >
          {action.label}
        </Button>
      )}
    </Paper>
  )
}
