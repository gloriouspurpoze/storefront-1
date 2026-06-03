import { useMemo, useState } from 'react'
import { Alert, FlatList, RefreshControl, StyleSheet, View } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import type { AdminCategory, CategoryType, ListCategoriesQuery } from '@profixer/api-client'
import { ActionSheetModal } from '@/components/common/ActionSheetModal'
import { FilterChips } from '@/components/common/FilterChips'
import { ListMeta } from '@/components/common/ListMeta'
import { ListRow } from '@/components/common/ListRow'
import { QueryState } from '@/components/common/QueryState'
import { StatusBadge } from '@/components/common/StatusBadge'
import { Input } from '@/components/ui/Input'
import { Screen } from '@/components/layout/Screen'
import { usePermissions } from '@/hooks/usePermissions'
import { PermissionGate } from '@/navigation/guards/PermissionGate'
import type { MoreStackParamList } from '@/navigation/types'
import {
  useDeleteCategoryMutation,
  useGetAdminCategoriesQuery,
  useUpdateCategoryMutation,
} from '@/store/api/catalogAdminApi'
import { palette, spacing } from '@/theme'

type TypeFilter = 'all' | CategoryType

const FILTERS: { id: TypeFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'product', label: 'Product' },
  { id: 'service', label: 'Service' },
  { id: 'both', label: 'Both' },
]

export function CategoriesListScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<MoreStackParamList>>()
  const { checkPermission } = usePermissions()
  const canEdit = checkPermission('edit_categories')
  const canDelete = checkPermission('delete_categories')

  const [filter, setFilter] = useState<TypeFilter>('all')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<AdminCategory | null>(null)

  const query = useMemo<ListCategoriesQuery>(
    () => ({
      includeInactive: true,
      limit: 200,
      ...(filter !== 'all' ? { categoryType: filter } : {}),
      ...(search.trim() ? { search: search.trim() } : {}),
    }),
    [filter, search],
  )

  const { data = [], isLoading, isError, refetch, isFetching } = useGetAdminCategoriesQuery(query)
  const [updateCategory] = useUpdateCategoryMutation()
  const [deleteCategory] = useDeleteCategoryMutation()

  const runAction = async (action: string) => {
    const item = selected
    if (!item) return
    if (action === 'edit') {
      navigation.navigate('CreateCategory', { id: item.id })
      return
    }
    if (action === 'toggle') {
      try {
        await updateCategory({
          id: item.id,
          payload: { status: item.isActive === false ? 'active' : 'inactive' },
        }).unwrap()
      } catch (e) {
        Alert.alert('Error', extractMessage(e, 'Could not update category'))
      }
      return
    }
    if (action === 'delete') {
      Alert.alert('Delete category', `Permanently delete "${item.name}"?`, [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteCategory(item.id).unwrap()
            } catch (e) {
              Alert.alert('Error', extractMessage(e, 'Could not delete category'))
            }
          },
        },
      ])
    }
  }

  return (
    <PermissionGate webPath="/categories">
      <Screen surface="soft">
        <ListMeta text={`${data.length} categories`} />
        <FilterChips options={FILTERS} value={filter} onChange={setFilter} />
        <View style={styles.searchWrap}>
          <Input
            placeholder="Search categories…"
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
          isEmpty={!isLoading && data.length === 0}
          emptyTitle="No categories found"
          emptyDescription={
            search.trim() ? `Nothing matches "${search.trim()}".` : 'Create a category or pull down to refresh.'
          }
          emptyIcon="tag"
          emptyAction={{
            label: 'New category',
            iconLeft: 'plus',
            onPress: () => navigation.navigate('CreateCategory'),
          }}
        >
          <FlatList
            data={data}
            keyExtractor={(c) => c.id}
            refreshControl={
              <RefreshControl refreshing={isFetching} onRefresh={refetch} tintColor={palette.primary} />
            }
            renderItem={({ item }) => (
              <ListRow
                title={item.name}
                subtitle={`${item.categoryType} category`}
                onPress={() => setSelected(item)}
                right={<StatusBadge status={item.isActive === false ? 'inactive' : 'active'} />}
              />
            )}
            ItemSeparatorComponent={() => <View style={styles.sep} />}
          />
        </QueryState>

        <ActionSheetModal
          visible={!!selected}
          title={selected?.name}
          message={selected ? `${selected.categoryType} · ${selected.isActive === false ? 'inactive' : 'active'}` : undefined}
          actions={
            selected
              ? [
                  ...(canEdit ? [{ id: 'edit', label: 'Edit category' }] : []),
                  ...(canEdit
                    ? [{ id: 'toggle', label: selected.isActive === false ? 'Activate' : 'Deactivate' }]
                    : []),
                  ...(canDelete ? [{ id: 'delete', label: 'Delete', destructive: true }] : []),
                ]
              : []
          }
          onSelect={(id) => void runAction(id)}
          onClose={() => setSelected(null)}
        />
      </Screen>
    </PermissionGate>
  )
}

function extractMessage(e: unknown, fallback: string): string {
  return e && typeof e === 'object' && 'message' in e
    ? String((e as { message: string }).message)
    : fallback
}

const styles = StyleSheet.create({
  searchWrap: { marginTop: spacing.sm, marginBottom: spacing.sm },
  sep: { height: spacing.sm },
})
