import type { ReactNode } from 'react'
import { Check, Star } from 'lucide-react'
import type { PillarIconKey } from '@profixer/marketing-data'
import type { PreviewData } from '@/platform/content/previews'
import { PILLAR_ICONS } from './icons'
import { Container, SectionTitle } from './Section'

type Pillar = { icon: PillarIconKey; title: string; body: string }

type MockKind = 'schedule' | 'storefront' | 'crm' | 'billing' | 'catalog'

/** Which illustrative mock sits next to a pillar. Industry keys are the core-operations pillar. */
function mockKind(icon: PillarIconKey): MockKind {
  switch (icon) {
    case 'storefront':
      return 'storefront'
    case 'crm':
      return 'crm'
    case 'billing':
      return 'billing'
    case 'catalog':
      return 'catalog'
    default:
      return 'schedule'
  }
}

const POINTS: Record<MockKind, readonly string[]> = {
  schedule: ['One live view for the whole team', 'Automatic reminders cut no-shows', 'Works on any phone'],
  storefront: ['Your own domain and branding', '0% commission on direct orders', 'Online payments built in'],
  crm: ['Full history for every customer', 'Win-back and loyalty campaigns', 'WhatsApp, SMS and email'],
  billing: ['GST-ready invoices in seconds', 'Online payment links', 'Reports your accountant will like'],
  catalog: ['One catalog for store and website', 'Stock that syncs everywhere', 'Bulk import from Excel'],
}

export function FeatureShowcase({ pillars, data, eyebrow, title }: { pillars: readonly Pillar[]; data: PreviewData; eyebrow: string; title: string }) {
  return (
    <section className="py-16 sm:py-20" id="solution">
      <Container>
        <SectionTitle eyebrow={eyebrow} title={title} />
        <div className="mt-12 space-y-16 sm:mt-16 sm:space-y-24">
          {pillars.map((p, i) => {
            const Icon = PILLAR_ICONS[p.icon]
            const kind = mockKind(p.icon)
            return (
              <div key={p.title} className="grid items-center gap-8 lg:grid-cols-2 lg:gap-16">
                <div className={i % 2 ? 'lg:order-2' : ''}>
                  <span className="inline-flex rounded-xl bg-tq-primary-soft p-3 text-tq-primary">
                    <Icon className="h-5 w-5" aria-hidden />
                  </span>
                  <h3 className="mt-4 text-2xl font-semibold tracking-tight text-tq-ink sm:text-3xl">{p.title}</h3>
                  <p className="mt-3 text-base text-tq-muted">{p.body}</p>
                  <ul className="mt-6 space-y-3">
                    {POINTS[kind].map((point) => (
                      <li key={point} className="flex items-start gap-3 text-sm text-tq-ink">
                        <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-tq-primary/10 text-tq-primary">
                          <Check className="h-3 w-3" aria-hidden />
                        </span>
                        {point}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className={`rounded-3xl bg-gradient-to-br from-tq-primary-soft/60 via-tq-wash to-white p-4 sm:p-8 ${i % 2 ? 'lg:order-1' : ''}`}>
                  <Mock kind={kind} data={data} />
                </div>
              </div>
            )
          })}
        </div>
      </Container>
    </section>
  )
}

function MockFrame({ title, children }: { title: string; children: ReactNode }) {
  return (
    <figure aria-label={`${title} (sample data)`} className="overflow-hidden rounded-2xl border border-tq-line bg-white shadow-[0_20px_50px_-20px_rgba(14,49,145,0.3)]">
      <div className="flex items-center justify-between border-b border-tq-line px-4 py-3" aria-hidden>
        <p className="text-sm font-semibold text-tq-ink">{title}</p>
        <span className="text-[11px] text-tq-muted">Sample data</span>
      </div>
      <div className="p-4" aria-hidden>
        {children}
      </div>
    </figure>
  )
}

function Mock({ kind, data }: { kind: MockKind; data: PreviewData }) {
  switch (kind) {
    case 'storefront':
      return <StorefrontMock data={data} />
    case 'crm':
      return <CrmMock data={data} />
    case 'billing':
      return <BillingMock data={data} />
    case 'catalog':
      return <CatalogMock data={data} />
    default:
      return <ScheduleMock data={data} />
  }
}

const STATUS_TONES = ['bg-tq-primary/10 text-tq-primary', 'bg-amber-50 text-amber-700', 'bg-green-50 text-tq-success']

function ScheduleMock({ data }: { data: PreviewData }) {
  return (
    <MockFrame title={data.todayTitle}>
      <ul className="space-y-2.5">
        {data.today.map((r, i) => (
          <li key={r.time} className="flex items-center gap-3 rounded-xl border border-tq-line p-3">
            <span className="w-12 shrink-0 text-sm font-semibold text-tq-ink">{r.time}</span>
            <span className={`h-9 w-1 shrink-0 rounded-full ${i === 1 ? 'bg-amber-400' : 'bg-tq-primary'}`} />
            <span className="min-w-0 flex-1 truncate text-sm text-tq-ink">{r.title}</span>
            <span className={`hidden shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium sm:inline ${STATUS_TONES[i % STATUS_TONES.length]}`}>
              {r.status}
            </span>
          </li>
        ))}
      </ul>
      <div className="mt-4 grid grid-cols-3 gap-2 text-center">
        {data.kpis.slice(1, 4).map((k) => (
          <div key={k.label} className="rounded-lg bg-tq-wash p-2">
            <p className="text-sm font-semibold text-tq-ink">{k.value}</p>
            <p className="truncate text-[11px] text-tq-muted">{k.label}</p>
          </div>
        ))}
      </div>
    </MockFrame>
  )
}

function StorefrontMock({ data }: { data: PreviewData }) {
  return (
    <figure aria-label="Branded website (sample data)" className="mx-auto w-full max-w-[280px] rounded-[2rem] border-[6px] border-tq-ink bg-white p-3 shadow-[0_20px_50px_-20px_rgba(14,49,145,0.4)]">
      <div aria-hidden>
        <div className="mx-auto mb-3 h-1.5 w-14 rounded-full bg-tq-line" />
        <div className="rounded-xl bg-gradient-to-br from-tq-primary-deep to-tq-primary-bright p-4 text-white">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/20 text-xs font-bold">{data.initials}</span>
          <p className="mt-3 text-base font-semibold">{data.business}</p>
          <p className="mt-1 flex items-center gap-1 text-[11px] text-white/80">
            <Star className="h-3 w-3 fill-current" /> 4.9 · 320 reviews
          </p>
        </div>
        <ul className="mt-3 space-y-2">
          {data.items.map((item) => (
            <li key={item.name} className="flex items-center justify-between rounded-lg border border-tq-line px-3 py-2 text-xs">
              <span className="truncate text-tq-ink">{item.name}</span>
              <span className="shrink-0 font-semibold text-tq-ink">{item.price}</span>
            </li>
          ))}
        </ul>
        <div className="mt-3 rounded-full bg-tq-primary py-2.5 text-center text-xs font-semibold text-white">{data.bookLabel}</div>
        <p className="mt-2 text-center text-[10px] text-tq-muted">{data.business.toLowerCase().replace(/[^a-z]+/g, '')}.com</p>
      </div>
    </figure>
  )
}

function CrmMock({ data }: { data: PreviewData }) {
  const { client } = data
  return (
    <MockFrame title="Customer profile">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-tq-primary text-sm font-semibold text-white">{client.initials}</span>
        <div className="min-w-0">
          <p className="truncate font-semibold text-tq-ink">{client.name}</p>
          <p className="truncate text-xs text-tq-muted">{client.detail}</p>
        </div>
      </div>
      <p className="mt-5 text-xs font-medium uppercase tracking-wide text-tq-muted">History</p>
      <ul className="mt-2 divide-y divide-tq-line">
        {client.history.map((h) => (
          <li key={h.date} className="flex items-center gap-3 py-2.5 text-sm">
            <span className="w-14 shrink-0 text-xs text-tq-muted">{h.date}</span>
            <span className="min-w-0 flex-1 truncate text-tq-ink">{h.title}</span>
            <span className="shrink-0 font-medium text-tq-ink">{h.amount}</span>
          </li>
        ))}
      </ul>
      <div className="mt-3 rounded-xl bg-tq-primary/10 p-3 text-xs text-tq-primary-deep">
        <span className="font-semibold">Win-back message scheduled</span> · sends if no visit in 30 days
      </div>
    </MockFrame>
  )
}

function rupees(amount: number): string {
  return `₹${amount.toLocaleString('en-IN')}`
}

function BillingMock({ data }: { data: PreviewData }) {
  const lines = data.items.slice(0, 2)
  return (
    <MockFrame title="Invoice #INV-1042">
      <div className="flex items-start justify-between gap-3 text-xs">
        <div>
          <p className="font-semibold text-tq-ink">{data.business}</p>
          <p className="text-tq-muted">Billed to {data.client.name}</p>
        </div>
        <span className="rounded-full bg-green-50 px-2.5 py-1 font-medium text-tq-success">Paid</span>
      </div>
      <ul className="mt-4 divide-y divide-tq-line border-y border-tq-line text-sm">
        {lines.map((l) => (
          <li key={l.name} className="flex justify-between gap-3 py-2.5">
            <span className="truncate text-tq-ink">{l.name}</span>
            <span className="shrink-0 text-tq-ink">{l.price}</span>
          </li>
        ))}
        <li className="flex justify-between py-2.5 text-tq-muted">
          <span>GST 18%</span>
          <span>Included</span>
        </li>
      </ul>
      <div className="mt-3 flex items-center justify-between">
        <span className="text-sm text-tq-muted">Paid via UPI</span>
        <span className="text-lg font-semibold text-tq-ink">{rupees(lines.reduce((sum, l) => sum + Number(l.price.replace(/\D/g, '')), 0))}</span>
      </div>
    </MockFrame>
  )
}

function CatalogMock({ data }: { data: PreviewData }) {
  return (
    <MockFrame title="Products">
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        {data.items.map((item, i) => (
          <div key={item.name} className="rounded-xl border border-tq-line p-2">
            <div className={`aspect-square rounded-lg ${['bg-tq-primary-soft', 'bg-amber-100', 'bg-green-100'][i % 3]}`} />
            <p className="mt-2 truncate text-xs font-medium text-tq-ink">{item.name}</p>
            <p className="text-xs text-tq-muted">{item.price}</p>
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-center justify-between rounded-xl bg-tq-wash px-3 py-2 text-xs">
        <span className="text-tq-muted">Stock synced · store + website</span>
        <span className="font-semibold text-tq-success">Live</span>
      </div>
    </MockFrame>
  )
}
