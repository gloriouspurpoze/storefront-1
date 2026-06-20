import {
  createCheckoutOrder,
  verifyCheckout,
} from '@/lib/storefront-api'
import { openRazorpayCheckout } from '@/lib/razorpayCheckout'

export interface StorefrontCheckoutLine {
  productId: string
  quantity: number
}

export interface StorefrontCheckoutCustomer {
  email: string
  name: string
  phone?: string
}

export interface StorefrontCheckoutSuccess {
  orderNumber: string
  contactId: string
}

export async function runStorefrontCheckout(input: {
  tenantId: string
  tenantName: string
  brandColor?: string
  lines: StorefrontCheckoutLine[]
  customer: StorefrontCheckoutCustomer
  notes?: string
}): Promise<StorefrontCheckoutSuccess> {
  if (!input.lines.length) {
    throw new Error('Your cart is empty.')
  }

  const itemCount = input.lines.reduce((sum, l) => sum + l.quantity, 0)
  const order = await createCheckoutOrder({
    tenantId: input.tenantId,
    items: input.lines,
    customerEmail: input.customer.email,
    customerName: input.customer.name,
    notes: input.notes,
  })

  const payment = await openRazorpayCheckout({
    keyId: order.keyId,
    orderId: order.orderId,
    amountPaise: order.amountPaise,
    currency: order.currency,
    name: input.tenantName,
    description: `${itemCount} item${itemCount === 1 ? '' : 's'}`,
    prefill: {
      email: input.customer.email,
      name: input.customer.name,
      contact: input.customer.phone,
    },
    themeColor: input.brandColor,
  })

  const verified = await verifyCheckout({
    tenantId: input.tenantId,
    razorpay_order_id: payment.razorpay_order_id,
    razorpay_payment_id: payment.razorpay_payment_id,
    razorpay_signature: payment.razorpay_signature,
    customerEmail: input.customer.email,
    customerName: input.customer.name,
    phone: input.customer.phone,
  })

  return {
    orderNumber: verified.orderNumber ?? '',
    contactId: verified.contactId,
  }
}
