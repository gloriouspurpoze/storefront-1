/**
 * Team work REST client — fixer-backend `/api/team-work/*`.
 */
import { apiClient } from '../apiClient'
import type {
  TeamWorkAttachment,
  TeamWorkCalendarFeed,
  TeamWorkCeremonySeries,
  TeamWorkComment,
  TeamWorkItem,
  TeamWorkItemReminderRow,
  TeamWorkListResponse,
  TeamWorkMeta,
  TeamWorkProject,
  TeamWorkTagCatalogEntry,
} from '../../types/teamWork.types'

type ApiEnvelope<T> = { success: boolean; data: T; message?: string }

function unwrap<T>(body: unknown): T {
  if (body && typeof body === 'object' && 'success' in body) {
    const e = body as ApiEnvelope<T>
    if (e.success === false) {
      throw new Error((e as { message?: string }).message || 'Team work request failed')
    }
    if ('data' in e && e.data !== undefined) {
      return e.data as T
    }
    return undefined as T
  }
  return body as T
}

function mapComment(c: Record<string, unknown>): TeamWorkComment {
  const id = (c.id as string) || (c._id as { toString?: () => string })?.toString?.() || ''
  return {
    id,
    userId: String(c.userId || ''),
    authorName: c.authorName ? String(c.authorName) : undefined,
    body: String(c.body || ''),
    createdAt: c.createdAt ? new Date(c.createdAt as string).toISOString() : new Date().toISOString(),
  }
}

function mapProject(raw: Record<string, unknown>): TeamWorkProject {
  const catRaw = raw.tagCatalog as Record<string, unknown>[] | undefined
  const tagCatalog: TeamWorkTagCatalogEntry[] = Array.isArray(catRaw)
    ? catRaw
        .map((t) => ({
          slug: String(t.slug || '').trim(),
          name: String(t.name || t.slug || '').trim(),
          color: t.color ? String(t.color) : undefined,
        }))
        .filter((t) => t.slug && t.name)
    : []
  const emailsRaw = raw.memberEmails as unknown[] | undefined
  const memberEmails = Array.isArray(emailsRaw)
    ? emailsRaw.map((x) => String(x).trim().toLowerCase()).filter(Boolean)
    : undefined
  return {
    id: String(raw.id || raw._id || ''),
    name: String(raw.name || ''),
    key: String(raw.key || ''),
    description: raw.description ? String(raw.description) : undefined,
    memberUserIds: Array.isArray(raw.memberUserIds) ? (raw.memberUserIds as unknown[]).map((x) => String(x)) : [],
    ...(memberEmails !== undefined ? { memberEmails } : {}),
    tagCatalog,
    isDefault: Boolean(raw.isDefault),
    isArchived: Boolean(raw.isArchived),
  }
}

function mapCeremony(raw: Record<string, unknown>): TeamWorkCeremonySeries {
  return {
    id: String(raw.id || raw._id || ''),
    projectId: String(raw.projectId || ''),
    title: String(raw.title || ''),
    anchorStart: raw.anchorStart ? new Date(raw.anchorStart as string).toISOString() : '',
    durationMinutes: Number(raw.durationMinutes ?? 60),
    recurrence: (raw.recurrence as TeamWorkCeremonySeries['recurrence']) || 'weekly',
    attendeeUserIds: Array.isArray(raw.attendeeUserIds) ? (raw.attendeeUserIds as unknown[]).map((x) => String(x)) : [],
    slackWebhookUrl: raw.slackWebhookUrl ? String(raw.slackWebhookUrl) : undefined,
    teamsWebhookUrl: raw.teamsWebhookUrl ? String(raw.teamsWebhookUrl) : undefined,
    isActive: raw.isActive !== false,
    createdByUserId: String(raw.createdByUserId || ''),
  }
}

function mapReminder(raw: Record<string, unknown>): TeamWorkItemReminderRow {
  return {
    id: String(raw.id || raw._id || ''),
    teamWorkItemId: String(raw.teamWorkItemId || ''),
    remindAt: raw.remindAt ? new Date(raw.remindAt as string).toISOString() : '',
    notifyEmail: raw.notifyEmail !== false,
    notifySlack: Boolean(raw.notifySlack),
    notifyTeams: Boolean(raw.notifyTeams),
    createdByUserId: String(raw.createdByUserId || ''),
    dispatchedAt: raw.dispatchedAt ? new Date(raw.dispatchedAt as string).toISOString() : undefined,
    lastError: raw.lastError ? String(raw.lastError) : undefined,
  }
}

function mapAttachment(a: Record<string, unknown>): TeamWorkAttachment {
  return {
    url: String(a.url || ''),
    fileName: String(a.fileName || a.name || 'attachment'),
    mimeType: a.mimeType ? String(a.mimeType) : undefined,
    fileSize: a.fileSize !== undefined && a.fileSize !== null ? Number(a.fileSize) : undefined,
  }
}

function mapItem(raw: Record<string, unknown>): TeamWorkItem {
  const commentsRaw = raw.comments as Record<string, unknown>[] | undefined
  const assigneesRaw = raw.assigneeUserIds as unknown[] | undefined
  const assigneeUserIds = Array.isArray(assigneesRaw)
    ? Array.from(new Set(assigneesRaw.map((x) => String(x)).filter(Boolean)))
    : undefined
  const singleAssignee = raw.assigneeUserId ? String(raw.assigneeUserId) : undefined
  const attachmentsRaw = raw.attachments as Record<string, unknown>[] | undefined
  const parentRaw = raw.parentWorkItemId ?? raw.parentId ?? raw.parentItemId
  return {
    id: String(raw.id || raw._id || ''),
    projectId: raw.projectId ? String(raw.projectId) : undefined,
    parentWorkItemId: parentRaw ? String(parentRaw) : undefined,
    issueKey: String(raw.issueKey || ''),
    issueNumber: Number(raw.issueNumber ?? 0),
    title: String(raw.title || ''),
    description: raw.description ? String(raw.description) : undefined,
    status: raw.status as TeamWorkItem['status'],
    priority: raw.priority as TeamWorkItem['priority'],
    issueType: raw.issueType as TeamWorkItem['issueType'],
    teamKey: String(raw.teamKey || 'operations'),
    assigneeUserId: singleAssignee ?? (assigneeUserIds?.length ? assigneeUserIds[0] : undefined),
    assigneeUserIds: assigneeUserIds?.length ? assigneeUserIds : undefined,
    reporterUserId: String(raw.reporterUserId || ''),
    labels: Array.isArray(raw.labels) ? (raw.labels as unknown[]).map((x) => String(x)) : [],
    startAt: raw.startAt ? new Date(raw.startAt as string).toISOString() : undefined,
    dueAt: raw.dueAt ? new Date(raw.dueAt as string).toISOString() : undefined,
    epicId: raw.epicId ? String(raw.epicId) : undefined,
    storyPoints: raw.storyPoints !== undefined && raw.storyPoints !== null ? Number(raw.storyPoints) : undefined,
    boardRank: Number(raw.boardRank ?? 0),
    sprintId: raw.sprintId ? String(raw.sprintId) : undefined,
    comments: commentsRaw?.length ? commentsRaw.map((c) => mapComment(c)) : undefined,
    attachments: attachmentsRaw?.filter((x) => x && String((x as Record<string, unknown>).url || '')).length
      ? attachmentsRaw.map((x) => mapAttachment(x as Record<string, unknown>)).filter((x) => x.url)
      : undefined,
    completedAt: raw.completedAt ? new Date(raw.completedAt as string).toISOString() : undefined,
    createdAt: raw.createdAt ? new Date(raw.createdAt as string).toISOString() : '',
    updatedAt: raw.updatedAt ? new Date(raw.updatedAt as string).toISOString() : '',
  }
}

async function getJson<T>(path: string, showLoading = false): Promise<T> {
  const r = await apiClient.get<ApiEnvelope<T>>(path, {
    showSuccessToast: false,
    showErrorToast: true,
    showLoading,
  })
  return unwrap<T>(r as unknown as ApiEnvelope<T>)
}

async function sendJson<T>(
  method: 'POST' | 'PUT' | 'DELETE' | 'PATCH',
  path: string,
  body?: unknown,
  showLoading = true,
): Promise<T> {
  const cfg = { showSuccessToast: false, showErrorToast: true, showLoading }
  const r =
    method === 'POST'
      ? await apiClient.post<ApiEnvelope<T>>(path, body, cfg)
      : method === 'PUT'
        ? await apiClient.put<ApiEnvelope<T>>(path, body, cfg)
        : method === 'PATCH'
          ? await apiClient.patch<ApiEnvelope<T>>(path, body, cfg)
          : await apiClient.delete<ApiEnvelope<T>>(path, cfg)
  return unwrap<T>(r as unknown as ApiEnvelope<T>)
}

export const teamWorkApi = {
  async getMeta(): Promise<TeamWorkMeta> {
    return getJson<TeamWorkMeta>('/team-work/meta', false)
  },

  async listProjects(): Promise<TeamWorkProject[]> {
    const d = await getJson<{ projects: Record<string, unknown>[] }>('/team-work/projects', false)
    return (d.projects || []).map((row) => mapProject(row))
  },

  async createProject(body: {
    name: string
    key?: string
    description?: string
    memberUserIds?: string[]
  }): Promise<TeamWorkProject> {
    const d = await sendJson<{ project: Record<string, unknown> }>('POST', '/team-work/projects', body)
    return mapProject(d.project)
  },

  async getProjectTags(projectId: string): Promise<{ catalog: TeamWorkTagCatalogEntry[]; inUse: string[] }> {
    return getJson(`/team-work/projects/${projectId}/tags`, false)
  },

  async patchProject(
    id: string,
    body: Partial<
      Pick<TeamWorkProject, 'name' | 'description' | 'memberUserIds' | 'memberEmails' | 'isArchived' | 'tagCatalog'>
    >,
  ): Promise<TeamWorkProject> {
    const d = await sendJson<{ project: Record<string, unknown> }>('PATCH', `/team-work/projects/${id}`, body)
    return mapProject(d.project)
  },

  async listItems(params?: Record<string, string | undefined>): Promise<TeamWorkListResponse> {
    const qs = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== '') qs.set(k, v)
      })
    }
    const q = qs.toString()
    const path = q ? `/team-work/items?${q}` : '/team-work/items'
    const data = await getJson<{ items: Record<string, unknown>[]; total: number }>(path, false)
    return {
      items: (data.items || []).map((row) => mapItem(row)),
      total: data.total ?? 0,
    }
  },

  async getItem(id: string): Promise<TeamWorkItem> {
    const row = await getJson<Record<string, unknown>>(`/team-work/items/${id}`, false)
    return mapItem(row)
  },

  async createItem(
    body: Partial<
      Pick<
        TeamWorkItem,
        | 'projectId'
        | 'title'
        | 'description'
        | 'status'
        | 'priority'
        | 'issueType'
        | 'teamKey'
        | 'assigneeUserId'
        | 'assigneeUserIds'
        | 'labels'
        | 'startAt'
        | 'dueAt'
        | 'epicId'
        | 'storyPoints'
        | 'status'
        | 'parentWorkItemId'
        | 'attachments'
        | 'sprintId'
      >
    >,
  ): Promise<TeamWorkItem> {
    const row = await sendJson<Record<string, unknown>>('POST', '/team-work/items', body)
    return mapItem(row)
  },

  async updateItem(id: string, body: Partial<TeamWorkItem>): Promise<TeamWorkItem> {
    const row = await sendJson<Record<string, unknown>>('PUT', `/team-work/items/${id}`, body)
    return mapItem(row)
  },

  async patchStatus(id: string, status: TeamWorkItem['status'], boardRank?: number): Promise<TeamWorkItem> {
    const row = await sendJson<Record<string, unknown>>('PATCH', `/team-work/items/${id}/status`, {
      status,
      boardRank,
    })
    return mapItem(row)
  },

  async deleteItem(id: string): Promise<void> {
    await sendJson<unknown>('DELETE', `/team-work/items/${id}`)
  },

  async addComment(id: string, body: string): Promise<TeamWorkItem> {
    const row = await sendJson<Record<string, unknown>>('POST', `/team-work/items/${id}/comments`, { body })
    return mapItem(row)
  },

  async getCalendarFeed(params: { from: string; to: string; includeGoogle?: boolean }): Promise<TeamWorkCalendarFeed> {
    const qs = new URLSearchParams({ from: params.from, to: params.to })
    if (params.includeGoogle) qs.set('includeGoogle', '1')
    return getJson<TeamWorkCalendarFeed>(`/team-work/calendar?${qs.toString()}`, false)
  },

  async getGoogleCalendarStatus(): Promise<{ googleConnected: boolean; lastCalendarWriteAt?: string }> {
    return getJson('/team-work/calendar/google/status', false)
  },

  async getGoogleCalendarOAuthUrl(): Promise<string> {
    const d = await getJson<{ url: string }>('/team-work/calendar/google/oauth-url', false)
    return d.url
  },

  async createGoogleCalendarEvent(body: {
    title: string
    description?: string
    start: string
    end: string
    attendeeEmails?: string[]
    createMeet?: boolean
  }): Promise<Record<string, unknown>> {
    return sendJson<Record<string, unknown>>('POST', '/team-work/calendar/google/events', {
      title: body.title,
      description: body.description,
      startIso: body.start,
      endIso: body.end,
      attendeeEmails: body.attendeeEmails,
      createMeet: body.createMeet !== false,
    })
  },

  async listCeremonies(projectId?: string): Promise<TeamWorkCeremonySeries[]> {
    const q = projectId ? `?projectId=${encodeURIComponent(projectId)}` : ''
    const d = await getJson<{ ceremonies: Record<string, unknown>[] }>(`/team-work/ceremonies${q}`, false)
    return (d.ceremonies || []).map((row) => mapCeremony(row))
  },

  async createCeremony(body: {
    projectId: string
    title: string
    anchorStart: string
    durationMinutes?: number
    recurrence?: TeamWorkCeremonySeries['recurrence']
    attendeeUserIds?: string[]
    slackWebhookUrl?: string
    teamsWebhookUrl?: string
  }): Promise<TeamWorkCeremonySeries> {
    const d = await sendJson<{ ceremony: Record<string, unknown> }>('POST', '/team-work/ceremonies', body)
    return mapCeremony(d.ceremony)
  },

  async patchCeremony(
    id: string,
    body: Partial<
      Pick<
        TeamWorkCeremonySeries,
        'title' | 'anchorStart' | 'durationMinutes' | 'recurrence' | 'attendeeUserIds' | 'isActive' | 'slackWebhookUrl' | 'teamsWebhookUrl'
      >
    >,
  ): Promise<TeamWorkCeremonySeries> {
    const d = await sendJson<{ ceremony: Record<string, unknown> }>('PATCH', `/team-work/ceremonies/${id}`, body)
    return mapCeremony(d.ceremony)
  },

  async createReminder(body: {
    teamWorkItemId: string
    remindAt: string
    notifyEmail?: boolean
    notifySlack?: boolean
    notifyTeams?: boolean
  }): Promise<TeamWorkItemReminderRow> {
    const d = await sendJson<{ reminder: Record<string, unknown> }>('POST', '/team-work/reminders', body)
    return mapReminder(d.reminder)
  },

  async listRemindersForItem(itemId: string): Promise<TeamWorkItemReminderRow[]> {
    const d = await getJson<{ reminders: Record<string, unknown>[] }>(`/team-work/items/${itemId}/reminders`, false)
    return (d.reminders || []).map((row) => mapReminder(row))
  },
}
