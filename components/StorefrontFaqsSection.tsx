import type { StorefrontCmsFaq } from '@/lib/cms-content'

/** Common FAQs from CMS `/cms/faqs` (falls back to studio faqItems when provided). */
export function StorefrontFaqsSection({
  faqs,
  fallbackItems,
  enabled = true,
  title = 'Frequently asked questions',
  className,
}: {
  faqs?: StorefrontCmsFaq[] | null
  fallbackItems?: Array<{ question: string; answer: string }> | null
  /** When false (e.g. featureFlags.showFaq === false), hide even if content exists. */
  enabled?: boolean
  title?: string
  className?: string
}) {
  const items = (faqs?.length ? faqs : fallbackItems ?? [])
    .map((row) => ({
      question: row.question?.trim() ?? '',
      answer: row.answer?.trim() ?? '',
    }))
    .filter((row) => row.question && row.answer)

  if (!enabled || items.length === 0) return null

  return (
    <section
      className={`sf-faqs${className ? ` ${className}` : ''}`}
      aria-labelledby="sf-faqs-heading"
    >
      <p className="sf-faqs__eyebrow">Help</p>
      <h2 id="sf-faqs-heading" className="sf-faqs__title">
        {title}
      </h2>
      <div className="sf-faqs__list">
        {items.map((item) => (
          <details key={item.question} className="sf-faqs__item">
            <summary className="sf-faqs__question">{item.question}</summary>
            <p className="sf-faqs__answer">{item.answer}</p>
          </details>
        ))}
      </div>
    </section>
  )
}
