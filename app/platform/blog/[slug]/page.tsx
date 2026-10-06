import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { PLATFORM_BRAND, signupUrl, siteUrl } from '@/platform/config'
import { platformBlogPost, sanitizeCmsHtml } from '@/platform/cms'
import { pageMetadata, truncate } from '@/platform/seo'
import { CtaBand } from '@/platform/components/CtaBand'
import { Header } from '@/platform/components/Header'
import { JsonLd } from '@/platform/components/JsonLd'
import { Container } from '@/platform/components/Section'

export const revalidate = 180

type RouteParams = { params: Promise<{ slug: string }> }

function authorName(raw: unknown): string {
  if (typeof raw === 'string' && raw.trim()) return raw.trim()
  if (raw && typeof raw === 'object' && 'name' in raw && typeof raw.name === 'string' && raw.name.trim()) return raw.name.trim()
  return `${PLATFORM_BRAND} team`
}

export async function generateMetadata({ params }: RouteParams): Promise<Metadata> {
  const { slug } = await params
  const post = await platformBlogPost(slug)
  if (!post) return { title: 'Article not found', robots: { index: false } }
  const meta = pageMetadata({
    title: post.seo?.metaTitle || post.seo?.title || post.title,
    description: truncate(post.seo?.description || post.excerpt || post.title),
    path: `/blog/${slug}`,
    ogTitle: post.title,
    eyebrow: `${PLATFORM_BRAND} blog`,
    type: 'article',
  })
  return {
    ...meta,
    openGraph: {
      ...meta.openGraph,
      type: 'article',
      publishedTime: post.publishedAt,
      modifiedTime: post.updatedAt,
      authors: [authorName(post.author)],
    },
  }
}

const dateFmt = new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Kolkata' })

export default async function BlogPostPage({ params }: RouteParams) {
  const { slug } = await params
  const post = await platformBlogPost(slug)
  if (!post) notFound()

  const url = siteUrl(`/blog/${slug}`)
  const published = post.publishedAt || post.updatedAt
  const updated = post.updatedAt || post.publishedAt
  const author = authorName(post.author)

  return (
    <>
      <JsonLd
        data={[
          {
            '@context': 'https://schema.org',
            '@type': 'Article',
            headline: post.title,
            description: post.excerpt || post.seo?.description,
            image: post.featuredImage ? [post.featuredImage] : undefined,
            datePublished: published,
            dateModified: updated,
            author: { '@type': typeof post.author === 'object' ? 'Person' : 'Organization', name: author },
            publisher: { '@id': siteUrl('/#organization') },
            mainEntityOfPage: url,
          },
          {
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
              { '@type': 'ListItem', position: 1, name: PLATFORM_BRAND, item: siteUrl('/') },
              { '@type': 'ListItem', position: 2, name: 'Blog', item: siteUrl('/blog') },
              { '@type': 'ListItem', position: 3, name: post.title, item: url },
            ],
          },
        ]}
      />
      <Header />
      <main>
        <Container className="max-w-3xl py-16 sm:py-24">
          <a href="/blog" className="text-sm font-medium text-tq-muted hover:text-tq-ink">
            ← All articles
          </a>
          <article className="mt-6">
            <h1 className="text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">{post.title}</h1>
            <p className="mt-4 text-sm text-tq-muted">
              By {author}
              {published ? (
                <>
                  {' · '}
                  <time dateTime={published}>{dateFmt.format(new Date(published))}</time>
                </>
              ) : null}
              {updated && updated !== published ? (
                <>
                  {' · Updated '}
                  <time dateTime={updated}>{dateFmt.format(new Date(updated))}</time>
                </>
              ) : null}
            </p>
            {post.excerpt ? <p className="mt-6 text-lg text-tq-muted">{post.excerpt}</p> : null}
            {post.featuredImage ? (
              // eslint-disable-next-line @next/next/no-img-element -- CMS images live on arbitrary hosts
              <img src={post.featuredImage} alt={post.featuredImageAlt || post.title} className="mt-8 w-full rounded-2xl object-cover" />
            ) : null}
            <div className="tq-prose mt-10" dangerouslySetInnerHTML={{ __html: sanitizeCmsHtml(post.content) }} />
          </article>
        </Container>
        <CtaBand trialHref={signupUrl()} />
      </main>
    </>
  )
}
