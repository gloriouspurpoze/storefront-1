import { useMemo, useState } from 'react'
import { Alert, Linking, ScrollView, StyleSheet, View } from 'react-native'
import { useRoute, type RouteProp } from '@react-navigation/native'
import { format } from 'date-fns'
import type { OrderStatus } from '@profixer/api-client'
import { ActionSheetModal } from '@/components/common/ActionSheetModal'
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
  useCancelOrderMutation,
  useGetOrderQuery,
  useUpdateOrderStatusMutation,
} from '@/store/api/directoryApi'
import { palette, spacing } from '@/theme'

const NEXT_STATUS: Partial<Record<OrderStatus, OrderStatus[]>> = {
  pending: ['confirmed', 'processing', 'cancelled'],
  confirmed: ['processing', 'cancelled'],
  processing: ['shipped', 'cancelled'],
  shipped: ['delivered'],
}

const TERMINAL: OrderStatus[] = ['delivered', 'cancelled', 'refunded']

export function OrderDetailScreen() {
  const route = useRoute<RouteProp<MoreStackParamList, 'OrderDetail'>>()
  const { data, isLoading, isError, refetch } = useGetOrderQuery(route.params.id)
  const [updateStatus, { isLoading: updating }] = useUpdateOrderStatusMutation()
  const [cancelOrder, { isLoading: cancelling }] = useCancelOrderMutation()
  const [statusOpen, setStatusOpen] = useState(false)

  const id = String(data?.id ?? data?._id ?? route.params.id)

  const customer = data?.customer
  const customerName = customer
    ? `${customer.firstName ?? ''} ${customer.lastName ?? ''}`.trim() || customer.email || 'Customer'
    : 'Customer'

  const nextStatuses = useMemo<OrderStatus[]>(() => {
    if (!data) return []
    if (TERMINAL.includes(data.status)) return []
    return NEXT_STATUS[data.status] ?? []
  }, [data])

  const onPickStatus = async (statusId: string) => {
    if (!data) return
    const status = statusId as OrderStatus
    if (status === 'cancelled') {
      Alert.alert('Cancel order', `Cancel order #${data.orderNumber}? Stock will be restored.`, [
        { text: 'Keep', style: 'cancel' },
        {
          text: 'Cancel order',
          style: 'destructive',
          onPress: () => {
            void cancelOrder({ id, reason: 'Cancelled from mobile admin' })
              .unwrap()
              .then(() => refetch())
              .catch((e) => Alert.alert('Error', String((e as { message?: string })?.message ?? 'Cancel failed')))
          },
        },
      ])
      return
    }
    void updateStatus({ id, status })
      .unwrap()
      .then(() => refetch())
      .catch((e) =>
        Alert.alert('Error', String((e as { message?: string })?.message ?? 'Update failed')),
      )
  }

  return (
    <PermissionGate webPath="/orders">
      <Screen surface="soft">
        <QueryState isLoading={isLoading} isError={isError} onRetry={refetch}>
          {data ? (
            <ScrollView contentContainerStyle={styles.content}>
              <ScreenHeader
                title={`Order #${data.orderNumber}`}
                subtitle={`${customerName} · ${data.provider?.businessName ?? ''}`.trim()}
              />
              <View style={styles.badges}>
                <StatusBadge status={data.status} />
                <StatusBadge status={data.paymentStatus} />
              </View>

              <Card variant="content" padding="lg" style={styles.card}>
                <Text variant="caption" color="body">
                  Total
                </Text>
                <Text variant="displaySm" color="ink">
                  ₹{data.totalAmount.toLocaleString('en-IN')}
                </Text>
                {data.shippingAmount != null ? (
                  <View style={styles.row}>
                    <Text variant="bodySm" color="body">
                      Shipping
                    </Text>
                    <Text variant="bodySm" color="ink">
                      ₹{data.shippingAmount.toLocaleString('en-IN')}
                    </Text>
                  </View>
                ) : null}
                {data.taxAmount != null ? (
                  <View style={styles.row}>
                    <Text variant="bodySm" color="body">
                      Tax
                    </Text>
                    <Text variant="bodySm" color="ink">
                      ₹{data.taxAmount.toLocaleString('en-IN')}
                    </Text>
                  </View>
                ) : null}
                {data.discountAmount ? (
                  <View style={styles.row}>
                    <Text variant="bodySm" color="body">
                      Discount
                    </Text>
                    <Text variant="bodySm" color="ink">
                      −₹{data.discountAmount.toLocaleString('en-IN')}
                    </Text>
                  </View>
                ) : null}
              </Card>

              {data.items?.length ? (
                <Card variant="content" padding="lg" style={styles.card}>
                  <Text variant="bodyMdStrong" color="ink">
                    Items ({data.items.length})
                  </Text>
                  {data.items.map((item, idx) => (
                    <View key={`${item.productId}-${idx}`} style={styles.lineRow}>
                      <View style={styles.lineBody}>
                        <Text variant="bodyMd" color="ink">
                          {item.name}
                        </Text>
                        <Text variant="caption" color="body">
                          {item.quantity} × ₹{item.price.toLocaleString('en-IN')}
                        </Text>
                      </View>
                      <Text variant="bodyMdStrong" color="ink">
                        ₹{item.total.toLocaleString('en-IN')}
                      </Text>
                    </View>
                  ))}
                </Card>
              ) : null}

              <Card variant="content" padding="lg" style={styles.card}>
                <Text variant="bodyMdStrong" color="ink">
                  Shipping
                </Text>
                {data.shippingAddress ? (
                  <>
                    <Text variant="bodyMd" color="ink">
                      {data.shippingAddress.firstName} {data.shippingAddress.lastName}
                    </Text>
                    <Text variant="bodySm" color="body">
                      {data.shippingAddress.address}
                    </Text>
                    <Text variant="bodySm" color="body">
                      {data.shippingAddress.city}, {data.shippingAddress.state} {data.shippingAddress.zipCode}
                    </Text>
                    <Text variant="bodySm" color="body">
                      {data.shippingAddress.phone}
                    </Text>
                  </>
                ) : (
                  <Text variant="bodySm" color="body">
                    No shipping address on file.
                  </Text>
                )}
                {data.trackingNumber ? (
                  <>
                    <Text variant="caption" color="body" style={styles.gap}>
                      Tracking
                    </Text>
                    <Text variant="bodyMdStrong" color="ink">
                      {data.trackingNumber}
                    </Text>
                  </>
                ) : null}
                <Text variant="caption" color="body" style={styles.gap}>
                  Created
                </Text>
                <Text variant="bodyMdStrong" color="ink">
                  {format(new Date(data.createdAt), 'dd MMM yyyy · HH:mm')}
                </Text>
                {data.shippedAt ? (
                  <>
                    <Text variant="caption" color="body" style={styles.gap}>
                      Shipped
                    </Text>
                    <Text variant="bodyMdStrong" color="ink">
                      {format(new Date(data.shippedAt), 'dd MMM yyyy')}
                    </Text>
                  </>
                ) : null}
                {data.deliveredAt ? (
                  <>
                    <Text variant="caption" color="body" style={styles.gap}>
                      Delivered
                    </Text>
                    <Text variant="bodyMdStrong" color="ink">
                      {format(new Date(data.deliveredAt), 'dd MMM yyyy')}
                    </Text>
                  </>
                ) : null}
              </Card>

              <View style={styles.actions}>
                {nextStatuses.length > 0 ? (
                  <Button
                    label="Update status"
                    iconLeft="refresh"
                    loading={updating || cancelling}
                    onPress={() => setStatusOpen(true)}
                  />
                ) : null}
                {customer?.phone ? (
                  <Button
                    label="Call customer"
                    variant="secondary"
                    iconLeft="phone"
                    onPress={() => void Linking.openURL(`tel:${customer.phone}`)}
                  />
                ) : null}
                {customer?.email ? (
                  <Button
                    label="Email"
                    variant="subtle"
                    onPress={() => void Linking.openURL(`mailto:${customer.email}`)}
                  />
                ) : null}
              </View>
            </ScrollView>
          ) : null}
        </QueryState>

        <ActionSheetModal
          visible={statusOpen}
          title="Update order status"
          actions={nextStatuses.map((s) => ({
            id: s,
            label: s.replace(/_/g, ' '),
            destructive: s === 'cancelled',
          }))}
          onSelect={onPickStatus}
          onClose={() => setStatusOpen(false)}
        />
      </Screen>
    </PermissionGate>
  )
}

const styles = StyleSheet.create({
  content: { gap: spacing.lg, paddingBottom: spacing.xxxl },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
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
