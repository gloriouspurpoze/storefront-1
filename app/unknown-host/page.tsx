import type { Metadata } from 'next'
import { headers } from 'next/headers'

/**
 * Public fallback — shown when middleware cannot resolve the Host header to a
 * known tenant. Shoppers see a calm "store unavailable" message with no
 * infrastructure details; we never leak whether a specific tenant exists.
 * In development a hint box explains how to open a store locally.
 */
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Store unavailable',
  robots: { index: false, follow: false },
}

export default async function UnknownHostPage() {
  const isDev = process.env.NODE_ENV !== 'production'
  const host = isDev ? ((await headers()).get('x-storefront-host') ?? '') : ''
  const port = host.split(':')[1]
  const exampleHost = `your-store.localhost${port ? `:${port}` : ''}`

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-16">
      <div className="w-full max-w-md text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.75}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-7 w-7 text-slate-500"
          >
            <path d="M3 9l1.5-5h15L21 9" />
            <path d="M3 9h18v1a3 3 0 01-6 0 3 3 0 01-6 0 3 3 0 01-6 0V9z" />
            <path d="M5 12.5V20h14v-7.5" />
            <path d="M10 20v-4h4v4" />
          </svg>
        </div>

        <h1 className="mt-6 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
          This store isn&rsquo;t available right now
        </h1>
        <p className="mt-3 text-pretty text-base leading-relaxed text-slate-600">
          The page you&rsquo;re looking for may have moved, or the store is still
          being set up. Please check the address and try again in a little while.
        </p>

        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <a
            href="/"
            className="inline-flex w-full items-center justify-center rounded-full bg-slate-900 px-6 py-2.5 text-sm font-medium text-white hover:bg-slate-800 sm:w-auto"
          >
            Try again
          </a>
          <a
            href="https://torqstudio.com"
            className="inline-flex w-full items-center justify-center rounded-full px-6 py-2.5 text-sm font-medium text-slate-700 ring-1 ring-slate-200 hover:bg-white sm:w-auto"
          >
            Own this store? Go to Torq Studio
          </a>
        </div>

        {isDev && (
          <div className="mt-12 rounded-xl border border-dashed border-amber-300 bg-amber-50 p-4 text-left text-sm text-amber-900">
            <p className="font-semibold">Dev only — no store matched this host</p>
            <p className="mt-1 break-all">
              Host: <code className="font-mono">{host || '(none)'}</code>
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>
                Open a store by subdomain, e.g.{' '}
                <code className="font-mono">{exampleHost}</code>
              </li>
              <li>
                Or set <code className="font-mono">STOREFRONT_DEV_TENANT_SLUG</code> in{' '}
                <code className="font-mono">.env</code> so bare localhost opens that store
              </li>
              <li>Make sure the backend API is running</li>
            </ul>
          </div>
        )}

        <p className="mt-12 text-xs font-medium uppercase tracking-[0.25em] text-slate-400">
          Powered by Torq Studio
        </p>
      </div>
    </main>
  )
}
