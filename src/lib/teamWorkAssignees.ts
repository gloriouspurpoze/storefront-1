import type { TeamWorkItem } from '../types/teamWork.types'

/** Effective assignee ids: prefers multi-assignee array when present. */
export function assigneeIdsFromItem(item: Pick<TeamWorkItem, 'assigneeUserId' | 'assigneeUserIds'>): string[] {
  if (item.assigneeUserIds?.length) {
    return Array.from(new Set(item.assigneeUserIds.filter(Boolean)))
  }
  if (item.assigneeUserId) return [item.assigneeUserId]
  return []
}

export function primaryAssigneeUserId(ids: string[]): string | undefined {
  return ids.length ? ids[0] : undefined
}
