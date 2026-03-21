/**
 * FAQ (FAQPage) JSON-LD and lead-magnet HTML builders for blog posts.
 * Stored as structured fields on the post; public site should inject JSON-LD in <head>.
 */

export interface BlogFaqItem {
  question: string
  answer: string
}

export interface BlogLeadMagnetSettings {
  enabled: boolean
  headline: string
  subtext: string
  buttonLabel: string
  /** Public site form POST target (absolute URL recommended). */
  formActionUrl: string
  /** Hidden field source value for attribution. */
  sourceTag: string
}

export function defaultLeadMagnetSettings(): BlogLeadMagnetSettings {
  return {
    enabled: false,
    headline: 'Get the free guide',
    subtext: 'Enter your details and we’ll email the PDF.',
    buttonLabel: 'Send me the guide',
    formActionUrl: '',
    sourceTag: 'blog-lead-magnet',
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/** Minified JSON for <script type="application/ld+json">; null if no valid pairs. */
export function buildFaqJsonLdString(items: BlogFaqItem[]): string | null {
  const valid = items.filter((i) => i.question.trim() && i.answer.trim())
  if (valid.length === 0) return null
  const doc = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: valid.map((i) => ({
      '@type': 'Question',
      name: i.question.trim(),
      acceptedAnswer: {
        '@type': 'Answer',
        text: i.answer.trim(),
      },
    })),
  }
  return JSON.stringify(doc)
}

/** Visible FAQ block (must align with JSON-LD for FAQ rich results). */
export function buildFaqVisibleHtml(items: BlogFaqItem[]): string {
  const valid = items.filter((i) => i.question.trim() && i.answer.trim())
  if (valid.length === 0) return ''
  const dl = valid
    .map(
      (i) =>
        `<dt>${escapeHtml(i.question.trim())}</dt><dd>${escapeHtml(i.answer.trim())}</dd>`,
    )
    .join('')
  return `<section class="blog-faq" aria-labelledby="blog-faq-heading"><h2 id="blog-faq-heading">Frequently asked questions</h2><dl>${dl}</dl></section>`
}

/** Lead form HTML; if no action URL, shows a placeholder (preview / draft). */
export function buildLeadMagnetFormHtml(settings: BlogLeadMagnetSettings): string {
  if (!settings.enabled) return ''
  const headline = settings.headline.trim() || 'Get the free guide'
  const sub = settings.subtext.trim()
  const btn = settings.buttonLabel.trim() || 'Submit'
  const action = settings.formActionUrl.trim()
  const source = settings.sourceTag.trim() || 'blog-lead-magnet'

  if (!action) {
    return `<section class="blog-lead-magnet blog-lead-magnet--no-action" aria-labelledby="blog-lead-heading"><h2 id="blog-lead-heading">${escapeHtml(headline)}</h2>${sub ? `<p>${escapeHtml(sub)}</p>` : ''}<p class="blog-lead-magnet__note"><em>Add a form action URL in the blog editor so the live site can submit leads.</em></p></section>`
  }

  return `<section class="blog-lead-magnet" aria-labelledby="blog-lead-heading"><h2 id="blog-lead-heading">${escapeHtml(headline)}</h2>${sub ? `<p>${escapeHtml(sub)}</p>` : ''}<form class="blog-lead-form" action="${escapeHtml(action)}" method="post"><label for="blog-lead-name">Name</label><input id="blog-lead-name" name="name" type="text" autocomplete="name" required /><label for="blog-lead-email">Email</label><input id="blog-lead-email" name="email" type="email" autocomplete="email" required /><label for="blog-lead-company">Company <span>(optional)</span></label><input id="blog-lead-company" name="company" type="text" autocomplete="organization" /><input type="hidden" name="source" value="${escapeHtml(source)}" /><button type="submit">${escapeHtml(btn)}</button></form></section>`
}

/** Combined appendix for preview/export (sanitized body should wrap this separately). */
export function buildBlogStructuredAppendixHtml(
  faqItems: BlogFaqItem[],
  leadMagnet: BlogLeadMagnetSettings,
): string {
  return `${buildFaqVisibleHtml(faqItems)}${buildLeadMagnetFormHtml(leadMagnet)}`
}
