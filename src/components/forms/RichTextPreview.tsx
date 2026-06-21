import React, { useMemo, useState } from 'react'
import { ChevronDown, ChevronUp, Eye } from 'lucide-react'
import { cn } from '../../lib/utils'
import { cmsRichImageLayoutCss } from '../../lib/quillCmsImage'
import { quickAnswerFloatImageCss } from '../../lib/quickAnswerFloatImageCss'
import {
  prepareRichTextPreviewHtml,
  sanitizeRichTextPreviewHtml,
  type RichTextPreviewVariant,
} from '../../lib/richTextPreviewSanitize'
import { Button } from '../ui/button'

const PREVIEW_SCOPE = 'rich-text-live-preview'

const TABLE_PREVIEW_CSS = `
  .${PREVIEW_SCOPE} table {
    border-collapse: collapse;
    width: 100%;
    margin: 0.75rem 0;
    font-size: inherit;
  }
  .${PREVIEW_SCOPE} td,
  .${PREVIEW_SCOPE} th {
    border: 1px solid hsl(var(--border));
    padding: 0.5rem 0.6rem;
    min-width: 3rem;
    vertical-align: top;
  }
  .${PREVIEW_SCOPE} th {
    background: hsl(var(--muted));
    font-weight: 600;
  }
`

const QUICK_ANSWER_WRAP_CSS = `
  .quick-answer-preview-wrap {
    overflow: hidden;
    border-radius: 0.75rem;
    border: 1px solid hsl(var(--border) / 0.6);
    background: hsl(var(--card));
    padding: 1rem 1.25rem;
    box-shadow: 0 1px 2px rgb(0 0 0 / 0.04);
  }
  .quick-answer-preview-wrap .quick-answer-preview-label {
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: hsl(var(--primary) / 0.7);
    margin-bottom: 0.5rem;
  }
`

function previewProseClass(variant: RichTextPreviewVariant): string {
  switch (variant) {
    case 'compact':
      return cn(
        PREVIEW_SCOPE,
        'prose prose-sm max-w-none dark:prose-invert',
        'text-sm leading-relaxed text-foreground',
        'prose-p:my-0 prose-strong:text-foreground [&_p+p]:mt-2',
        '[&_a]:text-primary [&_a]:underline',
      )
    case 'marketing':
      return cn(
        PREVIEW_SCOPE,
        'cms-consumer-preview prose prose-sm max-w-none dark:prose-invert',
        'text-sm leading-relaxed text-muted-foreground',
        '[&_a]:text-primary [&_a]:underline',
      )
    case 'quick-answer':
      return cn(
        PREVIEW_SCOPE,
        'quick-answer-preview-wrap quick-answer-rich',
        'prose prose-sm max-w-none dark:prose-invert',
        'text-base leading-[1.72] text-foreground',
        'prose-p:my-0 prose-strong:text-foreground [&_p+p]:mt-3 [&_img]:my-0',
      )
    default:
      return cn(
        PREVIEW_SCOPE,
        'prose prose-sm max-w-none dark:prose-invert',
        'text-sm leading-relaxed text-foreground',
        'prose-headings:font-semibold prose-headings:text-foreground',
        'prose-strong:text-foreground',
        '[&_a]:text-primary [&_a]:underline',
        '[&_img]:my-3 [&_img]:max-w-full [&_img]:rounded-md [&_img]:h-auto',
      )
  }
}

export type RichTextPreviewProps = {
  html: string
  variant?: RichTextPreviewVariant
  /** Optional chrome above preview body (e.g. page heading). */
  context?: React.ReactNode
  className?: string
  /** Show expand/collapse control. Default true. */
  collapsible?: boolean
  /** Initial expanded state when collapsible. Default true. */
  defaultOpen?: boolean
}

/** Live consumer-style preview for Quill rich text fields. */
export function RichTextPreview({
  html,
  variant = 'default',
  context,
  className,
  collapsible = true,
  defaultOpen = true,
}: RichTextPreviewProps) {
  const [open, setOpen] = useState(defaultOpen)

  const safeHtml = useMemo(() => {
    const prepared = prepareRichTextPreviewHtml(html, variant)
    return sanitizeRichTextPreviewHtml(prepared)
  }, [html, variant])

  const hasContent = Boolean(safeHtml.trim() || html.replace(/<[^>]*>/g, '').trim())

  if (!hasContent && !context) return null

  const body = (
    <div className={cn('rounded-lg border border-dashed border-primary/30 bg-muted/20 p-3', className)}>
      <p className="mb-2 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
        <Eye className="h-3 w-3" aria-hidden />
        Live preview
      </p>
      {context ? <div className="mb-3">{context}</div> : null}
      {safeHtml.trim() ? (
        variant === 'quick-answer' ? (
          <div className="quick-answer-preview-wrap">
            <p className="quick-answer-preview-label">Quick answer</p>
            <style>
              {QUICK_ANSWER_WRAP_CSS}
              {quickAnswerFloatImageCss('quick-answer-rich')}
            </style>
            <div
              className={cn(
                'quick-answer-rich',
                'text-base leading-[1.72] text-foreground',
                '[&_strong]:font-semibold [&_a]:text-primary [&_a]:underline',
              )}
              // eslint-disable-next-line react/no-danger -- admin-only; DOMPurify sanitized
              dangerouslySetInnerHTML={{ __html: safeHtml }}
            />
          </div>
        ) : (
          <>
            <style>
              {TABLE_PREVIEW_CSS}
              {cmsRichImageLayoutCss(PREVIEW_SCOPE)}
            </style>
            <div
              className={previewProseClass(variant)}
              // eslint-disable-next-line react/no-danger -- admin-only; DOMPurify sanitized
              dangerouslySetInnerHTML={{ __html: safeHtml }}
            />
          </>
        )
      ) : (
        <p className="text-xs italic text-muted-foreground">Nothing to preview yet — start typing above.</p>
      )}
    </div>
  )

  if (!collapsible) return body

  return (
    <div className="mt-3 space-y-2">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-7 gap-1 px-2 text-xs text-muted-foreground"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        {open ? <ChevronUp className="h-3.5 w-3.5" aria-hidden /> : <ChevronDown className="h-3.5 w-3.5" aria-hidden />}
        {open ? 'Hide preview' : 'Show live preview'}
      </Button>
      {open ? body : null}
    </div>
  )
}

export default RichTextPreview
