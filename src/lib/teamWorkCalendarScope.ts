import type { TeamWorkProject } from '../types/teamWork.types'

/** Comma-separated board keys, e.g. `PF` or `PF,OPS`. Defaults to ProFixer-style `PF`. */
export function parseTeamCalendarProjectKeys(): string[] {
  const raw = process.env.REACT_APP_TEAM_WORK_CALENDAR_PROJECT_KEYS || 'PF'
  return raw
    .split(',')
    .map((s) => s.trim().toUpperCase())
    .filter(Boolean)
}

/** Prefer env keys + name match “ProFixer”; fallback to default tenant board. */
export function resolveCalendarProjectIds(projects: TeamWorkProject[]): string[] {
  const keys = new Set(parseTeamCalendarProjectKeys())
  const named = projects.filter(
    (p) => keys.has(String(p.key || '').toUpperCase()) || /profixer/i.test(p.name || ''),
  )
  if (named.length) return named.map((p) => p.id)
  const def = projects.filter((p) => p.isDefault && !p.isArchived)
  return def.map((p) => p.id)
}
