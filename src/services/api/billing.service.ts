import { api } from './base'

export interface CheckoutSessionResponse {
  url: string | null
  sessionId?: string
  mock?: boolean
  message?: string
}

export const billingService = {
  createCheckoutSession(body: { planKey: string; verticalKey: string }) {
    return api.post<CheckoutSessionResponse>('/billing/checkout-session', body, {
      showLoading: true,
      showErrorToast: true,
    })
  },

  listPlans(verticalKey: string) {
    return api.get<{ verticalKey: string; plans: unknown[] }>(`/billing/plans/${verticalKey}`, {
      showLoading: false,
    })
  },
}
