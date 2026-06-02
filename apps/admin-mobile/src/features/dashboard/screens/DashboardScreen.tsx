import { FlatList, Pressable, RefreshControl, StyleSheet, View } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { KpiCard } from '@/components/common/KpiCard'
import { ListRow } from '@/components/common/ListRow'
import { QueryState } from '@/components/common/QueryState'
import { ScreenHeader } from '@/components/common/ScreenHeader'
import { Screen } from '@/components/layout/Screen'
import { Icon } from '@/components/ui/Icon'
import { PermissionGate } from '@/navigation/guards/PermissionGate'
import { usePermissions } from '@/hooks/usePermissions'
import type { HomeStackParamList } from '@/navigation/types'
import { useGetAdminDashboardQuery } from '@/store/api/dashboardApi'
import { palette, radius, spacing } from '@/theme'

export function DashboardScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<HomeStackParamList>>()
  const { checkRouteAccess } = usePermissions()
  const { data, isLoading, isError, refetch, isFetching } = useGetAdminDashboardQuery()
  const canAnalytics = checkRouteAccess('/analytics')

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
              label="Providers"
              value={String(data?.stats.activeProviders ?? 0)}
              icon="users"
            />
            <KpiCard
              label="Rating"
              value={(data?.stats.averageRating ?? 0).toFixed(1)}
              icon="star"
            />
          </View>
          <ScreenHeader title="Recent activity" subtitle="Latest bookings & orders" />
          <FlatList
            data={data?.recentOrders ?? []}
            keyExtractor={(item) => item.id}
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
  sep: { height: spacing.sm },
})
