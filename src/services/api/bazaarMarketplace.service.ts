/**
 * Peer marketplace (Bazaar) — listing offers & listing-scoped chat.
 * Backend: GET /api/bazaar/admin/offers, GET /api/bazaar/admin/conversations
 *
 * Offer statuses (typical lifecycle; exact strings depend on API):
 * pending → countered (optional) → accepted | declined | withdrawn | expired
 */

import { api } from './base'

export interface BazaarAdminOfferRow {
  _id: string
  listingId: string
  amountInr: number
  status: string
  counterAmountInr?: number
  expiresAt: string
  createdAt: string
  updatedAt?: string
  buyerId?: { firstName?: string; lastName?: string; email?: string; userId?: string }
  sellerId?: { firstName?: string; lastName?: string; email?: string; userId?: string }
}

export interface BazaarAdminConversationRow {
  _id: string
  type: string
  title?: string
  metadata?: { listingId?: string }
  participants: Array<{
    userId: { firstName?: string; lastName?: string; email?: string; userId?: string }
    role: string
  }>
  lastMessage?: { text: string; sentAt: string }
  updatedAt: string
}

export class BazaarMarketplaceService {
  static async adminListOffers(params?: {
    page?: number
    limit?: number
    status?: string
    listingId?: string
  }) {
    return api.get<BazaarAdminOfferRow[]>('/bazaar/admin/offers', {
      params,
      showSuccessToast: false,
    })
  }

  static async adminListConversations(params?: {
    page?: number
    limit?: number
    /** When supported by API, narrows threads to a listing */
    listingId?: string
  }) {
    return api.get<BazaarAdminConversationRow[]>('/bazaar/admin/conversations', {
      params,
      showSuccessToast: false,
    })
  }
}
