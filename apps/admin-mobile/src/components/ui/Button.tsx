import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  type PressableProps,
  type ViewStyle,
} from 'react-native'
import { Icon, type IconName } from '@/components/ui/Icon'
import { hitTarget, palette, radius, spacing, typography } from '@/theme'

type Variant = 'primary' | 'secondary' | 'subtle' | 'brand' | 'ghost'

type Props = PressableProps & {
  label: string
  loading?: boolean
  variant?: Variant
  /** Optional leading icon — useful for "Add booking" / "Sign in" style buttons. */
  iconLeft?: IconName
  iconRight?: IconName
  /** When true, fills the parent's width (default). */
  block?: boolean
  size?: 'md' | 'lg'
}

/**
 * Pill button — DESIGN.md §Buttons.
 * - `primary`   → navy `button-primary`
 * - `secondary` → white `button-secondary`
 * - `subtle`    → soft gray `button-subtle`
 * - `brand`     → amber accent (button-brand)
 * - `ghost`     → transparent text-only button
 */
export function Button({
  label,
  loading,
  variant = 'primary',
  iconLeft,
  iconRight,
  block = true,
  size = 'md',
  disabled,
  style,
  ...rest
}: Props) {
  const isDisabled = disabled || loading
  const v = VARIANT_STYLES[variant]
  const sizeStyle = size === 'lg' ? styles.lg : styles.md
  const labelStyle = size === 'lg' ? typography.buttonLarge : typography.buttonMd

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!isDisabled, busy: !!loading }}
      disabled={isDisabled}
      style={(state) => {
        const base: ViewStyle[] = [
          styles.base,
          sizeStyle,
          { backgroundColor: v.bg, borderColor: v.border ?? 'transparent' },
          v.border ? styles.bordered : null,
          state.pressed && !isDisabled ? styles.pressed : null,
          isDisabled ? styles.disabled : null,
          block ? styles.block : null,
        ].filter(Boolean) as ViewStyle[]
        if (typeof style === 'function') return [...base, style(state)]
        return [...base, style as ViewStyle]
      }}
      {...rest}
    >
      <View style={styles.row}>
        {loading ? (
          <ActivityIndicator color={v.fg} />
        ) : (
          <>
            {iconLeft ? <Icon name={iconLeft} size={18} color={v.fg} /> : null}
            <Text style={[labelStyle, { color: v.fg }]}>{label}</Text>
            {iconRight ? <Icon name={iconRight} size={18} color={v.fg} /> : null}
          </>
        )}
      </View>
    </Pressable>
  )
}

const VARIANT_STYLES: Record<
  Variant,
  { bg: string; fg: string; border?: string }
> = {
  primary: { bg: palette.primary, fg: palette.onPrimary },
  secondary: { bg: palette.canvas, fg: palette.ink, border: palette.surfacePressed },
  subtle: { bg: palette.canvasSoft, fg: palette.ink },
  brand: { bg: palette.secondary, fg: palette.onSecondary },
  ghost: { bg: 'transparent', fg: palette.primary },
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bordered: {
    borderWidth: StyleSheet.hairlineWidth,
  },
  md: {
    minHeight: hitTarget.comfortable,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 2,
  },
  lg: {
    minHeight: hitTarget.large,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  block: {
    alignSelf: 'stretch',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  pressed: { opacity: 0.85 },
  disabled: { opacity: 0.5 },
})
