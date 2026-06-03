import { useMemo, useState } from 'react'
import { Alert, FlatList, RefreshControl, StyleSheet, View } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import type { ServiceListItem, ServiceListQuery, ServiceStatus } from '@profixer/api-client'
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
  useDeleteServiceMutation,
  useGetServicesListQuery,
  useUpdatePlatformServiceMutation,
} from '@/store/api/catalogAdminApi'
import { palette, spacing } from '@/theme'

type StatusFilter = 'all' | ServiceStatus

const FILTERS: { id: StatusFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'published', label: 'Published' },
  { id: 'draft', label: 'Drafts' },
  { id: 'archived', label: 'Archived' },
]

function priceLabel(item: ServiceListItem): string {
  if (item.service_type === 'hourly' && item.hourly_rate != null) {
    return `₹${item.hourly_rate.toLocaleString('en-IN')}/hr`
  }
  if (item.service_type === 'consultation' && item.consultation_fee != null) {
    return `₹${item.consultation_fee.toLocaleString('en-IN')} consult`
  }
  if (item.base_price != null) return `₹${item.base_price.toLocaleString('en-IN')}`
  return item.service_type
}

export function ServicesListScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<MoreStackParamList>>()
  const { checkPermission } = usePermissions()
  const canEdit = checkPermission('edit_services')
  const canDelete = checkPermission('delete_services')

  const [filter, setFilter] = useState<StatusFilter>('all')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<ServiceListItem | null>(null)

  const query = useMemo<ServiceListQuery>(
    () => ({
      page: 1,
      limit: 40,
      ...(filter !== 'all' ? { status: filter } : {}),
      ...(search.trim() ? { search: search.trim() } : {}),
    }),
    [filter, search],
  )

  const { data, isLoading, isError, refetch, isFetching } = useGetServicesListQuery(query)
  const [updateService] = useUpdatePlatformServiceMutation()
  const [deleteService] = useDeleteServiceMutation()
  const items = data?.items ?? []

  const runAction = async (action: string) => {
    const item = selected
    if (!item) return
    if (action === 'edit') {
      navigation.navigate('CreateService', { id: item.id })
      return
    }
    if (action === 'toggle') {
      try {
        await updateService({ id: item.id, payload: { is_active: !item.is_active } }).unwrap()
      } catch (e) {
        Alert.alert('Error', extractMessage(e, 'Could not update service'))
      }
      return
    }
    if (action === 'delete') {
      Alert.alert('Delete service', `Permanently delete "${item.name}"?`, [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteService(item.id).unwrap()
            } catch (e) {
              Alert.alert('Error', extractMessage(e, 'Could not delete service'))
            }
          },
        },
      ])
    }
  }

  return (
    <PermissionGate webPath="/platform-services">
      <Screen surface="soft">
        <ListMeta text={`${data?.pagination.total ?? items.length} services`} />
        <FilterChips options={FILTERS} value={filter} onChange={setFilter} />
        <View style={styles.searchWrap}>
          <Input
            placeholder="Search services…"
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
          emptyTitle="No services found"
          emptyDescription={
            search.trim()
              ? `Nothing matches "${search.trim()}".`
              : 'Create a service or pull down to refresh.'
          }
          emptyIcon="briefcase"
          emptyAction={{
            label: 'New service',
            iconLeft: 'plus',
            onPress: () => navigation.navigate('CreateService'),
          }}
        >
          <FlatList
            data={items}
            keyExtractor={(s) => s.id}
            refreshControl={
              <RefreshControl refreshing={isFetching} onRefresh={refetch} tintColor={palette.primary} />
            }
            renderItem={({ item }) => (
              <ListRow
                title={item.name}
                subtitle={`${priceLabel(item)}${item.is_active ? '' : ' · inactive'}`}
                onPress={() => setSelected(item)}
                right={<StatusBadge status={item.status} />}
              />
            )}
            ItemSeparatorComponent={() => <View style={styles.sep} />}
          />
        </QueryState>

        <ActionSheetModal
          visible={!!selected}
          title={selected?.name}
          message={selected ? `${selected.status} · ${selected.is_active ? 'active' : 'inactive'}` : undefined}
          actions={
            selected
              ? [
                  ...(canEdit ? [{ id: 'edit', label: 'Edit service' }] : []),
                  ...(canEdit
                    ? [{ id: 'toggle', label: selected.is_active ? 'Deactivate' : 'Activate' }]
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
