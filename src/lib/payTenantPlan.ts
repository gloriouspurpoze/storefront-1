/**
 * Three-step Razorpay SaaS checkout in a single call:
 *   1. POST /billing/razorpay/create-order  → backend creates order + records intent
 *   2. Razorpay Checkout modal              → user pays
 *   3. POST /billing/razorpay/verify        → backend verifies signature + activates plan
 *
 * Returns the verified result on success. Throws if the user cancels, the SDK
 * reports a failure, or signature verification fails on the server.
 */
import { billingService } from '../services/api/billing.service'
import { openRazorpayCheckout } from './razorpayCheckout'

export interface PayTenantPlanInput {
  planKey: string
  verticalKey?: string
  /** Only required when a platform operator pays on behalf of a tenant. */
  tenantId?: string
  /** Branding/UX for the Razorpay modal. */
  displayName: string
  description?: string
  prefill?: { name?: string; email?: string; contact?: string }
  themeColor?: string
}

export async function payTenantPlanWithRazorpay(input: PayTenantPlanInput) {
  const orderRes = await billingService.createRazorpayOrder({
    planKey: input.planKey,
    verticalKey: input.verticalKey,
    tenantId: input.tenantId,
  })
  const order = orderRes.data
  if (!order) throw new Error('Razorpay order creation failed')

  const success = await openRazorpayCheckout({
    keyId: order.keyId,
    orderId: order.orderId,
    amountPaise: order.amountPaise,
    currency: order.currency,
    name: input.displayName,
    description: input.description ?? `Plan: ${input.planKey}`,
    prefill: input.prefill,
    themeColor: input.themeColor,
    notes: { plan_key: input.planKey, tenant_id: order.tenantId },
  })

  const verifyRes = await billingService.verifyRazorpayPayment({
    razorpay_order_id: success.razorpay_order_id,
    razorpay_payment_id: success.razorpay_payment_id,
    razorpay_signature: success.razorpay_signature,
    tenantId: input.tenantId,
  })
  const verify = verifyRes.data
  if (!verify) throw new Error('Razorpay payment verification failed')
  return verify
}
