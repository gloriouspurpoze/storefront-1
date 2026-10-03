import type { StorefrontCmsFaq } from '@/lib/cms-content'
import './trade-pro.css'
import { IconPlus } from '@/ui'

export function TradeProFaq({ faqs }: { faqs: StorefrontCmsFaq[] }) {
  if (!faqs.length) return null
  return (
    <section className="tp-soft-band">
      <div className="tp-container tp-container--narrow tp-section">
        <h2 className="tp-h2 text-center">Frequently asked questions</h2>
        <div className="tp-section-body space-y-3">
          {faqs.map((item, i) => (
            <details
              key={i}
              className="group rounded-xl border border-[var(--tp-hairline)] bg-[var(--tp-canvas)] px-5 py-4 open:shadow-sm"
            >
              <summary className="cursor-pointer list-none font-semibold text-[var(--tp-ink)] marker:content-none">
                <span className="flex items-center justify-between gap-4">
                  {item.question}
                  <span className="inline-flex text-[var(--tp-mute)] transition-transform group-open:rotate-45" aria-hidden><IconPlus size={18} /></span>
                </span>
              </summary>
              <p className="mt-2 max-w-[65ch] text-sm text-[var(--tp-body)]">{item.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  )
}
