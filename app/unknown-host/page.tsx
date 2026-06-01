/**
 * Public 404 — shown when middleware cannot resolve the Host header to a
 * known tenant. Intentionally generic: we never want to leak whether a
 * specific tenant exists from an unauthenticated request.
 */
export const dynamic = 'force-static'

export default function UnknownHostPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-6 text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
        Profixer
      </p>
      <h1 className="mt-6 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
        This site is not configured yet.
      </h1>
      <p className="mt-4 max-w-xl text-pretty text-base text-slate-600">
        If this is your domain, point it at{' '}
        <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-sm">
          cname.vercel-dns.com
        </code>{' '}
        and finish the setup from your Profixer admin.
      </p>
      <a
        href="https://profixer.app"
        className="mt-10 inline-flex items-center justify-center rounded-full bg-slate-900 px-6 py-2.5 text-sm font-medium text-white hover:bg-slate-800"
      >
        Learn more about Profixer
      </a>
    </main>
  )
}
