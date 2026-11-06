/**
 * Structured data rendered into the server HTML.
 *
 * Do not use `next/script` for JSON-LD: with `afterInteractive` it is injected by
 * client JS, so crawlers that don't run JavaScript (GPTBot, ClaudeBot,
 * PerplexityBot, most link unfurlers) never see it.
 */
type JsonLdData = Record<string, unknown> | Array<Record<string, unknown>>

/** JSON for an inline <script>: escape `<` so CMS text can't close the tag. */
export function serializeJsonLd(data: JsonLdData): string {
  return JSON.stringify(data).replace(/</g, '\\u003c')
}

export function JsonLd({ data, id }: { data: JsonLdData | null | undefined; id?: string }) {
  if (!data || (Array.isArray(data) && data.length === 0)) return null
  return (
    <script
      id={id}
      type="application/ld+json"
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }}
    />
  )
}
