import type { ApiClient } from '../types'
import { unwrapApiData, unwrapList } from '../unwrap'

export interface ProductVendor {
  id: string
  name: string
  legalName?: string
}

export interface ProductImageEmbed {
  url: string
  alt?: string
  is_primary?: boolean
  order?: number
}

export interface CreateProductPayload {
  category_id: string
  name: string
  description: string
  short_description?: string
  slug: string
  price: number
  original_price?: number
  sku: string
  stock_quantity: number
  low_stock_threshold?: number
  images?: ProductImageEmbed[]
  is_active?: boolean
  is_featured?: boolean
  is_new?: boolean
  tags?: string[]
  vendor_id?: string
}

export interface CreatedProduct {
  id: string
  name: string
  slug?: string
}

export interface ProductListItem {
  id: string
  name: string
  sku?: string
  price: number
  originalPrice?: number
  stockQuantity: number
  isActive: boolean
  categoryName?: string
  vendorName?: string
  imageUrl?: string
}

export interface ProductListResult {
  items: ProductListItem[]
  pagination: { page: number; limit: number; total: number; totalPages: number }
}

export interface ProductListQuery {
  page?: number
  limit?: number
  search?: string
  category_id?: string
  is_active?: boolean
  is_featured?: boolean
  sort_by?: 'name' | 'price' | 'created_at' | 'rating'
  sort_order?: 'asc' | 'desc'
}

export interface ProductDetail {
  id: string
  name: string
  description: string
  short_description?: string
  category_id?: string
  vendor_id?: string
  slug?: string
  price: number
  original_price?: number
  sku?: string
  stock_quantity: number
  low_stock_threshold?: number
  imageUrl?: string
  is_active: boolean
}

export type UpdateProductPayload = Partial<CreateProductPayload> & { is_active?: boolean }

function mapVendor(raw: Record<string, unknown>): ProductVendor {
  return {
    id: String(raw.id ?? raw._id ?? ''),
    name: String(raw.name ?? raw.businessName ?? raw.legal_name ?? 'Vendor'),
    legalName: (raw.legal_name ?? raw.legalName) as string | undefined,
  }
}

function mapProduct(raw: Record<string, unknown>): CreatedProduct {
  return {
    id: String(raw.id ?? raw._id ?? ''),
    name: String(raw.name ?? 'Product'),
    slug: raw.slug as string | undefined,
  }
}

function compact(body: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(body).filter(([, v]) => v !== undefined && v !== null && v !== ''),
  )
}

/** Resolve a usable image URL from the mixed `images` shape (string | embed). */
function firstImageUrl(images: unknown): string | undefined {
  if (!Array.isArray(images) || images.length === 0) return undefined
  const primary =
    images.find((i) => i && typeof i === 'object' && (i as { is_primary?: boolean }).is_primary) ??
    images[0]
  if (typeof primary === 'string') return primary
  if (primary && typeof primary === 'object') {
    const o = primary as Record<string, unknown>
    return (o.url ?? o.secure_url) as string | undefined
  }
  return undefined
}

function mapProductListItem(p: Record<string, unknown>): ProductListItem {
  const category = p.category as { name?: string } | undefined
  const provider = p.provider as { businessName?: string } | undefined
  return {
    id: String(p.id ?? p._id ?? ''),
    name: String(p.name ?? 'Product'),
    sku: p.sku as string | undefined,
    price: p.price != null ? Number(p.price) : 0,
    originalPrice: p.original_price != null ? Number(p.original_price) : undefined,
    stockQuantity: Number(p.stock_quantity ?? p.stockQuantity ?? 0),
    isActive: p.is_active != null ? Boolean(p.is_active) : p.status !== 'inactive',
    categoryName: category?.name,
    vendorName: provider?.businessName,
    imageUrl: firstImageUrl(p.images),
  }
}

export function createProductsService(api: ApiClient) {
  return {
    /** Active finance vendors for catalog product forms (`GET /products/vendors`). */
    async listVendors(): Promise<ProductVendor[]> {
      const res = await api.get<unknown>('/products/vendors')
      const data = unwrapApiData<unknown>(res.data ?? res)
      const rows = Array.isArray(data)
        ? (data as Record<string, unknown>[])
        : unwrapList<Record<string, unknown>>(data, 'vendors')
      return rows.map(mapVendor).filter((v) => v.id)
    },

    /**
     * Creates a product. Pass `draft` to hit `/products/draft` (relaxed
     * validation) instead of publishing immediately.
     */
    async createProduct(
      payload: CreateProductPayload,
      options: { draft?: boolean } = {},
    ): Promise<CreatedProduct> {
      const body = compact({
        category_id: payload.category_id,
        name: payload.name.trim(),
        description: payload.description,
        short_description: payload.short_description?.trim(),
        slug: payload.slug,
        price: payload.price,
        original_price: payload.original_price,
        sku: payload.sku.trim(),
        stock_quantity: payload.stock_quantity,
        low_stock_threshold: payload.low_stock_threshold,
        images: payload.images?.length ? payload.images : undefined,
        is_active: payload.is_active,
        is_featured: payload.is_featured,
        is_new: payload.is_new,
        tags: payload.tags?.length ? payload.tags : undefined,
        vendor_id: payload.vendor_id,
      })
      const endpoint = options.draft ? '/products/draft' : '/products'
      const res = await api.post<unknown>(endpoint, body)
      return mapProduct(unwrapApiData<Record<string, unknown>>(res.data ?? res))
    },

    /** Admin list with category/search/active filters + pagination. */
    async getProducts(query: ProductListQuery = {}): Promise<ProductListResult> {
      const params: Record<string, unknown> = {
        page: query.page ?? 1,
        limit: query.limit ?? 30,
        sort_by: query.sort_by ?? 'created_at',
        sort_order: query.sort_order ?? 'desc',
      }
      if (query.search) params.search = query.search
      if (query.category_id) params.category_id = query.category_id
      if (query.is_active != null) params.is_active = query.is_active
      if (query.is_featured != null) params.is_featured = query.is_featured

      const res = await api.get<unknown>('/products', { params })
      const data = unwrapApiData<unknown>(res.data ?? res)
      const obj = data && typeof data === 'object' ? (data as Record<string, unknown>) : {}
      const rows = Array.isArray(data)
        ? (data as Record<string, unknown>[])
        : Array.isArray(obj.products)
          ? (obj.products as Record<string, unknown>[])
          : unwrapList<Record<string, unknown>>(data, 'products')
      const pag = (obj.pagination ?? {}) as Record<string, unknown>
      return {
        items: rows.map(mapProductListItem).filter((p) => p.id),
        pagination: {
          page: Number(pag.page ?? query.page ?? 1),
          limit: Number(pag.limit ?? query.limit ?? rows.length),
          total: Number(pag.total ?? rows.length),
          totalPages: Number(pag.totalPages ?? 1),
        },
      }
    },

    async getProductById(id: string): Promise<ProductDetail> {
      const res = await api.get<unknown>(`/products/${id}`)
      let data = unwrapApiData<Record<string, unknown>>(res.data ?? res)
      if (data && typeof data === 'object' && 'product' in data) {
        data = data.product as Record<string, unknown>
      }
      return {
        id: String(data.id ?? data._id ?? id),
        name: String(data.name ?? ''),
        description: String(data.description ?? ''),
        short_description: data.short_description as string | undefined,
        category_id: (data.category_id as string) ?? undefined,
        vendor_id: (data.vendor_id as string) ?? (data.provider_id as string) ?? undefined,
        slug: data.slug as string | undefined,
        price: data.price != null ? Number(data.price) : 0,
        original_price: data.original_price != null ? Number(data.original_price) : undefined,
        sku: data.sku as string | undefined,
        stock_quantity: Number(data.stock_quantity ?? data.stockQuantity ?? 0),
        low_stock_threshold:
          data.low_stock_threshold != null ? Number(data.low_stock_threshold) : undefined,
        imageUrl: firstImageUrl(data.images),
        is_active: data.is_active != null ? Boolean(data.is_active) : data.status !== 'inactive',
      }
    },

    async updateProduct(id: string, payload: UpdateProductPayload): Promise<CreatedProduct> {
      const body = compact({
        category_id: payload.category_id,
        name: payload.name?.trim(),
        description: payload.description,
        short_description: payload.short_description?.trim(),
        slug: payload.slug,
        price: payload.price,
        original_price: payload.original_price,
        sku: payload.sku?.trim(),
        stock_quantity: payload.stock_quantity,
        low_stock_threshold: payload.low_stock_threshold,
        images: payload.images?.length ? payload.images : undefined,
        is_active: payload.is_active,
        is_featured: payload.is_featured,
        tags: payload.tags?.length ? payload.tags : undefined,
        vendor_id: payload.vendor_id,
      })
      const res = await api.put<unknown>(`/products/${id}`, body)
      return mapProduct(unwrapApiData<Record<string, unknown>>(res.data ?? res))
    },

    async deleteProduct(id: string): Promise<void> {
      await api.delete(`/products/${id}`)
    },
  }
}

export type ProductsServiceApi = ReturnType<typeof createProductsService>
