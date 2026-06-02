import { useMemo, useState } from 'react'
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import type { RefundStatus } from '@profixer/api-client'
import { FilterChips } from '@/components/common/FilterChips'
import { ListMeta } from '@/components/common/ListMeta'
import { ListRow } from '@/components/common/ListRow'
import { QueryState } from '@/components/common/QueryState'
import { StatusBadge } from '@/components/common/StatusBadge'
import { Screen } from '@/components/layout/Screen'
import { PermissionGate } from '@/navigation/guards/PermissionGate'
import type { InboxStackParamList } from '@/navigation/types'
import { useGetRefundQueueQuery } from '@/store/api/financeApi'
import { palette, spacing } from '@/theme'

const FILTERS: { id: RefundStatus; label: string }[] = [
  { id: 'pending', label: 'Pending' },
  { id: 'approved', label: 'Approved' },
  { id: 'rejected', label: 'Rejected' },
  { id: 'completed', label: 'Completed' },
]

export function RefundRequestsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<InboxStackParamList>>()
  const [status, setStatus] = useState<RefundStatus>('pending')
  const params = useMemo(() => ({ status }), [status])
  const { data, isLoading, isError, refetch, isFetching } = useGetRefundQueueQuery(params)

  const tickets = data?.tickets ?? []

  return (
    <PermissionGate webPath="/support/refund-requests">
      <Screen surface="soft">
        <ListMeta text={`${data?.pagination.total ?? tickets.length} ${status}`} />
        <FilterChips options={FILTERS} value={status} onChange={setStatus} />
        <QueryState
          isLoading={isLoading}
          isError={isError}
          onRetry={refetch}
          isEmpty={!isLoading && tickets.length === 0}
          emptyTitle="No refund requests"
          emptyDescription="Pull to refresh, or change the filter."
        >
          <FlatList
            data={tickets}
            keyExtractor={(t) => t._id}
            refreshControl={
              <RefreshControl
                refreshing={isFetching}
                onRefresh={refetch}
                tintColor={palette.primary}
              />
            }
            renderItem={({ item }) => (
              <ListRow
                title={item.subject}
                subtitle={`#${item.ticketNumber}`}
                meta={
                  item.refundRequest?.amountRequested != null
                    ? `₹${item.refundRequest.amountRequested.toLocaleString('en-IN')}`
                    : undefined
                }
                onPress={() => navigation.navigate('RefundDetail', { ticketId: item._id })}
                right={<StatusBadge status={item.refundRequest?.status ?? item.status} />}
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
  sep: { height: spacing.sm },
})
