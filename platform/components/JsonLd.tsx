/**
 * Structured data rendered into the server HTML (not injected after hydration),
 * so crawlers and AI fetchers that don't run JavaScript still read it.
 */
export function JsonLd({ data }: { data: Record<string, unknown> | Array<Record<string, unknown>> }) {
  const json = JSON.stringify(data).replace(/</g, '\\u003c')
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />
}
