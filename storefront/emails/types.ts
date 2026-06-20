export interface EmailTenantBranding {
  brand_name: string
  brand_color: string
  logo_url?: string
  from_email?: string
  /** Tier 1 = free/local (show Menufast footer); Tier 2 = premium custom domain */
  is_premium?: boolean
  reply_to?: string
}

export interface OrderConfirmationEmailProps {
  tenant: EmailTenantBranding
  customer: { name: string; phone?: string }
  order: {
    id: string
    items: Array<{ name: string; qty: number; price: number }>
    total: number
    estimated_time?: string
  }
  payment_method: 'COD' | 'Online'
}

export interface OrderStatusUpdateEmailProps {
  tenant: Pick<EmailTenantBranding, 'brand_name' | 'brand_color' | 'is_premium'>
  customer: { name: string }
  order: {
    id: string
    new_status: string
    estimated_time?: string
  }
}

export type StorefrontEmailType = 'order_confirmation' | 'order_status_update'

export interface SendStorefrontEmailRequest {
  type: StorefrontEmailType
  tenant_id: string
  order_id: string
  /** Optional — status update only */
  new_status?: string
}
