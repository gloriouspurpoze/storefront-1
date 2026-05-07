import { api } from './base'

export type BoardRole = 'owner' | 'editor' | 'viewer'

export type BoardSummary = {
  id: string
  title: string
  updatedAt?: string
  createdAt?: string
  role: BoardRole
}

export type BoardDetail = {
  id: string
  title: string
  state: any
  memberRole: BoardRole
}

type ApiResponse<T> = { success: boolean; data?: T; message?: string }

/** No global loading overlay or success toast — boards UI handles its own feedback (autosave must not flash the app loader). */
const quiet = { showSuccessToast: false, showLoading: false }

export const BoardsService = {
  async list(): Promise<ApiResponse<BoardSummary[]>> {
    return api.get('/boards', quiet) as Promise<ApiResponse<BoardSummary[]>>
  },

  async create(title: string): Promise<ApiResponse<{ id: string; title: string }>> {
    return api.post('/boards', { title }, quiet) as Promise<ApiResponse<{ id: string; title: string }>>
  },

  async getOne(id: string): Promise<ApiResponse<BoardDetail>> {
    return api.get(`/boards/${id}`, quiet) as Promise<ApiResponse<BoardDetail>>
  },

  async saveState(id: string, state: any): Promise<ApiResponse<void>> {
    return api.put(`/boards/${id}/state`, { state }, quiet) as Promise<ApiResponse<void>>
  },

  async update(id: string, payload: { title: string }): Promise<ApiResponse<{ id: string; title: string }>> {
    return api.patch(`/boards/${id}`, payload, quiet) as Promise<ApiResponse<{ id: string; title: string }>>
  },

  async remove(id: string): Promise<ApiResponse<void>> {
    return api.delete(`/boards/${id}`, quiet) as Promise<ApiResponse<void>>
  },

  async listMembers(id: string): Promise<ApiResponse<any[]>> {
    return api.get(`/boards/${id}/members`, quiet) as Promise<ApiResponse<any[]>>
  },

  async invite(id: string, email: string, role: 'editor' | 'viewer' = 'editor'): Promise<ApiResponse<any>> {
    return api.post(`/boards/${id}/invites`, { email, role }, quiet) as Promise<ApiResponse<any>>
  },

  async acceptInvite(token: string): Promise<ApiResponse<{ boardId: string }>> {
    return api.post(`/boards/invites/${token}/accept`, undefined, quiet) as Promise<
      ApiResponse<{ boardId: string }>
    >
  },

  async history(id: string): Promise<ApiResponse<any[]>> {
    return api.get(`/boards/${id}/history`, quiet) as Promise<ApiResponse<any[]>>
  },

  async restore(id: string, snapshotId: string): Promise<ApiResponse<void>> {
    return api.post(`/boards/${id}/history/${snapshotId}/restore`, undefined, quiet) as Promise<ApiResponse<void>>
  },

  async uploadAsset(id: string, file: File): Promise<ApiResponse<{ src: string }>> {
    const fd = new FormData()
    fd.append('file', file)
    // Do not set Content-Type — fetch must send multipart with boundary.
    return api.post(`/boards/${id}/assets`, fd, quiet) as Promise<ApiResponse<{ src: string }>>
  },
}
