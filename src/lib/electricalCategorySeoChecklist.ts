/**
 * 2026 eCommerce / local SEO checklist for electrician service landings (admin guidance).
 */

export type SeoChecklistItem = {
  id: string
  title: string
  detail: string
  tab?: 'metadata' | 'technical' | 'local' | 'content'
}

export const ELECTRICIAN_SERVICE_SEO_CHECKLIST: SeoChecklistItem[] = [
  {
    id: 'robots-index',
    title: 'Indexable robots meta',
    detail:
      'Use index, follow with max-image-preview:large on every production locality key (e.g. electrician__mumbai). Never leave noindex on growth URLs.',
    tab: 'technical',
  },
  {
    id: 'title-meta',
    title: 'Title & meta description',
    detail:
      'Title under ~60 characters with service + locality + brand. Meta 150–160 characters with booking CTA and Mumbai context.',
    tab: 'metadata',
  },
  {
    id: 'intro-depth',
    title: '200–300+ word category intro',
    detail:
      'Unique intro covering safety, pricing, same-day slots, and what electricians fix (MCB, wiring, fans). Avoid thin product-grid-only pages.',
    tab: 'content',
  },
  {
    id: 'faq-schema',
    title: 'FAQ block (6+ Q&As)',
    detail:
      'Answer booking, pricing, warranty, and coverage questions. Enables FAQ rich results when consumer FAQ schema is on.',
    tab: 'content',
  },
  {
    id: 'local-nap',
    title: 'Local SEO & GBP',
    detail:
      'Service area names, narrative for Mumbai localities, and verified Google Business Profile URL when NAP is confirmed.',
    tab: 'local',
  },
  {
    id: 'internal-links',
    title: 'Internal linking',
    detail:
      'Related links to /services hub, book flow, and sibling localities. Cross-link from blog guides on electrical safety.',
    tab: 'content',
  },
  {
    id: 'schema',
    title: 'Structured data toggles',
    detail:
      'Enable breadcrumb, WebPage, Service/Offer, and HowTo when booking steps are filled. Match visible on-page content.',
    tab: 'technical',
  },
  {
    id: 'images',
    title: 'OG image + alt text',
    detail:
      'Descriptive og:image alt (e.g. electrician testing DB in Mumbai). Use in-context photos where possible.',
    tab: 'technical',
  },
]
