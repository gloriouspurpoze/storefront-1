'use client'

import { createCartContext, cartLineProductName, type CartLineBase } from '@/theme-kit/cart'
import type { PublicProduct } from '@/lib/storefront-api'
import type { MarketplaceListingCard } from '@/lib/marketplace-api'
import type { MarketplaceCartLine } from './cartGroups'

/**
 * Marketplace cart item. `id` is the MarketplaceListing id — the key the split checkout
 * (`/public/marketplace/checkout/*`) prices and routes to a seller. Products with options carry
 * their variants; the line stores the chosen `variantId` and the server re-prices it.
 */
export interface MarketplaceCartItem {
  id: string
  name: string
  price: number
  originalPrice?: number
  currency: string
  imageUrl?: string
  inStock: boolean
  hasVariants?: boolean
  variants?: PublicProduct['variants']
  slug?: string
  sellerSlug: string
  sellerName: string
}


const { CartProvider, useCart } = createCartContext<MarketplaceCartItem, MarketplaceCartLine>({
  storageKeyPrefix: 'sf-marketplace-cart',
  toLineExtras: (item) => ({ slug: item.slug, sellerSlug: item.sellerSlug, sellerName: item.sellerName }),
})

export function cartItemFromListing(card: MarketplaceListingCard): MarketplaceCartItem {
  return {
    id: card.listingId,
    name: card.title,
    price: card.priceInr,
    originalPrice: card.compareAtPriceInr,
    currency: 'INR',
    imageUrl: card.imageUrl,
    inStock: card.inStock,
    slug: card.productSlug ?? undefined,
    sellerSlug: card.seller.slug,
    sellerName: card.seller.name,
  }
}

/** PDP → cart. Null when the product is not listed on the marketplace (no listing / seller). */
export function cartItemFromProduct(
  product: PublicProduct & { listingId?: string; sellerSlug?: string; sellerName?: string },
): MarketplaceCartItem | null {
  if (!product.listingId || !product.sellerSlug) return null
  return {
    id: product.listingId,
    name: product.name,
    price: product.price,
    originalPrice: product.originalPrice,
    currency: product.currency || 'INR',
    imageUrl: product.imageUrl,
    inStock: product.inStock,
    hasVariants: product.hasVariants,
    variants: product.variants,
    slug: product.slug,
    sellerSlug: product.sellerSlug,
    sellerName: product.sellerName ?? 'Seller',
  }
}

export { CartProvider, useCart, cartLineProductName }
export { groupLinesBySeller, type CartSellerGroup, type MarketplaceCartLine } from './cartGroups'
export { formatMoney } from '@/lib/format'
