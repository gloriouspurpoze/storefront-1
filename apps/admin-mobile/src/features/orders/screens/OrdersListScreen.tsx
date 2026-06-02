import { useMemo, useState } from 'react'
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { format } from 'date-fns'
import type { OrderStatus, OrdersQuery } from '@profixer/api-client'
import { FilterChips } from '@/components/common/FilterChips'
import { Input } from '@/components/ui/Input'
import { ListMeta } from '@/components/common/ListMeta'
import { ListRow } from '@/components/common/ListRow'
import { QueryState } from '@/components/common/QueryState'
import { StatusBadge } from '@/components/common/StatusBadge'
import { Screen } from '@/components/layout/Screen'
import { PermissionGate } from '@/navigation/guards/PermissionGate'
import type { MoreStackParamList } from '@/navigation/types'
import { useGetOrdersQuery } from '@/store/api/directoryApi'
import { palette, spacing } from '@/theme'

type OrderFilter = 'all' | 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'

const FILTERS: { id: OrderFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'pending', label: 'Pending' },
  { id: 'processing', label: 'Processing' },
  { id: 'shipped', label: 'Shipped' },
  { id: 'delivered', label: 'Delivered' },
  { id: 'cancelled', label: 'Cancelled' },
]

export function OrdersListScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<MoreStackParamList>>()
  const [filter, setFilter] = useState<OrderFilter>('all')
  const [search, setSearch] = useState('')

  const query = useMemo<OrdersQuery>(
    () => ({
      page: 1,
      limit: 40,
      ...(filter !== 'all' ? { status: filter as OrderStatus } : {}),
      ...(search.trim() ? { search: search.trim() } : {}),
    }),
    [filter, search],
  )

  const { data, isLoading, isError, refetch, isFetching } = useGetOrdersQuery(query)
  const orders = data?.orders ?? []

  return (
    <PermissionGate webPath="/orders">
      <Screen surface="soft">
        <ListMeta text={`${data?.pagination.total ?? orders.length} total`} />
        <FilterChips options={FILTERS} value={filter} onChange={setFilter} />
        <View style={styles.searchWrap}>
          <Input
            placeholder="Search order #, customer, phone…"
            value={search}
            onChangeText={setSearch}
            autoCapitalize="none"
            autoCorrect={false}
            surface="canvas"
          />
        </View>
        <QueryState
          isLoading={isLoading}
          isError={isError}
          onRetry={refetch}
          isEmpty={!isLoading && orders.length === 0}
          emptyTitle={filter === 'all' ? 'No orders yet' : `No ${filter} orders`}
          emptyDescription={
            filter === 'all'
              ? 'Product orders placed by customers will appear here.'
              : 'Try another filter or pull down to refresh.'
          }
          emptyIcon="tag"
          emptyAction={{ label: 'Refresh', iconLeft: 'refresh', onPress: () => void refetch() }}
        >
          <FlatList
            data={orders}
            keyExtractor={(o) => String(o.id ?? o._id ?? Math.random())}
            refreshControl={
              <RefreshControl
                refreshing={isFetching}
                onRefresh={refetch}
                tintColor={palette.primary}
              />
            }
            renderItem={({ item }) => {
              const customerName = item.customer
                ? `${item.customer.firstName ?? ''} ${item.customer.lastName ?? ''}`.trim() ||
                  item.customer.email ||
                  'Customer'
                : 'Customer'
              const id = String(item.id ?? item._id ?? '')
              return (
                <ListRow
                  title={`#${item.orderNumber}`}
                  subtitle={`${customerName} · ₹${item.totalAmount.toLocaleString('en-IN')}`}
                  meta={`${format(new Date(item.createdAt), 'dd MMM yyyy')} · ${item.paymentStatus}`}
                  onPress={() => navigation.navigate('OrderDetail', { id })}
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

const styles = StyleSheet.create({
  searchWrap: { marginTop: spacing.sm, marginBottom: spacing.sm },
  sep: { height: spacing.sm },
})
