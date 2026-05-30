import type { TeamWorkItem, TeamWorkPriority, TeamWorkStatus } from '../types/teamWork.types'

/** Stable Tailwind classes from user id for assignee avatar chips */
const ASSIGNEE_SWATCHES = [
  'bg-primary-deep text-white ring-primary-deep/30',
  'bg-primary text-white ring-primary/30',
  'bg-storm-deep text-white ring-storm-deep/30',
  'bg-bloom-coral text-white ring-bloom-coral/30',
  'bg-destructive text-white ring-destructive/30',
  'bg-primary text-white ring-primary/30',
  'bg-storm-deep text-white ring-storm-deep/30',
  'bg-primary-deep text-white ring-primary-deep/30',
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
  lowest: 'bg-fog text-charcoal dark:bg-ink-soft dark:text-fog',
  low: 'bg-primary-soft text-primary dark:bg-primary dark:text-primary-deep',
  medium: 'bg-bloom-rose text-bloom-coral dark:bg-bloom-coral dark:text-bloom-deep',
  high: 'bg-bloom-rose text-bloom-coral dark:bg-bloom-coral dark:text-bloom-deep',
  highest: 'bg-destructive/10 text-destructive dark:bg-destructive dark:text-destructive-foreground',
}

export function priorityLabel(p: TeamWorkItem['priority']): string {
  return p.replace(/_/g, ' ')
}
