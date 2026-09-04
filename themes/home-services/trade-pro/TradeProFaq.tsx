import type { StorefrontCmsFaq } from '@/lib/cms-content'
import './trade-pro.css'

export function TradeProFaq({ faqs }: { faqs: StorefrontCmsFaq[] }) {
  if (!faqs.length) return null
  return (
    <section className="border-t border-slate-200 bg-slate-50">
      <div className="tp-container tp-container--narrow py-16 sm:py-20">
        <h2 className="text-center text-3xl font-black tracking-tight text-slate-900">
          Frequently asked questions
        </h2>
        <div className="mt-8 space-y-3">
          {faqs.map((item, i) => (
            <details key={i} className="group rounded-lg border border-slate-200 bg-white p-4 open:shadow-sm">
              <summary className="cursor-pointer list-none font-semibold text-slate-900 marker:content-none">
                <span className="flex items-center justify-between gap-4">
                  {item.question}
                  <span className="text-lg leading-none text-slate-400 group-open:rotate-45">+</span>
                </span>
              </summary>
              <p className="mt-2 text-sm text-slate-600">{item.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  )
}
