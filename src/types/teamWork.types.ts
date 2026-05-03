/** Team work items — fixer-backend `/api/team-work/*` */

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
