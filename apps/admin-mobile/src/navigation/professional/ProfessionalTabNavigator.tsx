import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { Text } from 'react-native'
import { ProfessionalBookingsScreen } from '@/features/professional/screens/ProfessionalBookingsScreen'
import { ProfessionalChatStack } from '@/navigation/professional/ProfessionalChatStack'
import { ProfessionalDashboardScreen } from '@/features/professional/screens/ProfessionalDashboardScreen'
import { ProfessionalEarningsScreen } from '@/features/professional/screens/ProfessionalEarningsScreen'
import { ProfessionalMoreScreen } from '@/features/professional/screens/ProfessionalMoreScreen'
import { useGetChatUnreadCountQuery } from '@/store/api/chatApi'
import { colors } from '@/theme/colors'

export type ProfessionalTabParamList = {
  ProDashboard: undefined
  ProBookings: undefined
  ProEarnings: undefined
  ProChat: undefined
  ProMore: undefined
}

const Tab = createBottomTabNavigator<ProfessionalTabParamList>()

function Label({ label, focused }: { label: string; focused: boolean }) {
  return (
    <Text style={{ fontSize: 11, color: focused ? colors.primary : colors.textMuted, fontWeight: '600' }}>
      {label}
    </Text>
  )
}

export function ProfessionalTabNavigator() {
  const { data: chatUnread = 0 } = useGetChatUnreadCountQuery(undefined, { pollingInterval: 45_000 })

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border },
      }}
    >
      <Tab.Screen
        name="ProDashboard"
        component={ProfessionalDashboardScreen}
        options={{ tabBarLabel: ({ focused }) => <Label label="Home" focused={focused} /> }}
      />
      <Tab.Screen
        name="ProBookings"
        component={ProfessionalBookingsScreen}
        options={{ tabBarLabel: ({ focused }) => <Label label="Jobs" focused={focused} /> }}
      />
      <Tab.Screen
        name="ProEarnings"
        component={ProfessionalEarningsScreen}
        options={{ tabBarLabel: ({ focused }) => <Label label="Earnings" focused={focused} /> }}
      />
      <Tab.Screen
        name="ProChat"
        component={ProfessionalChatStack}
        options={{
          tabBarLabel: ({ focused }) => <Label label="Chat" focused={focused} />,
          tabBarBadge: chatUnread > 0 ? chatUnread : undefined,
        }}
      />
      <Tab.Screen
        name="ProMore"
        component={ProfessionalMoreScreen}
        options={{ tabBarLabel: ({ focused }) => <Label label="More" focused={focused} /> }}
      />
    </Tab.Navigator>
  )
}
