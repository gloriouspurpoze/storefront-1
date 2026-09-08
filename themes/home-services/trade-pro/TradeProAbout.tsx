import './trade-pro.css'

export function TradeProAbout({ title, body }: { title?: string; body?: string }) {
  if (!title && !body) return null
  return (
    <section className="tp-container tp-section">
      <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-16">
        <div className="tp-photo-fallback min-h-[12rem] lg:min-h-[18rem]" aria-hidden />
        <div>
          <p className="tp-eyebrow">About us</p>
          {title ? <h2 className="tp-h2 mt-3">{title}</h2> : null}
          {body ? (
            <p className="mt-5 max-w-[65ch] whitespace-pre-wrap text-pretty text-base leading-7 text-[var(--tp-body)]">
              {body}
            </p>
          ) : null}
        </div>
      </div>
    </section>
  )
}
