export function Rating({ value, count, max = 5 }: { value: number; count?: number; max?: number }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100))
  const stars = '★'.repeat(max)
  return (
    <span className="sf-rating" aria-label={`Rated ${value.toFixed(1)} out of ${max}${count ? `, ${count} reviews` : ''}`}>
      <span className="sf-rating__stars" aria-hidden>
        {stars}
        <span className="sf-rating__fill" style={{ width: `${pct}%` }}>
          {stars}
        </span>
      </span>
      {typeof count === 'number' && <span aria-hidden>({count})</span>}
    </span>
  )
}
