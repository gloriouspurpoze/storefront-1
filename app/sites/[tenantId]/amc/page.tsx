import { notFound } from 'next/navigation'
import { loadTenantFromRequest } from '@/lib/load-tenant'
import { fetchStorefrontConfig } from '@/lib/storefront-api'
import { isAddonActive, STOREFRONT_ADDON_FLAGS } from '@/lib/storefrontAddons'
import { fetchAmcPackages } from '@/lib/storefrontAddonsApi'
import { storefrontPathMetadata } from '@/lib/path-metadata'
import { AddonPageScreen } from '@/components/addons/AddonPageScreen'
import { AmcPlanCard } from '@/components/addons/StorefrontAddonBlocks'
import { AmcEnquiryForm } from '@/components/addons/AddonInquiryForms'

export const dynamic = 'force-dynamic'

export async function generateMetadata() {
  const meta = await storefrontPathMetadata('/amc')
  return { title: 'Annual maintenance plans', ...meta }
}

/** AMC offers add-on (`showAmcOffers`) — plan list + enquiry → tenant CRM lead/deal. */
export default async function AmcPlansPage({ searchParams }: { searchParams: Promise<{ plan?: string }> }) {
  const resolved = await loadTenantFromRequest()
  if (!resolved) notFound()
  const config = await fetchStorefrontConfig(resolved.id)
  if (!isAddonActive(config, STOREFRONT_ADDON_FLAGS.amc)) notFound()
  const [packages, sp] = await Promise.all([fetchAmcPackages(resolved.id), searchParams])
  if (!packages.length) notFound()

  return (
    <AddonPageScreen resolved={resolved} config={config}>
      <div className="sf-container py-16">
        <h1 className="sf-page-title">Annual maintenance plans</h1>
        <p className="mt-3 max-w-2xl text-slate-600">
          Scheduled visits, priority support and one predictable price for the year.
        </p>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {packages.map((pkg) => (
            <AmcPlanCard key={pkg.id} pkg={pkg} ctaHref={`/amc?plan=${encodeURIComponent(pkg.slug)}#enquire`} />
          ))}
        </div>
        <section id="enquire" className="mx-auto mt-16 max-w-2xl scroll-mt-24 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <h2 className="text-xl font-semibold">Request a plan</h2>
          <p className="mt-1 text-sm text-slate-600">We&apos;ll call you to confirm the plan and schedule your first visit.</p>
          <div className="mt-6">
            {/* key: re-init the selected plan when navigating between ?plan= links */}
            <AmcEnquiryForm key={sp.plan ?? ''} tenantId={resolved.id} packages={packages} initialSlug={sp.plan} />
          </div>
        </section>
      </div>
    </AddonPageScreen>
  )
}
