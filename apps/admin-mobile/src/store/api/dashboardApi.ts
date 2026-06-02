import type { AdminDashboardData } from '@profixer/api-client'
import { services } from '@/services/createMobileClient'
import { baseApi } from '@/store/api/baseApi'

export const dashboardApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getAdminDashboard: build.query<AdminDashboardData, void>({
      async queryFn() {
        try {
          const data = await services.dashboard.getAdminDashboard()
          return { data }
        } catch (error) {
          return { error: error as never }
        }
      },
      providesTags: [{ type: 'Dashboard', id: 'ADMIN' }],
    }),
  }),
})

export const { useGetAdminDashboardQuery } = dashboardApi
