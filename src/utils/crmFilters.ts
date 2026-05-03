import type {
  CrmActivity,
  CrmActivityStatus,
  CrmActivityType,
  CrmCompany,
  CrmContact,
  CrmDeal,
  CrmDealStage,
} from '../types/crm.types'

function includesQ(q: string, value: string | undefined) {
  if (!q.trim()) return true
  return String(value ?? '')
    .toLowerCase()
    .includes(q.trim().toLowerCase())
}

export function filterDeals(
  rows: CrmDeal[],
  q: string,
  stage: string | null | undefined
): CrmDeal[] {
  return rows.filter((d) => {
    if (
      !includesQ(q, d.name) &&
      !includesQ(q, d.notes) &&
      !includesQ(q, d.locality) &&
      !includesQ(q, d.serviceCategory) &&
      !includesQ(q, d.platformBookingId) &&
      !includesQ(q, d.platformOrderId)
    )
      return false
    if (stage && stage !== 'all' && d.stage !== (stage as CrmDealStage)) return false
    return true
  })
}

export function filterContacts(
  rows: CrmContact[],
  q: string,
  lifecycle: string | null | undefined,
  companyName: (id?: string) => string | undefined
): CrmContact[] {
  return rows.filter((c) => {
    const blob = [
      c.firstName,
      c.lastName,
      c.email,
      c.phone,
      c.jobTitle,
      c.leadSource,
      c.locality,
      c.addressLine,
      c.serviceCategory,
      c.platformUserId,
      c.platformBookingId,
      c.platformOrderId,
      companyName(c.companyId),
    ]
      .filter(Boolean)
      .join(' ')
    if (!includesQ(q, blob)) return false
    if (lifecycle && lifecycle !== 'all' && c.lifecycle !== lifecycle) return false
    return true
  })
}

export function filterCompanies(rows: CrmCompany[], q: string): CrmCompany[] {
  return rows.filter((c) => {
    const blob = [c.name, c.industry, c.city, c.country, c.website, c.phone].filter(Boolean).join(' ')
    return includesQ(q, blob)
  })
}

export function filterActivities(
  rows: CrmActivity[],
  q: string,
  type: string | null | undefined,
  status: string | null | undefined
): CrmActivity[] {
  return rows.filter((a) => {
    if (!includesQ(q, a.subject) && !includesQ(q, a.body)) return false
    if (type && type !== 'all' && a.type !== (type as CrmActivityType)) return false
    if (status && status !== 'all' && a.status !== (status as CrmActivityStatus)) return false
    return true
  })
}

export function activitiesForContact(activities: CrmActivity[], contactId: string) {
  return activities.filter((a) => a.relatedType === 'contact' && a.relatedId === contactId)
}

export function activitiesForDeal(activities: CrmActivity[], dealId: string) {
  return activities.filter((a) => a.relatedType === 'deal' && a.relatedId === dealId)
}
