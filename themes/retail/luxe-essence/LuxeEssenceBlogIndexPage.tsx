'use client'

import Link from 'next/link'
import type { StorefrontConfig } from '@/lib/storefront-api'
import type { StorefrontBlogListItem } from '@/lib/cms-blog'
import type { ThemeTenant } from '../types'
import { LuxeEssenceLayoutPage } from './LuxeEssenceLayoutPage'

export function LuxeEssenceBlogIndexPage({
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
    <LuxeEssenceLayoutPage
      tenant={tenant}
      config={config}
      mainClassName="sf-page-shell sf-page-shell--narrow"
    >
      <p className="sf-page-eyebrow">Blog</p>
      <h1 className="sf-page-title">Guides &amp; updates</h1>
      <p className="sf-page-lead">Articles from {siteName}.</p>

      {posts.length === 0 ? (
        <p className="sf-page-lead le-blog-empty">New articles coming soon.</p>
      ) : (
        <ul className="le-blog-list">
          {posts.map((post) => (
            <li key={post.slug}>
              <Link href={`/blog/${post.slug}`} className="le-blog-card">
                <div className="le-blog-card-meta">
                  <span>{post.category}</span>
                  <span aria-hidden>·</span>
                  <span>{post.readingTime} min read</span>
                </div>
                <h2 className="le-blog-card-title">{post.title}</h2>
                {post.description ? <p className="le-blog-card-desc">{post.description}</p> : null}
                <span className="le-blog-card-cta">Read article</span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <nav className="le-policy-links" aria-label="Related links">
        <Link href="/">Back to store</Link>
        <Link href="/products">Shop all</Link>
        <Link href="/about">About</Link>
      </nav>
    </LuxeEssenceLayoutPage>
  )
}
