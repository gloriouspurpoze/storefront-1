import type { ApiClient } from '../types'
import { unwrapApiData, unwrapList } from '../unwrap'

export type CategoryType = 'product' | 'service' | 'both'

export interface AdminCategory {
  id: string
  name: string
  categoryType: CategoryType
  parentId?: string
  isActive?: boolean
  description?: string
  image?: string
  sortOrder?: number
}

export type UpdateCategoryPayload = Partial<CreateCategoryPayload>

export interface CreateCategoryPayload {
  name: string
  description?: string
  categoryType?: CategoryType
  parentId?: string
  image?: string
  icon?: string
  sortOrder?: number
  status?: 'active' | 'inactive'
}

export interface ListCategoriesQuery {
  categoryType?: CategoryType
  search?: string
  limit?: number
  /** Include inactive categories (browse/manage screens). Default: active only. */
  includeInactive?: boolean
}

function mapCategory(raw: Record<string, unknown>): AdminCategory {
  const type = (raw.categoryType ?? raw.category_type ?? 'both') as CategoryType
  return {
    id: String(raw.id ?? raw._id ?? ''),
    name: String(raw.name ?? 'Category'),
    categoryType: type === 'product' || type === 'service' ? type : 'both',
    parentId: (raw.parentId ?? raw.parent_id) as string | undefined,
    isActive:
      raw.isActive != null
        ? Boolean(raw.isActive)
        : raw.is_active != null
          ? Boolean(raw.is_active)
          : raw.status != null
            ? raw.status === 'active'
            : undefined,
    description: raw.description as string | undefined,
    image: (raw.image ?? raw.featuredImage) as string | undefined,
    sortOrder: raw.sortOrder != null ? Number(raw.sortOrder) : undefined,
  }
}

export function createCategoriesService(api: ApiClient) {
  return {
    /**
     * Lists categories for picker dropdowns. When `categoryType` is provided we
     * include `both` (shared) categories alongside the requested type, mirroring
     * the web admin's `getCategoriesFor*UIs` helpers.
     */
    async listCategories(query: ListCategoriesQuery = {}): Promise<AdminCategory[]> {
      const params: Record<string, unknown> = {
        page: 1,
        limit: query.limit ?? 200,
        populate: 'false',
        noPopulate: 'true',
        sort_by: 'name',
        sort_order: 'asc',
      }
      if (!query.includeInactive) params.is_active = true
      if (query.search) params.search = query.search
      if (query.categoryType) params.category_type = query.categoryType

      const res = await api.get<unknown>('/categories/all', { params })
      const data = unwrapApiData<unknown>(res.data ?? res)
      const rows = Array.isArray(data)
        ? (data as Record<string, unknown>[])
        : unwrapList<Record<string, unknown>>(data, 'categories')
      const mapped = rows.map(mapCategory).filter((c) => c.id)

      // When a specific type is requested, keep that type + shared `both`.
      if (query.categoryType) {
        return mapped.filter(
          (c) => c.categoryType === query.categoryType || c.categoryType === 'both',
        )
      }
      return mapped
    },

    async createCategory(payload: CreateCategoryPayload): Promise<AdminCategory> {
      const body: Record<string, unknown> = {
        name: payload.name.trim(),
        categoryType: payload.categoryType ?? 'product',
        status: payload.status ?? 'active',
      }
      if (payload.description?.trim()) body.description = payload.description.trim()
      if (payload.parentId) body.parentId = payload.parentId
      if (payload.image) body.image = payload.image
      if (payload.icon) body.icon = payload.icon
      if (payload.sortOrder != null) body.sortOrder = payload.sortOrder

      const res = await api.post<unknown>('/categories/create', body)
      return mapCategory(unwrapApiData<Record<string, unknown>>(res.data ?? res))
    },

    async getCategoryById(id: string): Promise<AdminCategory> {
      const res = await api.get<unknown>(`/categories/${id}`)
      let data = unwrapApiData<Record<string, unknown>>(res.data ?? res)
      if (data && typeof data === 'object' && 'category' in data) {
        data = data.category as Record<string, unknown>
      }
      return mapCategory(data)
    },

    async updateCategory(id: string, payload: UpdateCategoryPayload): Promise<AdminCategory> {
      const body: Record<string, unknown> = {}
      if (payload.name != null) body.name = payload.name.trim()
      if (payload.description != null) body.description = payload.description.trim()
      if (payload.categoryType != null) body.categoryType = payload.categoryType
      if (payload.parentId != null) body.parentId = payload.parentId
      if (payload.image != null) body.image = payload.image
      if (payload.icon != null) body.icon = payload.icon
      if (payload.sortOrder != null) body.sortOrder = payload.sortOrder
      if (payload.status != null) body.status = payload.status

      const res = await api.put<unknown>(`/categories/update/${id}`, body)
      return mapCategory(unwrapApiData<Record<string, unknown>>(res.data ?? res))
    },

    async deleteCategory(id: string): Promise<void> {
      await api.delete(`/categories/delete/${id}`)
    },
  }
}

export type CategoriesServiceApi = ReturnType<typeof createCategoriesService>
