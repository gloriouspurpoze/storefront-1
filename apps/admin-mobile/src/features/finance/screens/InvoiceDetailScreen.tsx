import { Alert, Linking, ScrollView, StyleSheet, View } from 'react-native'
import { useRoute, type RouteProp } from '@react-navigation/native'
import { format } from 'date-fns'
import { QueryState } from '@/components/common/QueryState'
import { ScreenHeader } from '@/components/common/ScreenHeader'
import { StatusBadge } from '@/components/common/StatusBadge'
import { Screen } from '@/components/layout/Screen'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Text } from '@/components/ui/Text'
import { PermissionGate } from '@/navigation/guards/PermissionGate'
import type { MoreStackParamList } from '@/navigation/types'
import {
  useCancelInvoiceMutation,
  useGetInvoiceQuery,
  useMarkInvoicePaidMutation,
} from '@/store/api/financeApi'
import { palette, spacing } from '@/theme'

export function InvoiceDetailScreen() {
  const route = useRoute<RouteProp<MoreStackParamList, 'InvoiceDetail'>>()
  const { data, isLoading, isError, refetch } = useGetInvoiceQuery(route.params.id)
  const [markPaid, { isLoading: marking }] = useMarkInvoicePaidMutation()
  const [cancelInvoice, { isLoading: cancelling }] = useCancelInvoiceMutation()

  const customer =
    data?.customerId && typeof data.customerId === 'object'
      ? data.customerId
      : null
  const customerName = customer
    ? `${customer.firstName ?? ''} ${customer.lastName ?? ''}`.trim() || customer.email || 'Customer'
    : 'Customer'

  const onMarkPaid = () => {
    if (!data) return
    Alert.alert('Mark paid', `Mark invoice #${data.invoiceNumber} as paid?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Mark paid',
        onPress: () => {
          void markPaid({ id: data._id, paymentMethod: 'cash' })
            .unwrap()
            .catch((e) => {
              const msg =
                e && typeof e === 'object' && 'message' in e
                  ? String((e as { message: string }).message)
                  : 'Could not mark paid'
              Alert.alert('Error', msg)
            })
        },
      },
    ])
  }

  const onCancel = () => {
    if (!data) return
    Alert.alert('Cancel invoice', `Cancel invoice #${data.invoiceNumber}? This cannot be undone.`, [
      { text: 'Keep', style: 'cancel' },
      {
        text: 'Cancel invoice',
        style: 'destructive',
        onPress: () => {
          void cancelInvoice(data._id)
            .unwrap()
            .catch((e) => {
              const msg =
                e && typeof e === 'object' && 'message' in e
                  ? String((e as { message: string }).message)
                  : 'Could not cancel'
              Alert.alert('Error', msg)
            })
        },
      },
    ])
  }

  return (
    <PermissionGate webPath="/invoices">
      <Screen surface="soft">
        <QueryState isLoading={isLoading} isError={isError} onRetry={refetch}>
          {data ? (
            <ScrollView contentContainerStyle={styles.content}>
              <ScreenHeader title={`Invoice #${data.invoiceNumber}`} subtitle={customerName} />
              <View style={styles.badges}>
                <StatusBadge status={data.status} />
                <StatusBadge status={data.paymentStatus} />
              </View>

              <Card variant="content" padding="lg" style={styles.card}>
                <Text variant="caption" color="body">
                  Total
                </Text>
                <Text variant="displaySm" color="ink">
                  ₹{(data.totalAmount ?? 0).toLocaleString('en-IN')}
                </Text>
                {data.subtotal != null ? (
                  <View style={styles.row}>
                    <Text variant="bodySm" color="body">
                      Subtotal
                    </Text>
                    <Text variant="bodySm" color="ink">
                      ₹{data.subtotal.toLocaleString('en-IN')}
                    </Text>
                  </View>
                ) : null}
                {data.tax != null ? (
                  <View style={styles.row}>
                    <Text variant="bodySm" color="body">
                      Tax
                    </Text>
                    <Text variant="bodySm" color="ink">
                      ₹{data.tax.toLocaleString('en-IN')}
                    </Text>
                  </View>
                ) : null}
                {data.discount ? (
                  <View style={styles.row}>
                    <Text variant="bodySm" color="body">
                      Discount
                    </Text>
                    <Text variant="bodySm" color="ink">
                      −₹{data.discount.toLocaleString('en-IN')}
                    </Text>
                  </View>
                ) : null}
              </Card>

              {data.items?.length ? (
                <Card variant="content" padding="lg" style={styles.card}>
                  <Text variant="bodyMdStrong" color="ink">
                    Line items
                  </Text>
                  {data.items.map((item, idx) => (
                    <View key={`${item.description}-${idx}`} style={styles.lineRow}>
                      <View style={styles.lineBody}>
                        <Text variant="bodyMd" color="ink">
                          {item.description}
                        </Text>
                        <Text variant="caption" color="body">
                          {item.quantity} × ₹{item.unitPrice.toLocaleString('en-IN')}
                        </Text>
                      </View>
                      <Text variant="bodyMdStrong" color="ink">
                        ₹{item.amount.toLocaleString('en-IN')}
                      </Text>
                    </View>
                  ))}
                </Card>
              ) : null}

              <Card variant="content" padding="lg" style={styles.card}>
                <Text variant="caption" color="body">
                  Issued
                </Text>
                <Text variant="bodyMdStrong" color="ink">
                  {data.issuedDate
                    ? format(new Date(data.issuedDate), 'dd MMM yyyy')
                    : format(new Date(data.createdAt), 'dd MMM yyyy')}
                </Text>
                {data.dueDate ? (
                  <>
                    <Text variant="caption" color="body" style={styles.gap}>
                      Due
                    </Text>
                    <Text variant="bodyMdStrong" color="ink">
                      {format(new Date(data.dueDate), 'dd MMM yyyy')}
                    </Text>
                  </>
                ) : null}
                {data.paidDate ? (
                  <>
                    <Text variant="caption" color="body" style={styles.gap}>
                      Paid
                    </Text>
                    <Text variant="bodyMdStrong" color="ink">
                      {format(new Date(data.paidDate), 'dd MMM yyyy')}
                    </Text>
                  </>
                ) : null}
                {data.notes ? (
                  <>
                    <Text variant="caption" color="body" style={styles.gap}>
                      Notes
                    </Text>
                    <Text variant="bodyMd" color="ink">
                      {data.notes}
                    </Text>
                  </>
                ) : null}
              </Card>

              <View style={styles.actions}>
                {data.pdfUrl ? (
                  <Button
                    label="Open PDF"
                    variant="secondary"
                    iconLeft="arrow-right"
                    onPress={() => void Linking.openURL(data.pdfUrl!)}
                  />
                ) : null}
                {data.paymentStatus !== 'paid' && data.status !== 'cancelled' ? (
                  <Button
                    label="Mark paid"
                    variant="brand"
                    iconLeft="check"
                    loading={marking}
                    onPress={onMarkPaid}
                  />
                ) : null}
                {data.status !== 'cancelled' && data.paymentStatus !== 'paid' ? (
                  <Button
                    label="Cancel invoice"
                    variant="subtle"
                    loading={cancelling}
                    onPress={onCancel}
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
  badges: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
  card: { gap: spacing.sm },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.xs },
  lineRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: palette.surfacePressed,
    gap: spacing.md,
  },
  lineBody: { flex: 1, gap: 2 },
  gap: { marginTop: spacing.md },
  actions: { gap: spacing.sm },
})
