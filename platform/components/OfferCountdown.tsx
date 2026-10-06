'use client'

import { useEffect, useState } from 'react'
import { Flame } from 'lucide-react'
import { LAUNCH_OFFER } from '../content/offer'

const END_MS = Date.parse(LAUNCH_OFFER.endsAt)
const END_LABEL = new Date(END_MS).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', timeZone: 'Asia/Kolkata' })

/** Launch-offer banner with a live countdown; hides itself once the fixed deadline passes. */
export function OfferCountdown() {
  const [remaining, setRemaining] = useState<number | null>(null)
  useEffect(() => {
    const tick = () => setRemaining(END_MS - Date.now())
    tick()
    const id = window.setInterval(tick, 1000)
    return () => window.clearInterval(id)
  }, [])
  if (remaining !== null && remaining <= 0) return null

  const s = Math.max(0, Math.floor((remaining ?? 0) / 1000))
  const units = [
    { v: Math.floor(s / 86400), l: 'days' },
    { v: Math.floor((s % 86400) / 3600), l: 'hrs' },
    { v: Math.floor((s % 3600) / 60), l: 'min' },
    { v: s % 60, l: 'sec' },
  ]
  return (
    <div className="mx-auto mt-10 flex max-w-5xl flex-col items-center gap-4 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-center sm:flex-row sm:justify-between sm:text-left">
      <div>
        <p className="inline-flex items-center gap-2 text-sm font-semibold text-tq-ink">
          <Flame className="h-4 w-4 text-amber-500" aria-hidden />
          {LAUNCH_OFFER.label}: 50% off every plan
        </p>
        <p className="mt-0.5 text-sm text-tq-muted">Lock in launch pricing — offer ends {END_LABEL}, 11:59 PM IST.</p>
      </div>
      {remaining !== null ? (
        <div className="flex gap-2" role="timer" aria-label={`Offer ends ${END_LABEL}`}>
          {units.map((u) => (
            <div key={u.l} className="w-14 rounded-lg bg-white py-1.5 text-center shadow-sm">
              <p className="text-lg font-semibold tabular-nums text-tq-ink">{String(u.v).padStart(2, '0')}</p>
              <p className="text-[10px] uppercase tracking-wide text-tq-muted">{u.l}</p>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  )
}
