import { useMemo } from 'react'
import { FlatList, Linking, RefreshControl, StyleSheet, View } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { KpiCard } from '@/components/common/KpiCard'
import { ListMeta } from '@/components/common/ListMeta'
import { ListRow } from '@/components/common/ListRow'
import { QueryState } from '@/components/common/QueryState'
import { Screen } from '@/components/layout/Screen'
import { Button } from '@/components/ui/Button'
import { Icon } from '@/components/ui/Icon'
import { PermissionGate } from '@/navigation/guards/PermissionGate'
import type { MoreStackParamList } from '@/navigation/types'
import { useGetCrmContactsQuery, useGetCrmMetricsQuery } from '@/store/api/phase2Api'
import { palette, spacing } from '@/theme'

export function CrmHubScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<MoreStackParamList>>()
  const { data: metrics, isLoading: mLoading, refetch: refetchM } = useGetCrmMetricsQuery()
  const {
    data: contacts,
    isLoading,
    isError,
    refetch,
    isFetching,
  } = useGetCrmContactsQuery()

  const filtered = useMemo(() => contacts ?? [], [contacts])

  return (
    <PermissionGate webPath="/crm">
      <Screen surface="soft">
        <ListMeta text={`${filtered.length} contacts`} />
        <View style={styles.metrics}>
          <KpiCard label="Pipeline" value={`₹${(metrics?.pipelineValue ?? 0).toLocaleString('en-IN')}`} icon="wallet" />
          <KpiCard label="Leads" value={String(metrics?.activeLeads ?? 0)} icon="users" />
        </View>
        <QueryState
          isLoading={isLoading || mLoading}
          isError={isError}
          onRetry={() => {
            void refetch()
            void refetchM()
          }}
          isEmpty={!isLoading && filtered.length === 0}
          emptyTitle="No contacts"
          emptyDescription="Add a lead or pull to refresh."
        >
          <FlatList
            data={filtered}
            keyExtractor={(c) => c.id}
            refreshControl={
              <RefreshControl
                refreshing={isFetching}
                onRefresh={() => {
                  void refetch()
                  void refetchM()
                }}
                tintColor={palette.primary}
              />
            }
            renderItem={({ item }) => (
              <ListRow
                title={`${item.firstName} ${item.lastName}`.trim()}
                subtitle={item.email}
                meta={item.lifecycle.replace(/_/g, ' ')}
                onPress={() => {
                  if (item.phone) void Linking.openURL(`tel:${item.phone}`)
                }}
                right={
                  item.phone ? <Icon name="phone" size={18} color={palette.primary} /> : undefined
                }
              />
            )}
            ItemSeparatorComponent={() => <View style={styles.sep} />}
            ListFooterComponent={
              <Button
                label="Quick add contact"
                variant="secondary"
                iconLeft="plus"
                onPress={() => navigation.navigate('CrmContactForm')}
                style={styles.footerBtn}
              />
            }
          />
        </QueryState>
      </Screen>
    </PermissionGate>
  )
}

const styles = StyleSheet.create({
  metrics: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  sep: { height: spacing.sm },
  footerBtn: { marginTop: spacing.xl },
})
