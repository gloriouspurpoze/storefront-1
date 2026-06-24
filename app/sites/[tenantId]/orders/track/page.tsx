import { loadRetailTenant } from '@/themes/retail/loadThemeTenant'

import { RetailShell } from '@/themes/retail/RetailShell'

import { SiteHeader } from '@/themes/retail/SiteHeader'

import { SiteFooter } from '@/themes/retail/SiteFooter'

import { TrackOrderClient } from '@/themes/retail/TrackOrderClient'

import { toThemeTenant } from '@/themes/retail/types'

import { fetchStorefrontConfig } from '@/lib/storefront-api'

import { isRetailLayoutTheme } from '@/themes/retail/retailLayoutRouter'

import { LayoutThemePageShell } from '@/components/LayoutThemePageShell'



export const dynamic = 'force-dynamic'



export async function generateMetadata() {

  const tenant = await loadRetailTenant()

  return { title: 'Track order', description: `Track your order at ${tenant.name}.` }

}



export default async function TrackOrderPage() {

  const tenant = await loadRetailTenant()

  const config = await fetchStorefrontConfig(tenant.id)

  const themeTenant = toThemeTenant(tenant, tenant.fallbackTagline)

  const siteName = config?.branding?.siteName || tenant.name

  const tagline = config?.branding?.tagline || themeTenant.tagline



  const main = (

    <main className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 sm:py-16">

      <h1 className="text-3xl font-bold text-slate-900">Track your order</h1>

      <p className="mt-2 text-slate-600">See delivery status and carrier tracking for your purchase.</p>

      <div className="mt-8">

        <TrackOrderClient tenant={themeTenant} />

      </div>

    </main>

  )



  if (isRetailLayoutTheme(config?.themeKey)) {

    return (

      <RetailShell tenantId={tenant.id}>

        <LayoutThemePageShell config={config} siteName={siteName} tagline={tagline} wide>

          {main}

        </LayoutThemePageShell>

      </RetailShell>

    )

  }



  return (

    <RetailShell tenantId={tenant.id}>

      <SiteHeader tenant={themeTenant} />

      {main}

      <SiteFooter tenant={themeTenant} />

    </RetailShell>

  )

}

