import { api } from './base'
import type {
  Category,
  CreateCategoryRequest,
  UpdateCategoryRequest,
  CategoriesQuery,
  CategoriesResponse,
  CategoryStats,
  CategoryTreeItem,
  CategoryWithStats,
} from '../../types'

// Interfaces are defined in types/index.ts

/**
 * Categories Service
 * Comprehensive category management with CRUD operations, tree structure, and advanced features
 */
export class CategoriesService {
  /**
   * Get categories with pagination and filtering
   */
  static async getCategories(query: CategoriesQuery = {}) {
    const params = new URLSearchParams()
    
    // Enhanced query parameters
    const enhancedQuery = {
      page: query.page || 1,
      limit: query.limit || 10,
      parent_id: query.parent_id,
      is_active: query.is_active,
      search: query.search,
      category_type: query.category_type,
      level: query.level,
      // Disable population to avoid backend schema errors
      populate: 'false',
      noPopulate: 'true',
      ...query
    }
    
    Object.entries(enhancedQuery).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          params.append(key, value.join(','))
        } else {
          params.append(key, value.toString())
        }
      }
    })

    const endpoint = `/categories/all${params.toString() ? `?${params.toString()}` : ''}`
    
    return api.get<CategoriesResponse>(endpoint, {
      loadingMessage: 'Loading categories...',
      showSuccessToast: false,
    })
  }

  /**
   * Get category tree structure
   */
  static async getCategoryTree() {
    return api.get<CategoryTreeItem[]>('/categories/tree', {
      loadingMessage: 'Loading category tree...',
      showSuccessToast: false,
    })
  }

  /**
   * Get categories with product counts
   */
  static async getCategoriesWithStats() {
    return api.get<CategoryWithStats[]>('/categories/with-counts', {
      loadingMessage: 'Loading category statistics...',
      showSuccessToast: false,
    })
  }

  /**
   * Get categories by type (product, service, both)
   */
  static async getCategoriesByType(type: 'product' | 'service' | 'both') {
    return this.getCategories({ category_type: type })
  }

  /**
   * Merge multiple category_type queries in parallel, dedupe by id, sort by name.
   * Use for UIs that must not mix product-only and service-only trees but still
   * include `both` (shared) categories in each context.
   */
  private static async mergeCategoryTypes(
    types: Array<'product' | 'service' | 'both'>,
    base: Omit<CategoriesQuery, 'category_type'>,
  ): Promise<Category[]> {
    const limit = base.limit ?? 500
    const results = await Promise.all(
      types.map((category_type) =>
        this.getCategories({ ...base, page: 1, limit, category_type }),
      ),
    )
    const seen = new Set<string>()
    const out: Category[] = []
    for (const res of results) {
      // Backend may omit `success` or return categories with `_id` only; still use data when present.
      if (!res?.data) continue
      if (res.success === false) continue
      const cats = res.data.categories ?? []
      for (const c of cats) {
        const id = c?.id ?? (c as { _id?: string })._id
        if (!id || seen.has(String(id))) continue
        seen.add(String(id))
        out.push(
          c.id
            ? c
            : ({ ...c, id: String((c as { _id?: string })._id) } as Category)
        )
      }
    }
    return out.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }))
  }

  /** Product catalog & product forms: `product` + `both` (never service-only). */
  static async getCategoriesForProductUIs(base: Omit<CategoriesQuery, 'category_type'> = {}) {
    return this.mergeCategoryTypes(['product', 'both'], base)
  }

  /** Service catalog & service forms: `service` + `both` (never product-only). */
  static async getCategoriesForServiceUIs(base: Omit<CategoriesQuery, 'category_type'> = {}) {
    return this.mergeCategoryTypes(['service', 'both'], base)
  }

  /**
   * Get service categories only
   */
  static async getServiceCategories() {
    return api.get<CategoryWithStats[]>('/categories/services', {
      loadingMessage: 'Loading service categories...',
      showSuccessToast: false,
    })
  }

  /**
   * Get product categories only
   */
  static async getProductCategories() {
    return api.get<CategoryWithStats[]>('/categories/products', {
      loadingMessage: 'Loading product categories...',
      showSuccessToast: false,
    })
  }

  /**
   * Get categories by level (0 = root, 1 = first level, etc.)
   */
  static async getCategoriesByLevel(level: number) {
    return this.getCategories({ level })
  }

  /**
   * Get root categories (level 0)
   */
  static async getRootCategories() {
    return this.getCategories({ level: 0 })
  }

  /**
   * Get popular categories
   */
  static async getPopularCategories(limit: number = 10) {
    return api.get<Category[]>(`/categories/popular?limit=${limit}`, {
      loadingMessage: 'Loading popular categories...',
      showSuccessToast: false,
    })
  }

  /**
   * Search categories with text search
   */
  static async searchCategories(query: string) {
    return this.getCategories({ search: query })
  }

  /**
   * Get single category by ID
   */
  static async getCategory(id: string) {
    return api.get<Category>(`/categories/${id}`, {
      loadingMessage: 'Loading category...',
      showSuccessToast: false,
    })
  }

  /**
   * Get subcategories for a parent category
   */
  static async getSubcategories(parentId: string) {
    return api.get<Category[]>(`/categories/${parentId}/subcategories`, {
      loadingMessage: 'Loading subcategories...',
      showSuccessToast: false,
    })
  }

  /**
   * Create new category
   */
  static async createCategory(category: CreateCategoryRequest) {
    return api.post<Category>('/categories/create', category, {
      loadingMessage: 'Creating category...',
      successMessage: 'Category created successfully!',
      errorMessage: 'Failed to create category.',
    })
  }

  /**
   * Update existing category
   */
  static async updateCategory(id: string, category: UpdateCategoryRequest) {
    return api.put<Category>(`/categories/update/${id}`, category, {
      loadingMessage: 'Updating category...',
      successMessage: 'Category updated successfully!',
      errorMessage: 'Failed to update category.',
    })
  }

  /**
   * Update category sort order
   */
  static async updateSortOrder(id: string, sortOrder: number) {
    return api.patch<Category>(`/categories/sort/${id}`, { sort_order: sortOrder }, {
      loadingMessage: 'Updating sort order...',
      successMessage: 'Sort order updated successfully!',
      errorMessage: 'Failed to update sort order.',
    })
  }

  /**
   * Delete category (or remove from one catalog only when `catalog` is set — see backend).
   * Optional `catalog`: `products` | `services` from the scoped admin list.
   */
  static async deleteCategory(
    id: string,
    options?: { reassignToCategoryId?: string; catalog?: 'products' | 'services' }
  ) {
    const params: Record<string, string> = {}
    if (options?.reassignToCategoryId) {
      params.reassign_to_category_id = options.reassignToCategoryId
    }
    if (options?.catalog) {
      params.catalog = options.catalog
    }
    return api.delete(`/categories/delete/${id}`, {
      params: Object.keys(params).length ? params : undefined,
      loadingMessage: 'Deleting category...',
      showSuccessToast: false,
      errorMessage: 'Failed to delete category.',
    })
  }

  /**
   * Bulk delete categories
   */
  static async bulkDeleteCategories(ids: string[]) {
    return api.post('/categories/bulk-delete', { ids }, {
      loadingMessage: 'Deleting categories...',
      successMessage: `${ids.length} categories deleted successfully!`,
      errorMessage: 'Failed to delete categories.',
    })
  }

  // searchCategories is already defined above

  /**
   * Get category statistics
   */
  static async getCategoryStats(): Promise<CategoryStats> {
    // This would be implemented on the backend
    // For now, we'll calculate from the categories data
    const response = await this.getCategories({ limit: 1000 })
    const categories = response.data.categories
    
    return {
      totalCategories: categories.length,
      activeCategories: categories.filter(c => c.status === 'active').length,
      inactiveCategories: categories.filter(c => c.status === 'inactive').length,
      categoriesWithProducts: categories.filter(c => (c as any).productCount > 0).length,
      topLevelCategories: categories.filter(c => !c.parentId).length,
      subcategories: categories.filter(c => c.parentId).length,
    }
  }

  /**
   * Build category tree from flat list
   */
  static buildCategoryTree(categories: Category[]): CategoryTreeItem[] {
    const categoryMap = new Map<string, CategoryTreeItem>()
    const rootCategories: CategoryTreeItem[] = []

    // Create map of all categories with enhanced properties
    categories.forEach(category => {
      categoryMap.set(category.id, {
        ...category,
        level: 0,
        hasChildren: false,
        children: [],
      })
    })

    // Build tree structure
    categories.forEach(category => {
      const treeItem = categoryMap.get(category.id)!
      
      if (category.parentId && categoryMap.has(category.parentId)) {
        const parent = categoryMap.get(category.parentId)!
        treeItem.level = parent.level + 1
        parent.children = parent.children || []
        parent.children.push(treeItem)
        parent.hasChildren = true
      } else {
        rootCategories.push(treeItem)
      }
    })

    return rootCategories
  }

  /**
   * Flatten category tree for display
   */
  static flattenCategoryTree(tree: CategoryTreeItem[]): CategoryTreeItem[] {
    const flattened: CategoryTreeItem[] = []
    
    const traverse = (items: CategoryTreeItem[]) => {
      items.forEach(item => {
        flattened.push(item)
        if (item.children && item.children.length > 0) {
          traverse(item.children)
        }
      })
    }
    
    traverse(tree)
    return flattened
  }

  /**
   * Validate category data
   */
  static validateCategory(category: CreateCategoryRequest | UpdateCategoryRequest): string[] {
    const errors: string[] = []
    
    if (!category.name || category.name.trim().length < 2) {
      errors.push('Category name must be at least 2 characters long')
    }
    
    if (category.name && category.name.length > 100) {
      errors.push('Category name cannot exceed 100 characters')
    }
    
    if (category.description && category.description.length > 500) {
      errors.push('Description cannot exceed 500 characters')
    }
    
    return errors
  }

  /**
   * Check if category can be deleted
   */
  static async canDeleteCategory(id: string): Promise<{ canDelete: boolean; reason?: string }> {
    try {
      const category = await this.getCategory(id)
      
      // Check if category has products
      if ((category.data as any).productCount > 0) {
        return {
          canDelete: false,
          reason: 'Cannot delete category that contains products'
        }
      }
      
      // Check if category has subcategories
      const subcategories = await this.getSubcategories(id)
      if (subcategories.data.length > 0) {
        return {
          canDelete: false,
          reason: 'Cannot delete category that has subcategories'
        }
      }
      
      return { canDelete: true }
    } catch (error) {
      return {
        canDelete: false,
        reason: 'Error checking category dependencies'
      }
    }
  }
}

// Types are imported from types/index.ts