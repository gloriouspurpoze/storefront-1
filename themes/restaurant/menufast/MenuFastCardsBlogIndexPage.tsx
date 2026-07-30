import Link from 'next/link'
import type { StorefrontConfig } from '@/lib/storefront-api'
import type { StorefrontBlogListItem } from '@/lib/cms-blog'
import type { ThemeTenant } from '../types'
import { MenuFastCardsContentShell } from './MenuFastCardsContentShell'

export function MenuFastCardsBlogIndexPage({
  tenant,
  config,
  siteName,
  posts,
}: {
  tenant: ThemeTenant
  config: StorefrontConfig | null
  siteName: string
  posts: StorefrontBlogListItem[]
}) {
  return (
    <MenuFastCardsContentShell tenant={tenant} config={config} title="Blog">
      <article className="mf-cards-content-article">
        <h2 className="mf-cards-content-heading">Guides &amp; updates</h2>
        <p className="mf-cards-content-muted">Stories and tips from {siteName}.</p>

        {posts.length === 0 ? (
          <p className="mf-cards-content-muted mf-cards-blog-empty">New articles coming soon.</p>
        ) : (
          <ul className="mf-cards-blog-list">
            {posts.map((post) => (
              <li key={post.slug}>
                <Link href={`/blog/${post.slug}`} className="mf-cards-blog-card">
                  <div className="mf-cards-blog-card-meta">
                    <span>{post.category}</span>
                    <span aria-hidden>·</span>
                    <span>{post.readingTime} min</span>
                  </div>
                  <h3 className="mf-cards-blog-card-title">{post.title}</h3>
                  {post.description ? (
                    <p className="mf-cards-blog-card-desc">{post.description}</p>
                  ) : null}
                  <span className="mf-cards-blog-card-cta">Read article</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </article>
    </MenuFastCardsContentShell>
  )
}
