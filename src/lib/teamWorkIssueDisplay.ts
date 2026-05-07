import type { TeamWorkItem } from '../types/teamWork.types'

function compareSiblingOrder(a: TeamWorkItem, b: TeamWorkItem): number {
  const br = (a.boardRank ?? 0) - (b.boardRank ?? 0)
  if (br !== 0) return br
  const an = a.issueNumber ?? 0
  const bn = b.issueNumber ?? 0
  if (an !== bn) return an - bn
  return String(a.createdAt).localeCompare(String(b.createdAt))
}

/** Siblings with the same parent, ordered like ticket creation order. */
export function subtasksOfParent(parentId: string, allItems: TeamWorkItem[]): TeamWorkItem[] {
  return allItems.filter((i) => i.parentWorkItemId === parentId).sort(compareSiblingOrder)
}

/**
 * Human-facing ticket id: root issues use `issueKey`; subtasks use parent chain + `.1`, `.2`, …
 * (e.g. `PF-25` → `PF-25.1`, `PF-25.2`; nested → `PF-25.1.1`).
 */
export function hierarchicalIssueLabel(item: TeamWorkItem, allItems: TeamWorkItem[]): string {
  const pid = item.parentWorkItemId
  if (!pid) return item.issueKey

  const parent = allItems.find((i) => i.id === pid)
  const siblings = subtasksOfParent(pid, allItems)
  const idx = siblings.findIndex((i) => i.id === item.id)
  const ordinal = idx >= 0 ? idx + 1 : siblings.length + 1

  const parentBase = parent ? hierarchicalIssueLabel(parent, allItems) : item.issueKey
  return `${parentBase}.${ordinal}`
}

export function parentIssueItem(
  item: Pick<TeamWorkItem, 'parentWorkItemId'>,
  allItems: TeamWorkItem[],
): TeamWorkItem | undefined {
  const pid = item.parentWorkItemId
  if (!pid) return undefined
  return allItems.find((i) => i.id === pid)
}
