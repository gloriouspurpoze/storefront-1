import { Alert, Linking, ScrollView, StyleSheet, View } from 'react-native'
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { format } from 'date-fns'
import { ListRow } from '@/components/common/ListRow'
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
  useGetOrdersQuery,
  useGetUserQuery,
  useSetUserActiveMutation,
  useVerifyUserMutation,
} from '@/store/api/directoryApi'
import { spacing } from '@/theme'

export function UserDetailScreen() {
  const route = useRoute<RouteProp<MoreStackParamList, 'UserDetail'>>()
  const navigation = useNavigation<NativeStackNavigationProp<MoreStackParamList>>()
  const { data: user, isLoading, isError, refetch } = useGetUserQuery(route.params.id)
  const [setActive, { isLoading: toggling }] = useSetUserActiveMutation()
  const [verifyUser, { isLoading: verifying }] = useVerifyUserMutation()

  const { data: ordersData } = useGetOrdersQuery(
    user ? { userId: user.id, limit: 5 } : { limit: 0 },
    { skip: !user },
  )
  const recentOrders = ordersData?.orders ?? []

  const fullName = user
    ? `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || user.email
    : ''

  const onToggleActive = () => {
    if (!user) return
    const isActive = user.isActive !== false
    Alert.alert(
      isActive ? 'Deactivate user' : 'Activate user',
      `Confirm changing ${fullName}'s status?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: isActive ? 'Deactivate' : 'Activate',
          style: isActive ? 'destructive' : 'default',
          onPress: () => {
            void setActive({ id: user.id, isActive: !isActive })
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
      ],
    )
  }

  const onVerify = () => {
    if (!user) return
    Alert.alert('Verify user', `Mark ${fullName} as verified?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Verify',
        onPress: () => {
          void verifyUser(user.id)
            .unwrap()
            .catch((e) => {
              const msg =
                e && typeof e === 'object' && 'message' in e
                  ? String((e as { message: string }).message)
                  : 'Verification failed'
              Alert.alert('Error', msg)
            })
        },
      },
    ])
  }

  return (
    <PermissionGate webPath="/users/customers">
      <Screen surface="soft">
        <QueryState isLoading={isLoading} isError={isError} onRetry={refetch}>
          {user ? (
            <ScrollView contentContainerStyle={styles.content}>
              <ScreenHeader title={fullName || 'User'} subtitle={user.email} />
              <View style={styles.badges}>
                <StatusBadge status={user.userType.replace(/_/g, ' ')} tone="info" />
                <StatusBadge status={user.isActive === false ? 'inactive' : 'active'} />
                {user.isVerified ? <StatusBadge status="verified" tone="success" /> : null}
              </View>

              <Card variant="content" padding="lg" style={styles.card}>
                {user.phone ? (
                  <>
                    <Text variant="caption" color="body">
                      Phone
                    </Text>
                    <Text variant="bodyMdStrong" color="ink">
                      {user.phone}
                    </Text>
                  </>
                ) : null}
                <Text variant="caption" color="body" style={styles.gap}>
                  Joined
                </Text>
                <Text variant="bodyMdStrong" color="ink">
                  {format(new Date(user.createdAt), 'dd MMM yyyy')}
                </Text>
                {user.updatedAt ? (
                  <>
                    <Text variant="caption" color="body" style={styles.gap}>
                      Last update
                    </Text>
                    <Text variant="bodyMdStrong" color="ink">
                      {format(new Date(user.updatedAt), 'dd MMM yyyy · HH:mm')}
                    </Text>
                  </>
                ) : null}
                <Text variant="caption" color="body" style={styles.gap}>
                  User ID
                </Text>
                <Text variant="bodySm" color="ink">
                  {user.id}
                </Text>
              </Card>

              {recentOrders.length > 0 ? (
                <View style={styles.section}>
                  <ScreenHeader
                    title="Recent orders"
                    subtitle={`${recentOrders.length} shown`}
                  />
                  {recentOrders.map((o) => (
                    <ListRow
                      key={o.id || o._id}
                      title={`#${o.orderNumber}`}
                      subtitle={`₹${o.totalAmount.toLocaleString('en-IN')}`}
                      meta={`${o.status} · ${format(new Date(o.createdAt), 'dd MMM yyyy')}`}
                      onPress={() =>
                        navigation.navigate('OrderDetail', { id: String(o.id || o._id) })
                      }
                    />
                  ))}
                </View>
              ) : null}

              <View style={styles.actions}>
                {user.phone ? (
                  <Button
                    label="Call"
                    iconLeft="phone"
                    onPress={() => void Linking.openURL(`tel:${user.phone}`)}
                  />
                ) : null}
                <Button
                  label="Email"
                  variant="secondary"
                  onPress={() => void Linking.openURL(`mailto:${user.email}`)}
                />
                {!user.isVerified ? (
                  <Button
                    label="Verify user"
                    variant="brand"
                    iconLeft="check"
                    loading={verifying}
                    onPress={onVerify}
                  />
                ) : null}
                <Button
                  label={user.isActive === false ? 'Activate' : 'Deactivate'}
                  variant="subtle"
                  loading={toggling}
                  onPress={onToggleActive}
                />
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
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  card: { gap: spacing.sm },
  gap: { marginTop: spacing.md },
  section: { gap: spacing.sm },
  actions: { gap: spacing.sm },
})
