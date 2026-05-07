import type { User } from '../services/api/users.service'
import type { TeamWorkProject } from '../types/teamWork.types'

function normEmail(e: string | undefined): string {
  return String(e || '')
    .trim()
    .toLowerCase()
}

/**
 * Users eligible as assignees: board members when the project is restricted;
 * otherwise the same directory list already scoped to org members (API `scope: 'members'`).
 */
export function getProjectTeamUsersForAssignee(
  project: TeamWorkProject | null | undefined,
  directoryUsers: User[],
): User[] {
  const list = [...directoryUsers]
  list.sort((a, b) => {
    const la = (a.username || `${a.firstName || ''} ${a.lastName || ''}`.trim() || a.email || a.id).toLowerCase()
    const lb = (b.username || `${b.firstName || ''} ${b.lastName || ''}`.trim() || b.email || b.id).toLowerCase()
    return la.localeCompare(lb)
  })
  const idCount = project?.memberUserIds?.length ?? 0
  const emailCount = project?.memberEmails?.length ?? 0
  if (!idCount && !emailCount) return list
  const allowedIds = new Set(project!.memberUserIds)
  const allowedEmails = new Set((project!.memberEmails ?? []).map(normEmail).filter(Boolean))
  return list.filter(
    (u) => allowedIds.has(u.id) || (u.email ? allowedEmails.has(normEmail(u.email)) : false),
  )
}
