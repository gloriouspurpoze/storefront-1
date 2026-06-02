import { StyleSheet, View } from 'react-native'
import { Text } from '@/components/ui/Text'
import { palette, radius, spacing } from '@/theme'

type Tone = 'neutral' | 'info' | 'warning' | 'success' | 'danger'

const STATUS_TONE: Record<string, Tone> = {
  pending: 'warning',
  confirmed: 'info',
  scheduled: 'info',
  in_progress: 'info',
  on_route: 'info',
  completed: 'success',
  resolved: 'success',
  cancelled: 'danger',
  rejected: 'danger',
  failed: 'danger',
  open: 'warning',
  new: 'info',
  // user / approval state
  verified: 'success',
  active: 'success',
  approved: 'success',
  unverified: 'warning',
  inactive: 'neutral',
  suspended: 'danger',
  // payments / orders
  paid: 'success',
  refunded: 'neutral',
  processing: 'info',
  shipped: 'info',
  delivered: 'success',
  // payouts
  released: 'success',
  on_hold: 'warning',
}

const TONE_STYLES: Record<Tone, { bg: string; fg: string }> = {
  neutral: { bg: palette.canvasSoft, fg: palette.body },
  info: { bg: palette.primarySoft, fg: palette.primary },
  warning: { bg: palette.warningSoft, fg: palette.warning },
  success: { bg: palette.successSoft, fg: palette.success },
  danger: { bg: palette.dangerSoft, fg: palette.danger },
}

type Props = { status: string; tone?: Tone }

export function StatusBadge({ status, tone }: Props) {
  const key = status.toLowerCase().replace(/\s+/g, '_')
  const resolvedTone = tone ?? STATUS_TONE[key] ?? 'neutral'
  const { bg, fg } = TONE_STYLES[resolvedTone]
  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text variant="bodySmStrong" color={fg} style={styles.label}>
        {status.replace(/_/g, ' ')}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xxs,
    borderRadius: radius.pill,
    alignSelf: 'flex-start',
  },
  label: { textTransform: 'capitalize' },
})
