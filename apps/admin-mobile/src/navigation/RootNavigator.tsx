import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { PushBootstrap } from '@/components/push/PushBootstrap'
import { useAppSelector } from '@/store/hooks'
import { AuthNavigator } from '@/navigation/AuthNavigator'
import { AdminNavigator } from '@/navigation/roles/AdminNavigator'
import { ProviderNavigator } from '@/navigation/roles/ProviderNavigator'
import { ProfessionalNavigator } from '@/navigation/roles/ProfessionalNavigator'
import { linking } from '@/navigation/linking'
import { navigationRef } from '@/navigation/navigationRef'
import type { RootStackParamList } from '@/navigation/types'
import { colors } from '@/theme/colors'

const Stack = createNativeStackNavigator<RootStackParamList>()

function pickMainNavigator(userType: string | undefined) {
  if (userType === 'professional') return ProfessionalNavigator
  if (userType === 'provider') return ProviderNavigator
  return AdminNavigator
}

export function RootNavigator() {
  const isAuthenticated = useAppSelector((s) => s.auth.isAuthenticated)
  const userType = useAppSelector((s) => s.auth.user?.userType)
  const Main = pickMainNavigator(userType)

  return (
    <NavigationContainer ref={navigationRef} linking={linking}>
      <PushBootstrap />
      <Stack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
        {isAuthenticated ? (
          <Stack.Screen name="Main" component={Main} />
        ) : (
          <Stack.Screen name="Auth" component={AuthNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  )
}
