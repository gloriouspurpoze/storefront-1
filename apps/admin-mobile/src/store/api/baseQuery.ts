import type { BaseQueryFn } from '@reduxjs/toolkit/query'
import type { ApiError } from '@profixer/api-client'
import { api } from '@/services/createMobileClient'

export type ApiQueryArgs = {
  url: string
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  body?: unknown
  params?: Record<string, unknown>
}

export const mobileBaseQuery: BaseQueryFn<ApiQueryArgs, unknown, ApiError> = async ({
  url,
  method = 'GET',
  body,
  params,
}) => {
  try {
    switch (method) {
      case 'GET': {
        const res = await api.get(url, { params })
        return { data: res.data }
      }
      case 'POST': {
        const res = await api.post(url, body)
        return { data: res.data }
      }
      case 'PUT': {
        const res = await api.put(url, body)
        return { data: res.data }
      }
      case 'PATCH': {
        const res = await api.patch(url, body)
        return { data: res.data }
      }
      case 'DELETE': {
        const res = await api.delete(url, { params })
        return { data: res.data }
      }
      default:
        return { error: { code: 'INTERNAL_ERROR', message: 'Unsupported method', status: 500 } }
    }
  } catch (error) {
    return { error: error as ApiError }
  }
}
