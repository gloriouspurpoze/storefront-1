import { BoltIcon, CheckIcon, ShieldIcon, WrenchIcon } from './icons'
import './trade-pro.css'

const WHY_CHOOSE_US = [
  { title: 'Fast response', body: 'Most requests matched with a pro in under an hour.', icon: BoltIcon },
  { title: 'Verified pros', body: 'Background-checked, rated, and locally based.', icon: ShieldIcon },
  { title: 'Transparent pricing', body: 'Know the cost before any work begins.', icon: CheckIcon },
  { title: 'Satisfaction guaranteed', body: 'Not happy? We make it right.', icon: WrenchIcon },
]

export function TradeProWhyChooseUs() {
  return (
    <section className="tp-soft-band">
      <div className="tp-container tp-section">
        <div className="max-w-xl">
          <p className="tp-eyebrow">Why choose us</p>
          <h2 className="tp-h2 mt-3">Trusted help without the runaround</h2>
        </div>
        <div className="tp-section-body tp-grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {WHY_CHOOSE_US.map((item) => (
            <div key={item.title} className="tp-card transition hover:-translate-y-0.5">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-xl"
                style={{
                  backgroundColor: 'var(--tp-accent)',
                  color: 'var(--tp-accent-contrast)',
                }}
              >
                <item.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-5 text-base font-semibold text-[var(--tp-ink)]">{item.title}</h3>
              <p className="mt-2 text-sm leading-6 text-[var(--tp-body)]">{item.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
