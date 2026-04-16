import React from 'react'
import { Link as RouterLink } from 'react-router-dom'
import {
  Box,
  Card,
  CardActionArea,
  CardContent,
  Typography,
  useTheme,
  alpha,
} from '@mui/material'
import Grid from '@mui/material/GridLegacy'
import {
  Category as CategoryIcon,
  Home as HomeIcon,
  People as PeopleIcon,
  AssignmentInd as AssignmentIndIcon,
  Event as CalendarIcon,
  CreditCard as CreditCardIcon,
  LocalOffer as CouponIcon,
  Campaign as CampaignIcon,
  Storefront as StorefrontIcon,
} from '@mui/icons-material'
import { PageHeader } from '../../components/common/PageHeader'
import { usePermissions } from '../../hooks/usePermissions'
import type { Permission } from '../../types/rbac.types'

type HubCard = {
  title: string
  description: string
  href: string
  icon: React.ElementType
  permission: Permission
}

/**
 * Admin hub for the service marketplace: catalog, professionals, and operations.
 */
export default function Marketplace() {
  const theme = useTheme()
  const { checkPermission } = usePermissions()

  const cards: HubCard[] = [
    {
      title: 'Platform services',
      description: 'Services customers book — pricing, categories, featured, and availability.',
      href: '/platform-services',
      icon: HomeIcon,
      permission: 'view_services',
    },
    {
      title: 'Categories',
      description: 'Organize services and discovery paths for your marketplace.',
      href: '/categories',
      icon: CategoryIcon,
      permission: 'view_categories',
    },
    {
      title: 'Professionals',
      description: 'Onboard and manage professionals listed on the marketplace.',
      href: '/professionals',
      icon: PeopleIcon,
      permission: 'view_providers',
    },
    {
      title: 'Provider applications',
      description: 'Review new applications before they go live.',
      href: '/provider-applications',
      icon: AssignmentIndIcon,
      permission: 'view_providers',
    },
    {
      title: 'Bookings',
      description: 'Jobs and appointments across the marketplace.',
      href: '/bookings',
      icon: CalendarIcon,
      permission: 'view_bookings',
    },
    {
      title: 'Payments',
      description: 'Charges, refunds, and payment health.',
      href: '/payments',
      icon: CreditCardIcon,
      permission: 'view_payments',
    },
    {
      title: 'Coupons',
      description: 'Discounts and codes that apply to marketplace checkout.',
      href: '/coupons',
      icon: CouponIcon,
      permission: 'manage_coupons',
    },
    {
      title: 'Industry service pages',
      description: 'SEO landing pages tied to categories and services.',
      href: '/cms/category-marketing',
      icon: CampaignIcon,
      permission: 'manage_system_settings',
    },
  ]

  const visible = cards.filter((c) => checkPermission(c.permission))

  return (
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
      <PageHeader
        title="Marketplace"
        subtitle="Run your service marketplace from one place — catalog, supply (professionals), and demand (bookings & payments). Links respect your role permissions."
        icon={<StorefrontIcon color="primary" sx={{ fontSize: 40 }} />}
      />

      {visible.length === 0 ? (
        <Typography color="text.secondary" sx={{ mt: 2 }}>
          You don&apos;t have access to marketplace modules yet. Ask an admin for catalog, bookings, or payments permissions.
        </Typography>
      ) : (
        <Grid container spacing={2} sx={{ mt: 2 }}>
          {visible.map((card) => {
            const Icon = card.icon
            return (
              <Grid item xs={12} sm={6} md={4} key={card.href}>
                <Card
                  elevation={0}
                  sx={{
                    height: '100%',
                    border: `1px solid ${alpha(theme.palette.divider, 0.9)}`,
                    borderRadius: 2,
                    transition: 'box-shadow 0.2s, transform 0.15s',
                    '&:hover': {
                      boxShadow: theme.shadows[4],
                      transform: 'translateY(-2px)',
                    },
                  }}
                >
                  <CardActionArea component={RouterLink} to={card.href} sx={{ height: '100%', alignItems: 'stretch' }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                        <Box
                          sx={{
                            p: 1,
                            borderRadius: 1.5,
                            bgcolor: alpha(theme.palette.primary.main, 0.08),
                            color: 'primary.main',
                          }}
                        >
                          <Icon />
                        </Box>
                        <Box>
                          <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.05rem', mb: 0.5 }}>
                            {card.title}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.5 }}>
                            {card.description}
                          </Typography>
                        </Box>
                      </Box>
                    </CardContent>
                  </CardActionArea>
                </Card>
              </Grid>
            )
          })}
        </Grid>
      )}
    </Box>
  )
}
