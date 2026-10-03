import type { StorefrontCmsTestimonial } from '@/lib/cms-content'
import { Carousel, Rating } from '@/ui'
import './sections.css'

/** CMS testimonials as a card carousel; collapses when empty (no fake stats). */
export function Testimonials({
  testimonials,
  title = 'Loved by our customers',
}: {
  testimonials?: StorefrontCmsTestimonial[]
  title?: string
}) {
  if (!testimonials?.length) return null
  return (
    <section className="sf-section sf-testimonials">
      <div className="sf-container">
        <div className="sf-section-head">
          <h2 className="sf-heading">{title}</h2>
        </div>
        <Carousel label={title} itemWidth={['86%', '48%', 'calc((100% - 2rem) / 3)']} dots>
          {testimonials.map((t, i) => (
            <figure key={`${t.customerName}-${i}`} className="sf-quote">
              {t.rating != null && <Rating value={Math.min(5, Math.max(0, t.rating))} />}
              {t.title && <p className="sf-quote__title">{t.title}</p>}
              <blockquote className="sf-quote__body">“{t.content}”</blockquote>
              <figcaption className="sf-quote__who">
                <span className="sf-quote__avatar" aria-hidden>
                  {t.customerName.charAt(0)}
                </span>
                <span>
                  <strong>{t.customerName}</strong>
                  {t.customerRole && <span className="sf-quote__role">{t.customerRole}</span>}
                </span>
              </figcaption>
            </figure>
          ))}
        </Carousel>
      </div>
    </section>
  )
}
