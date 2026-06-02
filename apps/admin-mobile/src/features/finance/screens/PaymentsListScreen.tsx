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
import { PermissionGate } from '@/navigation/guards/PermissionGate'
import type { MoreStackParamList } from '@/navigation/types'
import { useGetPaymentsQuery } from '@/store/api/financeApi'
import { palette, spacing } from '@/theme'

type PaymentFilter = 'all' | 'completed' | 'pending' | 'failed' | 'refunded'

const FILTERS: { id: PaymentFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'completed', label: 'Completed' },
  { id: 'pending', label: 'Pending' },
  { id: 'failed', label: 'Failed' },
  { id: 'refunded', label: 'Refunded' },
]

export function PaymentsListScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<MoreStackParamList>>()
  const [filter, setFilter] = useState<PaymentFilter>('all')

  const query = useMemo(
    () => ({
      page: 1,
      limit: 40,
      ...(filter !== 'all' ? { status: filter } : {}),
    }),
    [filter],
  )

  const { data, isLoading, isError, refetch, isFetching } = useGetPaymentsQuery(query)
  const payments = data?.payments ?? []

  return (
    <PermissionGate webPath="/payments">
      <Screen surface="soft">
        <ListMeta text={`${data?.pagination.total ?? payments.length} total`} />
        <FilterChips options={FILTERS} value={filter} onChange={setFilter} />
        <QueryState
          isLoading={isLoading}
          isError={isError}
          onRetry={refetch}
          isEmpty={!isLoading && payments.length === 0}
          emptyTitle="No payments"
          emptyDescription="Try a different filter or pull to refresh."
        >
          <FlatList
            data={payments}
            keyExtractor={(p) => String(p._id ?? p.id ?? Math.random())}
            refreshControl={
              <RefreshControl
                refreshing={isFetching}
                onRefresh={refetch}
                tintColor={palette.primary}
              />
            }
            renderItem={({ item }) => {
              const customer =
                item.customerId && typeof item.customerId === 'object'
                  ? `${item.customerId.firstName ?? ''} ${item.customerId.lastName ?? ''}`.trim() ||
                    item.customerId.email ||
                    'Customer'
                  : 'Customer'
              const id = String(item._id ?? item.id ?? '')
              return (
                <ListRow
                  title={`₹${item.amount.toLocaleString('en-IN')}`}
                  subtitle={`${customer} · ${item.paymentMethod ?? 'unknown'}`}
                  meta={`${format(new Date(item.createdAt), 'dd MMM yyyy · HH:mm')}`}
                  onPress={() => navigation.navigate('PaymentDetail', { id })}
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
  sep: { height: spacing.sm },
})
