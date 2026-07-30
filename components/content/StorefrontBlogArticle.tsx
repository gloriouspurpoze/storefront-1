import Link from 'next/link'
import type { StorefrontBlogPost } from '@/lib/cms-blog'

function categoryLabel(raw: StorefrontBlogPost['category']): string {
  if (!raw) return 'General'
  if (typeof raw === 'string') return raw
  return raw.name?.trim() || 'General'
}

type Props = {
  /** Kept for call-site compatibility; public URLs are host-rewritten. */
  tenantId?: string
  post: StorefrontBlogPost
}

export function StorefrontBlogArticle({ post }: Props) {
  return (
    <main className="sf-page-shell mx-auto max-w-3xl">
      <Link href="/blog" className="text-sm opacity-70 hover:opacity-100">
        ← Back to blog
      </Link>
      <article className="mt-6">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] opacity-70">
          {categoryLabel(post.category)}
        </p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">{post.title}</h1>
        {post.excerpt ? <p className="mt-4 text-lg opacity-85">{post.excerpt}</p> : null}
        {post.featuredImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={post.featuredImage}
            alt={post.featuredImageAlt || post.title}
            className="mt-8 w-full rounded-xl object-cover"
          />
        ) : null}
        <div
          className="prose prose-neutral mt-8 max-w-none dark:prose-invert"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />
      </article>
    </main>
  )
}
