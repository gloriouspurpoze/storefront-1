import { Pressable, ScrollView, StyleSheet, View } from 'react-native'
import { Text } from '@/components/ui/Text'
import { palette, radius, spacing } from '@/theme'

export type FilterChipOption<T extends string> = {
  id: T
  label: string
  count?: number
}

type Props<T extends string> = {
  options: FilterChipOption<T>[]
  value: T
  onChange: (value: T) => void
}

export function FilterChips<T extends string>({ options, value, onChange }: Props<T>) {
  return (
    <View style={styles.wrap}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
        style={styles.scroll}
      >
        {options.map((opt) => {
          const active = opt.id === value
          return (
            <Pressable
              key={opt.id}
              onPress={() => onChange(opt.id)}
              style={[styles.chip, active && styles.chipActive]}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
            >
              <Text variant="bodySmStrong" color={active ? 'onPrimary' : 'ink'}>
                {opt.label}
                {opt.count != null && opt.count > 0 ? ` (${opt.count})` : ''}
              </Text>
            </Pressable>
          )
        })}
        <View style={styles.trail} />
      </ScrollView>
    </View>
  )
}

const CHIP_HEIGHT = 36

const styles = StyleSheet.create({
  wrap: {
    height: CHIP_HEIGHT + spacing.sm * 2,
    marginVertical: spacing.xs,
  },
  scroll: {
    flexGrow: 0,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  chip: {
    height: CHIP_HEIGHT,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.pill,
    backgroundColor: palette.canvas,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.surfacePressed,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipActive: {
    backgroundColor: palette.primary,
    borderColor: palette.primary,
  },
  trail: { width: spacing.xs },
})
