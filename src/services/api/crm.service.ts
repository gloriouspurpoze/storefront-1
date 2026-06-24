/**
 * CRM data layer: fixer-backend `/api/crm/*` (MongoDB) in production and whenever
 * REACT_APP_CRM_USE_API=true. Optional browser localStorage fallback only in development
 * when that flag is not set — see `src/lib/crmNiche.ts` for niche types.
 */
import type {
  CrmActivity,
  CrmCompany,
  CrmContact,
  CrmDeal,
  CrmDealStage,
  CrmMetrics,
} from '../../types/crm.types'
import {
  coerceCrmMetrics,
  DEAL_PIPELINE_STAGES,
  isLeadLifecycle,
  migrateActivityType,
  migrateContactLifecycle,
  migrateDealStage,
  normalizeRecordType,
  type CrmMetricsApiShape,
} from '../../lib/crmNiche'
import {
  buildPlatformSyncPlan,
  type PlatformSyncStats,
} from '../../lib/crmPlatformSync'
import type { Booking, User } from '../../types'
import { crmApi } from './crm.api'

/** Production builds always use the CRM API. In development, set REACT_APP_CRM_USE_API=true (recommended). */
export function isCrmApiMode(): boolean {
  if (process.env.NODE_ENV === 'production') return true
  return process.env.REACT_APP_CRM_USE_API === 'true'
}

const STORAGE_KEY = 'fixer_admin_crm_v1'

interface CrmState {
  companies: CrmCompany[]
  contacts: CrmContact[]
  deals: CrmDeal[]
  activities: CrmActivity[]
}

function nowIso() {
  return new Date().toISOString()
}

function uid() {
  return crypto.randomUUID()
}

function migrateState(s: CrmState): CrmState {
  return {
    companies: s.companies ?? [],
    contacts: (s.contacts ?? []).map((c) => ({
      ...c,
      lifecycle: migrateContactLifecycle(c.lifecycle as unknown as string),
      recordType: normalizeRecordType(c.recordType as string | undefined),
    })),
    deals: (s.deals ?? []).map((d) => ({
      ...d,
      stage: migrateDealStage(d.stage as unknown as string),
    })),
    activities: (s.activities ?? []).map((a) => ({
      ...a,
      type: migrateActivityType(a.type as unknown as string),
    })),
  }
}

function seedState(): CrmState {
  const t = nowIso()
  const society: CrmCompany = {
    id: uid(),
    name: 'Sunrise Heights CHS (B2B)',
    industry: 'Residential society / AMC',
    website: 'https://profixer.in',
    phone: '+91-22-0000-0000',
    city: 'Mira Road',
    country: 'India',
    employeeCount: 'Office staff 5–10',
    annualRevenue: 'Maintenance fund',
    createdAt: t,
    updatedAt: t,
  }
  const builder: CrmCompany = {
    id: uid(),
    name: 'Metro Infra Developers',
    industry: 'Construction',
    website: 'https://example.com',
    city: 'Thane',
    country: 'India',
    createdAt: t,
    updatedAt: t,
  }
  const homeowner: CrmContact = {
    id: uid(),
    recordType: 'customer',
    firstName: 'Priya',
    lastName: 'Nair',
    email: 'priya.nair.example@profixer.in',
    phone: '+91-99200-25516',
    locality: 'Mira Road',
    addressLine: 'Near Dahisar check naka',
    serviceCategory: 'AC repair',
    lifecycle: 'quoted',
    leadSource: 'WhatsApp',
    createdAt: t,
    updatedAt: t,
  }
  const partnerLead: CrmContact = {
    id: uid(),
    recordType: 'partner',
    firstName: 'Rahul',
    lastName: 'Electrician',
    email: 'rahul.spark.example@profixer.in',
    phone: '+91-90000-00001',
    locality: 'Borivali',
    lifecycle: 'partner_verification',
    leadSource: 'Referral',
    notes: 'Background check pending',
    createdAt: t,
    updatedAt: t,
  }
  const d1: CrmDeal = {
    id: uid(),
    name: 'Split AC service — 2 units',
    amount: 4500,
    currency: 'INR',
    stage: 'quoted',
    probability: 50,
    primaryContactId: homeowner.id,
    locality: 'Mira Road',
    serviceCategory: 'AC repair',
    expectedCloseDate: new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10),
    createdAt: t,
    updatedAt: t,
  }
  const d2: CrmDeal = {
    id: uid(),
    name: 'Society AMC — quarterly electrical audit',
    amount: 185000,
    currency: 'INR',
    stage: 'in_progress',
    probability: 75,
    companyId: society.id,
    locality: 'Mira Road',
    serviceCategory: 'Electrical',
    expectedCloseDate: new Date(Date.now() + 21 * 86400000).toISOString().slice(0, 10),
    createdAt: t,
    updatedAt: t,
  }
  const activities: CrmActivity[] = [
    {
      id: uid(),
      subject: 'WhatsApp — send quote for AC gas refill',
      type: 'whatsapp',
      status: 'open',
      priority: 'high',
      dueAt: new Date(Date.now() + 86400000).toISOString(),
      relatedType: 'deal',
      relatedId: d1.id,
      createdAt: t,
      updatedAt: t,
    },
    {
      id: uid(),
      subject: 'Follow-up call after site visit',
      type: 'call',
      status: 'open',
      priority: 'normal',
      dueAt: new Date(Date.now() - 86400000).toISOString(),
      relatedType: 'deal',
      relatedId: d2.id,
      createdAt: t,
      updatedAt: t,
    },
    {
      id: uid(),
      subject: 'Site visit — distribution panel inspection',
      type: 'site_visit',
      status: 'done',
      priority: 'normal',
      completedAt: t,
      relatedType: 'contact',
      relatedId: homeowner.id,
      createdAt: t,
      updatedAt: t,
    },
  ]
  return {
    companies: [society, builder],
    contacts: [homeowner, partnerLead],
    deals: [d1, d2],
    activities,
  }
}

function read(): CrmState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      const s = seedState()
      localStorage.setItem(STORAGE_KEY, JSON.stringify(s))
      return s
    }
    return migrateState(JSON.parse(raw) as CrmState)
  } catch {
    const s = seedState()
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s))
    return s
  }
}

function write(s: CrmState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(s))
}

export function computeMetrics(state: CrmState): CrmMetrics {
  const openDeals = state.deals.filter((d) => d.stage !== 'paid' && d.stage !== 'lost')
  const pipelineValue = openDeals.reduce((a, d) => a + d.amount, 0)
  const weightedPipeline = openDeals.reduce((a, d) => a + d.amount * (d.probability / 100), 0)
  const start = new Date()
  start.setDate(1)
  start.setHours(0, 0, 0, 0)
  const paidThisMonth = state.deals.filter(
    (d) => d.stage === 'paid' && new Date(d.updatedAt) >= start
  ).length
  const activeLeads = state.contacts.filter((c) => isLeadLifecycle(c.lifecycle)).length
  const now = Date.now()
  const overdueTasks = state.activities.filter(
    (a) =>
      a.status === 'open' &&
      a.type === 'task' &&
      a.dueAt &&
      new Date(a.dueAt).getTime() < now
  ).length
  const dealsByStage = DEAL_PIPELINE_STAGES.reduce(
    (acc, st) => {
      acc[st] = state.deals.filter((d) => d.stage === st).length
      return acc
    },
    {} as Record<CrmDealStage, number>
  )
  return {
    pipelineValue,
    weightedPipeline,
    openDeals: openDeals.length,
    paidThisMonth,
    activeLeads,
    overdueTasks,
    dealsByStage,
  }
}

const localStore = {
  getState(): CrmState {
    return read()
  },

  resetDemoData() {
    const s = seedState()
    write(s)
    return s
  },

  getMetrics(): CrmMetrics {
    return computeMetrics(read())
  },

  listCompanies() {
    return read().companies
  },
  getCompany(id: string) {
    return read().companies.find((c) => c.id === id)
  },
  upsertCompany(partial: Partial<CrmCompany> & { name: string }) {
    const s = read()
    const id = partial.id ?? uid()
    const existing = s.companies.find((c) => c.id === id)
    const row: CrmCompany = {
      id,
      name: partial.name,
      industry: partial.industry,
      website: partial.website,
      phone: partial.phone,
      city: partial.city,
      country: partial.country,
      employeeCount: partial.employeeCount,
      annualRevenue: partial.annualRevenue,
      ownerId: partial.ownerId,
      notes: partial.notes,
      createdAt: existing?.createdAt ?? nowIso(),
      updatedAt: nowIso(),
    }
    s.companies = existing ? s.companies.map((c) => (c.id === id ? row : c)) : [...s.companies, row]
    write(s)
    return row
  },
  deleteCompany(id: string) {
    const s = read()
    s.companies = s.companies.filter((c) => c.id !== id)
    s.contacts = s.contacts.map((c) => (c.companyId === id ? { ...c, companyId: undefined } : c))
    s.deals = s.deals.map((d) => (d.companyId === id ? { ...d, companyId: undefined } : d))
    write(s)
  },

  listContacts() {
    return read().contacts
  },
  upsertContact(partial: Partial<CrmContact>) {
    const s = read()
    const id = partial.id ?? uid()
    const existing = s.contacts.find((c) => c.id === id)
    const row: CrmContact = {
      id,
      recordType: partial.recordType ?? existing?.recordType ?? 'customer',
      firstName: (partial.firstName ?? existing?.firstName ?? 'Customer').trim() || 'Customer',
      lastName: (partial.lastName ?? existing?.lastName ?? '—').trim() || '—',
      email: partial.email ?? existing?.email ?? '',
      phone: partial.phone,
      jobTitle: partial.jobTitle,
      companyId: partial.companyId,
      lifecycle: partial.lifecycle ?? existing?.lifecycle ?? 'inquiry',
      leadSource: partial.leadSource,
      ownerId: partial.ownerId,
      tags: partial.tags,
      notes: partial.notes,
      platformUserId: partial.platformUserId ?? existing?.platformUserId,
      platformBookingId: partial.platformBookingId ?? existing?.platformBookingId,
      platformOrderId: partial.platformOrderId ?? existing?.platformOrderId,
      locality: partial.locality ?? existing?.locality,
      addressLine: partial.addressLine ?? existing?.addressLine,
      serviceCategory: partial.serviceCategory ?? existing?.serviceCategory,
      createdAt: existing?.createdAt ?? nowIso(),
      updatedAt: nowIso(),
    }
    s.contacts = existing ? s.contacts.map((c) => (c.id === id ? row : c)) : [...s.contacts, row]
    write(s)
    return row
  },
  deleteContact(id: string) {
    const s = read()
    s.contacts = s.contacts.filter((c) => c.id !== id)
    s.deals = s.deals.map((d) => (d.primaryContactId === id ? { ...d, primaryContactId: undefined } : d))
    write(s)
  },

  listDeals() {
    return read().deals
  },
  upsertDeal(
    partial: Partial<CrmDeal> & { name: string; amount: number; currency: string; stage: CrmDealStage }
  ) {
    const s = read()
    const id = partial.id ?? uid()
    const existing = s.deals.find((d) => d.id === id)
    const row: CrmDeal = {
      id,
      name: partial.name,
      amount: partial.amount,
      currency: partial.currency,
      stage: partial.stage,
      probability: partial.probability ?? existing?.probability ?? 10,
      companyId: partial.companyId ?? existing?.companyId,
      primaryContactId: partial.primaryContactId ?? existing?.primaryContactId,
      ownerId: partial.ownerId ?? existing?.ownerId,
      expectedCloseDate: partial.expectedCloseDate ?? existing?.expectedCloseDate,
      notes: partial.notes ?? existing?.notes,
      platformBookingId: partial.platformBookingId ?? existing?.platformBookingId,
      platformOrderId: partial.platformOrderId ?? existing?.platformOrderId,
      locality: partial.locality ?? existing?.locality,
      serviceCategory: partial.serviceCategory ?? existing?.serviceCategory,
      phone: partial.phone ?? existing?.phone,
      createdAt: existing?.createdAt ?? nowIso(),
      updatedAt: nowIso(),
    }
    s.deals = existing ? s.deals.map((d) => (d.id === id ? row : d)) : [...s.deals, row]
    write(s)
    return row
  },
  deleteDeal(id: string) {
    const s = read()
    s.deals = s.deals.filter((d) => d.id !== id)
    write(s)
  },

  listActivities() {
    return read().activities
  },
  upsertActivity(
    partial: Partial<CrmActivity> & { subject: string; type: CrmActivity['type']; status: CrmActivity['status'] }
  ) {
    const s = read()
    const id = partial.id ?? uid()
    const existing = s.activities.find((a) => a.id === id)
    const row: CrmActivity = {
      id,
      subject: partial.subject,
      type: partial.type,
      status: partial.status,
      priority: partial.priority ?? 'normal',
      dueAt: partial.dueAt,
      completedAt: partial.completedAt,
      relatedType: partial.relatedType,
      relatedId: partial.relatedId,
      ownerId: partial.ownerId,
      body: partial.body,
      createdAt: existing?.createdAt ?? nowIso(),
      updatedAt: nowIso(),
    }
    s.activities = existing ? s.activities.map((a) => (a.id === id ? row : a)) : [...s.activities, row]
    write(s)
    return row
  },
  deleteActivity(id: string) {
    const s = read()
    s.activities = s.activities.filter((a) => a.id !== id)
    write(s)
  },
}

export const crmService = {
  isApiEnabled(): boolean {
    return isCrmApiMode()
  },

  /** Local demo state only; empty when API mode. */
  getState(): CrmState {
    if (isCrmApiMode()) {
      return { companies: [], contacts: [], deals: [], activities: [] }
    }
    return localStore.getState()
  },

  async resetDemoData(): Promise<void> {
    if (isCrmApiMode()) {
      return
    }
    localStore.resetDemoData()
  },

  async getMetrics(): Promise<CrmMetrics> {
    if (isCrmApiMode()) {
      const raw = await crmApi.getMetrics()
      return coerceCrmMetrics(raw as CrmMetricsApiShape)
    }
    return localStore.getMetrics()
  },

  async listCompanies(): Promise<CrmCompany[]> {
    if (isCrmApiMode()) return crmApi.listCompanies()
    return localStore.listCompanies()
  },
  getCompany(id: string) {
    return localStore.getCompany(id)
  },
  async upsertCompany(partial: Partial<CrmCompany> & { name: string }): Promise<CrmCompany> {
    if (isCrmApiMode()) return crmApi.upsertCompany(partial)
    return localStore.upsertCompany(partial)
  },
  async deleteCompany(id: string): Promise<void> {
    if (isCrmApiMode()) return crmApi.deleteCompany(id)
    localStore.deleteCompany(id)
  },

  async listContacts(): Promise<CrmContact[]> {
    if (isCrmApiMode()) {
      const rows = await crmApi.listContacts()
      return rows.map((c) => ({
        ...c,
        lifecycle: migrateContactLifecycle(c.lifecycle as unknown as string),
        recordType: normalizeRecordType(c.recordType as string | undefined),
      }))
    }
    return localStore.listContacts()
  },
  async upsertContact(
    partial:
      | (Partial<CrmContact> & { id: string })
      | (Partial<CrmContact> & { firstName: string; lastName: string; email: string }),
  ): Promise<CrmContact> {
    if (isCrmApiMode()) return crmApi.upsertContact(partial)
    return localStore.upsertContact(partial)
  },
  async deleteContact(id: string): Promise<void> {
    if (isCrmApiMode()) return crmApi.deleteContact(id)
    localStore.deleteContact(id)
  },

  async listDeals(): Promise<CrmDeal[]> {
    if (isCrmApiMode()) {
      const rows = await crmApi.listDeals()
      return rows.map((d) => ({
        ...d,
        stage: migrateDealStage(d.stage as unknown as string),
      }))
    }
    return localStore.listDeals()
  },
  async upsertDeal(
    partial: Partial<CrmDeal> & { name: string; amount: number; currency: string; stage: CrmDealStage }
  ): Promise<CrmDeal> {
    if (isCrmApiMode()) return crmApi.upsertDeal(partial)
    return localStore.upsertDeal(partial)
  },
  async deleteDeal(id: string): Promise<void> {
    if (isCrmApiMode()) return crmApi.deleteDeal(id)
    localStore.deleteDeal(id)
  },

  async listActivities(): Promise<CrmActivity[]> {
    if (isCrmApiMode()) {
      const rows = await crmApi.listActivities()
      return rows.map((a) => ({
        ...a,
        type: migrateActivityType(a.type as unknown as string),
      }))
    }
    return localStore.listActivities()
  },
  async upsertActivity(
    partial: Partial<CrmActivity> & { subject: string; type: CrmActivity['type']; status: CrmActivity['status'] }
  ): Promise<CrmActivity> {
    if (isCrmApiMode()) return crmApi.upsertActivity(partial)
    return localStore.upsertActivity(partial)
  },
  async deleteActivity(id: string): Promise<void> {
    if (isCrmApiMode()) return crmApi.deleteActivity(id)
    localStore.deleteActivity(id)
  },

  async downloadExport(entity: 'contacts' | 'companies' | 'deals' | 'activities'): Promise<void> {
    if (isCrmApiMode()) return crmApi.downloadExport(entity)
    const esc = (v: unknown) => {
      const s = v === null || v === undefined ? '' : String(v)
      if (/[",\r\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`
      return s
    }
    const state = read()
    let rows: Record<string, unknown>[] = []
    let headers: string[] = []
    if (entity === 'contacts') {
      rows = state.contacts as unknown as Record<string, unknown>[]
      headers = rows[0] ? Object.keys(rows[0]) : ['firstName', 'lastName', 'email']
    } else if (entity === 'companies') {
      rows = state.companies as unknown as Record<string, unknown>[]
      headers = rows[0] ? Object.keys(rows[0]) : ['name']
    } else if (entity === 'deals') {
      rows = state.deals as unknown as Record<string, unknown>[]
      headers = rows[0] ? Object.keys(rows[0]) : ['name', 'amount', 'stage']
    } else {
      rows = state.activities as unknown as Record<string, unknown>[]
      headers = rows[0] ? Object.keys(rows[0]) : ['subject', 'type']
    }
    const lines = [headers.join(',')]
    for (const row of rows) {
      lines.push(headers.map((h) => esc(row[h])).join(','))
    }
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${entity}.csv`
    a.click()
    URL.revokeObjectURL(url)
  },

  /**
   * Industry flow: mirror platform Users + Bookings into CRM contacts.
   * API mode uses server-side POST /crm/sync/platform; local demo uses in-browser plan.
   */
  async syncFromPlatform(input?: {
    users: User[]
    bookings: Booking[]
    contacts?: CrmContact[]
  }): Promise<PlatformSyncStats> {
    if (isCrmApiMode()) {
      return crmApi.syncPlatform()
    }

    if (!input) {
      return { created: 0, updated: 0, skipped: 0, fromUsers: 0, fromBookings: 0 }
    }

    const contacts = input.contacts ?? (await this.listContacts())
    const plan = buildPlatformSyncPlan(input.users, input.bookings, contacts)

    let created = 0
    let updated = 0

    for (const row of plan.creates) {
      if (!row.firstName?.trim() || !row.email?.trim()) continue
      await this.upsertContact({
        firstName: row.firstName.trim(),
        lastName: (row.lastName ?? '—').trim(),
        email: row.email.trim(),
        ...row,
      })
      created += 1
    }

    for (const row of plan.updates) {
      await this.upsertContact(row)
      updated += 1
    }

    return {
      created,
      updated,
      skipped: input.users.length + input.bookings.length - created - updated,
      fromUsers: input.users.filter((u) => u.userType === 'customer').length,
      fromBookings: input.bookings.length,
    }
  },
}
