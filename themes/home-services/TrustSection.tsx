import type { StorefrontCmsTestimonial } from '@/lib/cms-content'
import './home-services-shell.css'

/** Social-proof strip — CMS testimonials only; collapses when empty (no fake stats). */
export function TrustSection({
  testimonials,
}: {
  testimonials?: StorefrontCmsTestimonial[]
}) {
  if (!testimonials?.length) return null

  return (
    <section className="border-y border-slate-200 bg-slate-50">
      <div className="hs-container py-12">
        <h2 className="text-center text-xl font-semibold text-slate-900 sm:text-2xl">
          What customers say
        </h2>
        <div className="mt-8 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((t, i) => (
            <blockquote
              key={`${t.customerName}-${i}`}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_2px_12px_rgba(0,20,47,0.06)] text-left"
            >
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
