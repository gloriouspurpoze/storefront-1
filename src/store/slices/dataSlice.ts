import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit'
import { 
  ServiceRequestsService, 
  ProvidersService, 
  QuotesService, 
  BookingsService, 
  ProductsService,
  CategoriesService 
} from '../../services/api'
import type {
  ServiceRequest,
  Provider,
  Quote,
  Booking,
  Product,
  Category,
  ServiceRequestsQuery,
  ProvidersQuery,
  QuotesQuery,
  BookingsQuery,
  ProductsQuery,
  CategoriesQuery,
  CategoriesResponse,
} from '../../types'

// Generic data state interface
interface DataState<T> {
  items: T[]
  loading: boolean
  error: string | null
  lastFetch: string | null
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// Specific entity states
interface DataStates {
  serviceRequests: DataState<ServiceRequest>
  providers: DataState<Provider>
  quotes: DataState<Quote>
  bookings: DataState<Booking>
  products: DataState<Product>
  categories: DataState<Category>
}

const createInitialDataState = <T>(): DataState<T> => ({
  items: [],
  loading: false,
  error: null,
  lastFetch: null,
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  },
})

const initialState: DataStates = {
  serviceRequests: createInitialDataState<ServiceRequest>(),
  providers: createInitialDataState<Provider>(),
  quotes: createInitialDataState<Quote>(),
  bookings: createInitialDataState<Booking>(),
  products: createInitialDataState<Product>(),
  categories: createInitialDataState<Category>(),
}

// Service Requests Async Thunks
export const fetchServiceRequests = createAsyncThunk(
  'data/fetchServiceRequests',
  async (query: ServiceRequestsQuery = {}) => {
    const response = await ServiceRequestsService.getServiceRequests(query)
    return response.data
  }
)

export const fetchServiceRequest = createAsyncThunk(
  'data/fetchServiceRequest',
  async (id: string) => {
    const response = await ServiceRequestsService.getServiceRequest(id)
    return response.data
  }
)

export const createServiceRequest = createAsyncThunk(
  'data/createServiceRequest',
  async (serviceRequest: any) => {
    const response = await ServiceRequestsService.createServiceRequest(serviceRequest)
    return response.data
  }
)

export const updateServiceRequest = createAsyncThunk(
  'data/updateServiceRequest',
  async ({ id, data }: { id: string; data: any }) => {
    const response = await ServiceRequestsService.updateServiceRequest(id, data)
    return response.data
  }
)

export const deleteServiceRequest = createAsyncThunk(
  'data/deleteServiceRequest',
  async (id: string) => {
    await ServiceRequestsService.deleteServiceRequest(id)
    return id
  }
)

// Providers Async Thunks
export const fetchProviders = createAsyncThunk(
  'data/fetchProviders',
  async (query: ProvidersQuery = {}) => {
    const response = await ProvidersService.getProviders(query)
    return response.data
  }
)

export const fetchProvider = createAsyncThunk(
  'data/fetchProvider',
  async (id: string) => {
    const response = await ProvidersService.getProvider(id)
    return response.data
  }
)

export const createProvider = createAsyncThunk(
  'data/createProvider',
  async (provider: any) => {
    const response = await ProvidersService.createProvider(provider)
    return response.data
  }
)

export const updateProvider = createAsyncThunk(
  'data/updateProvider',
  async ({ id, data }: { id: string; data: any }) => {
    const response = await ProvidersService.updateProvider(id, data)
    return response.data
  }
)

export const deleteProvider = createAsyncThunk(
  'data/deleteProvider',
  async (id: string) => {
    await ProvidersService.deleteProvider(id)
    return id
  }
)

// Quotes Async Thunks
export const fetchQuotes = createAsyncThunk(
  'data/fetchQuotes',
  async (query: QuotesQuery = {}) => {
    const response = await QuotesService.getQuotes(query)
    return response.data
  }
)

export const createQuote = createAsyncThunk(
  'data/createQuote',
  async (quote: any) => {
    const response = await QuotesService.createQuote(quote)
    return response.data
  }
)

export const acceptQuote = createAsyncThunk(
  'data/acceptQuote',
  async (id: string) => {
    const response = await QuotesService.acceptQuote(id)
    return response.data
  }
)

export const rejectQuote = createAsyncThunk(
  'data/rejectQuote',
  async ({ id, reason }: { id: string; reason?: string }) => {
    const response = await QuotesService.rejectQuote(id, reason)
    return response.data
  }
)

// Bookings Async Thunks
export const fetchBookings = createAsyncThunk(
  'data/fetchBookings',
  async (query: BookingsQuery = {}) => {
    const response = await BookingsService.getBookings(query)
    return response.data
  }
)

export const updateBookingStatus = createAsyncThunk(
  'data/updateBookingStatus',
  async ({ id, status, notes }: { id: string; status: any; notes?: string }) => {
    const response = await BookingsService.updateBookingStatus(id, { status, notes })
    return response.data
  }
)

// Products Async Thunks
export const fetchProducts = createAsyncThunk(
  'data/fetchProducts',
  async (query: ProductsQuery = {}) => {
    const response = await ProductsService.getProducts(query)
    return response.data
  }
)

export const fetchProduct = createAsyncThunk(
  'data/fetchProduct',
  async (id: string) => {
    const response = await ProductsService.getProduct(id)
    return response.data
  }
)

export const createProduct = createAsyncThunk(
  'data/createProduct',
  async (product: any) => {
    const response = await ProductsService.createProduct(product)
    return response.data
  }
)

export const updateProduct = createAsyncThunk(
  'data/updateProduct',
  async ({ id, data }: { id: string; data: any }) => {
    const response = await ProductsService.updateProduct(id, data)
    return response.data
  }
)

export const deleteProduct = createAsyncThunk(
  'data/deleteProduct',
  async (id: string) => {
    await ProductsService.deleteProduct(id)
    return id
  }
)

// Categories Async Thunks
export const fetchCategories = createAsyncThunk(
  'data/fetchCategories',
  async (query: CategoriesQuery = {}) => {
    const response = await CategoriesService.getCategories(query)
    return response.data
  }
)

export const createCategory = createAsyncThunk(
  'data/createCategory',
  async (category: any) => {
    const response = await CategoriesService.createCategory(category)
    return response.data
  }
)

export const updateCategory = createAsyncThunk(
  'data/updateCategory',
  async ({ id, data }: { id: string; data: any }) => {
    const response = await CategoriesService.updateCategory(id, data)
    return response.data
  }
)

export const deleteCategory = createAsyncThunk(
  'data/deleteCategory',
  async (id: string) => {
    await CategoriesService.deleteCategory(id)
    return id
  }
)

const dataSlice = createSlice({
  name: 'data',
  initialState,
  reducers: {
    clearError: (state, action: PayloadAction<string>) => {
      const entity = action.payload as keyof DataStates
      if (state[entity]) {
        state[entity].error = null
      }
    },
    clearAllErrors: (state) => {
      Object.keys(state).forEach(key => {
        const entity = key as keyof DataStates
        state[entity].error = null
      })
    },
    resetEntity: (state, action: PayloadAction<keyof DataStates>) => {
      const entity = action.payload
      if (state[entity]) {
        state[entity] = createInitialDataState() as any
      }
    },
    resetAllEntities: (state) => {
      Object.keys(state).forEach(key => {
        const entity = key as keyof DataStates
        state[entity] = createInitialDataState() as any
      })
    },
    updateItem: (state, action: PayloadAction<{ entity: keyof DataStates; id: string; updates: any }>) => {
      const { entity, id, updates } = action.payload
      const items = state[entity].items as any[]
      const item = items.find((item: any) => item.id === id)
      if (item) {
        Object.assign(item, updates)
      }
    },
    removeItem: (state, action: PayloadAction<{ entity: keyof DataStates; id: string }>) => {
      const { entity, id } = action.payload
      state[entity].items = (state[entity].items as any[]).filter(item => item.id !== id) as any
    },
  },
  extraReducers: (builder) => {
    // Generic reducer helper for paginated data
    const addPaginatedCases = (
      builder: any,
      thunk: any,
      entity: keyof DataStates
    ) => {
      builder
        .addCase(thunk.pending, (state: any) => {
          state[entity].loading = true
          state[entity].error = null
        })
        .addCase(thunk.fulfilled, (state: any, action: any) => {
          state[entity].loading = false
          state[entity].error = null
          state[entity].lastFetch = new Date().toISOString()
          
          if (action.payload.products || action.payload.providers || action.payload.quotes || 
              action.payload.bookings || action.payload.serviceRequests) {
            // Handle paginated response
            const itemsKey = Object.keys(action.payload).find(key => 
              key !== 'pagination' && Array.isArray(action.payload[key])
            )
            if (itemsKey) {
              state[entity].items = action.payload[itemsKey]
              state[entity].pagination = action.payload.pagination || state[entity].pagination
            }
          } else if (Array.isArray(action.payload)) {
            // Handle array response
            state[entity].items = action.payload
          } else {
            // Handle single item response
            const existingIndex = state[entity].items.findIndex((item: any) => item.id === action.payload.id)
            if (existingIndex >= 0) {
              state[entity].items[existingIndex] = action.payload
            } else {
              state[entity].items.push(action.payload)
            }
          }
        })
        .addCase(thunk.rejected, (state: any, action: any) => {
          state[entity].loading = false
          state[entity].error = action.error.message || 'An error occurred'
        })
    }

    // Service Requests
    addPaginatedCases(builder, fetchServiceRequests, 'serviceRequests')
    addPaginatedCases(builder, fetchServiceRequest, 'serviceRequests')
    addPaginatedCases(builder, createServiceRequest, 'serviceRequests')
    addPaginatedCases(builder, updateServiceRequest, 'serviceRequests')
    builder.addCase(deleteServiceRequest.fulfilled, (state, action) => {
      state.serviceRequests.items = state.serviceRequests.items.filter(
        (item: ServiceRequest) => item.id !== action.payload
      )
    })

    // Providers
    addPaginatedCases(builder, fetchProviders, 'providers')
    addPaginatedCases(builder, fetchProvider, 'providers')
    addPaginatedCases(builder, createProvider, 'providers')
    addPaginatedCases(builder, updateProvider, 'providers')
    builder.addCase(deleteProvider.fulfilled, (state, action) => {
      state.providers.items = state.providers.items.filter(
        (item: Provider) => item.id !== action.payload
      )
    })

    // Quotes
    addPaginatedCases(builder, fetchQuotes, 'quotes')
    addPaginatedCases(builder, createQuote, 'quotes')
    addPaginatedCases(builder, acceptQuote, 'quotes')
    addPaginatedCases(builder, rejectQuote, 'quotes')

    // Bookings
    addPaginatedCases(builder, fetchBookings, 'bookings')
    addPaginatedCases(builder, updateBookingStatus, 'bookings')

    // Products
    addPaginatedCases(builder, fetchProducts, 'products')
    addPaginatedCases(builder, fetchProduct, 'products')
    addPaginatedCases(builder, createProduct, 'products')
    addPaginatedCases(builder, updateProduct, 'products')
    builder.addCase(deleteProduct.fulfilled, (state, action) => {
      state.products.items = state.products.items.filter(
        (item: Product) => item.id !== action.payload
      )
    })

    // Categories
    builder
      .addCase(fetchCategories.pending, (state) => {
        state.categories.loading = true
        state.categories.error = null
      })
      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.categories.loading = false
        state.categories.error = null
        state.categories.lastFetch = new Date().toISOString()
        
        // Handle CategoriesResponse format (with categories array and pagination)
        const payload = action.payload as CategoriesResponse | Category[] | Category
        if (payload && typeof payload === 'object' && 'categories' in payload && Array.isArray(payload.categories)) {
          // CategoriesResponse format
          state.categories.items = payload.categories
          state.categories.pagination = payload.pagination || state.categories.pagination
        } else if (Array.isArray(payload)) {
          // Handle direct array response
          state.categories.items = payload
        } else {
          // Handle single category response
          const category = payload as Category
          const existingIndex = state.categories.items.findIndex((item: Category) => item.id === category.id)
          if (existingIndex >= 0) {
            state.categories.items[existingIndex] = category
          } else {
            state.categories.items.push(category)
          }
        }
      })
      .addCase(fetchCategories.rejected, (state, action) => {
        state.categories.loading = false
        state.categories.error = action.error.message || 'An error occurred'
      })

    addPaginatedCases(builder, createCategory, 'categories')
    addPaginatedCases(builder, updateCategory, 'categories')
    builder.addCase(deleteCategory.fulfilled, (state, action) => {
      state.categories.items = state.categories.items.filter(
        (item: Category) => item.id !== action.payload
      )
    })
  },
})

export const {
  clearError,
  clearAllErrors,
  resetEntity,
  resetAllEntities,
  updateItem,
  removeItem,
} = dataSlice.actions

export default dataSlice.reducer
