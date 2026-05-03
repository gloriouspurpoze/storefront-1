import type { TeamWorkItem, TeamWorkPriority, TeamWorkStatus } from '../types/teamWork.types'

/** Stable Tailwind classes from user id for assignee avatar chips */
const ASSIGNEE_SWATCHES = [
  'bg-violet-600 text-white ring-violet-600/30',
  'bg-sky-600 text-white ring-sky-600/30',
  'bg-emerald-600 text-white ring-emerald-600/30',
  'bg-amber-600 text-white ring-amber-600/30',
  'bg-rose-600 text-white ring-rose-600/30',
  'bg-indigo-600 text-white ring-indigo-600/30',
  'bg-teal-600 text-white ring-teal-600/30',
  'bg-fuchsia-600 text-white ring-fuchsia-600/30',
] as const

export function assigneeSwatchClass(userId: string): string {
  let h = 0
  for (let i = 0; i < userId.length; i++) h = (h * 31 + userId.charCodeAt(i)) | 0
  return ASSIGNEE_SWATCHES[Math.abs(h) % ASSIGNEE_SWATCHES.length]
}

export function initialsFromLabel(label: string): string {
  const parts = label.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

/** Left border accent on cards by workflow column */
export const STATUS_ACCENT: Record<TeamWorkStatus, string> = {
  backlog: 'border-l-slate-400',
  todo: 'border-l-blue-500',
  in_progress: 'border-l-amber-500',
  in_review: 'border-l-violet-500',
  blocked: 'border-l-rose-600',
  done: 'border-l-emerald-600',
  cancelled: 'border-l-slate-500',
}

/** Small priority pill (background + text) */
export const PRIORITY_CHIP: Record<TeamWorkPriority, string> = {
  lowest: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200',
  low: 'bg-sky-100 text-sky-900 dark:bg-sky-950 dark:text-sky-100',
  medium: 'bg-amber-100 text-amber-950 dark:bg-amber-950 dark:text-amber-100',
  high: 'bg-orange-100 text-orange-950 dark:bg-orange-950 dark:text-orange-100',
  highest: 'bg-rose-100 text-rose-950 dark:bg-rose-950 dark:text-rose-100',
}

export function priorityLabel(p: TeamWorkItem['priority']): string {
  return p.replace(/_/g, ' ')
}
