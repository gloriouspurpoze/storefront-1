'use client'

/** Strip risky tags/attrs from CMS HTML (trusted admin source). */
function sanitizeMarketingHtml(html: string): string {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    .replace(/\s+on\w+="[^"]*"/gi, '')
    .replace(/\s+on\w+='[^']*'/gi, '')
    .replace(/javascript:/gi, '')
}

type Props = {
  html: string
  className?: string
}

/** Renders CMS category-marketing rich text safely. */
export function SanitizedMarketingHtml({ html, className }: Props) {
  const raw = (html ?? '').trim()
  if (!raw) return null
  if (!raw.includes('<')) {
    return <div className={className}>{raw}</div>
  }
  const safe = sanitizeMarketingHtml(raw)
  if (!safe.trim()) return null
  return (
    <div
      className={className}
      // eslint-disable-next-line react/no-danger -- sanitized CMS HTML
      dangerouslySetInnerHTML={{ __html: safe }}
    />
  )
}
