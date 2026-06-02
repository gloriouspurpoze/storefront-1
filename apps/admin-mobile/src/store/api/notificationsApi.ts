import type { PushNotification } from '@profixer/api-client'
import { services } from '@/services/createMobileClient'
import { baseApi } from '@/store/api/baseApi'

export const notificationsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getNotifications: build.query<PushNotification[], { page?: number; limit?: number } | void>({
      async queryFn(arg) {
        try {
          const list = await services.notifications.getNotifications(arg?.page ?? 1, arg?.limit ?? 50)
          return { data: list }
        } catch (error) {
          return { error: error as never }
        }
      },
      providesTags: (result) =>
        result
          ? [
              ...result.map((n) => ({ type: 'Notifications' as const, id: n.id })),
              { type: 'Notifications', id: 'LIST' },
            ]
          : [{ type: 'Notifications', id: 'LIST' }],
    }),
    getNotificationUnreadCount: build.query<number, void>({
      async queryFn() {
        try {
          const count = await services.notifications.getUnreadCount()
          return { data: count }
        } catch (error) {
          return { error: error as never }
        }
      },
      providesTags: [{ type: 'Notifications', id: 'UNREAD' }],
    }),
    markNotificationRead: build.mutation<void, string>({
      async queryFn(id) {
        try {
          await services.notifications.markAsRead(id)
          return { data: undefined }
        } catch (error) {
          return { error: error as never }
        }
      },
      invalidatesTags: (_r, _e, id) => [
        { type: 'Notifications', id },
        { type: 'Notifications', id: 'LIST' },
        { type: 'Notifications', id: 'UNREAD' },
      ],
    }),
  }),
})

export const {
  useGetNotificationsQuery,
  useGetNotificationUnreadCountQuery,
  useMarkNotificationReadMutation,
} = notificationsApi
