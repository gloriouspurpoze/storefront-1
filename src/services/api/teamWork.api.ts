/**
 * Team work REST client — fixer-backend `/api/team-work/*`.
 */
import { apiClient } from '../apiClient'
import type { TeamWorkComment, TeamWorkItem, TeamWorkListResponse, TeamWorkMeta } from '../../types/teamWork.types'

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

function mapItem(raw: Record<string, unknown>): TeamWorkItem {
  const commentsRaw = raw.comments as Record<string, unknown>[] | undefined
  return {
    id: String(raw.id || raw._id || ''),
    issueKey: String(raw.issueKey || ''),
    issueNumber: Number(raw.issueNumber ?? 0),
    title: String(raw.title || ''),
    description: raw.description ? String(raw.description) : undefined,
    status: raw.status as TeamWorkItem['status'],
    priority: raw.priority as TeamWorkItem['priority'],
    issueType: raw.issueType as TeamWorkItem['issueType'],
    teamKey: String(raw.teamKey || 'operations'),
    assigneeUserId: raw.assigneeUserId ? String(raw.assigneeUserId) : undefined,
    reporterUserId: String(raw.reporterUserId || ''),
    labels: Array.isArray(raw.labels) ? (raw.labels as unknown[]).map((x) => String(x)) : [],
    dueAt: raw.dueAt ? new Date(raw.dueAt as string).toISOString() : undefined,
    epicId: raw.epicId ? String(raw.epicId) : undefined,
    storyPoints: raw.storyPoints !== undefined && raw.storyPoints !== null ? Number(raw.storyPoints) : undefined,
    boardRank: Number(raw.boardRank ?? 0),
    comments: commentsRaw?.length ? commentsRaw.map((c) => mapComment(c)) : undefined,
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
        | 'title'
        | 'description'
        | 'status'
        | 'priority'
        | 'issueType'
        | 'teamKey'
        | 'assigneeUserId'
        | 'labels'
        | 'dueAt'
        | 'epicId'
        | 'storyPoints'
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
}
