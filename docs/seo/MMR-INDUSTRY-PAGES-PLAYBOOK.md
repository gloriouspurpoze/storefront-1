# MMR Industry Service Pages — one-place playbook

**Single source of truth** for how industry (base) pages and location pages fit together,
where to edit them in Admin, and how to seed the electrician MMR cluster.

If you only read one file, read this one.

---

## 1. Do we have an industry / base page? — YES

It is not a separate screen; it is the **same Landing editor with the Location picker on
"All areas (default)"**.

| What you pick in Admin | Storage key written | Public URL | Meaning |
|---|---|---|---|
| Industry = Electrician, Location = **All areas (default)** | `electrician` | `/services/electrician` | **Base / industry page** (full content) |
| Industry = Electrician, Location = **Mira Bhayandar** | `electrician__mira-bhayandar` | `/services/electrician/mira-bhayandar` | Location page (overlay) |
| Industry = Electrician, Location = **Dahisar** | `electrician__dahisar` | `/services/electrician/dahisar` | Location page (overlay) |

> The consumer site **merges** `electrician` (base) + `electrician__{area}` (overlay) when a
> visitor opens a location URL. So you write the bulk **once** on the base, and only override
> the local fields per location. Confirmed in `IndustryLandingWorkspaceOverview.tsx`:
> *"set the industry-wide base first, then override per location."*

---

## 2. The correct hierarchy (matches the real Admin flow)

This is exactly how `IndustryServicePagesHub.tsx` is structured — follow it top to bottom.

```
Admin → CMS → Industry service pages            (route: /cms/category-marketing)
│
├── [1] Catalog industry   ── select: Electrician        ← top dropdown (one industry at a time)
│
└── [2] Workspace tab
      ├── Landing & SEO        ← author page content (this is where base + locality live)
      │     │
      │     └── [3] Location picker
      │           ├── "All areas (default)"  → key: electrician            ← BASE PAGE (do first)
      │           ├── Mira Bhayandar          → key: electrician__mira-bhayandar
      │           └── Dahisar                 → key: electrician__dahisar
      │                 │
      │                 └── [4] Content tabs: Metadata · Local SEO · Hero · Cards ·
      │                         Detailed · Trust · Areas · Pricing · FAQs ·
      │                         Locality guide · Closing
      │
      ├── Service areas        ← which localities EXIST + sitemap quality gate
      │                          (Mira Road is listed INSIDE Mira Bhayandar, not its own row)
      ├── Rate card            ← same industry key
      └── Cross-linking        ← same industry key
```

**Authoring order (always):**
1. Catalog industry = Electrician.
2. Landing & SEO → Location = **All areas (default)** → fill the **base** fully → Save.
3. Location = **Mira Bhayandar** → fill **only local fields** → Save.
4. Location = **Dahisar** → fill **only local fields** → Save.
5. **Service areas** tab → confirm Mira Bhayandar + Dahisar exist, quality signals set, `isIndexable` on.

---

## 3. What "local fields only" means (per location page)

Everything else inherits from the base. Only override:

- `seoTitle`, `metaDescription` (with the locality string)
- `intro` (one paragraph of real local detail)
- `localityGuide` (`enabled: true`, articleH2 + 2–3 unique sections)
- `localSeo.serviceAreaNarrative` + `serviceAreaPlaceNames` (the sub-areas)
- 3+ locality-specific `faqs`
- `technicalSeo.canonicalUrl` (the exact live URL)

---

## 4. Granularity rule (so you stop second-guessing locations)

- **Base page** = whole metro (`electrician`). Never a location.
- **Location page** = a real node with demand + providers + unique content (`mira-bhayandar`, `dahisar`).
- **Mira Road / Bhayandar East-West / societies** = listed **inside** Mira Bhayandar
  (`serviceAreaPlaceNames` + locality `neighborhoods`), **never** their own URL — this avoids
  cannibalization and thin/duplicate pages.

A location only goes into the sitemap when its `qualitySignals.contentQualityScore >= 0.7`
and `isIndexable = true` (gate lives in `useServiceCatalogLocalities.ts`).

---

## 5. Seed it in one command

There are two ways to seed the same electrician cluster (base + Mira Bhayandar + Dahisar, with
Mira Road folded into Mira Bhayandar). **Prefer the backend seed** — it also creates the locality
URL segments so the pages actually resolve.

**A) Backend (canonical — run in `fixer-backend`):**

```bash
npm run seed:seo-pages
```

This upserts the `electrician`, `electrician__mira-bhayandar`, and `electrician__dahisar`
category-marketing keys **and** the `mira-bhayandar` / `dahisar` service-catalog localities into the
global (`tenantId: null`) rows. It merges (never clobbers admin-authored content) and is idempotent.
Source: `fixer-backend/src/scripts/seedSeoPages.ts`.

**B) Frontend (API alternative — run in `profixer-admin-frontend`):**

```bash
# Preview only (safe, no writes) — outputs JSON to scripts/out/:
node scripts/seed-mmr-electrician.mjs
# Apply via the admin API (needs a dashboard JWT with CMS permissions):
SEED_ADMIN_TOKEN="<jwt>" node scripts/seed-mmr-electrician.mjs --commit
```

After either, verify in **Admin → CMS → Industry service pages → Landing & SEO**, switching the
Location picker between *All areas*, *Mira Bhayandar*, and *Dahisar*.

**Fill before go-live (left blank on purpose — never fake):** real NAP
(`streetAddress`, `postalCode`, `geoLatLng`, GBP URL) then set `enableLocalBusinessSchema: true`;
and `aggregateRating` only if real ratings are visible on the page.

---

## 6. Related references (deeper detail, optional)

- `docs/SEO_INDUSTRY_CMS_HANDOVER.md` — API contract + how the consumer merges keys.
- `docs/category-marketing-seo-content-mira-bhayandar-dahisar.md` — full field-by-field editorial pack.
- `src/lib/categoryMarketingCoverageOverview.ts` — the coverage checklist shown in the editor.
