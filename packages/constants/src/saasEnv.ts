/**
 * SaaS / multi-tenant configuration — works for CRA (REACT_APP_*) and Expo (EXPO_PUBLIC_*).
 */

export type SaasEnvConfig = {
  saasMode: boolean
  tenantHeader: string
  defaultTenantId: string | null
  billingPortalUrl: string | null
  legalPrivacyUrl: string | null
  legalTermsUrl: string | null
  legalComplianceDocsUrl: string | null
}

function readEnv(key: string): string | undefined {
  if (typeof process !== 'undefined' && process.env?.[key]) {
    return process.env[key]
  }
  return undefined
}

function readBool(...keys: string[]): boolean {
  for (const key of keys) {
    const v = readEnv(key)
    if (v === 'true') return true
    if (v === 'false') return false
  }
  return false
}

function readTrimmed(...keys: string[]): string | null {
  for (const key of keys) {
    const raw = readEnv(key)
    if (raw && String(raw).trim()) return String(raw).trim()
  }
  return null
}

/** Build-time SaaS flags from environment variables. */
export function createSaasEnv(): SaasEnvConfig {
  return {
    saasMode: readBool('REACT_APP_SAAS_MODE', 'EXPO_PUBLIC_SAAS_MODE'),
    tenantHeader:
      readTrimmed('REACT_APP_TENANT_HEADER', 'EXPO_PUBLIC_TENANT_HEADER') ?? 'X-Tenant-Id',
    defaultTenantId: readTrimmed('REACT_APP_DEFAULT_TENANT_ID', 'EXPO_PUBLIC_DEFAULT_TENANT_ID'),
    billingPortalUrl: readTrimmed('REACT_APP_BILLING_PORTAL_URL', 'EXPO_PUBLIC_BILLING_PORTAL_URL'),
    legalPrivacyUrl: readTrimmed('REACT_APP_LEGAL_PRIVACY_URL', 'EXPO_PUBLIC_LEGAL_PRIVACY_URL'),
    legalTermsUrl: readTrimmed('REACT_APP_LEGAL_TERMS_URL', 'EXPO_PUBLIC_LEGAL_TERMS_URL'),
    legalComplianceDocsUrl: readTrimmed(
      'REACT_APP_LEGAL_COMPLIANCE_DOCS_URL',
      'EXPO_PUBLIC_LEGAL_COMPLIANCE_DOCS_URL',
    ),
  }
}

const env = createSaasEnv()

export const SAAS_MODE = env.saasMode
export const TENANT_HEADER = env.tenantHeader

export function getDefaultTenantIdFromEnv(): string | null {
  return env.defaultTenantId
}

export function getBillingPortalUrl(): string | null {
  return env.billingPortalUrl
}

export function getLegalPrivacyUrl(): string | null {
  return env.legalPrivacyUrl
}

export function getLegalTermsUrl(): string | null {
  return env.legalTermsUrl
}

export function getLegalComplianceDocsUrl(): string | null {
  return env.legalComplianceDocsUrl
}
