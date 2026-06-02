import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { ApprovalsInboxScreen } from '@/features/approvals/screens/ApprovalsInboxScreen'
import { NotificationsScreen } from '@/features/notifications/screens/NotificationsScreen'
import { SupportTicketsScreen } from '@/features/approvals/screens/SupportTicketsScreen'
import { RefundRequestsScreen } from '@/features/approvals/screens/RefundRequestsScreen'
import { RefundDetailScreen } from '@/features/approvals/screens/RefundDetailScreen'
import type { InboxStackParamList } from '@/navigation/types'
import { palette } from '@/theme'

const Stack = createNativeStackNavigator<InboxStackParamList>()

export function InboxStack() {
  return (
    <Stack.Navigator
      initialRouteName="ApprovalsInbox"
      screenOptions={{
        headerStyle: { backgroundColor: palette.canvas },
        headerTintColor: palette.ink,
        headerShadowVisible: false,
        contentStyle: { backgroundColor: palette.canvasSoft },
      }}
    >
      <Stack.Screen
        name="ApprovalsInbox"
        component={ApprovalsInboxScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{ title: 'Notifications' }}
      />
      <Stack.Screen name="SupportTickets" component={SupportTicketsScreen} options={{ title: 'Tickets' }} />
      <Stack.Screen name="RefundRequests" component={RefundRequestsScreen} options={{ title: 'Refunds' }} />
      <Stack.Screen name="RefundDetail" component={RefundDetailScreen} options={{ title: 'Refund' }} />
    </Stack.Navigator>
  )
}
