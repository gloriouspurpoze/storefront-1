import { notFound } from 'next/navigation'
import { loadTenantFromRequest } from '@/lib/load-tenant'
import { fetchStorefrontConfig } from '@/lib/storefront-api'
import { isAddonActive, STOREFRONT_ADDON_FLAGS } from '@/lib/storefrontAddons'
import { storefrontPathMetadata } from '@/lib/path-metadata'
import { AddonPageScreen } from '@/components/addons/AddonPageScreen'
import { B2bInquiryForm } from '@/components/addons/AddonInquiryForms'

export const dynamic = 'force-dynamic'

export async function generateMetadata() {
  const meta = await storefrontPathMetadata('/wholesale')
  return { title: 'Wholesale & bulk orders', ...meta }
}

/** B2B portal add-on (`showB2bPortal`) — wholesale / bulk inquiry → tenant CRM. */
export default async function WholesalePage() {
  const resolved = await loadTenantFromRequest()
  if (!resolved) notFound()
  const config = await fetchStorefrontConfig(resolved.id)
  if (!isAddonActive(config, STOREFRONT_ADDON_FLAGS.b2b)) notFound()
  const siteName = config?.branding?.siteName || resolved.name

  return (
    <AddonPageScreen resolved={resolved} config={config}>
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[1fr_1.3fr]">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: 'var(--site-brand, #4f46e5)' }}>
            For businesses
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Wholesale &amp; bulk orders</h1>
          <p className="mt-4 text-slate-600">
            Ordering for a business, office, event or resale? Tell {siteName} what you need and we&apos;ll send a
            volume quote.
          </p>
          <ul className="mt-6 space-y-2 text-sm text-slate-700">
            <li>✓ Volume pricing on bulk quantities</li>
            <li>✓ GST invoices for your business</li>
            <li>✓ A dedicated point of contact</li>
          </ul>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <B2bInquiryForm tenantId={resolved.id} />
        </div>
      </div>
    </AddonPageScreen>
  )
}
