import { Modal, Pressable, StyleSheet, View } from 'react-native'
import { Text } from '@/components/ui/Text'
import { palette, radius, spacing } from '@/theme'

export type ActionSheetItem = {
  id: string
  label: string
  destructive?: boolean
  disabled?: boolean
}

type Props = {
  visible: boolean
  title?: string
  message?: string
  actions: ActionSheetItem[]
  onSelect: (id: string) => void
  onClose: () => void
}

export function ActionSheetModal({ visible, title, message, actions, onSelect, onClose }: Props) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={styles.sheet}>
        {title ? (
          <Text variant="bodyMdStrong" color="ink" style={styles.title}>
            {title}
          </Text>
        ) : null}
        {message ? (
          <Text variant="bodySm" color="body" style={styles.message}>
            {message}
          </Text>
        ) : null}
        {actions.map((action) => (
          <Pressable
            key={action.id}
            disabled={action.disabled}
            onPress={() => {
              onSelect(action.id)
              onClose()
            }}
            style={({ pressed }) => [
              styles.action,
              pressed && !action.disabled && styles.actionPressed,
              action.disabled && styles.actionDisabled,
            ]}
          >
            <Text
              variant="bodyMdStrong"
              color={action.destructive ? 'danger' : 'ink'}
              align="center"
            >
              {action.label}
            </Text>
          </Pressable>
        ))}
        <Pressable onPress={onClose} style={styles.cancel}>
          <Text variant="bodyMdStrong" color="body" align="center">
            Cancel
          </Text>
        </Pressable>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 20, 47, 0.45)',
  },
  sheet: {
    backgroundColor: palette.canvas,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxxl,
    gap: spacing.sm,
  },
  title: { marginBottom: spacing.xxs },
  message: { marginBottom: spacing.sm },
  action: {
    paddingVertical: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: palette.canvasSoft,
  },
  actionPressed: { backgroundColor: palette.surfacePressed },
  actionDisabled: { opacity: 0.45 },
  cancel: {
    marginTop: spacing.sm,
    paddingVertical: spacing.lg,
  },
})
