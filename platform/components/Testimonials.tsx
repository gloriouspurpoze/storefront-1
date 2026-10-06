import { Quote, Star } from 'lucide-react'
import type { StorefrontCmsTestimonial } from '@/lib/cms-content'
import { Container, SectionTitle } from './Section'

/** Real customer quotes from the CMS. Renders nothing when there are none. */
export function Testimonials({ items, title = 'What our customers say' }: { items: StorefrontCmsTestimonial[]; title?: string }) {
  if (!items.length) return null
  return (
    <section className="py-20" id="customers">
      <Container>
        <SectionTitle eyebrow="Customers" title={title} />
        <div className={`mx-auto mt-12 grid max-w-5xl gap-4 ${items.length > 1 ? 'md:grid-cols-2' : ''} ${items.length > 2 ? 'lg:grid-cols-3' : ''}`}>
          {items.map((t) => {
            const rating = t.rating ? Math.max(0, Math.min(5, Math.round(t.rating))) : 0
            return (
              <figure key={`${t.customerName}-${t.content.slice(0, 24)}`} className="flex flex-col rounded-2xl border border-tq-line bg-white p-6">
                <Quote className="h-5 w-5 text-tq-primary" aria-hidden />
                {rating ? (
                  <p className="mt-3 flex gap-0.5" aria-label={`Rated ${rating} out of 5`}>
                    {Array.from({ length: 5 }, (_, i) => (
                      <Star key={i} className={`h-4 w-4 ${i < rating ? 'fill-amber-400 text-amber-400' : 'text-tq-line'}`} aria-hidden />
                    ))}
                  </p>
                ) : null}
                <blockquote className="mt-3 flex-1 whitespace-pre-line text-sm leading-relaxed text-tq-ink">“{t.content}”</blockquote>
                <figcaption className="mt-5 text-sm">
                  <span className="font-semibold text-tq-ink">{t.customerName}</span>
                  {t.customerRole ? <span className="text-tq-muted"> · {t.customerRole}</span> : null}
                </figcaption>
              </figure>
            )
          })}
        </div>
      </Container>
    </section>
  )
}
