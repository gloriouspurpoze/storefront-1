import { useMemo, useState } from 'react'
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { format } from 'date-fns'
import { FilterChips } from '@/components/common/FilterChips'
import { ListMeta } from '@/components/common/ListMeta'
import { ListRow } from '@/components/common/ListRow'
import { QueryState } from '@/components/common/QueryState'
import { StatusBadge } from '@/components/common/StatusBadge'
import { Screen } from '@/components/layout/Screen'
import { bookingListQuery, type BookingListFilter } from '@/lib/bookingWorkflow'
import { PermissionGate } from '@/navigation/guards/PermissionGate'
import type { OpsStackParamList } from '@/navigation/types'
import { useGetBookingsQuery } from '@/store/api/bookingsApi'
import { palette, spacing } from '@/theme'

const FILTERS: { id: BookingListFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'today', label: 'Today' },
  { id: 'pending', label: 'Pending' },
  { id: 'in_progress', label: 'In progress' },
]

export function BookingsListScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<OpsStackParamList>>()
  const [filter, setFilter] = useState<BookingListFilter>('all')

  const query = useMemo(() => ({ limit: 40, page: 1, ...bookingListQuery(filter) }), [filter])
  const { data, isLoading, isError, refetch, isFetching } = useGetBookingsQuery(query)

  const bookings = data?.bookings ?? []

  return (
    <PermissionGate webPath="/bookings">
      <Screen surface="soft">
        <ListMeta text={`${data?.pagination.total ?? bookings.length} total`} />
        <FilterChips options={FILTERS} value={filter} onChange={setFilter} />
        <QueryState
          isLoading={isLoading}
          isError={isError}
          onRetry={refetch}
          isEmpty={!isLoading && bookings.length === 0}
          emptyTitle={filter === 'all' ? 'No bookings yet' : `No ${filter.replace('_', ' ')} bookings`}
          emptyDescription={
            filter === 'all'
              ? 'Create a job manually or wait for customer requests.'
              : 'Switch the filter or pull down to refresh.'
          }
          emptyIcon="briefcase"
          emptyAction={{
            label: 'New booking',
            iconLeft: 'plus',
            onPress: () => navigation.navigate('CreateBookingWizard'),
          }}
          emptySecondaryAction={{ label: 'Refresh', iconLeft: 'refresh', onPress: () => void refetch() }}
        >
          <FlatList
            data={bookings}
            keyExtractor={(b) => b.id || b._id || String(Math.random())}
            refreshControl={
              <RefreshControl refreshing={isFetching} onRefresh={refetch} tintColor={palette.primary} />
            }
            renderItem={({ item }) => {
              const title = item.serviceName || item.bookingNumber || `Booking ${item.id}`
              const customer =
                item.customerName ||
                [item.customer?.firstName, item.customer?.lastName].filter(Boolean).join(' ') ||
                'Customer'
              const date = item.scheduledDate
                ? format(new Date(item.scheduledDate), 'dd MMM yyyy')
                : item.createdAt
                  ? format(new Date(item.createdAt), 'dd MMM yyyy')
                  : ''
              return (
                <ListRow
                  title={title}
                  subtitle={`${customer} · ${date}`}
                  meta={item.totalAmount != null ? `₹${item.totalAmount.toLocaleString('en-IN')}` : undefined}
                  onPress={() => navigation.navigate('BookingDetail', { id: item.id || item._id! })}
                  right={<StatusBadge status={item.status} />}
                />
              )
            }}
            ItemSeparatorComponent={() => <View style={styles.sep} />}
          />
        </QueryState>
      </Screen>
    </PermissionGate>
  )
}

const styles = StyleSheet.create({ sep: { height: spacing.sm } })
