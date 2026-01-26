import { createSelector } from '@reduxjs/toolkit'
import type { RootState } from './index'

// Auth selectors
export const selectAuth = (state: RootState) => state.auth
export const selectUser = (state: RootState) => state.auth?.user ?? null
export const selectIsAuthenticated = (state: RootState) => state.auth?.isAuthenticated ?? false
export const selectToken = (state: RootState) => state.auth?.token ?? null
export const selectRefreshToken = (state: RootState) => state.auth?.refreshToken ?? null
export const selectAuthLoading = (state: RootState) => state.auth?.isLoading ?? false
export const selectAuthError = (state: RootState) => state.auth?.error ?? null
export const selectIsTokenExpired = (state: RootState) => {
  if (!state.auth?.tokenExpiry) return false
  return Date.now() > state.auth.tokenExpiry
}

// User role and permissions
export const selectUserRole = (state: RootState) => state.auth?.user?.userType
export const selectIsAdmin = (state: RootState) => state.auth?.user?.userType === 'admin'
export const selectIsProvider = (state: RootState) => state.auth?.user?.userType === 'provider'
export const selectIsCustomer = (state: RootState) => state.auth?.user?.userType === 'customer'

// UI selectors
export const selectUI = (state: RootState) => state.ui
export const selectIsLoading = (state: RootState) => state.ui?.isLoading ?? false
export const selectLoadingMessage = (state: RootState) => state.ui?.loadingMessage ?? ''
export const selectToasts = (state: RootState) => state.ui?.toasts ?? []
export const selectSidebarOpen = (state: RootState) => state.ui?.sidebarOpen ?? false
export const selectTheme = (state: RootState) => state.ui?.theme ?? 'light'
export const selectModals = (state: RootState) => state.ui?.modals ?? []
export const selectPagination = (state: RootState) => state.ui?.pagination ?? { page: 1, limit: 10, total: 0, totalPages: 0 }
export const selectFilters = (state: RootState) => state.ui?.filters ?? []
export const selectSort = (state: RootState) => state.ui?.sort ?? { field: '', direction: 'asc' as const }
export const selectSearchQuery = (state: RootState) => state.ui?.searchQuery ?? ''
export const selectSelectedItems = (state: RootState) => state.ui?.selectedItems ?? []
export const selectIsOnline = (state: RootState) => state.ui?.isOnline ?? true

// Modal selectors
export const selectModalByType = (modalType: string) => 
  createSelector(
    [selectModals],
    (modals) => modals.find((modal: any) => modal.type === modalType)
  )

export const selectIsModalOpen = (modalType: string) =>
  createSelector(
    [selectModalByType(modalType)],
    (modal) => modal?.isOpen || false
  )

// Data selectors
export const selectData = (state: RootState) => state.data

// Service Requests selectors
export const selectServiceRequests = (state: RootState) => state.data?.serviceRequests
export const selectServiceRequestsItems = (state: RootState) => state.data?.serviceRequests?.items ?? []
export const selectServiceRequestsLoading = (state: RootState) => state.data?.serviceRequests?.loading ?? false
export const selectServiceRequestsError = (state: RootState) => state.data?.serviceRequests?.error ?? null
export const selectServiceRequestsPagination = (state: RootState) => state.data?.serviceRequests?.pagination ?? { page: 1, limit: 10, total: 0, totalPages: 0 }

export const selectServiceRequestById = (id: string) =>
  createSelector(
    [selectServiceRequestsItems],
    (items) => items.find((item: any) => item.id === id)
  )

export const selectServiceRequestsByStatus = (status: string) =>
  createSelector(
    [selectServiceRequestsItems],
    (items) => items.filter((item: any) => item.status === status)
  )

// Providers selectors
export const selectProviders = (state: RootState) => state.data?.providers
export const selectProvidersItems = (state: RootState) => state.data?.providers?.items ?? []
export const selectProvidersLoading = (state: RootState) => state.data?.providers?.loading ?? false
export const selectProvidersError = (state: RootState) => state.data?.providers?.error ?? null
export const selectProvidersPagination = (state: RootState) => state.data?.providers?.pagination ?? { page: 1, limit: 10, total: 0, totalPages: 0 }

export const selectProviderById = (id: string) =>
  createSelector(
    [selectProvidersItems],
    (items) => items.find((item: any) => item.id === id)
  )

export const selectVerifiedProviders = createSelector(
  [selectProvidersItems],
  (items) => items.filter((item: any) => item.verificationStatus === 'verified')
)

export const selectProvidersByServiceType = (serviceType: string) =>
  createSelector(
    [selectProvidersItems],
    (items) => items.filter((item: any) => item.servicesOffered.includes(serviceType))
  )

// Quotes selectors
export const selectQuotes = (state: RootState) => state.data?.quotes
export const selectQuotesItems = (state: RootState) => state.data?.quotes?.items ?? []
export const selectQuotesLoading = (state: RootState) => state.data?.quotes?.loading ?? false
export const selectQuotesError = (state: RootState) => state.data?.quotes?.error ?? null
export const selectQuotesPagination = (state: RootState) => state.data?.quotes?.pagination ?? { page: 1, limit: 10, total: 0, totalPages: 0 }

export const selectQuoteById = (id: string) =>
  createSelector(
    [selectQuotesItems],
    (items) => items.find((item: any) => item.id === id)
  )

export const selectPendingQuotes = createSelector(
  [selectQuotesItems],
  (items) => items.filter((item: any) => item.status === 'pending')
)

export const selectAcceptedQuotes = createSelector(
  [selectQuotesItems],
  (items) => items.filter((item: any) => item.status === 'accepted')
)

// Bookings selectors
export const selectBookings = (state: RootState) => state.data?.bookings
export const selectBookingsItems = (state: RootState) => state.data?.bookings?.items ?? []
export const selectBookingsLoading = (state: RootState) => state.data?.bookings?.loading ?? false
export const selectBookingsError = (state: RootState) => state.data?.bookings?.error ?? null
export const selectBookingsPagination = (state: RootState) => state.data?.bookings?.pagination ?? { page: 1, limit: 10, total: 0, totalPages: 0 }

export const selectBookingById = (id: string) =>
  createSelector(
    [selectBookingsItems],
    (items) => items.find((item: any) => item.id === id)
  )

export const selectBookingsByStatus = (status: string) =>
  createSelector(
    [selectBookingsItems],
    (items) => items.filter((item: any) => item.status === status)
  )

export const selectTodaysBookings = createSelector(
  [selectBookingsItems],
  (items) => {
    const today = new Date().toISOString().split('T')[0]
    return items.filter((item: any) => item.scheduledDate === today)
  }
)

// Products selectors
export const selectProducts = (state: RootState) => state.data?.products
export const selectProductsItems = (state: RootState) => state.data?.products?.items ?? []
export const selectProductsLoading = (state: RootState) => state.data?.products?.loading ?? false
export const selectProductsError = (state: RootState) => state.data?.products?.error ?? null
export const selectProductsPagination = (state: RootState) => state.data?.products?.pagination ?? { page: 1, limit: 10, total: 0, totalPages: 0 }

export const selectProductById = (id: string) =>
  createSelector(
    [selectProductsItems],
    (items) => items.find((item: any) => item.id === id)
  )

export const selectFeaturedProducts = createSelector(
  [selectProductsItems],
  (items) => items.filter((item: any) => item.isFeatured)
)

export const selectProductsByCategory = (categoryId: string) =>
  createSelector(
    [selectProductsItems],
    (items) => items.filter((item: any) => item.category?.id === categoryId)
  )

// Categories selectors
export const selectCategories = (state: RootState) => state.data?.categories
export const selectCategoriesItems = (state: RootState) => state.data?.categories?.items ?? []
export const selectCategoriesLoading = (state: RootState) => state.data?.categories?.loading ?? false
export const selectCategoriesError = (state: RootState) => state.data?.categories?.error ?? null

export const selectCategoryById = (id: string) =>
  createSelector(
    [selectCategoriesItems],
    (items) => items.find((item: any) => item.id === id)
  )

export const selectActiveCategories = createSelector(
  [selectCategoriesItems],
  (items) => items.filter((item: any) => item.status === 'active')
)

export const selectParentCategories = createSelector(
  [selectCategoriesItems],
  (items) => items.filter((item: any) => !item.parentId)
)

export const selectChildCategories = (parentId: string) =>
  createSelector(
    [selectCategoriesItems],
    (items) => items.filter((item: any) => item.parentId === parentId)
  )

// Combined selectors
export const selectAllDataLoading = createSelector(
  [selectServiceRequestsLoading, selectProvidersLoading, selectQuotesLoading, selectBookingsLoading, selectProductsLoading, selectCategoriesLoading],
  (...loadingStates) => loadingStates.some((loading: any) => loading)
)

export const selectAllDataErrors = createSelector(
  [selectServiceRequestsError, selectProvidersError, selectQuotesError, selectBookingsError, selectProductsError, selectCategoriesError],
  (...errors) => errors.filter((error: any) => error !== null)
)

// Statistics selectors
export const selectServiceRequestStats = createSelector(
  [selectServiceRequestsItems],
  (items) => ({
    total: items.length,
    byStatus: items.reduce((acc: Record<string, number>, item: any) => {
      acc[item.status] = (acc[item.status] || 0) + 1
      return acc
    }, {} as Record<string, number>),
    byServiceType: items.reduce((acc: Record<string, number>, item: any) => {
      acc[item.serviceType] = (acc[item.serviceType] || 0) + 1
      return acc
    }, {} as Record<string, number>),
  })
)

export const selectProviderStats = createSelector(
  [selectProvidersItems],
  (items) => ({
    total: items.length,
    verified: items.filter((item: any) => item.verificationStatus === 'verified').length,
    pending: items.filter((item: any) => item.verificationStatus === 'pending').length,
    averageRating:
      items.reduce((sum: number, item: any) => sum + item.rating, 0) / items.length || 0,
  })
)

export const selectBookingStats = createSelector(
  [selectBookingsItems],
  (items) => ({
    total: items.length,
    byStatus: items.reduce((acc: Record<string, number>, item: any) => {
      acc[item.status] = (acc[item.status] || 0) + 1
      return acc
    }, {} as Record<string, number>),
    totalRevenue: items.reduce((sum: number, item: any) => sum + item.totalAmount, 0),
  })
)

// Search and filter selectors
export const selectFilteredServiceRequests = createSelector(
  [selectServiceRequestsItems, selectSearchQuery, selectFilters],
  (items, searchQuery, filters) => {
    let filtered = items

    // Apply search
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter((item: any) =>
        item.title.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query) ||
        item.serviceType.toLowerCase().includes(query)
      )
    }

    // Apply filters
    filters.forEach((filter: any) => {
      filtered = filtered.filter((item: any) => {
        const value = (item as any)[filter.key]
        switch (filter.operator) {
          case 'eq':
            return value === filter.value
          case 'ne':
            return value !== filter.value
          case 'like':
            return value?.toString().toLowerCase().includes(filter.value?.toString().toLowerCase())
          case 'in':
            return Array.isArray(filter.value) && filter.value.includes(value)
          default:
            return value === filter.value
        }
      })
    })

    return filtered
  }
)

export const selectFilteredProviders = createSelector(
  [selectProvidersItems, selectSearchQuery, selectFilters],
  (items, searchQuery, filters) => {
    let filtered = items

    // Apply search
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter((item: any) =>
        item.businessName.toLowerCase().includes(query) ||
        item.bio?.toLowerCase().includes(query) ||
        item.servicesOffered.some((service: any) => service.toLowerCase().includes(query))
      )
    }

    // Apply filters
    filters.forEach((filter: any) => {
      filtered = filtered.filter((item: any) => {
        const value = (item as any)[filter.key]
        switch (filter.operator) {
          case 'eq':
            return value === filter.value
          case 'ne':
            return value !== filter.value
          case 'like':
            return value?.toString().toLowerCase().includes(filter.value?.toString().toLowerCase())
          case 'in':
            return Array.isArray(filter.value) && filter.value.includes(value)
          default:
            return value === filter.value
        }
      })
    })

    return filtered
  }
)
