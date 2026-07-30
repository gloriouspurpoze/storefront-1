'use client'

import Link from 'next/link'
import type { StorefrontConfig } from '@/lib/storefront-api'
import type { StorefrontBlogPost } from '@/lib/cms-blog'
import type { ThemeTenant } from '../types'
import { LuxeEssenceLayoutPage } from './LuxeEssenceLayoutPage'

function categoryLabel(raw: StorefrontBlogPost['category']): string {
  if (!raw) return 'General'
  if (typeof raw === 'string') return raw
  return raw.name?.trim() || 'General'
}

export function LuxeEssenceBlogArticlePage({
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
    <LuxeEssenceLayoutPage
      tenant={tenant}
      config={config}
      mainClassName="sf-page-shell sf-page-shell--narrow"
    >
      <Link href="/blog" className="le-blog-back">
        ← Back to blog
      </Link>
      <p className="sf-page-eyebrow">{categoryLabel(post.category)}</p>
      <h1 className="sf-page-title">{post.title}</h1>
      {post.excerpt?.trim() ? <p className="sf-page-lead">{post.excerpt.trim()}</p> : null}
      {post.featuredImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={post.featuredImage}
          alt={post.featuredImageAlt || post.title}
          className="le-blog-hero"
        />
      ) : null}
      {html ? (
        <div
          className="prose prose-neutral mt-6 max-w-none"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      ) : null}
      <nav className="le-policy-links" aria-label="Related links">
        <Link href="/blog">All articles</Link>
        <Link href="/">Back to store</Link>
        <Link href="/contact">Contact</Link>
      </nav>
    </LuxeEssenceLayoutPage>
  )
}
