import React from 'react'
import { Box, Chip, Tooltip, Typography, alpha, useTheme } from '@mui/material'
import { Business as BusinessIcon } from '@mui/icons-material'
import { useAppSelector } from '../../store/hooks'
import { SAAS_MODE } from '../../lib/saasEnv'

function formatTenantLabel(
  tenantId: string | null,
  name: string | null,
  slug: string | null
): { primary: string; hint: string | null } {
  if (!tenantId && !name && !slug) {
    return { primary: 'No organization', hint: 'Complete login or set a default tenant.' }
  }
  const primary = name?.trim() || slug?.trim() || (tenantId ? `Tenant ${tenantId.slice(0, 8)}…` : 'Organization')
  const hint =
    tenantId && (name || slug)
      ? tenantId
      : tenantId && !name && !slug
        ? tenantId
        : null
  return { primary, hint }
}

/** Shown when `REACT_APP_SAAS_MODE=true` — current tenant / org context for multi-tenant admins. */
export function SaasTenantIndicator(props: {
  variant: 'header' | 'sidebar'
  sidebarOpen?: boolean
}) {
  const { variant, sidebarOpen = true } = props
  const theme = useTheme()
  const tenant = useAppSelector((s) => s.tenant)
  const { tenantId, name, slug } = tenant ?? {}

  if (!SAAS_MODE) return null

  const { primary, hint } = formatTenantLabel(tenantId, name, slug)

  if (variant === 'header') {
    return (
      <Tooltip title={hint ? `Tenant id: ${hint}` : primary}>
        <Chip
          icon={<BusinessIcon sx={{ fontSize: '1rem !important' }} />}
          label={primary}
          size="small"
          variant="outlined"
          sx={{
            maxWidth: { xs: 140, sm: 220 },
            borderColor: alpha(theme.palette.primary.main, 0.35),
            '& .MuiChip-label': {
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            },
          }}
        />
      </Tooltip>
    )
  }

  // sidebar
  const inner = (
    <Box
      sx={{
        mx: 1.5,
        mb: 1,
        px: sidebarOpen ? 1.5 : 0,
        py: 1,
        borderRadius: 2,
        border: `1px solid ${alpha(theme.palette.divider, 0.15)}`,
        bgcolor: alpha(theme.palette.primary.main, 0.04),
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        justifyContent: sidebarOpen ? 'flex-start' : 'center',
      }}
    >
      <BusinessIcon sx={{ fontSize: 20, color: 'primary.main', flexShrink: 0 }} />
      {sidebarOpen && (
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography
            variant="caption"
            sx={{
              display: 'block',
              color: 'text.secondary',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              fontSize: '0.65rem',
            }}
          >
            Organization
          </Typography>
          <Typography
            variant="body2"
            sx={{ fontWeight: 600, lineHeight: 1.25, wordBreak: 'break-word' }}
          >
            {primary}
          </Typography>
          {hint && hint !== primary && (
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontFamily: 'ui-monospace, monospace' }}>
              {hint.length > 36 ? `${hint.slice(0, 8)}…${hint.slice(-6)}` : hint}
            </Typography>
          )}
        </Box>
      )}
    </Box>
  )

  if (!sidebarOpen) {
    return (
      <Tooltip title={`${primary}${hint ? ` — ${hint}` : ''}`} placement="right" arrow>
        {inner}
      </Tooltip>
    )
  }

  return inner
}
