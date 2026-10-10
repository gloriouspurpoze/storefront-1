import {
  MARKETING_VERTICALS,
  formatPlanPriceInr,
  getVerticalLandingContent,
  marketingPlansForVertical,
} from '@profixer/marketing-data'
import { PLATFORM_BRAND, PLATFORM_CONTACT_EMAIL, siteUrl } from '@/platform/config'
import { HOME_DESCRIPTION, HOME_FAQ } from '@/platform/content/home'
import { pageFaqs, platformBlogPost, platformBlogPosts } from '@/platform/cms'
import { htmlToText, textResponse } from '@/platform/llms'

export const revalidate = 3600

/** Full articles inlined; older posts are still listed in /llms.txt. */
const MAX_FULL_POSTS = 20

/**
 * torqstudio.com/llms-full.txt — the whole site as one plain-text document: product facts,
 * pricing per industry, every FAQ and the full text of recent guides. /llms.txt is the index.
 */
export async function GET() {
  const [homeFaqs, posts] = await Promise.all([pageFaqs('home', HOME_FAQ), platformBlogPosts(MAX_FULL_POSTS)])
  const industries = await Promise.all(
    MARKETING_VERTICALS.map(async (v) => {
      const content = getVerticalLandingContent(v.key)
      return { v, content, faqs: await pageFaqs(`industry:${v.key}`, content.faq) }
    }),
  )
  const fullPosts = (await Promise.all(posts.map((p) => platformBlogPost(p.slug)))).filter((p) => p !== null)

  const lines = [
    `# ${PLATFORM_BRAND}`,
    '',
    `> ${HOME_DESCRIPTION}`,
    '',
    `Website: ${siteUrl('/')} · Pricing: ${siteUrl('/pricing')} · Contact: ${PLATFORM_CONTACT_EMAIL}`,
    '',
    '## Frequently asked questions',
    '',
    ...homeFaqs.flatMap((f) => [`### ${f.q}`, '', f.a, '']),
  ]

  for (const { v, content, faqs } of industries) {
    lines.push(
      `## ${PLATFORM_BRAND} for ${v.label}`,
      '',
      `URL: ${siteUrl(`/${v.marketingSlug}`)}${content.isEarlyAccess ? ' (early access)' : ''}`,
      '',
      `${content.title} ${content.titleAccent}`,
      '',
      content.subtitle,
      '',
      '### Problems it solves',
      '',
      ...content.pains.map((p) => `- **${p.title}:** ${p.body}`),
      '',
      '### What it includes',
      '',
      ...content.pillars.map((p) => `- **${p.title}:** ${p.body}`),
      '',
      '### Pricing (per month, INR, 14-day free trial)',
      '',
      ...marketingPlansForVertical(v.key).map((plan) => `- **${plan.label}** — ${formatPlanPriceInr(plan) ?? 'Custom'}: ${plan.description}`),
      '',
      '### FAQ',
      '',
      ...faqs.flatMap((f) => [`**${f.q}**`, f.a, '']),
    )
  }

  if (fullPosts.length) {
    lines.push('## Guides', '')
    for (const post of fullPosts) {
      lines.push(`### ${post.title}`, '', `URL: ${siteUrl(`/blog/${post.slug}`)}`, '', htmlToText(post.content ?? ''), '')
    }
  }

  return textResponse(lines)
}
