/**
 * Public 404 — shown when middleware cannot resolve the Host header to a
 * known tenant. Intentionally generic in production. In local dev, surface
 * the tenant subdomain hint so `localhost:3001` is not mistaken for a
 * broken theme.
 */
import { headers } from 'next/headers'

export const dynamic = 'force-dynamic'

function isLocalDevHost(host: string): boolean {
  const h = host.toLowerCase().split(':')[0] ?? ''
  return h === 'localhost' || h === '127.0.0.1' || h.endsWith('.localhost') || h === 'lvh.me'
}

export default async function UnknownHostPage() {
  const h = await headers()
  const host = (h.get('x-storefront-host') || h.get('host') || '').toLowerCase()
  const local = isLocalDevHost(host)

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-6 text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
        Profixer
      </p>
      <h1 className="mt-6 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
        {local ? 'Open the tenant subdomain' : 'This site is not configured yet.'}
      </h1>
      {local ? (
        <div className="mt-4 max-w-xl space-y-3 text-pretty text-base text-slate-600">
          <p>
            Bare <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-sm">localhost:3001</code>{' '}
            has no tenant — the themed storefront only loads on a slug host.
          </p>
          <p>
            Try{' '}
            <a
              href="http://profixer.lvh.me:3001/"
              className="font-semibold text-slate-900 underline underline-offset-2"
            >
              http://profixer.lvh.me:3001/
            </a>
          </p>
        </div>
      ) : (
        <p className="mt-4 max-w-xl text-pretty text-base text-slate-600">
          If this is your domain, point it at{' '}
          <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-sm">
            cname.vercel-dns.com
          </code>{' '}
          and finish the setup from your Profixer admin.
        </p>
      )}
      {!local ? (
        <a
          href="https://torqstudio.com"
          className="mt-10 inline-flex items-center justify-center rounded-full bg-slate-900 px-6 py-2.5 text-sm font-medium text-white hover:bg-slate-800"
        >
          Learn more about Torq Studio
        </a>
      ) : null}
    </main>
  )
}
