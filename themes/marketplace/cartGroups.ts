import type { CartLineBase } from '@/theme-kit/cart'

export interface MarketplaceCartLine extends CartLineBase {
  slug?: string
  sellerSlug: string
  sellerName: string
}

export interface CartSellerGroup {
  sellerSlug: string
  sellerName: string
  lines: MarketplaceCartLine[]
  subtotal: number
}

/** Lines grouped by seller, in first-added order — each group ships as its own parcel. */
export function groupLinesBySeller(lines: MarketplaceCartLine[]): CartSellerGroup[] {
  const groups = new Map<string, CartSellerGroup>()
  for (const line of lines) {
    const key = line.sellerSlug || 'unknown'
    const g = groups.get(key) ?? { sellerSlug: key, sellerName: line.sellerName, lines: [], subtotal: 0 }
    g.lines.push(line)
    g.subtotal += line.price * line.quantity
    groups.set(key, g)
  }
  return [...groups.values()]
}
