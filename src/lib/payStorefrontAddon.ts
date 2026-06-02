/**
 * Self-serve Razorpay checkout for a storefront add-on SKU.
 *
 *   1. POST  /storefront-studio/addons/order   → backend Razorpay order
 *   2. open  Razorpay modal                    → user pays
 *   3. POST  /storefront-studio/addons/verify  → backend signature check + grant
 *
 * The grant also happens via the Razorpay → us webhook
 * (`/api/public/storefront/addons/webhook`) as a fallback, in case the
 * user closes the tab before step 3 finishes.
 */
import { api } from '../services/api/base'
import type { StorefrontConfig } from '../services/api/storefrontStudio.service'
import { openRazorpayCheckout } from './razorpayCheckout'

export interface BuyAddonInput {
  sku: string
  displayName: string
  description?: string
  prefill?: { name?: string; email?: string; contact?: string }
  themeColor?: string
}

interface OrderResponse {
  orderId: string
  amountPaise: number
  currency: 'INR'
  keyId: string
  sku: string
  flagKey: string
  tenantId: string
}

interface VerifyResponse {
  granted: boolean
  flagKey: string
  sku: string
  config: StorefrontConfig
}

export async function buyStorefrontAddon(input: BuyAddonInput): Promise<VerifyResponse> {
  const orderRes = await api.post<OrderResponse>(
    '/storefront-studio/addons/order',
    { sku: input.sku },
    { showLoading: true, showSuccessToast: false, errorMessage: 'Add-on order failed' },
  )
  const order = orderRes.data
  if (!order) throw new Error('Add-on order creation failed')

  const success = await openRazorpayCheckout({
    keyId: order.keyId,
    orderId: order.orderId,
    amountPaise: order.amountPaise,
    currency: order.currency,
    name: input.displayName,
    description: input.description ?? `Storefront add-on: ${input.sku}`,
    prefill: input.prefill,
    themeColor: input.themeColor,
    notes: { sku: order.sku, flag_key: order.flagKey, tenant_id: order.tenantId },
  })

  const verifyRes = await api.post<VerifyResponse>(
    '/storefront-studio/addons/verify',
    {
      razorpay_order_id: success.razorpay_order_id,
      razorpay_payment_id: success.razorpay_payment_id,
      razorpay_signature: success.razorpay_signature,
    },
    { showLoading: true, showSuccessToast: true, successMessage: 'Add-on activated' },
  )
  const verify = verifyRes.data
  if (!verify) throw new Error('Add-on verification failed')
  return verify
}
