import { Linking, ScrollView, StyleSheet, View } from 'react-native'
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { QueryState } from '@/components/common/QueryState'
import { ListRow } from '@/components/common/ListRow'
import { ScreenHeader } from '@/components/common/ScreenHeader'
import { StatusBadge } from '@/components/common/StatusBadge'
import { Screen } from '@/components/layout/Screen'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Text } from '@/components/ui/Text'
import { PermissionGate } from '@/navigation/guards/PermissionGate'
import type { OpsStackParamList } from '@/navigation/types'
import { useGetBookingsQuery } from '@/store/api/bookingsApi'
import { useGetProfessionalQuery } from '@/store/api/opsApi'
import { spacing } from '@/theme'

export function ProfessionalDetailScreen() {
  const route = useRoute<RouteProp<OpsStackParamList, 'ProfessionalDetail'>>()
  const navigation = useNavigation<NativeStackNavigationProp<OpsStackParamList>>()
  const { data: pro, isLoading, isError, refetch } = useGetProfessionalQuery(route.params.id)
  const { data: bookingsData } = useGetBookingsQuery({
    professionalId: route.params.id,
    limit: 5,
    page: 1,
  })

  const name = pro ? `${pro.firstName} ${pro.lastName}`.trim() : 'Professional'
  const recentBookings = bookingsData?.bookings ?? []

  return (
    <PermissionGate webPath="/professionals">
      <Screen surface="soft">
        <QueryState isLoading={isLoading} isError={isError} onRetry={refetch}>
          {pro ? (
            <ScrollView contentContainerStyle={styles.content}>
              <ScreenHeader title={name} subtitle={pro.email} />
              <StatusBadge status={pro.availability ?? 'offline'} />
              <Card variant="content" padding="lg">
                <Text variant="caption" color="body">
                  Phone
                </Text>
                <Text variant="bodyMdStrong" color="ink">
                  {pro.phoneNumber}
                </Text>
                {pro.address?.city ? (
                  <>
                    <Text variant="caption" color="body" style={styles.gap}>
                      City
                    </Text>
                    <Text variant="bodyMdStrong" color="ink">
                      {pro.address.city}
                      {pro.address.area ? ` · ${pro.address.area}` : ''}
                    </Text>
                  </>
                ) : null}
                <Text variant="caption" color="body" style={styles.gap}>
                  Verified
                </Text>
                <Text variant="bodyMdStrong" color="ink">
                  {pro.isVerified ? 'Yes' : 'Pending'}
                </Text>
                <Text variant="caption" color="body" style={styles.gap}>
                  Professional ID
                </Text>
                <Text variant="bodySm" color="ink">
                  {pro.professionalId || pro.id}
                </Text>
              </Card>
              {recentBookings.length > 0 ? (
                <View style={styles.section}>
                  <ScreenHeader title="Recent bookings" subtitle={`${recentBookings.length} shown`} />
                  {recentBookings.map((b) => (
                    <ListRow
                      key={b.id || b._id}
                      title={b.serviceName || b.bookingNumber || 'Booking'}
                      subtitle={b.customerName || 'Customer'}
                      meta={b.status}
                      onPress={() =>
                        navigation.navigate('BookingDetail', { id: String(b.id || b._id) })
                      }
                    />
                  ))}
                </View>
              ) : null}
              <View style={styles.actions}>
                <Button
                  label="Call"
                  variant="primary"
                  iconLeft="phone"
                  onPress={() => void Linking.openURL(`tel:${pro.phoneNumber}`)}
                />
                <Button
                  label="Email"
                  variant="secondary"
                  onPress={() => void Linking.openURL(`mailto:${pro.email}`)}
                />
                <Button
                  label="Live map"
                  variant="subtle"
                  iconLeft="map-pin"
                  onPress={() => navigation.navigate('LiveMap')}
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
  gap: { marginTop: spacing.md },
  section: { gap: spacing.sm },
  actions: { gap: spacing.sm },
})
