import type { CrmContact, CrmDealStage } from '../types/crm.types'
import { getProfessionalCategoryLabel } from '../constants/professionalCategories'
import { crmService } from '../services/api/crm.service'
import { DEAL_STAGE_DEFAULT_PROBABILITY } from './crmNiche'

export { DEAL_STAGE_DEFAULT_PROBABILITY }

export function normalizeCrmPhone(raw?: string | null): string {
  if (!raw) return ''
  const digits = raw.replace(/\D/g, '')
  if (digits.length >= 10) return digits.slice(-10)
  return digits
}

export function suggestDealName(serviceCategory?: string, locality?: string): string {
  const parts: string[] = []
  if (serviceCategory?.trim()) {
    const label = getProfessionalCategoryLabel(serviceCategory.trim())
    parts.push(label)
  }
  if (locality?.trim()) parts.push(locality.trim())
  return parts.join(' — ')
}

export function phonePlaceholderEmail(phone: string): string {
  const digits = normalizeCrmPhone(phone)
  return `${digits || 'unknown'}@phone.profixer.local`
}

/** Link deal to existing contact by phone, or create a minimal lead contact. */
export async function resolveDealPrimaryContact(params: {
  phone?: string
  primaryContactId?: string
  contacts: CrmContact[]
  locality?: string
  serviceCategory?: string
}): Promise<string | undefined> {
  if (params.primaryContactId) return params.primaryContactId

  const phone = normalizeCrmPhone(params.phone)
  if (phone.length < 10) return undefined

  const existing = params.contacts.find((c) => normalizeCrmPhone(c.phone) === phone)
  if (existing) return existing.id

  const created = await crmService.upsertContact({
    firstName: 'Customer',
    lastName: '—',
    email: phonePlaceholderEmail(phone),
    phone,
    lifecycle: 'inquiry',
    recordType: 'customer',
    locality: params.locality?.trim() || undefined,
    serviceCategory: params.serviceCategory?.trim() || undefined,
  })
  return created.id
}

export function applyStageDefaults(stage: CrmDealStage): { probability: number } {
  return { probability: DEAL_STAGE_DEFAULT_PROBABILITY[stage] }
}
