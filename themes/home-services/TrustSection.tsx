import type { StorefrontCmsTestimonial } from '@/lib/cms-content'
import './home-services-shell.css'

const DEFAULT_STATS = [
  { value: '4.8★', label: 'Average rating' },
  { value: '10k+', label: 'Visits last year' },
  { value: '60 sec', label: 'Avg. booking time' },
  { value: '100%', label: 'Background-checked pros' },
]

/** Social-proof / trust strip — CMS featured testimonials when present, else stats. */
export function TrustSection({
  testimonials,
}: {
  testimonials?: StorefrontCmsTestimonial[]
}) {
  if (testimonials?.length) {
    return (
      <section className="border-y border-slate-200 bg-slate-50">
        <div className="hs-container py-12">
          <h2 className="text-center text-xl font-semibold text-slate-900 sm:text-2xl">
            What customers say
          </h2>
          <div className="mt-8 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {testimonials.map((t, i) => (
              <blockquote key={`${t.customerName}-${i}`} className="text-left">
                {t.rating != null ? (
                  <p className="text-sm font-medium text-amber-600" aria-label={`Rated ${t.rating} of 5`}>
                    {'★'.repeat(Math.min(5, Math.max(1, Math.round(t.rating))))}
                    {'☆'.repeat(Math.max(0, 5 - Math.round(t.rating)))}
                  </p>
                ) : null}
                {t.title ? <p className="mt-2 text-sm font-semibold text-slate-900">{t.title}</p> : null}
                <p className="mt-2 text-sm leading-relaxed text-slate-700">&ldquo;{t.content}&rdquo;</p>
                <footer className="mt-4 text-xs text-slate-500">
                  <cite className="not-italic font-medium text-slate-800">{t.customerName}</cite>
                  {t.customerRole ? <span> · {t.customerRole}</span> : null}
                </footer>
              </blockquote>
            ))}
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="border-y border-slate-200 bg-slate-50">
      <div className="hs-container grid grid-cols-2 gap-y-8 py-10 sm:grid-cols-4">
        {DEFAULT_STATS.map((s) => (
          <div key={s.label} className="text-center">
            <div className="text-2xl font-bold text-slate-900 sm:text-3xl">{s.value}</div>
            <div className="mt-1 text-xs uppercase tracking-wider text-slate-500">{s.label}</div>
          </div>
        ))}
      </div>
    </section>
  )
}
