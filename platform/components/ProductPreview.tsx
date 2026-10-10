import { Search } from 'lucide-react'
import { previewFor, type PreviewData } from '@/platform/content/previews'

/** Illustrative product screenshot built in HTML (sample data, labelled as such for screen readers). */
export function ProductPreview({ compact = false, data = previewFor('home_services') }: { compact?: boolean; data?: PreviewData }) {
  return (
    <figure
      aria-label="Example dashboard with sample data"
      className="rounded-2xl border border-tq-line bg-white/70 p-2 shadow-[0_30px_80px_-20px_rgba(14,49,145,0.35)] backdrop-blur"
    >
      <div className="overflow-hidden rounded-xl border border-tq-line bg-white" aria-hidden>
        <div className="flex items-center gap-2 border-b border-tq-line px-4 py-2.5">
          <span className="h-2.5 w-2.5 rounded-full bg-tq-line" />
          <span className="h-2.5 w-2.5 rounded-full bg-tq-line" />
          <span className="h-2.5 w-2.5 rounded-full bg-tq-line" />
          <div className="mx-auto hidden items-center gap-2 rounded-md bg-tq-wash px-3 py-1 text-[11px] text-tq-muted sm:flex">
            <Search className="h-3 w-3" />
            Search bookings, customers, orders…
          </div>
        </div>
        <div className="flex">
          <aside className={`hidden w-44 shrink-0 border-r border-tq-line p-3 ${compact ? 'xl:block' : 'md:block'}`}>
            <div className="mb-4 flex items-center gap-2 px-2 text-xs font-semibold text-tq-ink">
              <span className="flex h-6 w-6 items-center justify-center rounded-md bg-tq-primary text-[10px] text-white">{data.initials}</span>
              {data.business}
            </div>
            <ul className="space-y-0.5">
              {data.nav.map(({ icon: Icon, label }, i) => (
                <li
                  key={label}
                  className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-xs ${
                    i === 0 ? 'bg-tq-primary/10 font-medium text-tq-primary' : 'text-tq-muted'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {label}
                </li>
              ))}
            </ul>
          </aside>
          <div className="min-w-0 flex-1 space-y-4 p-4 text-left sm:p-5">
            <div className={`grid grid-cols-2 gap-3 ${compact ? '' : 'sm:grid-cols-4'}`}>
              {data.kpis.map((k) => (
                <div key={k.label} className="rounded-lg border border-tq-line p-3">
                  <p className="text-[11px] text-tq-muted">{k.label}</p>
                  <p className="mt-1 text-base font-semibold text-tq-ink sm:text-lg">{k.value}</p>
                  <p className="text-[11px] font-medium text-tq-success">{k.delta}</p>
                </div>
              ))}
            </div>
            <div className={`grid gap-3 ${compact ? '' : 'lg:grid-cols-5'}`}>
              <div className={`rounded-lg border border-tq-line p-3 ${compact ? 'hidden sm:block' : 'lg:col-span-3'}`}>
                <p className="text-xs font-medium text-tq-ink">Revenue · last 12 weeks</p>
                <div className="mt-3 flex h-28 items-end gap-1.5">
                  {[34, 42, 38, 51, 47, 58, 55, 64, 61, 72, 69, 84].map((h, i) => (
                    <span key={i} className={`flex-1 rounded-t ${i === 11 ? 'bg-tq-primary' : 'bg-tq-primary/25'}`} style={{ height: `${h}%` }} />
                  ))}
                </div>
              </div>
              <div className={`rounded-lg border border-tq-line p-3 ${compact ? '' : 'lg:col-span-2'}`}>
                <p className="text-xs font-medium text-tq-ink">{data.todayTitle}</p>
                <ul className="mt-2 space-y-2 text-[11px]">
                  {data.today.map((r) => (
                    <li key={r.time} className="flex items-center gap-2">
                      <span className="w-9 shrink-0 text-tq-muted">{r.time}</span>
                      <span className="min-w-0 flex-1 truncate text-tq-ink">{r.title}</span>
                      <span className="shrink-0 rounded-full bg-tq-primary/10 px-2 py-0.5 text-tq-primary">{r.status}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </figure>
  )
}
