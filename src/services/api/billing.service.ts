import { api } from './base'

export interface CheckoutSessionResponse {
  url: string | null
  sessionId?: string
  mock?: boolean
  message?: string
}

export interface RazorpaySaasOrderResponse {
  orderId: string
  amountPaise: number
  currency: 'INR'
  keyId: string
  planKey: string
  tenantId: string
}

export interface RazorpaySaasVerifyResponse {
  verified: true
  planKey: string
  billingStatus: 'active'
  currentPeriodEnd: string
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

  /**
   * Razorpay SaaS billing — start the checkout. Pass `tenantId` only when the
   * caller is a platform operator paying on behalf of another organization;
   * tenant admins should leave it undefined and rely on JWT scoping.
   */
  createRazorpayOrder(body: { planKey: string; verticalKey?: string; tenantId?: string }) {
    return api.post<RazorpaySaasOrderResponse>('/billing/razorpay/create-order', body, {
      showLoading: true,
      showErrorToast: true,
    })
  },

  verifyRazorpayPayment(body: {
    razorpay_order_id: string
    razorpay_payment_id: string
    razorpay_signature: string
    tenantId?: string
  }) {
    return api.post<RazorpaySaasVerifyResponse>('/billing/razorpay/verify', body, {
      showLoading: true,
      showErrorToast: true,
    })
  },
}