import { forwardRef, useState } from 'react'
import {
  Pressable,
  StyleSheet,
  TextInput,
  View,
  type TextInputProps,
} from 'react-native'
import { Icon } from '@/components/ui/Icon'
import { Text } from '@/components/ui/Text'
import { hitTarget, palette, radius, spacing, typography } from '@/theme'

type Props = TextInputProps & {
  label?: string
  helperText?: string
  error?: string
  rightSlot?: React.ReactNode
  /**
   * Surface variant.
   * - `soft` (default): for `Screen surface="canvas"` white pages
   * - `softer`: for nested cards
   * - `canvas`: pure white pill — required when the screen surface is already `soft`,
   *   so the input doesn't blend into the page (search bars on list pages).
   */
  surface?: 'soft' | 'softer' | 'canvas'
}

/**
 * `text-input` / `text-input-on-soft` per DESIGN.md §Inputs & Forms.
 */
export const Input = forwardRef<TextInput, Props>(function Input(
  {
    label,
    helperText,
    error,
    style,
    rightSlot,
    surface = 'soft',
    onFocus,
    onBlur,
    ...rest
  },
  ref,
) {
  const [focused, setFocused] = useState(false)
  const fill =
    surface === 'softer'
      ? palette.canvasSofter
      : surface === 'canvas'
        ? palette.canvas
        : palette.canvasSoft

  return (
    <View style={styles.wrap}>
      {label ? (
        <Text variant="bodySmStrong" color="hairlineMid">
          {label}
        </Text>
      ) : null}
      <View
        style={[
          styles.inputBox,
          { backgroundColor: fill },
          surface === 'canvas' && styles.inputBoxOutlined,
          focused && styles.inputBoxFocused,
          error && styles.inputBoxError,
        ]}
      >
        <TextInput
          ref={ref}
          placeholderTextColor={palette.mute}
          style={[styles.input, style]}
          onFocus={(e) => {
            setFocused(true)
            onFocus?.(e)
          }}
          onBlur={(e) => {
            setFocused(false)
            onBlur?.(e)
          }}
          {...rest}
        />
        {rightSlot ? <View style={styles.rightSlot}>{rightSlot}</View> : null}
      </View>
      {error ? (
        <Text variant="caption" color="danger">
          {error}
        </Text>
      ) : helperText ? (
        <Text variant="caption" color="body">
          {helperText}
        </Text>
      ) : null}
    </View>
  )
})

type PasswordInputProps = Omit<Props, 'secureTextEntry' | 'rightSlot'>

export const PasswordInput = forwardRef<TextInput, PasswordInputProps>(
  function PasswordInput(props, ref) {
    const [visible, setVisible] = useState(false)
    return (
      <Input
        ref={ref}
        {...props}
        secureTextEntry={!visible}
        autoCapitalize="none"
        autoCorrect={false}
        textContentType="password"
        rightSlot={
          <Pressable
            onPress={() => setVisible((v) => !v)}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel={visible ? 'Hide password' : 'Show password'}
            style={({ pressed }) => [styles.eyeBtn, pressed && styles.eyePressed]}
          >
            <Icon name={visible ? 'eye-off' : 'eye'} size={18} color={palette.body} />
          </Pressable>
        }
      />
    )
  },
)

const styles = StyleSheet.create({
  wrap: { gap: spacing.sm },
  inputBox: {
    minHeight: hitTarget.comfortable + 4,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'transparent',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  inputBoxOutlined: {
    borderColor: palette.surfacePressed,
  },
  inputBoxFocused: {
    borderColor: palette.primary,
  },
  inputBoxError: {
    borderColor: palette.danger,
  },
  input: {
    flex: 1,
    color: palette.ink,
    paddingVertical: spacing.md,
    ...typography.bodyMd,
  },
  rightSlot: {
    marginLeft: spacing.sm,
  },
  eyeBtn: {
    padding: spacing.xs,
    borderRadius: radius.full,
  },
  eyePressed: {
    backgroundColor: palette.surfacePressed,
  },
})
