import React, { useMemo } from 'react'
import { Badge } from '../ui/badge'
import {
  META_DESC_OPTIMAL_MAX_CHARS,
  SEO_TITLE_OPTIMAL_MAX_CHARS,
  SERP_SNIPPET_PREVIEW_CHARS,
  SERP_TITLE_PREVIEW_CHARS,
} from '../blog/blog-seo-guidelines'

export type SeoLandingSerpPreviewProps = {
  title: string
  description: string
  url: string
  titleSource?: string
  descriptionSource?: string
  className?: string
}

export function SeoLandingSerpPreview({
  title,
  description,
  url,
  titleSource,
  descriptionSource,
  className,
}: SeoLandingSerpPreviewProps) {
  const preview = useMemo(() => {
    const rawTitle = title.trim()
    const titleShown =
      rawTitle.length === 0
        ? 'Add a title — it appears as the blue link in Google'
        : rawTitle.length <= SERP_TITLE_PREVIEW_CHARS
          ? rawTitle
          : `${rawTitle.slice(0, SERP_TITLE_PREVIEW_CHARS - 1)}…`

    const rawSnip = description.replace(/\s+/g, ' ').trim()
    const snipShown =
      rawSnip.length === 0
        ? 'Add a meta description — Google often shows it under the title (falls back to quick answer if empty).'
        : rawSnip.length <= SERP_SNIPPET_PREVIEW_CHARS
          ? rawSnip
          : `${rawSnip.slice(0, SERP_SNIPPET_PREVIEW_CHARS - 1)}…`

    const tabRaw = rawTitle
    const tabTitleShown =
      tabRaw.length === 0 ? '…' : tabRaw.length <= 58 ? tabRaw : `${tabRaw.slice(0, 56)}…`

    return {
      titleShown,
      snipShown,
      tabTitleShown,
      titleCharCount: rawTitle.length,
      snippetCharCount: rawSnip.length,
    }
  }, [title, description])

  const titleWarn = preview.titleCharCount > SEO_TITLE_OPTIMAL_MAX_CHARS
  const descWarn = preview.snippetCharCount > META_DESC_OPTIMAL_MAX_CHARS

  return (
    <div className={className}>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Google search preview
        </h3>
        <span className="text-[11px] text-muted-foreground tabular-nums">
          title {preview.titleCharCount} · snippet {preview.snippetCharCount}
        </span>
      </div>
      <p className="mb-3 text-xs text-muted-foreground leading-relaxed">
        Approximate desktop SERP listing. Live site uses custom SEO fields when set; otherwise page title and quick answer.
      </p>
      <div
        className="rounded-lg border border-border bg-card px-3 py-3 shadow-sm"
        style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}
      >
        <div className="text-base leading-tight text-[#1a0dab] line-clamp-2">{preview.titleShown}</div>
        <div className="mt-1 break-all text-xs leading-snug text-[#006621]">{url}</div>
        <div className="mt-1 line-clamp-3 text-xs leading-snug text-[#4d5156]">{preview.snipShown}</div>
      </div>
      <div className="mt-3 flex flex-col gap-1.5 rounded-lg border border-dashed border-border/80 bg-muted/20 px-3 py-2 text-xs">
        <span className="font-semibold uppercase tracking-wide text-muted-foreground">Browser tab</span>
        <span className="break-all font-mono text-foreground" title={title.trim() || undefined}>
          {preview.tabTitleShown}
        </span>
        {(titleSource || descriptionSource) && (
          <div className="flex flex-wrap gap-1.5 pt-0.5">
            {titleSource ? (
              <Badge variant="outline" className="text-[10px] font-normal">
                Title: {titleSource}
              </Badge>
            ) : null}
            {descriptionSource ? (
              <Badge variant="outline" className="text-[10px] font-normal">
                Snippet: {descriptionSource}
              </Badge>
            ) : null}
          </div>
        )}
      </div>
      {(titleWarn || descWarn) && (
        <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">
          {titleWarn ? `Title may truncate after ~${SEO_TITLE_OPTIMAL_MAX_CHARS} characters. ` : ''}
          {descWarn ? `Snippets often cut near ~${META_DESC_OPTIMAL_MAX_CHARS} characters.` : ''}
          Put the primary keyword early.
        </p>
      )}
    </div>
  )
}
