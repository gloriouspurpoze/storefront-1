import { useMemo, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native'
import { Text } from '@/components/ui/Text'
import { useGetProfessionalsQuery } from '@/store/api/opsApi'
import { useAssignProfessionalMutation } from '@/store/api/bookingsApi'
import { palette, radius, spacing } from '@/theme'

type Props = {
  visible: boolean
  bookingId: string
  onClose: () => void
  onAssigned?: () => void
}

export function AssignProfessionalModal({ visible, bookingId, onClose, onAssigned }: Props) {
  const [search, setSearch] = useState('')
  const { data, isLoading } = useGetProfessionalsQuery({ limit: 50, search: search || undefined })
  const [assign, { isLoading: assigning }] = useAssignProfessionalMutation()

  const list = useMemo(() => data?.professionals ?? [], [data])

  const pick = async (professionalId: string) => {
    try {
      await assign({ bookingId, professionalId }).unwrap()
      onAssigned?.()
      onClose()
    } catch (e) {
      const msg =
        e && typeof e === 'object' && 'message' in e
          ? String((e as { message: string }).message)
          : 'Could not assign professional. Please try again.'
      Alert.alert('Assignment failed', msg)
    }
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text variant="displaySm" color="ink">
            Assign professional
          </Text>
          <Pressable onPress={onClose} hitSlop={12}>
            <Text variant="bodyMdStrong" color="link">
              Close
            </Text>
          </Pressable>
        </View>
        <TextInput
          placeholder="Search by name, email, phone…"
          placeholderTextColor={palette.mute}
          value={search}
          onChangeText={setSearch}
          style={styles.search}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {isLoading ? (
          <ActivityIndicator color={palette.primary} style={styles.loader} />
        ) : (
          <FlatList
            data={list}
            keyExtractor={(p) => p._id || p.id}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => {
              // Backend assign requires the Mongo _id (ObjectId.isValid + findById).
              // The human code `professionalId` (PRO-…) fails validation — never use it here.
              const id = item._id || item.id
              const name = `${item.firstName} ${item.lastName}`.trim()
              return (
                <Pressable
                  disabled={assigning}
                  onPress={() => pick(id)}
                  style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
                >
                  <View style={styles.rowBody}>
                    <Text variant="bodyMdStrong" color="ink">
                      {name}
                    </Text>
                    <Text variant="bodySm" color="body">
                      {item.phoneNumber} · {item.availability ?? 'offline'}
                    </Text>
                  </View>
                  <Text variant="bodySmStrong" color="link">
                    Assign
                  </Text>
                </Pressable>
              )
            }}
            ItemSeparatorComponent={() => <View style={styles.sep} />}
            ListEmptyComponent={
              <Text variant="bodyMd" color="body" align="center" style={styles.empty}>
                No professionals match your search.
              </Text>
            }
          />
        )}
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.canvas, padding: spacing.lg },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  search: {
    backgroundColor: palette.canvasSoft,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    color: palette.ink,
    marginBottom: spacing.md,
  },
  loader: { marginTop: spacing.xxxl },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  rowPressed: { opacity: 0.85 },
  rowBody: { flex: 1, gap: 2 },
  sep: { height: StyleSheet.hairlineWidth, backgroundColor: palette.surfacePressed },
  empty: { marginTop: spacing.xxxl },
})
