import { FlatList, RefreshControl, StyleSheet, View } from 'react-native'
import { format } from 'date-fns'
import { ListMeta } from '@/components/common/ListMeta'
import { ListRow } from '@/components/common/ListRow'
import { QueryState } from '@/components/common/QueryState'
import { StatusBadge } from '@/components/common/StatusBadge'
import { Screen } from '@/components/layout/Screen'
import { PermissionGate } from '@/navigation/guards/PermissionGate'
import { useGetApplicationsQuery } from '@/store/api/opsApi'
import { colors } from '@/theme/colors'

export function ProviderApplicationsScreen() {
  const { data = [], isLoading, isError, refetch, isFetching } = useGetApplicationsQuery({ limit: 40 })

  return (
    <PermissionGate webPath="/provider-applications">
      <Screen>
        <ListMeta text="Provider onboarding queue" hint={`${data.length} pending`} />
        <QueryState
          isLoading={isLoading}
          isError={isError}
          onRetry={refetch}
          isEmpty={!isLoading && data.length === 0}
          emptyTitle="No applications"
        >
          <FlatList
            data={data}
            keyExtractor={(a) => a._id}
            refreshControl={<RefreshControl refreshing={isFetching} onRefresh={refetch} tintColor={colors.primary} />}
            renderItem={({ item }) => (
              <ListRow
                title={item.fullName}
                subtitle={`${item.city} · ${item.phone}`}
                meta={format(new Date(item.createdAt), 'dd MMM yyyy')}
                right={<StatusBadge status={item.status} />}
              />
            )}
            ItemSeparatorComponent={() => <View style={styles.sep} />}
          />
        </QueryState>
      </Screen>
    </PermissionGate>
  )
}

const styles = StyleSheet.create({ sep: { height: 8 } })
