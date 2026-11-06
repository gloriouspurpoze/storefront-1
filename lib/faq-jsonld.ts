export type FaqItem = { question: string; answer: string }

/** Only complete Q&As, trimmed. */
export function completeFaqs(faqs: readonly FaqItem[] | undefined | null): FaqItem[] {
  return (faqs ?? [])
    .map((f) => ({ question: String(f?.question ?? '').trim(), answer: String(f?.answer ?? '').trim() }))
    .filter((f) => f.question && f.answer)
}

/**
 * schema.org FAQPage for Q&As that are visible on the page (Google requires the markup to match
 * what users see). Returns null when there is nothing to mark up.
 */
export function buildFaqPageJsonLd(faqs: readonly FaqItem[] | undefined | null): Record<string, unknown> | null {
  const items = completeFaqs(faqs)
  if (!items.length) return null
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((f) => ({
      '@type': 'Question',
      name: f.question,
      acceptedAnswer: { '@type': 'Answer', text: f.answer },
    })),
  }
}
