import { MARKETING_VERTICALS } from '@profixer/marketing-data'
import { siteUrl } from '@/platform/config'
import { platformBlogPosts, platformSeoOverride } from '@/platform/cms'
import { pageLastmod } from '@/platform/pageLastmod'

export const revalidate = 300

type Entry = { path: string; lastModified?: string; priority: number }

function xmlEscape(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

const STATIC_PAGES = [
  { path: '/', priority: 1 },
  { path: '/pricing', priority: 0.9 },
  ...MARKETING_VERTICALS.map((v) => ({ path: `/${v.marketingSlug}`, priority: 0.8 })),
]

/**
 * torqstudio.com/sitemap.xml — hand-built pages plus every published blog post from the CMS.
 * Hand-built pages carry their real last content change (see `platform/pageLastmod.ts`).
 */
export async function GET() {
  const [posts, seo] = await Promise.all([
    platformBlogPosts(500),
    Promise.all(STATIC_PAGES.map((p) => platformSeoOverride(p.path))),
  ])
  const entries: Entry[] = [
    ...STATIC_PAGES.map((p, i) => ({ ...p, lastModified: pageLastmod(p.path, seo[i]?.updatedAt) })),
    { path: '/blog', priority: 0.7, lastModified: posts[0]?.date },
    ...posts.map((p) => ({ path: `/blog/${p.slug}`, priority: 0.6, lastModified: p.date })),
  ]
  const urls = entries
    .map((e) => {
      const lastmod = e.lastModified ? `<lastmod>${new Date(e.lastModified).toISOString()}</lastmod>` : ''
      return `<url><loc>${xmlEscape(siteUrl(e.path))}</loc>${lastmod}<priority>${e.priority}</priority></url>`
    })
    .join('')
  const xml = `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`
  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=0, s-maxage=300, stale-while-revalidate=600',
    },
  })
}
