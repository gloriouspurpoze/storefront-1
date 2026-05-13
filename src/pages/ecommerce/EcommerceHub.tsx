import React from 'react'
import { Link } from 'react-router-dom'
import {
  Warehouse,
  Package,
  CirclePlus,
  LayoutGrid,
  ShoppingCart,
  Tag,
  Megaphone,
  GalleryHorizontal,
  Images,
  Search,
  ShoppingBag,
} from 'lucide-react'
import { Card, CardContent } from '../../components/ui/card'
import { PageHeader } from '../../components/common/PageHeader'
import { usePermissions } from '../../hooks/usePermissions'
import type { Permission } from '../../types/rbac.types'
import { cn } from '../../lib/utils'

type HubCard = {
  title: string
  description: string
  href: string
  icon: React.ElementType<{ className?: string }>
  /** One or more permissions — card is shown if the user has any */
  permission: Permission | Permission[]
}

/**
 * Admin hub for physical/digital product commerce (catalog → merchandising → fulfillment).
 * Mirrors common SaaS patterns (Shopify / WooCommerce–style IA).
 */
export default function EcommerceHub() {
  const { checkPermission } = usePermissions()

  const cards: HubCard[] = [
    {
      title: 'Inventory',
      description: 'On-hand stock, low-stock alerts, and quick quantity adjustments — operations view.',
      href: '/inventory',
      icon: Warehouse,
      permission: 'view_products',
    },
    {
      title: 'Product catalog',
      description: 'SKUs, pricing, stock, images, and publish state — your single source of truth for the storefront.',
      href: '/products',
      icon: Package,
      permission: 'view_products',
    },
    {
      title: 'Add product',
      description: 'Create a new product with variants, media, and SEO-friendly copy.',
      href: '/products/add',
      icon: CirclePlus,
      permission: 'create_products',
    },
    {
      title: 'Product categories',
      description: 'Store taxonomy, collections, and how products are grouped in the shop.',
      href: '/categories/products',
      icon: LayoutGrid,
      permission: 'view_categories',
    },
    {
      title: 'Orders',
      description: 'Order pipeline: paid, fulfilled, refunded — align with payments and invoices.',
      href: '/orders',
      icon: ShoppingCart,
      permission: 'view_orders',
    },
    {
      title: 'Coupons & codes',
      description: 'Percentage or fixed discounts; stack rules with your checkout policy.',
      href: '/coupons',
      icon: Tag,
      permission: 'manage_coupons',
    },
    {
      title: 'Promotions',
      description: 'Campaign-style offers and timed promos on the storefront.',
      href: '/cms/promotions',
      icon: Megaphone,
      permission: 'manage_system_settings',
    },
    {
      title: 'Sliders & site banners',
      description: 'Carousels (sliders API) and CMS hero / pop-up banners — one hub, two tabs.',
      href: '/sliders',
      icon: GalleryHorizontal,
      permission: ['view_settings', 'manage_system_settings'],
    },
    {
      title: 'Media library',
      description: 'Central assets for product shots and lifestyle imagery.',
      href: '/cms/media',
      icon: Images,
      permission: 'manage_system_settings',
    },
    {
      title: 'SEO for store',
      description: 'Meta templates and discoverability for product and category URLs.',
      href: '/cms/seo',
      icon: Search,
      permission: 'manage_system_settings',
    },
  ]

  const visible = cards.filter((c) => {
    const perms = Array.isArray(c.permission) ? c.permission : [c.permission]
    return perms.some((p) => checkPermission(p))
  })

  return (
    <div className="p-4 sm:p-6">
      <PageHeader
        title="E-commerce"
        subtitle="Run your online store: catalog, merchandising, and order fulfillment. Each card opens the right tool; access follows your permissions."
        icon={<ShoppingBag className="h-10 w-10 text-primary" aria-hidden />}
      />

      <div className="mt-4 max-w-3xl rounded-md border border-sky-200 bg-sky-50/80 p-4 text-sm dark:border-sky-900 dark:bg-sky-950/40">
        <p>
          <strong>Typical flow:</strong> set up categories → add products and inventory → merchandising (sliders, promos) → monitor orders
          and payments. Service bookings stay under <strong>Marketplace</strong> and <strong>Bookings</strong>.
        </p>
      </div>

      {visible.length === 0 ? (
        <p className="mt-2 text-muted-foreground">
          No e-commerce permissions on this account. Ask an admin for product, order, or store settings access.
        </p>
      ) : (
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
          {visible.map((card) => {
            const Icon = card.icon
            return (
              <Link key={card.href} to={card.href} className="block h-full outline-none">
                <Card
                  className={cn(
                    'h-full border transition-all duration-200',
                    'hover:-translate-y-0.5 hover:shadow-md'
                  )}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start gap-3">
                      <div className="flex shrink-0 rounded-md bg-primary/10 p-2 text-primary">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <h2 className="mb-0.5 text-base font-bold leading-tight">{card.title}</h2>
                        <p className="text-sm leading-relaxed text-muted-foreground">{card.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
