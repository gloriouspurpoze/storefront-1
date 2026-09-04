import './trade-pro.css'

export function TradeProAbout({ title, body }: { title?: string; body?: string }) {
  if (!title && !body) return null
  return (
    <section className="tp-container py-16 sm:py-20">
      <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2">
        <div className="tp-diagonal-stripes h-48 rounded-lg lg:h-72" aria-hidden />
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-[var(--tp-ink)]/60">About us</p>
          {title && <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">{title}</h2>}
          {body && <p className="mt-4 whitespace-pre-wrap text-pretty text-slate-600">{body}</p>}
        </div>
      </div>
    </section>
  )
}
