# Industry service pages & CMS — SEO team handover

This document describes how **industry / locality SEO content** is authored in **fixer-admin**, stored in **fixer-backend**, and consumed by **fixer-client** (public site). Use it for audits, Search Console alignment, and cross-team troubleshooting.

---

## 1. Product surface (admin)

- **Primary workspace:** **CMS → Industry service pages** (route: `/cms/category-marketing`).
- **Tabs (query string):**
  - `?tab=landing` — Category marketing JSON per catalog key (titles, copy, FAQs, `technicalSeo`, `localSeo`, locality guide blocks, spare-parts rows, etc.).
  - `?tab=rate-card` — Parts / indicative rates keyed by the **same catalog keys** as landing (e.g. `ac`, `electric`). Feeds the consumer **pricing matrix** when landing spare-parts are empty.
  - `?tab=cross-linking` — Per-category internal link hints for SEO sections.

Legacy routes `/cms/rate-card` and `/cms/cross-linking` redirect into this hub with the right `?tab=`.

---

## 2. API contract (backend)

Base path on the API server: **`/api`** (e.g. `https://api.example.com/api`).

### 2.1 Admin (authenticated — fixer-admin only)

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/cms/admin/static-content/category-marketing` | Load full JSON blob (all keys). |
| PUT | `/cms/admin/static-content/category-marketing` | Save full JSON blob. |
| GET | `/cms/admin/static-content/rate-card` | Load rate-card JSON. |
| PUT | `/cms/admin/static-content/rate-card` | Save rate-card JSON. |
| GET | `/cms/admin/static-content/cross-linking` | Load cross-linking JSON. |
| PUT | `/cms/admin/static-content/cross-linking` | Save cross-linking JSON. |

Admin calls require a **dashboard JWT** with CMS permissions (as implemented in fixer-backend RBAC).

### 2.2 Public read (no auth — fixer-client, crawlers)

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/cms/static-content/category-marketing` | Same payload shape as admin read; **public**. |
| GET | `/cms/static-content/rate-card` | Public. |
| GET | `/cms/static-content/cross-linking` | Public. |

**Consumer app wiring:** In the browser, fixer-client calls **`/api/cms/static-content/...`** on the **Next.js origin** (e.g. `http://localhost:3000`). Next.js **rewrites** `/api/*` to the configured API host (see `API_PROXY_TARGET` / `NEXT_PUBLIC_API_BASE_URL` in fixer-client).

Successful responses are typically wrapped as `{ success: true, data: ... }`.

---

## 3. Catalog keys & locality overrides (consumer logic)

The public site does **not** use URL slugs as raw CMS keys everywhere. It resolves a **catalog marketing key** from the category URL slug, then optionally merges a **locality** slice.

- **Base keys** (examples): `ac`, `plumb`, `electric`, `appliance`, `painting`, `carpentry`, `pest-control`, `cleaning`, `default`.
- **Locality override key:** `{catalogKey}__{localitySlug}`  
  Example: `electric__andheri-east` layered on top of `electric`.

Source of truth for slug → key rules: **`fixer-client`** `src/shared/lib/catalogCms.ts` (`resolveCatalogMarketingKey`, `resolveLocalityMarketingKey`). Admin should use the **same** key names when editing JSON (aligned with `CMS_CATEGORY_MARKETING_BASE_KEYS`).

---

## 4. What the public site uses (SEO-relevant)

- **Metadata:** `seoTitle`, `metaDescription`, `technicalSeo` (canonical, robots, Open Graph, Twitter, hreflang, schema toggles, `answerEngineSummary`, etc.) — merged with static fallbacks in **`useCmsIndustryMarketing`** and server metadata helpers (`getLocalityPageSeoWithCms`, etc.).
- **On-page copy:** Headings, intros, FAQs, guide sections, trust blocks — from the merged **category-marketing** config.
- **Structured data:** JSON-LD extended to include CMS-driven fragments where enabled (HowTo, breadcrumb, Speakable, video, aggregate rating when valid, etc.) — see consumer `StructuredData` / layout metadata.
- **Pricing table:** Locality marketing can show **spare parts / indicative rates** from **`spareParts`** in category-marketing, or from **`rate-card`** rows for that catalog key, when present.

---

## 5. Verification checklist (local / staging)

1. **Backend directly (no Next):**  
   `curl -sS "http://localhost:8005/api/cms/static-content/category-marketing"`  
   Expect **200** and JSON `data` (or empty object if not seeded).

2. **Through Next proxy (consumer):**  
   `curl -sS "http://localhost:3000/api/cms/static-content/category-marketing"`  
   Should match the same **200** once the rewrite target points at the same API.

3. **Admin:** Save a visible change (e.g. FAQ) and confirm it appears on `/services/{category}/{locality}` after refresh (allow for client cache / revalidate if applicable).

---

## 6. Troubleshooting: `403 Forbidden` on public static-content

### Symptom

`GET http://localhost:3000/api/cms/static-content/category-marketing` (or `rate-card`) returns **403** in the browser Network tab on the **consumer** site.

### Root cause (fixed in fixer-backend)

The router **`/modules/cms/routes/public-site-theme.ts`** was mounted under `/cms` with **router-wide** middleware (`authenticateToken`, `requireTenantFeature`, `requireAdmin`, …). In Express, that ran for **every** path under `/cms`, including **`/cms/static-content/*`**. Logged-in **customers** passed authentication but failed **admin** checks → **403**.

### Fix

Scope authentication to **only** the `/public-site-theme` routes (per-route middleware), so unauthenticated and customer traffic can reach **`GET /cms/static-content/...`** as intended.

**Action:** Deploy the updated **fixer-backend** build that contains this routing change.

### Other 403 causes to keep in mind

- **Tenant-scoped JWT** with suspended org or missing tenant context (`TENANT_*` error codes) — usually on **authenticated** APIs, not these public GETs.
- **Wrong host:** Hitting an environment where old code is still deployed.

---

## 7. Operational SEO (outside the repo)

Code and CMS fields support production SEO, but **ongoing** work remains with the SEO team:

- Google Search Console: coverage, sitemaps, canonical behavior.
- Core Web Vitals and mobile UX.
- Content freshness, FAQ accuracy, and review / rating policy for schema.
- Monitoring indexation for `/services/{category}/{locality}` templates.

---

## 8. Related code pointers

| Area | Location |
|------|----------|
| Admin hub & tabs | `fixer-admin` — `src/pages/cms/IndustryServicePagesHub.tsx`, `CategoryMarketingManagement.tsx`, rate/cross-linking pages |
| Admin API client | `fixer-admin` — `src/services/api/cms.service.ts` |
| Public fetch + merge | `fixer-client` — `src/shared/lib/useCmsIndustryMarketing.ts`, `src/shared/lib/api/cms.ts` |
| Catalog keys | `fixer-client` — `src/shared/lib/catalogCms.ts` |
| Types / `technicalSeo` | `fixer-admin` & `fixer-client` — `**/types/categoryMarketing.ts` |
| Public CMS routes | `fixer-backend` — `src/modules/cms/routes/public.ts` |
| Theme route (admin-only) | `fixer-backend` — `src/modules/cms/routes/public-site-theme.ts` |

---

*Last updated: aligns public `static-content` GETs with theme router fix and industry CMS workflow.*
