import type { Metadata } from 'next'
import { ArrowRight } from 'lucide-react'
import { Header } from '@/platform/components/Header'
import { Container, outlineButton, primaryButton } from '@/platform/components/Section'

export const metadata: Metadata = { title: 'Page not found', robots: { index: false, follow: true } }

/** Branded 404 for torqstudio.com — keeps visitors (and crawlers) moving to real pages. */
export default function PlatformNotFound() {
  return (
    <>
      <Header />
      <main>
        <Container className="max-w-2xl py-24 text-center sm:py-32">
          <p className="text-sm font-semibold text-tq-primary">404</p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight text-tq-ink sm:text-5xl">This page doesn&apos;t exist</h1>
          <p className="mt-4 text-base text-tq-muted sm:text-lg">The link may be old or mistyped. These are good places to start:</p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <a href="/" className={primaryButton}>
              Go to the home page
              <ArrowRight className="h-4 w-4" aria-hidden />
            </a>
            <a href="/pricing" className={outlineButton}>
              See pricing
            </a>
          </div>
          <p className="mt-6 text-sm text-tq-muted">
            Or read the{' '}
            <a href="/blog" className="font-medium text-tq-primary hover:underline">
              blog
            </a>
            .
          </p>
        </Container>
      </main>
    </>
  )
}
