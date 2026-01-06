import React from 'react'
import { Box, Typography, Button, useTheme, useMediaQuery } from '@mui/material'

interface PageHeaderProps {
  title: string
  subtitle?: string
  icon?: React.ReactElement
  action?: React.ReactNode
  children?: React.ReactNode
}

export function PageHeader({ title, subtitle, icon, action, children }: PageHeaderProps) {
  const theme = useTheme()

  return (
    <Box sx={{ 
      mb: { xs: 2, sm: 3, md: 4 },
      display: 'flex',
      flexDirection: { xs: 'column', sm: 'row' },
      justifyContent: 'space-between',
      alignItems: { xs: 'flex-start', sm: 'center' },
      gap: 2
    }}>
      <Box>
        <Typography variant="h4" sx={{ 
          fontWeight: 700, 
          mb: 1,
          fontSize: { xs: '1.5rem', sm: '2rem', md: '2.5rem' }
        }}>
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="body1" color="text.secondary" sx={{
            fontSize: { xs: '0.875rem', sm: '1rem' }
          }}>
            {subtitle}
          </Typography>
        )}
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
