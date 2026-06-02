import type { AppUser } from '@profixer/types'
import type {
  OrderRow,
  OrdersListResponse,
  OrdersQuery,
  OrderStatus,
  UsersListResponse,
  UsersQuery,
  UserStats,
} from '@profixer/api-client'
import { services } from '@/services/createMobileClient'
import { baseApi } from '@/store/api/baseApi'

export const directoryApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    /* ---------------- Users ---------------- */
    getUsers: build.query<UsersListResponse, UsersQuery | void>({
      async queryFn(query) {
        try {
          const data = await services.users.getUsers(query ?? { limit: 25 })
          return { data }
        } catch (error) {
          return { error: error as never }
        }
      },
      providesTags: [{ type: 'Users', id: 'LIST' }],
    }),
    getUser: build.query<AppUser, string>({
      async queryFn(id) {
        try {
          const data = await services.users.getUser(id)
          return { data }
        } catch (error) {
          return { error: error as never }
        }
      },
      providesTags: (_r, _e, id) => [{ type: 'Users', id }],
    }),
    getUserStats: build.query<UserStats, void>({
      async queryFn() {
        try {
          const data = await services.users.getUserStats()
          return { data }
        } catch (error) {
          return { error: error as never }
        }
      },
      providesTags: [{ type: 'Users', id: 'STATS' }],
    }),
    setUserActive: build.mutation<AppUser, { id: string; isActive: boolean }>({
      async queryFn({ id, isActive }) {
        try {
          const data = await services.users.setUserActive(id, isActive)
          return { data }
        } catch (error) {
          return { error: error as never }
        }
      },
      invalidatesTags: (_r, _e, { id }) => [
        { type: 'Users', id: 'LIST' },
        { type: 'Users', id: 'STATS' },
        { type: 'Users', id },
      ],
    }),
    verifyUser: build.mutation<void, string>({
      async queryFn(id) {
        try {
          await services.users.verifyUser(id)
          return { data: undefined }
        } catch (error) {
          return { error: error as never }
        }
      },
      invalidatesTags: (_r, _e, id) => [
        { type: 'Users', id: 'LIST' },
        { type: 'Users', id: 'STATS' },
        { type: 'Users', id },
      ],
    }),

    /* ---------------- Orders ---------------- */
    getOrders: build.query<OrdersListResponse, OrdersQuery | void>({
      async queryFn(query) {
        try {
          const data = await services.orders.getOrders(query ?? { limit: 25 })
          return { data }
        } catch (error) {
          return { error: error as never }
        }
      },
      providesTags: [{ type: 'Orders', id: 'LIST' }],
    }),
    getOrder: build.query<OrderRow, string>({
      async queryFn(id) {
        try {
          const data = await services.orders.getOrder(id)
          return { data }
        } catch (error) {
          return { error: error as never }
        }
      },
      providesTags: (_r, _e, id) => [{ type: 'Orders', id }],
    }),
    updateOrderStatus: build.mutation<
      OrderRow,
      { id: string; status: OrderStatus; notes?: string }
    >({
      async queryFn({ id, status, notes }) {
        try {
          const data = await services.orders.updateStatus(id, { status, notes })
          return { data }
        } catch (error) {
          return { error: error as never }
        }
      },
      invalidatesTags: (_r, _e, { id }) => [
        { type: 'Orders', id: 'LIST' },
        { type: 'Orders', id },
      ],
    }),
    cancelOrder: build.mutation<OrderRow, { id: string; reason?: string }>({
      async queryFn({ id, reason }) {
        try {
          const data = await services.orders.cancelOrder(id, reason)
          return { data }
        } catch (error) {
          return { error: error as never }
        }
      },
      invalidatesTags: (_r, _e, { id }) => [
        { type: 'Orders', id: 'LIST' },
        { type: 'Orders', id },
      ],
    }),
  }),
})

export const {
  useGetUsersQuery,
  useGetUserQuery,
  useGetUserStatsQuery,
  useSetUserActiveMutation,
  useVerifyUserMutation,
  useGetOrdersQuery,
  useGetOrderQuery,
  useUpdateOrderStatusMutation,
  useCancelOrderMutation,
} = directoryApi
