import type { ReactNode } from 'react'
import { Provider } from 'react-redux'
import { PersistGate } from 'redux-persist/integration/react'
import { persistor, store } from '@/store'
import { ActivityIndicator, View } from 'react-native'
import { colors } from '@/theme/colors'

export function ReduxProvider({ children }: { children: ReactNode }) {
  return (
    <Provider store={store}>
      <PersistGate
        loading={
          <View style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }}>
            <ActivityIndicator color={colors.primary} />
          </View>
        }
        persistor={persistor}
      >
        {children}
      </PersistGate>
    </Provider>
  )
}
