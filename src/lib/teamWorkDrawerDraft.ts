import type { TeamWorkAttachment, TeamWorkItem } from '../types/teamWork.types'

export type TeamWorkDrawerDraft = {
  form: Partial<
    Pick<
      TeamWorkItem,
      | 'title'
      | 'description'
      | 'status'
      | 'priority'
      | 'issueType'
      | 'labels'
      | 'startAt'
      | 'dueAt'
      | 'epicId'
      | 'storyPoints'
      | 'sprintId'
    >
  >
  assigneeUserIds: string[]
  attachments: TeamWorkAttachment[]
  commentDraft: string
  tab: 'details' | 'comments'
}

export function teamWorkDrawerDraftKey(tenantId: string, itemId: string): string {
  return `fixer-tw-drawer:${tenantId}:${itemId}`
}

export function loadTeamWorkDrawerDraft(tenantId: string, itemId: string): TeamWorkDrawerDraft | null {
  try {
    const raw = sessionStorage.getItem(teamWorkDrawerDraftKey(tenantId, itemId))
    if (!raw) return null
    const p = JSON.parse(raw) as TeamWorkDrawerDraft
    if (!p || typeof p !== 'object') return null
    return p
  } catch {
    return null
  }
}

export function saveTeamWorkDrawerDraft(tenantId: string, itemId: string, draft: TeamWorkDrawerDraft): void {
  try {
    sessionStorage.setItem(teamWorkDrawerDraftKey(tenantId, itemId), JSON.stringify(draft))
  } catch {
    /* quota / private mode */
  }
}

export function clearTeamWorkDrawerDraft(tenantId: string, itemId: string): void {
  try {
    sessionStorage.removeItem(teamWorkDrawerDraftKey(tenantId, itemId))
  } catch {
    /* noop */
  }
}
