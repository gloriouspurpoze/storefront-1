import type { StorefrontConfig } from '@/lib/storefront-api'
import type { StorefrontBlogPost } from '@/lib/cms-blog'
import type { ThemeTenant } from '../types'
import { MenuFastCardsContentShell } from './MenuFastCardsContentShell'

function categoryLabel(raw: StorefrontBlogPost['category']): string {
  if (!raw) return 'General'
  if (typeof raw === 'string') return raw
  return raw.name?.trim() || 'General'
}

export function MenuFastCardsBlogArticlePage({
  tenant,
  config,
  post,
}: {
  tenant: ThemeTenant
  config: StorefrontConfig | null
  post: StorefrontBlogPost
}) {
  const html = post.content?.trim()

  return (
    <MenuFastCardsContentShell
      tenant={tenant}
      config={config}
      title="Blog"
      backHref="/blog"
      backLabel="← Blog"
    >
      <article className="mf-cards-content-article">
        <p className="mf-cards-content-muted mf-cards-blog-eyebrow">{categoryLabel(post.category)}</p>
        <h2 className="mf-cards-content-heading">{post.title}</h2>
        {post.excerpt?.trim() ? <p className="mf-cards-content-muted">{post.excerpt.trim()}</p> : null}
        {post.featuredImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={post.featuredImage}
            alt={post.featuredImageAlt || post.title}
            className="mf-cards-blog-hero"
          />
        ) : null}
        {html ? (
          <div
            className="mf-cards-content-prose prose prose-neutral max-w-none"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        ) : null}
      </article>
    </MenuFastCardsContentShell>
  )
}
