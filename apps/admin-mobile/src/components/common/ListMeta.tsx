import { StyleSheet, View } from 'react-native'
import { Text } from '@/components/ui/Text'
import { spacing } from '@/theme'

type Props = {
  /** Primary line — usually a count or summary, e.g. "12 customers". */
  text: string
  /** Optional secondary line below the primary. */
  hint?: string
}

/**
 * Tiny meta line shown above filter chips / lists. Use this on screens that
 * already render a native stack header (so the title isn't repeated). DESIGN.md
 * §Lists & Tables — keep page surfaces uncluttered above content.
 */
export function ListMeta({ text, hint }: Props) {
  return (
    <View style={styles.wrap}>
      <Text variant="bodySm" color="body">
        {text}
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
  wrap: {
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
    gap: 2,
  },
})
