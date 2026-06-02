import { Alert, ScrollView, StyleSheet, View } from 'react-native'
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
import type { OpsStackParamList } from '@/navigation/types'
import {
  useGetServiceRequestQuery,
  useUpdateServiceRequestStatusMutation,
} from '@/store/api/phase2Api'
import { spacing } from '@/theme'

const NEXT_STATUS: Record<string, string | undefined> = {
  open: 'quoted',
  quoted: 'booked',
  booked: 'in_progress',
  in_progress: 'completed',
}

export function ServiceRequestDetailScreen() {
  const route = useRoute<RouteProp<OpsStackParamList, 'ServiceRequestDetail'>>()
  const { data, isLoading, isError, refetch } = useGetServiceRequestQuery(route.params.id)
  const [updateStatus, { isLoading: updating }] = useUpdateServiceRequestStatusMutation()

  const advance = () => {
    if (!data) return
    const next = NEXT_STATUS[data.status]
    if (!next) {
      Alert.alert('Done', 'This request is already at a terminal stage.')
      return
    }
    Alert.alert('Update status', `Move to "${next.replace(/_/g, ' ')}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Update',
        onPress: () => {
          void updateStatus({ id: data.id, status: next })
            .unwrap()
            .catch((e) => {
              const msg =
                e && typeof e === 'object' && 'message' in e
                  ? String((e as { message: string }).message)
                  : 'Update failed'
              Alert.alert('Error', msg)
            })
        },
      },
    ])
  }

  return (
    <PermissionGate webPath="/requests">
      <Screen surface="soft">
        <QueryState isLoading={isLoading} isError={isError} onRetry={refetch}>
          {data ? (
            <ScrollView contentContainerStyle={styles.content}>
              <ScreenHeader title={data.title} subtitle={data.serviceType} />
              <StatusBadge status={data.status} />
              <Card variant="content" padding="lg">
                <Text variant="caption" color="body">
                  Description
                </Text>
                <Text variant="bodyMd" color="ink">
                  {data.description || '—'}
                </Text>
                <Text variant="caption" color="body" style={styles.gap}>
                  Urgency
                </Text>
                <Text variant="bodyMdStrong" color="ink">
                  {data.urgency}
                </Text>
                {data.budgetMin != null || data.budgetMax != null ? (
                  <>
                    <Text variant="caption" color="body" style={styles.gap}>
                      Budget
                    </Text>
                    <Text variant="bodyMdStrong" color="ink">
                      ₹{data.budgetMin ?? 0} – ₹{data.budgetMax ?? '—'}
                    </Text>
                  </>
                ) : null}
                <Text variant="caption" color="body" style={styles.gap}>
                  Created
                </Text>
                <Text variant="bodyMdStrong" color="ink">
                  {format(new Date(data.createdAt), 'dd MMM yyyy · HH:mm')}
                </Text>
              </Card>
              {NEXT_STATUS[data.status] ? (
                <View style={styles.actions}>
                  <Button label="Advance status" loading={updating} onPress={advance} />
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
  gap: { marginTop: spacing.md },
  actions: { gap: spacing.sm },
})
