import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { LoginScreen } from '@/features/auth/screens/LoginScreen'
import type { AuthStackParamList } from '@/navigation/types'
import { palette } from '@/theme'

const Stack = createNativeStackNavigator<AuthStackParamList>()

export function AuthNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: palette.canvas },
      }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
    </Stack.Navigator>
  )
}
