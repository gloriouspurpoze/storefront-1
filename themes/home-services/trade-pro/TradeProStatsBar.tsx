import { BoltIcon, CheckIcon, ShieldIcon, WrenchIcon } from './icons'
import './trade-pro.css'

const STATS = [
  { value: '10k+', label: 'Jobs completed', icon: WrenchIcon },
  { value: '4.8★', label: 'Average rating', icon: ShieldIcon },
  { value: '60 sec', label: 'Avg. response time', icon: BoltIcon },
  { value: '100%', label: 'Background-checked pros', icon: CheckIcon },
]

export function TradeProStatsBar() {
  return (
    <section className="border-y border-slate-200 bg-slate-50">
      <div className="tp-container grid grid-cols-2 gap-y-8 py-10 sm:grid-cols-4">
        {STATS.map(({ value, label, icon: Icon }) => (
          <div key={label} className="flex min-w-0 flex-col items-center text-center">
            <Icon className="h-5 w-5 text-[var(--tp-ink)]" />
            <div className="mt-2 text-2xl font-black text-slate-900 sm:text-3xl">{value}</div>
            <div className="mt-1 text-xs uppercase tracking-wider text-slate-500">{label}</div>
          </div>
        ))}
      </div>
    </section>
  )
}
