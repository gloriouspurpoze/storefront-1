import type { StorefrontCmsPage } from '@/lib/cms-pages'

/** Renders a published CMS static page body (About, policies, etc.). */
export function StorefrontCmsPageArticle({
  page,
  className,
  eyebrow,
}: {
  page: StorefrontCmsPage
  className?: string
  /** Small label above the title (defaults from slug). */
  eyebrow?: string
}) {
  const html = page.content?.trim()
  const label = eyebrow?.trim() || page.slug?.replace(/-/g, ' ').trim() || 'Page'
  return (
    <article className={className}>
      <p className="text-xs font-semibold uppercase tracking-[0.3em] opacity-70">{label}</p>
      <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">{page.title}</h1>
      {page.excerpt?.trim() ? (
        <p className="mt-4 max-w-prose text-lg opacity-85">{page.excerpt.trim()}</p>
      ) : null}
      {html ? (
        <div
          className="prose prose-neutral mt-8 max-w-none dark:prose-invert"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      ) : null}
    </article>
  )
}
