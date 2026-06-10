import { slugify } from './slugify'
import type { ImageFile } from '../components/forms/ImageUploadField'
import type { CreateProductRequest, ProductImageEmbedRequest } from '../types'

export type ProductFormLike = {
  categoryId: string
  name: string
  description: string
  shortDescription: string
  price: number
  originalPrice: number
  sku: string
  stockQuantity: number
  lowStockThreshold: number
  vendorId: string
  images: ImageFile[]
  specifications: Array<{ key: string; value: string; group?: string }>
  isActive: boolean
  isFeatured: boolean
  isNew?: boolean
  weight: number
  dimensions: { length: number; width: number; height: number; unit: string }
  tags: string[]
  slug: string
  seoTitle: string
  seoDescription: string
  seoKeywords: string[]
}

function isHttpUrl(s: string): boolean {
  try {
    const u = new URL(s)
    return u.protocol === 'http:' || u.protocol === 'https:'
  } catch {
    return false
  }
}

export function buildProductImagePayload(
  images: ImageFile[],
  productName: string,
): ProductImageEmbedRequest[] {
  const name = productName.trim() || 'Product'
  return images
    .filter((img) => img?.url && isHttpUrl(img.url.trim()))
    .map((img, index) => ({
      url: img.url.trim(),
      alt: (img.alt || name).trim().slice(0, 500),
      is_primary: Boolean(img.isPrimary),
      order: typeof img.order === 'number' ? img.order : index,
      ...(img.publicId ? { public_id: img.publicId } : {}),
    }))
}

/** Ensure exactly one primary when multiple images exist. */
export function normalizePrimaryFlag(embeds: ProductImageEmbedRequest[]): ProductImageEmbedRequest[] {
  if (embeds.length === 0) return embeds
  const anyPrimary = embeds.some((e) => e.is_primary)
  if (!anyPrimary) {
    return embeds.map((e, i) => (i === 0 ? { ...e, is_primary: true } : e))
  }
  let seen = false
  return embeds.map((e) => {
    if (e.is_primary) {
      if (seen) return { ...e, is_primary: false }
      seen = true
    }
    return e
  })
}

export function resolveProductSlug(formSlug: string, productName: string): string {
  const fromField = formSlug.trim()
  if (fromField) return fromField
  return slugify(productName)
}

export function buildProductCreateBody(data: ProductFormLike): CreateProductRequest {
  const dimUnit = data.dimensions.unit === 'cm' ? 'cm' : 'inch'
  const rawEmbeds = normalizePrimaryFlag(buildProductImagePayload(data.images, data.name))
  const slug = resolveProductSlug(data.slug, data.name)

  const body: CreateProductRequest = {
    category_id: data.categoryId.toString(),
    name: data.name.trim(),
    description: data.description,
    short_description: data.shortDescription.trim() || undefined,
    price: data.price,
    original_price: data.originalPrice || undefined,
    sku: data.sku.trim(),
    stock_quantity: data.stockQuantity,
    low_stock_threshold: data.lowStockThreshold,
    images: rawEmbeds,
    specifications: data.specifications.reduce((acc, spec) => {
      if (spec.key?.trim() && spec.value?.trim()) {
        acc[spec.key.trim()] = spec.value.trim()
      }
      return acc
    }, {} as Record<string, string>),
    is_active: data.isActive,
    status: 'published' as const,
    is_featured: data.isFeatured,
    is_new: data.isNew === true ? true : undefined,
    weight: data.weight > 0 ? data.weight : undefined,
    dimensions:
      data.dimensions.length > 0 || data.dimensions.width > 0 || data.dimensions.height > 0
        ? {
            length: data.dimensions.length,
            width: data.dimensions.width,
            height: data.dimensions.height,
            unit: dimUnit,
          }
        : undefined,
    tags: data.tags?.length ? data.tags : undefined,
    vendor_id: data.vendorId.trim() || undefined,
    slug,
    seo_title: data.seoTitle.trim() || undefined,
    seo_description: data.seoDescription.trim() || undefined,
    seo_keywords: data.seoKeywords?.length ? data.seoKeywords : undefined,
  }

  return Object.fromEntries(
    Object.entries(body).filter(([, v]) => v !== undefined && v !== null && v !== ''),
  ) as CreateProductRequest
}

export function buildProductDraftBody(data: ProductFormLike): CreateProductRequest {
  const draftData: ProductFormLike = {
    ...data,
    name: data.name.trim() || 'Draft product',
    sku: data.sku.trim() || `DRAFT-${Date.now()}`,
  }
  const base = buildProductCreateBody(draftData)
  return {
    ...base,
    is_active: false,
    status: 'draft' as const,
    is_featured: false,
    is_new: undefined,
  }
}

/** Map API / Mongoose validation messages to form field keys. */
export function mapProductApiErrorToFormFields(message: string): Partial<Record<string, string>> {
  const out: Record<string, string> = {}
  const m = String(message || '')
  if (/slug/i.test(m) && /required/i.test(m)) {
    out.slug = 'URL slug is required. Check the product name or enter a slug on Basic Information.'
  }
  if (/images/i.test(m) && (/cast|embedded|ObjectParameterError|invalid/i.test(m))) {
    out.images =
      'Images must be saved as structured uploads. Remove invalid entries and upload again, or pick from Cloudinary.'
  }
  if (/category/i.test(m) && /required/i.test(m)) {
    out.categoryId = 'Category is required.'
  }
  if (/vendor/i.test(m) && /required/i.test(m)) {
    out.vendorId = 'Vendor is required.'
  }
  return out
}

/** Convert catalog/API image shapes (strings or embeds) into the POST/PUT embed payload. */
export function toProductImageEmbedsForApi(raw: unknown, productName: string): ProductImageEmbedRequest[] {
  const files = normalizeProductImagesFromApi(raw, productName)
  return normalizePrimaryFlag(buildProductImagePayload(files, productName))
}

export function normalizeProductImagesFromApi(
  raw: unknown,
  fallbackName: string,
): ImageFile[] {
  if (!Array.isArray(raw)) return []
  return raw
    .map((img: unknown, i: number) => {
      const o = img as Record<string, unknown>
      const url =
        typeof img === 'string'
          ? img
          : String(o?.url ?? o?.secure_url ?? (typeof o?.src === 'string' ? o.src : '') ?? '')
      if (!url || !/^https?:\/\//i.test(url)) return null
      return {
        id: String(o?.id ?? o?.public_id ?? o?.publicId ?? `loaded-${i}`),
        url,
        alt: String(o?.alt ?? (fallbackName || 'Product')),
        isPrimary: Boolean(o?.is_primary ?? o?.isPrimary ?? i === 0),
        order: typeof o?.order === 'number' ? o.order : i,
        publicId: typeof o?.public_id === 'string' ? o.public_id : typeof o?.publicId === 'string' ? o.publicId : undefined,
        fromLibrary: true,
      } satisfies ImageFile
    })
    .filter(Boolean) as ImageFile[]
}
