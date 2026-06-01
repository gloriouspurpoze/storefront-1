import { api } from './base'

/** Verification challenge Vercel surfaces (TXT records, etc.). */
export interface DomainVerificationChallenge {
  type: string
  domain: string
  value: string
  reason?: string
}

export interface DomainLiveStatus {
  hostname: string
  verified: boolean
  pendingDns: boolean
  misconfigured: boolean
  verification: DomainVerificationChallenge[]
  cnameTarget: string
}

export interface StorefrontDomain {
  id: string
  tenantId: string
  hostname: string
  isPrimary: boolean
  verified: boolean
  liveStatus?: DomainLiveStatus
  cnameTarget: string
  createdAt: string
  updatedAt: string
}

export interface StorefrontDomainsResponse {
  domains: StorefrontDomain[]
  tenant: { id: string; slug: string }
  /** Auto-provisioned subdomain (`{slug}.profixer.app`). */
  subdomain: string
  cnameTarget: string
  /** False = backend is in *manual mode* (no Vercel creds). UI hides DNS-status badges. */
  vercelConfigured: boolean
}

export const storefrontDomainsService = {
  list(tenantId: string) {
    return api.get<StorefrontDomainsResponse>(`/platform/tenants/${tenantId}/storefront-domains`, {
      showLoading: false,
      showErrorToast: false,
      showSuccessToast: false,
    })
  },

  add(tenantId: string, hostname: string, isPrimary = false) {
    return api.post<StorefrontDomain>(
      `/platform/tenants/${tenantId}/storefront-domains`,
      { hostname, isPrimary },
      { showLoading: true, showSuccessToast: true, successMessage: 'Domain added' },
    )
  },

  refresh(tenantId: string, domainId: string) {
    return api.post<StorefrontDomain>(
      `/platform/tenants/${tenantId}/storefront-domains/${domainId}/refresh`,
      undefined,
      { showLoading: false, showErrorToast: false, showSuccessToast: false },
    )
  },

  setPrimary(tenantId: string, domainId: string) {
    return api.post<StorefrontDomain>(
      `/platform/tenants/${tenantId}/storefront-domains/${domainId}/primary`,
      undefined,
      { showLoading: true, showSuccessToast: true, successMessage: 'Primary domain updated' },
    )
  },

  remove(tenantId: string, domainId: string) {
    return api.delete(`/platform/tenants/${tenantId}/storefront-domains/${domainId}`, {
      showLoading: true,
      showSuccessToast: true,
      successMessage: 'Domain removed',
    })
  },
}
