import type { CrmActivity } from '../types/crm.types'
import { activitiesForDeal } from '../utils/crmFilters'

export type DealFollowUpStatus = 'none' | 'overdue' | 'due_today' | 'upcoming'

export interface DealFollowUpSummary {
  status: DealFollowUpStatus
  nextActivity: CrmActivity | null
  openCount: number
  overdueCount: number
}

export function openActivitiesForDeal(activities: CrmActivity[], dealId: string): CrmActivity[] {
  return activitiesForDeal(activities, dealId).filter((a) => a.status === 'open')
}

function startOfDay(d: Date): Date {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}

function endOfDay(d: Date): Date {
  const x = new Date(d)
  x.setHours(23, 59, 59, 999)
  return x
}

export function summarizeDealFollowUp(activities: CrmActivity[], dealId: string): DealFollowUpSummary {
  const open = openActivitiesForDeal(activities, dealId)
  const now = new Date()
  const todayStart = startOfDay(now)
  const todayEnd = endOfDay(now)

  let overdueCount = 0
  for (const a of open) {
    if (a.dueAt && new Date(a.dueAt) < todayStart) overdueCount++
  }

  const withDue = open
    .filter((a) => a.dueAt)
    .sort((a, b) => new Date(a.dueAt!).getTime() - new Date(b.dueAt!).getTime())
  const withoutDue = open
    .filter((a) => !a.dueAt)
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
  const nextActivity = withDue[0] ?? withoutDue[0] ?? null

  let status: DealFollowUpStatus = 'none'
  if (nextActivity?.dueAt) {
    const due = new Date(nextActivity.dueAt)
    if (due < todayStart) status = 'overdue'
    else if (due <= todayEnd) status = 'due_today'
    else status = 'upcoming'
  } else if (open.length > 0) {
    status = 'upcoming'
  }

  return { status, nextActivity, openCount: open.length, overdueCount }
}

export function buildFollowUpMap(
  activities: CrmActivity[],
  dealIds: string[]
): Map<string, DealFollowUpSummary> {
  const map = new Map<string, DealFollowUpSummary>()
  for (const id of dealIds) {
    map.set(id, summarizeDealFollowUp(activities, id))
  }
  return map
}

export function formatFollowUpWhen(iso: string): string {
  const due = new Date(iso)
  const now = new Date()
  const todayStart = startOfDay(now)
  const todayEnd = endOfDay(now)
  const tomorrowEnd = endOfDay(new Date(todayStart.getTime() + 86400000))

  if (due < todayStart) {
    const days = Math.max(1, Math.floor((todayStart.getTime() - due.getTime()) / 86400000))
    return days === 1 ? 'Overdue · yesterday' : `Overdue · ${days}d`
  }
  if (due <= todayEnd) {
    return `Today · ${due.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}`
  }
  if (due <= tomorrowEnd) {
    return `Tomorrow · ${due.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}`
  }
  return due.toLocaleString(undefined, { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
}

export function followUpDueAt(offsetDays: number, hour = 10, minute = 0): string {
  const d = new Date()
  d.setDate(d.getDate() + offsetDays)
  d.setHours(hour, minute, 0, 0)
  return d.toISOString().slice(0, 16)
}

export const FOLLOW_UP_STATUS_LABEL: Record<DealFollowUpStatus, string> = {
  none: 'No follow-up',
  overdue: 'Overdue',
  due_today: 'Due today',
  upcoming: 'Scheduled',
}

export const FOLLOW_UP_STATUS_STYLES: Record<
  DealFollowUpStatus,
  { badge: string; strip: string; dot: string }
> = {
  none: {
    badge: 'bg-muted text-muted-foreground border-border',
    strip: 'bg-muted/50 border-border text-muted-foreground',
    dot: 'bg-muted-foreground/40',
  },
  overdue: {
    badge: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-950/50 dark:text-red-200 dark:border-red-900',
    strip: 'bg-red-50 border-red-200 text-red-800 dark:bg-red-950/30 dark:border-red-900 dark:text-red-200',
    dot: 'bg-red-500',
  },
  due_today: {
    badge: 'bg-amber-100 text-amber-900 border-amber-200 dark:bg-amber-950/50 dark:text-amber-100 dark:border-amber-900',
    strip: 'bg-amber-50 border-amber-200 text-amber-900 dark:bg-amber-950/30 dark:border-amber-900 dark:text-amber-100',
    dot: 'bg-amber-500',
  },
  upcoming: {
    badge: 'bg-sky-100 text-sky-800 border-sky-200 dark:bg-sky-950/50 dark:text-sky-100 dark:border-sky-900',
    strip: 'bg-sky-50 border-sky-200 text-sky-800 dark:bg-sky-950/30 dark:border-sky-900 dark:text-sky-100',
    dot: 'bg-sky-500',
  },
}
