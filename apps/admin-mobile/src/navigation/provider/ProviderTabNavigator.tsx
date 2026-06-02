import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { Text } from 'react-native'
import { ProviderBookingsScreen } from '@/features/provider/screens/ProviderBookingsScreen'
import { ProviderDashboardScreen } from '@/features/provider/screens/ProviderDashboardScreen'
import { ProviderEarningsScreen } from '@/features/provider/screens/ProviderEarningsScreen'
import { ProviderMoreScreen } from '@/features/provider/screens/ProviderMoreScreen'
import { colors } from '@/theme/colors'

export type ProviderTabParamList = {
  ProviderDashboard: undefined
  ProviderBookings: undefined
  ProviderEarnings: undefined
  ProviderMore: undefined
}

const Tab = createBottomTabNavigator<ProviderTabParamList>()

function Label({ label, focused }: { label: string; focused: boolean }) {
  return (
    <Text style={{ fontSize: 11, color: focused ? colors.primary : colors.textMuted, fontWeight: '600' }}>
      {label}
    </Text>
  )
}

export function ProviderTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border },
      }}
    >
      <Tab.Screen
        name="ProviderDashboard"
        component={ProviderDashboardScreen}
        options={{ tabBarLabel: ({ focused }) => <Label label="Home" focused={focused} /> }}
      />
      <Tab.Screen
        name="ProviderBookings"
        component={ProviderBookingsScreen}
        options={{ tabBarLabel: ({ focused }) => <Label label="Bookings" focused={focused} /> }}
      />
      <Tab.Screen
        name="ProviderEarnings"
        component={ProviderEarningsScreen}
        options={{ tabBarLabel: ({ focused }) => <Label label="Earnings" focused={focused} /> }}
      />
      <Tab.Screen
        name="ProviderMore"
        component={ProviderMoreScreen}
        options={{ tabBarLabel: ({ focused }) => <Label label="More" focused={focused} /> }}
      />
    </Tab.Navigator>
  )
}
