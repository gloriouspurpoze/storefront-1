import { useMemo } from 'react'
import { FlatList, Linking, Pressable, RefreshControl, StyleSheet, View } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { format } from 'date-fns'
import { ListRow } from '@/components/common/ListRow'
import { QueryState } from '@/components/common/QueryState'
import { ScreenHeader } from '@/components/common/ScreenHeader'
import { StatusBadge } from '@/components/common/StatusBadge'
import { Screen } from '@/components/layout/Screen'
import { Text } from '@/components/ui/Text'
import { Button } from '@/components/ui/Button'
import type { InboxStackParamList } from '@/navigation/types'
import {
  useGetApplicationsQuery,
  useGetDisputesQuery,
  useGetSupportTicketsQuery,
  useResolveSupportTicketMutation,
  useUpdateApplicationStatusMutation,
} from '@/store/api/opsApi'
import { palette, spacing } from '@/theme'

type ApprovalItem = {
  id: string
  kind: 'application' | 'ticket' | 'refund' | 'dispute'
  title: string
  subtitle: string
  meta: string
  status: string
  actionIds?: { approve?: string; reject?: string; resolve?: string }
}

export function ApprovalsInboxScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<InboxStackParamList>>()
  const apps = useGetApplicationsQuery({ limit: 20, status: 'new' })
  const tickets = useGetSupportTicketsQuery({ limit: 20 })
  const refunds = useGetSupportTicketsQuery({ hasRefund: true, limit: 20 })
  const disputes = useGetDisputesQuery({ limit: 20, status: 'open' })
  const [updateAppStatus, { isLoading: updatingApp }] = useUpdateApplicationStatusMutation()
  const [resolveTicket, { isLoading: resolvingTicket }] = useResolveSupportTicketMutation()

  const isLoading = apps.isLoading || tickets.isLoading || refunds.isLoading || disputes.isLoading
  const isError = apps.isError || tickets.isError || refunds.isError || disputes.isError
  const isFetching = apps.isFetching || tickets.isFetching || refunds.isFetching || disputes.isFetching

  const refetch = () => {
    void apps.refetch()
    void tickets.refetch()
    void refunds.refetch()
    void disputes.refetch()
  }

  const items = useMemo<ApprovalItem[]>(() => {
    const queue: ApprovalItem[] = []
    for (const a of apps.data ?? []) {
      if (a.status === 'new' || a.status === 'contacted') {
        queue.push({
          id: `app-${a._id}`,
          kind: 'application',
          title: a.fullName,
          subtitle: `${a.city} · ${a.phone}`,
          meta: format(new Date(a.createdAt), 'dd MMM yyyy'),
          status: a.status,
          actionIds: { approve: a._id, reject: a._id },
        })
      }
    }
    for (const t of refunds.data?.tickets ?? []) {
      if (t.status === 'open' || t.status === 'in_progress') {
        queue.push({
          id: `refund-${t._id}`,
          kind: 'refund',
          title: t.subject,
          subtitle: t.userId?.email ?? 'Refund request',
          meta: t.refundRequest?.amountRequested
            ? `₹${t.refundRequest.amountRequested}`
            : format(new Date(t.createdAt), 'dd MMM'),
          status: t.refundRequest?.status ?? t.status,
          actionIds: { resolve: t._id },
        })
      }
    }
    for (const t of tickets.data?.tickets ?? []) {
      if (t.status === 'open' || t.status === 'in_progress') {
        queue.push({
          id: `ticket-${t._id}`,
          kind: 'ticket',
          title: t.subject,
          subtitle: t.category,
          meta: format(new Date(t.createdAt), 'dd MMM yyyy'),
          status: t.status,
          actionIds: { resolve: t._id },
        })
      }
    }
    for (const d of disputes.data?.cases ?? []) {
      queue.push({
        id: `dispute-${d._id}`,
        kind: 'dispute',
        title: d.title,
        subtitle: d.disputeCaseNumber,
        meta: format(new Date(d.createdAt), 'dd MMM yyyy'),
        status: d.status,
      })
    }
    return queue.sort((a, b) => (a.meta < b.meta ? 1 : -1))
  }, [apps.data, tickets.data, refunds.data, disputes.data])

  const onApproveApp = async (id: string) => {
    await updateAppStatus({ id, status: 'approved' })
  }

  const onRejectApp = async (id: string) => {
    await updateAppStatus({ id, status: 'rejected' })
  }

  const onResolveTicket = async (id: string) => {
    await resolveTicket({ ticketId: id })
  }

  return (
    <Screen surface="soft">
      <ScreenHeader
        title="Approvals"
        subtitle={`${items.length} need attention`}
        large
      />
      <View style={styles.links}>
        <Pressable onPress={() => navigation.navigate('Notifications')}>
          <Text variant="bodySmStrong" color="link">
            All notifications →
          </Text>
        </Pressable>
      </View>
      <QueryState
        isLoading={isLoading}
        isError={isError}
        onRetry={refetch}
        isEmpty={!isLoading && items.length === 0}
        emptyTitle="All caught up"
        emptyDescription="No pending applications, tickets, refunds, or disputes."
      >
        <FlatList
          data={items}
          keyExtractor={(i) => i.id}
          scrollEnabled={false}
          refreshControl={
            <RefreshControl refreshing={isFetching} onRefresh={refetch} tintColor={palette.primary} />
          }
          renderItem={({ item }) => (
            <View style={styles.card}>
              <ListRow
                title={item.title}
                subtitle={item.subtitle}
                meta={item.meta}
                right={<StatusBadge status={item.status} />}
                chevron={false}
              />
              {item.kind === 'application' && item.actionIds?.approve ? (
                <View style={styles.actions}>
                  <Button
                    label="Approve"
                    variant="primary"
                    block={false}
                    loading={updatingApp}
                    onPress={() => onApproveApp(item.actionIds!.approve!)}
                    style={styles.actionBtn}
                  />
                  <Button
                    label="Reject"
                    variant="secondary"
                    block={false}
                    loading={updatingApp}
                    onPress={() => onRejectApp(item.actionIds!.reject!)}
                    style={styles.actionBtn}
                  />
                </View>
              ) : null}
              {item.actionIds?.resolve ? (
                <View style={styles.actions}>
                  <Button
                    label="Mark resolved"
                    variant="subtle"
                    block={false}
                    loading={resolvingTicket}
                    onPress={() => onResolveTicket(item.actionIds!.resolve!)}
                    style={styles.actionBtn}
                  />
                </View>
              ) : null}
              {item.kind === 'dispute' ? (
                <Pressable
                  onPress={() =>
                    Linking.openURL('https://admin.profixer.in/operations/dispute-cases')
                  }
                  style={styles.webLink}
                >
                  <Text variant="bodySmStrong" color="link">
                    Open in web admin →
                  </Text>
                </Pressable>
              ) : null}
            </View>
          )}
          ItemSeparatorComponent={() => <View style={styles.sep} />}
        />
      </QueryState>
    </Screen>
  )
}

const styles = StyleSheet.create({
  links: { marginBottom: spacing.sm },
  card: {
    backgroundColor: palette.canvas,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.surfacePressed,
    overflow: 'hidden',
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  actionBtn: { flex: 1 },
  webLink: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  sep: { height: spacing.sm },
})
