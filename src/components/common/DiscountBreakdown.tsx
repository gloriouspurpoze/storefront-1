/**
 * Discount Breakdown Component
 * Shows all applied discounts and savings
 */

import React from 'react'
import { Tag, Gift, Users, PiggyBank } from 'lucide-react'
import { formatCurrency } from '../../lib/utils'
import { Card, CardContent } from '../ui/card'
import { Badge } from '../ui/badge'
import { Separator } from '../ui/separator'

export interface DiscountBreakdownProps {
  subtotal: number
  offer?: {
    amount: number
    name?: string
  }
  coupon?: {
    amount: number
    code?: string
  }
  referral?: {
    amount: number
    code?: string
  }
  shipping?: number
  tax?: number
  finalTotal: number
}

export function DiscountBreakdown({
  subtotal,
  offer,
  coupon,
  referral,
  shipping = 0,
  tax = 0,
  finalTotal,
}: DiscountBreakdownProps) {
  const totalDiscount = (offer?.amount || 0) + (coupon?.amount || 0) + (referral?.amount || 0)
  const totalSavings = totalDiscount

  return (
    <Card className="shadow-sm">
      <CardContent className="pt-6">
        <h3 className="mb-4 text-lg font-semibold">Price Breakdown</h3>

        <div className="mb-2 flex justify-between text-sm">
          <span>Subtotal:</span>
          <span className="font-medium">{formatCurrency(subtotal)}</span>
        </div>

        {totalDiscount > 0 && (
          <>
            <Separator className="my-4" />
            {/* DESIGN.md: storm-deep is the neutral positive/status accent */}
            <p className="mb-2 text-sm font-semibold text-storm-deep">Discounts Applied</p>

            {offer && offer.amount > 0 && (
              <div className="mb-2 flex items-center justify-between text-sm">
                <div className="flex min-w-0 items-center gap-2">
                  <Tag className="h-4 w-4 shrink-0 text-primary" aria-hidden />
                  <span className="truncate">{offer.name || 'Special Offer'}</span>
                  <Badge variant="outline" className="shrink-0 text-xs">
                    Auto-applied
                  </Badge>
                </div>
                <span className="shrink-0 font-semibold text-storm-deep">-{formatCurrency(offer.amount)}</span>
              </div>
            )}

            {coupon && coupon.amount > 0 && (
              <div className="mb-2 flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Gift className="h-4 w-4 shrink-0 text-storm-deep" aria-hidden />
                  <span>Coupon: {coupon.code}</span>
                </div>
                <span className="font-semibold text-storm-deep">-{formatCurrency(coupon.amount)}</span>
              </div>
            )}

            {referral && referral.amount > 0 && (
              <div className="mb-2 flex items-center justify-between text-sm">
                <div className="flex min-w-0 items-center gap-2">
                  <Users className="h-4 w-4 shrink-0 text-primary" aria-hidden />
                  <span>Referral Bonus</span>
                  {referral.code && (
                    <Badge variant="outline" className="text-xs">
                      {referral.code}
                    </Badge>
                  )}
                </div>
                <span className="shrink-0 font-semibold text-storm-deep">
                  -{formatCurrency(referral.amount)}
                </span>
              </div>
            )}
          </>
        )}

        <Separator className="my-4" />

        {shipping > 0 && (
          <div className="mb-2 flex justify-between text-sm">
            <span>Shipping:</span>
            <span>{formatCurrency(shipping)}</span>
          </div>
        )}

        {tax > 0 && (
          <div className="mb-2 flex justify-between text-sm">
            <span>Tax (10%):</span>
            <span>{formatCurrency(tax)}</span>
          </div>
        )}

        <Separator className="my-4" />

        <div className="mb-2 flex justify-between">
          <span className="text-lg font-bold">Total:</span>
          <span className="text-lg font-bold text-primary">{formatCurrency(finalTotal)}</span>
        </div>

        {totalSavings > 0 && (
          <div
            // DESIGN.md: storm accent for neutral-positive callout (savings)
            className="mt-3 flex gap-2 rounded-md border border-storm-deep/30 bg-storm-mist/20 p-3 text-sm text-storm-deep"
            role="status"
          >
            <PiggyBank className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
            <div className="space-y-1">
              <p className="font-semibold">You saved {formatCurrency(totalSavings)}!</p>
              {offer && offer.amount > 0 && (
                <p className="text-xs opacity-90">
                  • {formatCurrency(offer.amount)} from {offer.name || 'offer'}
                </p>
              )}
              {coupon && coupon.amount > 0 && (
                <p className="text-xs opacity-90">
                  • {formatCurrency(coupon.amount)} from coupon {coupon.code}
                </p>
              )}
              {referral && referral.amount > 0 && (
                <p className="text-xs opacity-90">• {formatCurrency(referral.amount)} from referral bonus</p>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
