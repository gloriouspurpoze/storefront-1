import React, { useState, useEffect } from 'react'
import { Tag, Loader2 } from 'lucide-react'
import { OffersService } from '../../services/api/offers.service'
import { Card, CardContent } from '../ui/card'
import { Badge } from '../ui/badge'
import { cn } from '../../lib/utils'

interface Offer {
  id: string
  title: string
  description: string
  discount_type: 'percentage' | 'fixed'
  discount_value: number
  code: string
  applicable_to: string
}

interface AvailableOffersProps {
  type: 'booking' | 'order'
  onOfferSelect?: (offer: Offer) => void
}

export function AvailableOffers({ type, onOfferSelect }: AvailableOffersProps) {
  const [offers, setOffers] = useState<Offer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    void fetchOffers()
  }, [type])

  const fetchOffers = async () => {
    try {
      setLoading(true)
      const applicableTo = type === 'order' ? 'orders' : 'bookings'
      const response = (await OffersService.getActiveOffers({
        applicableTo,
      })) as unknown as { success?: boolean; data?: Offer[] }

      if (response && response.success) {
        setOffers(response.data || [])
      } else {
        setError('Failed to load offers')
      }
    } catch (err) {
      console.error('Error fetching offers:', err)
      setError('Failed to load offers')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error) {
    return (
      <div
        className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        role="alert"
      >
        {error}
      </div>
    )
  }

  if (offers.length === 0) {
    return (
      <div
        className="rounded-md border border-border bg-muted/50 px-3 py-2 text-sm text-muted-foreground"
        role="status"
      >
        No offers available at the moment. Check back later!
      </div>
    )
  }

  return (
    <div>
      <h3 className="mb-3 text-lg font-semibold">Available Offers</h3>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {offers.map((offer) => (
          <Card
            key={offer.id}
            className={cn(
              'h-full',
              onOfferSelect && 'cursor-pointer transition hover:-translate-y-0.5 hover:shadow-md',
            )}
            onClick={() => onOfferSelect && onOfferSelect(offer)}
          >
            <CardContent className="p-4">
              <div className="mb-2 flex items-start justify-between gap-2">
                <h4 className="text-base font-semibold leading-tight">{offer.title}</h4>
                <Badge className="shrink-0 gap-1">
                  <Tag className="h-3 w-3" />
                  {offer.discount_type === 'percentage'
                    ? `${offer.discount_value}% OFF`
                    : `₹${offer.discount_value} OFF`}
                </Badge>
              </div>
              <p className="mb-2 text-sm text-muted-foreground">{offer.description}</p>
              <Badge variant="outline" className="text-xs">
                Code: {offer.code}
              </Badge>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
