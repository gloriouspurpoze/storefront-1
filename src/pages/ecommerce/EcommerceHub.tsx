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
  Alert,
} from '@mui/material'
import Grid from '@mui/material/GridLegacy'
import {
  Warehouse as WarehouseIcon,
  Inventory2 as InventoryIcon,
  AddCircleOutline as AddProductIcon,
  Category as CategoryIcon,
  ShoppingCart as OrdersIcon,
  LocalOffer as CouponIcon,
  Campaign as PromoIcon,
  Slideshow as SliderIcon,
  PermMedia as MediaIcon,
  Search as SeoIcon,
  ShoppingBag as ShoppingBagIcon,
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
 * Admin hub for physical/digital product commerce (catalog → merchandising → fulfillment).
 * Mirrors common SaaS patterns (Shopify / WooCommerce–style IA).
 */
export default function EcommerceHub() {
  const theme = useTheme()
  const { checkPermission } = usePermissions()

  const cards: HubCard[] = [
    {
      title: 'Inventory',
      description: 'On-hand stock, low-stock alerts, and quick quantity adjustments — operations view.',
      href: '/inventory',
      icon: WarehouseIcon,
      permission: 'view_products',
    },
    {
      title: 'Product catalog',
      description: 'SKUs, pricing, stock, images, and publish state — your single source of truth for the storefront.',
      href: '/products',
      icon: InventoryIcon,
      permission: 'view_products',
    },
    {
      title: 'Add product',
      description: 'Create a new product with variants, media, and SEO-friendly copy.',
      href: '/products/add',
      icon: AddProductIcon,
      permission: 'create_products',
    },
    {
      title: 'Categories & taxonomy',
      description: 'Collections and navigation for the shop; align with navigation menus where needed.',
      href: '/categories',
      icon: CategoryIcon,
      permission: 'view_categories',
    },
    {
      title: 'Orders',
      description: 'Order pipeline: paid, fulfilled, refunded — align with payments and invoices.',
      href: '/orders',
      icon: OrdersIcon,
      permission: 'view_orders',
    },
    {
      title: 'Coupons & codes',
      description: 'Percentage or fixed discounts; stack rules with your checkout policy.',
      href: '/coupons',
      icon: CouponIcon,
      permission: 'manage_coupons',
    },
    {
      title: 'Promotions',
      description: 'Campaign-style offers and timed promos on the storefront.',
      href: '/cms/promotions',
      icon: PromoIcon,
      permission: 'manage_system_settings',
    },
    {
      title: 'Hero & sliders',
      description: 'Homepage and category heroes featuring products or collections.',
      href: '/sliders',
      icon: SliderIcon,
      permission: 'view_settings',
    },
    {
      title: 'Media library',
      description: 'Central assets for product shots and lifestyle imagery.',
      href: '/cms/media',
      icon: MediaIcon,
      permission: 'manage_system_settings',
    },
    {
      title: 'SEO for store',
      description: 'Meta templates and discoverability for product and category URLs.',
      href: '/cms/seo',
      icon: SeoIcon,
      permission: 'manage_system_settings',
    },
  ]

  const visible = cards.filter((c) => checkPermission(c.permission))

  return (
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
      <PageHeader
        title="E-commerce"
        subtitle="Run your online store: catalog, merchandising, and order fulfillment. Each card opens the right tool; access follows your permissions."
        icon={<ShoppingBagIcon color="primary" sx={{ fontSize: 40 }} />}
      />

      <Alert severity="info" sx={{ mt: 2, maxWidth: 900 }}>
        <strong>Typical flow:</strong> set up categories → add products &amp; inventory → merchandising (sliders, promos) → monitor orders and
        payments. Service bookings stay under <strong>Marketplace</strong> and <strong>Bookings</strong>.
      </Alert>

      {visible.length === 0 ? (
        <Typography color="text.secondary" sx={{ mt: 2 }}>
          No e-commerce permissions on this account. Ask an admin for product, order, or store settings access.
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
