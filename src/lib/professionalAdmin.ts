import type {
  Professional,
  ProfessionalAccountStatus,
  ProfessionalVerificationDocument,
} from '../types/professional.types'
import { normalizeWeeklyAvailabilityFromApi } from './professionalSchedule'

/** Normalize Mongo `documents` (fixerprovider KYC uploads) for admin UI */
export function normalizeVerificationDocuments(raw: unknown): ProfessionalVerificationDocument[] {
  if (!Array.isArray(raw)) return []
  const out: ProfessionalVerificationDocument[] = []
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue
    const d = item as Record<string, unknown>
    const url = String(d.documentUrl ?? d.document_url ?? '').trim()
    if (!url) continue
    const type = String(d.type ?? 'other')
    out.push({
      _id: d._id != null ? String(d._id) : undefined,
      type,
      documentUrl: url,
      documentNumber:
        d.documentNumber != null
          ? String(d.documentNumber)
          : d.document_number != null
            ? String(d.document_number)
            : undefined,
      isVerified: Boolean(d.isVerified ?? d.is_verified),
      verifiedAt:
        d.verifiedAt != null ? String(d.verifiedAt) : d.verified_at != null ? String(d.verified_at) : undefined,
    })
  }
  return out
}

/** Unwrap GET /professionals/:id body whether API returns `{ professional }` or the document root */
export function extractProfessionalFromGetResponse(data: unknown): unknown {
  const rawObj = data && typeof data === 'object' ? (data as Record<string, unknown>) : null
  if (!rawObj) return null
  if ('professional' in rawObj && rawObj.professional && typeof rawObj.professional === 'object') {
    return rawObj.professional
  }
  return rawObj
}

/** Merge snake_case moderation fields from GET /professionals/:id into Professional shape */
export function normalizeProfessionalFromApi(raw: unknown): Professional {
  const p = raw as Record<string, unknown>
  if (!p || typeof p !== 'object') {
    throw new Error('Invalid professional payload')
  }
  const merged = { ...(p as unknown as Professional) }
  const accountStatus = (p.account_status ?? p.accountStatus) as ProfessionalAccountStatus | undefined
  const suspendedUntil = (p.suspended_until ?? p.suspendedUntil) as string | undefined
  const moderationReason = (p.moderation_reason ?? p.moderationReason) as string | undefined
  const moderationNotes = (p.moderation_notes ?? p.moderationNotes) as string | undefined
  const lastModerationAt = (p.last_moderation_at ?? p.lastModerationAt) as string | undefined
  const userId = (p.user_id ?? p.userId) as string | undefined

  merged.accountStatus = accountStatus ?? merged.accountStatus
  merged.suspendedUntil = suspendedUntil ?? merged.suspendedUntil
  merged.moderationReason = moderationReason ?? merged.moderationReason
  merged.moderationNotes = moderationNotes ?? merged.moderationNotes
  merged.lastModerationAt = lastModerationAt ?? merged.lastModerationAt
  merged.userId = userId ?? merged.userId

  if (!merged.accountStatus) {
    if (merged.isActive === false) {
      merged.accountStatus = suspendedUntil ? 'suspended' : 'blocked'
    } else {
      merged.accountStatus = 'active'
    }
  }

  merged.documents = normalizeVerificationDocuments(p.documents ?? p.verification_documents)

  merged.weeklyAvailability = normalizeWeeklyAvailabilityFromApi(
    p.weeklyAvailability ?? p.time_slots ?? p.timeSlots,
  )

  return merged
}

export function professionalDisplayAccountStatus(pro: Professional): ProfessionalAccountStatus {
  if (pro.accountStatus) return pro.accountStatus
  if (pro.isActive === false) return pro.suspendedUntil ? 'suspended' : 'blocked'
  return 'active'
}

/** Payload for PUT /professionals/:id — strips read-only fields; keeps subdocument _id when valid */
export function professionalDocumentsUpdatePayload(
  docs: ProfessionalVerificationDocument[],
): ProfessionalVerificationDocument[] {
  return docs.map((d) => ({
    _id: d._id && /^[a-f0-9A-F]{24}$/.test(d._id) ? d._id : undefined,
    type: d.type,
    documentUrl: d.documentUrl,
    documentNumber: d.documentNumber?.trim() || undefined,
    isVerified: Boolean(d.isVerified),
  }))
}
