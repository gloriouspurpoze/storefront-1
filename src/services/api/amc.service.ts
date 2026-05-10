import { api } from './base'
import type {
  AmcContract,
  AmcContractCustomerView,
  AmcContractStatus,
  AmcCustomerListResponse,
  AmcListResponse,
  AmcPackage,
  AmcPackageListResponse,
  AmcSummary,
} from '../../types/amc.types'

const silent = { showSuccessToast: false, showLoading: false } as const

export class AmcService {
  static getSummary() {
    return api.get<AmcSummary>('/amc/summary', silent)
  }

  static listContracts(params?: {
    page?: number
    limit?: number
    status?: AmcContractStatus
    search?: string
    customerId?: string
  }) {
    const q = new URLSearchParams()
    if (params?.page) q.set('page', String(params.page))
    if (params?.limit) q.set('limit', String(params.limit))
    if (params?.status) q.set('status', params.status)
    if (params?.search?.trim()) q.set('search', params.search.trim())
    if (params?.customerId) q.set('customerId', params.customerId)
    const qs = q.toString()
    return api.get<AmcListResponse>(`/amc/contracts${qs ? `?${qs}` : ''}`, silent)
  }

  static getContract(id: string) {
    return api.get<AmcContract>(`/amc/contracts/${id}`, silent)
  }

  /** Customer JWT — sanitized contracts */
  static listMyContracts(params?: {
    page?: number
    limit?: number
    status?: AmcContractStatus
    search?: string
  }) {
    const q = new URLSearchParams()
    if (params?.page) q.set('page', String(params.page))
    if (params?.limit) q.set('limit', String(params.limit))
    if (params?.status) q.set('status', params.status)
    if (params?.search?.trim()) q.set('search', params.search.trim())
    const qs = q.toString()
    return api.get<AmcCustomerListResponse>(`/amc/me/contracts${qs ? `?${qs}` : ''}`, silent)
  }

  static getMyContract(id: string) {
    return api.get<AmcContractCustomerView>(`/amc/me/contracts/${id}`, silent)
  }

  static createContract(body: Record<string, unknown>) {
    return api.post<AmcContract>('/amc/contracts', body, {
      successMessage: 'AMC contract created.',
      loadingMessage: 'Saving…',
    })
  }

  static patchContract(id: string, body: Record<string, unknown>) {
    return api.patch<AmcContract>(`/amc/contracts/${id}`, body, {
      successMessage: 'Contract updated.',
    })
  }

  static addVisit(contractId: string, body: Record<string, unknown>) {
    return api.post<AmcContract>(`/amc/contracts/${contractId}/visits`, body, {
      successMessage: 'Visit logged.',
    })
  }

  static patchVisit(contractId: string, visitId: string, body: Record<string, unknown>) {
    return api.patch<AmcContract>(`/amc/contracts/${contractId}/visits/${visitId}`, body, {
      successMessage: 'Visit updated.',
    })
  }

  static listPackages(params?: { page?: number; limit?: number }) {
    const q = new URLSearchParams()
    if (params?.page) q.set('page', String(params.page))
    if (params?.limit) q.set('limit', String(params.limit))
    const qs = q.toString()
    return api.get<AmcPackageListResponse>(`/amc/packages${qs ? `?${qs}` : ''}`, silent)
  }

  static getPackage(id: string) {
    return api.get<AmcPackage>(`/amc/packages/${id}`, silent)
  }

  static createPackage(body: Record<string, unknown>) {
    return api.post<AmcPackage>('/amc/packages', body, {
      successMessage: 'AMC package created.',
      loadingMessage: 'Saving…',
    })
  }

  static patchPackage(id: string, body: Record<string, unknown>) {
    return api.patch<AmcPackage>(`/amc/packages/${id}`, body, {
      successMessage: 'Package updated.',
    })
  }
}
