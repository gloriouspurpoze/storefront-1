import Link from 'next/link'
import type { ThemeTenant } from './types'

export function Hero({ tenant }: { tenant: ThemeTenant }) {
  return (
    <section className="relative isolate overflow-hidden bg-stone-950 text-white">
      <div
        className="absolute inset-0 opacity-40"
        style={{
          background: `radial-gradient(ellipse at 30% 20%, var(--site-brand), transparent 55%)`,
        }}
        aria-hidden
      />
      <div className="relative mx-auto max-w-6xl px-4 py-24 sm:px-6 sm:py-32">
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-amber-200/90">
          Welcome
        </p>
        <h1 className="mt-4 max-w-2xl font-serif text-4xl font-bold tracking-tight sm:text-6xl">
          {tenant.name}
        </h1>
        <p className="mt-5 max-w-xl text-lg text-stone-300">{tenant.tagline}</p>
        <div className="mt-10 flex flex-wrap gap-3">
          <Link
            href="/menu"
            className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-stone-900 transition hover:bg-amber-50"
          >
            View menu
          </Link>
          <Link
            href="/reserve"
            className="rounded-full border border-white/30 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
          >
            Book a table
          </Link>
        </div>
      </div>
    </section>
  )
}
