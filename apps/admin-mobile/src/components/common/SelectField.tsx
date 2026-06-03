import { useState } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import { ActionSheetModal } from '@/components/common/ActionSheetModal'
import { Icon } from '@/components/ui/Icon'
import { Text } from '@/components/ui/Text'
import { hitTarget, palette, radius, spacing } from '@/theme'

export type SelectOption = {
  id: string
  label: string
}

type Props = {
  label?: string
  placeholder?: string
  value?: string
  options: SelectOption[]
  onChange: (id: string) => void
  /** Sheet heading. */
  sheetTitle?: string
  disabled?: boolean
}

/**
 * Tap-to-open select backed by `ActionSheetModal`. Use for dynamic picker fields
 * (category, vendor) where chips would overflow.
 */
export function SelectField({
  label,
  placeholder = 'Select…',
  value,
  options,
  onChange,
  sheetTitle,
  disabled,
}: Props) {
  const [open, setOpen] = useState(false)
  const selected = options.find((o) => o.id === value)

  return (
    <View style={styles.wrap}>
      {label ? (
        <Text variant="bodySmStrong" color="hairlineMid">
          {label}
        </Text>
      ) : null}
      <Pressable
        disabled={disabled}
        onPress={() => setOpen(true)}
        style={({ pressed }) => [
          styles.field,
          pressed && !disabled && styles.fieldPressed,
          disabled && styles.fieldDisabled,
        ]}
      >
        <Text variant="bodyMd" color={selected ? 'ink' : 'mute'} numberOfLines={1} style={styles.value}>
          {selected?.label ?? placeholder}
        </Text>
        <Icon name="chevron-down" size={18} color={palette.mute} />
      </Pressable>
      <ActionSheetModal
        visible={open}
        title={sheetTitle ?? label}
        actions={options.map((o) => ({ id: o.id, label: o.label }))}
        onSelect={onChange}
        onClose={() => setOpen(false)}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.sm },
  field: {
    minHeight: hitTarget.comfortable + 4,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.surfacePressed,
    backgroundColor: palette.canvas,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
  },
  fieldPressed: { backgroundColor: palette.canvasSoft },
  fieldDisabled: { opacity: 0.5 },
  value: { flex: 1 },
})
