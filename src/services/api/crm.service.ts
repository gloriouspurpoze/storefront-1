/**
 * CRM data layer: persists to localStorage for a working admin UI without a backend.
 * Replace internals with apiClient calls when `/api/crm/*` is available — shapes match REST payloads.
 */
import type {
  CrmActivity,
  CrmCompany,
  CrmContact,
  CrmDeal,
  CrmDealStage,
  CrmMetrics,
} from '../../types/crm.types'
import { crmApi } from './crm.api'

function isCrmApiMode(): boolean {
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

function seedState(): CrmState {
  const t = nowIso()
  const acme: CrmCompany = {
    id: uid(),
    name: 'Acme Services Ltd',
    industry: 'Facilities',
    website: 'https://acme.example.com',
    phone: '+44 20 7946 0001',
    city: 'London',
    country: 'UK',
    employeeCount: '51–200',
    annualRevenue: '£2M–£5M',
    createdAt: t,
    updatedAt: t,
  }
  const globex: CrmCompany = {
    id: uid(),
    name: 'Globex Maintenance',
    industry: 'Property',
    website: 'https://globex.example.com',
    city: 'Manchester',
    country: 'UK',
    createdAt: t,
    updatedAt: t,
  }
  const c1: CrmContact = {
    id: uid(),
    firstName: 'Sarah',
    lastName: 'Chen',
    email: 's.chen@acme.example.com',
    phone: '+44 7700 900123',
    jobTitle: 'Operations Director',
    companyId: acme.id,
    lifecycle: 'sql',
    leadSource: 'Inbound',
    createdAt: t,
    updatedAt: t,
  }
  const c2: CrmContact = {
    id: uid(),
    firstName: 'James',
    lastName: 'Okafor',
    email: 'j.okafor@globex.example.com',
    lifecycle: 'lead',
    leadSource: 'Referral',
    createdAt: t,
    updatedAt: t,
  }
  const d1: CrmDeal = {
    id: uid(),
    name: 'Enterprise rollout — London',
    amount: 48000,
    currency: 'GBP',
    stage: 'negotiation',
    probability: 70,
    companyId: acme.id,
    primaryContactId: c1.id,
    expectedCloseDate: new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10),
    createdAt: t,
    updatedAt: t,
  }
  const d2: CrmDeal = {
    id: uid(),
    name: 'Pilot — North region',
    amount: 12000,
    currency: 'GBP',
    stage: 'proposal',
    probability: 40,
    companyId: globex.id,
    primaryContactId: c2.id,
    expectedCloseDate: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
    createdAt: t,
    updatedAt: t,
  }
  const activities: CrmActivity[] = [
    {
      id: uid(),
      subject: 'Follow-up call — pricing',
      type: 'call',
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
      subject: 'Send revised proposal',
      type: 'task',
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
      subject: 'Discovery meeting booked',
      type: 'meeting',
      status: 'done',
      priority: 'normal',
      completedAt: t,
      relatedType: 'contact',
      relatedId: c1.id,
      createdAt: t,
      updatedAt: t,
    },
  ]
  return {
    companies: [acme, globex],
    contacts: [c1, c2],
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
    return JSON.parse(raw) as CrmState
  } catch {
    const s = seedState()
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s))
    return s
  }
}

function write(s: CrmState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(s))
}

const STAGES: CrmDealStage[] = ['lead', 'qualified', 'proposal', 'negotiation', 'won', 'lost']

export function computeMetrics(state: CrmState): CrmMetrics {
  const openDeals = state.deals.filter((d) => d.stage !== 'won' && d.stage !== 'lost')
  const pipelineValue = openDeals.reduce((a, d) => a + d.amount, 0)
  const weightedPipeline = openDeals.reduce((a, d) => a + d.amount * (d.probability / 100), 0)
  const start = new Date()
  start.setDate(1)
  start.setHours(0, 0, 0, 0)
  const wonThisMonth = state.deals.filter(
    (d) => d.stage === 'won' && new Date(d.updatedAt) >= start
  ).length
  const leadStages = new Set(['subscriber', 'lead', 'mql', 'sql', 'opportunity'])
  const activeLeads = state.contacts.filter((c) => leadStages.has(c.lifecycle)).length
  const now = Date.now()
  const overdueTasks = state.activities.filter(
    (a) =>
      a.status === 'open' &&
      a.type === 'task' &&
      a.dueAt &&
      new Date(a.dueAt).getTime() < now
  ).length
  const dealsByStage = STAGES.reduce(
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
    wonThisMonth,
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
  upsertContact(partial: Partial<CrmContact> & { firstName: string; lastName: string; email: string }) {
    const s = read()
    const id = partial.id ?? uid()
    const existing = s.contacts.find((c) => c.id === id)
    const row: CrmContact = {
      id,
      firstName: partial.firstName,
      lastName: partial.lastName,
      email: partial.email,
      phone: partial.phone,
      jobTitle: partial.jobTitle,
      companyId: partial.companyId,
      lifecycle: partial.lifecycle ?? existing?.lifecycle ?? 'lead',
      leadSource: partial.leadSource,
      ownerId: partial.ownerId,
      tags: partial.tags,
      notes: partial.notes,
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
      companyId: partial.companyId,
      primaryContactId: partial.primaryContactId,
      ownerId: partial.ownerId,
      expectedCloseDate: partial.expectedCloseDate,
      notes: partial.notes,
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

  getState(): CrmState {
    return localStore.getState()
  },

  async resetDemoData(): Promise<void> {
    if (isCrmApiMode()) {
      return
    }
    localStore.resetDemoData()
  },

  async getMetrics(): Promise<CrmMetrics> {
    if (isCrmApiMode()) return crmApi.getMetrics()
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
    if (isCrmApiMode()) return crmApi.listContacts()
    return localStore.listContacts()
  },
  async upsertContact(
    partial: Partial<CrmContact> & { firstName: string; lastName: string; email: string }
  ): Promise<CrmContact> {
    if (isCrmApiMode()) return crmApi.upsertContact(partial)
    return localStore.upsertContact(partial)
  },
  async deleteContact(id: string): Promise<void> {
    if (isCrmApiMode()) return crmApi.deleteContact(id)
    localStore.deleteContact(id)
  },

  async listDeals(): Promise<CrmDeal[]> {
    if (isCrmApiMode()) return crmApi.listDeals()
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
    if (isCrmApiMode()) return crmApi.listActivities()
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

  /** CSV export — API uses server-side field masking; local mode exports browser data. */
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
}
