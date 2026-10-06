/** FAQ as native <details> — readable without JavaScript, by people and crawlers alike. */
export function Faq({ items }: { items: readonly { q: string; a: string }[] }) {
  return (
    <div className="mx-auto mt-10 max-w-3xl divide-y divide-tq-line rounded-2xl border border-tq-line bg-white">
      {items.map((item) => (
        <details key={item.q} className="group px-6 py-5">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold text-tq-ink [&::-webkit-details-marker]:hidden">
            <h3 className="text-base">{item.q}</h3>
            <span className="text-xl leading-none text-tq-muted transition-transform group-open:rotate-45" aria-hidden>
              +
            </span>
          </summary>
          <p className="mt-3 text-sm leading-relaxed text-tq-muted">{item.a}</p>
        </details>
      ))}
    </div>
  )
}

export function faqJsonLd(items: readonly { q: string; a: string }[]): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: { '@type': 'Answer', text: item.a },
    })),
  }
}
