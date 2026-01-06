import { apiClient } from '../apiClient'
import type {
  Menu,
  CreateMenuRequest,
  UpdateMenuRequest,
  MenuItem,
  CreateMenuItemRequest,
  UpdateMenuItemRequest,
  MenusResponse,
  MenusQuery,
} from '../../types'

/**
 * Menu Service
 * Production-ready service for menu management with comprehensive CRUD operations
 * Follows the established apiClient pattern for consistency
 */
export class MenuService {
  /**
   * Get all menus with pagination and filtering
   */
  static async getMenus(query: MenusQuery = {}) {
    const params: Record<string, string> = {}
    
    if (query.page) params.page = query.page.toString()
    if (query.limit) params.limit = query.limit.toString()
    if (query.location) params.location = query.location
    if (query.isActive !== undefined) params.isActive = query.isActive.toString()
    if (query.search) params.search = query.search
    if (query.sort_by) params.sort_by = query.sort_by
    if (query.sort_order) params.sort_order = query.sort_order

    const response = await apiClient.get<MenusResponse | { data: MenusResponse }>('/cms/admin/menus', {
      params,
      showLoading: true,
      loadingMessage: 'Loading menus...',
      showSuccessToast: false,
      showErrorToast: true,
      errorMessage: 'Failed to load menus',
    })
    
    // Handle both response formats: { data: {...} } or direct response
    return (response as any).data || response
  }

  /**
   * Get a single menu by ID
   */
  static async getMenuById(id: string) {
    const response = await apiClient.get<{ menu: Menu } | { data: { menu: Menu } }>(`/cms/admin/menus/${id}`, {
      showLoading: true,
      loadingMessage: 'Loading menu...',
      showSuccessToast: false,
      showErrorToast: true,
      errorMessage: 'Failed to load menu',
    })
    
    // Handle both response formats: { data: {...} } or direct response
    return (response as any).data || response
  }

  /**
   * Create a new menu
   */
  static async createMenu(data: CreateMenuRequest) {
    // Auto-generate slug if not provided
    const payload = {
      ...data,
      slug: data.slug || data.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
    }

    return apiClient.post<{ menu: Menu }>('/cms/admin/menus', payload, {
      showLoading: true,
      loadingMessage: 'Creating menu...',
      showSuccessToast: true,
      successMessage: 'Menu created successfully',
      showErrorToast: true,
      errorMessage: 'Failed to create menu',
    })
  }

  /**
   * Update an existing menu
   */
  static async updateMenu(id: string, data: UpdateMenuRequest) {
    return apiClient.put<{ menu: Menu }>(`/cms/admin/menus/${id}`, data, {
      showLoading: true,
      loadingMessage: 'Updating menu...',
      showSuccessToast: true,
      successMessage: 'Menu updated successfully',
      showErrorToast: true,
      errorMessage: 'Failed to update menu',
    })
  }

  /**
   * Delete a menu
   */
  static async deleteMenu(id: string) {
    return apiClient.delete<{ message: string }>(`/cms/admin/menus/${id}`, {
      showLoading: true,
      loadingMessage: 'Deleting menu...',
      showSuccessToast: true,
      successMessage: 'Menu deleted successfully',
      showErrorToast: true,
      errorMessage: 'Failed to delete menu',
    })
  }

  /**
   * Add a menu item to a menu
   */
  static async addMenuItem(menuId: string, data: CreateMenuItemRequest) {
    return apiClient.post<{ menu: Menu }>(`/cms/admin/menus/${menuId}/items`, data, {
      showLoading: true,
      loadingMessage: 'Adding menu item...',
      showSuccessToast: true,
      successMessage: 'Menu item added successfully',
      showErrorToast: true,
      errorMessage: 'Failed to add menu item',
    })
  }

  /**
   * Update a menu item
   */
  static async updateMenuItem(menuId: string, itemId: string, data: UpdateMenuItemRequest) {
    return apiClient.put<{ menu: Menu }>(`/cms/admin/menus/${menuId}/items/${itemId}`, data, {
      showLoading: true,
      loadingMessage: 'Updating menu item...',
      showSuccessToast: true,
      successMessage: 'Menu item updated successfully',
      showErrorToast: true,
      errorMessage: 'Failed to update menu item',
    })
  }

  /**
   * Delete a menu item
   */
  static async deleteMenuItem(menuId: string, itemId: string) {
    return apiClient.delete<{ menu: Menu }>(`/cms/admin/menus/${menuId}/items/${itemId}`, {
      showLoading: true,
      loadingMessage: 'Deleting menu item...',
      showSuccessToast: true,
      successMessage: 'Menu item deleted successfully',
      showErrorToast: true,
      errorMessage: 'Failed to delete menu item',
    })
  }

  /**
   * Reorder menu items
   */
  static async reorderMenuItems(menuId: string, items: Array<{ id: string; order: number; parentId?: string }>) {
    return apiClient.put<{ menu: Menu }>(`/cms/admin/menus/${menuId}/items/reorder`, { items }, {
      showLoading: true,
      loadingMessage: 'Reordering menu items...',
      showSuccessToast: true,
      successMessage: 'Menu items reordered successfully',
      showErrorToast: true,
      errorMessage: 'Failed to reorder menu items',
    })
  }

  /**
   * Duplicate a menu
   */
  static async duplicateMenu(id: string, newName?: string) {
    return apiClient.post<{ menu: Menu }>(`/cms/admin/menus/${id}/duplicate`, { name: newName }, {
      showLoading: true,
      loadingMessage: 'Duplicating menu...',
      showSuccessToast: true,
      successMessage: 'Menu duplicated successfully',
      showErrorToast: true,
      errorMessage: 'Failed to duplicate menu',
    })
  }

  /**
   * Get menu by location
   */
  static async getMenuByLocation(location: 'header' | 'footer' | 'sidebar' | 'mobile' | 'custom') {
    return apiClient.get<{ menu: Menu }>(`/cms/admin/menus/location/${location}`, {
      showLoading: false,
      showSuccessToast: false,
      showErrorToast: false,
    })
  }

  /**
   * Toggle menu active status
   */
  static async toggleMenuStatus(id: string, isActive: boolean) {
    return apiClient.patch<{ menu: Menu }>(`/cms/admin/menus/${id}/status`, { isActive }, {
      showLoading: true,
      loadingMessage: 'Updating menu status...',
      showSuccessToast: true,
      successMessage: `Menu ${isActive ? 'activated' : 'deactivated'} successfully`,
      showErrorToast: true,
      errorMessage: 'Failed to update menu status',
    })
  }
}

