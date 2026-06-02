import { useState } from 'react'
import { Alert, ScrollView, StyleSheet, View } from 'react-native'
import { useRoute, type RouteProp } from '@react-navigation/native'
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
import type { MoreStackParamList } from '@/navigation/types'
import { useGetPaymentQuery, useRefundPaymentMutation } from '@/store/api/financeApi'
import { spacing } from '@/theme'

export function PaymentDetailScreen() {
  const route = useRoute<RouteProp<MoreStackParamList, 'PaymentDetail'>>()
  const { data, isLoading, isError, refetch } = useGetPaymentQuery(route.params.id)
  const [refundPayment, { isLoading: refunding }] = useRefundPaymentMutation()
  const [refundOpen, setRefundOpen] = useState(false)
  const [amount, setAmount] = useState('')
  const [reason, setReason] = useState('')

  const submitRefund = () => {
    if (!data) return
    const parsed = amount.trim() ? Number(amount) : undefined
    if (parsed != null && (!Number.isFinite(parsed) || parsed <= 0)) {
      Alert.alert('Invalid amount', 'Refund amount must be a positive number.')
      return
    }
    Alert.alert(
      'Confirm refund',
      parsed != null
        ? `Refund ₹${parsed.toLocaleString('en-IN')} to the customer?`
        : 'Process a full refund?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Refund',
          style: 'destructive',
          onPress: () => {
            void refundPayment({
              id: String(data._id ?? data.id),
              amount: parsed,
              reason: reason.trim() || undefined,
            })
              .unwrap()
              .then(() => {
                setRefundOpen(false)
                setAmount('')
                setReason('')
                Alert.alert('Refund issued', 'Customer has been notified.')
              })
              .catch((e) => {
                const msg =
                  e && typeof e === 'object' && 'message' in e
                    ? String((e as { message: string }).message)
                    : 'Refund failed'
                Alert.alert('Error', msg)
              })
          },
        },
      ],
    )
  }

  const customer =
    data?.customerId && typeof data.customerId === 'object'
      ? `${data.customerId.firstName ?? ''} ${data.customerId.lastName ?? ''}`.trim() ||
        data.customerId.email ||
        'Customer'
      : 'Customer'

  return (
    <PermissionGate webPath="/payments">
      <Screen surface="soft">
        <QueryState isLoading={isLoading} isError={isError} onRetry={refetch}>
          {data ? (
            <ScrollView contentContainerStyle={styles.content}>
              <ScreenHeader
                title={`₹${data.amount.toLocaleString('en-IN')}`}
                subtitle={`${customer} · ${data.paymentMethod ?? 'unknown'}`}
              />
              <StatusBadge status={data.status} />

              <Card variant="content" padding="lg" style={styles.card}>
                {data.transactionId ? (
                  <>
                    <Text variant="caption" color="body">
                      Transaction
                    </Text>
                    <Text variant="bodyMdStrong" color="ink">
                      {data.transactionId}
                    </Text>
                  </>
                ) : null}
                {data.bookingId ? (
                  <>
                    <Text variant="caption" color="body" style={styles.gap}>
                      Booking
                    </Text>
                    <Text variant="bodyMdStrong" color="ink">
                      {data.bookingId}
                    </Text>
                  </>
                ) : null}
                <Text variant="caption" color="body" style={styles.gap}>
                  Created
                </Text>
                <Text variant="bodyMdStrong" color="ink">
                  {format(new Date(data.createdAt), 'dd MMM yyyy · HH:mm')}
                </Text>
                {data.refundAmount ? (
                  <>
                    <Text variant="caption" color="body" style={styles.gap}>
                      Refunded
                    </Text>
                    <Text variant="bodyMdStrong" color="ink">
                      ₹{data.refundAmount.toLocaleString('en-IN')}
                      {data.refundReason ? ` — ${data.refundReason}` : ''}
                    </Text>
                  </>
                ) : null}
              </Card>

              {refundOpen ? (
                <Card variant="content" padding="lg" style={styles.card}>
                  <Text variant="bodyMdStrong" color="ink">
                    Refund payment
                  </Text>
                  <Input
                    label={`Amount (max ₹${data.amount.toLocaleString('en-IN')})`}
                    value={amount}
                    onChangeText={setAmount}
                    keyboardType="numeric"
                    placeholder="Leave blank for full refund"
                  />
                  <Input
                    label="Reason"
                    value={reason}
                    onChangeText={setReason}
                    placeholder="Optional"
                  />
                  <View style={styles.refundActions}>
                    <Button label="Cancel" variant="secondary" onPress={() => setRefundOpen(false)} />
                    <Button label="Submit refund" loading={refunding} onPress={submitRefund} />
                  </View>
                </Card>
              ) : null}

              <View style={styles.actions}>
                {data.status !== 'refunded' && data.status !== 'cancelled' && data.status !== 'failed' ? (
                  <Button
                    label="Refund"
                    variant="brand"
                    iconLeft="refresh"
                    onPress={() => setRefundOpen((v) => !v)}
                  />
                ) : null}
              </View>
            </ScrollView>
          ) : null}
        </QueryState>
      </Screen>
    </PermissionGate>
  )
}

const styles = StyleSheet.create({
  content: { gap: spacing.lg, paddingBottom: spacing.xxxl },
  card: { gap: spacing.sm },
  gap: { marginTop: spacing.md },
  refundActions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  actions: { gap: spacing.sm },
})
