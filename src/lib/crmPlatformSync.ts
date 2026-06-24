/**
 * Industry-standard CRM overlay: Users & Bookings are canonical identity/job state;
 * CRM contacts auto-sync from platform events (signup, booking status) without manual ID paste.
 */
import type { Booking, BookingStatus, User } from '../types'
import type { CrmContact, CrmContactLifecycle, CrmRecordType } from '../types/crm.types'
import { isLeadLifecycle } from './crmNiche'

export interface PlatformSyncPlan {
  creates: Partial<CrmContact>[]
  updates: Array<Partial<CrmContact> & { id: string }>
}

export interface PlatformSyncStats {
  created: number
  updated: number
  skipped: number
  fromUsers: number
  fromBookings: number
}

const CUSTOMER_LIFECYCLE_RANK: Record<CrmContactLifecycle, number> = {
  inquiry: 0,
  quoted: 1,
  scheduled: 2,
  in_progress: 3,
  completed: 4,
  paid: 5,
  repeat_customer: 6,
  churned: -1,
  partner_applied: 0,
  partner_verification: 1,
  partner_active: 2,
  partner_suspended: 2,
  partner_churned: -1,
}

export function normalizePhoneDigits(phone: string | undefined | null): string {
  if (!phone) return ''
  return phone.replace(/\D/g, '').slice(-10)
}

export function normalizeEmail(email: string | undefined | null): string {
  return (email ?? '').trim().toLowerCase()
}

/** Map platform registration channel → CRM lead source label. */
export function registrationSourceToLeadSource(user: Pick<User, 'registrationSource' | 'userType'>): string {
  switch (user.registrationSource) {
    case 'google_oauth':
      return 'Google sign-in'
    case 'storefront_checkout':
      return 'Storefront'
    case 'admin_invite':
      return user.userType === 'customer' ? 'Admin created' : 'Admin invite'
    case 'email':
      return 'App signup'
    default:
      if (user.userType === 'provider' || user.userType === 'professional') return 'Partner application'
      return 'App signup'
  }
}

/** Map booking channel → lead source when no user record exists yet. */
export function bookingSourceToLeadSource(source: Booking['source']): string {
  if (source === 'mobile_app') return 'Mobile app booking'
  if (source === 'web') return 'Website booking'
  return 'Booking'
}

export function bookingStatusToLifecycle(
  status: BookingStatus,
  paymentStatus?: string,
): CrmContactLifecycle | null {
  switch (status) {
    case 'pending':
      return 'inquiry'
    case 'confirmed':
    case 'scheduled':
    case 'accepted':
      return 'scheduled'
    case 'in_progress':
      return 'in_progress'
    case 'completed':
      if (paymentStatus && /paid|success|complete/i.test(paymentStatus)) return 'paid'
      return 'completed'
    case 'cancelled':
      return null
    default:
      return null
  }
}

function userTypeToRecordType(userType: User['userType']): CrmRecordType {
  if (userType === 'provider' || userType === 'professional') return 'partner'
  return 'customer'
}

function defaultLifecycleForUser(user: User): CrmContactLifecycle {
  if (user.userType === 'provider' || user.userType === 'professional') {
    return user.isVerified ? 'partner_verification' : 'partner_applied'
  }
  return 'inquiry'
}

/** Only advance lifecycle — never demote a won/active customer back to inquiry. */
export function pickAdvancedLifecycle(
  current: CrmContactLifecycle,
  suggested: CrmContactLifecycle,
): CrmContactLifecycle {
  if (current === 'churned' || current.startsWith('partner_churned')) return current
  const curRank = CUSTOMER_LIFECYCLE_RANK[current] ?? 0
  const sugRank = CUSTOMER_LIFECYCLE_RANK[suggested] ?? 0
  if (sugRank <= curRank) return current
  return suggested
}

export function findMatchingContact(
  contacts: CrmContact[],
  keys: { platformUserId?: string; email?: string; phone?: string },
): CrmContact | undefined {
  const uid = keys.platformUserId?.trim()
  if (uid) {
    const byUid = contacts.find((c) => c.platformUserId?.trim() === uid)
    if (byUid) return byUid
  }
  const email = normalizeEmail(keys.email)
  if (email) {
    const byEmail = contacts.find((c) => normalizeEmail(c.email) === email)
    if (byEmail) return byEmail
  }
  const phone = normalizePhoneDigits(keys.phone)
  if (phone.length >= 10) {
    const byPhone = contacts.find((c) => normalizePhoneDigits(c.phone) === phone)
    if (byPhone) return byPhone
  }
  return undefined
}

function contactFromUser(user: User, existing?: CrmContact): Partial<CrmContact> {
  const recordType = userTypeToRecordType(user.userType)
  const lifecycle = existing
    ? pickAdvancedLifecycle(existing.lifecycle, defaultLifecycleForUser(user))
    : defaultLifecycleForUser(user)

  return {
    ...(existing?.id ? { id: existing.id } : {}),
    firstName: user.firstName?.trim() || 'Customer',
    lastName: user.lastName?.trim() || '—',
    email: user.email,
    phone: user.phone || existing?.phone,
    recordType,
    lifecycle,
    leadSource: existing?.leadSource || registrationSourceToLeadSource(user),
    platformUserId: user.id,
  }
}

function applyBookingToContact(
  booking: Booking,
  existing: CrmContact | undefined,
  user?: User,
): Partial<CrmContact> | null {
  const bookingId = String(booking.id ?? booking._id ?? '').trim()
  if (!bookingId) return null

  const customerId = booking.customerId?.trim()
  const email = user?.email ?? undefined
  const phone =
    user?.phone ??
    booking.customerPhone ??
    booking.customer?.phone ??
    booking.address?.phone

  const match =
    existing ??
    findMatchingContact([], {
      platformUserId: customerId,
      email,
      phone,
    })

  const firstName =
    user?.firstName ??
    booking.customer?.firstName ??
    (booking.customerName?.split(/\s+/)[0] || 'Customer')
  const lastName =
    user?.lastName ??
    booking.customer?.lastName ??
    (booking.customerName?.split(/\s+/).slice(1).join(' ') || '')

  const suggestedLifecycle = bookingStatusToLifecycle(booking.status, booking.paymentStatus)
  const baseLifecycle = match?.lifecycle ?? 'inquiry'
  const lifecycle = suggestedLifecycle
    ? pickAdvancedLifecycle(baseLifecycle, suggestedLifecycle)
    : baseLifecycle

  const locality =
    booking.city ??
    booking.address?.city ??
    booking.address?.area ??
    match?.locality

  const serviceCategory =
    booking.category ?? booking.serviceName ?? match?.serviceCategory

  const leadSource =
    match?.leadSource ??
    (user ? registrationSourceToLeadSource(user) : bookingSourceToLeadSource(booking.source))

  const payload: Partial<CrmContact> = {
    ...(match?.id ? { id: match.id } : {}),
    firstName: match?.firstName || firstName,
    lastName: match?.lastName || lastName,
    email: match?.email || user?.email || '',
    phone: phone || match?.phone,
    recordType: match?.recordType ?? 'customer',
    lifecycle,
    leadSource,
    platformUserId: customerId || match?.platformUserId || user?.id,
    platformBookingId: bookingId,
    locality,
    serviceCategory,
  }

  if (!payload.email?.trim()) return null
  if (!payload.firstName?.trim()) payload.firstName = 'Customer'
  if (!payload.lastName?.trim()) payload.lastName = '—'

  return payload
}

/** Build create/update plan from platform Users + Bookings against existing CRM contacts. */
export function buildPlatformSyncPlan(
  users: User[],
  bookings: Booking[],
  contacts: CrmContact[],
): PlatformSyncPlan {
  const creates: Partial<CrmContact>[] = []
  const updates: Array<Partial<CrmContact> & { id: string }> = []
  const touchedIds = new Set<string>()

  const userById = new Map(users.map((u) => [u.id, u]))
  let workingContacts = [...contacts]

  const upsertInPlan = (partial: Partial<CrmContact>) => {
    if (!partial.firstName?.trim()) partial.firstName = 'Customer'
    if (!partial.lastName?.trim()) partial.lastName = '—'

    if (partial.id) {
      if (touchedIds.has(partial.id)) {
        const idx = updates.findIndex((u) => u.id === partial.id)
        if (idx >= 0) {
          updates[idx] = { ...updates[idx], ...partial, id: partial.id }
        }
      } else {
        touchedIds.add(partial.id)
        updates.push(partial as Partial<CrmContact> & { id: string })
      }
      workingContacts = workingContacts.map((c) =>
        c.id === partial.id ? ({ ...c, ...partial } as CrmContact) : c,
      )
      return
    }

    const email = partial.email?.trim()
    if (!email) return

    const match = findMatchingContact(workingContacts, {
      platformUserId: partial.platformUserId,
      email: partial.email,
      phone: partial.phone,
    })

    if (match) {
      upsertInPlan({ ...partial, id: match.id })
      return
    }

    creates.push(partial)
    const tempId = `temp-${creates.length}`
    workingContacts.push({
      ...(partial as CrmContact),
      id: tempId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
  }

  // 1) Customer & partner directory → leads / contacts
  for (const user of users) {
    if (user.userType === 'admin' || user.userType === 'super_admin') continue
    if (user.isDashboardMember === true) continue
    if (!user.email?.trim()) continue

    const existing = findMatchingContact(workingContacts, {
      platformUserId: user.id,
      email: user.email,
      phone: user.phone,
    })

    const partial = contactFromUser(user, existing)
    if (existing) {
      upsertInPlan({ ...partial, id: existing.id })
    } else if (user.userType === 'customer' || user.userType === 'provider' || user.userType === 'professional') {
      upsertInPlan(partial)
    }
  }

  // 2) Bookings → advance lifecycle + link booking id (most recent booking wins per customer)
  const bookingsByCustomer = new Map<string, Booking>()
  for (const booking of bookings) {
    const cid = booking.customerId?.trim()
    const key = cid || normalizeEmail(booking.customerPhone) || booking.customerName || bookingId(booking)
    const prev = bookingsByCustomer.get(key)
    if (!prev || new Date(booking.updatedAt ?? booking.createdAt) > new Date(prev.updatedAt ?? prev.createdAt)) {
      bookingsByCustomer.set(key, booking)
    }
  }

  for (const booking of bookingsByCustomer.values()) {
    const user = booking.customerId ? userById.get(booking.customerId) : undefined
    const existing = findMatchingContact(workingContacts, {
      platformUserId: booking.customerId,
      email: user?.email,
      phone: user?.phone ?? booking.customerPhone,
    })

    const partial = applyBookingToContact(booking, existing, user)
    if (!partial) continue
    upsertInPlan(partial)
  }

  return { creates, updates }
}

function bookingId(booking: Booking): string {
  return String(booking.id ?? booking._id ?? '').trim()
}

/** Index contacts by platform user id for quick CRM deep links from Users / Bookings. */
export function indexContactsByPlatformUser(contacts: CrmContact[]): Map<string, CrmContact> {
  const map = new Map<string, CrmContact>()
  for (const c of contacts) {
    const uid = c.platformUserId?.trim()
    if (uid) map.set(uid, c)
  }
  return map
}

/** CRM path for a lead/contact row (leads vs post-conversion contacts). */
export function adminPathToCrmContact(contact: Pick<CrmContact, 'id' | 'lifecycle'>): string {
  const base = isLeadLifecycle(contact.lifecycle) ? '/crm/leads' : '/crm/contacts'
  return `${base}?highlight=${encodeURIComponent(contact.id)}`
}

export function adminPathToCrmForUser(
  userId: string,
  contacts: CrmContact[],
): string | null {
  const contact = indexContactsByPlatformUser(contacts).get(userId)
  if (!contact) return null
  return adminPathToCrmContact(contact)
}

export function adminPathToCrmForBooking(
  booking: Pick<Booking, 'customerId' | 'id' | '_id'>,
  contacts: CrmContact[],
): string | null {
  const cid = booking.customerId?.trim()
  if (cid) {
    const byUser = adminPathToCrmForUser(cid, contacts)
    if (byUser) return byUser
  }
  const bookingId = String(booking.id ?? booking._id ?? '').trim()
  const byBooking = contacts.find((c) => c.platformBookingId?.trim() === bookingId)
  if (byBooking) return adminPathToCrmContact(byBooking)
  return null
}
