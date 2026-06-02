import { FlatList, RefreshControl, StyleSheet, View } from 'react-native'
import { ListRow } from '@/components/common/ListRow'
import { QueryState } from '@/components/common/QueryState'
import { StatusBadge } from '@/components/common/StatusBadge'
import { ScreenHeader } from '@/components/common/ScreenHeader'
import { Screen } from '@/components/layout/Screen'
import { useGetProviderBookingsQuery } from '@/store/api/bookingsApi'
import { colors } from '@/theme/colors'

export function ProviderBookingsScreen() {
  const { data, isLoading, isError, refetch, isFetching } = useGetProviderBookingsQuery({ limit: 30 })
  const bookings = data?.bookings ?? []

  return (
    <Screen>
      <ScreenHeader title="My bookings" />
      <QueryState
        isLoading={isLoading}
        isError={isError}
        onRetry={refetch}
        isEmpty={!isLoading && bookings.length === 0}
        emptyTitle="No bookings"
      >
        <FlatList
          data={bookings}
          keyExtractor={(b) => b.id || b._id!}
          refreshControl={<RefreshControl refreshing={isFetching} onRefresh={refetch} tintColor={colors.primary} />}
          renderItem={({ item }) => (
            <ListRow
              title={item.serviceName || item.bookingNumber || 'Booking'}
              subtitle={item.customerName}
              meta={item.scheduledDate}
              right={<StatusBadge status={item.status} />}
            />
          )}
          ItemSeparatorComponent={() => <View style={styles.sep} />}
        />
      </QueryState>
    </Screen>
  )
}

const styles = StyleSheet.create({ sep: { height: 8 } })
