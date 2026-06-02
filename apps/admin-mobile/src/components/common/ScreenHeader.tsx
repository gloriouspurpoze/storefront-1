import { StyleSheet, View } from 'react-native'
import { Text } from '@/components/ui/Text'
import { spacing } from '@/theme'

type Props = {
  title: string
  subtitle?: string
  /** When true, uses the brand display-lg type (32px). Otherwise display-md (24px). */
  large?: boolean
}

export function ScreenHeader({ title, subtitle, large }: Props) {
  return (
    <View style={styles.wrap}>
      <Text variant={large ? 'displayLg' : 'displayMd'} color="ink">
        {title}
      </Text>
      {subtitle ? (
        <Text variant="bodyMd" color="body">
          {subtitle}
        </Text>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.xxs,
    marginBottom: spacing.xs,
  },
})
