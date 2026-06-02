import { useMemo, useState } from 'react'
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { format } from 'date-fns'
import { FilterChips } from '@/components/common/FilterChips'
import { ListMeta } from '@/components/common/ListMeta'
import { ListRow } from '@/components/common/ListRow'
import { QueryState } from '@/components/common/QueryState'
import { Screen } from '@/components/layout/Screen'
import { PermissionGate } from '@/navigation/guards/PermissionGate'
import type { OpsStackParamList } from '@/navigation/types'
import { useGetServiceRequestsQuery } from '@/store/api/phase2Api'
import { palette, spacing } from '@/theme'

type RequestFilter = 'all' | 'open' | 'quoted' | 'in_progress'

const FILTERS: { id: RequestFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'open', label: 'Open' },
  { id: 'quoted', label: 'Quoted' },
  { id: 'in_progress', label: 'In progress' },
]

export function ServiceRequestsListScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<OpsStackParamList>>()
  const [filter, setFilter] = useState<RequestFilter>('all')

  const query = useMemo(
    () => ({
      limit: 40,
      page: 1,
      ...(filter !== 'all' ? { status: filter } : {}),
    }),
    [filter],
  )

  const { data, isLoading, isError, refetch, isFetching } = useGetServiceRequestsQuery(query)
  const rows = data?.serviceRequests ?? []

  return (
    <PermissionGate webPath="/requests">
      <Screen surface="soft">
        <ListMeta text={`${data?.pagination.total ?? rows.length} total`} />
        <FilterChips options={FILTERS} value={filter} onChange={setFilter} />
        <QueryState
          isLoading={isLoading}
          isError={isError}
          onRetry={refetch}
          isEmpty={!isLoading && rows.length === 0}
          emptyTitle="No requests"
          emptyDescription="Try another filter or pull to refresh."
        >
          <FlatList
            data={rows}
            keyExtractor={(r) => r.id}
            refreshControl={
              <RefreshControl refreshing={isFetching} onRefresh={refetch} tintColor={palette.primary} />
            }
            renderItem={({ item }) => (
              <ListRow
                title={item.title}
                subtitle={`${item.serviceType} · ${item.status}`}
                meta={`${item.urgency} · ${format(new Date(item.createdAt), 'dd MMM yyyy')}`}
                onPress={() => navigation.navigate('ServiceRequestDetail', { id: item.id })}
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
