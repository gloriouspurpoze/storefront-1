import { Text as RNText, type TextProps as RNTextProps, type TextStyle } from 'react-native'
import { palette, typography, type PaletteToken, type TypographyToken } from '@/theme'

type Props = RNTextProps & {
  variant?: TypographyToken
  color?: PaletteToken | string
  align?: TextStyle['textAlign']
}

/**
 * Typography primitive — applies a DESIGN.md type token + palette colour.
 * Always prefer this over raw `<Text>` so the type ramp stays consistent.
 */
export function Text({
  variant = 'bodyMd',
  color = 'ink',
  align,
  style,
  children,
  ...rest
}: Props) {
  const resolvedColor =
    color in palette ? palette[color as PaletteToken] : (color as string)
  return (
    <RNText
      style={[
        typography[variant] as TextStyle,
        { color: resolvedColor },
        align ? { textAlign: align } : null,
        style,
      ]}
      {...rest}
    >
      {children}
    </RNText>
  )
}
