import { ScrollView, StyleSheet, View, type ViewProps } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { palette, spacing } from '@/theme'

type Props = ViewProps & {
  scroll?: boolean
  edges?: ('top' | 'bottom' | 'left' | 'right')[]
  /** Horizontal gutter — defaults to lg (16px) per DESIGN.md mobile gutter. */
  gutter?: keyof typeof spacing | 'none'
  /** Surface fill — defaults to canvas white. Use `soft` for index/list pages. */
  surface?: 'canvas' | 'soft' | 'ink'
}

export function Screen({
  children,
  scroll,
  edges = ['top', 'bottom'],
  gutter = 'lg',
  surface = 'canvas',
  style,
  ...rest
}: Props) {
  const gutterPx = gutter === 'none' ? 0 : spacing[gutter]
  const bg = surface === 'ink' ? palette.ink : surface === 'soft' ? palette.canvasSoft : palette.canvas

  const content = scroll ? (
    <ScrollView
      contentContainerStyle={[styles.scroll, { paddingHorizontal: gutterPx }, style]}
      showsVerticalScrollIndicator={false}
      {...rest}
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.body, { paddingHorizontal: gutterPx }, style]} {...rest}>
      {children}
    </View>
  )

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: bg }]} edges={edges}>
      {content}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  body: {
    flex: 1,
    paddingVertical: spacing.lg,
    gap: spacing.lg,
  },
  scroll: {
    flexGrow: 1,
    paddingVertical: spacing.lg,
    gap: spacing.lg,
  },
})
