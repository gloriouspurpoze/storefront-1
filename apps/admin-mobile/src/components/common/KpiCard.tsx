import { StyleSheet, View } from 'react-native'
import { Icon, type IconName } from '@/components/ui/Icon'
import { Text } from '@/components/ui/Text'
import { palette, radius, spacing } from '@/theme'

type Props = {
  label: string
  value: string
  hint?: string
  icon?: IconName
  /** Tint the icon container with brand secondary instead of canvas-soft. */
  accent?: boolean
}

/**
 * Compact KPI tile — used on dashboards. Mirrors `card-content` chrome with
 * a soft icon-bubble per DESIGN.md icon-button-circular.
 */
export function KpiCard({ label, value, hint, icon, accent }: Props) {
  return (
    <View style={styles.card}>
      {icon ? (
        <View style={[styles.iconBubble, accent && styles.iconBubbleAccent]}>
          <Icon
            name={icon}
            size={18}
            color={accent ? palette.onSecondary : palette.primary}
          />
        </View>
      ) : null}
      <Text variant="caption" color="body">
        {label}
      </Text>
      <Text variant="displaySm" color="ink">
        {value}
      </Text>
      {hint ? (
        <Text variant="caption" color="mute">
          {hint}
        </Text>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: '47%',
    backgroundColor: palette.canvas,
    borderRadius: radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.surfacePressed,
    padding: spacing.lg,
    gap: spacing.xxs,
  },
  iconBubble: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    backgroundColor: palette.canvasSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  iconBubbleAccent: {
    backgroundColor: palette.secondarySoft,
  },
})
