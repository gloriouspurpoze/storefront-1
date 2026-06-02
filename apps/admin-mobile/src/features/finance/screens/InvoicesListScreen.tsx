import { useMemo, useState } from 'react'
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { format } from 'date-fns'
import type { InvoiceStatus } from '@profixer/api-client'
import { FilterChips } from '@/components/common/FilterChips'
import { ListMeta } from '@/components/common/ListMeta'
import { ListRow } from '@/components/common/ListRow'
import { QueryState } from '@/components/common/QueryState'
import { StatusBadge } from '@/components/common/StatusBadge'
import { Screen } from '@/components/layout/Screen'
import { PermissionGate } from '@/navigation/guards/PermissionGate'
import type { MoreStackParamList } from '@/navigation/types'
import { useGetInvoicesQuery } from '@/store/api/financeApi'
import { palette, spacing } from '@/theme'

type InvoiceFilter = 'all' | 'issued' | 'paid' | 'cancelled'

const FILTERS: { id: InvoiceFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'issued', label: 'Issued' },
  { id: 'paid', label: 'Paid' },
  { id: 'cancelled', label: 'Cancelled' },
]

export function InvoicesListScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<MoreStackParamList>>()
  const [filter, setFilter] = useState<InvoiceFilter>('all')

  const query = useMemo(
    () => ({
      page: 1,
      limit: 40,
      ...(filter !== 'all' ? { status: filter as InvoiceStatus } : {}),
    }),
    [filter],
  )

  const { data, isLoading, isError, refetch, isFetching } = useGetInvoicesQuery(query)
  const invoices = data?.invoices ?? []

  return (
    <PermissionGate webPath="/invoices">
      <Screen surface="soft">
        <ListMeta text={`${data?.pagination.total ?? invoices.length} total`} />
        <FilterChips options={FILTERS} value={filter} onChange={setFilter} />
        <QueryState
          isLoading={isLoading}
          isError={isError}
          onRetry={refetch}
          isEmpty={!isLoading && invoices.length === 0}
          emptyTitle="No invoices"
          emptyDescription="Try a different filter or pull to refresh."
        >
          <FlatList
            data={invoices}
            keyExtractor={(inv) => inv._id}
            refreshControl={
              <RefreshControl
                refreshing={isFetching}
                onRefresh={refetch}
                tintColor={palette.primary}
              />
            }
            renderItem={({ item }) => {
              const cust = item.customerId
              const customerName =
                cust && typeof cust === 'object'
                  ? `${cust.firstName ?? ''} ${cust.lastName ?? ''}`.trim() || cust.email || 'Customer'
                  : 'Customer'
              const date = item.issuedDate ?? item.createdAt
              return (
                <ListRow
                  title={`#${item.invoiceNumber}`}
                  subtitle={`${customerName} · ₹${(item.totalAmount ?? 0).toLocaleString('en-IN')}`}
                  meta={`${format(new Date(date), 'dd MMM yyyy')} · ${item.status}`}
                  onPress={() => navigation.navigate('InvoiceDetail', { id: item._id })}
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
