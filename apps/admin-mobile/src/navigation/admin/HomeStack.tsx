import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { DashboardScreen } from '@/features/dashboard/screens/DashboardScreen'
import { AnalyticsScreen } from '@/features/analytics/screens/AnalyticsScreen'
import { BookingDetailScreen } from '@/features/bookings/screens/BookingDetailScreen'
import type { HomeStackParamList } from '@/navigation/types'
import { palette } from '@/theme'

const Stack = createNativeStackNavigator<HomeStackParamList>()

export function HomeStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: palette.canvas },
        headerTintColor: palette.ink,
        headerShadowVisible: false,
        contentStyle: { backgroundColor: palette.canvasSoft },
      }}
    >
      <Stack.Screen name="Dashboard" component={DashboardScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Analytics" component={AnalyticsScreen} options={{ title: 'Analytics' }} />
      <Stack.Screen name="BookingDetail" component={BookingDetailScreen} options={{ title: 'Booking' }} />
    </Stack.Navigator>
  )
}
