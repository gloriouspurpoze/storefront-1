import type { Product } from '../types'

export function getPrimaryProductImageUrl(
  images: Product['images'] | undefined | null,
): string | undefined {
  if (!images?.length) return undefined
  const first = images[0]
  if (typeof first === 'string') return first
  const o = first as { url?: string; secure_url?: string }
  return o?.url || o?.secure_url || undefined
}
