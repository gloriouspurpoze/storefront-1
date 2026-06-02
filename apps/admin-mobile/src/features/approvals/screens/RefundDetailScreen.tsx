import { useState } from 'react'
import { Alert, ScrollView, StyleSheet, View } from 'react-native'
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native'
import { format } from 'date-fns'
import { QueryState } from '@/components/common/QueryState'
import { ScreenHeader } from '@/components/common/ScreenHeader'
import { StatusBadge } from '@/components/common/StatusBadge'
import { Screen } from '@/components/layout/Screen'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Text } from '@/components/ui/Text'
import { PermissionGate } from '@/navigation/guards/PermissionGate'
import type { InboxStackParamList } from '@/navigation/types'
import {
  useApproveRefundMutation,
  useGetRefundTicketQuery,
  useRejectRefundMutation,
} from '@/store/api/financeApi'
import { spacing } from '@/theme'

export function RefundDetailScreen() {
  const route = useRoute<RouteProp<InboxStackParamList, 'RefundDetail'>>()
  const navigation = useNavigation()
  const { data, isLoading, isError, refetch } = useGetRefundTicketQuery(route.params.ticketId)
  const [approveRefund, { isLoading: approving }] = useApproveRefundMutation()
  const [rejectRefund, { isLoading: rejecting }] = useRejectRefundMutation()
  const [adminNote, setAdminNote] = useState('')
  const [amount, setAmount] = useState('')
  const [rejectionReason, setRejectionReason] = useState('')
  const [mode, setMode] = useState<'view' | 'approve' | 'reject'>('view')

  const refund = data?.refundRequest
  const customer = data?.userId
  const customerLabel = customer
    ? `${customer.firstName ?? ''} ${customer.lastName ?? ''}`.trim() || customer.email || 'Customer'
    : 'Customer'

  const onApprove = () => {
    if (!data) return
    const parsed = amount.trim() ? Number(amount) : undefined
    if (parsed != null && (!Number.isFinite(parsed) || parsed <= 0)) {
      Alert.alert('Invalid amount', 'Amount must be a positive number.')
      return
    }
    Alert.alert(
      'Approve refund',
      parsed != null
        ? `Approve refund of ₹${parsed.toLocaleString('en-IN')}?`
        : `Approve full requested refund?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve',
          onPress: () => {
            void approveRefund({
              ticketId: data._id,
              amount: parsed,
              adminNote: adminNote.trim() || undefined,
            })
              .unwrap()
              .then(() => {
                setMode('view')
                Alert.alert('Approved', 'Customer has been notified.', [
                  { text: 'OK', onPress: () => navigation.goBack() },
                ])
              })
              .catch((e) => {
                const msg =
                  e && typeof e === 'object' && 'message' in e
                    ? String((e as { message: string }).message)
                    : 'Approval failed'
                Alert.alert('Error', msg)
              })
          },
        },
      ],
    )
  }

  const onReject = () => {
    if (!data) return
    if (!rejectionReason.trim()) {
      Alert.alert('Missing reason', 'A rejection reason is required.')
      return
    }
    Alert.alert('Reject refund', 'This action notifies the customer.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reject',
        style: 'destructive',
        onPress: () => {
          void rejectRefund({
            ticketId: data._id,
            rejectionReason: rejectionReason.trim(),
            adminNote: adminNote.trim() || undefined,
          })
            .unwrap()
            .then(() => {
              setMode('view')
              Alert.alert('Rejected', 'Customer has been notified.', [
                { text: 'OK', onPress: () => navigation.goBack() },
              ])
            })
            .catch((e) => {
              const msg =
                e && typeof e === 'object' && 'message' in e
                  ? String((e as { message: string }).message)
                  : 'Rejection failed'
              Alert.alert('Error', msg)
            })
        },
      },
    ])
  }

  const isResolved =
    refund?.status === 'approved' || refund?.status === 'rejected' || refund?.status === 'completed'

  return (
    <PermissionGate webPath="/support/refund-requests">
      <Screen surface="soft">
        <QueryState isLoading={isLoading} isError={isError} onRetry={refetch}>
          {data ? (
            <ScrollView contentContainerStyle={styles.content}>
              <ScreenHeader title={data.subject} subtitle={`#${data.ticketNumber}`} />
              <View style={styles.badges}>
                <StatusBadge status={refund?.status ?? data.status} />
                <StatusBadge status={data.category ?? 'general'} tone="neutral" />
              </View>

              <Card variant="content" padding="lg" style={styles.card}>
                <Text variant="caption" color="body">
                  Customer
                </Text>
                <Text variant="bodyMdStrong" color="ink">
                  {customerLabel}
                </Text>
                {customer?.email ? (
                  <Text variant="bodySm" color="body">
                    {customer.email}
                  </Text>
                ) : null}
                {customer?.phone ? (
                  <Text variant="bodySm" color="body">
                    {customer.phone}
                  </Text>
                ) : null}
                <Text variant="caption" color="body" style={styles.gap}>
                  Submitted
                </Text>
                <Text variant="bodyMdStrong" color="ink">
                  {format(new Date(data.createdAt), 'dd MMM yyyy · HH:mm')}
                </Text>
              </Card>

              <Card variant="content" padding="lg" style={styles.card}>
                <Text variant="bodyMdStrong" color="ink">
                  Refund details
                </Text>
                {refund?.amountRequested != null ? (
                  <>
                    <Text variant="caption" color="body" style={styles.gap}>
                      Amount requested
                    </Text>
                    <Text variant="displaySm" color="ink">
                      ₹{refund.amountRequested.toLocaleString('en-IN')}
                    </Text>
                  </>
                ) : null}
                {refund?.bookingId ? (
                  <>
                    <Text variant="caption" color="body" style={styles.gap}>
                      Booking
                    </Text>
                    <Text variant="bodyMdStrong" color="ink">
                      {refund.bookingId}
                    </Text>
                  </>
                ) : null}
                {data.description ? (
                  <>
                    <Text variant="caption" color="body" style={styles.gap}>
                      Reason
                    </Text>
                    <Text variant="bodyMd" color="ink">
                      {data.description}
                    </Text>
                  </>
                ) : null}
                {refund?.rejectionReason ? (
                  <>
                    <Text variant="caption" color="body" style={styles.gap}>
                      Rejection reason
                    </Text>
                    <Text variant="bodyMd" color="ink">
                      {refund.rejectionReason}
                    </Text>
                  </>
                ) : null}
                {refund?.adminNote ? (
                  <>
                    <Text variant="caption" color="body" style={styles.gap}>
                      Admin note
                    </Text>
                    <Text variant="bodyMd" color="ink">
                      {refund.adminNote}
                    </Text>
                  </>
                ) : null}
              </Card>

              {mode === 'approve' ? (
                <Card variant="content" padding="lg" style={styles.card}>
                  <Text variant="bodyMdStrong" color="ink">
                    Approve refund
                  </Text>
                  <Input
                    label={`Amount${
                      refund?.amountRequested
                        ? ` (requested ₹${refund.amountRequested.toLocaleString('en-IN')})`
                        : ''
                    }`}
                    value={amount}
                    onChangeText={setAmount}
                    keyboardType="numeric"
                    placeholder="Leave blank to approve full request"
                  />
                  <Input
                    label="Admin note"
                    value={adminNote}
                    onChangeText={setAdminNote}
                    placeholder="Optional"
                  />
                  <View style={styles.modeActions}>
                    <Button label="Back" variant="secondary" onPress={() => setMode('view')} />
                    <Button label="Approve" loading={approving} onPress={onApprove} />
                  </View>
                </Card>
              ) : null}

              {mode === 'reject' ? (
                <Card variant="content" padding="lg" style={styles.card}>
                  <Text variant="bodyMdStrong" color="ink">
                    Reject refund
                  </Text>
                  <Input
                    label="Reason (required)"
                    value={rejectionReason}
                    onChangeText={setRejectionReason}
                    multiline
                    numberOfLines={2}
                    placeholder="Customer will see this"
                  />
                  <Input
                    label="Admin note"
                    value={adminNote}
                    onChangeText={setAdminNote}
                    placeholder="Optional internal note"
                  />
                  <View style={styles.modeActions}>
                    <Button label="Back" variant="secondary" onPress={() => setMode('view')} />
                    <Button label="Reject" variant="brand" loading={rejecting} onPress={onReject} />
                  </View>
                </Card>
              ) : null}

              {!isResolved && mode === 'view' ? (
                <View style={styles.actions}>
                  <Button
                    label="Approve refund"
                    iconLeft="check"
                    onPress={() => setMode('approve')}
                  />
                  <Button
                    label="Reject"
                    variant="subtle"
                    iconLeft="x"
                    onPress={() => setMode('reject')}
                  />
                </View>
              ) : null}
            </ScrollView>
          ) : null}
        </QueryState>
      </Screen>
    </PermissionGate>
  )
}

const styles = StyleSheet.create({
  content: { gap: spacing.lg, paddingBottom: spacing.xxxl },
  badges: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
  card: { gap: spacing.sm },
  gap: { marginTop: spacing.md },
  modeActions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  actions: { gap: spacing.sm },
})
