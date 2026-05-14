/** Team work items — fixer-backend `/api/team-work/*` */

/** Preset tag on a project board (item `labels` store matching slugs). */
export interface TeamWorkTagCatalogEntry {
  slug: string
  name: string
  color?: string
}

/** A project board (access via member roster or tenant-wide when members is empty). */
export interface TeamWorkProject {
  id: string
  name: string
  key: string
  description?: string
  memberUserIds: string[]
  /** Normalized roster emails (mirrors members; used when JWT user id mismatches). */
  memberEmails?: string[]
  tagCatalog: TeamWorkTagCatalogEntry[]
  isDefault?: boolean
  isArchived?: boolean
}

export type TeamWorkStatus =
  | 'backlog'
  | 'todo'
  | 'in_progress'
  | 'in_review'
  | 'blocked'
  | 'done'
  | 'cancelled'

export type TeamWorkPriority = 'lowest' | 'low' | 'medium' | 'high' | 'highest'

export type TeamWorkIssueType = 'task' | 'bug' | 'story' | 'epic'

/** Scrum sprint metadata (backed by fixer-backend `/team-work/sprints`). */
export type TeamWorkSprintState = 'planned' | 'active' | 'completed'

export interface TeamWorkSprint {
  id: string
  projectId: string
  name: string
  goal?: string
  /** Sprint window (ISO). */
  startAt: string
  endAt: string
  state: TeamWorkSprintState
  createdAt: string
  /** When the sprint was started (first moved to active). */
  startedAt?: string
  /** When the sprint was closed. */
  completedAt?: string
  /** Length chosen at creation (e.g. 7 or 14). */
  durationDays: number
}

export interface TeamWorkComment {
  id: string
  userId: string
  authorName?: string
  body: string
  createdAt: string
  /** Present when the author updated the body after posting. */
  editedAt?: string
}

/** File or image linked to an issue (URLs from upload APIs). */
export interface TeamWorkAttachment {
  url: string
  fileName: string
  mimeType?: string
  fileSize?: number
}

export interface TeamWorkItem {
  id: string
  /** Parent project board. */
  projectId?: string
  /** Parent issue when this row is a sub-task (Jira-style). */
  parentWorkItemId?: string
  issueKey: string
  issueNumber: number
  title: string
  description?: string
  status: TeamWorkStatus
  priority: TeamWorkPriority
  issueType: TeamWorkIssueType
  teamKey: string
  assigneeUserId?: string
  /** When the API supports multiple assignees; first id mirrors `assigneeUserId` when synced. */
  assigneeUserIds?: string[]
  reporterUserId: string
  labels: string[]
  /** Planned work start (optional; team calendar). */
  startAt?: string
  dueAt?: string
  epicId?: string
  storyPoints?: number
  /** Scrum sprint membership (API or local overlay). */
  sprintId?: string
  boardRank: number
  /** When the list API omits `comments`, the backend may still send this count. */
  commentCount?: number
  comments?: TeamWorkComment[]
  attachments?: TeamWorkAttachment[]
  completedAt?: string
  createdAt: string
  updatedAt: string
}

export interface TeamWorkMeta {
  projectKey: string
  statuses: TeamWorkStatus[]
  priorities: TeamWorkPriority[]
  issueTypes: TeamWorkIssueType[]
}

export interface TeamWorkListResponse {
  items: TeamWorkItem[]
  total: number
}

export type TeamWorkCalendarEventKind = 'due' | 'ceremony' | 'google'

/** Unified calendar row (due dates, recurring ceremonies, optional Google primary calendar). */
export interface TeamWorkCalendarEvent {
  id: string
  kind: TeamWorkCalendarEventKind
  title: string
  start: string
  end: string
  projectId?: string
  projectKey?: string
  projectName?: string
  issueKey?: string
  issueId?: string
  status?: string
  priority?: string
  htmlLink?: string
  hangoutLink?: string
  ceremonySeriesId?: string
}

export interface TeamWorkCalendarFeed {
  events: TeamWorkCalendarEvent[]
  range: { from: string; to: string }
}

export type TeamWorkCeremonyRecurrence = 'none' | 'daily' | 'weekly'

export interface TeamWorkCeremonySeries {
  id: string
  projectId: string
  title: string
  anchorStart: string
  durationMinutes: number
  recurrence: TeamWorkCeremonyRecurrence
  attendeeUserIds: string[]
  slackWebhookUrl?: string
  teamsWebhookUrl?: string
  isActive: boolean
  createdByUserId: string
}

export interface TeamWorkItemReminderRow {
  id: string
  teamWorkItemId: string
  remindAt: string
  notifyEmail: boolean
  notifySlack: boolean
  notifyTeams: boolean
  createdByUserId: string
  dispatchedAt?: string
  lastError?: string
}
