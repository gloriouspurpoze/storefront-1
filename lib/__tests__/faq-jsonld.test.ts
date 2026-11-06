import { describe, expect, it } from 'vitest'
import { buildFaqPageJsonLd, completeFaqs } from '../faq-jsonld'

describe('faq-jsonld', () => {
  it('keeps only complete, trimmed Q&As', () => {
    expect(completeFaqs([{ question: ' Eggless? ', answer: ' Yes. ' }, { question: 'Q', answer: '' }])).toEqual([{ question: 'Eggless?', answer: 'Yes.' }])
  })

  it('builds FAQPage markup, or nothing when empty', () => {
    expect(buildFaqPageJsonLd([])).toBeNull()
    expect(buildFaqPageJsonLd([{ question: 'Eggless?', answer: 'Yes.' }])).toEqual({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: [{ '@type': 'Question', name: 'Eggless?', acceptedAnswer: { '@type': 'Answer', text: 'Yes.' } }],
    })
  })
})
