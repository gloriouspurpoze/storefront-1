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

export interface TeamWorkComment {
  id: string
  userId: string
  authorName?: string
  body: string
  createdAt: string
}

export interface TeamWorkItem {
  id: string
  /** Parent project board. */
  projectId?: string
  issueKey: string
  issueNumber: number
  title: string
  description?: string
  status: TeamWorkStatus
  priority: TeamWorkPriority
  issueType: TeamWorkIssueType
  teamKey: string
  assigneeUserId?: string
  reporterUserId: string
  labels: string[]
  dueAt?: string
  epicId?: string
  storyPoints?: number
  boardRank: number
  comments?: TeamWorkComment[]
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
