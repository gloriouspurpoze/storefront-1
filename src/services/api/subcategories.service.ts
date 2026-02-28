import { api } from './base'

export interface Subcategory {
  id: string
  _id?: string
  name: string
  slug: string
  displayName?: string
  categoryId: string
  serviceIntent?: 'repair' | 'installation'
  description?: string
  icon?: string
  image?: string
  sortOrder?: number
  isActive?: boolean
  serviceCount?: number
  tags?: string[]
  createdAt?: string
  updatedAt?: string
}

export interface SubcategoriesListResponse {
  subcategories: Subcategory[]
}

export interface CreateSubcategoryRequest {
  name: string
  category_id: string
  slug?: string
  display_name?: string
  service_intent?: 'repair' | 'installation'
  description?: string
  icon?: string
  image?: string
  sort_order?: number
  is_active?: boolean
}

/**
 * Subcategories API (backend /api/subcategories)
 */
export class SubcategoriesService {
  /**
   * List subcategories, optionally by category
   */
  static async getSubcategories(params?: { categoryId?: string; is_active?: boolean }) {
    return api.get<SubcategoriesListResponse>('/subcategories', {
      params: params as Record<string, string | boolean | undefined>,
      loadingMessage: 'Loading subcategories...',
      showSuccessToast: false,
    })
  }

  /**
   * Get one subcategory by ID
   */
  static async getSubcategory(id: string) {
    return api.get<Subcategory>(`/subcategories/${id}`, {
      loadingMessage: 'Loading subcategory...',
      showSuccessToast: false,
    })
  }

  /**
   * Create subcategory (admin)
   */
  static async createSubcategory(
    data: CreateSubcategoryRequest,
    options?: { showSuccessToast?: boolean; showLoading?: boolean }
  ) {
    return api.post<Subcategory>('/subcategories', data, {
      loadingMessage: 'Creating subcategory...',
      successMessage: 'Subcategory created successfully!',
      errorMessage: 'Failed to create subcategory.',
      showSuccessToast: options?.showSuccessToast !== false,
      showLoading: options?.showLoading !== false,
    })
  }

  /**
   * Update subcategory (admin)
   */
  static async updateSubcategory(id: string, data: Partial<CreateSubcategoryRequest>) {
    return api.put<Subcategory>(`/subcategories/${id}`, data, {
      loadingMessage: 'Updating subcategory...',
      successMessage: 'Subcategory updated successfully!',
      errorMessage: 'Failed to update subcategory.',
    })
  }

  /**
   * Delete subcategory (admin)
   */
  static async deleteSubcategory(id: string) {
    return api.delete(`/subcategories/${id}`, {
      loadingMessage: 'Deleting subcategory...',
      successMessage: 'Subcategory deleted successfully!',
      errorMessage: 'Failed to delete subcategory.',
    })
  }
}
