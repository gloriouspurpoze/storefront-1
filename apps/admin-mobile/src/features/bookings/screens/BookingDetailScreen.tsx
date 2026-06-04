import { useMemo, useState } from 'react'
import { Linking, ScrollView, StyleSheet, View } from 'react-native'
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native'
import type { CompositeNavigationProp } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { ActionSheetModal } from '@/components/common/ActionSheetModal'
import { QueryState } from '@/components/common/QueryState'
import { ScreenHeader } from '@/components/common/ScreenHeader'
import { StatusBadge } from '@/components/common/StatusBadge'
import { Screen } from '@/components/layout/Screen'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Text } from '@/components/ui/Text'
import { AssignProfessionalModal } from '@/features/bookings/components/AssignProfessionalModal'
import { useVerticalLabels } from '@/hooks/useVerticalLabels'
import { nextStatusActions } from '@/lib/bookingWorkflow'
import { safeFormatFirst } from '@/lib/datetime'
import { PermissionGate } from '@/navigation/guards/PermissionGate'
import type { AdminTabParamList, OpsStackParamList } from '@/navigation/types'
import {
  useCancelBookingMutation,
  useGetBookingQuery,
  useUpdateBookingStatusMutation,
} from '@/store/api/bookingsApi'
import { useGetPaymentsQuery } from '@/store/api/financeApi'
import { spacing } from '@/theme'

export function BookingDetailScreen() {
  const route = useRoute<RouteProp<OpsStackParamList, 'BookingDetail'>>()
  const navigation = useNavigation<
    CompositeNavigationProp<
      NativeStackNavigationProp<OpsStackParamList>,
      NativeStackNavigationProp<AdminTabParamList>
    >
  >()

  const labels = useVerticalLabels()
  const { data: booking, isLoading, isError, refetch } = useGetBookingQuery(route.params.id)
  const [updateStatus, { isLoading: updating }] = useUpdateBookingStatusMutation()
  const [cancelBooking, { isLoading: cancelling }] = useCancelBookingMutation()
  const { data: paymentsData } = useGetPaymentsQuery({ bookingId: route.params.id, limit: 5 })
  const bookingPayments = paymentsData?.payments ?? []

  const [assignOpen, setAssignOpen] = useState(false)
  const [statusSheetOpen, setStatusSheetOpen] = useState(false)

  const statusActions = useMemo(
    () => (booking ? nextStatusActions(booking.status) : []),
    [booking],
  )

  const proName = booking?.professional
    ? `${booking.professional.firstName ?? ''} ${booking.professional.lastName ?? ''}`.trim()
    : null

  const callCustomer = () => {
    const phone = booking?.customerPhone || booking?.customer?.phone
    if (phone) void Linking.openURL(`tel:${phone}`)
  }

  const onStatusPick = async (actionId: string) => {
    if (!booking) return
    const action = statusActions.find((a) => a.status === actionId)
    if (!action) return
    if (action.status === 'cancelled') {
      await cancelBooking({ id: booking.id || route.params.id, reason: 'Cancelled from mobile' })
    } else {
      await updateStatus({ id: booking.id || route.params.id, status: action.status })
    }
    refetch()
  }

  return (
    <PermissionGate webPath="/bookings">
      <Screen surface="soft">
        <QueryState isLoading={isLoading} isError={isError} onRetry={refetch}>
          {booking ? (
            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
              <ScreenHeader
                title={booking.serviceName || booking.bookingNumber || labels.engagementSingular}
                subtitle={booking.customerName || 'Customer'}
              />
              <StatusBadge status={booking.status} />

              <Card variant="content" padding="lg">
                <DetailRow
                  label="Amount"
                  value={
                    booking.totalAmount != null
                      ? `₹${booking.totalAmount.toLocaleString('en-IN')}`
                      : '—'
                  }
                />
                <DetailRow
                  label="Scheduled"
                  value={
                    booking.scheduledDate
                      ? safeFormatFirst([booking.scheduledDate], 'PPP p')
                      : safeFormatFirst([booking.createdAt], 'PPP')
                  }
                />
                <DetailRow
                  label="Phone"
                  value={booking.customerPhone || booking.customer?.phone || '—'}
                />
                <DetailRow label="City" value={booking.city || booking.address?.city || '—'} />
                <DetailRow label="Professional" value={proName || 'Unassigned'} />
                {booking.notes ? <DetailRow label="Notes" value={booking.notes} /> : null}
              </Card>

              <View style={styles.actions}>
                {statusActions.length > 0 ? (
                  <Button
                    label="Update status"
                    variant="primary"
                    loading={updating || cancelling}
                    onPress={() => setStatusSheetOpen(true)}
                  />
                ) : null}
                <Button
                  label={proName ? 'Reassign professional' : 'Assign professional'}
                  variant="secondary"
                  onPress={() => setAssignOpen(true)}
                />
                <Button
                  label="Call customer"
                  variant="subtle"
                  iconLeft="phone"
                  onPress={callCustomer}
                />
                <Button
                  label="Open chat"
                  variant="ghost"
                  iconLeft="message-square"
                  onPress={() =>
                    // Tab navigator nested screen — typed loosely until param lists are merged
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    (navigation as any).navigate('ChatTab', { screen: 'ChatInbox' })
                  }
                />
                {booking.professionalId || booking.professional?._id ? (
                  <Button
                    label="View professional"
                    variant="ghost"
                    onPress={() =>
                      navigation.navigate('ProfessionalDetail', {
                        id: String(booking.professionalId || booking.professional?._id),
                      })
                    }
                  />
                ) : null}
                {bookingPayments.length > 0 ? (
                  <Button
                    label={`View payment (${bookingPayments.length})`}
                    variant="ghost"
                    iconLeft="wallet"
                    onPress={() => {
                      const first = bookingPayments[0]
                      const id = String(first._id ?? first.id ?? '')
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      ;(navigation as any).navigate('MoreTab', {
                        screen: 'PaymentDetail',
                        params: { id },
                      })
                    }}
                  />
                ) : null}
              </View>
            </ScrollView>
          ) : null}
        </QueryState>

        <AssignProfessionalModal
          visible={assignOpen}
          bookingId={route.params.id}
          onClose={() => setAssignOpen(false)}
          onAssigned={refetch}
        />

        <ActionSheetModal
          visible={statusSheetOpen}
          title="Update booking status"
          actions={statusActions.map((a) => ({
            id: a.status,
            label: a.label,
            destructive: a.status === 'cancelled',
          }))}
          onSelect={onStatusPick}
          onClose={() => setStatusSheetOpen(false)}
        />
      </Screen>
    </PermissionGate>
  )
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text variant="caption" color="body">
        {label}
      </Text>
      <Text variant="bodyMdStrong" color="ink">
        {value}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  content: { gap: spacing.lg, paddingBottom: spacing.xxxl },
  row: { gap: spacing.xxs, marginBottom: spacing.md },
  actions: { gap: spacing.sm },
})
