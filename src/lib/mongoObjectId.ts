const HEX24 = /^[a-f0-9]{24}$/i

export function isMongoObjectIdString(value: string | undefined | null): value is string {
  return typeof value === 'string' && HEX24.test(value)
}

/** Sprint ids from local storage use non-ObjectId strings; only persist real Mongo ids to the API. */
export function sprintIdForTeamWorkApi(value: string | undefined | null): string | undefined {
  if (value === undefined || value === null || value === '') return undefined
  return isMongoObjectIdString(value) ? value : undefined
}

/**
 * Normalize category/subcategory refs from API (string id, populated `{ _id }`, or ObjectId-like) to a 24-hex id string.
 * API list/detail often exposes human-readable `category` / `subcategory` slugs; use `category_id` / `subcategory_id` when present.
 */
export function normalizeRefToMongoIdString(raw: unknown): string | undefined {
  if (raw == null) return undefined
  if (typeof raw === 'object' && raw !== null) {
    const o = raw as { _id?: unknown; id?: unknown; toString?: () => string }
    const nested = o._id ?? o.id
    if (nested != null && typeof nested === 'object' && nested !== null && typeof (nested as { toString?: () => string }).toString === 'function') {
      const s = String((nested as { toString: () => string }).toString()).trim()
      return isMongoObjectIdString(s) ? s.toLowerCase() : undefined
    }
    if (nested != null) {
      const s = String(nested).trim()
      return isMongoObjectIdString(s) ? s.toLowerCase() : undefined
    }
    if (typeof o.toString === 'function') {
      const s = String(o.toString()).trim()
      return isMongoObjectIdString(s) ? s.toLowerCase() : undefined
    }
    return undefined
  }
  const s = String(raw).trim()
  return isMongoObjectIdString(s) ? s.toLowerCase() : undefined
}
