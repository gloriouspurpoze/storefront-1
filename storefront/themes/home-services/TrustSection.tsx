/** Social-proof / trust strip — same shape every page can drop in. */
export function TrustSection() {
  const stats = [
    { value: '4.8★', label: 'Average rating' },
    { value: '10k+', label: 'Visits last year' },
    { value: '60 sec', label: 'Avg. booking time' },
    { value: '100%', label: 'Background-checked pros' },
  ]
  return (
    <section className="border-y border-slate-200 bg-slate-50">
      <div className="mx-auto grid w-full max-w-6xl grid-cols-2 gap-y-8 px-4 py-10 sm:grid-cols-4 sm:px-6">
        {stats.map((s) => (
          <div key={s.label} className="text-center">
            <div className="text-2xl font-bold text-slate-900 sm:text-3xl">{s.value}</div>
            <div className="mt-1 text-xs uppercase tracking-wider text-slate-500">{s.label}</div>
          </div>
        ))}
      </div>
    </section>
  )
}
