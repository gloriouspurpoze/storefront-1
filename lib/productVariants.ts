import type { PublicProduct, PublicProductVariant } from '@/lib/storefront-api'

export type VariantCarrier = Pick<PublicProduct, 'price' | 'originalPrice' | 'inStock' | 'hasVariants' | 'variants'>

export function productHasVariants(item: VariantCarrier): boolean {
  return Boolean(item.hasVariants && item.variants && item.variants.length > 0)
}

export function getAvailableVariants(item: VariantCarrier): PublicProductVariant[] {
  if (!productHasVariants(item)) return []
  return item.variants!.filter((v) => v.inStock !== false)
}

export function getDefaultVariant(item: VariantCarrier): PublicProductVariant | null {
  const available = getAvailableVariants(item)
  if (available.length > 0) return available[0]
  if (productHasVariants(item)) return item.variants![0] ?? null
  return null
}

export function findVariant(item: VariantCarrier, variantId?: string | null): PublicProductVariant | null {
  if (!variantId || !productHasVariants(item)) return null
  return item.variants!.find((v) => v.id === variantId) ?? null
}

export function getEffectivePrice(item: VariantCarrier, variantId?: string | null): number {
  const variant = findVariant(item, variantId)
  if (variant) return variant.price
  return item.price
}

export function getEffectiveOriginalPrice(item: VariantCarrier, variantId?: string | null): number | undefined {
  const variant = findVariant(item, variantId)
  if (variant?.originalPrice && variant.originalPrice > variant.price) return variant.originalPrice
  if (item.originalPrice && item.originalPrice > item.price) return item.originalPrice
  return undefined
}

export function isVariantInStock(item: VariantCarrier, variantId?: string | null): boolean {
  if (productHasVariants(item)) {
    const variant = findVariant(item, variantId)
    if (!variant) return getAvailableVariants(item).length > 0
    return variant.inStock !== false
  }
  return item.inStock !== false
}

export function cartLineKey(productId: string, variantId?: string): string {
  return variantId ? `${productId}:${variantId}` : productId
}

export function formatListPrice(item: VariantCarrier, format: (amount: number) => string): string {
  if (!productHasVariants(item)) return format(item.price)
  const prices = item.variants!.map((v) => v.price)
  const min = Math.min(...prices)
  const max = Math.max(...prices)
  if (min === max) return format(min)
  return `From ${format(min)}`
}
