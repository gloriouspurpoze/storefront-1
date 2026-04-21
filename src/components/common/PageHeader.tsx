import React from 'react'
import { Box, Typography } from '@mui/material'

interface PageHeaderProps {
  title: string
  subtitle?: string
  icon?: React.ReactElement
  action?: React.ReactNode
  children?: React.ReactNode
}

export function PageHeader({ title, subtitle, icon, action, children }: PageHeaderProps) {

  return (
    <Box sx={{ 
      mb: { xs: 2, sm: 3, md: 4 },
      display: 'flex',
      flexDirection: { xs: 'column', sm: 'row' },
      justifyContent: 'space-between',
      alignItems: { xs: 'flex-start', sm: 'center' },
      gap: 2
    }}>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, minWidth: 0 }}>
        {icon && <Box sx={{ pt: 0.25, color: 'primary.main', display: 'flex' }}>{icon}</Box>}
        <Box sx={{ minWidth: 0 }}>
        <Typography
          variant="h5"
          component="h1"
          sx={{
            fontWeight: 600,
            mb: subtitle ? 0.5 : 0,
            fontSize: { xs: '1.25rem', sm: '1.375rem', md: '1.5rem' },
            letterSpacing: '-0.02em',
            lineHeight: 1.3,
          }}
        >
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="body2" color="text.secondary" sx={{
            fontSize: { xs: '0.8125rem', sm: '0.875rem' },
            maxWidth: 'min(52rem, 100%)',
          }}>
            {subtitle}
          </Typography>
        )}
        </Box>
      </Box>
      
      {action && (
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 1,
          width: { xs: '100%', sm: 'auto' }
        }}>
          {action}
        </Box>
      )}
      
      {children}
    </Box>
  )
}
