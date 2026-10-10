import { siteUrl } from '@/platform/config'

/**
 * torqstudio.com/robots.txt. Search and AI crawlers are named explicitly so a future
 * blanket rule can't silently block them; Google-Extended / GPTBot govern AI training
 * and answer use, OAI-SearchBot / PerplexityBot / ClaudeBot power AI search citations, and
 * CCBot (Common Crawl) feeds many open models.
 */
const ALLOWED_AGENTS = [
  'Googlebot',
  'Bingbot',
  'Google-Extended',
  'GPTBot',
  'OAI-SearchBot',
  'ChatGPT-User',
  'ClaudeBot',
  'Claude-SearchBot',
  'PerplexityBot',
  'Perplexity-User',
  'Applebot',
  'Applebot-Extended',
  'CCBot',
  'Amazonbot',
  'DuckAssistBot',
  'meta-externalagent',
  'MistralAI-User',
]

export function GET() {
  const blocks = [...ALLOWED_AGENTS, '*'].map((agent) => `User-agent: ${agent}\nAllow: /\nDisallow: /api/\n`)
  const body = `${blocks.join('\n')}\nSitemap: ${siteUrl('/sitemap.xml')}\n`
  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400',
    },
  })
}
