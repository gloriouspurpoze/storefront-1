import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { Platform, StyleSheet } from 'react-native'
import { Icon, type IconName } from '@/components/ui/Icon'
import { Text } from '@/components/ui/Text'
import { isAdminTabVisible } from '@/config/mobileNav.config'
import { usePermissions } from '@/hooks/usePermissions'
import { ChatStack } from '@/navigation/admin/ChatStack'
import { HomeStack } from '@/navigation/admin/HomeStack'
import { InboxStack } from '@/navigation/admin/InboxStack'
import { MoreStack } from '@/navigation/admin/MoreStack'
import { OpsStack } from '@/navigation/admin/OpsStack'
import type { AdminTabParamList } from '@/navigation/types'
import { useGetChatUnreadCountQuery } from '@/store/api/chatApi'
import { useGetNotificationUnreadCountQuery } from '@/store/api/notificationsApi'
import { palette, spacing } from '@/theme'

const Tab = createBottomTabNavigator<AdminTabParamList>()

function tabBarIcon(name: IconName) {
  return ({ color, focused }: { color: string; focused: boolean }) => (
    <Icon name={name} size={22} color={color} strokeWidth={focused ? 2.4 : 1.8} />
  )
}

function tabBarLabel(label: string) {
  return ({ focused }: { focused: boolean }) => (
    <Text
      variant="caption"
      color={focused ? 'primary' : 'body'}
      style={focused ? styles.labelFocused : undefined}
    >
      {label}
    </Text>
  )
}

export function AdminTabNavigator() {
  const { checkRouteAccess } = usePermissions()
  const { data: chatUnread = 0 } = useGetChatUnreadCountQuery(undefined, { pollingInterval: 45_000 })
  const { data: inboxUnread = 0 } = useGetNotificationUnreadCountQuery(undefined, { pollingInterval: 60_000 })

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: palette.primary,
        tabBarInactiveTintColor: palette.body,
        tabBarItemStyle: styles.tabItem,
        tabBarBadgeStyle: styles.tabBadge,
      }}
    >
      {isAdminTabVisible('home', checkRouteAccess) ? (
        <Tab.Screen
          name="HomeTab"
          component={HomeStack}
          options={{
            tabBarLabel: tabBarLabel('Home'),
            tabBarIcon: tabBarIcon('home'),
          }}
        />
      ) : null}
      {isAdminTabVisible('ops', checkRouteAccess) ? (
        <Tab.Screen
          name="OpsTab"
          component={OpsStack}
          options={{
            tabBarLabel: tabBarLabel('Ops'),
            tabBarIcon: tabBarIcon('briefcase'),
          }}
        />
      ) : null}
      {isAdminTabVisible('chat', checkRouteAccess) ? (
        <Tab.Screen
          name="ChatTab"
          component={ChatStack}
          options={{
            tabBarLabel: tabBarLabel('Chat'),
            tabBarIcon: tabBarIcon('message-square'),
            tabBarBadge: chatUnread > 0 ? chatUnread : undefined,
          }}
        />
      ) : null}
      {isAdminTabVisible('inbox', checkRouteAccess) ? (
        <Tab.Screen
          name="InboxTab"
          component={InboxStack}
          options={{
            tabBarLabel: tabBarLabel('Inbox'),
            tabBarIcon: tabBarIcon('inbox'),
            tabBarBadge: inboxUnread > 0 ? inboxUnread : undefined,
          }}
        />
      ) : null}
      <Tab.Screen
        name="MoreTab"
        component={MoreStack}
        options={{
          tabBarLabel: tabBarLabel('More'),
          tabBarIcon: tabBarIcon('menu'),
        }}
      />
    </Tab.Navigator>
  )
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: palette.canvas,
    borderTopColor: palette.surfacePressed,
    borderTopWidth: StyleSheet.hairlineWidth,
    height: Platform.OS === 'ios' ? 84 : 64,
    paddingTop: spacing.xs,
    paddingBottom: Platform.OS === 'ios' ? spacing.xl : spacing.xs,
  },
  tabItem: {
    paddingVertical: spacing.xxs,
  },
  labelFocused: {
    fontWeight: '700',
  },
  tabBadge: {
    backgroundColor: palette.secondary,
    color: palette.onSecondary,
    fontWeight: '700',
  },
})
