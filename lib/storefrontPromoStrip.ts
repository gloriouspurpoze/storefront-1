import type { StorefrontConfig } from '@/lib/storefront-api'
import { isOfferMarqueeEnabled } from '@/lib/storefrontPaymentMethods'

/** Admin-driven promo lines from shipping policy (when offer marquee flag is on). */
export function getStorefrontPromoStripLines(config: StorefrontConfig | null): string[] {
  if (!isOfferMarqueeEnabled(config)) return []

  const lines: string[] = []
  const policy = config?.shippingPolicy

  const summary = policy?.summary?.trim()
  if (summary) lines.push(summary)

  const processing = policy?.processingNote?.trim()
  if (processing && processing !== summary) lines.push(processing)

  for (const zone of policy?.zones ?? []) {
    const label = zone.label?.trim()
    const details = zone.details?.trim()
    const fee = zone.fee?.trim()
    if (!label && !details) continue
    const line = [label, details, fee ? `Fee: ${fee}` : null].filter(Boolean).join(' — ')
    if (line && !lines.includes(line)) lines.push(line)
  }

  return lines
}
