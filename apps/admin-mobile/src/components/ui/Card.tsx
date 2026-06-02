import { StyleSheet, View, type ViewProps, type ViewStyle } from 'react-native'
import { elevation, palette, radius, spacing } from '@/theme'

type Variant = 'content' | 'soft' | 'elevated' | 'onDark'

type Props = ViewProps & {
  variant?: Variant
  padding?: keyof typeof spacing
  /** Override the standard `xl` 16px corner radius. */
  rounded?: keyof typeof radius
}

/**
 * `card-content` / `card-soft-tinted` / `card-elevated` / `promo-card-on-dark`
 * — see DESIGN.md §Cards & Containers.
 */
export function Card({
  variant = 'content',
  padding = 'xxl',
  rounded = 'xl',
  style,
  children,
  ...rest
}: Props) {
  const variantStyle = VARIANT_STYLES[variant]
  return (
    <View
      style={[
        styles.base,
        variantStyle,
        { padding: spacing[padding], borderRadius: radius[rounded] },
        style,
      ]}
      {...rest}
    >
      {children}
    </View>
  )
}

const VARIANT_STYLES: Record<Variant, ViewStyle> = {
  content: {
    backgroundColor: palette.canvas,
    borderColor: palette.surfacePressed,
    borderWidth: StyleSheet.hairlineWidth,
  },
  soft: {
    backgroundColor: palette.canvasSoft,
  },
  elevated: {
    backgroundColor: palette.canvas,
    ...elevation.subtle,
  },
  onDark: {
    backgroundColor: palette.ink,
  },
}

const styles = StyleSheet.create({
  base: {},
})
