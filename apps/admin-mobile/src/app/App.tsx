import { StatusBar } from 'react-native'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { bootstrapApi } from '@/app/bootstrapApi'
import { ReduxProvider } from '@/app/providers/ReduxProvider'
import { RootNavigator } from '@/navigation/RootNavigator'
import { palette } from '@/theme'

bootstrapApi()

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ReduxProvider>
        <SafeAreaProvider>
          <StatusBar barStyle="dark-content" backgroundColor={palette.canvas} />
          <RootNavigator />
        </SafeAreaProvider>
      </ReduxProvider>
    </GestureHandlerRootView>
  )
}
