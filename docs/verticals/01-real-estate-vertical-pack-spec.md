# Real estate vertical pack — Product & engineering spec

**Vertical key:** `real_estate`  
**Pack version target:** `1.0.0` (exit stub / generic home-services inheritance)  
**Status today:** Stub in `src/verticals/registry.ts` — valid tenant, HS navigation.

---

## 1. Problem statement

Brokerages, developer sales desks, and property managers run on **WhatsApp + Excel + fragmented CRMs**. They need:

- Property **listings** with media and compliance fields
- **Lead → viewing → offer → close** pipeline
- **Agent** assignment and commission visibility
- **Documents** (MOU, lease, NOC) with audit trail
- **Marketing site** for inventory (CMS + SEO)

ProFixer already ships ~80% of the **platform** layer; this pack specializes labels, statuses, sidebar, and KPIs.

---

## 2. ICP (ideal customer profile)

| Segment | Examples | Primary modules |
|---------|----------|-----------------|
| Residential brokerage | Local broker networks | CRM, Bazaar/listings, CMS |
| Developer sales office | Pre-launch inventory | CRM, CMS, finance (collections) |
| Commercial leasing desk | Office / retail lease | CRM, documents, finance |
| Property management (light) | Society / portfolio ops | CRM, finance, team work |

**Deprioritize v1:** Full RERA compliance automation, society accounting, construction project management.

---

## 3. Mapping to platform primitives

### 3.1 Abstract entities (from vertical-pack architecture)

| Abstract entity | Real estate meaning | Existing storage (v1) |
|-----------------|---------------------|------------------------|
| **CatalogItem** | Property listing (sale / rent) | Bazaar listing **or** CMS industry page + structured fields |
| **Engagement** | Lead, viewing, offer, tenancy | CRM **Deal** + **Activity**; optional `Booking`-like “viewing appointment” |
| **WorkforceMember** | Agent / broker | Team members + CRM owner; later `Professional` if marketplace |

### 3.2 Module reuse matrix

| ProFixer module | Real estate use | v1 action |
|-----------------|-----------------|-----------|
| **CRM** | Leads, contacts, companies (builders), deals pipeline | **Configure** stages — no new collection |
| **Bazaar** | Listing review, Pro-Verify style moderation for properties | **Rename** labels in UI where pack-driven |
| **CMS** | Project pages, locality SEO, blog | **Templates** `for-real-estate` on storefront |
| **Finance** | Brokerage commissions, rent collection ledger | Use expenses / recurring; not tenant wallets |
| **Company documents** | MOU, lease PDFs, e-sign | **Enable** module |
| **Marketing workspace** | Launch campaigns per project | Optional |
| **Bookings** | Site visits / open house slots | Repurpose engagement type `viewing` |
| **E-commerce** | Usually **off** | Hide via `featureModules` |
| **Marketplace / providers** | Usually **off** unless pro marketplace | Off by default |

---

## 4. Engagement model

### 4.1 Engagement types (pack-defined)

| Type key | Label | Description |
|----------|-------|-------------|
| `lead` | Lead | Inbound inquiry — not yet qualified |
| `viewing` | Viewing | Scheduled site visit |
| `offer` | Offer | Price / terms proposed |
| `deal` | Deal | Linked to CRM deal stage (won/lost) |
| `tenancy` | Tenancy / lease | Post-close active lease (property management) |

**v1 simplification:** Implement **viewing** as the only pack-specific engagement screen; keep **deal pipeline** in native CRM.

### 4.2 Viewing status machine

```text
requested → confirmed → completed → no_show
                ↘ cancelled
```

| Status | Terminal | Next |
|--------|----------|------|
| `requested` | no | `confirmed`, `cancelled` |
| `confirmed` | no | `completed`, `no_show`, `cancelled` |
| `completed` | yes | — |
| `no_show` | yes | — |
| `cancelled` | yes | — |

### 4.3 Custom fields (viewing / listing)

| Field key | Label | Type | Surfaces |
|-----------|-------|------|----------|
| `property_id` | Property | string (ref) | detail, list |
| `project_name` | Project | string | list, detail |
| `locality` | Locality | string | list |
| `bhk` | Configuration (BHK) | enum `1,2,3,4,5+` | list, detail |
| `carpet_sqft` | Carpet area (sq ft) | number | detail |
| `budget_inr` | Budget (₹) | number | create_form |
| `lead_source` | Source | enum | list |
| `rera_id` | RERA registration | string | detail (compliance) |

---

## 5. Catalog / listings

### 5.1 Catalog kinds

| Kind key | Label | Notes |
|----------|-------|-------|
| `property_sale` | Sale listing | Freehold / leasehold |
| `property_rent` | Rental listing | Deposit + rent fields |
| `project` | Project / tower | Parent for multiple units |

### 5.2 Listing attributes (minimum)

- Title, description, gallery (media library)
- Price / rent, deposit, maintenance
- Address (city, locality, pin), geo optional v2
- Possession date, furnishing enum
- Amenities (multi-select)
- Builder / developer name (CRM company link)

**Implementation path A (fast):** Bazaar listing types + custom fields.  
**Implementation path B (clean):** `CatalogItem` collection with `verticalKey: real_estate` (backend).

---

## 6. Workforce

| Role key | Label | Commission model |
|----------|-------|------------------|
| `agent` | Sales agent | `percent_of_sale` |
| `team_lead` | Team lead | `mixed` |
| `channel_partner` | Channel partner | `percent_of_sale` |

v1: Use CRM deal owner + manual commission notes in finance; automate in v1.1.

---

## 7. Sidebar (target v1.0 pack)

Replace home-services groups with:

| Group | Items |
|-------|-------|
| **Overview** | Dashboard (RE KPIs), Analytics |
| **Pipeline** | Leads, Contacts, Companies, Deals, Activities |
| **Properties** | Listings, Projects (optional), Viewings |
| **Growth** | CMS (subset), Marketing workspace (optional) |
| **Finance** | Overview, Expenses, Commissions report (report def) |
| **Documents** | Company documents |
| **Team** | Team work, Calendar, Chat |
| **Settings** | Settings, Help |

**Hide by default:** Bookings (HS), providers, AMC, rate-cards, POS, service-requests (unless customer insists — use module toggles).

---

## 8. Dashboard KPIs

| Widget id | Label | Metric source |
|-----------|-------|---------------|
| `re_leads_today` | New leads today | CRM activities |
| `re_viewings_week` | Viewings this week | Viewing engagements |
| `re_pipeline_value` | Pipeline value (₹) | Open deals sum |
| `re_conversion_rate` | Lead → won % | Deals / leads ratio |
| `re_active_listings` | Active listings | Catalog count |
| `re_avg_days_to_close` | Avg days to close | Won deals |

---

## 9. Compliance (India-oriented)

| Field | Required when | Notes |
|-------|---------------|-------|
| RERA registration number | Sale in RERA states | Display on listing; audit log on change |
| GST treatment | Commercial lease | Pack tax strategy hook |
| DPDP consent | Consumer lead forms | CMS form + consent timestamp |

**Not in v1:** Automated RERA filing, stamp duty calculators.

---

## 10. Storefront / consumer

- Marketing slug: `for-real-estate` (exists in stub — `storefront/themes/coming-soon/ComingSoon.tsx`)
- Templates: project grid, listing detail, lead capture form → CRM lead
- SEO: locality + BHK programmatic pages (reuse industry CMS patterns from home services)

---

## 11. Billing plans (proposed)

Create `src/verticals/real_estate/billingPlans.ts` when exiting stub:

| Plan key | Name | Included modules | Limits (example) |
|----------|------|------------------|------------------|
| `re_starter` | Starter | `crm`, `cms` | 3 agents, 100 listings |
| `re_growth` | Growth | + `finance`, `marketing_workspace`, `team_work` | 10 agents, 500 listings |
| `re_scale` | Scale | all except `bazaar` marketplace | unlimited listings, SSO later |

Until plans ship: onboard on `hs_starter` / `hs_growth` with **manual module allowlist** (see runbook doc 04).

---

## 12. Phased delivery

### Phase RE-0 — Today (stub)

- Create tenant with `verticalKey: real_estate`
- Restrict modules via **Manage → App modules**
- Configure CRM deal stages manually
- Use Bazaar or CMS for listings

### Phase RE-1 — Pack v1 (2–3 weeks)

- [ ] `src/verticals/real_estate/sidebarManifest.ts`
- [ ] `dashboardWidgets.ts`
- [ ] `engagement.ts` (viewing statuses)
- [ ] `billingPlans.ts`
- [ ] Register in `registry.ts` (replace stub builder)
- [ ] Backend: viewing API or alias to bookings with `verticalKey`
- [ ] Human test plan rows in `docs/saas/07-human-test-plan.md`

### Phase RE-2 — Differentiation (4–6 weeks)

- [ ] Property catalog CRUD (if not Bazaar)
- [ ] Commission reports
- [ ] Storefront listing template live
- [ ] WhatsApp lead ingest webhook

---

## 13. Acceptance criteria (RE-1)

1. New tenant with `real_estate` sees **no** home-services-only items (AMC, providers, platform-services) in sidebar.
2. Dashboard shows **6 RE KPIs** with real or seeded data.
3. Viewing list supports create / status transition per state machine.
4. `PlatformTenantsPage` offers RE-specific plans when `verticalKey === real_estate`.
5. Storefront `/for-real-estate` signup wizard sets `verticalKey` correctly.

---

## 14. Files to create / modify

| File | Action |
|------|--------|
| `src/verticals/real_estate/sidebarManifest.ts` | Create |
| `src/verticals/real_estate/dashboardWidgets.ts` | Create |
| `src/verticals/real_estate/engagement.ts` | Create |
| `src/verticals/real_estate/billingPlans.ts` | Create |
| `src/verticals/registry.ts` | Import full pack |
| `src/lib/engagementStatusAliases.ts` | Viewing status API aliases if needed |
| `fixer-backend` engagement or booking routes | `verticalKey` filter |

---

## 15. Open questions

1. Listings in **Bazaar** vs dedicated **Properties** collection?
2. Tenancy rent collection — finance module only or payment links to tenants?
3. Multi-branch brokerage — one tenant or tenant per city?

Document answers in this file when decided.
