import { useMemo } from 'react'
import { FlatList, Pressable, RefreshControl, StyleSheet, View } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs'
import { KpiCard } from '@/components/common/KpiCard'
import { ListRow } from '@/components/common/ListRow'
import { QueryState } from '@/components/common/QueryState'
import { ScreenHeader } from '@/components/common/ScreenHeader'
import { StatusBadge } from '@/components/common/StatusBadge'
import { Screen } from '@/components/layout/Screen'
import { Icon, type IconName } from '@/components/ui/Icon'
import { Text } from '@/components/ui/Text'
import { PermissionGate } from '@/navigation/guards/PermissionGate'
import { usePermissions } from '@/hooks/usePermissions'
import { useVerticalLabels } from '@/hooks/useVerticalLabels'
import { safeFormatFirst } from '@/lib/datetime'
import type { AdminTabParamList, HomeStackParamList, OpsStackParamList } from '@/navigation/types'
import { useGetAdminDashboardQuery } from '@/store/api/dashboardApi'
import { useGetBookingsQuery } from '@/store/api/bookingsApi'
import { useGetProfessionalsQuery } from '@/store/api/opsApi'
import { palette, radius, spacing } from '@/theme'

type QuickAction = {
  id: string
  label: string
  icon: IconName
  webPath: string
  opsScreen: keyof OpsStackParamList
}

export function DashboardScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<HomeStackParamList>>()
  const { checkRouteAccess } = usePermissions()
  const labels = useVerticalLabels()
  const { data, isLoading, isError, refetch, isFetching } = useGetAdminDashboardQuery()
  const canBookings = checkRouteAccess('/bookings')
  const { data: bookingsData, isFetching: bookingsFetching } = useGetBookingsQuery(
    { limit: 5, page: 1 },
    { skip: !canBookings },
  )
  const canProfessionals = checkRouteAccess('/professionals')
  const { data: professionalsData } = useGetProfessionalsQuery(
    { limit: 1 },
    { skip: !canProfessionals },
  )
  const canAnalytics = checkRouteAccess('/analytics')

  // De-duplicate by id — the list endpoint can echo the same row across pages,
  // which otherwise renders the same booking multiple times on the dashboard.
  const recentBookings = useMemo(() => {
    const rows = bookingsData?.bookings ?? []
    const seen = new Set<string>()
    const out: typeof rows = []
    for (const b of rows) {
      const key = b.id || b._id
      if (!key || seen.has(key)) continue
      seen.add(key)
      out.push(b)
    }
    return out
  }, [bookingsData])

  // Workforce count (e.g. 2 professionals) is more meaningful here than the
  // provider-company count, and stays accurate against the professionals list.
  const workforceCount = professionalsData?.pagination?.total
  const providersValue =
    canProfessionals && workforceCount != null
      ? workforceCount
      : (data?.stats.activeProviders ?? 0)
  const providersLabel = canProfessionals
    ? `${labels.workforceSingular}s`
    : 'Providers'

  const quickActions = useMemo<QuickAction[]>(
    () =>
      [
        {
          id: 'bookings',
          label: labels.engagementPlural,
          icon: 'briefcase' as IconName,
          webPath: '/bookings',
          opsScreen: 'BookingsList' as keyof OpsStackParamList,
        },
        {
          id: 'new-booking',
          label: `New ${labels.engagementSingular.toLowerCase()}`,
          icon: 'plus' as IconName,
          webPath: '/operations/pos',
          opsScreen: 'CreateBookingWizard' as keyof OpsStackParamList,
        },
        {
          id: 'requests',
          label: 'Requests',
          icon: 'tag' as IconName,
          webPath: '/requests',
          opsScreen: 'ServiceRequestsList' as keyof OpsStackParamList,
        },
        {
          id: 'professionals',
          label: `${labels.workforceSingular}s`,
          icon: 'users' as IconName,
          webPath: '/professionals',
          opsScreen: 'ProfessionalsList' as keyof OpsStackParamList,
        },
      ].filter((action) => checkRouteAccess(action.webPath)),
    [labels, checkRouteAccess],
  )

  const openOpsScreen = (screen: keyof OpsStackParamList) => {
    navigation
      .getParent<BottomTabNavigationProp<AdminTabParamList>>()
      ?.navigate('OpsTab', { screen } as never)
  }

  return (
    <PermissionGate webPath="/">
      <Screen scroll surface="canvas">
        <View style={styles.titleRow}>
          <ScreenHeader title="Dashboard" subtitle="Ops overview" large />
          {canAnalytics ? (
            <Pressable
              style={styles.analyticsLink}
              onPress={() => navigation.navigate('Analytics')}
              accessibilityRole="button"
            >
              <Icon name="trending-up" size={18} color={palette.primary} />
            </Pressable>
          ) : null}
        </View>
        <QueryState isLoading={isLoading} isError={isError} onRetry={refetch}>
          <View style={styles.kpis}>
            <KpiCard
              label="Revenue"
              value={`₹${(data?.stats.totalRevenue ?? 0).toLocaleString('en-IN')}`}
              icon="trending-up"
              accent
            />
            <KpiCard
              label="Orders"
              value={String(data?.stats.totalOrders ?? 0)}
              icon="briefcase"
            />
            <KpiCard
              label={providersLabel}
              value={String(providersValue)}
              icon="users"
            />
            <KpiCard
              label="Rating"
              value={(data?.stats.averageRating ?? 0).toFixed(1)}
              icon="star"
            />
          </View>
          {quickActions.length > 0 ? (
            <View style={styles.quickActions}>
              {quickActions.map((action) => (
                <Pressable
                  key={action.id}
                  onPress={() => openOpsScreen(action.opsScreen)}
                  accessibilityRole="button"
                  style={({ pressed }) => [styles.quickAction, pressed && styles.quickActionPressed]}
                >
                  <View style={styles.quickActionIcon}>
                    <Icon name={action.icon} size={20} color={palette.primary} />
                  </View>
                  <Text variant="caption" color="ink" style={styles.quickActionLabel}>
                    {action.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          ) : null}
          {canBookings ? (
            <>
              <View style={styles.sectionRow}>
                <ScreenHeader
                  title={labels.recentTitle}
                  subtitle={`Latest ${labels.engagementPlural.toLowerCase()}`}
                />
                {recentBookings.length > 0 ? (
                  <Pressable onPress={() => openOpsScreen('BookingsList')} accessibilityRole="button">
                    <Text variant="bodySmStrong" color="primary">
                      View all
                    </Text>
                  </Pressable>
                ) : null}
              </View>
              <FlatList
                data={recentBookings}
                keyExtractor={(item, index) => item.id || item._id || `booking-${index}`}
                scrollEnabled={false}
                refreshControl={
                  <RefreshControl
                    refreshing={isFetching || bookingsFetching}
                    onRefresh={refetch}
                    tintColor={palette.primary}
                  />
                }
                ListEmptyComponent={
                  <Text variant="bodySm" color="body" style={styles.emptyText}>
                    {`No ${labels.engagementPlural.toLowerCase()} yet.`}
                  </Text>
                }
                renderItem={({ item }) => {
                  const customer =
                    item.customerName ||
                    [item.customer?.firstName, item.customer?.lastName].filter(Boolean).join(' ') ||
                    'Customer'
                  const date = safeFormatFirst([item.scheduledDate, item.createdAt], 'dd MMM yyyy', '')
                  const amount =
                    item.totalAmount != null ? `₹${item.totalAmount.toLocaleString('en-IN')}` : ''
                  return (
                    <ListRow
                      title={item.serviceName || item.bookingNumber || labels.engagementSingular}
                      subtitle={[customer, date].filter(Boolean).join(' · ')}
                      meta={amount || undefined}
                      right={<StatusBadge status={item.status} />}
                      onPress={() =>
                        navigation.navigate('BookingDetail', { id: item.id || item._id! })
                      }
                    />
                  )
                }}
                ItemSeparatorComponent={() => <View style={styles.sep} />}
              />
            </>
          ) : (
            <>
              <ScreenHeader title="Recent activity" subtitle="Latest orders" />
              <FlatList
                data={data?.recentOrders ?? []}
                keyExtractor={(item, index) => item.id || `order-${index}`}
                scrollEnabled={false}
                refreshControl={
                  <RefreshControl refreshing={isFetching} onRefresh={refetch} tintColor={palette.primary} />
                }
                ListEmptyComponent={null}
                renderItem={({ item }) => (
                  <ListRow
                    title={item.service}
                    subtitle={item.customer}
                    meta={`₹${item.amount.toLocaleString('en-IN')} · ${item.status}`}
                    onPress={() => navigation.navigate('BookingDetail', { id: item.id })}
                  />
                )}
                ItemSeparatorComponent={() => <View style={styles.sep} />}
              />
            </>
          )}
        </QueryState>
      </Screen>
    </PermissionGate>
  )
}

const styles = StyleSheet.create({
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  analyticsLink: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    backgroundColor: palette.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.sm,
  },
  kpis: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing.xs,
  },
  quickActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  quickAction: {
    flexGrow: 1,
    flexBasis: '22%',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xs,
    backgroundColor: palette.canvas,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.surfacePressed,
  },
  quickActionPressed: {
    backgroundColor: palette.canvasSoft,
  },
  quickActionIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    backgroundColor: palette.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActionLabel: {
    textAlign: 'center',
  },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  emptyText: {
    paddingVertical: spacing.md,
  },
  sep: { height: spacing.sm },
})
