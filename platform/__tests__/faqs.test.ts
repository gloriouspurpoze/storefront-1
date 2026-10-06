import { describe, expect, it } from 'vitest'
import { faqCategoriesFor, normalizeFaqCategory, selectFaqs } from '../faqs'

const row = (category: string, q = `Q ${category}`, a = `A ${category}`) => ({ category, question: q, answer: a })

describe('marketing FAQ categories', () => {
  it('normalizes case, spaces and punctuation', () => {
    expect(normalizeFaqCategory(' Salon & Spa ')).toBe('salonspa')
    expect(normalizeFaqCategory('for-salons')).toBe('forsalons')
    expect(normalizeFaqCategory('PRICING')).toBe('pricing')
  })

  it('accepts the industry name, URL, key or short slug', () => {
    const rows = [row('Salon & spa'), row('for-salons'), row('salon'), row('Salons'), row('Restaurant')]
    expect(selectFaqs(rows, 'industry:salon').map((r) => r.q)).toEqual([
      'Q Salon & spa',
      'Q for-salons',
      'Q salon',
      'Q Salons',
    ])
  })

  it('places Home and Pricing FAQs only on their pages, keeping API order', () => {
    const rows = [row('Pricing', 'P1'), row('home', 'H1'), row('Homepage', 'H2'), row('Booking', 'B1')]
    expect(selectFaqs(rows, 'home').map((r) => r.q)).toEqual(['H1', 'H2'])
    expect(selectFaqs(rows, 'pricing').map((r) => r.q)).toEqual(['P1'])
  })

  it('drops rows without a question or answer, and unknown industries match nothing', () => {
    expect(selectFaqs([row('home', ' ', 'x'), row('home', 'q', '')], 'home')).toEqual([])
    expect(faqCategoriesFor('industry:unknown')).toEqual([])
  })
})
