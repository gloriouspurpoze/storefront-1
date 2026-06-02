import { Alert, FlatList, RefreshControl, StyleSheet, View } from 'react-native'
import type { AdminPayout } from '@profixer/api-client'
import { KpiCard } from '@/components/common/KpiCard'
import { ListMeta } from '@/components/common/ListMeta'
import { ListRow } from '@/components/common/ListRow'
import { QueryState } from '@/components/common/QueryState'
import { Screen } from '@/components/layout/Screen'
import { Button } from '@/components/ui/Button'
import { Text } from '@/components/ui/Text'
import { PermissionGate } from '@/navigation/guards/PermissionGate'
import {
  useApprovePayoutMutation,
  useGetEarningsSummaryQuery,
  useGetPendingPayoutsQuery,
} from '@/store/api/phase2Api'
import { palette, spacing } from '@/theme'

function proLabel(p: AdminPayout): string {
  const id = p.professionalId
  if (id && typeof id === 'object') {
    return [id.firstName, id.lastName].filter(Boolean).join(' ').trim() || 'Professional'
  }
  return typeof id === 'string' ? `Pro ${id.slice(0, 8)}…` : 'Professional'
}

export function EarningsOverviewScreen() {
  const { data: summary, isLoading: sLoading, refetch: refetchS, isFetching: fetchingS } =
    useGetEarningsSummaryQuery()
  const {
    data: payouts,
    isLoading: pLoading,
    isError,
    refetch: refetchP,
    isFetching: fetchingP,
  } = useGetPendingPayoutsQuery()
  const [approve, { isLoading: approving }] = useApprovePayoutMutation()

  const refresh = () => {
    void refetchS()
    void refetchP()
  }

  const onApprove = (payoutId: string) => {
    Alert.alert('Approve payout', 'Release this payout to the professional?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Approve',
        onPress: () => {
          void approve(payoutId)
            .unwrap()
            .then(() => Alert.alert('Approved', 'Payout approved.'))
            .catch((e) => {
              const msg =
                e && typeof e === 'object' && 'message' in e
                  ? String((e as { message: string }).message)
                  : 'Approval failed'
              Alert.alert('Error', msg)
            })
        },
      },
    ])
  }

  return (
    <PermissionGate webPath="/payouts">
      <Screen surface="soft">
        <ListMeta text="Platform summary & payout approvals" />
        <QueryState isLoading={sLoading || pLoading} isError={isError} onRetry={refresh}>
          <View style={styles.kpis}>
            <KpiCard
              label="Platform revenue"
              value={`₹${(summary?.totalBookingAmount ?? 0).toLocaleString('en-IN')}`}
              icon="wallet"
              accent
            />
            <KpiCard
              label="Pending payouts"
              value={String(summary?.pendingPayouts ?? payouts?.length ?? 0)}
              icon="clock"
            />
            <KpiCard label="Paid out" value={String(summary?.paidPayouts ?? 0)} icon="check" />
            <KpiCard
              label="Pro earnings"
              value={`₹${(summary?.totalProfessionalEarnings ?? 0).toLocaleString('en-IN')}`}
              icon="trending-up"
            />
          </View>
          <View style={styles.sectionHead}>
            <Text variant="bodyMdStrong" color="ink">
              Awaiting approval
            </Text>
            <Text variant="caption" color="body">
              {`${payouts?.length ?? 0} requests`}
            </Text>
          </View>
          {(payouts?.length ?? 0) === 0 ? (
            <Text variant="bodyMd" color="body" align="center" style={styles.empty}>
              No pending payout requests.
            </Text>
          ) : (
            <FlatList
              data={payouts ?? []}
              keyExtractor={(p) => p._id}
              scrollEnabled={false}
              refreshControl={
                <RefreshControl
                  refreshing={fetchingS || fetchingP}
                  onRefresh={refresh}
                  tintColor={palette.primary}
                />
              }
              renderItem={({ item }) => (
                <View style={styles.payoutCard}>
                  <ListRow
                    title={proLabel(item)}
                    subtitle={item.payoutReference}
                    meta={`₹${(item.netAmount ?? item.grossAmount ?? 0).toLocaleString('en-IN')} · ${item.status}`}
                    chevron={false}
                  />
                  <Button
                    label="Approve"
                    variant="brand"
                    loading={approving}
                    onPress={() => onApprove(item._id)}
                    style={styles.approveBtn}
                  />
                </View>
              )}
              ItemSeparatorComponent={() => <View style={styles.sep} />}
            />
          )}
        </QueryState>
      </Screen>
    </PermissionGate>
  )
}

const styles = StyleSheet.create({
  kpis: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  payoutCard: { gap: spacing.sm },
  approveBtn: { marginHorizontal: spacing.lg, marginBottom: spacing.sm },
  sep: { height: spacing.md },
  empty: { paddingVertical: spacing.xxl },
  sectionHead: {
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
    gap: 2,
  },
})
