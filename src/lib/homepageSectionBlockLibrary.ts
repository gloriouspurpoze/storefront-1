/**
 * Schema-first homepage blocks: consumer site renders these shapes; admin stays template-driven (not a drag-drop canvas).
 */

export type HomepageSectionTypeValue =
  | 'hero'
  | 'features'
  | 'services'
  | 'testimonials'
  | 'statistics'
  | 'cta'
  | 'partners'
  | 'howitworks'

export interface HomepageBlockDefinition {
  type: HomepageSectionTypeValue
  label: string
  description: string
  /** JSON-schema-like shape for `content` + top-level fields editors should honor */
  contentSchema: Record<string, unknown>
  /** Suggested defaults when creating a section via API */
  defaultSnippet: Record<string, unknown>
}

export const HOMEPAGE_BLOCK_LIBRARY: HomepageBlockDefinition[] = [
  {
    type: 'hero',
    label: 'Hero',
    description: 'Primary headline, subcopy, background media, primary CTA.',
    contentSchema: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        subtitle: { type: 'string' },
        content: {
          type: 'object',
          properties: {
            description: { type: 'string' },
            backgroundImage: { type: 'string', format: 'uri' },
            cta: {
              type: 'object',
              properties: {
                text: { type: 'string' },
                link: { type: 'string' },
                style: { enum: ['primary', 'secondary', 'outline'] },
              },
            },
          },
        },
      },
    },
    defaultSnippet: {
      sectionType: 'hero',
      title: 'Book trusted pros in minutes',
      subtitle: 'Same-day repairs, transparent pricing',
      content: {
        description: '',
        backgroundImage: '',
        cta: { text: 'Get started', link: '/book', style: 'primary' },
      },
      displayOrder: 0,
      isActive: true,
    },
  },
  {
    type: 'features',
    label: 'Features',
    description: 'Grid of short value props (icon + title + text).',
    contentSchema: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        content: {
          type: 'object',
          properties: {
            items: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  title: { type: 'string' },
                  description: { type: 'string' },
                  icon: { type: 'string' },
                },
              },
            },
          },
        },
      },
    },
    defaultSnippet: {
      sectionType: 'features',
      title: 'Why customers choose us',
      content: { items: [{ title: 'Vetted pros', description: 'Background-checked technicians' }] },
      displayOrder: 1,
      isActive: true,
    },
  },
  {
    type: 'services',
    label: 'Services grid',
    description: 'Highlights categories or platform services with deep links.',
    contentSchema: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        content: {
          type: 'object',
          properties: {
            columns: { type: 'integer', minimum: 2, maximum: 4 },
            showPrices: { type: 'boolean' },
          },
        },
      },
    },
    defaultSnippet: {
      sectionType: 'services',
      title: 'Popular services',
      content: { columns: 3, showPrices: false },
      displayOrder: 2,
      isActive: true,
    },
  },
  {
    type: 'testimonials',
    label: 'Testimonials',
    description: 'Quotes carousel or grid; often wired to CMS testimonials.',
    contentSchema: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        content: {
          type: 'object',
          properties: {
            source: { enum: ['cms', 'inline'] },
            limit: { type: 'integer', minimum: 1, maximum: 12 },
          },
        },
      },
    },
    defaultSnippet: {
      sectionType: 'testimonials',
      title: 'What homeowners say',
      content: { source: 'cms', limit: 6 },
      displayOrder: 3,
      isActive: true,
    },
  },
  {
    type: 'statistics',
    label: 'Statistics',
    description: 'KPI tiles (jobs completed, cities, rating).',
    contentSchema: {
      type: 'object',
      properties: {
        content: {
          type: 'object',
          properties: {
            stats: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  label: { type: 'string' },
                  value: { type: 'string' },
                },
              },
            },
          },
        },
      },
    },
    defaultSnippet: {
      sectionType: 'statistics',
      title: 'Trusted at scale',
      content: {
        stats: [
          { label: 'Jobs completed', value: '10k+' },
          { label: 'Avg. rating', value: '4.8' },
        ],
      },
      displayOrder: 4,
      isActive: true,
    },
  },
  {
    type: 'cta',
    label: 'Call to action',
    description: 'Conversion band with dual CTAs.',
    contentSchema: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        content: {
          type: 'object',
          properties: {
            primaryCta: { type: 'object' },
            secondaryCta: { type: 'object' },
          },
        },
      },
    },
    defaultSnippet: {
      sectionType: 'cta',
      title: 'Ready to fix it?',
      content: {
        primaryCta: { text: 'Book now', link: '/book' },
        secondaryCta: { text: 'Browse services', link: '/services' },
      },
      displayOrder: 5,
      isActive: true,
    },
  },
  {
    type: 'partners',
    label: 'Partners / brands',
    description: 'Logo strip; assets from media library.',
    contentSchema: {
      type: 'object',
      properties: {
        content: {
          type: 'object',
          properties: {
            logos: { type: 'array', items: { type: 'string', format: 'uri' } },
          },
        },
      },
    },
    defaultSnippet: {
      sectionType: 'partners',
      title: 'Partners',
      content: { logos: [] },
      displayOrder: 6,
      isActive: true,
    },
  },
  {
    type: 'howitworks',
    label: 'How it works',
    description: 'Numbered steps (request → match → complete).',
    contentSchema: {
      type: 'object',
      properties: {
        content: {
          type: 'object',
          properties: {
            steps: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  title: { type: 'string' },
                  description: { type: 'string' },
                },
              },
            },
          },
        },
      },
    },
    defaultSnippet: {
      sectionType: 'howitworks',
      title: 'How it works',
      content: {
        steps: [
          { title: 'Tell us what you need', description: 'Pick a service and slot' },
          { title: 'Get matched', description: 'We assign a verified pro' },
          { title: 'Job done', description: 'Pay securely in-app' },
        ],
      },
      displayOrder: 7,
      isActive: true,
    },
  },
]

export function getHomepagePresetBundle(): Record<string, unknown>[] {
  return HOMEPAGE_BLOCK_LIBRARY.map((b) => ({ ...b.defaultSnippet }))
}
