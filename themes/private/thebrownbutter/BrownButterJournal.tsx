import Link from 'next/link'
import type { StorefrontBlogListItem, StorefrontBlogPost } from '@/lib/cms-blog'
import type { StorefrontNavLink } from '@/lib/cms-content'
import type { StorefrontConfig } from '@/lib/storefront-api'
import type { ThemeTenant } from '@/themes/restaurant/types'
import { BrownButterFrame } from './BrownButterFrame'
import { BrownButterOrderCard, BrownButterPageIntro, normalizeProseHtml } from './BrownButterPageParts'

function categoryLabel(raw: StorefrontBlogPost['category']): string {
  if (!raw) return ''
  if (typeof raw === 'string') return raw
  return raw.name?.trim() || ''
}

/** Fixed locale + zone so server and client render the same string. */
function formatDate(iso?: string): string | null {
  if (!iso) return null
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return null
  return new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' }).format(d)
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
      <div className="bb-page-body">
        <BrownButterPageIntro
          crumbs={[{ label: 'The Cookie Journal' }]}
          kicker="The Cookie Journal"
          title="Stories from the batch"
          lead="Baking notes, flavour drops, and how we pack a tin."
        />
        {posts.length === 0 ? (
          <p className="bb-empty">New stories are cooling on the rack. Check back soon.</p>
        ) : (
          <ul className="bb-journal-grid">
            {posts.map((post) => {
              const date = formatDate(post.date)
              return (
                <li key={post.slug}>
                  <Link href={`/blog/${post.slug}`} className="bb-journal-card">
                    <span className={`bb-journal-card__media${post.image ? '' : ' is-empty'}`}>
                      {post.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={post.image} alt={post.imageAlt || ''} loading="lazy" />
                      ) : (
                        <span aria-hidden>🍪</span>
                      )}
                    </span>
                    <span className="bb-journal-card__body">
                      <span className="bb-journal-meta">
                        {[post.category, date, `${post.readingTime} min read`].filter(Boolean).join(' · ')}
                      </span>
                      <h2>{post.title}</h2>
                      {post.description && post.description !== post.title ? <p>{post.description}</p> : null}
                      <span className="bb-journal-more">Read story →</span>
                    </span>
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
      </div>
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
  const siteName = config?.branding?.siteName || tenant.name
  const logoUrl = config?.branding?.logoUrl || tenant.logoUrl || undefined
  const date = formatDate(post.publishedAt || post.updatedAt)
  const meta = [date, post.readingTime ? `${post.readingTime} min read` : null].filter(Boolean).join(' · ')

  return (
    <BrownButterFrame {...frameProps(tenant, config, navLinks)}>
      <div className="bb-page-body">
        <BrownButterPageIntro
          crumbs={[{ label: 'The Cookie Journal', href: '/blog' }, { label: post.title }]}
          kicker={category || 'The Cookie Journal'}
          title={post.title}
          meta={meta || undefined}
          lead={post.excerpt && post.excerpt !== post.title ? post.excerpt : undefined}
        />
        <div className="bb-read">
          <article className="bb-paper">
            {post.featuredImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                className="bb-journal-hero"
                src={post.featuredImage}
                alt={post.featuredImageAlt || post.title}
              />
            ) : null}
            {post.content?.trim() ? (
              <div className="bb-prose" dangerouslySetInnerHTML={{ __html: normalizeProseHtml(post.content) }} />
            ) : (
              <p className="bb-empty">This story is still being written.</p>
            )}
            <p className="bb-paper__back">
              <Link href="/blog">← More from The Cookie Journal</Link>
            </p>
          </article>
          <BrownButterOrderCard config={config} siteName={siteName} logoUrl={logoUrl} />
        </div>
      </div>
    </BrownButterFrame>
  )
}
