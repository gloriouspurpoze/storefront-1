import Link from 'next/link'
import type { ThemeTenant } from './types'

export function Hero({ tenant }: { tenant: ThemeTenant }) {
  return (
    <section className="relative isolate overflow-hidden">
      <div
        className="absolute inset-0 -z-10"
        style={{
          background: `linear-gradient(135deg, var(--site-brand) 0%, #0f172a 100%)`,
        }}
        aria-hidden
      />
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(60%_60%_at_50%_0%,rgba(255,255,255,0.18),transparent)]" aria-hidden />

      <div className="mx-auto grid w-full max-w-6xl items-center gap-12 px-4 py-20 sm:px-6 sm:py-28 md:grid-cols-[1.2fr_1fr]">
        <div className="text-white">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/75">
            {tenant.name}
          </p>
          <h1 className="mt-4 text-balance text-4xl font-bold leading-tight tracking-tight sm:text-5xl md:text-6xl">
            Trusted pros for every home, every day.
          </h1>
          <p className="mt-5 max-w-xl text-pretty text-lg text-white/90 sm:text-xl">
            {tenant.tagline} Book a verified professional in under 60 seconds.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Link
              href="/book"
              className="inline-flex items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-900 shadow-lg shadow-black/10 transition hover:bg-slate-100"
            >
              Book a service
            </Link>
            <Link
              href="/services"
              className="inline-flex items-center justify-center rounded-full border border-white/40 bg-white/10 px-6 py-3 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/20"
            >
              Browse services
            </Link>
          </div>

          <ul className="mt-10 flex flex-wrap gap-x-8 gap-y-3 text-sm text-white/85">
            <li className="flex items-center gap-2">
              <Dot /> Same-day availability
            </li>
            <li className="flex items-center gap-2">
              <Dot /> Verified professionals
            </li>
            <li className="flex items-center gap-2">
              <Dot /> Transparent pricing
            </li>
          </ul>
        </div>

        <aside className="rounded-2xl border border-white/15 bg-white/10 p-6 text-white shadow-xl shadow-black/20 backdrop-blur">
          <p className="text-xs font-semibold uppercase tracking-wider text-white/70">
            How we work
          </p>
          <ol className="mt-4 space-y-4 text-sm">
            <Step n={1} title="Tell us what you need" body="Pick a service or describe the job." />
            <Step n={2} title="We match a verified pro" body="Local, background-checked, and rated." />
            <Step n={3} title="Sit back and relax" body="Track the visit and pay securely after." />
          </ol>
        </aside>
      </div>
    </section>
  )
}

function Step({ n, title, body }: { n: number; title: string; body: string }) {
  return (
    <li className="flex gap-3">
      <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white text-xs font-bold text-slate-900">
        {n}
      </span>
      <span>
        <span className="font-semibold text-white">{title}</span>
        <span className="block text-white/75">{body}</span>
      </span>
    </li>
  )
}

function Dot() {
  return (
    <span className="inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-white/80" aria-hidden />
  )
}
