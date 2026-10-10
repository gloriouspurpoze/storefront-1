import { MARKETING_VERTICALS } from '@profixer/marketing-data'
import { PLATFORM_BRAND, siteUrl } from '@/platform/config'
import { HOME_DESCRIPTION, HOME_FAQ } from '@/platform/content/home'
import { pageFaqs, platformBlogPosts } from '@/platform/cms'

export const revalidate = 3600

/** torqstudio.com/llms.txt — a plain-text map of the site for AI assistants (llmstxt.org format). */
export async function GET() {
  const [posts, faqs] = await Promise.all([platformBlogPosts(50), pageFaqs('home', HOME_FAQ)])
  const lines = [
    `# ${PLATFORM_BRAND}`,
    '',
    `> ${HOME_DESCRIPTION}`,
    '',
    '## Product',
    `- [Home](${siteUrl('/')}): what ${PLATFORM_BRAND} does and who it is for`,
    `- [Pricing](${siteUrl('/pricing')}): monthly plans in INR, 14-day free trial, no credit card`,
    '',
    '## Industries',
    ...MARKETING_VERTICALS.map((v) => `- [${PLATFORM_BRAND} for ${v.label}](${siteUrl(`/${v.marketingSlug}`)}): ${v.description}`),
    '',
    '## FAQ',
    ...faqs.map((f) => `- ${f.q} ${f.a}`),
  ]
  if (posts.length) {
    lines.push('', '## Guides', ...posts.map((p) => `- [${p.title}](${siteUrl(`/blog/${p.slug}`)})${p.description ? `: ${p.description}` : ''}`))
  }
  return new Response(`${lines.join('\n')}\n`, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'public, max-age=0, s-maxage=3600' },
  })
}
