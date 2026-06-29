import React from 'react'
import Link from 'next/link'
import type { ResolvedTenant } from '@/lib/types'
import type { StorefrontConfig } from '@/lib/storefront-api'
import { fetchMenu, fetchProducts, fetchServices } from '@/lib/storefront-api'
import { SiteHeader as HsHeader } from '@/themes/home-services/SiteHeader'
import { SiteFooter as HsFooter } from '@/themes/home-services/SiteFooter'
import { Hero as HsHero } from '@/themes/home-services/Hero'
import { ServiceGrid } from '@/themes/home-services/ServiceGrid'
import { TrustSection } from '@/themes/home-services/TrustSection'
import { CallToAction } from '@/themes/home-services/CallToAction'
import { toThemeTenant as toHsTenant } from '@/themes/home-services/types'
import { SiteHeader as RestHeader } from '@/themes/restaurant/SiteHeader'
import { SiteFooter as RestFooter } from '@/themes/restaurant/SiteFooter'
import { Hero as RestHero } from '@/themes/restaurant/Hero'
import { MenuSectionInteractive } from '@/themes/restaurant/MenuSectionInteractive'
import { toThemeTenant as toRestTenant } from '@/themes/restaurant/types'
import { isRestaurantLayoutTheme, RestaurantLayoutPage } from '@/themes/restaurant/restaurantLayoutRouter'
import { RestaurantShell } from '@/themes/restaurant/RestaurantShell'
import { SiteHeader as RetailHeader } from '@/themes/retail/SiteHeader'
import { SiteFooter as RetailFooter } from '@/themes/retail/SiteFooter'
import { Hero as RetailHero } from '@/themes/retail/Hero'
import { ProductGrid } from '@/themes/retail/ProductGrid'
import { toThemeTenant as toRetailTenant } from '@/themes/retail/types'
import { RetailShell } from '@/themes/retail/RetailShell'
import { isRetailLayoutTheme, RetailLayoutPage } from '@/themes/retail/retailLayoutRouter'
import { isHomeServicesLayoutTheme, HomeServicesLayoutPage } from '@/themes/home-services/homeServicesLayoutRouter'

function flagOn(cfg: StorefrontConfig | null, key: string): boolean {
  const flags = cfg?.featureFlags as Record<string, boolean | undefined> | undefined
  const addons = cfg?.featureAddons ?? {}
  if (addons[key]?.purchased) return true
  return flags?.[key] !== false
}

function sectionEnabled(cfg: StorefrontConfig | null, type: string): boolean {
  const sections = cfg?.sections
  if (!sections?.length) return true
  const row = sections.find((s) => s.type === type)
  return row ? row.enabled : true
}

function orderedTypes(cfg: StorefrontConfig | null, defaults: string[]): string[] {
  if (!cfg?.sections?.length) return defaults
  return [...cfg.sections].sort((a, b) => a.order - b.order).map((s) => s.type)
}

function AboutBlock({ cfg }: { cfg: StorefrontConfig | null }) {
  const c = cfg?.content
  if (!c?.aboutTitle && !c?.aboutBody) return null
  return (
    <section className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6">
      {c.aboutTitle && <h2 className="text-2xl font-semibold">{c.aboutTitle}</h2>}
      {c.aboutBody && <p className="mt-4 text-muted-foreground whitespace-pre-wrap">{c.aboutBody}</p>}
    </section>
  )
}

function FaqBlock({ cfg }: { cfg: StorefrontConfig | null }) {
  const items = cfg?.content?.faqItems ?? []
  if (!items.length || !flagOn(cfg, 'showFaq')) return null
  return (
    <section className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
      <h2 className="text-2xl font-semibold text-center mb-8">FAQ</h2>
      <div className="space-y-4">
        {items.map((item, i) => (
          <details key={i} className="rounded-lg border border-border p-4">
            <summary className="font-medium cursor-pointer">{item.question}</summary>
            <p className="mt-2 text-sm text-muted-foreground">{item.answer}</p>
          </details>
        ))}
      </div>
    </section>
  )
}

export async function HomePageSections({
  tenant,
  cfg,
}: {
  tenant: ResolvedTenant
  cfg: StorefrontConfig | null
}) {
  const tagline = cfg?.branding?.tagline || cfg?.content?.heroSubcopy
  const vertical = tenant.verticalKey

  if (vertical === 'home_services') {
    const themeTenant = toHsTenant(
      tenant,
      cfg?.content?.heroHeadline || tagline || 'Trusted local pros, on demand.',
    )

    if (isHomeServicesLayoutTheme(cfg?.themeKey)) {
      return (
        <HomeServicesLayoutPage themeKey={cfg?.themeKey} tenant={themeTenant} config={cfg} />
      )
    }

    const services = flagOn(cfg, 'showServices') && sectionEnabled(cfg, 'services')
      ? await fetchServices(tenant.id, 6)
      : []
    const order = orderedTypes(cfg, ['hero', 'trust', 'services', 'about', 'faq', 'cta'])

    const blocks: Record<string, React.ReactNode> = {
      hero: flagOn(cfg, 'showHero') && sectionEnabled(cfg, 'hero') ? <HsHero tenant={themeTenant} /> : null,
      trust:
        flagOn(cfg, 'showTestimonials') && sectionEnabled(cfg, 'trust') ? <TrustSection /> : null,
      services:
        services.length > 0 ? (
          <ServiceGrid
            services={services}
            title="Popular services"
            subtitle="Hand-picked, frequently booked, instantly available."
          />
        ) : null,
      about: sectionEnabled(cfg, 'about') ? <AboutBlock cfg={cfg} /> : null,
      faq: sectionEnabled(cfg, 'faq') ? <FaqBlock cfg={cfg} /> : null,
      cta: sectionEnabled(cfg, 'cta') ? <CallToAction /> : null,
    }

    return (
      <>
        <HsHeader tenant={themeTenant} />
        <main>
          {order.map((t) => (blocks[t] ? <div key={t}>{blocks[t]}</div> : null))}
        </main>
        <HsFooter tenant={themeTenant} />
      </>
    )
  }

  if (vertical === 'restaurant') {
    const themeTenant = toRestTenant(tenant, tagline || 'Where the menu meets the moment.')

    // ── Full layout templates (saffron, menufast-minimal, menufast-cards) ───
    if (isRestaurantLayoutTheme(cfg?.themeKey)) {
      const [menu, products] = await Promise.all([
        fetchMenu(tenant.id),
        flagOn(cfg, 'showProducts') && sectionEnabled(cfg, 'products')
          ? fetchProducts(tenant.id, 80)
          : Promise.resolve([]),
      ])
      return (
        <RestaurantLayoutPage
          themeKey={cfg?.themeKey}
          menu={menu}
          products={products}
          tenant={themeTenant}
          config={cfg}
        />
      )
    }
    // ──────────────────────────────────────────────────────────────────────────

    const menu = flagOn(cfg, 'showMenu') && sectionEnabled(cfg, 'menu') ? await fetchMenu(tenant.id) : []
    const preview = menu.slice(0, 2)
    const order = orderedTypes(cfg, ['hero', 'menu', 'reservations', 'about', 'faq'])

    return (
      <RestaurantShell tenantId={tenant.id}>
        <RestHeader tenant={themeTenant} config={cfg} />
        <main>
          {order.map((t) => {
            if (t === 'hero' && flagOn(cfg, 'showHero') && sectionEnabled(cfg, 'hero'))
              return <RestHero key={t} tenant={themeTenant} />
            if (t === 'menu' && preview.length > 0)
              return (
                <section key={t} className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6">
                  <div className="flex items-end justify-between gap-4">
                    <h2 className="font-serif text-2xl font-semibold text-stone-900">From our kitchen</h2>
                    <Link href="/menu" className="text-sm font-medium text-amber-800 hover:underline">
                      Full menu →
                    </Link>
                  </div>
                  <div className="mt-8">
                    <MenuSectionInteractive categories={preview} compact />
                  </div>
                </section>
              )
            if (t === 'reservations' && flagOn(cfg, 'showReservations') && sectionEnabled(cfg, 'reservations'))
              return (
                <section key={t} className="bg-amber-50/50 py-16">
                  <div className="mx-auto max-w-6xl px-4 text-center sm:px-6">
                    <h2 className="font-serif text-2xl font-semibold text-stone-900">Reserve your table</h2>
                    <p className="mt-2 text-stone-600">We will confirm by email within a few hours.</p>
                    <Link
                      href="/reserve"
                      className="mt-6 inline-flex rounded-full px-6 py-3 text-sm font-semibold text-white"
                      style={{ backgroundColor: 'var(--site-brand)' }}
                    >
                      Book now
                    </Link>
                  </div>
                </section>
              )
            if (t === 'about' && sectionEnabled(cfg, 'about')) return <AboutBlock key={t} cfg={cfg} />
            if (t === 'faq' && sectionEnabled(cfg, 'faq')) return <FaqBlock key={t} cfg={cfg} />
            return null
          })}
        </main>
        <RestFooter tenant={themeTenant} />
      </RestaurantShell>
    )
  }

  if (vertical === 'retail') {
    const themeTenant = toRetailTenant(tenant, tagline || 'Curated, online, and on the way.')

    if (isRetailLayoutTheme(cfg?.themeKey)) {
      const products =
        flagOn(cfg, 'showProducts') && sectionEnabled(cfg, 'products')
          ? await fetchProducts(tenant.id, 24)
          : []
      return (
        <RetailLayoutPage
          themeKey={cfg?.themeKey}
          products={products}
          tenant={themeTenant}
          config={cfg}
        />
      )
    }

    const products =
      flagOn(cfg, 'showProducts') && sectionEnabled(cfg, 'products')
        ? await fetchProducts(tenant.id, 6)
        : []
    const order = orderedTypes(cfg, ['hero', 'products', 'about', 'faq'])

    return (
      <RetailShell tenantId={tenant.id}>
        <RetailHeader tenant={themeTenant} config={cfg} />
        <main>
          {order.map((t) => {
            if (t === 'hero' && flagOn(cfg, 'showHero') && sectionEnabled(cfg, 'hero'))
              return <RetailHero key={t} tenant={themeTenant} />
            if (t === 'products' && products.length > 0)
              return (
                <section key={t} className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6">
                  <div className="flex items-end justify-between gap-4">
                    <h2 className="text-2xl font-bold text-slate-900">Featured</h2>
                    <Link href="/products" className="text-sm font-medium text-indigo-700 hover:underline">
                      Shop all →
                    </Link>
                  </div>
                  <div className="mt-8">
                    <ProductGrid products={products} />
                  </div>
                </section>
              )
            if (t === 'about' && sectionEnabled(cfg, 'about')) return <AboutBlock key={t} cfg={cfg} />
            if (t === 'faq' && sectionEnabled(cfg, 'faq')) return <FaqBlock key={t} cfg={cfg} />
            return null
          })}
        </main>
        <RetailFooter tenant={themeTenant} />
      </RetailShell>
    )
  }

  return null
}
