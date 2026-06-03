import AsyncStorage from '@react-native-async-storage/async-storage'
import { combineReducers, configureStore } from '@reduxjs/toolkit'
import { persistReducer, persistStore } from 'redux-persist'
import authReducer from '@/store/slices/authSlice'
import tenantReducer from '@/store/slices/tenantSlice'
import { baseApi } from '@/store/api/baseApi'
import '@/store/api/bookingsApi'
import '@/store/api/dashboardApi'
import '@/store/api/chatApi'
import '@/store/api/notificationsApi'
import '@/store/api/opsApi'
import '@/store/api/phase2Api'
import '@/store/api/financeApi'
import '@/store/api/directoryApi'
import '@/store/api/catalogAdminApi'

const persistConfig = {
  key: 'profixer-admin-mobile',
  storage: AsyncStorage,
  whitelist: ['auth', 'tenant'],
}

const rootReducer = combineReducers({
  auth: authReducer,
  tenant: tenantReducer,
  [baseApi.reducerPath]: baseApi.reducer,
})

const persistedReducer = persistReducer(persistConfig, rootReducer)

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }).concat(baseApi.middleware),
})

export const persistor = persistStore(store)

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
