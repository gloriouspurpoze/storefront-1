import './trade-pro.css'

/**
 * Stats strip — only renders when ≥2 real values are provided.
 * Never invents “10k+ jobs” placeholders (DESIGN.md / theme-gate).
 */
export function TradeProStatsBar({
  stats,
}: {
  stats?: Array<{ value: string; label: string }>
}) {
  const real = (stats ?? []).filter((s) => s.value.trim() && s.label.trim())
  if (real.length < 2) return null

  return (
    <section className="border-y border-[var(--tp-hairline)] bg-[var(--tp-canvas)]">
      <div className="tp-container grid grid-cols-2 gap-y-8 py-10 sm:grid-cols-4">
        {real.slice(0, 4).map(({ value, label }) => (
          <div key={label} className="flex min-w-0 flex-col items-center text-center">
            <div
              className="text-2xl font-bold sm:text-3xl"
              style={{ color: 'var(--tp-accent)' }}
            >
              {value}
            </div>
            <div className="mt-1 text-xs font-medium uppercase tracking-wider text-[var(--tp-mute)]">
              {label}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
