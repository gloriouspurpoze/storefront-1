import { formatPlanPriceInr, type VerticalPlanDef } from '@profixer/marketing-data'
import { PLATFORM_BRAND, siteUrl } from '@/platform/config'
import { HOME_DESCRIPTION, HOME_FAQ } from '@/platform/content/home'
import { pageFaqs, platformBlogPosts } from '@/platform/cms'
import { textResponse } from '@/platform/llms'
import { platformSiteContent } from '@/platform/siteContent'

export const revalidate = 3600

/** "from ₹499/month" — the cheapest priced plan for an industry. */
function startingPrice(plans: readonly VerticalPlanDef[]): string {
  const priced = plans.filter((p) => p.priceMonthlyInr != null)
  const cheapest = priced.sort((a, b) => (a.priceMonthlyInr ?? 0) - (b.priceMonthlyInr ?? 0))[0]
  return cheapest ? ` From ${formatPlanPriceInr(cheapest)}/month.` : ''
}

/** torqstudio.com/llms.txt — a plain-text map of the site for AI assistants (llmstxt.org format). */
export async function GET() {
  const [posts, faqs, site] = await Promise.all([platformBlogPosts(50), pageFaqs('home', HOME_FAQ), platformSiteContent()])
  const lines = [
    `# ${PLATFORM_BRAND}`,
    '',
    `> ${HOME_DESCRIPTION}`,
    '',
    `Full text of every page, price and FAQ: ${siteUrl('/llms-full.txt')}`,
    '',
    '## Product',
    `- [Home](${siteUrl('/')}): what ${PLATFORM_BRAND} does and who it is for`,
    `- [Pricing](${siteUrl('/pricing')}): monthly plans in INR, 14-day free trial, no credit card`,
    '',
    '## Industries',
    ...site.verticals.map(
      (v) => `- [${PLATFORM_BRAND} for ${v.label}](${siteUrl(`/${v.marketingSlug}`)}): ${v.description}${startingPrice(site.plans(v.key))}`,
    ),
    '',
    '## FAQ',
    ...faqs.map((f) => `- ${f.q} ${f.a}`),
  ]
  if (posts.length) {
    lines.push('', '## Guides', ...posts.map((p) => `- [${p.title}](${siteUrl(`/blog/${p.slug}`)})${p.description ? `: ${p.description}` : ''}`))
  }
  return textResponse(lines)
}
