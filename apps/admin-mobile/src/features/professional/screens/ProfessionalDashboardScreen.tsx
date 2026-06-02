import { StyleSheet, View } from 'react-native'
import { KpiCard } from '@/components/common/KpiCard'
import { ScreenHeader } from '@/components/common/ScreenHeader'
import { Screen } from '@/components/layout/Screen'
import { useGetProfessionalBookingsQuery } from '@/store/api/bookingsApi'

export function ProfessionalDashboardScreen() {
  const { data } = useGetProfessionalBookingsQuery({ limit: 5 })
  const jobs = data?.bookings?.length ?? 0

  return (
    <Screen scroll>
      <ScreenHeader title="Pro dashboard" subtitle="Today's work" />
      <View style={styles.kpis}>
        <KpiCard label="Assigned jobs" value={String(jobs)} />
        <KpiCard label="Status" value="Field" />
      </View>
    </Screen>
  )
}

const styles = StyleSheet.create({ kpis: { flexDirection: 'row', gap: 10 } })
