import type { EngagementStatusDef, EngagementTypeDef } from '../verticals/core/engagement'
import { getVerticalPack } from '../verticals/registry'
import type { VerticalKey } from '../verticals/core/types'
import { resolveEngagementStatusKey } from './engagementStatusAliases'

export function getPrimaryEngagementType(verticalKey: VerticalKey): EngagementTypeDef | null {
  const pack = getVerticalPack(verticalKey)
  return pack.engagementTypes?.[0] ?? null
}

export function getEngagementStatuses(verticalKey: VerticalKey): EngagementStatusDef[] {
  return getPrimaryEngagementType(verticalKey)?.statuses ?? []
}

export function getEngagementStatusLabel(verticalKey: VerticalKey, statusKey: string): string {
  const packKey = resolveEngagementStatusKey(verticalKey, statusKey)
  const hit = getEngagementStatuses(verticalKey).find((s) => s.key === packKey)
  if (hit) return hit.label
  return statusKey.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

export function getAllowedNextStatuses(
  verticalKey: VerticalKey,
  currentStatus: string,
): string[] | null {
  const packKey = resolveEngagementStatusKey(verticalKey, currentStatus)
  const current = getEngagementStatuses(verticalKey).find((s) => s.key === packKey)
  if (!current?.next) return null
  return current.next
}

/** Status keys for select dropdowns (admin booking flows). */
export function getEngagementStatusKeys(verticalKey: VerticalKey): string[] {
  return getEngagementStatuses(verticalKey).map((s) => s.key)
}
