import type {
  InvoicesListResponse,
  InvoicesQuery,
  InvoiceRow,
  PaymentRow,
  PaymentsListResponse,
  PaymentsQuery,
  RefundQueueResponse,
  RefundStatus,
  RefundTicketRow,
} from '@profixer/api-client'
import { services } from '@/services/createMobileClient'
import { baseApi } from '@/store/api/baseApi'

export const financeApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    /* ---------------- Invoices ---------------- */
    getInvoices: build.query<InvoicesListResponse, InvoicesQuery | void>({
      async queryFn(query) {
        try {
          const data = await services.invoices.getInvoices(query ?? { limit: 25 })
          return { data }
        } catch (error) {
          return { error: error as never }
        }
      },
      providesTags: [{ type: 'Invoices', id: 'LIST' }],
    }),
    getInvoice: build.query<InvoiceRow, string>({
      async queryFn(id) {
        try {
          const data = await services.invoices.getInvoice(id)
          return { data }
        } catch (error) {
          return { error: error as never }
        }
      },
      providesTags: (_r, _e, id) => [{ type: 'Invoices', id }],
    }),
    cancelInvoice: build.mutation<InvoiceRow, string>({
      async queryFn(id) {
        try {
          const data = await services.invoices.cancelInvoice(id)
          return { data }
        } catch (error) {
          return { error: error as never }
        }
      },
      invalidatesTags: (_r, _e, id) => [
        { type: 'Invoices', id: 'LIST' },
        { type: 'Invoices', id },
      ],
    }),
    markInvoicePaid: build.mutation<InvoiceRow, { id: string; paymentMethod?: string }>({
      async queryFn({ id, paymentMethod }) {
        try {
          const data = await services.invoices.markInvoicePaid(id, paymentMethod)
          return { data }
        } catch (error) {
          return { error: error as never }
        }
      },
      invalidatesTags: (_r, _e, { id }) => [
        { type: 'Invoices', id: 'LIST' },
        { type: 'Invoices', id },
      ],
    }),

    /* ---------------- Payments ---------------- */
    getPayments: build.query<PaymentsListResponse, PaymentsQuery | void>({
      async queryFn(query) {
        try {
          const data = await services.payments.getPayments(query ?? { limit: 25 })
          return { data }
        } catch (error) {
          return { error: error as never }
        }
      },
      providesTags: [{ type: 'Payments', id: 'LIST' }],
    }),
    getPayment: build.query<PaymentRow, string>({
      async queryFn(id) {
        try {
          const data = await services.payments.getPayment(id)
          return { data }
        } catch (error) {
          return { error: error as never }
        }
      },
      providesTags: (_r, _e, id) => [{ type: 'Payments', id }],
    }),
    refundPayment: build.mutation<PaymentRow, { id: string; amount?: number; reason?: string }>({
      async queryFn({ id, amount, reason }) {
        try {
          const data = await services.payments.refundPayment(id, { amount, reason })
          return { data }
        } catch (error) {
          return { error: error as never }
        }
      },
      invalidatesTags: (_r, _e, { id }) => [
        { type: 'Payments', id: 'LIST' },
        { type: 'Payments', id },
        { type: 'Refunds', id: 'LIST' },
      ],
    }),

    /* ---------------- Refunds ---------------- */
    getRefundQueue: build.query<RefundQueueResponse, { status?: RefundStatus } | void>({
      async queryFn(params) {
        try {
          const data = await services.refunds.getQueue({
            status: params?.status ?? 'pending',
          })
          return { data }
        } catch (error) {
          return { error: error as never }
        }
      },
      providesTags: [{ type: 'Refunds', id: 'LIST' }],
    }),
    getRefundTicket: build.query<RefundTicketRow, string>({
      async queryFn(id) {
        try {
          const data = await services.refunds.getTicket(id)
          return { data }
        } catch (error) {
          return { error: error as never }
        }
      },
      providesTags: (_r, _e, id) => [{ type: 'Refunds', id }],
    }),
    approveRefund: build.mutation<
      RefundTicketRow,
      { ticketId: string; adminNote?: string; amount?: number }
    >({
      async queryFn({ ticketId, adminNote, amount }) {
        try {
          const data = await services.refunds.approveRefund(ticketId, { adminNote, amount })
          return { data }
        } catch (error) {
          return { error: error as never }
        }
      },
      invalidatesTags: (_r, _e, { ticketId }) => [
        { type: 'Refunds', id: 'LIST' },
        { type: 'Refunds', id: ticketId },
        { type: 'Tickets', id: 'LIST' },
      ],
    }),
    rejectRefund: build.mutation<
      RefundTicketRow,
      { ticketId: string; rejectionReason: string; adminNote?: string }
    >({
      async queryFn({ ticketId, rejectionReason, adminNote }) {
        try {
          const data = await services.refunds.rejectRefund(ticketId, {
            rejectionReason,
            adminNote,
          })
          return { data }
        } catch (error) {
          return { error: error as never }
        }
      },
      invalidatesTags: (_r, _e, { ticketId }) => [
        { type: 'Refunds', id: 'LIST' },
        { type: 'Refunds', id: ticketId },
        { type: 'Tickets', id: 'LIST' },
      ],
    }),
  }),
})

export const {
  useGetInvoicesQuery,
  useGetInvoiceQuery,
  useCancelInvoiceMutation,
  useMarkInvoicePaidMutation,
  useGetPaymentsQuery,
  useGetPaymentQuery,
  useRefundPaymentMutation,
  useGetRefundQueueQuery,
  useGetRefundTicketQuery,
  useApproveRefundMutation,
  useRejectRefundMutation,
} = financeApi
