import type { Professional, ProfessionalLiveLocationRow, ProfessionalsResponse } from '@profixer/types'
import type { DisputeCasesListResponse, ProfessionalApplication } from '@profixer/api-client'
import type { SupportTicketsListResponse } from '@profixer/api-client'
import { services } from '@/services/createMobileClient'
import { baseApi } from '@/store/api/baseApi'

function normalizeApplications(data: unknown): ProfessionalApplication[] {
  if (Array.isArray(data)) return data
  if (data && typeof data === 'object' && Array.isArray((data as { data?: unknown }).data)) {
    return (data as { data: ProfessionalApplication[] }).data
  }
  return []
}

export const opsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getProfessionals: build.query<ProfessionalsResponse, { page?: number; limit?: number; search?: string } | void>({
      async queryFn(params) {
        try {
          const res = await services.professionals.getProfessionals(params ?? { limit: 25 })
          return { data: res.data }
        } catch (error) {
          return { error: error as never }
        }
      },
      providesTags: [{ type: 'Professionals', id: 'LIST' }],
    }),
    getProfessional: build.query<Professional, string>({
      async queryFn(id) {
        try {
          const res = await services.professionals.getProfessional(id)
          return { data: res.data }
        } catch (error) {
          return { error: error as never }
        }
      },
      providesTags: (_r, _e, id) => [{ type: 'Professionals', id }],
    }),
    getLiveLocations: build.query<ProfessionalLiveLocationRow[], void>({
      async queryFn() {
        try {
          const res = await services.professionals.getLiveLocationsForAdmin()
          const rows = Array.isArray(res.data) ? res.data : []
          return { data: rows }
        } catch (error) {
          return { error: error as never }
        }
      },
      providesTags: [{ type: 'LiveLocations', id: 'LIST' }],
    }),
    getApplications: build.query<
      ProfessionalApplication[],
      { page?: number; limit?: number; status?: string; search?: string } | void
    >({
      async queryFn(params) {
        try {
          const res = await services.applications.getList((params ?? { limit: 25 }) as Parameters<
            typeof services.applications.getList
          >[0])
          return { data: normalizeApplications(res.data) }
        } catch (error) {
          return { error: error as never }
        }
      },
      providesTags: [{ type: 'Applications', id: 'LIST' }],
    }),
    getDisputes: build.query<
      DisputeCasesListResponse,
      { page?: number; limit?: number; status?: string } | void
    >({
      async queryFn(params) {
        try {
          const res = await services.disputes.list((params ?? { limit: 25 }) as Parameters<
            typeof services.disputes.list
          >[0])
          return { data: res.data }
        } catch (error) {
          return { error: error as never }
        }
      },
      providesTags: [{ type: 'Disputes', id: 'LIST' }],
    }),
    getSupportTickets: build.query<
      SupportTicketsListResponse,
      { hasRefund?: boolean; page?: number; limit?: number } | void
    >({
      async queryFn(params) {
        try {
          const res = params?.hasRefund
            ? await services.support.listRefundRequests(params)
            : await services.support.listTickets(params ?? { limit: 25 })
          return { data: res.data }
        } catch (error) {
          return { error: error as never }
        }
      },
      providesTags: [{ type: 'Tickets', id: 'LIST' }],
    }),
    updateApplicationStatus: build.mutation<
      ProfessionalApplication,
      { id: string; status: ProfessionalApplication['status']; adminNotes?: string }
    >({
      async queryFn({ id, status, adminNotes }) {
        try {
          const res = await services.applications.updateStatus(id, { status, adminNotes })
          return { data: res.data }
        } catch (error) {
          return { error: error as never }
        }
      },
      invalidatesTags: [{ type: 'Applications', id: 'LIST' }],
    }),
    resolveSupportTicket: build.mutation<unknown, { ticketId: string }>({
      async queryFn({ ticketId }) {
        try {
          const res = await services.support.updateTicket(ticketId, { status: 'resolved' })
          return { data: res.data }
        } catch (error) {
          return { error: error as never }
        }
      },
      invalidatesTags: [{ type: 'Tickets', id: 'LIST' }],
    }),
  }),
})

export const {
  useGetProfessionalsQuery,
  useGetProfessionalQuery,
  useGetLiveLocationsQuery,
  useGetApplicationsQuery,
  useGetDisputesQuery,
  useGetSupportTicketsQuery,
  useUpdateApplicationStatusMutation,
  useResolveSupportTicketMutation,
} = opsApi
