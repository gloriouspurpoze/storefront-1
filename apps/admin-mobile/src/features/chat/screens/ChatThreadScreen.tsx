import { useState } from 'react'
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { useRoute, type RouteProp } from '@react-navigation/native'
import { format } from 'date-fns'
import { Button } from '@/components/ui/Button'
import { QueryState } from '@/components/common/QueryState'
import { PermissionGate } from '@/navigation/guards/PermissionGate'
import type { ChatStackParamList } from '@/navigation/types'
import { useGetMessagesQuery, useSendMessageMutation } from '@/store/api/chatApi'
import { colors } from '@/theme/colors'

export function ChatThreadScreen() {
  const route = useRoute<RouteProp<ChatStackParamList, 'ChatThread'>>()
  const { data = [], isLoading, isError, refetch } = useGetMessagesQuery(route.params.threadId)
  const [sendMessage, { isLoading: sending }] = useSendMessageMutation()
  const [draft, setDraft] = useState('')

  const onSend = async () => {
    const content = draft.trim()
    if (!content) return
    setDraft('')
    await sendMessage({ conversationId: route.params.threadId, content })
  }

  return (
    <PermissionGate webPath="/chat">
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={88}
      >
        <QueryState isLoading={isLoading} isError={isError} onRetry={refetch}>
          <FlatList
            data={[...data].reverse()}
            inverted
            keyExtractor={(m) => m._id}
            contentContainerStyle={styles.messages}
            renderItem={({ item }) => (
              <View style={styles.bubble}>
                <Text style={styles.sender}>
                  {item.senderId?.firstName} {item.senderId?.lastName}
                </Text>
                <Text style={styles.content}>{item.content}</Text>
                <Text style={styles.time}>{format(new Date(item.createdAt), 'HH:mm')}</Text>
              </View>
            )}
          />
        </QueryState>
        <View style={styles.composer}>
          <TextInput
            style={styles.input}
            placeholder="Message…"
            placeholderTextColor={colors.textMuted}
            value={draft}
            onChangeText={setDraft}
            multiline
          />
          <Button label="Send" onPress={onSend} loading={sending} />
        </View>
      </KeyboardAvoidingView>
    </PermissionGate>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  messages: { padding: 12, gap: 8 },
  bubble: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sender: { color: colors.primary, fontSize: 12, fontWeight: '600', marginBottom: 4 },
  content: { color: colors.text, fontSize: 15 },
  time: { color: colors.textMuted, fontSize: 11, marginTop: 6, alignSelf: 'flex-end' },
  composer: {
    flexDirection: 'row',
    gap: 8,
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    color: colors.text,
    fontSize: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: colors.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
})
