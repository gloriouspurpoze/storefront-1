import { Pressable, StyleSheet, View } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { Icon, type IconName } from '@/components/ui/Icon'
import { Text } from '@/components/ui/Text'
import { ScreenHeader } from '@/components/common/ScreenHeader'
import { Screen } from '@/components/layout/Screen'
import { usePermissions } from '@/hooks/usePermissions'
import type { OpsStackParamList } from '@/navigation/types'
import { palette, radius, spacing } from '@/theme'

type HubItem = {
  id: string
  label: string
  subtitle: string
  icon: IconName
  screen: keyof OpsStackParamList
  webPath: string
}

const HUB_ITEMS: HubItem[] = [
  {
    id: 'create-booking',
    label: 'New booking',
    subtitle: 'Quick POS job register',
    icon: 'plus',
    screen: 'CreateBookingWizard',
    webPath: '/operations/pos',
  },
  {
    id: 'bookings',
    label: 'Bookings',
    subtitle: 'Filter, assign, update status',
    icon: 'briefcase',
    screen: 'BookingsList',
    webPath: '/bookings',
  },
  {
    id: 'requests',
    label: 'Requests',
    subtitle: 'Quotes & triage queue',
    icon: 'tag',
    screen: 'ServiceRequestsList',
    webPath: '/requests',
  },
  {
    id: 'map',
    label: 'Live map',
    subtitle: 'Workforce GPS & availability',
    icon: 'map-pin',
    screen: 'LiveMap',
    webPath: '/professionals/live-locations',
  },
  {
    id: 'pros',
    label: 'Professionals',
    subtitle: 'Directory & contact',
    icon: 'users',
    screen: 'ProfessionalsList',
    webPath: '/professionals',
  },
  {
    id: 'apps',
    label: 'Applications',
    subtitle: 'Onboarding queue',
    icon: 'user',
    screen: 'ProviderApplications',
    webPath: '/provider-applications',
  },
  {
    id: 'disputes',
    label: 'Disputes',
    subtitle: 'Open cases',
    icon: 'alert-triangle',
    screen: 'DisputeCases',
    webPath: '/operations/dispute-cases',
  },
]

export function OpsHubScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<OpsStackParamList>>()
  const { checkRouteAccess } = usePermissions()

  const visible = HUB_ITEMS.filter((item) => checkRouteAccess(item.webPath))

  return (
    <Screen scroll surface="canvas">
      <ScreenHeader title="Operations" subtitle="Daily ops tools" large />
      <View style={styles.grid}>
        {visible.map((item) => (
          <Pressable
            key={item.id}
            onPress={() => {
              const screen = item.screen
              if (
                screen === 'BookingDetail' ||
                screen === 'ProfessionalDetail' ||
                screen === 'ServiceRequestDetail'
              ) {
                return
              }
              navigation.navigate(screen)
            }}
            style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
          >
            <View style={styles.iconBubble}>
              <Icon name={item.icon} size={22} color={palette.primary} />
            </View>
            <Text variant="bodyMdStrong" color="ink">
              {item.label}
            </Text>
            <Text variant="caption" color="body">
              {item.subtitle}
            </Text>
          </Pressable>
        ))}
      </View>
    </Screen>
  )
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  card: {
    width: '47%',
    backgroundColor: palette.canvas,
    borderRadius: radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.surfacePressed,
    padding: spacing.lg,
    gap: spacing.xs,
  },
  cardPressed: {
    backgroundColor: palette.canvasSoft,
  },
  iconBubble: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    backgroundColor: palette.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
})
