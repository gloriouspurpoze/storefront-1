import Link from 'next/link'
import type { StorefrontBlogListItem } from '@/lib/cms-blog'

type Props = {
  tenantId: string
  siteName: string
  posts: StorefrontBlogListItem[]
}

export function StorefrontBlogIndex({ tenantId, siteName, posts }: Props) {
  const base = `/sites/${tenantId}/blog`

  return (
    <main className="sf-page-shell">
      <p className="text-xs font-semibold uppercase tracking-[0.25em] opacity-70">Blog</p>
      <h1 className="sf-page-title mt-2">Guides &amp; updates</h1>
      <p className="sf-page-lead mt-3 max-w-2xl">
        Articles from {siteName} — tips, stories, and category guides linked from your storefront SEO.
      </p>

      {posts.length === 0 ? (
        <p className="mt-10 text-sm opacity-70">New articles coming soon.</p>
      ) : (
        <ul className="mt-10 grid gap-4 sm:grid-cols-2">
          {posts.map((post) => (
            <li key={post.slug}>
              <Link
                href={`${base}/${post.slug}`}
                className="flex h-full flex-col rounded-xl border border-border/60 bg-card p-5 shadow-sm transition hover:border-border"
              >
                <div className="flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-wide opacity-70">
                  <span>{post.category}</span>
                  <span aria-hidden>·</span>
                  <span>{post.readingTime} min read</span>
                </div>
                <h2 className="mt-2 text-lg font-semibold leading-snug">{post.title}</h2>
                {post.description ? (
                  <p className="mt-2 flex-1 text-sm leading-relaxed opacity-80">{post.description}</p>
                ) : null}
                <span className="mt-4 text-sm font-medium underline-offset-2 hover:underline">Read article</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}
