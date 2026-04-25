import React from 'react'
import { FolderTree, ShoppingBag, Wrench, ArrowRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent } from '../../components/ui/card'
import { cn } from '../../lib/utils'

const cards = [
  {
    id: 'products' as const,
    title: 'Product categories',
    description:
      'For your store catalog, listings, and inventory. Used when assigning products in E‑commerce and Bazaar.',
    to: '/categories/products',
    icon: ShoppingBag,
    accent: 'group-hover:border-primary',
  },
  {
    id: 'services' as const,
    title: 'Service categories',
    description: 'For platform and marketplace services, bookings, and what customers can book on your site.',
    to: '/categories/services',
    icon: Wrench,
    accent: 'group-hover:border-secondary',
  },
]

/**
 * Choose product vs service taxonomy — avoids mixing the two in one list.
 */
export function CategoryHub() {
  const navigate = useNavigate()

  return (
    <div className="flex-1 p-4 sm:p-6">
      <div className="mb-6">
        <div className="mb-1 flex items-center gap-2">
          <FolderTree className="h-8 w-8 text-muted-foreground" aria-hidden />
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Category management</h1>
        </div>
        <p className="max-w-2xl text-sm text-muted-foreground sm:text-base">
          Product categories and service categories are separate. Choose which catalog you are organizing — this keeps the
          storefront and service discovery clear for you and your team.
        </p>
      </div>

      <div className="mx-auto w-full max-w-3xl">
        <div className="grid gap-3 sm:grid-cols-2">
          {cards.map((card) => {
            const Icon = card.icon
            return (
              <button
                key={card.id}
                type="button"
                onClick={() => navigate(card.to)}
                className={cn(
                  'group rounded-xl border-2 border-border text-left transition-shadow hover:shadow-md',
                  card.accent,
                )}
              >
                <Card className="h-full border-0 bg-transparent shadow-none">
                  <CardContent className="p-4 sm:p-5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="mb-1 flex items-center gap-2">
                          <Icon className="h-7 w-7 shrink-0 text-primary" aria-hidden />
                          <h2 className="text-base font-bold sm:text-lg">{card.title}</h2>
                        </div>
                        <p className="text-sm text-muted-foreground">{card.description}</p>
                      </div>
                      <ArrowRight className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden />
                    </div>
                    <div
                      className={cn(
                        'mt-3 rounded-md border p-2 text-xs text-muted-foreground',
                        'bg-muted/50',
                      )}
                    >
                      {card.id === 'products'
                        ? 'Assign types “Product” or “Both (product & service)” here for store-related categories.'
                        : 'Assign types “Service” or “Both” for booking- and service-related groups.'}
                    </div>
                  </CardContent>
                </Card>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default CategoryHub
