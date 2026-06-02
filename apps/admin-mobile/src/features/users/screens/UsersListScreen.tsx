import { useMemo, useState } from 'react'
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { format } from 'date-fns'
import type { UsersQuery } from '@profixer/api-client'
import { FilterChips } from '@/components/common/FilterChips'
import { Input } from '@/components/ui/Input'
import { ListMeta } from '@/components/common/ListMeta'
import { ListRow } from '@/components/common/ListRow'
import { QueryState } from '@/components/common/QueryState'
import { StatusBadge } from '@/components/common/StatusBadge'
import { Screen } from '@/components/layout/Screen'
import { PermissionGate } from '@/navigation/guards/PermissionGate'
import type { MoreStackParamList } from '@/navigation/types'
import { useGetUsersQuery } from '@/store/api/directoryApi'
import { palette, spacing } from '@/theme'

type UserFilter = 'customer' | 'professional' | 'provider' | 'admin'

const FILTERS: { id: UserFilter; label: string }[] = [
  { id: 'customer', label: 'Customers' },
  { id: 'professional', label: 'Professionals' },
  { id: 'provider', label: 'Providers' },
  { id: 'admin', label: 'Admins' },
]

export function UsersListScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<MoreStackParamList>>()
  const [filter, setFilter] = useState<UserFilter>('customer')
  const [search, setSearch] = useState('')

  const query = useMemo<UsersQuery>(
    () => ({
      page: 1,
      limit: 40,
      user_type: filter,
      scope: filter === 'admin' ? 'members' : 'directory',
      search: search.trim() || undefined,
    }),
    [filter, search],
  )

  const { data, isLoading, isError, refetch, isFetching } = useGetUsersQuery(query)
  const users = data?.users ?? []

  return (
    <PermissionGate webPath="/users/customers">
      <Screen surface="soft">
        <ListMeta
          text={`${data?.pagination.total ?? users.length} ${filter}${
            (data?.pagination.total ?? users.length) === 1 ? '' : 's'
          }`}
        />
        <FilterChips options={FILTERS} value={filter} onChange={setFilter} />
        <View style={styles.searchWrap}>
          <Input
            placeholder="Search name, email, phone…"
            value={search}
            onChangeText={setSearch}
            autoCapitalize="none"
            autoCorrect={false}
            surface="canvas"
          />
        </View>
        <QueryState
          isLoading={isLoading}
          isError={isError}
          onRetry={refetch}
          isEmpty={!isLoading && users.length === 0}
          emptyTitle={`No ${filter}s found`}
          emptyDescription={
            search.trim()
              ? `Nothing matches "${search.trim()}". Try a different name or email.`
              : 'Try another tab or pull down to refresh.'
          }
          emptyIcon="users"
          emptyAction={{ label: 'Refresh', iconLeft: 'refresh', onPress: () => void refetch() }}
        >
          <FlatList
            data={users}
            keyExtractor={(u) => u.id}
            refreshControl={
              <RefreshControl
                refreshing={isFetching}
                onRefresh={refetch}
                tintColor={palette.primary}
              />
            }
            renderItem={({ item }) => {
              const name =
                `${item.firstName ?? ''} ${item.lastName ?? ''}`.trim() || item.email || 'User'
              const meta = `${format(new Date(item.createdAt), 'dd MMM yyyy')} · ${
                item.userType
              }`
              return (
                <ListRow
                  title={name}
                  subtitle={item.email}
                  meta={meta}
                  onPress={() => navigation.navigate('UserDetail', { id: item.id })}
                  right={
                    <StatusBadge
                      status={
                        item.isActive === false
                          ? 'inactive'
                          : item.isVerified
                            ? 'verified'
                            : 'unverified'
                      }
                    />
                  }
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
  searchWrap: { marginTop: spacing.sm, marginBottom: spacing.sm },
  sep: { height: spacing.sm },
})
