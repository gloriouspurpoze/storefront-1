import React from 'react'
import { Badge } from '../ui/badge'
import { tierBadgeVariant, type PartnerLoyaltyTier } from '../../lib/partnerLoyaltyScore'

export function PartnerLoyaltyBadge({
  tier,
  label,
  score,
  className,
}: {
  tier?: PartnerLoyaltyTier | null
  label?: string
  score?: number
  className?: string
}) {
  const t = tier ?? 'bronze'
  const display = label ?? t.charAt(0).toUpperCase() + t.slice(1)
  return (
    <Badge variant={tierBadgeVariant(t)} className={className}>
      {display}
      {typeof score === 'number' ? ` · ${score.toFixed(0)}` : ''}
    </Badge>
  )
}
