import { api } from './base'

export interface PlatformTenantRow {
  _id: string
  name: string
  slug: string
  /** Industry vertical pack (`home_services`, `restaurant`, …). */
  verticalKey?: string
  isActive: boolean
  suspendedAt?: string
  suspensionReason?: string
  billingProvider?: string
  billingStatus?: string
  stripeCustomerId?: string
  stripeSubscriptionId?: string
  planKey?: string
  /** Explicit allowlist for gated API modules; omit/null = full access. */
  featureModules?: string[]
  ssoProvider?: string
  samlMetadataUrl?: string
  createdAt?: string
  updatedAt?: string
}

export interface IsolationSummary {
  users: number
  domains: number
  marketingCampaigns: number
  marketingCalendarEntries: number
  marketingSocialPosts: number
  teamWorkProjects: number
}

export const platformTenantsService = {
  get(id: string) {
    return api.get<PlatformTenantRow>(`/platform/tenants/${id}`, { showLoading: false })
  },

  list(page = 1, limit = 50) {
    return api.get<{ tenants: PlatformTenantRow[]; total: number; page: number; limit: number }>(
      '/platform/tenants',
      {
        params: { page, limit },
        showLoading: true,
        showErrorToast: true,
      },
    )
  },

  create(body: {
    name: string
    slug: string
    planKey?: string
    ownerEmail?: string
    verticalKey?: string
  }) {
    return api.post<{ tenant: PlatformTenantRow; ownerAttached: boolean; message?: string }>(
      '/platform/tenants',
      body,
      { showLoading: true, showSuccessToast: true, successMessage: 'Tenant created' },
    )
  },

  update(
    id: string,
    body: Partial<{
      name: string
      isActive: boolean
      planKey: string
      suspended: boolean
      suspensionReason: string
      stripeCustomerId: string
      stripeSubscriptionId: string
      billingStatus: string
      billingProvider: string
      ssoProvider: string
      samlMetadataUrl: string
      /** `null` clears allowlist (full access). */
      featureModules: string[] | null
      verticalKey?: string
    }>,
  ) {
    return api.patch<{ tenant: PlatformTenantRow }>(`/platform/tenants/${id}`, body, {
      showLoading: true,
      showSuccessToast: true,
      successMessage: 'Tenant updated',
    })
  },

  isolationSummary(id: string) {
    return api.get<IsolationSummary>(`/platform/tenants/${id}/isolation-summary`, {
      showLoading: true,
    })
  },

  attachUser(id: string, email: string) {
    return api.post(`/platform/tenants/${id}/users`, { email }, {
      showLoading: true,
      showSuccessToast: true,
      successMessage: 'User attached — they must sign in again for JWT tenant claims',
    })
  },

  addDomain(id: string, hostname: string, isPrimary?: boolean) {
    return api.post(`/platform/tenants/${id}/domains`, { hostname, isPrimary }, {
      showLoading: true,
      showSuccessToast: true,
      successMessage: 'Domain added (verify via your DNS/workflow)',
    })
  },

  listDomains(id: string) {
    return api.get<unknown[]>(`/platform/tenants/${id}/domains`, { showLoading: false })
  },

  removeDomain(tenantId: string, domainId: string) {
    return api.delete(`/platform/tenants/${tenantId}/domains/${domainId}`, {
      showLoading: true,
      showSuccessToast: true,
      successMessage: 'Domain removed',
    })
  },
}
