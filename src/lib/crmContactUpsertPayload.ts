import type { CrmContact } from '../types/crm.types'

export type CrmFieldPolicyMatrix = Record<string, Record<string, { read: boolean; write: boolean }>>

/** Backend field-policy entity keys (admin settings use `contact`; some APIs use `contacts`). */
function contactFieldCell(fields: CrmFieldPolicyMatrix | null, field: 'firstName' | 'lastName' | 'email') {
  return fields?.contact?.[field] ?? fields?.contacts?.[field]
}

function includeIdentityField(
  fields: CrmFieldPolicyMatrix | null,
  field: 'firstName' | 'lastName' | 'email',
  isCreate: boolean,
) {
  if (isCreate) return true
  const cell = contactFieldCell(fields, field)
  if (!cell) return true
  return cell.write === true
}

/** Block new contacts when policies explicitly deny writing an identity field. */
export function canCreateContactWithPolicies(fields: CrmFieldPolicyMatrix | null): boolean {
  const keys = ['firstName', 'lastName', 'email'] as const
  if (!keys.some((k) => contactFieldCell(fields, k))) return true
  for (const k of keys) {
    const cell = contactFieldCell(fields, k)
    if (cell && cell.write === false) return false
  }
  return true
}

export function buildCrmContactUpsertPayload(
  fields: CrmFieldPolicyMatrix | null,
  args: {
    id?: string
    firstName: string
    lastName: string
    email: string
    phone?: string
    jobTitle?: string
    companyId?: string
    recordType: CrmContact['recordType']
    lifecycle: CrmContact['lifecycle']
    leadSource?: string
    notes?: string
    locality?: string
    serviceCategory?: string
    platformUserId?: string
    platformBookingId?: string
    platformOrderId?: string
  },
): Partial<CrmContact> & ({ id: string } | { firstName: string; lastName: string; email: string }) {
  const isCreate = !args.id
  const firstName = args.firstName.trim()
  const lastName = args.lastName.trim()
  const email = args.email.trim()

  const rest: Partial<CrmContact> = {
    phone: args.phone || undefined,
    jobTitle: args.jobTitle || undefined,
    companyId: args.companyId,
    recordType: args.recordType,
    lifecycle: args.lifecycle,
    leadSource: args.leadSource || undefined,
    notes: args.notes || undefined,
    locality: args.locality || undefined,
    serviceCategory: args.serviceCategory || undefined,
    platformUserId: args.platformUserId || undefined,
    platformBookingId: args.platformBookingId || undefined,
    platformOrderId: args.platformOrderId || undefined,
  }

  if (isCreate) {
    return { ...rest, firstName, lastName, email }
  }

  const id = args.id as string
  const identity: Partial<Pick<CrmContact, 'firstName' | 'lastName' | 'email'>> = {}
  if (includeIdentityField(fields, 'firstName', false)) identity.firstName = firstName
  if (includeIdentityField(fields, 'lastName', false)) identity.lastName = lastName
  if (includeIdentityField(fields, 'email', false)) identity.email = email

  return { id, ...identity, ...rest }
}
