import { useMemo, useState } from 'react'
import { Alert, FlatList, RefreshControl, StyleSheet, View } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import type { ProductListItem, ProductListQuery } from '@profixer/api-client'
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
  useDeleteProductMutation,
  useGetProductsListQuery,
  useUpdateProductMutation,
} from '@/store/api/catalogAdminApi'
import { palette, spacing } from '@/theme'

type ActiveFilter = 'all' | 'active' | 'inactive'

const FILTERS: { id: ActiveFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'active', label: 'Active' },
  { id: 'inactive', label: 'Inactive' },
]

export function ProductsListScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<MoreStackParamList>>()
  const { checkPermission } = usePermissions()
  const canEdit = checkPermission('edit_products')
  const canDelete = checkPermission('delete_products')

  const [filter, setFilter] = useState<ActiveFilter>('all')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<ProductListItem | null>(null)

  const query = useMemo<ProductListQuery>(
    () => ({
      page: 1,
      limit: 40,
      ...(filter === 'active' ? { is_active: true } : filter === 'inactive' ? { is_active: false } : {}),
      ...(search.trim() ? { search: search.trim() } : {}),
    }),
    [filter, search],
  )

  const { data, isLoading, isError, refetch, isFetching } = useGetProductsListQuery(query)
  const [updateProduct] = useUpdateProductMutation()
  const [deleteProduct] = useDeleteProductMutation()
  const items = data?.items ?? []

  const runAction = async (action: string) => {
    const item = selected
    if (!item) return
    if (action === 'edit') {
      navigation.navigate('CreateProduct', { id: item.id })
      return
    }
    if (action === 'toggle') {
      try {
        await updateProduct({ id: item.id, payload: { is_active: !item.isActive } }).unwrap()
      } catch (e) {
        Alert.alert('Error', extractMessage(e, 'Could not update product'))
      }
      return
    }
    if (action === 'delete') {
      Alert.alert('Delete product', `Permanently delete "${item.name}"?`, [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteProduct(item.id).unwrap()
            } catch (e) {
              Alert.alert('Error', extractMessage(e, 'Could not delete product'))
            }
          },
        },
      ])
    }
  }

  return (
    <PermissionGate webPath="/products">
      <Screen surface="soft">
        <ListMeta text={`${data?.pagination.total ?? items.length} products`} />
        <FilterChips options={FILTERS} value={filter} onChange={setFilter} />
        <View style={styles.searchWrap}>
          <Input
            placeholder="Search products, SKU…"
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
          isEmpty={!isLoading && items.length === 0}
          emptyTitle="No products found"
          emptyDescription={
            search.trim()
              ? `Nothing matches "${search.trim()}".`
              : 'Create a product or pull down to refresh.'
          }
          emptyIcon="tag"
          emptyAction={{
            label: 'New product',
            iconLeft: 'plus',
            onPress: () => navigation.navigate('CreateProduct'),
          }}
        >
          <FlatList
            data={items}
            keyExtractor={(p) => p.id}
            refreshControl={
              <RefreshControl refreshing={isFetching} onRefresh={refetch} tintColor={palette.primary} />
            }
            renderItem={({ item }) => {
              const parts = [`₹${item.price.toLocaleString('en-IN')}`]
              if (item.sku) parts.push(item.sku)
              parts.push(`stock ${item.stockQuantity}`)
              return (
                <ListRow
                  title={item.name}
                  subtitle={parts.join(' · ')}
                  meta={item.categoryName}
                  onPress={() => setSelected(item)}
                  right={<StatusBadge status={item.isActive ? 'active' : 'inactive'} />}
                />
              )
            }}
            ItemSeparatorComponent={() => <View style={styles.sep} />}
          />
        </QueryState>

        <ActionSheetModal
          visible={!!selected}
          title={selected?.name}
          message={selected ? (selected.isActive ? 'active' : 'inactive') : undefined}
          actions={
            selected
              ? [
                  ...(canEdit ? [{ id: 'edit', label: 'Edit product' }] : []),
                  ...(canEdit
                    ? [{ id: 'toggle', label: selected.isActive ? 'Deactivate' : 'Activate' }]
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
