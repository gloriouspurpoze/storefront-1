import type { ReactNode } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import { Icon } from '@/components/ui/Icon'
import { Text } from '@/components/ui/Text'
import { palette, radius, spacing } from '@/theme'

type Props = {
  title: string
  subtitle?: string
  meta?: string
  onPress?: () => void
  right?: ReactNode
  /** Show a chevron-right when the row is tappable. Defaults to true if `onPress` is set. */
  chevron?: boolean
}

export function ListRow({ title, subtitle, meta, onPress, right, chevron }: Props) {
  const showChevron = chevron ?? !!onPress

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [styles.row, pressed && onPress ? styles.pressed : null]}
    >
      <View style={styles.body}>
        <Text variant="bodyMdStrong" color="ink" numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text variant="bodySm" color="body" numberOfLines={2}>
            {subtitle}
          </Text>
        ) : null}
        {meta ? (
          <Text variant="caption" color="mute">
            {meta}
          </Text>
        ) : null}
      </View>
      {right}
      {showChevron && !right ? (
        <Icon name="chevron-right" size={18} color={palette.mute} />
      ) : null}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: palette.canvas,
    borderRadius: radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.surfacePressed,
    padding: spacing.lg,
  },
  pressed: { backgroundColor: palette.canvasSoft },
  body: { flex: 1, gap: spacing.xxs },
})
