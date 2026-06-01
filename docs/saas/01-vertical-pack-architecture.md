# Vertical Pack Architecture — Multi-Vertical SaaS Design

> How to evolve `fixer-admin` from a single-vertical (home services) platform into a multi-vertical SaaS supporting restaurants, salons, clinics, gyms, auto-repair, tutoring, etc. — without forking the codebase.

## TL;DR

- A **Vertical** is a product surface (schema extensions + sidebar groups + workflows + KPIs).
- A **Tenant** is a paying customer; each tenant picks **one primary vertical** at signup.
- A **Plan** is a pricing tier within a vertical (Starter / Pro / Enterprise).
- Today's code is implicitly a `home_services` vertical mixed with shared core. We **extract the pack** without rewriting.
- 80% of modules (CRM, Finance, CMS, Marketing, Auth, RBAC) are already universal. 20% (bookings/professionals/POS/AMC/rate-cards) is the home-services pack.

## 1. Concepts

### 1.1 Three independent enforcement layers

When the sidebar / a route / an API renders, **three** gates intersect:

```text
visible(feature) =
    tenant.verticalKey                 INCLUDES feature   ← vertical pack (NEW)
  ∩ tenant.featureModules              INCLUDES feature   ← plan/entitlement (exists)
  ∩ user.permissions                   INCLUDES feature   ← RBAC (exists)
```

| Layer | Source of truth | Enforced by |
|---|---|---|
| **Vertical pack** | `verticalPacks/<key>/manifest.ts` | New `buildSidebarFromPack()` + backend route registry |
| **Module entitlement** | `Tenant.featureModules` array | Backend `requireTenantFeature` (already) |
| **RBAC permissions** | `User.rbacRole` + `permissions` | `src/config/rbac.config.ts` + `usePermissions` (already) |

### 1.2 Vertical vs tenant vs plan

| | Vertical | Tenant | Plan |
|---|---|---|---|
| What | Industry pack | One customer | Pricing tier |
| Picked by | Platform builds it once | Customer at signup | Customer at signup |
| Mutates | Platform releases (`packVersion`) | Customer settings | Billing event |
| Examples | `home_services`, `restaurant`, `salon`, `clinic`, `fitness`, `auto_repair`, `tutoring` | "Sharma Plumbing", "Mumbai Coffee House" | `restaurant_pro_monthly`, `home_services_enterprise_yearly` |

**Critical rule:** a tenant can rarely change verticals (it's effectively a re-implementation). A tenant changes plans freely.

### 1.3 What you already have (don't rebuild)

| Capability | Where it lives |
|---|---|
| Tenant identity (`id`, `slug`, `name`) | `src/store/slices/tenantSlice.ts` |
| `X-Tenant-Id` header on every API call | `src/lib/saasEnv.ts` + `src/services/api/base.ts` |
| Per-tenant feature module allowlist | `featureModules: string[]` in `platformTenants.service.ts` |
| Backend route gating per module | `requireTenantFeature` (`cms`, `crm`, `finance`, `marketing_workspace`, `team_work`, `bazaar`) |
| Custom domain mapping per tenant | `addDomain` / `listDomains` |
| Billing metadata fields | `stripeCustomerId`, `stripeSubscriptionId`, `planKey` |
| RBAC (roles × permissions) | `src/config/rbac.config.ts`, `usePermissions` |
| Tenant CRUD admin UI | `src/pages/settings/PlatformTenantsPage.tsx` |

**Missing layer:** the **vertical pack** abstraction. Today the sidebar in `src/components/layout/sidebar.tsx` is a hardcoded array assuming home services.

---

## 2. Domain modeling — shared core vs vertical extensions

### 2.1 Universal modules (already vertical-agnostic)

These keep their current names and behavior — every vertical needs them:

- Auth, RBAC, Tenants, Billing, Settings, Roles & access
- CRM (leads / contacts / companies / deals / activities)
- Finance (expenses / budgets / reconciliation / recurring / directory)
- Team work + calendar
- Chat / messages / notifications
- CMS (pages / blog / SEO / menus / site theme / media library)
- Marketing workspace + coupons + referrals
- Sliders & banners
- Reports + analytics dashboard shell (widgets differ per vertical)
- Company documents (e-sign)
- Users (customers + team members)

### 2.2 Vertical-specific modules today (the home_services pack)

These look "core" but are actually home-services-flavored:

| Today's module | Vertical-specific because… | Restaurant equivalent | Salon equivalent | Clinic equivalent |
|---|---|---|---|---|
| `bookings` | Slot-based service appointment | Table reservation | Chair appointment | Patient appointment |
| `professionals` / `providers` | Service workforce model | Servers / chefs | Stylists / therapists | Doctors / nurses |
| `services` / `platform-services` | Services catalog | Menu items | Treatments | Procedures |
| `service-requests` | "Customer wants X" lead | Walk-in order | Walk-in lead | Walk-in patient |
| `quotes` | Service quote | Catering / event quote | Bridal package quote | Treatment estimate |
| `rate-cards` | Service price list | Menu price list | Treatment price list | Procedure price list |
| `amc` | Annual maintenance contract | Catering contract | Annual membership | Annual care plan |
| `operations/pos` | On-site service POS | Restaurant POS + KOT | Salon POS | Clinic billing |
| `operations/dispute-cases` | Booking disputes | Order disputes | Service disputes | Billing disputes |
| `operations/commercial/*` | Fees & cities for home services | Restaurant tax zones | Salon city zones | Clinic network |
| `operations/provider-assets` | Tools / uniforms | Kitchen equipment | Stylist tools | Clinical assets |
| `operations/professional-conduct` | Conduct & incentives | Tipping pool / KRA | Stylist commission | Bedside conduct |

### 2.3 The abstract entities

To avoid an `if (vertical === 'restaurant')` explosion, introduce 3 vertical-agnostic core entities:

```ts
// 1. Engagement — the unit of customer value
interface Engagement {
  _id: string
  tenantId: string
  verticalKey: VerticalKey
  type: string                   // pack-defined: 'booking' | 'reservation' | 'appointment' | 'order'
  status: string                 // pack-defined state machine
  customerId: string
  assigneeIds: string[]          // workforce members
  scheduledAt?: Date
  location?: { type, address?, tableNo?, room?, chairNo? }
  lineItems: Array<{ catalogItemId, qty, price, taxRate, modifiers? }>
  totals: { subtotal, tax, discount, total, currency }
  customFields: Record<string, unknown>   // pack-defined extensions
  notes?: string
}

// 2. CatalogItem — anything sold (services, products, menu items, treatments, procedures)
interface CatalogItem {
  tenantId, verticalKey,
  kind: 'service' | 'product' | 'menu_item' | 'treatment' | 'procedure' | 'package',
  name, description, images,
  pricing, modifiers?, durationMinutes?, allergens?, skillRequired?,
  categoryIds, customFields,
}

// 3. WorkforceMember — anyone delivering value
interface WorkforceMember {
  tenantId, verticalKey,
  role: 'individual' | 'company',
  vertical_role: string,                  // 'plumber' | 'chef' | 'stylist' | 'doctor'
  skills, certifications, schedule, availability,
  earningsConfig: { commissionPct?, fixedSalary?, tipShare? },
}
```

Your existing `Booking`, `Service`, `Professional`, `Provider` collections can stay; they become the **storage backend for the `home_services` pack**. A future restaurant pack uses different storage (or the same with `verticalKey: 'restaurant'`).

---

## 3. The Vertical Pack contract

Each vertical is a **directory + manifest** that the app loads at boot.

```text
packages/verticals/
├── core/
│   └── manifest.ts                # always-on sidebar groups
├── home_services/
│   ├── manifest.ts
│   ├── statuses.ts
│   ├── customFields.ts
│   └── dashboardWidgets.ts
├── restaurant/
│   └── manifest.ts
└── salon/
    └── manifest.ts
```

The contract is in `docs/saas/02-vertical-pack-typescript-contract.md`.

A pack manifest exports:

- **Identity:** `key`, `label`, `icon`, `version`, `description`
- **Sidebar groups & items** with screen names and permission gates
- **Engagement state machine** (statuses + transitions)
- **Custom field registry** (with zod schemas)
- **Dashboard widgets** (KPIs)
- **Default modules** (`featureModules` seeded at tenant creation)
- **Tax strategy** and **compliance** hooks
- **Default taxonomy** seed (categories on day 1)
- **Integration list** (Zomato, Swiggy, Razorpay, Twilio, etc.)

---

## 4. Schema strategy in MongoDB

You're on **single DB with `tenantId` on every doc** today — keep this. Add:

| Schema | Change |
|---|---|
| `Tenant` | Add `verticalKey: VerticalKey` (required), `additionalVerticals?: VerticalKey[]`, `packVersion: string`, `industrySettings: Record<string, unknown>` |
| `Engagement` (new collection OR view) | Add or migrate from `Booking` |
| `CatalogItem` (new collection OR view) | Add or migrate from `Service` + `Product` |
| All existing collections | Backfill `verticalKey: 'home_services'` for legacy data |

**Indexes per vertical:** packs can declare required indexes (e.g. restaurant adds `(tenantId, scheduledAt, tableNo)`). Apply during pack installation/migration.

### 4.1 What about HARD-isolated tenants?

For enterprise customers (e.g. a large hospital chain) you can offer **DB-per-tenant** as a premium option — same pack system, different storage adapter. Not on day 1.

---

## 5. Tenant onboarding flow (with vertical selection)

Extend `PlatformTenantsPage` (`src/pages/settings/PlatformTenantsPage.tsx`):

1. **Step 1 — Identity:** name, slug, owner email.
2. **Step 2 — Vertical:** card-based picker showing each pack's `label`, `icon`, `description`. Required.
3. **Step 3 — Plan:** plans filtered by vertical (`restaurant_starter`, `restaurant_pro`, etc.).
4. **Step 4 — Modules:** prefilled from `pack.defaultModules`; advanced user can toggle.
5. **Step 5 — Industry settings:** pack-defined extra fields (FSSAI no., GST type, etc.).
6. **Submit:** backend creates `Tenant` with all fields + seeds default taxonomy via `pack.seed()`.

---

## 6. Pricing & billing strategy

### 6.1 Two dimensions

| Dimension | Mechanism |
|---|---|
| **Vertical** | Different plans/SKUs per vertical (different value, different competition) |
| **Plan tier** | Starter / Pro / Enterprise within a vertical |

### 6.2 Plans registry

```text
packages/billing/src/plans.ts
```

```ts
type Plan = {
  key: string
  verticalKey: VerticalKey
  pricePerMonth: number
  currency: 'INR' | 'USD' | ...
  limits: {
    branches?: number
    staffSeats?: number
    monthlyEngagements?: number
    aiCredits?: number
    customDomains?: number
  }
  includedModules: string[]   // -> seeded into Tenant.featureModules
  addons: string[]            // upsells
  trialDays?: number
}
```

### 6.3 Enforcement

- **Soft gates (UI):** banners — *"You've used 4,500 of 5,000 engagements this month. Upgrade."*
- **Hard gates (API):** 402 Payment Required when limits crossed.
- **Stripe / Razorpay** holds source of truth on subscription; `Tenant.planKey` is local cache.

---

## 7. White-label & custom domains

You already have multi-domain. Extend per-vertical:

- **Custom domain → tenant resolution** at the edge (Cloudflare Worker / reverse proxy) → loads tenant + `verticalKey` + theme.
- **Consumer-facing site templates** per vertical:
  - `home_services` site template (current `profixer.in`)
  - `restaurant` site template (menu, reservations, online ordering)
  - `salon` site template (treatment catalog, booking calendar)
- **Email/SMS sender** per tenant (you have `EmailTemplatesManagement` — make defaults per vertical).

---

## 8. Mobile app + vertical packs

Your `docs/mobile/` companion app **also reads pack manifests**. The bottom-tab config from `docs/mobile/03-navigation-map-sidebar-to-mobile.md` becomes:

```ts
const tabs = pack.mobile?.tabs ?? defaultAdminTabs
```

A restaurant tenant on mobile gets: `Reservations`, `Tables`, `KDS`, `Chat`, `More`.
A salon tenant on mobile gets: `Appointments`, `Schedule`, `POS`, `Chat`, `More`.

---

## 9. Concrete vertical examples

### 9.1 Restaurant pack

| Area | New screens / models |
|---|---|
| Engagements | `TableFloor`, `Reservations`, `WalkInQueue`, `OrderTaking` |
| Kitchen | `KDS` (Kitchen Display), `KOTQueue`, printer config |
| Menu | `MenuItems`, `Modifiers` (size, spice), `Combos`, daily specials, availability hours |
| Stock | Recipe ingredients → inventory deduction on sale |
| Compliance | FSSAI license field, GST 5%/18% picker |
| Integrations | Zomato / Swiggy order sync, Petpooja import, KOT printer (network/Bluetooth) |
| Dashboard | Covers today, table turn time, no-show rate, top menu items |

### 9.2 Salon / spa pack

| Area | New screens / models |
|---|---|
| Engagements | `AppointmentCalendar`, `WalkInQueue`, `StylistSchedule` |
| Catalog | Treatments with duration + room/equipment requirement |
| Workforce | Stylist commission %, tips, time-off |
| Inventory | Product retail + back-bar consumption |
| Memberships | Loyalty cards, prepaid packages |
| Integrations | WhatsApp reminders, Fresha-style consumer booking page |

### 9.3 Clinic / healthcare pack

| Area | New screens / models |
|---|---|
| Engagements | `PatientAppointments`, `Queue`, `Consultation` |
| Catalog | Procedures with CPT/ICD codes |
| Workforce | Doctors with specializations |
| Records | EMR-lite (consent screens, prescription notes) |
| Compliance | DPDP Act / HIPAA consent, audit logs |
| Integrations | Pharmacy / lab APIs |

### 9.4 Auto repair / garage pack

| Area | New screens / models |
|---|---|
| Engagements | `WorkOrder` with vehicle VIN/plate |
| Catalog | Parts (products) + labor (services) hybrid |
| Workforce | Mechanics with bay assignment |
| Inventory | Parts stock, supplier reorder |
| Integrations | Insurance claim portals |

---

## 10. Migration plan from single-vertical to multi-vertical

Phased. Don't do everything in one PR.

### Phase 1 — Foundations (1–2 weeks)

1. Add `verticalKey` to `Tenant` (default `home_services`); backfill all existing tenants.
2. Create `packages/verticals/core` and `packages/verticals/home_services` with manifests that **mirror today's behavior**.
3. Refactor `src/components/layout/sidebar.tsx` to read from pack manifests instead of hardcoded arrays.
4. Ship to production with **zero behavior change**.

### Phase 2 — Abstraction (2–3 weeks)

5. Introduce `Engagement` as a virtual layer over `Booking`.
6. Build the pack manifest loader + validation.
7. Refactor 1–2 screens (`BookingsList`, `BookingDetails`) to be pack-driven (status set, columns, custom field renderer).

### Phase 3 — Second vertical (4–6 weeks)

8. Build `packages/verticals/restaurant` OR `packages/verticals/salon` with a minimal set: catalog + engagements + 1 pack-specific screen.
9. Add `verticalKey` picker to `PlatformTenantsPage` create form.
10. Onboard one design-partner customer in the new vertical. Iterate.

### Phase 4 — Plans & vertical-aware billing (2 weeks)

11. Plans registry per vertical (`packages/billing/src/plans.ts`).
12. Stripe / Razorpay product/price IDs per plan.
13. Limit enforcement in API + UI nudges.

### Phase 5 — Third vertical & marketplace landing (8+ weeks)

14. Pick salon OR clinic (whichever the second wasn't).
15. Build vertical-specific marketing landing pages (`/for-restaurants`, `/for-salons`).
16. Vertical-specific signup wizards.

---

## 11. What NOT to do

- **Don't fork the codebase per vertical.** Death by maintenance.
- **Don't sprinkle `if (vertical === 'restaurant')` checks across components.** Use pack manifests + custom field registries.
- **Don't try to support every vertical at launch.** Pick **one** second vertical, validate, expand.
- **Don't price all verticals identically.** Restaurant POS is worth more than home-services dispatch in many markets — and vice versa.
- **Don't ignore tax/compliance.** Indian GST is wildly different per vertical (restaurant 5%/18% with conditions; healthcare 0–12%; services 18%). Bake it into the pack.
- **Don't make `verticalKey` mutable.** It's effectively a re-implementation; lock it post-creation.

---

## 12. Picking your second vertical

| Vertical | India TAM | Tech complexity | Existing competitors | Reuse of current code |
|---|---|---|---|---|
| **Salon / spa** | 3L+ outlets | Medium (calendar-heavy) | Zylu, Glamplus | **~80%** — closest to home services |
| **Restaurant** | 10L+ outlets | High (KDS, KOT, Zomato/Swiggy, hardware) | Petpooja, Posist, Restroworks | ~60% — most lucrative but heaviest |
| **Clinic** | Regulated | High (EMR, DPDP) | Practo, Halemind | ~70% — high value, long sales cycle |
| **Fitness** | Smaller deals | Low | GymBook, Fitli | ~75% — easy pack to build |
| **Tutoring / coaching** | Large but crowded | Low-medium | Classplus, Teachmint | ~70% |

**Recommended pick: Salon.** Highest reuse, second-largest TAM, simplest to validate the pack pattern. Restaurant is more lucrative but doubles the engineering effort.

---

## 13. Open design questions

Before coding Phase 1, decide:

1. **Storage:** Reuse existing `Booking`/`Service` collections as `home_services` storage, or migrate to abstract `Engagement`/`CatalogItem` collections from day 1?
2. **Pack distribution:** In-tree packages (monorepo workspace) or out-of-tree plugins loaded by id?
3. **Pack versioning:** Hot updates per deploy, or `Tenant.packVersion` pinning + opt-in migrations?
4. **Multi-vertical tenants:** Allow a hotel to enable `restaurant` + `salon` together (`additionalVerticals`)? If yes — sidebar gets a vertical switcher; if no — strict 1-tenant-1-vertical.
5. **Pricing public site:** One marketing site with vertical-aware landing pages, or separate sites per vertical?

Document the answers in this file as you decide them — future engineers will thank you.
