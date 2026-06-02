import { FlatList, RefreshControl, StyleSheet, View } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { ListMeta } from '@/components/common/ListMeta'
import { ListRow } from '@/components/common/ListRow'
import { QueryState } from '@/components/common/QueryState'
import { StatusBadge } from '@/components/common/StatusBadge'
import { Screen } from '@/components/layout/Screen'
import type { OpsStackParamList } from '@/navigation/types'
import { useGetProfessionalsQuery } from '@/store/api/opsApi'
import { palette, spacing } from '@/theme'

export function ProfessionalsListScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<OpsStackParamList>>()
  const { data, isLoading, isError, refetch, isFetching } = useGetProfessionalsQuery({ limit: 30 })

  const list = data?.professionals ?? []

  return (
    <Screen surface="soft">
      <ListMeta text={`${data?.pagination.total ?? list.length} total`} />
      <QueryState
        isLoading={isLoading}
        isError={isError}
        onRetry={refetch}
        isEmpty={!isLoading && list.length === 0}
        emptyTitle="No professionals"
      >
        <FlatList
          data={list}
          keyExtractor={(p) => p._id || p.id}
          refreshControl={
            <RefreshControl refreshing={isFetching} onRefresh={refetch} tintColor={palette.primary} />
          }
          renderItem={({ item }) => (
            <ListRow
              title={`${item.firstName} ${item.lastName}`.trim()}
              subtitle={item.email}
              meta={item.phoneNumber}
              onPress={() =>
                navigation.navigate('ProfessionalDetail', {
                  id: item.professionalId || item._id || item.id,
                })
              }
              right={<StatusBadge status={item.availability ?? 'offline'} />}
            />
          )}
          ItemSeparatorComponent={() => <View style={styles.sep} />}
        />
      </QueryState>
    </Screen>
  )
}

const styles = StyleSheet.create({ sep: { height: spacing.sm } })
