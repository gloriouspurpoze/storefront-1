import { configureStore } from '@reduxjs/toolkit'
import { persistStore, persistReducer, createTransform } from 'redux-persist'
import storage from 'redux-persist/lib/storage' // defaults to localStorage
import { combineReducers } from '@reduxjs/toolkit'
import authSlice from './slices/authSlice'
import tenantSlice from './slices/tenantSlice'
import uiSlice from './slices/uiSlice'
import dataSlice from './slices/dataSlice'

// Transform to convert snake_case backend data to camelCase frontend data
const authTransform = createTransform(
  // Transform state being persisted (outbound)
  (inboundState: any) => inboundState,
  // Transform state being rehydrated (inbound)
  (outboundState: any) => {
    // If user exists and has snake_case fields, transform them
    if (outboundState.user) {
      const user = outboundState.user
      
      // Check if data is in snake_case format (needs transformation)
      if (user.user_type || user.first_name || user.last_name) {
        console.log('🔄 Transforming persisted user data from snake_case to camelCase')
        
        return {
          ...outboundState,
          user: {
            id: user.id,
            email: user.email,
            firstName: user.first_name || user.firstName,
            lastName: user.last_name || user.lastName,
            phone: user.phone,
            userType: user.user_type || user.userType,
            isVerified: user.is_verified || user.isVerified,
            profilePicture: user.profile_picture || user.profilePicture,
            createdAt: user.created_at || user.createdAt || new Date().toISOString(),
            updatedAt: user.updated_at || user.updatedAt,
          }
        }
      }
    }
    
    return outboundState
  },
  { whitelist: ['auth'] }
)

// Persist config
const persistConfig = {
  key: 'root',
  storage,
  whitelist: ['auth', 'tenant'], // Auth + tenant context (org id for SaaS API headers)
  transforms: [authTransform], // Apply transformation
}

// Combine reducers
const rootReducer = combineReducers({
  auth: authSlice,
  tenant: tenantSlice,
  ui: uiSlice,
  data: dataSlice,
})

// Create persisted reducer
const persistedReducer = persistReducer(persistConfig, rootReducer as any)

export const store = configureStore({
  reducer: persistedReducer,
  devTools: process.env.NODE_ENV !== 'production',
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }),
})

export const persistor = persistStore(store)

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
