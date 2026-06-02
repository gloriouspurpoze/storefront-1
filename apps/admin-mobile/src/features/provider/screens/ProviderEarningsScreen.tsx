import { StyleSheet, Text } from 'react-native'
import { EmptyState } from '@/components/common/EmptyState'
import { Screen } from '@/components/layout/Screen'
import { colors } from '@/theme/colors'

export function ProviderEarningsScreen() {
  return (
    <Screen>
      <EmptyState
        title="Earnings"
        description="Payout history and tax documents are available in the provider web portal (/provider/earnings)."
      />
      <Text style={styles.hint}>Mobile shows bookings & chat; finance detail stays on web for now.</Text>
    </Screen>
  )
}

const styles = StyleSheet.create({
  hint: { color: colors.textMuted, textAlign: 'center', padding: 16, fontSize: 13 },
})
