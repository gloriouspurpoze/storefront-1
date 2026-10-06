import { Menu } from 'lucide-react'
import { SIGN_IN_URL, signupUrl } from '../config'
import { AttributionLink } from './AttributionLink'
import { BrandLink } from './Brand'
import { Container } from './Section'

const NAV = [
  { label: 'Features', href: '/#features' },
  { label: 'Industries', href: '/#industries' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'Blog', href: '/blog' },
] as const

export function Header({ trialHref = signupUrl(), trialLabel = 'Start free trial' }: { trialHref?: string; trialLabel?: string }) {
  return (
    <header className="sticky top-0 z-30 border-b border-tq-line bg-white/85 backdrop-blur">
      <Container className="flex h-16 items-center justify-between gap-4">
        <BrandLink />
        <nav aria-label="Primary" className="hidden items-center gap-7 text-sm font-medium text-tq-muted md:flex">
          {NAV.map((n) => (
            <a key={n.href} href={n.href} className="hover:text-tq-ink">
              {n.label}
            </a>
          ))}
        </nav>
        <div className="hidden items-center gap-3 md:flex">
          <AttributionLink href={SIGN_IN_URL} className="text-sm font-medium text-tq-muted hover:text-tq-ink">
            Sign in
          </AttributionLink>
          <AttributionLink
            href={trialHref}
            className="inline-flex h-10 items-center rounded-full bg-tq-primary px-5 text-sm font-semibold text-white hover:bg-tq-primary-deep"
          >
            {trialLabel}
          </AttributionLink>
        </div>
        {/* No-JS mobile menu: <details> opens and closes without hydration. */}
        <details className="group relative md:hidden">
          <summary className="flex h-10 w-10 cursor-pointer list-none items-center justify-center rounded-lg border border-tq-line [&::-webkit-details-marker]:hidden">
            <Menu className="h-5 w-5" aria-hidden />
            <span className="sr-only">Open menu</span>
          </summary>
          <div className="absolute right-0 top-12 w-64 rounded-2xl border border-tq-line bg-white p-3 shadow-xl">
            <nav aria-label="Mobile" className="flex flex-col">
              {NAV.map((n) => (
                <a key={n.href} href={n.href} className="rounded-lg px-3 py-2.5 text-sm font-medium text-tq-ink hover:bg-tq-wash">
                  {n.label}
                </a>
              ))}
              <AttributionLink href={SIGN_IN_URL} className="rounded-lg px-3 py-2.5 text-sm font-medium text-tq-ink hover:bg-tq-wash">
                Sign in
              </AttributionLink>
            </nav>
            <AttributionLink
              href={trialHref}
              className="mt-2 flex h-11 items-center justify-center rounded-full bg-tq-primary text-sm font-semibold text-white"
            >
              {trialLabel}
            </AttributionLink>
          </div>
        </details>
      </Container>
    </header>
  )
}
