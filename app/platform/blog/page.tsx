import { PLATFORM_BRAND, siteUrl } from '@/platform/config'
import { platformBlogPosts, platformSeoOverride } from '@/platform/cms'
import { pageMetadata } from '@/platform/seo'
import { JsonLd } from '@/platform/components/JsonLd'
import { Header } from '@/platform/components/Header'
import { Container, SectionTitle } from '@/platform/components/Section'

export const revalidate = 120

export async function generateMetadata() {
  return pageMetadata({
    title: 'Blog — guides for growing service and retail businesses',
    description: `Practical guides from ${PLATFORM_BRAND} on bookings, CRM, online storefronts, GST billing and running a growing business in India.`,
    path: '/blog',
    ogTitle: `The ${PLATFORM_BRAND} blog`,
    override: await platformSeoOverride('/blog'),
  })
}

const dateFmt = new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' })

export default async function BlogIndexPage() {
  const posts = await platformBlogPosts()
  return (
    <>
      <JsonLd
        data={[
          {
            '@context': 'https://schema.org',
            '@type': 'Blog',
            '@id': siteUrl('/blog#blog'),
            name: `${PLATFORM_BRAND} blog`,
            url: siteUrl('/blog'),
            inLanguage: 'en-IN',
            publisher: { '@id': siteUrl('/#organization') },
            blogPost: posts.map((post) => ({
              '@type': 'BlogPosting',
              headline: post.title,
              url: siteUrl(`/blog/${post.slug}`),
              datePublished: post.date,
              ...(post.description ? { description: post.description } : {}),
            })),
          },
          {
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
              { '@type': 'ListItem', position: 1, name: PLATFORM_BRAND, item: siteUrl('/') },
              { '@type': 'ListItem', position: 2, name: 'Blog', item: siteUrl('/blog') },
            ],
          },
        ]}
      />
      <Header />
      <main>
        <Container className="py-16 sm:py-24">
          <SectionTitle as="h1" eyebrow="Blog" title="Guides for growing businesses" />
          {posts.length ? (
            <ul className="mx-auto mt-14 grid max-w-5xl gap-6 md:grid-cols-2">
              {posts.map((post) => (
                <li key={post.slug} className="rounded-2xl border border-tq-line p-6 transition-shadow hover:shadow-md">
                  <p className="text-xs font-semibold uppercase tracking-wide text-tq-primary">{post.category}</p>
                  <h2 className="mt-2 text-xl font-semibold tracking-tight">
                    <a href={`/blog/${post.slug}`} className="hover:text-tq-primary">
                      {post.title}
                    </a>
                  </h2>
                  {post.description ? <p className="mt-2 text-sm text-tq-muted">{post.description}</p> : null}
                  <p className="mt-4 text-xs text-tq-muted">
                    <time dateTime={post.date}>{dateFmt.format(new Date(post.date))}</time> · {post.readingTime} min read
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-14 text-center text-tq-muted">New articles are on the way.</p>
          )}
        </Container>
      </main>
    </>
  )
}
