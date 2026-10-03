import React from 'react'
import Link from 'next/link'
import type { ResolvedTenant } from '@/lib/types'
import type { StorefrontConfig } from '@/lib/storefront-api'
import {
  fetchMenu,
  fetchProducts,
  fetchServices,
  fetchStorefrontCategories,
  fetchStorefrontSliders,
} from '@/lib/storefront-api'
import {
  fetchStorefrontCmsChrome,
  fetchStorefrontFaqs,
  fetchStorefrontMenuLinks,
  fetchStorefrontTestimonials,
  type StorefrontCmsFaq,
} from '@/lib/cms-content'
import { SiteHeader as HsHeader } from '@/themes/home-services/SiteHeader'
import { SiteFooter as HsFooter } from '@/themes/home-services/SiteFooter'
import { Hero as HsHero } from '@/themes/home-services/Hero'
import { ServiceGrid } from '@/themes/home-services/ServiceGrid'
import { CallToAction } from '@/themes/home-services/CallToAction'
import { toThemeTenant as toHsTenant } from '@/themes/home-services/types'
import { SiteHeader as RestHeader } from '@/themes/restaurant/SiteHeader'
import { SiteFooter as RestFooter } from '@/themes/restaurant/SiteFooter'
import { MenuSectionInteractive } from '@/themes/restaurant/MenuSectionInteractive'
import { toThemeTenant as toRestTenant } from '@/themes/restaurant/types'
import { isRestaurantLayoutTheme, RestaurantLayoutPage } from '@/themes/restaurant/restaurantLayoutRouter'
import { RestaurantShell } from '@/themes/restaurant/RestaurantShell'
import { SiteHeader as RetailHeader } from '@/themes/retail/SiteHeader'
import { SiteFooter as RetailFooter } from '@/themes/retail/SiteFooter'
import { toThemeTenant as toRetailTenant } from '@/themes/retail/types'
import { RetailShell } from '@/themes/retail/RetailShell'
import { isRetailLayoutTheme, RetailLayoutPage } from '@/themes/retail/retailLayoutRouter'
import { isHomeServicesLayoutTheme, HomeServicesLayoutPage } from '@/themes/home-services/homeServicesLayoutRouter'
import { loadStorefrontAddonBlocks } from '@/components/addons/StorefrontAddonBlocks'
import { homepageSectionOn, homepageSectionOrder, themeSectionDefaults } from '@/lib/storefrontSections'
import { AboutSection } from '@/components/sections/AboutSection'
import { CategoryTiles } from '@/components/sections/CategoryTiles'
import { FaqSection } from '@/components/sections/FaqSection'
import { HeroCarousel } from '@/components/sections/HeroCarousel'
import { ProductRail } from '@/components/sections/ProductRail'
import { PromoBand } from '@/components/sections/PromoBand'
import { Testimonials } from '@/components/sections/Testimonials'
import { UspStrip } from '@/components/sections/UspStrip'
import { buildHeroSlides } from '@/components/sections/slides'
import { IconPhone, IconShield, IconTruck } from '@/ui'

function flagOn(cfg: StorefrontConfig | null, key: string): boolean {
  const flags = cfg?.featureFlags as Record<string, boolean | undefined> | undefined
  const addons = cfg?.featureAddons ?? {}
  if (addons[key]?.purchased) return true
  return flags?.[key] !== false
}

function AboutBlock({ cfg }: { cfg: StorefrontConfig | null }) {
  return <AboutSection title={cfg?.content?.aboutTitle} body={cfg?.content?.aboutBody} />
}

function FaqBlock({
  cfg,
  faqs,
}: {
  cfg: StorefrontConfig | null
  faqs?: StorefrontCmsFaq[]
}) {
  // CMS `/cms/faqs` is SSoT; Studio faqItems only if CMS empty.
  const items = faqs?.length ? faqs : (cfg?.content?.faqItems ?? [])
  if (!items.length || !flagOn(cfg, 'showFaq')) return null
  return <FaqSection items={items} />
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
  // Server-resolved block order for the active theme (see lib/storefrontSections.ts).
  const sectionDefaults = themeSectionDefaults(cfg?.themeKey, vertical)
  const on = (type: string) => homepageSectionOn(cfg, sectionDefaults, type)
  const order = homepageSectionOrder(cfg, sectionDefaults)
  // Paid add-on blocks (AMC / loyalty / B2B) — rendered above the footer in every theme.
  const addonsSlot = await loadStorefrontAddonBlocks(tenant.id, cfg)

  if (vertical === 'home_services') {
    const themeTenant = toHsTenant(
      tenant,
      cfg?.content?.heroHeadline || tagline || 'Trusted local pros, on demand.',
    )

    if (isHomeServicesLayoutTheme(cfg?.themeKey)) {
      const [navLinks, footerLinks, services, faqs, testimonials] = await Promise.all([
        fetchStorefrontMenuLinks(tenant.id, 'header'),
        fetchStorefrontMenuLinks(tenant.id, 'footer'),
        flagOn(cfg, 'showServices') && on('services')
          ? fetchServices(tenant.id, 6)
          : Promise.resolve([]),
        flagOn(cfg, 'showFaq') && on('faq') ? fetchStorefrontFaqs(tenant.id) : Promise.resolve([]),
        flagOn(cfg, 'showTestimonials') && on('trust')
          ? fetchStorefrontTestimonials(tenant.id)
          : Promise.resolve([]),
      ])
      return (
        <HomeServicesLayoutPage
          themeKey={cfg?.themeKey}
          tenant={themeTenant}
          config={cfg}
          navLinks={navLinks}
          footerLinks={footerLinks}
          services={services}
          faqs={faqs}
          testimonials={testimonials}
          addonsSlot={addonsSlot}
        />
      )
    }

    const [services, chrome] = await Promise.all([
      flagOn(cfg, 'showServices') && on('services')
        ? fetchServices(tenant.id, 6)
        : Promise.resolve([]),
      fetchStorefrontCmsChrome(tenant.id, vertical),
    ])
    const { headerNavLinks, footerNavLinks, faqs, testimonials } = chrome

    const blocks: Record<string, React.ReactNode> = {
      hero: flagOn(cfg, 'showHero') && on('hero') ? <HsHero tenant={themeTenant} /> : null,
      trust:
        flagOn(cfg, 'showTestimonials') && on('trust') ? (
          <Testimonials testimonials={testimonials} title="What customers say" />
        ) : null,
      services:
        services.length > 0 ? (
          <ServiceGrid
            services={services}
            title="Popular services"
            subtitle="Hand-picked, frequently booked, instantly available."
          />
        ) : null,
      about: on('about') ? <AboutBlock cfg={cfg} /> : null,
      faq: on('faq') ? <FaqBlock cfg={cfg} faqs={faqs} /> : null,
      cta: on('cta') ? <CallToAction /> : null,
    }

    return (
      <>
        <HsHeader tenant={themeTenant} navLinks={headerNavLinks} />
        <main>
          {order.map((t) => (blocks[t] ? <div key={t}>{blocks[t]}</div> : null))}
          {addonsSlot}
        </main>
        <HsFooter tenant={themeTenant} navLinks={footerNavLinks} />
      </>
    )
  }

  if (vertical === 'restaurant') {
    const themeTenant = toRestTenant(tenant, tagline || 'Where the menu meets the moment.')

    // ── Full layout templates (saffron, menufast-minimal, menufast-cards) ───
    if (isRestaurantLayoutTheme(cfg?.themeKey)) {
      const [menu, products, navLinks, footerLinks] = await Promise.all([
        fetchMenu(tenant.id),
        // Products feed the menu views; they are not a separate homepage block.
        flagOn(cfg, 'showProducts')
          ? fetchProducts(tenant.id, 80)
          : Promise.resolve([]),
        fetchStorefrontMenuLinks(tenant.id, 'header'),
        fetchStorefrontMenuLinks(tenant.id, 'footer'),
      ])
      return (
        <RestaurantLayoutPage
          themeKey={cfg?.themeKey}
          menu={menu}
          products={products}
          tenant={themeTenant}
          config={cfg}
          navLinks={navLinks}
          footerLinks={footerLinks}
          addonsSlot={addonsSlot}
        />
      )
    }
    // ──────────────────────────────────────────────────────────────────────────

    const [menu, chrome, sliders] = await Promise.all([
      flagOn(cfg, 'showMenu') && on('menu')
        ? fetchMenu(tenant.id)
        : Promise.resolve([]),
      fetchStorefrontCmsChrome(tenant.id, vertical),
      flagOn(cfg, 'showHero') && on('hero')
        ? fetchStorefrontSliders(tenant.id, { placement: 'home_page_hero' })
        : Promise.resolve([]),
    ])
    const preview = menu.slice(0, 2)
    const { headerNavLinks, footerNavLinks, faqs, testimonials } = chrome
    const reservationsOn = flagOn(cfg, 'showReservations') && on('reservations')
    const heroSlides = buildHeroSlides(sliders, cfg, {
      eyebrow: 'Welcome',
      title: tenant.name,
      subtitle: themeTenant.tagline,
      ctaLabel: 'Order now',
      ctaHref: '/menu',
    }).map((slide, i) =>
      i === 0 && reservationsOn ? { ...slide, secondaryLabel: 'Book a table', secondaryHref: '/reserve' } : slide,
    )

    return (
      <RestaurantShell tenantId={tenant.id}>
        <RestHeader tenant={themeTenant} config={cfg} navLinks={headerNavLinks} />
        <main>
          {order.map((t) => {
            if (t === 'hero' && flagOn(cfg, 'showHero') && on('hero'))
              return <HeroCarousel key={t} slides={heroSlides} />
            if (t === 'menu' && preview.length > 0)
              return (
                <section key={t} className="sf-section sf-container">
                  <div className="sf-section-head">
                    <div>
                      <p className="sf-eyebrow">Fresh today</p>
                      <h2 className="sf-heading">From our kitchen</h2>
                    </div>
                    <Link href="/menu" className="sf-btn sf-btn--link">
                      Full menu
                    </Link>
                  </div>
                  <MenuSectionInteractive categories={preview} compact />
                </section>
              )
            if (
              t === 'trust' &&
              flagOn(cfg, 'showTestimonials') &&
              on('trust') &&
              testimonials.length > 0
            )
              return <Testimonials key={t} testimonials={testimonials} />
            if (t === 'reservations' && reservationsOn)
              return (
                <PromoBand
                  key={t}
                  eyebrow="Reservations"
                  title="Reserve your table"
                  text="We will confirm by email within a few hours."
                  ctaLabel="Book now"
                  ctaHref="/reserve"
                />
              )
            if (t === 'about' && on('about')) return <AboutBlock key={t} cfg={cfg} />
            if (t === 'faq' && on('faq'))
              return <FaqBlock key={t} cfg={cfg} faqs={faqs} />
            return null
          })}
          {addonsSlot}
        </main>
        <RestFooter tenant={themeTenant} navLinks={footerNavLinks} config={cfg} />
      </RestaurantShell>
    )
  }

  if (vertical === 'retail') {
    const themeTenant = toRetailTenant(tenant, tagline || 'Curated, online, and on the way.')

    if (isRetailLayoutTheme(cfg?.themeKey)) {
      const showProducts = flagOn(cfg, 'showProducts') && on('products')
      const [products, categories, navLinks, footerLinks] = await Promise.all([
        showProducts ? fetchProducts(tenant.id, 80) : Promise.resolve([]),
        cfg?.themeKey === 'luxe-essence' ? fetchStorefrontCategories(tenant.id) : Promise.resolve([]),
        fetchStorefrontMenuLinks(tenant.id, 'header'),
        fetchStorefrontMenuLinks(tenant.id, 'footer'),
      ])
      return (
        <RetailLayoutPage
          themeKey={cfg?.themeKey}
          products={products}
          categories={categories}
          tenant={themeTenant}
          config={cfg}
          navLinks={navLinks}
          footerLinks={footerLinks}
          addonsSlot={addonsSlot}
        />
      )
    }

    const showProducts = flagOn(cfg, 'showProducts') && on('products')
    const [products, categories, sliders, chrome] = await Promise.all([
      showProducts ? fetchProducts(tenant.id, 24) : Promise.resolve([]),
      fetchStorefrontCategories(tenant.id),
      flagOn(cfg, 'showHero') && on('hero')
        ? fetchStorefrontSliders(tenant.id, { placement: 'home_page_hero' })
        : Promise.resolve([]),
      fetchStorefrontCmsChrome(tenant.id, vertical),
    ])
    const { headerNavLinks, footerNavLinks, faqs, testimonials } = chrome
    const heroSlides = buildHeroSlides(sliders, cfg, {
      eyebrow: 'New arrivals',
      title: tenant.name,
      subtitle: themeTenant.tagline,
      ctaLabel: 'Shop collection',
      ctaHref: '/products',
    })
    const onSale = products.filter((p) => p.inStock && p.originalPrice && p.originalPrice > p.price)

    return (
      <RetailShell tenantId={tenant.id}>
        <RetailHeader tenant={themeTenant} config={cfg} navLinks={headerNavLinks} categories={categories} />
        <main>
          {order.map((t) => {
            if (t === 'hero' && flagOn(cfg, 'showHero') && on('hero'))
              return (
                <React.Fragment key={t}>
                  <HeroCarousel slides={heroSlides} />
                  <UspStrip
                    items={[
                      { icon: <IconShield />, title: 'Secure checkout', text: 'Safe, encrypted payments' },
                      { icon: <IconTruck />, title: 'Track every order', text: 'Live status from cart to door' },
                      { icon: <IconPhone />, title: 'Real support', text: `Help from the ${tenant.name} team` },
                    ]}
                  />
                </React.Fragment>
              )
            if (t === 'products' && products.length > 0)
              return (
                <React.Fragment key={t}>
                  <CategoryTiles categories={categories} products={products} />
                  <ProductRail eyebrow="Just in" title="New arrivals" products={products.slice(0, 12)} />
                  {onSale.length >= 2 && (
                    <ProductRail eyebrow="Limited time" title="On sale" products={onSale.slice(0, 12)} />
                  )}
                </React.Fragment>
              )
            if (
              t === 'trust' &&
              flagOn(cfg, 'showTestimonials') &&
              on('trust') &&
              testimonials.length > 0
            )
              return <Testimonials key={t} testimonials={testimonials} />
            if (t === 'about' && on('about')) return <AboutBlock key={t} cfg={cfg} />
            if (t === 'faq' && on('faq'))
              return <FaqBlock key={t} cfg={cfg} faqs={faqs} />
            if (t === 'giftMatch')
              return (
                <PromoBand
                  key={t}
                  eyebrow="Gift match"
                  title="Not sure what to gift?"
                  text="Tell us who it’s for and we’ll suggest a few handcrafted picks."
                  ctaLabel="Try gift match"
                  ctaHref="/gifts"
                />
              )
            return null
          })}
          {addonsSlot}
        </main>
        <RetailFooter tenant={themeTenant} navLinks={footerNavLinks} config={cfg} />
      </RetailShell>
    )
  }

  return null
}
