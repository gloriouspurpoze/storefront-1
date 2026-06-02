import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { ChatInboxScreen } from '@/features/chat/screens/ChatInboxScreen'
import { ChatThreadScreen } from '@/features/chat/screens/ChatThreadScreen'
import type { ChatStackParamList } from '@/navigation/types'
import { colors } from '@/theme/colors'

const Stack = createNativeStackNavigator<ChatStackParamList>()

export function ChatStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.text,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="ChatInbox" component={ChatInboxScreen} options={{ title: 'Chat' }} />
      <Stack.Screen name="ChatThread" component={ChatThreadScreen} options={{ title: 'Thread' }} />
    </Stack.Navigator>
  )
}
