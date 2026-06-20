import { notFound } from 'next/navigation'
import Link from 'next/link'
import { loadTenantFromRequest } from '@/lib/load-tenant'
import { fetchStorefrontConfig } from '@/lib/storefront-api'
import { loadRetailTenant } from '@/themes/retail/loadThemeTenant'
import { RetailShell } from '@/themes/retail/RetailShell'
import { SiteHeader } from '@/themes/retail/SiteHeader'
import { SiteFooter } from '@/themes/retail/SiteFooter'
import { toThemeTenant } from '@/themes/retail/types'
import { isRetailLayoutTheme } from '@/themes/retail/retailLayoutRouter'

export const dynamic = 'force-dynamic'

const FREE_SHIPPING_MIN = 1500
const SHIPPING_FEE = 120

function ShippingPolicyContent({ siteName, contactEmail }: { siteName: string; contactEmail?: string }) {
  return (
    <main className="mx-auto max-w-3xl px-4 py-16 sm:px-6 text-slate-800">
      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Policies</p>
      <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">Shipping policy</h1>
      <p className="mt-6 max-w-prose text-pretty text-slate-600">
        Thank you for shopping at {siteName}. Below is how we handle shipping and delivery for online
        orders placed through our storefront.
      </p>

      <section className="mt-10 space-y-8 text-slate-700">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Processing time</h2>
          <p className="mt-2 text-pretty leading-relaxed">
            Orders are typically processed within 1–2 business days after payment confirmation. You
            will receive an email with your order number once your order is confirmed.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-slate-900">Shipping rates</h2>
          <ul className="mt-2 list-disc space-y-2 pl-5 leading-relaxed">
            <li>
              Standard shipping: ₹{SHIPPING_FEE.toLocaleString('en-IN')} for orders below ₹
              {FREE_SHIPPING_MIN.toLocaleString('en-IN')}
            </li>
            <li>
              Free shipping on orders of ₹{FREE_SHIPPING_MIN.toLocaleString('en-IN')} or more
            </li>
            <li>Rates may vary for remote or international destinations — we will contact you if needed</li>
          </ul>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-slate-900">Delivery timeline</h2>
          <p className="mt-2 text-pretty leading-relaxed">
            Most domestic orders arrive within 3–7 business days after dispatch, depending on your
            location and courier partner. Delivery estimates are shown at checkout when available.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-slate-900">Order tracking</h2>
          <p className="mt-2 text-pretty leading-relaxed">
            Track your order anytime using your order number and the email or phone used at checkout.{' '}
            <Link href="/orders/track" className="font-medium text-slate-900 underline underline-offset-2">
              Track your order →
            </Link>
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-slate-900">Damaged or lost packages</h2>
          <p className="mt-2 text-pretty leading-relaxed">
            If your package arrives damaged or does not arrive within the expected window, please
            contact us within 7 days of the estimated delivery date
            {contactEmail ? (
              <>
                {' '}
                at{' '}
                <a href={`mailto:${contactEmail}`} className="font-medium text-slate-900 underline underline-offset-2">
                  {contactEmail}
                </a>
              </>
            ) : (
              ' through our contact page'
            )}
            . Include your order number and photos if applicable.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-slate-900">Returns &amp; exchanges</h2>
          <p className="mt-2 text-pretty leading-relaxed">
            Due to the nature of our products, returns may be limited. Please reach out before
            returning any item so we can guide you through the process.
          </p>
        </div>
      </section>

      <div className="mt-12 flex flex-wrap gap-4 text-sm">
        <Link href="/" className="font-medium text-slate-900 underline underline-offset-2">
          ← Back to store
        </Link>
        <Link href="/orders/track" className="font-medium text-slate-900 underline underline-offset-2">
          Track an order
        </Link>
        <Link href="/account" className="font-medium text-slate-900 underline underline-offset-2">
          My orders
        </Link>
      </div>
    </main>
  )
}

export async function generateMetadata() {
  const tenant = await loadTenantFromRequest()
  return {
    title: 'Shipping policy',
    description: tenant ? `Shipping and delivery information for ${tenant.name}` : 'Shipping policy',
  }
}

export default async function ShippingPolicyPage() {
  const resolved = await loadTenantFromRequest()
  if (!resolved) notFound()

  if (resolved.verticalKey !== 'retail') notFound()

  const tenant = await loadRetailTenant()
  const config = await fetchStorefrontConfig(tenant.id)
  const branding = config?.branding ?? {}
  const siteName = branding.siteName || tenant.name
  const theme = toThemeTenant(tenant, branding.tagline ?? '')

  if (isRetailLayoutTheme(config?.themeKey)) {
    return (
      <RetailShell tenantId={tenant.id}>
        <div className="min-h-screen bg-[#faf9fc]">
          <ShippingPolicyContent siteName={siteName} contactEmail={branding.contactEmail} />
        </div>
      </RetailShell>
    )
  }

  return (
    <RetailShell tenantId={tenant.id}>
      <SiteHeader tenant={theme} />
      <ShippingPolicyContent siteName={siteName} contactEmail={branding.contactEmail} />
      <SiteFooter tenant={theme} />
    </RetailShell>
  )
}
