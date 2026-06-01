/**
 * Loads the Razorpay Checkout SDK on demand and opens the modal.
 *
 * Razorpay's hosted JS exposes a global `Razorpay` constructor; we lazy-load
 * `https://checkout.razorpay.com/v1/checkout.js` the first time it's needed so
 * the SDK doesn't ship with the main bundle.
 *
 * Usage:
 *   const { handler } = await openRazorpayCheckout({
 *     keyId, orderId, amountPaise, currency: 'INR',
 *     name: 'Profixer SaaS', description: 'Growth plan – monthly',
 *     prefill: { email, name }, theme: { color: '#0f172a' },
 *   })
 *   // handler resolves with { razorpay_order_id, razorpay_payment_id, razorpay_signature }
 */

declare global {
  interface Window {
    Razorpay?: RazorpayConstructor
  }
}

export interface RazorpayPaymentSuccess {
  razorpay_order_id: string
  razorpay_payment_id: string
  razorpay_signature: string
}

interface RazorpayInstance {
  open(): void
  on(event: 'payment.failed', cb: (response: { error?: { description?: string } }) => void): void
}

interface RazorpayOptions {
  key: string
  order_id: string
  amount: number
  currency: string
  name: string
  description?: string
  image?: string
  prefill?: { name?: string; email?: string; contact?: string }
  notes?: Record<string, string>
  theme?: { color?: string }
  handler: (response: RazorpayPaymentSuccess) => void
  modal?: { ondismiss?: () => void; escape?: boolean; confirm_close?: boolean }
}

type RazorpayConstructor = new (options: RazorpayOptions) => RazorpayInstance

const SCRIPT_URL = 'https://checkout.razorpay.com/v1/checkout.js'
let loaderPromise: Promise<void> | null = null

function loadRazorpayScript(): Promise<void> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Razorpay can only run in the browser'))
  }
  if (window.Razorpay) return Promise.resolve()
  if (loaderPromise) return loaderPromise
  loaderPromise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${SCRIPT_URL}"]`)
    if (existing) {
      existing.addEventListener('load', () => resolve(), { once: true })
      existing.addEventListener('error', () => reject(new Error('Failed to load Razorpay SDK')), {
        once: true,
      })
      return
    }
    const script = document.createElement('script')
    script.src = SCRIPT_URL
    script.async = true
    script.onload = () => resolve()
    script.onerror = () => {
      loaderPromise = null
      reject(new Error('Failed to load Razorpay SDK'))
    }
    document.body.appendChild(script)
  })
  return loaderPromise
}

export interface OpenRazorpayInput {
  keyId: string
  orderId: string
  amountPaise: number
  currency?: string
  name: string
  description?: string
  image?: string
  prefill?: { name?: string; email?: string; contact?: string }
  notes?: Record<string, string>
  themeColor?: string
}

/**
 * Resolves with the Razorpay success payload once the user pays. Rejects if
 * the user closes the modal or the SDK reports a `payment.failed` event.
 */
export async function openRazorpayCheckout(input: OpenRazorpayInput): Promise<RazorpayPaymentSuccess> {
  await loadRazorpayScript()
  const Ctor = window.Razorpay
  if (!Ctor) throw new Error('Razorpay SDK not available')

  return new Promise<RazorpayPaymentSuccess>((resolve, reject) => {
    let settled = false
    const instance = new Ctor({
      key: input.keyId,
      order_id: input.orderId,
      amount: input.amountPaise,
      currency: input.currency ?? 'INR',
      name: input.name,
      description: input.description,
      image: input.image,
      prefill: input.prefill,
      notes: input.notes,
      theme: input.themeColor ? { color: input.themeColor } : undefined,
      handler: (response) => {
        if (settled) return
        settled = true
        resolve(response)
      },
      modal: {
        ondismiss: () => {
          if (settled) return
          settled = true
          reject(new Error('Payment cancelled'))
        },
      },
    })
    instance.on('payment.failed', (response) => {
      if (settled) return
      settled = true
      reject(new Error(response?.error?.description || 'Payment failed'))
    })
    instance.open()
  })
}
