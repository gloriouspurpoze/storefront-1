/** Marketing Command Center — aligned with fixer-backend `/api/marketing-workspace`. */

export type MarketingCampaignStatus = 'planning' | 'active' | 'paused' | 'completed'

export interface MarketingCampaign {
  id: string
  name: string
  description?: string
  status: MarketingCampaignStatus
  startDate?: string
  endDate?: string
  budgetCents?: number
  kpiNotes?: string
  tags?: string[]
  createdByUserId?: string
  createdAt: string
  updatedAt: string
}

export type MarketingContentType =
  | 'blog'
  | 'newsletter'
  | 'video'
  | 'whitepaper'
  | 'case_study'
  | 'infographic'
  | 'social'
  | 'other'

export type MarketingCalendarStatus =
  | 'idea'
  | 'draft'
  | 'in_review'
  | 'scheduled'
  | 'published'
  | 'archived'

export type MarketingApprovalStepStatus = 'pending' | 'approved' | 'rejected' | 'waived'

export interface MarketingApprovalStep {
  key: string
  label: string
  roleHint?: string
  status: MarketingApprovalStepStatus
  actorUserId?: string
  decidedAt?: string
  note?: string
}

export interface MarketingCalendarItem {
  id: string
  campaignId?: string
  title: string
  scheduledDate: string
  contentType: MarketingContentType
  channel: string
  status: MarketingCalendarStatus
  approvalStage?: string
  approvalSteps?: MarketingApprovalStep[]
  objective?: string
  audience?: string
  notes?: string
  owner?: string
  relatedUrl?: string
  assetUrls?: string[]
  recurringRule?: string
  createdAt: string
  updatedAt: string
}

export type SocialPlatform =
  | 'instagram'
  | 'facebook'
  | 'linkedin'
  | 'x'
  | 'tiktok'
  | 'youtube'
  | 'reddit'
  | 'whatsapp'
  | 'other'

export type MarketingSocialStatus = MarketingCalendarStatus

export type MarketingSocialRedditPostKind = 'self' | 'link'

/** GET/PUT `/marketing-workspace/social/publish-settings` */
export interface MarketingSocialPublishSettingsDto {
  scope: 'tenant' | 'global'
  configured: {
    linkedIn: boolean
    metaFacebook: boolean
    instagram: boolean
    reddit: boolean
    whatsapp: boolean
  }
  linkedInAuthorUrn: string
  metaPageId: string
  metaIgUserId: string
  redditSubreddit: string
  redditUserAgent: string
  whatsappPhoneNumberId: string
  whatsappTo: string
  secretsSaved: {
    linkedInAccessToken: boolean
    metaPageAccessToken: boolean
    redditAccessToken: boolean
    whatsappAccessToken: boolean
  }
}

export interface MarketingSocialPost {
  id: string
  campaignId?: string
  /** Present when this row was created from a master post via multi-platform scheduling. */
  sourcePostId?: string
  title: string
  platform: SocialPlatform
  caption: string
  scheduledAt?: string
  status: MarketingSocialStatus
  hashtags?: string
  assetNotes?: string
  linkUrl?: string
  /** Public https image URL — used for Instagram Graph publishing. */
  mediaImageUrl?: string
  /** Extra https image URLs; 2+ with primary image becomes an Instagram carousel. */
  mediaImageUrls?: string[]
  /** Reddit live publish mode. */
  redditPostKind?: MarketingSocialRedditPostKind
  utmCampaign?: string
  owner?: string
  externalPostId?: string
  externalPermalink?: string
  publishedAt?: string
  publishError?: string
  createdAt: string
  updatedAt: string
}

export type MarketingIdeaGoal = 'awareness' | 'conversion' | 'retention' | 'other'

export type IdeaStage =
  | 'new'
  | 'under_review'
  | 'approved'
  | 'in_development'
  | 'completed'
  | 'rejected'

export type MarketingIdeaEffort = 'xs' | 's' | 'm' | 'l' | 'xl'

export type MarketingTaskPriority = 'low' | 'medium' | 'high'

export interface MarketingIdea {
  id: string
  campaignId?: string
  title: string
  description?: string
  goal: MarketingIdeaGoal
  audience?: string
  urgency: MarketingTaskPriority
  effort: MarketingIdeaEffort
  stage: IdeaStage
  riceReach?: number
  riceImpact?: number
  riceConfidence?: number
  riceEffort?: number
  votesUp: number
  votesDown: number
  tags?: string[]
  owner?: string
  notes?: string
  createdAt: string
  updatedAt: string
}

export type MarketingTaskColumn = 'todo' | 'in_progress' | 'in_review' | 'done'

export type MarketingTaskType =
  | 'writing'
  | 'design'
  | 'review'
  | 'approval'
  | 'publishing'
  | 'reporting'
  | 'other'

export interface MarketingSubtask {
  title: string
  done: boolean
}

export interface MarketingTask {
  id: string
  campaignId?: string
  calendarEntryId?: string
  title: string
  dueDate?: string
  priority: MarketingTaskPriority
  column: MarketingTaskColumn
  taskType: MarketingTaskType
  assigneeUserIds: string[]
  dependsOnTaskId?: string
  timeEstimateMinutes?: number
  timeLoggedMinutes?: number
  subtasks: MarketingSubtask[]
  notes?: string
  owner?: string
  done: boolean
  createdAt: string
  updatedAt: string
}

export type BrainstormCategory =
  | 'hypothesis'
  | 'experiment'
  | 'insight'
  | 'competitor'
  | 'session'
  | 'misc'

export interface MarketingBrainstormItem {
  id: string
  campaignId?: string
  category: BrainstormCategory
  title: string
  body: string
  sessionLabel?: string
  template?: string
  owner?: string
  createdAt: string
  updatedAt: string
}

export interface MarketingWorkspaceOverview {
  campaignCount: number
  calendarUpcoming: number
  socialQueue: number
  ideasActive: number
  tasksOpen: number
  brainstormCount: number
}

/** Counts keyed by domain-specific status/column/stage (from analytics aggregations). */
export interface MarketingWorkspaceAnalytics {
  calendarByStatus: Record<string, number>
  socialByStatus: Record<string, number>
  ideasByStage: Record<string, number>
  tasksByColumn: Record<string, number>
  campaignsByStatus: Record<string, number>
}

export type MarketingActivityEntityType =
  | 'campaign'
  | 'calendar'
  | 'social'
  | 'idea'
  | 'task'
  | 'brainstorm'

export type MarketingActivityAction =
  | 'create'
  | 'update'
  | 'delete'
  | 'vote'
  | 'reschedule'
  | 'approval'
  | 'bulk_import'
  | 'fan_out'
  | 'publish'

export interface MarketingActivityItem {
  id: string
  entityType: MarketingActivityEntityType
  entityId: string
  action: MarketingActivityAction
  summary: string
  actorUserId?: string
  metadata?: Record<string, unknown>
  createdAt: string
}

export interface MarketingTaskTemplate {
  id: string
  name: string
  column: MarketingTaskColumn
  taskType: MarketingTaskType
  subtaskCount: number
}

export interface MarketingWorkspaceBundle {
  campaigns: MarketingCampaign[]
  calendar: MarketingCalendarItem[]
  social: MarketingSocialPost[]
  ideas: MarketingIdea[]
  tasks: MarketingTask[]
  brainstorm: MarketingBrainstormItem[]
  overview: MarketingWorkspaceOverview
  analytics?: MarketingWorkspaceAnalytics
  recentActivity?: MarketingActivityItem[]
}

/** Legacy local-only shape (offline fallback) */
export interface MarketingWorkspaceState {
  campaigns: MarketingCampaign[]
  calendar: MarketingCalendarItem[]
  social: MarketingSocialPost[]
  ideas: MarketingIdea[]
  tasks: MarketingTask[]
  brainstorm: MarketingBrainstormItem[]
}
