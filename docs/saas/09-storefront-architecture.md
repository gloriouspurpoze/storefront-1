# Storefront architecture — multi-tenant tenant websites

> **Status:** RFC + Phase 0 scaffold landed (`/storefront`). Phases 1-7 below are the rollout plan.
>
> **Author:** Platform / Architecture  ·  **Audience:** Engineering + product leadership  ·  **Decision owner:** CTO + CEO.

This is the single source of truth for how we give every tenant a customer-facing website (storefront / booking site / e-commerce). It exists because **website hosting is the feature that pushes tenants from Starter → Growth → Scale** in every comparable SaaS (Shopify, Webflow, Hashnode, Beehiiv, Cal.com, Linktree, Framer). We are copying the winning blueprint, not inventing.

---

## 0 · TL;DR

> **One Next.js 15 app, deployed once, serves every tenant. Routing by host, theming by vertical, customization by config, custom domains via Vercel/Cloudflare, content from the CMS we already have.**

That single sentence unlocks: instant updates, zero per-tenant ops, infinite horizontal scale, predictable cost per tenant, and a clean upgrade path to a block-based page editor and AI site generation.

---

## 1 · Anti-patterns we are explicitly **not** building

| Anti-pattern | Why we walk away |
| --- | --- |
| One Next.js deploy per tenant | Operationally fatal beyond ~50 tenants. Wix carried this for years and rebuilt. |
| Letting tenants write JS/HTML | Security holes, support nightmare, breaks SEO. Shopify caps tenants at Liquid for a reason. |
| Forking the codebase per vertical | Drift within 3 sprints. You ship the same bug fix four times. |
| Hand-rolling custom-domain SSL with Caddy/Traefik | Solved problem. Vercel Domains and Cloudflare for SaaS already automate ACME, SNI and renewal. |
| Building a Webflow-style visual editor on day 1 | 6 months of work that will not move retention. Ship config-first; page builder in v3. |

---

## 2 · The system, layer by layer

### 2.1 Repository layout (target)

```
profixer/
├── apps/
│   ├── admin/          ← existing profixer-admin-frontend (React)
│   └── storefront/     ← new Next.js 15 app, multi-tenant by host (Phase 0 ✓)
├── packages/
│   ├── ui/             ← shared shadcn primitives (used by both apps)
│   ├── themes/         ← vertical themes (home-services, restaurant, retail, salon, …)
│   ├── api-client/     ← typed client for fixer-backend (generated from OpenAPI)
│   └── tenant-resolver/← shared host → tenant lookup logic
└── turbo.json
```

For Phase 0 the storefront lives at `./storefront/` inside the admin repo. We will move to a turborepo monorepo (`apps/storefront`, `apps/admin`, `packages/*`) before Phase 4 so themes can be shared between apps.

### 2.2 Tenant resolution (the critical piece)

A Next.js **middleware** runs at the edge on every request, extracts the host, resolves the tenant id, and rewrites the URL into the per-tenant route segment:

```ts
// storefront/middleware.ts
export function middleware(req: NextRequest) {
  const host = (req.headers.get('host') ?? '').toLowerCase()
  const tenant = await resolveTenant(host)              // Edge Config / Redis / API fallback
  if (!tenant) return NextResponse.rewrite(new URL('/_not-found', req.url))
  const url = req.nextUrl.clone()
  url.pathname = `/_sites/${tenant.id}${url.pathname}`  // internal rewrite — URL bar unchanged
  const res = NextResponse.rewrite(url)
  res.headers.set('x-tenant-id', tenant.id)             // visible to RSC / server actions
  return res
}
```

#### Host strategies

- **Subdomain (free, default):** `{slug}.profixer.app` — auto-provisioned on tenant create, no setup for the customer. Wildcard DNS `*.profixer.app → cname.vercel-dns.com`.
- **Custom domain (Growth+):** `mybakery.com` — customer adds a single CNAME → `cname.vercel-dns.com` (Vercel Domains API) or our Cloudflare-for-SaaS zone. DNS verification + ACME SSL is fully automated.

#### Lookup performance

The host → `tenantId` lookup must be **edge-cached** (< 5 ms). Order of preference:

1. **Vercel Edge Config** — best DX, deploys in ~1 minute, free up to 8 KB.
2. **Upstash Redis** — needed once we cross a few hundred tenants (Edge Config has a size cap).
3. **API fallback** (our backend's `/api/public/tenants/resolve?host=…`) — used in development and as a cache-miss path. **Never** the hot path in production.

### 2.3 Theme system

Themes are versioned packages inside `packages/themes`. Each theme exports a typed contract:

```ts
export const homeServicesTheme: VerticalTheme = {
  id: 'home-services-classic',
  version: '1.4.0',
  templates: { home, services, serviceDetail, booking, blog, contact },
  designTokens: { /* default colors, radius, fonts */ },
  capabilities: ['booking', 'lead-form', 'service-catalog'],
}
```

The storefront picks a theme via `tenant.theme` and renders. Brand color / logo / copy live on `tenant` and the CMS — **the tenant never touches code**.

#### Vertical theme rollout order

1. **Home Services** (deepest backend support — booking, services, providers).
2. **Restaurant** (menu, reservations — *The Brown Butter*).
3. **Retail / e-commerce** (storefront with cart + Razorpay checkout — *Noze Perfume*).
4. **Salon, Fitness, B2B** — variants of the same base templates with vertical-specific sections.

This mirrors Shopify's theme architecture **specialized per vertical**, which is the moat: Shopify is generic; we are prescriptive per industry.

### 2.4 Rendering strategy

| Page type | Strategy | Why |
| --- | --- | --- |
| Home, About, Services, Menu, Product list | **ISR** (`revalidate: 300`) with `revalidateTag('tenant:<id>')` | SEO-critical, cache aggressively, invalidate on admin save |
| Product detail (retail) | **ISR** + on-demand revalidate on price/stock change | Fast TTFB, fresh inventory |
| Cart, checkout, booking wizard | **SSR / client-side** | Personal, never cached |
| Blog | **SSG** with on-demand revalidate when post publishes | Best Lighthouse score |
| Search | **Client-side** w/ TanStack Query → Typesense | UX > SEO here |

When admin content changes, `fixer-backend` POSTs `{tenantId, tags[]}` to the storefront's `/api/revalidate` webhook. ~200 ms later the public site is fresh. This is how Hashnode and Beehiiv get sub-second publish times.

### 2.5 SEO + per-tenant metadata

Every tenant gets, out of the box:

- Per-host `sitemap.xml` (App Router `sitemap.ts`).
- Per-host `robots.txt`.
- Per-host OG image generator (`@vercel/og`).
- Structured data: `LocalBusiness`, `Restaurant`, `Service`, `Product`, `Offer` schemas auto-emitted per vertical.
- Per-tenant Google Search Console + Bing Webmaster verification meta tags (a single CMS field).

### 2.6 Custom domain UX

This is the screen that decides whether the tenant tells their friends about us.

```
Settings → Site → Domain

Subdomain (included)
  brownbutter.profixer.app                          [Copy]

Custom domain (Growth plan and up)
  mybakery.com                                      [Verify]

  Add this CNAME to your DNS:
    Type:    CNAME
    Name:    @ (or www)
    Value:   cname.vercel-dns.com
    TTL:     300

  Status:  ⏳ Waiting for DNS propagation (24s)
           ✅ SSL certificate issued
           ✅ Live at https://mybakery.com
```

The admin page polls the Vercel Domains API every 5 s and updates status live. This single screen is what separates "feels pro" from "feels amateur".

### 2.7 Where Razorpay (already shipped) fits

The same Razorpay account powers **two** payment surfaces:

- **Tenant's customers** → storefront checkout / booking deposits (existing `/api/payments/razorpay/*`).
- **Tenants themselves** → SaaS plan billing (`/api/billing/razorpay/*` — shipped in §3.6 of the [onboarding runbook](./08-onboard-three-tenants-runbook.md)).

One Razorpay account, two purposes. Clean.

### 2.8 Observability

- Sentry browser + server SDK tagged with `tenant_id` per request.
- Axiom / Datadog dashboards filterable by tenant.
- PostHog (product) and Plausible (marketing) **per-tenant projects** — when a tenant subscribes we auto-provision a sub-site. PostHog supports multi-project; Plausible supports multi-site.

This is what lets CS answer "is mybakery.com slow?" in 10 seconds, not 10 hours.

---

## 3 · Stack picks (opinionated)

| Concern | Pick | Why |
| --- | --- | --- |
| Framework | **Next.js 15** App Router | Largest talent pool, ISR + Edge built in |
| Styling | **Tailwind v4** + **shadcn/ui** | Already used in admin — share components |
| Forms | **react-hook-form** + **zod** | Industry default |
| Server data | **fetch + cache tags** (App Router) | Native, granular invalidation |
| Client data | **TanStack Query v5** | Best-in-class cache for interactive surfaces |
| Hosting | **Vercel Pro** | Domains API, on-demand ISR, Edge Config — purpose-built for this |
| DNS / SSL | Vercel Domains API (alt: Cloudflare for SaaS) | Zero ops |
| Media | **Cloudinary** or **Bunny.net** | Tenants upload, we transform on the fly |
| Search | **Typesense Cloud** | Per-tenant collection, cheap, fast |
| Email | **Resend** + **React Email** | Domains API, JSX templates |
| Analytics | **PostHog** (product) + **Plausible** (marketing) | Per-tenant projects, GDPR-friendly |
| Monitoring | **Sentry** + **Axiom** | Tenant-tagged, affordable at SaaS scale |
| Edge tenant lookup | **Vercel Edge Config** → **Upstash Redis** | < 5 ms reads at the edge |

---

## 4 · Pricing alignment — how this pays for itself

The storefront is the lever that drives Starter → Growth → Scale upgrades. Wire it directly into the SaaS plans we already have:

| Plan | Subdomain | Custom domain | Themes | Page editor | AI site gen | Pages limit |
| --- | --- | --- | --- | --- | --- | --- |
| **Starter** | ✅ | ❌ | 1 default per vertical | ❌ | ❌ | 5 |
| **Growth** | ✅ | ✅ (1 domain) | All vertical themes | ✅ basic | ❌ | 25 |
| **Scale** | ✅ | ✅ (5 domains) | All + premium | ✅ full | ✅ | unlimited |

Custom domain is the single feature that pushes Starter → Growth in every multi-tenant SaaS. The `featureModules` allowlist already built (see [03-frontend-vertical-pack-system.md](./03-frontend-vertical-pack-system.md)) gates this on the API side; we just add three new keys:

- `storefront_custom_domain`
- `storefront_page_editor`
- `storefront_ai_builder`

---

## 5 · Phased rollout

### Phase 0 — Foundation (Week 1-2)  ✅ scaffolded in this commit

- `storefront/` Next.js 15 app, Tailwind v4, TS, App Router.
- Tenant-resolver middleware with Edge Config + API fallback.
- `_sites/[tenantId]` route group serving a branded "Coming soon" page.
- Public backend endpoint `GET /api/public/tenants/resolve?host=…` for dev-time + cache-miss tenant lookup.
- `.env.example`, README, instructions to point `*.profixer.localhost` at the dev server.

**Outcome:** every existing tenant gets `{slug}.profixer.app` showing a branded coming-soon page reading `name`, `verticalKey`, logo from the existing `/api/platform/tenants` payload.

### Phase 1 — Home Services theme (Week 3-4)

- Templates: home, services list, service detail, booking, contact, blog.
- Reads from CMS + services endpoints already in `fixer-backend`.
- Lead form posts to `/api/crm/leads`.
- **Ship:** Profixer's customer site lives at `profixer.profixer.app`.

### Phase 2 — Restaurant theme (Week 5-6)

- Templates: hero, menu (categories + items), reservations, gallery, about, contact.
- Reservations hit `/api/restaurant/reservations`.
- **Ship:** thebrownbutter.profixer.app.

### Phase 3 — Retail / e-commerce theme (Week 7-9)

- Templates: home, category, product, cart, checkout, account, order tracking.
- Cart in localStorage + persisted to backend on login.
- Checkout uses existing Razorpay flow (`/api/payments/razorpay/*`).
- **Ship:** nozeperfume.profixer.app — first paying e-commerce tenant.

### Phase 4 — Custom domains (Week 10-11)

- Admin: `Settings → Site → Domain` page with verification + SSL polling.
- Backend: `fixer-backend/src/modules/storefront/domains/*` integrating Vercel Domains API.
- Gate behind Growth plan via `featureModules.storefront_custom_domain`.
- Push a marketing campaign — "your domain, your brand, on us".

### Phase 5 — Theme customization UI (Week 12-13)

- Admin: `Site → Branding` (logo, colors, fonts, favicon).
- Admin: `Site → Pages` (title, slug, sections, SEO meta).
- Live preview iframe pointed at `?preview=<draftToken>`.

### Phase 6 — Block-based page builder (Quarter 2)

- 30 pre-built blocks (Hero, Feature grid, Testimonials, Pricing, FAQ, CTA, Map, Gallery, …).
- Drag/drop ordering, per-block settings, mobile preview.
- **Don't** build a generic builder. Build a *block library*. Webflow is hard; Linktree is easy. Aim closer to Linktree.

### Phase 7 — AI site generator (Quarter 2-3)

- Wizard: "Tell us about your business" → three questions → generate full site (theme + copy + sample products/services). Reuse the AI plumbing in `BlogAIService`.
- The 2026 growth feature — Framer, Wix and Hostinger all ship this; we will lose to them otherwise.

---

## 6 · Phase 0 — what shipped in this commit

See `/storefront/README.md` for full setup. The short version:

```bash
cd storefront
cp .env.example .env.local
npm install
npm run dev          # http://localhost:3001

# To test multi-tenant locally, add hosts entries:
# 127.0.0.1   profixer.profixer.localhost
# 127.0.0.1   thebrownbutter.profixer.localhost
# 127.0.0.1   nozeperfume.profixer.localhost
# Then open http://profixer.profixer.localhost:3001
```

**Files of interest:**

- `storefront/middleware.ts` — host → tenant resolution + URL rewrite.
- `storefront/lib/tenant-resolver.ts` — Edge Config / Redis / API fallback chain (Edge Config + Redis are env-gated; API fallback is the default in dev).
- `storefront/lib/api.ts` — typed client for `fixer-backend` (public endpoints only — no JWT needed on the storefront).
- `storefront/app/_sites/[tenantId]/page.tsx` — Phase 0 "Coming soon" branded page.
- `storefront/app/api/revalidate/route.ts` — webhook the backend will call when CMS content changes (stub).

**Backend addition:**

- `fixer-backend/src/modules/platform-tenants/routes/publicTenants.ts` (new) — `GET /api/public/tenants/resolve?host=…` returning `{ id, slug, name, verticalKey, logoUrl, brandColor, isActive, suspendedAt }`. **Public**, rate-limited, returns 404 for suspended or unknown hosts so the storefront can render its own 404. Mounted at `/api/public` in `routes/index.ts`.

---

## 7 · Open questions / decisions to confirm

| Question | Default position | Owner |
| --- | --- | --- |
| Vercel Pro or Cloudflare Pages for hosting? | **Vercel Pro** — best DX, custom domains solved, switch when we cross ~5k tenants | CTO |
| pnpm + turborepo restructure — now or before Phase 4? | **Before Phase 4** so themes can be shared. Spend one day on it. | Platform lead |
| Custom domain provider — Vercel Domains or Cloudflare for SaaS? | **Vercel Domains** for v1 (lower friction). Migrate to Cloudflare for SaaS if egress cost grows. | CTO |
| Wildcard SSL on `*.profixer.app` — Cloudflare or Vercel? | **Vercel** (it issues per-subdomain certs automatically). | DevOps |
| Theme storage — npm package vs. DB rows? | **npm package** (versioned, code-reviewed). DB rows only for per-tenant overrides. | Platform lead |
| Tenant-uploaded media — Cloudinary, Bunny, or our own S3? | **Cloudinary free tier** for v1, evaluate Bunny once we exceed it. | DevOps |
| Analytics — PostHog Cloud or self-hosted? | **PostHog Cloud** until $5k/mo, then self-host on our own k8s. | Platform lead |

---

## 8 · What we explicitly defer (and why)

- **Tenant-written code** — never. If they want this, sell them WordPress.
- **A11y AAA from day 1** — AA is plenty; ship.
- **CMS rewrite** — `fixer-backend` already has one. Reuse.
- **Marketplace for third-party themes** — Shopify took 6 years. Not needed for v1.
- **Native mobile apps for storefronts** — PWA is enough. Native apps come after $1 M ARR.
- **Server-side A/B testing per tenant** — interesting once we have 100+ paying tenants, premature now.

---

## 9 · Glossary

| Term | Meaning in this codebase |
| --- | --- |
| **Tenant** | A customer organization (`Tenant` document in Mongo). |
| **Vertical** | The industry pack a tenant belongs to (`home_services`, `restaurant`, `retail`, …). |
| **Theme** | A versioned `packages/themes/<id>` package = templates + tokens + capabilities. |
| **Storefront** | The Next.js app at `apps/storefront` (this doc). |
| **Subdomain** | `{slug}.profixer.app` — auto-provisioned. |
| **Custom domain** | A domain the tenant owns and points to us via CNAME. |
| **ISR** | Incremental Static Regeneration — Next.js caches pages and revalidates on a timer or on demand. |

---

## 10 · References

- [Vercel Domains API](https://vercel.com/docs/projects/domains)
- [Cloudflare for SaaS](https://developers.cloudflare.com/cloudflare-for-saas/)
- [Vercel Edge Config](https://vercel.com/docs/storage/edge-config)
- [Next.js App Router](https://nextjs.org/docs/app)
- [Tailwind CSS v4](https://tailwindcss.com/blog/tailwindcss-v4)
- [shadcn/ui](https://ui.shadcn.com)
- [Hashnode multi-tenant architecture](https://townhall.hashnode.com/how-hashnode-scales)
- [Cal.com self-hosted multi-tenant guide](https://cal.com/docs/self-hosting)
