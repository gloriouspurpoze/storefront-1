# Storefront HTML source → React templates

Design reference HTML lives here. Each file is converted into a React layout under `storefront/themes/`.

## Launch themes (finalized)

Six layout templates ship as the default catalog. Super admins can enable/disable themes globally at **Settings → Theme catalog** and restrict per-tenant access in **Platform tenants → Storefront → Themes**.

| Vertical | `themeKey` | Display name | React implementation |
|----------|------------|--------------|----------------------|
| **retail** (e-commerce) | `classic` | Classic | Section-based homepage — `themes/retail/SiteHeader`, `ProductGrid`, `/products/[slug]` |
| retail | `soft-studio` | Soft Studio | `themes/retail/soft-studio/SoftStudioPage.tsx` |
| retail | `luxe-essence` | Luxe Essence | `themes/retail/luxe-essence/LuxeEssencePage.tsx` |
| **restaurant** | `classic` | Classic | Section-based — `themes/restaurant/SiteHeader`, `MenuSectionInteractive` |
| restaurant | `menufast-minimal` | MenuFast Minimal | `themes/restaurant/menufast/MenuFastMinimalPage.tsx` |
| restaurant | `menufast-cards` | MenuFast Cards | `themes/restaurant/menufast/MenuFastCardsPage.tsx` |

### Shared behavior (all six)

- **Nav** — logo, ☰ menu drawer, account, cart only (secondary links live in drawer/footer)
- **Shipping / delivery policy** — tenant config; modal gate at checkout; full page at `/shipping-policy`
- **E-commerce** — product card → `/products/[slug]` detail page
- **Restaurant** — menu card/row → `MenuItemDetailModal` popup
- **Sliders & banners (optional)** — tenant admin adds content in **Marketing → Sliders & banners**; when active, all six themes render:
  - **Announcement** — top marquee bar (`showOfferMarquee` toggle + CMS announcement)
  - **Offers** — promotions strip below hero/header
  - **Promo** — inline mid-homepage block
  - **Pop-ups** — overlay on homepage load (session-dismissible)
  - No content → no UI (layout collapses). Spec: [sliders-banners-storefront.md](../../docs/features/sliders-banners-storefront.md)

### Restaurant-only behavior

- **Store status** — open/closed badge from Availability settings (`orderingHours`, `slotsNote`). Shown on restaurant themes only (classic, menufast-minimal, menufast-cards). **Not** rendered on retail / e-commerce themes.

## Restaurant (`restaurant/`)

| HTML source | `themeKey` | Notes |
|-------------|------------|-------|
| `temp2/menufast_menu_templates.html` (Minimal tab) | `menufast-minimal` | List layout |
| `temp2/menufast_menu_templates.html` (Cards tab) | `menufast-cards` | Image cards |
| — | `classic` | Default section-based restaurant site |

Restaurant themes show **store status** (open/closed) from Availability settings. Retail themes do not.

Legacy layout `saffron` (`temp1/index.html`) remains in code but is hidden from the launch catalog by default.

## Retail / e-commerce (`e-commerce/`)

| HTML source | `themeKey` | Notes |
|-------------|------------|-------|
| `temp1/theme1-soft-studio.html` | `soft-studio` | D2C / boutique |
| `temp2/deepseek_html_20260615_df2e9b.html` | `luxe-essence` | Luxury retail |

## Home services

| Vertical | Layout template 1 | Layout template 2 |
|----------|-------------------|-------------------|
| `home_services` | `classic` | `trade-pro` |

Add folders under `html-source/home_services/` when design mocks are ready.

## Where tenant admin selects a template

1. Sign in to the **admin dashboard** (`/auth`)
2. Go to **Settings → Storefront** (`/settings/storefront`)
3. Open the **Themes** tab
4. Under **Layout templates**, click a card — saves immediately via `PATCH /api/storefront-studio/config` (`themeKey`)
5. Click **Preview** (top right) to open the live storefront

Catalog is served from `fixer-backend/src/modules/storefront-studio/catalog/storefrontThemes.ts`, filtered by the tenant's `verticalKey`, global `themeVisibility`, and optional per-tenant `enabledThemeKeys`. See [13-storefront-theme-catalog-api.md](../../docs/saas/13-storefront-theme-catalog-api.md).

## Ordering APIs (storefront checkout)

| Method | Path | Purpose |
|--------|------|---------|
| `POST` | `/api/public/storefront/checkout/create-order` | Validate cart, create Razorpay order |
| `POST` | `/api/public/storefront/checkout/verify` | Verify payment, create order |
| `GET` | `/api/public/storefront/orders/track` | Guest track by `orderNumber` + `email` or `phone` (`x-tenant-id`) |
| `GET` | `/api/public/storefront/customers/orders/:orderNumber/track` | Authenticated customer track (JWT + `x-tenant-id`) |

**Frontend helpers:** `fetchPublicOrderTracking` / `fetchCustomerOrderTracking` in `storefront/lib/storefront-api.ts`; UI at `/orders/track` (`TrackOrderClient`). Checkout success links pass `?orderNumber=&email=`. Checkout orchestration: `storefront/lib/runStorefrontCheckout.ts`.

## Adding a new template

1. Add HTML mock under `html-source/{vertical}/`
2. Register in `storefrontThemes.ts` with `kind: 'layout'` and `htmlSource` path
3. Build React components under `storefront/themes/{vertical}/`
4. Wire in layout router + `HomePageSections.tsx`
5. Add to global theme catalog (enabled by default or off)
6. Restart backend so catalog API picks up the new entry
