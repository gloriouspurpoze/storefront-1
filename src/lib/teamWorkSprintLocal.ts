import { addDays, endOfDay, startOfDay } from 'date-fns'
import type { TeamWorkItem, TeamWorkSprint } from '../types/teamWork.types'

function keyDef(tenantId: string, projectId: string): string {
  return `fixer-tw-sprints:${tenantId}:${projectId}`
}

function keyAsg(tenantId: string, projectId: string): string {
  return `fixer-tw-sprint-asg:${tenantId}:${projectId}`
}

export function loadSprintsFromStorage(tenantId: string, projectId: string): TeamWorkSprint[] {
  try {
    const raw = localStorage.getItem(keyDef(tenantId, projectId))
    if (!raw) return []
    const p = JSON.parse(raw) as unknown
    return Array.isArray(p) ? (p as TeamWorkSprint[]) : []
  } catch {
    return []
  }
}

export function saveSprintsToStorage(tenantId: string, projectId: string, rows: TeamWorkSprint[]): void {
  try {
    localStorage.setItem(keyDef(tenantId, projectId), JSON.stringify(rows))
  } catch {
    /* quota */
  }
}

export function loadSprintAssignmentsFromStorage(tenantId: string, projectId: string): Record<string, string> {
  try {
    const raw = localStorage.getItem(keyAsg(tenantId, projectId))
    if (!raw) return {}
    const p = JSON.parse(raw) as unknown
    if (!p || typeof p !== 'object') return {}
    const out: Record<string, string> = {}
    for (const [k, v] of Object.entries(p as Record<string, unknown>)) {
      if (typeof v === 'string' && v) out[k] = v
    }
    return out
  } catch {
    return {}
  }
}

export function saveSprintAssignmentsToStorage(tenantId: string, projectId: string, map: Record<string, string>): void {
  try {
    localStorage.setItem(keyAsg(tenantId, projectId), JSON.stringify(map))
  } catch {
    /* quota */
  }
}

export function newLocalSprintId(): string {
  return `sprint_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`
}

export function buildSprintWindow(startAt: Date, durationDays: number): { startIso: string; endIso: string } {
  const d = Math.max(1, Math.min(56, Math.floor(durationDays)))
  const start = startOfDay(startAt)
  const end = endOfDay(addDays(start, d - 1))
  return { startIso: start.toISOString(), endIso: end.toISOString() }
}

export function createLocalSprint(
  projectId: string,
  input: { name: string; goal?: string; startAt: Date; durationDays: number },
): TeamWorkSprint {
  const { startIso, endIso } = buildSprintWindow(input.startAt, input.durationDays)
  const now = new Date().toISOString()
  return {
    id: newLocalSprintId(),
    projectId,
    name: input.name.trim(),
    goal: input.goal?.trim() || undefined,
    startAt: startIso,
    endAt: endIso,
    state: 'planned',
    createdAt: now,
    durationDays: Math.max(1, Math.min(56, Math.floor(input.durationDays))),
  }
}

export function getActiveSprint(sprints: TeamWorkSprint[]): TeamWorkSprint | undefined {
  return sprints.find((s) => s.state === 'active')
}

export function startPlannedSprint(sprints: TeamWorkSprint[], sprintId: string): TeamWorkSprint[] {
  if (sprints.some((s) => s.state === 'active')) {
    throw new Error('Complete the active sprint before starting another.')
  }
  const now = new Date().toISOString()
  return sprints.map((s) =>
    s.id === sprintId && s.state === 'planned'
      ? { ...s, state: 'active', startedAt: now }
      : s,
  )
}

export function completeActiveSprintRow(sprints: TeamWorkSprint[], sprintId: string): TeamWorkSprint[] {
  const now = new Date().toISOString()
  return sprints.map((s) =>
    s.id === sprintId && (s.state === 'active' || s.state === 'planned')
      ? { ...s, state: 'completed', completedAt: now }
      : s,
  )
}

/** Resolved sprint on an item: API field wins, then local assignment map. */
export function resolveItemSprintId(item: TeamWorkItem, assignments: Record<string, string>): string | undefined {
  const fromApi = item.sprintId
  if (fromApi) return fromApi
  const fromLocal = assignments[item.id]
  return fromLocal || undefined
}

export function mergeSprintOntoItems(items: TeamWorkItem[], assignments: Record<string, string>): TeamWorkItem[] {
  return items.map((it) => ({
    ...it,
    sprintId: resolveItemSprintId(it, assignments),
  }))
}

const TERMINAL = new Set<TeamWorkItem['status']>(['done', 'cancelled'])

export function isSprintOpenWork(item: TeamWorkItem): boolean {
  return !TERMINAL.has(item.status)
}

/** Move incomplete issues out of a closing sprint (local assignments + optional API updates by caller). */
export function spillAssignmentsForSprintClose(
  items: TeamWorkItem[],
  closingSprintId: string,
  target: { mode: 'backlog' } | { mode: 'sprint'; sprintId: string },
  assignments: Record<string, string>,
): Record<string, string> {
  const next: Record<string, string> = { ...assignments }
  for (const it of items) {
    const sid = resolveItemSprintId(it, next)
    if (sid !== closingSprintId) continue
    if (!isSprintOpenWork(it)) continue
    if (target.mode === 'backlog') {
      delete next[it.id]
    } else {
      next[it.id] = target.sprintId
    }
  }
  return next
}
