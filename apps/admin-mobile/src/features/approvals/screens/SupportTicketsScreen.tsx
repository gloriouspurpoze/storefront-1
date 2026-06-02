import { FlatList, RefreshControl, StyleSheet, View } from 'react-native'
import { ListMeta } from '@/components/common/ListMeta'
import { ListRow } from '@/components/common/ListRow'
import { QueryState } from '@/components/common/QueryState'
import { StatusBadge } from '@/components/common/StatusBadge'
import { Screen } from '@/components/layout/Screen'
import { PermissionGate } from '@/navigation/guards/PermissionGate'
import { useGetSupportTicketsQuery } from '@/store/api/opsApi'
import { colors } from '@/theme/colors'

export function SupportTicketsScreen() {
  const { data, isLoading, isError, refetch, isFetching } = useGetSupportTicketsQuery()

  const tickets = data?.tickets ?? []

  return (
    <PermissionGate webPath="/support/tickets">
      <Screen>
        <ListMeta text={`${tickets.length} tickets`} />
        <QueryState
          isLoading={isLoading}
          isError={isError}
          onRetry={refetch}
          isEmpty={!isLoading && tickets.length === 0}
          emptyTitle="No tickets"
        >
          <FlatList
            data={tickets}
            keyExtractor={(t) => t._id}
            refreshControl={<RefreshControl refreshing={isFetching} onRefresh={refetch} tintColor={colors.primary} />}
            renderItem={({ item }) => (
              <ListRow
                title={item.subject}
                subtitle={item.ticketNumber}
                meta={item.category}
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
