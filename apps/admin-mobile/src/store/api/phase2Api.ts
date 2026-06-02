import type {
  AdminCreateBookingPayload,
  CreateCrmContactPayload,
  ServiceRequestsQuery,
} from '@profixer/api-client'
import { services } from '@/services/createMobileClient'
import { baseApi } from '@/store/api/baseApi'

export const phase2Api = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getAnalyticsDashboard: build.query<Awaited<ReturnType<typeof services.analytics.getDashboardAnalytics>>, void>({
      async queryFn() {
        try {
          const data = await services.analytics.getDashboardAnalytics()
          return { data }
        } catch (error) {
          return { error: error as never }
        }
      },
      providesTags: [{ type: 'Analytics', id: 'DASHBOARD' }],
    }),
    getCrmMetrics: build.query<Awaited<ReturnType<typeof services.crm.getMetrics>>, void>({
      async queryFn() {
        try {
          const data = await services.crm.getMetrics()
          return { data }
        } catch (error) {
          return { error: error as never }
        }
      },
      providesTags: [{ type: 'Crm', id: 'METRICS' }],
    }),
    getCrmContacts: build.query<Awaited<ReturnType<typeof services.crm.listContacts>>, void>({
      async queryFn() {
        try {
          const data = await services.crm.listContacts()
          return { data }
        } catch (error) {
          return { error: error as never }
        }
      },
      providesTags: [{ type: 'Crm', id: 'CONTACTS' }],
    }),
    createCrmContact: build.mutation<
      Awaited<ReturnType<typeof services.crm.createContact>>,
      CreateCrmContactPayload
    >({
      async queryFn(payload) {
        try {
          const data = await services.crm.createContact(payload)
          return { data }
        } catch (error) {
          return { error: error as never }
        }
      },
      invalidatesTags: [{ type: 'Crm', id: 'CONTACTS' }, { type: 'Crm', id: 'METRICS' }],
    }),
    getEarningsSummary: build.query<
      Awaited<ReturnType<typeof services.earnings.getPlatformSummary>>,
      void
    >({
      async queryFn() {
        try {
          const data = await services.earnings.getPlatformSummary()
          return { data }
        } catch (error) {
          return { error: error as never }
        }
      },
      providesTags: [{ type: 'Earnings', id: 'SUMMARY' }],
    }),
    getPendingPayouts: build.query<
      Awaited<ReturnType<typeof services.earnings.getPendingPayouts>>,
      void
    >({
      async queryFn() {
        try {
          const data = await services.earnings.getPendingPayouts()
          return { data }
        } catch (error) {
          return { error: error as never }
        }
      },
      providesTags: [{ type: 'Earnings', id: 'PAYOUTS' }],
    }),
    approvePayout: build.mutation<{ message?: string }, string>({
      async queryFn(payoutId) {
        try {
          const data = await services.earnings.approvePayout(payoutId)
          return { data }
        } catch (error) {
          return { error: error as never }
        }
      },
      invalidatesTags: [{ type: 'Earnings', id: 'PAYOUTS' }, { type: 'Earnings', id: 'SUMMARY' }],
    }),
    getServiceRequests: build.query<
      Awaited<ReturnType<typeof services.serviceRequests.getServiceRequests>>,
      ServiceRequestsQuery | void
    >({
      async queryFn(params) {
        try {
          const data = await services.serviceRequests.getServiceRequests(params ?? { limit: 30 })
          return { data }
        } catch (error) {
          return { error: error as never }
        }
      },
      providesTags: [{ type: 'ServiceRequests', id: 'LIST' }],
    }),
    getServiceRequest: build.query<
      Awaited<ReturnType<typeof services.serviceRequests.getServiceRequest>>,
      string
    >({
      async queryFn(id) {
        try {
          const data = await services.serviceRequests.getServiceRequest(id)
          return { data }
        } catch (error) {
          return { error: error as never }
        }
      },
      providesTags: (_r, _e, id) => [{ type: 'ServiceRequests', id }],
    }),
    updateServiceRequestStatus: build.mutation<
      Awaited<ReturnType<typeof services.serviceRequests.updateServiceRequestStatus>>,
      { id: string; status: string }
    >({
      async queryFn({ id, status }) {
        try {
          const data = await services.serviceRequests.updateServiceRequestStatus(id, status)
          return { data }
        } catch (error) {
          return { error: error as never }
        }
      },
      invalidatesTags: (_r, _e, { id }) => [
        { type: 'ServiceRequests', id: 'LIST' },
        { type: 'ServiceRequests', id },
      ],
    }),
    getCatalogServices: build.query<Awaited<ReturnType<typeof services.catalog.getPublishedServices>>, void>({
      async queryFn() {
        try {
          const data = await services.catalog.getPublishedServices(60)
          return { data }
        } catch (error) {
          return { error: error as never }
        }
      },
    }),
    searchCustomers: build.query<Awaited<ReturnType<typeof services.users.searchCustomers>>, string>({
      async queryFn(search) {
        try {
          const data = await services.users.searchCustomers(search)
          return { data }
        } catch (error) {
          return { error: error as never }
        }
      },
    }),
    adminCreateBooking: build.mutation<
      Awaited<ReturnType<typeof services.pos.adminCreateBooking>>,
      AdminCreateBookingPayload
    >({
      async queryFn(payload) {
        try {
          const data = await services.pos.adminCreateBooking(payload)
          return { data }
        } catch (error) {
          return { error: error as never }
        }
      },
      invalidatesTags: [{ type: 'Bookings', id: 'LIST' }, 'Dashboard'],
    }),
  }),
})

export const {
  useGetAnalyticsDashboardQuery,
  useGetCrmMetricsQuery,
  useGetCrmContactsQuery,
  useCreateCrmContactMutation,
  useGetEarningsSummaryQuery,
  useGetPendingPayoutsQuery,
  useApprovePayoutMutation,
  useGetServiceRequestsQuery,
  useGetServiceRequestQuery,
  useUpdateServiceRequestStatusMutation,
  useGetCatalogServicesQuery,
  useLazySearchCustomersQuery,
  useAdminCreateBookingMutation,
} = phase2Api
