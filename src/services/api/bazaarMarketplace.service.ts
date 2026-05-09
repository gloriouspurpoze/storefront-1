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

/** User-submitted listings awaiting or past moderation */
export interface BazaarAdminListingRow {
  id: string
  title: string
  priceInr: number
  moderationStatus: 'pending_review' | 'published' | 'rejected'
  rejectionReason?: string | null
  createdAt: string
  seller?: { firstName?: string; lastName?: string; email?: string; userId?: string }
}

export interface BazaarProVerifyRequestRow {
  id: string
  listingId: string
  contactPhone: string
  slotPreferenceId: string
  slotPreferenceLabel: string
  workflowStep: 1 | 2 | 3 | 4
  technicianSummary?: string
  scheduledVisitAt?: string | null
  consentAccepted: boolean
  createdAt: string
  updatedAt: string
  seller?: { firstName?: string; lastName?: string; email?: string; userId?: string; phone?: string }
}

/** Runtime flags — persisted in admin_app_settings.bazaarModule (fixer-backend). */
export interface BazaarModuleFlags {
  assistAiEnabled: boolean
  photoCheckEnabled: boolean
  visionApiEnabled: boolean
  bypassPhotoModeration: boolean
}

export interface BazaarModuleSettingsPayload {
  effective: BazaarModuleFlags
  envBaseline: BazaarModuleFlags
  hints: Record<string, string>
}

/** GET /api/bazaar/admin/listing-review/:id — full operator console */
export type BazaarListingReviewDetail = Record<string, unknown>

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

  static async adminListListings(params?: {
    page?: number
    limit?: number
    status?: 'pending_review' | 'published' | 'rejected'
  }) {
    const { status, ...rest } = params || {}
    return api.get<BazaarAdminListingRow[]>('/bazaar/admin/listings', {
      params: {
        ...rest,
        ...(status ? { status } : {}),
      },
      showSuccessToast: false,
    })
  }

  static async adminModerateListing(
    id: string,
    body: { action: 'approve' | 'reject'; rejectionReason?: string }
  ) {
    return api.patch<unknown>(
      `/bazaar/admin/listings/${encodeURIComponent(id)}/moderate`,
      { action: body.action, rejectionReason: body.rejectionReason },
      {
        showSuccessToast: true,
        successMessage:
          body.action === 'approve' ? 'Listing published' : 'Listing rejected',
      }
    )
  }

  /** GET /api/bazaar/admin/pro-verify */
  static async adminListProVerify(params?: { page?: number; limit?: number }) {
    return api.get<BazaarProVerifyRequestRow[]>('/bazaar/admin/pro-verify', {
      params,
      showSuccessToast: false,
    })
  }

  /** PATCH /api/bazaar/admin/pro-verify/:id */
  static async adminPatchProVerify(
    id: string,
    body: {
      workflowStep?: number
      technicianSummary?: string
      scheduledVisitAt?: string | null
      adminInternalNote?: string
    }
  ) {
    return api.patch<BazaarProVerifyRequestRow>(
      `/bazaar/admin/pro-verify/${encodeURIComponent(id)}`,
      body,
      { showSuccessToast: true, successMessage: 'Pro-Verify updated' }
    )
  }

  /** GET /api/bazaar/admin/module-settings */
  static async adminGetModuleSettings() {
    return api.get<BazaarModuleSettingsPayload>('/bazaar/admin/module-settings', {
      showSuccessToast: false,
    })
  }

  /** PATCH /api/bazaar/admin/module-settings */
  static async adminPatchModuleSettings(body: Partial<BazaarModuleFlags>) {
    return api.patch<{ effective: BazaarModuleFlags; envBaseline: BazaarModuleFlags }>(
      '/bazaar/admin/module-settings',
      body,
      { showSuccessToast: true, successMessage: 'Bazaar module settings saved' }
    )
  }

  /** GET /api/bazaar/admin/listing-review/:id */
  static async adminGetListingReviewDetail(listingId: string) {
    return api.get<BazaarListingReviewDetail>(
      `/bazaar/admin/listing-review/${encodeURIComponent(listingId)}`,
      { showSuccessToast: false }
    )
  }
}
