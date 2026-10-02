/**
 * Holding page shown instead of the storefront while `config.siteStatus.mode === 'maintenance'`.
 * Uses the tenant brand CSS vars set on the layout root, so it matches the store's colors.
 */
export function MaintenancePage({
  siteName,
  logoUrl,
  message,
  reopensAt,
  contactEmail,
  contactPhone,
}: {
  siteName: string
  logoUrl?: string
  message?: string
  reopensAt?: string
  contactEmail?: string
  contactPhone?: string
}) {
  const reopens = reopensAt ? new Date(reopensAt) : null
  const reopensLabel =
    reopens && !Number.isNaN(reopens.getTime()) && reopens.getTime() > Date.now()
      ? reopens.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Kolkata' })
      : null

  return (
    <main className="flex min-h-screen items-center justify-center bg-white px-4 py-16 text-neutral-900">
      <div className="w-full max-w-md text-center">
        {logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logoUrl} alt={siteName} className="mx-auto mb-6 h-14 w-auto max-w-[200px] object-contain" />
        ) : (
          <div
            className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl text-2xl font-bold"
            style={{ background: 'var(--brand-primary)', color: 'var(--brand-primary-contrast)' }}
          >
            {siteName.trim().charAt(0).toUpperCase()}
          </div>
        )}
        <h1 className="text-2xl font-semibold tracking-tight">{siteName} will be back soon</h1>
        <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-neutral-600">
          {message || 'We’re making some improvements to our store. Please check back shortly.'}
        </p>
        {reopensLabel && (
          <p
            className="mt-5 inline-block rounded-full px-3 py-1 text-xs font-medium"
            style={{ background: 'var(--brand-secondary)', color: 'var(--brand-secondary-contrast)' }}
          >
            Expected back {reopensLabel}
          </p>
        )}
        {(contactEmail || contactPhone) && (
          <div className="mt-8 space-y-1 text-sm text-neutral-600">
            <p>Need help in the meantime?</p>
            {contactPhone && (
              <p>
                <a className="font-medium underline underline-offset-2" style={{ color: 'var(--site-accent)' }} href={`tel:${contactPhone.replace(/[^\d+]/g, '')}`}>
                  {contactPhone}
                </a>
              </p>
            )}
            {contactEmail && (
              <p>
                <a className="font-medium underline underline-offset-2" style={{ color: 'var(--site-accent)' }} href={`mailto:${contactEmail}`}>
                  {contactEmail}
                </a>
              </p>
            )}
          </div>
        )}
      </div>
    </main>
  )
}
