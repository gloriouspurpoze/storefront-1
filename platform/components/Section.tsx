import type { ReactNode } from 'react'

export function Container({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`mx-auto max-w-6xl px-4 sm:px-6 ${className}`}>{children}</div>
}

export function SectionTitle({
  eyebrow,
  title,
  subtitle,
  as: Heading = 'h2',
}: {
  eyebrow: string
  title: string
  subtitle?: string
  as?: 'h1' | 'h2'
}) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <p className="text-sm font-semibold text-tq-primary">{eyebrow}</p>
      <Heading className="mt-2 text-3xl font-semibold tracking-tight text-tq-ink sm:text-4xl">{title}</Heading>
      {subtitle ? <p className="mt-4 text-base text-tq-muted">{subtitle}</p> : null}
    </div>
  )
}

export const primaryButton =
  'inline-flex h-12 items-center justify-center gap-2 rounded-full bg-tq-primary px-7 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-tq-primary-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tq-primary focus-visible:ring-offset-2'

export const outlineButton =
  'inline-flex h-12 items-center justify-center gap-2 rounded-full border border-tq-line bg-white px-7 text-sm font-semibold text-tq-ink transition-colors hover:border-tq-primary/50 hover:text-tq-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tq-primary focus-visible:ring-offset-2'
