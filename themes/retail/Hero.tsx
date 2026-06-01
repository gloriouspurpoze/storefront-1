import Link from 'next/link'
import type { ThemeTenant } from './types'

export function Hero({ tenant }: { tenant: ThemeTenant }) {
  return (
    <section className="relative isolate overflow-hidden bg-slate-950 text-white">
      <div
        className="absolute inset-0 opacity-50"
        style={{
          background: `linear-gradient(120deg, var(--site-brand) 0%, #0f172a 70%)`,
        }}
        aria-hidden
      />
      <div className="relative mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-indigo-200/90">
          New arrivals
        </p>
        <h1 className="mt-4 max-w-2xl text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
          {tenant.name}
        </h1>
        <p className="mt-5 max-w-xl text-lg text-slate-300">{tenant.tagline}</p>
        <Link
          href="/products"
          className="mt-9 inline-flex rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-900 transition hover:bg-indigo-50"
        >
          Shop collection
        </Link>
      </div>
    </section>
  )
}
