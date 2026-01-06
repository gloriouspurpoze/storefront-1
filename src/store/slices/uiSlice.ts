import { createSlice, PayloadAction } from '@reduxjs/toolkit'

// Simple UUID generator
const generateId = () => Math.random().toString(36).substr(2, 9) + Date.now().toString(36)

interface Toast {
  id: string
  message: string
  severity: 'success' | 'error' | 'warning' | 'info'
  duration?: number
  action?: {
    label: string
    onClick: () => void
  }
}

interface Modal {
  id: string
  type: string
  isOpen: boolean
  data?: any
}

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

interface Filter {
  key: string
  value: any
  operator?: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'nin' | 'like'
}

interface Sort {
  field: string
  direction: 'asc' | 'desc'
}

interface UIState {
  isLoading: boolean
  loadingMessage: string
  toasts: Toast[]
  sidebarOpen: boolean
  theme: 'light' | 'dark'
  modals: Modal[]
  pagination: Pagination
  filters: Filter[]
  sort: Sort | null
  searchQuery: string
  selectedItems: string[]
  isOnline: boolean
  lastActivity: string
}

const initialState: UIState = {
  isLoading: false,
  loadingMessage: 'Loading...',
  toasts: [],
  sidebarOpen: true,
  theme: 'light',
  modals: [],
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  },
  filters: [],
  sort: null,
  searchQuery: '',
  selectedItems: [],
  isOnline: navigator.onLine,
  lastActivity: new Date().toISOString(),
}

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<{ isLoading: boolean; message?: string }>) => {
      state.isLoading = action.payload.isLoading
      if (action.payload.message) {
        state.loadingMessage = action.payload.message
      }
      state.lastActivity = new Date().toISOString()
    },
    addToast: (state, action: PayloadAction<Omit<Toast, 'id'>>) => {
      const toast: Toast = {
        ...action.payload,
        id: generateId(),
      }
      state.toasts.push(toast)
    },
    removeToast: (state, action: PayloadAction<string>) => {
      state.toasts = state.toasts.filter(toast => toast.id !== action.payload)
    },
    clearToasts: (state) => {
      state.toasts = []
    },
    setSidebarOpen: (state, action: PayloadAction<boolean>) => {
      state.sidebarOpen = action.payload
    },
    setTheme: (state, action: PayloadAction<'light' | 'dark'>) => {
      state.theme = action.payload
    },
    
    // Modal management
    openModal: (state, action: PayloadAction<{ type: string; data?: any }>) => {
      const modal: Modal = {
        id: generateId(),
        type: action.payload.type,
        isOpen: true,
        data: action.payload.data,
      }
      state.modals.push(modal)
    },
    closeModal: (state, action: PayloadAction<string>) => {
      const modal = state.modals.find(m => m.id === action.payload)
      if (modal) {
        modal.isOpen = false
      }
    },
    removeModal: (state, action: PayloadAction<string>) => {
      state.modals = state.modals.filter(modal => modal.id !== action.payload)
    },
    
    // Pagination management
    setPagination: (state, action: PayloadAction<Partial<Pagination>>) => {
      state.pagination = { ...state.pagination, ...action.payload }
    },
    setPage: (state, action: PayloadAction<number>) => {
      state.pagination.page = action.payload
    },
    setLimit: (state, action: PayloadAction<number>) => {
      state.pagination.limit = action.payload
      state.pagination.page = 1 // Reset to first page when changing limit
    },
    
    // Filter management
    addFilter: (state, action: PayloadAction<Filter>) => {
      const existingFilterIndex = state.filters.findIndex(f => f.key === action.payload.key)
      if (existingFilterIndex >= 0) {
        state.filters[existingFilterIndex] = action.payload
      } else {
        state.filters.push(action.payload)
      }
    },
    removeFilter: (state, action: PayloadAction<string>) => {
      state.filters = state.filters.filter(filter => filter.key !== action.payload)
    },
    clearFilters: (state) => {
      state.filters = []
    },
    
    // Sort management
    setSort: (state, action: PayloadAction<Sort>) => {
      state.sort = action.payload
    },
    clearSort: (state) => {
      state.sort = null
    },
    
    // Search management
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload
      state.pagination.page = 1 // Reset to first page when searching
    },
    clearSearch: (state) => {
      state.searchQuery = ''
      state.pagination.page = 1
    },
    
    // Selection management
    setSelectedItems: (state, action: PayloadAction<string[]>) => {
      state.selectedItems = action.payload
    },
    addSelectedItem: (state, action: PayloadAction<string>) => {
      if (!state.selectedItems.includes(action.payload)) {
        state.selectedItems.push(action.payload)
      }
    },
    removeSelectedItem: (state, action: PayloadAction<string>) => {
      state.selectedItems = state.selectedItems.filter(id => id !== action.payload)
    },
    clearSelectedItems: (state) => {
      state.selectedItems = []
    },
    
    // Network status
    setOnlineStatus: (state, action: PayloadAction<boolean>) => {
      state.isOnline = action.payload
    },
    
    // Activity tracking
    updateActivity: (state) => {
      state.lastActivity = new Date().toISOString()
    },
    
    // Reset UI state
    resetUI: (state) => {
      state.pagination = initialState.pagination
      state.filters = []
      state.sort = null
      state.searchQuery = ''
      state.selectedItems = []
      state.modals = []
    },
  },
})

export const {
  setLoading,
  addToast,
  removeToast,
  clearToasts,
  setSidebarOpen,
  setTheme,
  openModal,
  closeModal,
  removeModal,
  setPagination,
  setPage,
  setLimit,
  addFilter,
  removeFilter,
  clearFilters,
  setSort,
  clearSort,
  setSearchQuery,
  clearSearch,
  setSelectedItems,
  addSelectedItem,
  removeSelectedItem,
  clearSelectedItems,
  setOnlineStatus,
  updateActivity,
  resetUI,
} = uiSlice.actions

// Export types
export type { Toast, Modal, Pagination, Filter, Sort, UIState }

export default uiSlice.reducer
