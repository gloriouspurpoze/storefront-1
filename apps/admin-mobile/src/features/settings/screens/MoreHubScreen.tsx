import { FlatList, Pressable, StyleSheet, View } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { Icon, type IconName } from '@/components/ui/Icon'
import { Text } from '@/components/ui/Text'
import { ScreenHeader } from '@/components/common/ScreenHeader'
import { Screen } from '@/components/layout/Screen'
import { adminMobileNav, visibleNavItems } from '@/config/mobileNav.config'
import { usePermissions } from '@/hooks/usePermissions'
import type { AdminTabParamList, MoreStackParamList } from '@/navigation/types'
import { logoutUser } from '@/store/slices/authSlice'
import { useAppDispatch } from '@/store/hooks'
import { palette, radius, spacing } from '@/theme'

const SCREEN_ICONS: Record<string, IconName> = {
  Settings: 'settings',
  Analytics: 'trending-up',
  CrmHub: 'users',
  EarningsOverview: 'wallet',
  InvoicesList: 'tag',
  PaymentsList: 'wallet',
  UsersList: 'user',
  OrdersList: 'briefcase',
}

type MoreNav = NativeStackNavigationProp<MoreStackParamList>
type TabNav = BottomTabNavigationProp<AdminTabParamList>

export function MoreHubScreen() {
  const dispatch = useAppDispatch()
  const { checkRouteAccess } = usePermissions()
  const stackNav = useNavigation<MoreNav>()
  const tabNav = useNavigation<TabNav>()

  const drawerItems = visibleNavItems(
    adminMobileNav.filter((i) => i.tier === 'drawer'),
    checkRouteAccess,
    'admin',
  )

  const openItem = (mobileScreen: string) => {
    switch (mobileScreen) {
      case 'Settings':
        stackNav.navigate('Settings')
        break
      case 'Analytics':
        tabNav.navigate('HomeTab', { screen: 'Analytics' } as never)
        break
      case 'CrmHub':
        stackNav.navigate('CrmHub')
        break
      case 'EarningsOverview':
        stackNav.navigate('EarningsOverview')
        break
      case 'InvoicesList':
        stackNav.navigate('InvoicesList')
        break
      case 'PaymentsList':
        stackNav.navigate('PaymentsList')
        break
      case 'UsersList':
        stackNav.navigate('UsersList')
        break
      case 'OrdersList':
        stackNav.navigate('OrdersList')
        break
      default:
        break
    }
  }

  return (
    <Screen scroll surface="canvas">
      <ScreenHeader title="More" subtitle="Settings & modules" large />
      <FlatList
        data={drawerItems}
        keyExtractor={(item) => item.id}
        scrollEnabled={false}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <Pressable
            style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
            onPress={() => openItem(item.mobileScreen)}
          >
            <View style={styles.iconBubble}>
              <Icon name={SCREEN_ICONS[item.mobileScreen] ?? 'menu'} size={18} color={palette.primary} />
            </View>
            <View style={styles.rowBody}>
              <Text variant="bodyMdStrong" color="ink">
                {item.label}
              </Text>
              <Text variant="caption" color="body">
                {item.mobileScreen === 'Settings' ? 'App preferences' : 'Open in mobile admin'}
              </Text>
            </View>
            <Icon name="chevron-right" size={18} color={palette.mute} />
          </Pressable>
        )}
        ListEmptyComponent={
          <Text variant="bodyMd" color="body" align="center" style={styles.empty}>
            No additional modules for your role.
          </Text>
        }
        ListFooterComponent={
          <Pressable
            onPress={() => dispatch(logoutUser())}
            style={({ pressed }) => [styles.logout, pressed && styles.rowPressed]}
          >
            <Icon name="log-out" size={18} color={palette.danger} />
            <Text variant="bodyMdStrong" color="danger">
              Sign out
            </Text>
          </Pressable>
        }
      />
    </Screen>
  )
}

const styles = StyleSheet.create({
  list: { gap: spacing.sm, paddingBottom: spacing.xxxl },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: palette.canvas,
    borderRadius: radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.surfacePressed,
    padding: spacing.lg,
  },
  rowPressed: { backgroundColor: palette.canvasSoft },
  iconBubble: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    backgroundColor: palette.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowBody: { flex: 1, gap: 2 },
  empty: { paddingTop: spacing.xxxl },
  logout: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.xxl,
    padding: spacing.lg,
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.dangerSoft,
    backgroundColor: palette.dangerSoft,
  },
})
