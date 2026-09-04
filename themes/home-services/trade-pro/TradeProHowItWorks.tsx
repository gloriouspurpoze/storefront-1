import './trade-pro.css'

const STEPS = [
  { n: 1, title: 'Tell us what you need', body: 'Pick a service or describe the job in a few words.' },
  { n: 2, title: 'We match a verified pro', body: 'Local, background-checked, and highly rated.' },
  { n: 3, title: 'Sit back and relax', body: 'Track the visit and pay securely once it’s done.' },
]

export function TradeProHowItWorks() {
  return (
    <section className="tp-container py-16 sm:py-20">
      <div className="max-w-xl">
        <p className="text-xs font-bold uppercase tracking-[0.25em] text-[var(--tp-ink)]/60">How it works</p>
        <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
          Booked in three simple steps
        </h2>
      </div>
      <div className="mt-10 grid grid-cols-1 gap-8 sm:grid-cols-3">
        {STEPS.map((step) => (
          <div key={step.n} className="flex items-start gap-4">
            <span
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-base font-black text-[var(--tp-ink)]"
              style={{ backgroundColor: 'var(--tp-accent)' }}
              aria-hidden
            >
              {step.n}
            </span>
            <div className="min-w-0">
              <h3 className="text-base font-bold text-slate-900">{step.title}</h3>
              <p className="mt-1.5 text-sm text-slate-600">{step.body}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
