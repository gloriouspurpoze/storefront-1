import { BoltIcon, CheckIcon, ShieldIcon, WrenchIcon } from './icons'
import './trade-pro.css'

const WHY_CHOOSE_US = [
  { title: 'Fast response', body: 'Most requests matched with a pro in under an hour.', icon: BoltIcon },
  { title: 'Verified pros', body: 'Background-checked, rated, and locally based.', icon: ShieldIcon },
  { title: 'Transparent pricing', body: 'Know the cost before any work begins.', icon: CheckIcon },
  { title: 'Satisfaction guaranteed', body: 'Not happy? We make it right, free of charge.', icon: WrenchIcon },
]

export function TradeProWhyChooseUs() {
  return (
    <section className="border-t border-slate-200 bg-slate-50">
      <div className="tp-container py-16 sm:py-20">
        <div className="max-w-xl">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-[var(--tp-ink)]/60">Why choose us</p>
          <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
            Built for homeowners who don&apos;t have time to wait
          </h2>
        </div>
        <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {WHY_CHOOSE_US.map((item) => (
            <div
              key={item.title}
              className="rounded-lg border border-slate-200 bg-white p-6 transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <div
                className="flex h-10 w-10 items-center justify-center rounded text-[var(--tp-ink)]"
                style={{ backgroundColor: 'var(--tp-accent)' }}
              >
                <item.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-base font-bold text-slate-900">{item.title}</h3>
              <p className="mt-2 text-sm text-slate-600">{item.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
