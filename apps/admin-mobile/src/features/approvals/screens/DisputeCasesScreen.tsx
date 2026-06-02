import { FlatList, RefreshControl, StyleSheet, View } from 'react-native'
import { ListMeta } from '@/components/common/ListMeta'
import { ListRow } from '@/components/common/ListRow'
import { QueryState } from '@/components/common/QueryState'
import { StatusBadge } from '@/components/common/StatusBadge'
import { Screen } from '@/components/layout/Screen'
import { PermissionGate } from '@/navigation/guards/PermissionGate'
import { useGetDisputesQuery } from '@/store/api/opsApi'
import { colors } from '@/theme/colors'

export function DisputeCasesScreen() {
  const { data, isLoading, isError, refetch, isFetching } = useGetDisputesQuery({ limit: 30 })

  const cases = data?.cases ?? []

  return (
    <PermissionGate webPath="/operations/dispute-cases">
      <Screen>
        <ListMeta text={`${data?.pagination.total ?? cases.length} cases`} />
        <QueryState
          isLoading={isLoading}
          isError={isError}
          onRetry={refetch}
          isEmpty={!isLoading && cases.length === 0}
          emptyTitle="No dispute cases"
        >
          <FlatList
            data={cases}
            keyExtractor={(c) => c._id}
            refreshControl={<RefreshControl refreshing={isFetching} onRefresh={refetch} tintColor={colors.primary} />}
            renderItem={({ item }) => (
              <ListRow
                title={item.title}
                subtitle={item.disputeCaseNumber}
                meta={item.priority}
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
