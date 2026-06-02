import { FlatList, RefreshControl, StyleSheet, View } from 'react-native'
import { formatDistanceToNow } from 'date-fns'
import { ListMeta } from '@/components/common/ListMeta'
import { ListRow } from '@/components/common/ListRow'
import { QueryState } from '@/components/common/QueryState'
import { Screen } from '@/components/layout/Screen'
import { PermissionGate } from '@/navigation/guards/PermissionGate'
import {
  useGetNotificationsQuery,
  useMarkNotificationReadMutation,
} from '@/store/api/notificationsApi'
import { colors } from '@/theme/colors'

export function NotificationsScreen() {
  const { data = [], isLoading, isError, refetch, isFetching } = useGetNotificationsQuery()
  const [markRead] = useMarkNotificationReadMutation()

  return (
    <PermissionGate webPath="/notifications">
      <Screen>
        <ListMeta text={`${data.length} alerts`} />
        <QueryState
          isLoading={isLoading}
          isError={isError}
          onRetry={refetch}
          isEmpty={!isLoading && data.length === 0}
          emptyTitle="All caught up"
        >
          <FlatList
            data={data}
            keyExtractor={(n) => n.id}
            refreshControl={<RefreshControl refreshing={isFetching} onRefresh={refetch} tintColor={colors.primary} />}
            renderItem={({ item }) => (
              <ListRow
                title={item.title}
                subtitle={item.body || item.message}
                meta={formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                onPress={() => {
                  if (!item.isRead) markRead(item.id)
                }}
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
