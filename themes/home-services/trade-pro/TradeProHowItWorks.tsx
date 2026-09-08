import './trade-pro.css'

const STEPS = [
  { n: 1, title: 'Request a quote', body: 'Tell us what you need in a few words — or pick a service.' },
  { n: 2, title: 'We confirm', body: 'A verified local pro is matched and you get a clear next step.' },
  { n: 3, title: 'We arrive', body: 'On time, background-checked, ready to get the job done.' },
  { n: 4, title: 'Job done', body: 'Pay securely and leave a review when you’re happy.' },
]

export function TradeProHowItWorks() {
  return (
    <section className="tp-container tp-section">
      <div className="max-w-xl">
        <p className="tp-eyebrow">How it works</p>
        <h2 className="tp-h2 mt-3">Booked in a few simple steps</h2>
      </div>
      <div className="tp-section-body tp-grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {STEPS.map((step) => (
          <div key={step.n} className="tp-card">
            <span
              className="flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold"
              style={{
                backgroundColor: 'var(--tp-accent)',
                color: 'var(--tp-accent-contrast)',
              }}
              aria-hidden
            >
              {step.n}
            </span>
            <h3 className="mt-5 text-base font-semibold text-[var(--tp-ink)]">{step.title}</h3>
            <p className="mt-2 text-sm leading-6 text-[var(--tp-body)]">{step.body}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
