import type { ChatConversation, ChatMessage } from '@profixer/api-client'
import { services } from '@/services/createMobileClient'
import { baseApi } from '@/store/api/baseApi'

export const chatApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getConversations: build.query<ChatConversation[], { support?: boolean } | void>({
      async queryFn(arg) {
        try {
          const list = arg?.support
            ? await services.chat.getSupportConversations({ limit: 50 })
            : await services.chat.getConversations({ limit: 50 })
          return { data: list }
        } catch (error) {
          return { error: error as never }
        }
      },
      providesTags: [{ type: 'Conversations', id: 'LIST' }],
    }),
    getMessages: build.query<ChatMessage[], string>({
      async queryFn(conversationId) {
        try {
          const messages = await services.chat.getMessages(conversationId, { limit: 100 })
          return { data: messages }
        } catch (error) {
          return { error: error as never }
        }
      },
      providesTags: (_r, _e, id) => [{ type: 'Messages', id }],
    }),
    getChatUnreadCount: build.query<number, void>({
      async queryFn() {
        try {
          const count = await services.chat.getUnreadCount()
          return { data: count }
        } catch (error) {
          return { error: error as never }
        }
      },
      providesTags: [{ type: 'Chat', id: 'UNREAD' }],
    }),
    sendMessage: build.mutation<ChatMessage, { conversationId: string; content: string }>({
      async queryFn({ conversationId, content }) {
        try {
          const res = await services.chat.sendMessage({ conversationId, content })
          return { data: res.data }
        } catch (error) {
          return { error: error as never }
        }
      },
      invalidatesTags: (_r, _e, { conversationId }) => [
        { type: 'Messages', id: conversationId },
        { type: 'Conversations', id: 'LIST' },
        { type: 'Chat', id: 'UNREAD' },
      ],
    }),
  }),
})

export const {
  useGetConversationsQuery,
  useGetMessagesQuery,
  useGetChatUnreadCountQuery,
  useSendMessageMutation,
} = chatApi
