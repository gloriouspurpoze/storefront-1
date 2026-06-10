/**
 * Reorderable content blocks for programmatic SEO landing pages
 * (`/problems`, `/cost`, `/guide`). Mirrors the consumer-site
 * `ContentSection` model in `user-site-fixerwebapp`.
 */

export type ContentSectionType =
  | 'rich_text'
  | 'key_takeaways'
  | 'faqs'
  | 'price_table'
  | 'how_to'
  | 'causes'
  | 'callout'

export interface SectionFaq {
  question: string
  answer: string
}

export interface SectionPriceRow {
  item: string
  priceFrom: number
  priceTo: number
  currency?: string
  note?: string
}

export interface SectionHowToStep {
  name: string
  text: string
  imageUrl?: string
}

export interface SectionCauseFix {
  cause: string
  fix: string
}

export interface ContentSection {
  id: string
  type: ContentSectionType
  heading?: string
  html?: string
  variant?: 'info' | 'tip' | 'warning'
  items?: string[]
  faqs?: SectionFaq[]
  rows?: SectionPriceRow[]
  caption?: string
  steps?: SectionHowToStep[]
  causes?: SectionCauseFix[]
}

export const SECTION_TYPE_META: Record<
  ContentSectionType,
  { label: string; description: string }
> = {
  rich_text: { label: 'Rich text', description: 'Headings, paragraphs, lists, links, images' },
  key_takeaways: { label: 'Key takeaways', description: 'Bulleted summary list' },
  faqs: { label: 'FAQs', description: 'Question & answer pairs (FAQ schema)' },
  price_table: { label: 'Price table', description: 'Itemised price ranges' },
  how_to: { label: 'How-to steps', description: 'Numbered step-by-step (HowTo schema)' },
  causes: { label: 'Causes & fixes', description: 'Two-column troubleshooting table' },
  callout: { label: 'Callout', description: 'Highlighted info / tip / warning box' },
}

export function newSectionId(): string {
  try {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID()
  } catch {
    /* noop */
  }
  return `s-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

export function createSection(type: ContentSectionType): ContentSection {
  const base: ContentSection = { id: newSectionId(), type }
  switch (type) {
    case 'rich_text':
      return { ...base, heading: '', html: '' }
    case 'callout':
      return { ...base, heading: '', html: '', variant: 'info' }
    case 'key_takeaways':
      return { ...base, heading: 'Key takeaways', items: [''] }
    case 'faqs':
      return { ...base, heading: 'FAQs', faqs: [{ question: '', answer: '' }] }
    case 'price_table':
      return { ...base, heading: 'Price guide', rows: [{ item: '', priceFrom: 0, priceTo: 0 }] }
    case 'how_to':
      return { ...base, heading: 'Step-by-step', steps: [{ name: '', text: '' }] }
    case 'causes':
      return { ...base, heading: 'Common causes & fixes', causes: [{ cause: '', fix: '' }] }
    default:
      return base
  }
}
