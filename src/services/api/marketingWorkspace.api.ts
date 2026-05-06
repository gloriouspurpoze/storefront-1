/**
 * Marketing Command Center — `/api/marketing-workspace/*`
 */
import { apiClient } from '../apiClient'
import type {
  MarketingActivityAction,
  MarketingActivityEntityType,
  MarketingActivityItem,
  MarketingApprovalStep,
  MarketingBrainstormItem,
  MarketingCalendarItem,
  MarketingCampaign,
  MarketingIdea,
  MarketingSocialPost,
  MarketingSocialPublishSettingsDto,
  SocialPlatform,
  MarketingTask,
  MarketingTaskTemplate,
  MarketingWorkspaceAnalytics,
  MarketingWorkspaceBundle,
  MarketingWorkspaceOverview,
} from '../../types/marketingWorkspace.types'

type Envelope<T> = { success: boolean; data: T; message?: string }

function unwrap<T>(body: unknown): T {
  if (body && typeof body === 'object' && 'success' in body) {
    const e = body as Envelope<T>
    if (e.success === false) {
      throw new Error((e as { message?: string }).message || 'Marketing workspace request failed')
    }
    if ('data' in e && e.data !== undefined) return e.data as T
    return undefined as T
  }
  return body as T
}

const quiet = {
  showLoading: false,
  showSuccessToast: false,
  showErrorToast: false,
} as const

function iso(d: unknown): string | undefined {
  if (d == null) return undefined
  if (typeof d === 'string') return d
  return new Date(d as string).toISOString()
}

export function mapCampaign(raw: Record<string, unknown>): MarketingCampaign {
  return {
    id: String(raw.id || raw._id || ''),
    name: String(raw.name || ''),
    description: raw.description ? String(raw.description) : undefined,
    status: (raw.status as MarketingCampaign['status']) || 'planning',
    startDate: iso(raw.startDate),
    endDate: iso(raw.endDate),
    budgetCents: raw.budgetCents != null ? Number(raw.budgetCents) : undefined,
    kpiNotes: raw.kpiNotes ? String(raw.kpiNotes) : undefined,
    tags: Array.isArray(raw.tags) ? (raw.tags as unknown[]).map(String) : [],
    createdByUserId: raw.createdByUserId ? String(raw.createdByUserId) : undefined,
    createdAt: iso(raw.createdAt) || new Date().toISOString(),
    updatedAt: iso(raw.updatedAt) || new Date().toISOString(),
  }
}

const APPROVAL_STEP_STATUSES: MarketingApprovalStep['status'][] = [
  'pending',
  'approved',
  'rejected',
  'waived',
]

function mapApprovalStep(raw: Record<string, unknown>): MarketingApprovalStep {
  const st = String(raw.status || 'pending')
  return {
    key: String(raw.key || ''),
    label: String(raw.label || ''),
    roleHint: raw.roleHint ? String(raw.roleHint) : undefined,
    status: APPROVAL_STEP_STATUSES.includes(st as MarketingApprovalStep['status'])
      ? (st as MarketingApprovalStep['status'])
      : 'pending',
    actorUserId: raw.actorUserId ? String(raw.actorUserId) : undefined,
    decidedAt: iso(raw.decidedAt),
    note: raw.note ? String(raw.note) : undefined,
  }
}

export function mapCalendar(raw: Record<string, unknown>): MarketingCalendarItem {
  return {
    id: String(raw.id || raw._id || ''),
    campaignId: raw.campaignId ? String(raw.campaignId) : undefined,
    title: String(raw.title || ''),
    scheduledDate: String(raw.scheduledDate || '').slice(0, 10),
    contentType: (raw.contentType as MarketingCalendarItem['contentType']) || 'other',
    channel: String(raw.channel || ''),
    status: (raw.status as MarketingCalendarItem['status']) || 'draft',
    approvalStage: raw.approvalStage ? String(raw.approvalStage) : undefined,
    approvalSteps: Array.isArray(raw.approvalSteps)
      ? (raw.approvalSteps as Record<string, unknown>[]).map((s) => mapApprovalStep(s))
      : undefined,
    objective: raw.objective ? String(raw.objective) : undefined,
    audience: raw.audience ? String(raw.audience) : undefined,
    notes: raw.notes ? String(raw.notes) : undefined,
    owner: raw.owner ? String(raw.owner) : undefined,
    relatedUrl: raw.relatedUrl ? String(raw.relatedUrl) : undefined,
    assetUrls: Array.isArray(raw.assetUrls) ? (raw.assetUrls as unknown[]).map(String) : [],
    recurringRule: raw.recurringRule ? String(raw.recurringRule) : undefined,
    createdAt: iso(raw.createdAt) || new Date().toISOString(),
    updatedAt: iso(raw.updatedAt) || new Date().toISOString(),
  }
}

export function mapSocial(raw: Record<string, unknown>): MarketingSocialPost {
  const rk = raw.redditPostKind === 'link' ? 'link' : raw.redditPostKind === 'self' ? 'self' : undefined
  return {
    id: String(raw.id || raw._id || ''),
    campaignId: raw.campaignId ? String(raw.campaignId) : undefined,
    sourcePostId: raw.sourcePostId ? String(raw.sourcePostId) : undefined,
    title: String(raw.title || ''),
    platform: (raw.platform as MarketingSocialPost['platform']) || 'linkedin',
    caption: String(raw.caption || ''),
    scheduledAt: iso(raw.scheduledAt),
    status: (raw.status as MarketingSocialPost['status']) || 'draft',
    hashtags: raw.hashtags ? String(raw.hashtags) : undefined,
    assetNotes: raw.assetNotes ? String(raw.assetNotes) : undefined,
    linkUrl: raw.linkUrl ? String(raw.linkUrl) : undefined,
    mediaImageUrl: raw.mediaImageUrl ? String(raw.mediaImageUrl) : undefined,
    mediaImageUrls: Array.isArray(raw.mediaImageUrls)
      ? (raw.mediaImageUrls as unknown[]).map((u) => String(u))
      : undefined,
    redditPostKind: rk,
    utmCampaign: raw.utmCampaign ? String(raw.utmCampaign) : undefined,
    owner: raw.owner ? String(raw.owner) : undefined,
    externalPostId: raw.externalPostId ? String(raw.externalPostId) : undefined,
    externalPermalink: raw.externalPermalink ? String(raw.externalPermalink) : undefined,
    publishedAt: iso(raw.publishedAt),
    publishError: raw.publishError ? String(raw.publishError) : undefined,
    createdAt: iso(raw.createdAt) || new Date().toISOString(),
    updatedAt: iso(raw.updatedAt) || new Date().toISOString(),
  }
}

export function mapIdea(raw: Record<string, unknown>): MarketingIdea {
  return {
    id: String(raw.id || raw._id || ''),
    campaignId: raw.campaignId ? String(raw.campaignId) : undefined,
    title: String(raw.title || ''),
    description: raw.description ? String(raw.description) : undefined,
    goal: (raw.goal as MarketingIdea['goal']) || 'other',
    audience: raw.audience ? String(raw.audience) : undefined,
    urgency: (raw.urgency as MarketingIdea['urgency']) || 'medium',
    effort: (raw.effort as MarketingIdea['effort']) || 'm',
    stage: (raw.stage as MarketingIdea['stage']) || 'new',
    riceReach: raw.riceReach != null ? Number(raw.riceReach) : undefined,
    riceImpact: raw.riceImpact != null ? Number(raw.riceImpact) : undefined,
    riceConfidence: raw.riceConfidence != null ? Number(raw.riceConfidence) : undefined,
    riceEffort: raw.riceEffort != null ? Number(raw.riceEffort) : undefined,
    votesUp: raw.votesUp != null ? Number(raw.votesUp) : 0,
    votesDown: raw.votesDown != null ? Number(raw.votesDown) : 0,
    tags: Array.isArray(raw.tags) ? (raw.tags as unknown[]).map(String) : [],
    owner: raw.owner ? String(raw.owner) : undefined,
    notes: raw.notes ? String(raw.notes) : undefined,
    createdAt: iso(raw.createdAt) || new Date().toISOString(),
    updatedAt: iso(raw.updatedAt) || new Date().toISOString(),
  }
}

export function mapTask(raw: Record<string, unknown>): MarketingTask {
  return {
    id: String(raw.id || raw._id || ''),
    campaignId: raw.campaignId ? String(raw.campaignId) : undefined,
    calendarEntryId: raw.calendarEntryId ? String(raw.calendarEntryId) : undefined,
    title: String(raw.title || ''),
    dueDate: iso(raw.dueDate),
    priority: (raw.priority as MarketingTask['priority']) || 'medium',
    column: (raw.column as MarketingTask['column']) || 'todo',
    taskType: (raw.taskType as MarketingTask['taskType']) || 'other',
    assigneeUserIds: Array.isArray(raw.assigneeUserIds)
      ? (raw.assigneeUserIds as unknown[]).map(String)
      : [],
    dependsOnTaskId: raw.dependsOnTaskId ? String(raw.dependsOnTaskId) : undefined,
    timeEstimateMinutes: raw.timeEstimateMinutes != null ? Number(raw.timeEstimateMinutes) : undefined,
    timeLoggedMinutes: raw.timeLoggedMinutes != null ? Number(raw.timeLoggedMinutes) : undefined,
    subtasks: Array.isArray(raw.subtasks)
      ? (raw.subtasks as { title?: string; done?: boolean }[]).map((s) => ({
          title: String(s.title || ''),
          done: !!s.done,
        }))
      : [],
    notes: raw.notes ? String(raw.notes) : undefined,
    owner: raw.owner ? String(raw.owner) : undefined,
    done: !!raw.done,
    createdAt: iso(raw.createdAt) || new Date().toISOString(),
    updatedAt: iso(raw.updatedAt) || new Date().toISOString(),
  }
}

export function mapBrainstorm(raw: Record<string, unknown>): MarketingBrainstormItem {
  return {
    id: String(raw.id || raw._id || ''),
    campaignId: raw.campaignId ? String(raw.campaignId) : undefined,
    category: (raw.category as MarketingBrainstormItem['category']) || 'misc',
    title: String(raw.title || ''),
    body: String(raw.body || ''),
    sessionLabel: raw.sessionLabel ? String(raw.sessionLabel) : undefined,
    template: raw.template ? String(raw.template) : undefined,
    owner: raw.owner ? String(raw.owner) : undefined,
    createdAt: iso(raw.createdAt) || new Date().toISOString(),
    updatedAt: iso(raw.updatedAt) || new Date().toISOString(),
  }
}

const ACTIVITY_ENTITIES: MarketingActivityEntityType[] = [
  'campaign',
  'calendar',
  'social',
  'idea',
  'task',
  'brainstorm',
]
const ACTIVITY_ACTIONS: MarketingActivityAction[] = [
  'create',
  'update',
  'delete',
  'vote',
  'reschedule',
  'approval',
  'bulk_import',
  'fan_out',
  'publish',
]

function mapAnalytics(raw: unknown): MarketingWorkspaceAnalytics | undefined {
  if (!raw || typeof raw !== 'object') return undefined
  const r = raw as Record<string, unknown>
  const pick = (key: string): Record<string, number> => {
    const v = r[key]
    if (!v || typeof v !== 'object') return {}
    const out: Record<string, number> = {}
    for (const [k, val] of Object.entries(v as Record<string, unknown>)) {
      out[k] = Number(val) || 0
    }
    return out
  }
  return {
    calendarByStatus: pick('calendarByStatus'),
    socialByStatus: pick('socialByStatus'),
    ideasByStage: pick('ideasByStage'),
    tasksByColumn: pick('tasksByColumn'),
    campaignsByStatus: pick('campaignsByStatus'),
  }
}

export function mapActivityLog(raw: Record<string, unknown>): MarketingActivityItem {
  const et = String(raw.entityType || 'brainstorm')
  const ac = String(raw.action || 'update')
  return {
    id: String(raw.id || raw._id || ''),
    entityType: ACTIVITY_ENTITIES.includes(et as MarketingActivityEntityType)
      ? (et as MarketingActivityEntityType)
      : 'brainstorm',
    entityId: String(raw.entityId || ''),
    action: ACTIVITY_ACTIONS.includes(ac as MarketingActivityAction) ? (ac as MarketingActivityAction) : 'update',
    summary: String(raw.summary || ''),
    actorUserId: raw.actorUserId ? String(raw.actorUserId) : undefined,
    metadata:
      raw.metadata && typeof raw.metadata === 'object'
        ? (raw.metadata as Record<string, unknown>)
        : undefined,
    createdAt: iso(raw.createdAt) || new Date().toISOString(),
  }
}

function mapBundle(raw: Record<string, unknown>): MarketingWorkspaceBundle {
  const ov = (raw.overview || {}) as Record<string, unknown>
  const overview: MarketingWorkspaceOverview = {
    campaignCount: Number(ov.campaignCount ?? 0),
    calendarUpcoming: Number(ov.calendarUpcoming ?? 0),
    socialQueue: Number(ov.socialQueue ?? 0),
    ideasActive: Number(ov.ideasActive ?? 0),
    tasksOpen: Number(ov.tasksOpen ?? 0),
    brainstormCount: Number(ov.brainstormCount ?? 0),
  }
  return {
    campaigns: Array.isArray(raw.campaigns) ? (raw.campaigns as Record<string, unknown>[]).map(mapCampaign) : [],
    calendar: Array.isArray(raw.calendar) ? (raw.calendar as Record<string, unknown>[]).map(mapCalendar) : [],
    social: Array.isArray(raw.social) ? (raw.social as Record<string, unknown>[]).map(mapSocial) : [],
    ideas: Array.isArray(raw.ideas) ? (raw.ideas as Record<string, unknown>[]).map(mapIdea) : [],
    tasks: Array.isArray(raw.tasks) ? (raw.tasks as Record<string, unknown>[]).map(mapTask) : [],
    brainstorm: Array.isArray(raw.brainstorm)
      ? (raw.brainstorm as Record<string, unknown>[]).map(mapBrainstorm)
      : [],
    overview,
    analytics: mapAnalytics(raw.analytics),
    recentActivity: Array.isArray(raw.recentActivity)
      ? (raw.recentActivity as Record<string, unknown>[]).map(mapActivityLog)
      : undefined,
  }
}

export type MarketingWorkspaceQuery = {
  month?: string
  weekStart?: string
  calendarCampaignId?: string
}

export const marketingWorkspaceApi = {
  async getWorkspace(params?: MarketingWorkspaceQuery): Promise<MarketingWorkspaceBundle> {
    const body = await apiClient.get<Envelope<Record<string, unknown>>>('/marketing-workspace/workspace', {
      ...quiet,
      params: params as Record<string, string | undefined> | undefined,
    })
    return mapBundle(unwrap<Record<string, unknown>>(body) as Record<string, unknown>)
  },

  async listActivity(limit = 50): Promise<MarketingActivityItem[]> {
    const body = await apiClient.get<Envelope<Record<string, unknown>[]>>('/marketing-workspace/activity', {
      ...quiet,
      params: { limit: String(limit) },
    })
    const data = unwrap<Record<string, unknown>[]>(body)
    return Array.isArray(data) ? data.map((row) => mapActivityLog(row)) : []
  },

  async createCampaign(payload: Record<string, unknown>) {
    const body = await apiClient.post<Envelope<Record<string, unknown>>>(
      '/marketing-workspace/campaigns',
      payload,
      { ...quiet, showSuccessToast: true, successMessage: 'Campaign saved' },
    )
    return mapCampaign(unwrap(body) as Record<string, unknown>)
  },

  async updateCampaign(id: string, payload: Record<string, unknown>) {
    const body = await apiClient.put<Envelope<Record<string, unknown>>>(
      `/marketing-workspace/campaigns/${id}`,
      payload,
      { ...quiet, showSuccessToast: true, successMessage: 'Campaign updated' },
    )
    return mapCampaign(unwrap(body) as Record<string, unknown>)
  },

  async deleteCampaign(id: string) {
    await apiClient.delete(`/marketing-workspace/campaigns/${id}`, {
      ...quiet,
      showSuccessToast: true,
      successMessage: 'Campaign removed',
    })
  },

  async createCalendar(payload: Record<string, unknown>) {
    const body = await apiClient.post<Envelope<Record<string, unknown>>>(
      '/marketing-workspace/calendar',
      payload,
      { ...quiet, showSuccessToast: true, successMessage: 'Calendar entry added' },
    )
    return mapCalendar(unwrap(body) as Record<string, unknown>)
  },

  async updateCalendar(id: string, payload: Record<string, unknown>) {
    const body = await apiClient.put<Envelope<Record<string, unknown>>>(
      `/marketing-workspace/calendar/${id}`,
      payload,
      { ...quiet, showSuccessToast: true, successMessage: 'Updated' },
    )
    return mapCalendar(unwrap(body) as Record<string, unknown>)
  },

  async deleteCalendar(id: string) {
    await apiClient.delete(`/marketing-workspace/calendar/${id}`, {
      ...quiet,
      showSuccessToast: true,
      successMessage: 'Removed',
    })
  },

  async rescheduleCalendar(id: string, scheduledDate: string) {
    const body = await apiClient.patch<Envelope<Record<string, unknown>>>(
      `/marketing-workspace/calendar/${id}/reschedule`,
      { scheduledDate },
      { ...quiet, showSuccessToast: true, successMessage: 'Rescheduled' },
    )
    return mapCalendar(unwrap(body) as Record<string, unknown>)
  },

  async patchCalendarApprovalStep(
    id: string,
    stepIndex: number,
    payload: { status: 'approved' | 'rejected' | 'waived'; note?: string; autoAdvanceToScheduled?: boolean },
  ) {
    const body = await apiClient.patch<Envelope<Record<string, unknown>>>(
      `/marketing-workspace/calendar/${id}/approval-steps/${stepIndex}`,
      payload,
      { ...quiet, showSuccessToast: true, successMessage: 'Approval updated' },
    )
    return mapCalendar(unwrap(body) as Record<string, unknown>)
  },

  async getSocialPublishConfig(): Promise<{
    linkedIn: boolean
    metaFacebook: boolean
    instagram: boolean
    reddit: boolean
    whatsapp: boolean
  }> {
    const body = await apiClient.get<
      Envelope<{
        linkedIn: boolean
        metaFacebook: boolean
        instagram: boolean
        reddit: boolean
        whatsapp: boolean
      }>
    >('/marketing-workspace/social/publish-config', quiet)
    return unwrap(body)
  },

  async getSocialPublishSettings(): Promise<MarketingSocialPublishSettingsDto> {
    const body = await apiClient.get<Envelope<MarketingSocialPublishSettingsDto>>(
      '/marketing-workspace/social/publish-settings',
      quiet,
    )
    return unwrap(body)
  },

  async putSocialPublishSettings(payload: Record<string, unknown>): Promise<MarketingSocialPublishSettingsDto> {
    const body = await apiClient.put<Envelope<MarketingSocialPublishSettingsDto>>(
      '/marketing-workspace/social/publish-settings',
      payload,
      { ...quiet, showSuccessToast: true, successMessage: 'Live publish settings saved' },
    )
    return unwrap(body)
  },

  async publishSocial(id: string): Promise<MarketingSocialPost> {
    const body = await apiClient.post<Envelope<Record<string, unknown>>>(
      `/marketing-workspace/social/${id}/publish`,
      {},
      { ...quiet, showSuccessToast: true, successMessage: 'Published to network' },
    )
    return mapSocial(unwrap(body) as Record<string, unknown>)
  },

  async createSocial(payload: Record<string, unknown>) {
    const body = await apiClient.post<Envelope<Record<string, unknown>>>(
      '/marketing-workspace/social',
      payload,
      { ...quiet, showSuccessToast: true, successMessage: 'Post saved' },
    )
    return mapSocial(unwrap(body) as Record<string, unknown>)
  },

  async updateSocial(id: string, payload: Record<string, unknown>) {
    const body = await apiClient.put<Envelope<Record<string, unknown>>>(
      `/marketing-workspace/social/${id}`,
      payload,
      { ...quiet, showSuccessToast: true, successMessage: 'Updated' },
    )
    return mapSocial(unwrap(body) as Record<string, unknown>)
  },

  async deleteSocial(id: string) {
    await apiClient.delete(`/marketing-workspace/social/${id}`, {
      ...quiet,
      showSuccessToast: true,
      successMessage: 'Removed',
    })
  },

  async bulkCreateSocial(rows: Record<string, unknown>[]): Promise<{
    createdCount: number
    created: unknown[]
    errors: string[]
  }> {
    const body = await apiClient.post<
      Envelope<{ createdCount: number; created: unknown[]; errors: string[] }>
    >('/marketing-workspace/social/bulk', { rows }, { ...quiet, showSuccessToast: true, successMessage: 'Bulk import completed' })
    return unwrap<{ createdCount: number; created: unknown[]; errors: string[] }>(body)
  },

  async scheduleSocialAllPlatforms(
    id: string,
    body: { scheduledAt?: string; platforms?: SocialPlatform[] },
  ): Promise<{ sourceId: string; scheduledAt: string | null; platforms: string[]; posts: MarketingSocialPost[] }> {
    const res = await apiClient.post<Envelope<Record<string, unknown>>>(
      `/marketing-workspace/social/${id}/schedule-all-platforms`,
      body,
      {
        ...quiet,
        showSuccessToast: true,
        successMessage: 'Scheduled across selected platforms',
      },
    )
    const data = unwrap<Record<string, unknown>>(res)
    const postsRaw = data.posts
    return {
      sourceId: String(data.sourceId ?? id),
      scheduledAt: data.scheduledAt != null ? String(data.scheduledAt) : null,
      platforms: Array.isArray(data.platforms) ? (data.platforms as string[]) : [],
      posts: Array.isArray(postsRaw)
        ? (postsRaw as Record<string, unknown>[]).map((p) => mapSocial(p))
        : [],
    }
  },

  async createIdea(payload: Record<string, unknown>) {
    const body = await apiClient.post<Envelope<Record<string, unknown>>>(
      '/marketing-workspace/ideas',
      payload,
      { ...quiet, showSuccessToast: true, successMessage: 'Idea captured' },
    )
    return mapIdea(unwrap(body) as Record<string, unknown>)
  },

  async updateIdea(id: string, payload: Record<string, unknown>) {
    const body = await apiClient.put<Envelope<Record<string, unknown>>>(
      `/marketing-workspace/ideas/${id}`,
      payload,
      { ...quiet, showSuccessToast: true, successMessage: 'Updated' },
    )
    return mapIdea(unwrap(body) as Record<string, unknown>)
  },

  async voteIdea(id: string, direction: 'up' | 'down') {
    const body = await apiClient.post<Envelope<Record<string, unknown>>>(
      `/marketing-workspace/ideas/${id}/vote`,
      { direction },
      quiet,
    )
    return mapIdea(unwrap(body) as Record<string, unknown>)
  },

  async deleteIdea(id: string) {
    await apiClient.delete(`/marketing-workspace/ideas/${id}`, {
      ...quiet,
      showSuccessToast: true,
      successMessage: 'Removed',
    })
  },

  async createTask(payload: Record<string, unknown>) {
    const body = await apiClient.post<Envelope<Record<string, unknown>>>(
      '/marketing-workspace/tasks',
      payload,
      { ...quiet, showSuccessToast: true, successMessage: 'Task added' },
    )
    return mapTask(unwrap(body) as Record<string, unknown>)
  },

  async listTaskTemplates(): Promise<MarketingTaskTemplate[]> {
    const body = await apiClient.get<Envelope<MarketingTaskTemplate[]>>('/marketing-workspace/tasks/templates', quiet)
    const data = unwrap<MarketingTaskTemplate[]>(body)
    return Array.isArray(data) ? data : []
  },

  async createTaskFromTemplate(payload: Record<string, unknown>) {
    const body = await apiClient.post<Envelope<Record<string, unknown>>>(
      '/marketing-workspace/tasks/from-template',
      payload,
      { ...quiet, showSuccessToast: true, successMessage: 'Task created from template' },
    )
    return mapTask(unwrap(body) as Record<string, unknown>)
  },

  async updateTask(id: string, payload: Record<string, unknown>) {
    const body = await apiClient.put<Envelope<Record<string, unknown>>>(
      `/marketing-workspace/tasks/${id}`,
      payload,
      { ...quiet, showSuccessToast: true, successMessage: 'Updated' },
    )
    return mapTask(unwrap(body) as Record<string, unknown>)
  },

  async deleteTask(id: string) {
    await apiClient.delete(`/marketing-workspace/tasks/${id}`, {
      ...quiet,
      showSuccessToast: true,
      successMessage: 'Removed',
    })
  },

  async createBrainstorm(payload: Record<string, unknown>) {
    const body = await apiClient.post<Envelope<Record<string, unknown>>>(
      '/marketing-workspace/brainstorm',
      payload,
      { ...quiet, showSuccessToast: true, successMessage: 'Note saved' },
    )
    return mapBrainstorm(unwrap(body) as Record<string, unknown>)
  },

  async updateBrainstorm(id: string, payload: Record<string, unknown>) {
    const body = await apiClient.put<Envelope<Record<string, unknown>>>(
      `/marketing-workspace/brainstorm/${id}`,
      payload,
      { ...quiet, showSuccessToast: true, successMessage: 'Updated' },
    )
    return mapBrainstorm(unwrap(body) as Record<string, unknown>)
  },

  async deleteBrainstorm(id: string) {
    await apiClient.delete(`/marketing-workspace/brainstorm/${id}`, {
      ...quiet,
      showSuccessToast: true,
      successMessage: 'Removed',
    })
  },
}
