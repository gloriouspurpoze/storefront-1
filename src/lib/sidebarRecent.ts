const STORAGE_PREFIX = 'fixer-admin:sidebar-recent:v1:'
const MAX_STORED = 20

export type SidebarRecentEntry = {
  href: string
  name: string
  visitedAt: number
}

export function readSidebarRecent(userId: string): SidebarRecentEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + userId)
    if (!raw) return []
    const parsed = JSON.parse(raw) as SidebarRecentEntry[]
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (e) =>
        e &&
        typeof e.href === 'string' &&
        typeof e.name === 'string' &&
        typeof e.visitedAt === 'number',
    )
  } catch {
    return []
  }
}

export function upsertSidebarRecent(userId: string, href: string, name: string): void {
  try {
    const prev = readSidebarRecent(userId)
    const now = Date.now()
    const without = prev.filter((e) => e.href !== href)
    const next: SidebarRecentEntry[] = [{ href, name, visitedAt: now }, ...without].slice(0, MAX_STORED)
    localStorage.setItem(STORAGE_PREFIX + userId, JSON.stringify(next))
  } catch {
    /* quota / private mode */
  }
}
