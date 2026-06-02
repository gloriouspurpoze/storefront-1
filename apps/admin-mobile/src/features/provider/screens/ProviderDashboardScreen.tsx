import { StyleSheet, Text, View } from 'react-native'
import { KpiCard } from '@/components/common/KpiCard'
import { ScreenHeader } from '@/components/common/ScreenHeader'
import { Screen } from '@/components/layout/Screen'
import { useGetProviderBookingsQuery } from '@/store/api/bookingsApi'
import { colors } from '@/theme/colors'

export function ProviderDashboardScreen() {
  const { data } = useGetProviderBookingsQuery({ limit: 5 })
  const upcoming = data?.bookings?.length ?? 0

  return (
    <Screen scroll>
      <ScreenHeader title="Provider" subtitle="Your business at a glance" />
      <View style={styles.kpis}>
        <KpiCard label="Upcoming jobs" value={String(upcoming)} />
        <KpiCard label="Earnings" value="—" hint="Open web for payouts" />
      </View>
      <Text style={styles.note}>Full earnings & payout approval flows are on the provider web portal.</Text>
    </Screen>
  )
}

const styles = StyleSheet.create({
  kpis: { flexDirection: 'row', gap: 10 },
  note: { color: colors.textMuted, fontSize: 14, lineHeight: 20, marginTop: 16 },
})
