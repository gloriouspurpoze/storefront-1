import Link from 'next/link'
import type { StorefrontBlogListItem, StorefrontBlogPost } from '@/lib/cms-blog'
import type { StorefrontNavLink } from '@/lib/cms-content'
import type { StorefrontConfig } from '@/lib/storefront-api'
import type { ThemeTenant } from '@/themes/restaurant/types'
import { BrownButterFrame } from './BrownButterFrame'

function categoryLabel(raw: StorefrontBlogPost['category']): string {
  if (!raw) return ''
  if (typeof raw === 'string') return raw
  return raw.name?.trim() || ''
}

function frameProps(
  tenant: ThemeTenant,
  config: StorefrontConfig | null,
  navLinks?: StorefrontNavLink[],
) {
  return {
    config,
    navLinks,
    headerTitle: config?.branding?.siteName || tenant.name,
    contactPhone: config?.branding?.contactPhone,
  }
}

export function BrownButterJournalIndex({
  tenant,
  config,
  navLinks,
  posts,
}: {
  tenant: ThemeTenant
  config: StorefrontConfig | null
  navLinks?: StorefrontNavLink[]
  posts: StorefrontBlogListItem[]
}) {
  return (
    <BrownButterFrame {...frameProps(tenant, config, navLinks)}>
      <section className="bb-journal">
        <p className="bb-kicker">The Cookie Journal</p>
        <h1 className="bb-page-title">Stories from the batch</h1>
        <p className="bb-lead">Baking notes, flavour drops, and how we pack a tin.</p>
        {posts.length === 0 ? (
          <p className="bb-empty">New stories are cooling on the rack. Check back soon.</p>
        ) : (
          <ul className="bb-journal-list">
            {posts.map((post) => (
              <li key={post.slug}>
                <Link href={`/blog/${post.slug}`} className="bb-journal-card">
                  <p className="bb-journal-meta">
                    <span>{post.category}</span>
                    <span aria-hidden>·</span>
                    <span>{post.readingTime} min read</span>
                  </p>
                  <h2>{post.title}</h2>
                  {post.description ? <p>{post.description}</p> : null}
                  <span className="bb-journal-more">Read story</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </BrownButterFrame>
  )
}

export function BrownButterJournalArticle({
  tenant,
  config,
  navLinks,
  post,
}: {
  tenant: ThemeTenant
  config: StorefrontConfig | null
  navLinks?: StorefrontNavLink[]
  post: StorefrontBlogPost
}) {
  const category = categoryLabel(post.category)
  return (
    <BrownButterFrame {...frameProps(tenant, config, navLinks)}>
      <article className="bb-journal bb-journal-article">
        <Link href="/blog" className="bb-back">
          ← The Cookie Journal
        </Link>
        {category ? <p className="bb-kicker">{category}</p> : null}
        <h1 className="bb-page-title">{post.title}</h1>
        {post.excerpt ? <p className="bb-lead">{post.excerpt}</p> : null}
        {post.featuredImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            className="bb-journal-hero"
            src={post.featuredImage}
            alt={post.featuredImageAlt || post.title}
          />
        ) : null}
        {post.content?.trim() ? (
          <div className="bb-prose" dangerouslySetInnerHTML={{ __html: post.content }} />
        ) : (
          <p className="bb-empty">This story is still being written.</p>
        )}
      </article>
    </BrownButterFrame>
  )
}
