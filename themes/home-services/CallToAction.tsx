import Link from 'next/link'
import { loadHomeServicesTenant } from './loadThemeTenant'
import { bookingCta, resolveBookingAddon } from './bookingAddon'

export async function CallToAction({
  bookingEnabled,
}: {
  /** Service booking add-on; resolved from the request tenant's config when omitted. */
  bookingEnabled?: boolean
} = {}) {
  const booking =
    typeof bookingEnabled === 'boolean'
      ? bookingEnabled
      : await resolveBookingAddon((await loadHomeServicesTenant()).id)
  const cta = bookingCta(booking, 'Book now', 'Request a callback')
  return (
    <section className="sf-container py-16 sm:py-20">
      <div
        className="relative isolate overflow-hidden rounded-3xl p-10 text-white shadow-xl sm:p-16"
        style={{
          background:
            'linear-gradient(135deg, var(--site-brand) 0%, color-mix(in oklab, var(--site-brand) 60%, black) 100%)',
        }}
      >
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(60%_60%_at_30%_0%,rgba(255,255,255,0.18),transparent)]" aria-hidden />
        <div className="max-w-2xl">
          <h2 className="font-sf-display text-3xl font-bold tracking-tight sm:text-4xl">
            Need something fixed today?
          </h2>
          <p className="mt-3 text-pretty text-white/85">
            Tell us what you need and we&apos;ll match you with a verified pro in minutes. No
            account required.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href={cta.href}
              className="sf-btn sf-btn--inverse"
            >
              {cta.label}
            </Link>
            {booking ? (
              <Link
                href="/contact"
                className="sf-btn sf-btn--outline-inverse"
              >
                Talk to us
              </Link>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  )
}
