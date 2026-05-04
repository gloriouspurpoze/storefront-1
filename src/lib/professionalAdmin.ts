import type { Professional, ProfessionalAccountStatus } from '../types/professional.types'

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

  return merged
}

export function professionalDisplayAccountStatus(pro: Professional): ProfessionalAccountStatus {
  if (pro.accountStatus) return pro.accountStatus
  if (pro.isActive === false) return pro.suspendedUntil ? 'suspended' : 'blocked'
  return 'active'
}
