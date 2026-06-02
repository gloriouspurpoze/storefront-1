import { FlatList, RefreshControl, StyleSheet, View } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { formatDistanceToNow } from 'date-fns'
import { ListMeta } from '@/components/common/ListMeta'
import { ListRow } from '@/components/common/ListRow'
import { QueryState } from '@/components/common/QueryState'
import { Screen } from '@/components/layout/Screen'
import { PermissionGate } from '@/navigation/guards/PermissionGate'
import type { ChatStackParamList } from '@/navigation/types'
import { useGetConversationsQuery } from '@/store/api/chatApi'
import { colors } from '@/theme/colors'

export function ChatInboxScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<ChatStackParamList>>()
  const { data = [], isLoading, isError, refetch, isFetching } = useGetConversationsQuery({ support: true })

  return (
    <PermissionGate webPath="/chat">
      <Screen surface="soft">
        <ListMeta text="Support & booking threads" />
        <QueryState
          isLoading={isLoading}
          isError={isError}
          onRetry={refetch}
          isEmpty={!isLoading && data.length === 0}
          emptyTitle="No conversations"
        >
          <FlatList
            data={data}
            keyExtractor={(c) => c._id}
            refreshControl={<RefreshControl refreshing={isFetching} onRefresh={refetch} tintColor={colors.primary} />}
            renderItem={({ item }) => {
              const p = item.participants?.[0]?.userId
              const name =
                item.title ||
                (p ? `${p.firstName} ${p.lastName}`.trim() : 'Conversation')
              const preview = item.lastMessage?.text ?? 'No messages yet'
              const when = item.lastMessage?.sentAt
                ? formatDistanceToNow(new Date(item.lastMessage.sentAt), { addSuffix: true })
                : ''
              return (
                <ListRow
                  title={name}
                  subtitle={preview}
                  meta={when}
                  onPress={() => navigation.navigate('ChatThread', { threadId: item._id })}
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

const styles = StyleSheet.create({ sep: { height: 8 } })
