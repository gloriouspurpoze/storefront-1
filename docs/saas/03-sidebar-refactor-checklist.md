# Sidebar Refactor Checklist — Core vs `home_services` Pack vs Deprecated

> Every group and item in today's `src/components/layout/sidebar.tsx` `navigationGroups` array, classified for the multi-vertical refactor. Use this as the **concrete worklist** when extracting the `home_services` pack and the core manifest.

## Classification key

| Tag | Meaning |
|---|---|
| **CORE** | Belongs to `packages/verticals/core/manifest.ts` — every vertical sees this |
| **PACK** | Belongs to `packages/verticals/home_services/manifest.ts` — only home-services tenants see this |
| **CORE + module-gated** | Stays in core but requires a `featureModules` entry (CRM, finance, etc.) |
| **DEPRECATE** | Candidate for removal / consolidation post-refactor — confirm with product |
| **PLATFORM-ONLY** | Visible only when `user.tenantId === null` (you, the platform operator) |

---

## Group 1 — `Overview` (sidebar.tsx lines 231–252)

| Item | Path | Classification | Notes |
|---|---|---|---|
| Dashboard | `/` | **CORE** | Widgets per vertical via `pack.dashboardWidgets` |
| Analytics | `/analytics` | **CORE** | Vertical packs can register extra report tabs |
| Catalog performance | `/analytics/catalog` | **CORE** | The word "catalog" is vertical-neutral — restaurants and salons also have catalog performance |
| Growth funnels | `/analytics/funnels` | **CORE** | Universal |

---

## Group 2 — `CRM` (sidebar.tsx lines 253–265)

All items: **CORE + module-gated (`crm`)**.

| Item | Path | Classification |
|---|---|---|
| CRM overview | `/crm` | CORE + `module: 'crm'` |
| Leads | `/crm/leads` | CORE + `module: 'crm'` |
| Contacts | `/crm/contacts` | CORE + `module: 'crm'` |
| B2B accounts | `/crm/companies` | CORE + `module: 'crm'` |
| Deals | `/crm/deals` | CORE + `module: 'crm'` |
| Activities | `/crm/activities` | CORE + `module: 'crm'` |
| CRM settings | `/crm/settings` | CORE + `module: 'crm'` |

> No vertical-specific changes. Restaurants/salons want CRM identically.

---

## Group 3 — `Operations` (sidebar.tsx lines 266–408) — **THE BIG ONE**

This group today is a mix of home-services-specific, money/finance core, and team collaboration core. Split into three target groups after refactor.

### 3a. Home-services-specific items → move to `home_services` pack

| Item | Path | Classification | Restaurant rename | Salon rename |
|---|---|---|---|---|
| Bookings | `/bookings` | **PACK** | "Reservations" | "Appointments" |
| AMC contracts | `/amc/overview` | **PACK** + `module: 'amc'` | "Catering contracts" | "Annual memberships" |
| Rate cards | `/rate-cards/overview` | **PACK** | "Menu pricing" | "Treatment pricing" |
| Fees & cities | `/operations/commercial/terms` | **PACK** | "Tax zones" | "Salon zones" |
| Professional assets | `/operations/provider-assets` | **PACK** | "Kitchen equipment" | "Stylist tools" |
| Conduct & incentives | `/operations/professional-conduct` | **PACK** | "Tipping & KRAs" | "Stylist commission" |
| POS — Home services | `/operations/pos` | **PACK** | Replaced by `restaurant_pos` | Replaced by `salon_pos` |
| Industry operations | `/operations` | **PACK** | Replaced by `restaurant_ops_hub` | Replaced by `salon_ops_hub` |
| Dispute cases | `/operations/dispute-cases` | **PACK** | Order disputes | Service disputes |
| Service requests | `/requests` | **PACK** | "Walk-in orders" | "Walk-in leads" |
| Quotes | `/quotes` | **PACK** | "Catering quotes" | "Bridal quotes" |

### 3b. Money items → new CORE group `Money`

| Item | Path | Classification |
|---|---|---|
| Payments | `/payments` | **CORE** |
| Invoices | `/invoices` | **CORE** |
| Invoice appearance | `/invoices/branding` | **CORE** |
| Earnings & Payouts | `/payouts` | **CORE** |
| Finance | `/finance/overview` | **CORE + module: 'finance'** |
| Founder Finance | `/finance/founder/dashboard` | **CORE + module: 'finance'** + **PLATFORM-ONLY** (consider) |
| Subscriptions | `/subscriptions` | **CORE** |

> "Founder finance" is genuinely **platform-level** (your business's view across all tenants). Restrict to platform operators or rename to `Company Finance` to keep tenant-scoped.

### 3c. Collaboration items → new CORE group `Team & collaboration`

| Item | Path | Classification |
|---|---|---|
| Boards | `/boards` | **CORE** |
| Team work | `/team-work` | **CORE + module: 'team_work'** |
| Team calendar | `/team-work/calendar` | **CORE + module: 'team_work'** |
| Chat | `/chat` | **CORE** |

---

## Group 4 — `Commerce` (sidebar.tsx lines 409–498)

Generic e-commerce features that several verticals can opt into. Belongs to **CORE**, but gated by a new module key `ecommerce`.

| Item | Path | Classification | Notes |
|---|---|---|---|
| Store overview | `/ecommerce` | **CORE + module: 'ecommerce'** | Universal |
| Products | `/products` | **CORE + module: 'ecommerce'** | Universal |
| Inventory | `/inventory` | **CORE + module: 'ecommerce'** | Universal |
| Orders | `/orders` | **CORE + module: 'ecommerce'** | Universal |
| Offers & listing chats (Bazaar) | `/bazaar` | **CORE + module: 'bazaar'** | Already module-gated; keep as-is |
| Listing review | `/bazaar/listing-review` | **CORE + module: 'bazaar'** | Same |
| Module & AI settings | `/bazaar/module-settings` | **CORE + module: 'bazaar'** | Same |
| Pro-Verify queue | `/bazaar/pro-verify` | **PACK** (`home_services`) | Pro-Verify is a workforce verification surface — vertical-specific |

> Decision needed: is **Bazaar** a generic peer-to-peer marketplace (CORE), or specifically a home-services-pro listing marketplace (PACK)? Audit reads as "core marketplace with vertical-flavored verification queue."

---

## Group 5 — `Catalog & network` (sidebar.tsx lines 499–543)

| Item | Path | Classification | Notes |
|---|---|---|---|
| Product categories | `/categories/products` | **CORE + module: 'ecommerce'** | Universal — used by Products module |
| Service categories | `/categories/services` | **PACK** | Renamed per pack: menu categories, treatment categories, procedure categories |
| Platform services | `/platform-services` | **PACK** | This *is* the home-services catalog |
| Marketplace | `/marketplace` | **PACK** | Pro discovery surface — home-services-specific |
| Professionals | `/professionals` | **PACK** | Workforce — renames per vertical (Stylists / Chefs / Doctors) |
| Workforce dashboard | `/professionals/operations` | **PACK** | Same rename rule |
| Provider Applications | `/provider-applications` | **PACK** | Onboarding workflow is vertical-specific |

---

## Group 6 — `Content & Marketing` (sidebar.tsx lines 544–652)

Almost entirely CORE (every vertical needs a website + marketing engine). Two sub-areas need attention.

### 6a. `Site structure` submenu — **CORE + module: 'cms'**

| Sub-item | Path | Classification |
|---|---|---|
| CMS overview | `/cms` | CORE + `module: 'cms'` |
| Homepage | `/cms/homepage` | CORE + `module: 'cms'` |
| Site appearance | `/cms/site-appearance` | CORE + `module: 'cms'` |
| Pages | `/cms/pages` | CORE + `module: 'cms'` |
| Menus | `/cms/menus` | CORE + `module: 'cms'` |
| Media library | `/cms/media` | CORE + `module: 'cms'` |

### 6b. `Surfaces & promotions` submenu — **CORE + module: 'marketing_workspace'**

| Sub-item | Path | Classification | Notes |
|---|---|---|---|
| Sliders & banners | `/sliders` | CORE + `module: 'cms'` | Universal |
| Coupons & promo codes | `/coupons` | CORE + `module: 'marketing_workspace'` | Universal |
| **Service bundles** | `/marketing/service-combos` | **PACK** | Today named "service" — restaurants want "menu combos", salons "treatment packages". Rename in pack: `combos`. |
| **Cart spend tiers** | `/marketing/cart-tiers` | CORE | Universal (any vertical with a cart) |
| Referrals | `/referrals` | CORE + `module: 'marketing_workspace'` | Universal |

### 6c. `Editorial & social proof` submenu — **CORE + module: 'cms'**

All items: CORE. No vertical-specific renames.

| Sub-item | Path |
|---|---|
| Blog posts | `/cms/blogs` |
| Blog categories | `/cms/blog-categories` |
| Newsletter | `/cms/newsletter` |
| Email templates | `/cms/email-templates` |
| Social links | `/cms/social-links` |
| Testimonials | `/cms/testimonials` |
| Reviews | `/cms/reviews` |
| FAQs | `/cms/faqs` |

### 6d. `Catalog & SEO` submenu — **PACK** (mixed)

The word "industry" already implies vertical-specificity. Today's "industry pages" are home-services categories.

| Sub-item | Path | Classification |
|---|---|---|
| Industry — Landing & SEO | `/cms/category-marketing` | **PACK** (per-vertical landing pages) |
| Industry — Service areas | `/cms/category-marketing?tab=service-areas` | **PACK** |
| Industry — Rate card | `/cms/category-marketing?tab=rate-card` | **PACK** |
| Industry — Cross-linking | `/cms/category-marketing?tab=cross-linking` | **PACK** |
| SEO management | `/cms/seo` | **CORE + module: 'cms'** | Generic technical SEO |

> Long-term: rename `/cms/category-marketing` to `/cms/vertical-landing` and let each pack contribute its own tab set.

### 6e. `Marketing workspace` submenu — **CORE + module: 'marketing_workspace'**

All items: CORE. Workflow is universal.

| Sub-item | Path |
|---|---|
| Overview | `/marketing` |
| Campaigns | `/marketing/campaigns` |
| Content calendar | `/marketing/calendar` |
| Social posts | `/marketing/social` |
| Planning & ideas | `/marketing/planning` |
| Tasks | `/marketing/tasks` |
| R&D & brainstorm | `/marketing/lab` |

---

## Group 7 — `People & messaging` (sidebar.tsx lines 653–668)

All CORE.

| Item | Path | Classification |
|---|---|---|
| Customers | `/users/customers` | **CORE** |
| Team members | `/users/members` | **CORE** |
| Notifications | `/notifications` | **CORE** |

> "Messages" route (`/messages`) is commented out in sidebar today. **DEPRECATE** — `/chat` supersedes it.

---

## Group 8 — `Knowledge kit` (sidebar.tsx lines 669–681)

| Item | Path | Classification | Notes |
|---|---|---|---|
| Guides overview | `/knowledge-kit` | **CORE** | Pack can register extra guide entries (e.g. restaurant: "FSSAI compliance guide") |

Existing sub-routes (`/knowledge-kit/operations-commercial-terms`, `/knowledge-kit/content-marketing`) are visible by direct link only. Both should become **PACK-contributed** content pages, with the URL pattern `/knowledge-kit/<pack-key>/<guide-slug>`.

---

## Group 9 — `System` (sidebar.tsx lines 682–727)

| Item | Path | Classification | Notes |
|---|---|---|---|
| Reports | `/reports` | **CORE** | Pack registers extra report templates via `pack.reports` |
| System Status | `/system-status` | **CORE** | Universal |
| Refund requests | `/support/refund-requests` | **CORE** | Universal payment flow |
| Support tickets | `/support/tickets` | **CORE** | Universal |
| Settings | `/settings` | **CORE** | Universal |
| Roles & access | `/settings/access` | **CORE** | Universal RBAC |
| Help & Support | `/support` | **CORE** | Universal |
| SaaS platform | `/settings/saas` | **PLATFORM-ONLY** | Hidden for tenant admins; visible only to platform operators |
| Organizations | `/settings/tenants` | **PLATFORM-ONLY** | Same |

---

## Summary counts

| Classification | Item count | What it means |
|---|---|---|
| **CORE** (always-on) | ~38 items | Stays in `packages/verticals/core` |
| **CORE + module-gated** | ~16 items | Stays in core; gated by `Tenant.featureModules` |
| **PACK (`home_services`)** | ~18 items | Moves to `packages/verticals/home_services` |
| **PLATFORM-ONLY** | 2 items | Visible only when `user.tenantId === null` |
| **DEPRECATE** | 1 item (`/messages`) | Remove or hard-redirect to `/chat` |

**Take-away:** ~70% of the current sidebar is already vertical-agnostic. The pack extraction is mostly a **relocation** exercise — only ~20 items move out of the central array into the home-services pack file. Most engineering effort is in:

1. Building the `loadSidebarForTenant()` loader + sidebar refactor (~1 week).
2. Adding `verticalKey` field to `Tenant` + onboarding flow (~3 days).
3. Validating pack manifests with zod and writing CI tests (~2 days).
4. Documenting the contract so future verticals (restaurant, salon) can be built without re-reading this whole repo (~1 day).

---

## Concrete refactor steps (in order)

1. **Add `verticalKey` to `Tenant` schema** — backend + `tenantSlice` + `PlatformTenantRow` interface. Backfill all existing tenants as `home_services`. Ship.
2. **Create `packages/verticals/core/types.ts`** with the `VerticalPack` contract from doc 02.
3. **Create `packages/verticals/core/manifest.ts`** with the CORE groups listed above.
4. **Create `packages/verticals/home_services/manifest.ts`** with the PACK groups listed above.
5. **Create `loadSidebarForTenant()`** in `src/lib/loadVerticalSidebar.ts`.
6. **Refactor `src/components/layout/sidebar.tsx`** to consume `loadSidebarForTenant(tenant.verticalKey)` instead of the hardcoded `navigationGroups` constant.
7. **Add zod validation** of pack manifests in dev mode; add CI test.
8. **Update RBAC `routePermissions` registry** to mark vertical-specific routes — optional but cleaner.
9. **DEPRECATE `/messages`** — confirm with product, remove route + sidebar entry.
10. **Decide on Bazaar classification** — core (with `module: 'bazaar'`) or pack (`home_services`).
11. **Decide on Founder Finance scope** — PLATFORM-ONLY or rename to `Company Finance` for tenant-scoped use.

After step 6, you can ship — production behavior is identical because there's only one vertical. Steps 7–11 are cleanup. Then start building the second vertical pack (salon or restaurant) without touching the host app.
