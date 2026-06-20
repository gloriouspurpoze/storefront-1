import type { ResolvedTenant, VerticalKey } from '../../lib/types'
import Link from 'next/link'

const TAGLINE: Record<VerticalKey, string> = {
  home_services: 'Trusted local pros, on demand.',
  restaurant: 'Where the menu meets the moment.',
  salon: 'Where you walk out looking your best.',
  retail: 'Curated, online, and on the way.',
  fitness: 'Train smarter. Live stronger.',
  real_estate: 'Find the address you have been waiting for.',
  b2b_services: 'Your team, multiplied.',
  healthcare: 'Care that comes to you.',
  education: 'Learning that meets you where you are.',
}

const ACCENT: Record<VerticalKey, string> = {
  home_services: 'from-amber-500 to-rose-500',
  restaurant: 'from-rose-500 to-orange-500',
  salon: 'from-pink-500 to-violet-500',
  retail: 'from-indigo-500 to-fuchsia-500',
  fitness: 'from-emerald-500 to-teal-500',
  real_estate: 'from-sky-500 to-indigo-600',
  b2b_services: 'from-slate-700 to-slate-900',
  healthcare: 'from-emerald-500 to-sky-500',
  education: 'from-amber-500 to-emerald-500',
}

/**
 * Phase 0 branded placeholder. Used for any vertical that does not yet have a
 * full theme — restaurant and retail now ship dedicated themes.
 */
export function ComingSoon({ tenant }: { tenant: ResolvedTenant }) {
  const tagline = TAGLINE[tenant.verticalKey] ?? 'Something great is on the way.'
  const accent = ACCENT[tenant.verticalKey] ?? ACCENT.home_services
  const logoUrl = (tenant.publicSiteTheme?.logoUrl as string | undefined) ?? null

  return (
    <main className="relative isolate min-h-screen overflow-hidden">
      <div className={`absolute inset-0 -z-10 bg-gradient-to-br ${accent} opacity-95`} aria-hidden />
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(60%_60%_at_50%_0%,rgba(255,255,255,0.35),transparent)]" aria-hidden />

      <div className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center px-6 py-20 text-center text-white">
        {logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={logoUrl}
            alt={`${tenant.name} logo`}
            className="mb-10 h-20 w-20 rounded-2xl bg-white/10 object-contain p-3 ring-1 ring-white/30"
          />
        ) : (
          <div className="mb-10 flex h-20 w-20 items-center justify-center rounded-2xl bg-white/10 text-3xl font-bold ring-1 ring-white/30">
            {tenant.name.charAt(0).toUpperCase()}
          </div>
        )}

        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.3em] text-white/80">
          Coming soon
        </p>
        <h1 className="text-balance text-4xl font-bold tracking-tight sm:text-6xl">
          {tenant.name}
        </h1>
        <p className="mt-5 max-w-xl text-pretty text-lg text-white/85 sm:text-xl">{tagline}</p>

        <div className="mt-12 inline-flex items-center gap-2 rounded-full bg-white/10 px-5 py-2.5 text-sm font-medium backdrop-blur-sm ring-1 ring-white/30">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-60" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-white" />
          </span>
          We are putting the finishing touches on our site.
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-4 text-sm font-medium">
          <Link
            href="/account/login"
            className="rounded-full bg-white/15 px-5 py-2.5 ring-1 ring-white/30 transition hover:bg-white/25"
          >
            Sign in
          </Link>
          <Link
            href="/account/login?signup=1"
            className="rounded-full bg-white px-5 py-2.5 text-slate-900 transition hover:bg-white/90"
          >
            Sign up
          </Link>
        </div>

        <footer className="mt-24 text-xs text-white/60">
          {tenant.slug} · {tenant.verticalKey.replace('_', ' ')} · powered by{' '}
          <a
            href="https://profixer.app"
            className="font-medium text-white underline-offset-4 hover:underline"
          >
            Profixer
          </a>
        </footer>
      </div>
    </main>
  )
}
