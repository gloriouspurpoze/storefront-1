import Link from 'next/link'
import { PhoneIcon } from './icons'
import './trade-pro.css'

export function TradeProFinalCta({ phone }: { phone?: string }) {
  return (
    <section className="tp-diagonal-stripes bg-[var(--tp-ink)]">
      <div className="bg-[var(--tp-ink)]/95 px-4 py-16 sm:px-6 sm:py-20">
        <div className="tp-center text-center text-white">
          <h2 className="text-3xl font-black tracking-tight sm:text-4xl">Need something fixed today?</h2>
          <p className="mt-3 text-pretty text-white/75">
            Tell us what you need and we&apos;ll match you with a verified pro in minutes. No account required.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              href="/book"
              className="inline-flex items-center justify-center rounded px-6 py-3 text-sm font-bold uppercase tracking-wide text-[var(--tp-ink)] transition hover:brightness-95"
              style={{ backgroundColor: 'var(--tp-accent)' }}
            >
              Book now
            </Link>
            {phone ? (
              <a
                href={`tel:${phone}`}
                className="inline-flex items-center gap-2 rounded border border-white/30 bg-white/5 px-6 py-3 text-sm font-bold uppercase tracking-wide text-white backdrop-blur transition hover:bg-white/10"
              >
                <PhoneIcon className="h-4 w-4" /> Call {phone}
              </a>
            ) : (
              <Link
                href="/contact"
                className="inline-flex items-center justify-center rounded border border-white/30 bg-white/5 px-6 py-3 text-sm font-bold uppercase tracking-wide text-white backdrop-blur transition hover:bg-white/10"
              >
                Talk to us
              </Link>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
