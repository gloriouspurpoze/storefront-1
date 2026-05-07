import React from 'react'
import { Link } from 'react-router-dom'
import {
  Home,
  LayoutGrid,
  Users,
  IdCard,
  Calendar,
  CreditCard,
  Tag,
  Megaphone,
  Store,
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
  permission: Permission
}

/**
 * Admin hub for the service marketplace: catalog, professionals, and operations.
 */
export default function Marketplace() {
  const { checkPermission } = usePermissions()

  const cards: HubCard[] = [
    {
      title: 'Platform services',
      description: 'Services customers book — pricing, categories, featured, and availability.',
      href: '/platform-services',
      icon: Home,
      permission: 'view_services',
    },
    {
      title: 'Service categories',
      description: 'Organize services, discovery, and what customers can book on the marketplace.',
      href: '/categories/services',
      icon: LayoutGrid,
      permission: 'view_categories',
    },
    {
      title: 'Professionals',
      description: 'Fleet list, filters, and per-professional command center (bookings, reviews, coverage, moderation).',
      href: '/professionals',
      icon: Users,
      permission: 'view_providers',
    },
    {
      title: 'Provider applications',
      description: 'Review new applications before they go live.',
      href: '/provider-applications',
      icon: IdCard,
      permission: 'view_providers',
    },
    {
      title: 'Bookings',
      description: 'Jobs and appointments across the marketplace.',
      href: '/bookings',
      icon: Calendar,
      permission: 'view_bookings',
    },
    {
      title: 'Payments',
      description: 'Charges, refunds, and payment health.',
      href: '/payments',
      icon: CreditCard,
      permission: 'view_payments',
    },
    {
      title: 'Coupons',
      description: 'Discounts and codes that apply to marketplace checkout.',
      href: '/coupons',
      icon: Tag,
      permission: 'manage_coupons',
    },
    {
      title: 'Industry service pages',
      description: 'Landing SEO, rate card, and cross-links — one hub per catalog vertical.',
      href: '/cms/category-marketing',
      icon: Megaphone,
      permission: 'manage_system_settings',
    },
  ]

  const visible = cards.filter((c) => checkPermission(c.permission))

  return (
    <div className="p-4 sm:p-6">
      <PageHeader
        title="Marketplace"
        subtitle="Run your service marketplace from one place — catalog, supply (professionals), and demand (bookings & payments). Links respect your role permissions."
        icon={<Store className="h-10 w-10 text-primary" aria-hidden />}
      />

      {visible.length === 0 ? (
        <p className="mt-2 text-muted-foreground">
          You don&apos;t have access to marketplace modules yet. Ask an admin for catalog, bookings, or payments permissions.
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
