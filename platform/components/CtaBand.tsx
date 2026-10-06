import { ArrowRight, CreditCard, ShieldCheck, Timer } from 'lucide-react'
import { AttributionLink } from './AttributionLink'
import { DemoCallButton } from './DemoRequest'
import { Container } from './Section'

export function CtaBand({
  title = 'Ready to run your business better?',
  subtitle = 'Create your workspace in under a minute. No credit card required.',
  trialHref,
  trialLabel = 'Start free trial',
}: {
  title?: string
  subtitle?: string
  trialHref: string
  trialLabel?: string
}) {
  return (
    <section className="py-24">
      <Container>
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-tq-primary-deep via-[#1438a8] to-tq-primary-bright px-6 py-16 text-center text-white sm:px-12 sm:py-20">
          <h2 className="mx-auto max-w-2xl text-3xl font-semibold leading-tight tracking-tight sm:text-5xl">{title}</h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-tq-primary-soft">{subtitle}</p>
          <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
            <AttributionLink
              href={trialHref}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-white px-8 text-sm font-semibold text-tq-primary-deep shadow-lg hover:bg-white/90"
            >
              {trialLabel}
              <ArrowRight className="h-4 w-4" aria-hidden />
            </AttributionLink>
            <DemoCallButton className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-white/40 px-8 text-sm font-semibold text-white hover:bg-white/10" />
          </div>
          <ul className="mt-8 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-tq-primary-soft">
            {[
              { icon: CreditCard, t: 'No credit card' },
              { icon: Timer, t: 'Live in minutes' },
              { icon: ShieldCheck, t: 'Private to your workspace' },
            ].map(({ icon: Icon, t }) => (
              <li key={t} className="inline-flex items-center gap-1.5">
                <Icon className="h-4 w-4" aria-hidden />
                {t}
              </li>
            ))}
          </ul>
        </div>
      </Container>
    </section>
  )
}
