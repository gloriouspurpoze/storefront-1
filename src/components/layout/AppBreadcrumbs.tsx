import React from 'react'
import { Link as RouterLink } from 'react-router-dom'
import { Breadcrumbs, Link, Typography, Box } from '@mui/material'
import { NavigateNext as SeparatorIcon } from '@mui/icons-material'
import { useLocation } from 'react-router-dom'
import { getBreadcrumbItems } from '../../config/app-routes'

export function AppBreadcrumbs() {
  const location = useLocation()
  const items = getBreadcrumbItems(location.pathname)

  if (items.length === 0) return null

  return (
    <Box
      component="nav"
      aria-label="breadcrumb"
      sx={{
        mb: { xs: 2, sm: 2.5 },
        px: { xs: 0, sm: 0 },
      }}
    >
      <Breadcrumbs
        separator={<SeparatorIcon sx={{ fontSize: 16, color: 'text.disabled' }} />}
        sx={{
          '& .MuiBreadcrumbs-li': { display: 'inline-flex', alignItems: 'center' },
        }}
      >
        {items.map((crumb, index) => {
          const isLast = index === items.length - 1
          if (isLast) {
            return (
              <Typography
                key={crumb.to}
                color="text.primary"
                variant="body2"
                sx={{ fontWeight: 600 }}
              >
                {crumb.label}
              </Typography>
            )
          }
          return (
            <Link
              key={crumb.to}
              component={RouterLink}
              to={crumb.to}
              underline="hover"
              color="text.secondary"
              variant="body2"
              sx={{ fontWeight: 500 }}
            >
              {crumb.label}
            </Link>
          )
        })}
      </Breadcrumbs>
    </Box>
  )
}
