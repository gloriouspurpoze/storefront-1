# Runbook — Onboard real estate & logistics design partners

> **Goal:** Stand up two production customer organizations with clear scope, modules, and launch readiness.  
> **Runtime:** ~20–30 minutes per tenant (stub) · ~2–4 hours with data import.  
> **Audience:** Super-admin operators with `manage_system_settings`.

**Related:** [`docs/saas/08-onboard-three-tenants-runbook.md`](../saas/08-onboard-three-tenants-runbook.md), [`docs/TENANT_ONBOARDING_AND_RBAC_RUNBOOK.md`](../TENANT_ONBOARDING_AND_RBAC_RUNBOOK.md), [`PARTNER_ONBOARDING_SOP.md`](../PARTNER_ONBOARDING_SOP.md).

---

## 0 · Preconditions

- [ ] Signed pilot SOW (implementation fee + monthly + Phase 2 out-of-scope for logistics).
- [ ] Signed **tenant-vertical policy** — default Model A ([`03-tenant-vertical-policy.md`](./03-tenant-vertical-policy.md)).
- [ ] Super-admin login; **Settings → Organizations** loads.
- [ ] `REACT_APP_SAAS_MODE=true` in admin `.env`.
- [ ] Backend `/api/platform/tenants` healthy.
- [ ] Slug convention: `^[a-z0-9][a-z0-9-]{1,62}$` (lowercase, hyphens).

---

## 1 · Tenant A — Real estate brokerage

### 1.1 Identity (example — replace with customer)

| Field | Example value |
|-------|----------------|
| Display name | `Acme Properties` |
| Slug | `acme-properties` |
| Industry vertical | **Real estate** (`real_estate`) |
| SaaS plan | `Growth` (`hs_growth`) until `re_growth` ships **OR** custom plan |
| Owner email | `owner@acmeproperties.in` |

### 1.2 Commercial module allowlist

Recommended `featureModules` after create (Manage → Apply or manual):

```text
crm, cms, finance, team_work, marketing_workspace
```

**Disable for v1:** `bazaar` (unless using listings moderation), `ecommerce`, marketplace/provider modules.

### 1.3 Step-by-step

1. **Settings → Organizations → Add organization**.
2. Display name + slug + owner email.
3. Industry vertical: **Real estate**.
4. SaaS plan: pick closest tier; note in CRM to migrate to `re_*` when billed.
5. **Create** → open **Launch readiness**.
6. **Manage** on row:
   - Confirm `verticalKey` = `real_estate`.
   - **App modules:** restrict to table in §1.2.
   - **Invite admin** or attach existing user.
7. **CRM setup** (customer-facing config):
   - Deal stages: `New lead` → `Qualified` → `Viewing scheduled` → `Negotiation` → `Won` / `Lost`.
   - Lead sources: Website, Walk-in, Referral, Portal.
8. **Listings** (choose one path):
   - **Path A:** Bazaar listings with property categories, or  
   - **Path B:** CMS industry pages per project until Properties module ships.
9. **CMS:** Site appearance, menus, homepage; enable lead form → CRM.
10. **Documents:** Enable company documents for MOU/lease templates.
11. **Custom domain** (optional): e.g. `app.acmeproperties.in` → DNS per platform SOP.
12. **Launch readiness:** complete six steps for slug `acme-properties`.

### 1.4 Customer communication (stub pack)

Send this until RE-1 pack ships:

> “You’re on ProFixer Real Estate early access. Navigation may show some generic labels this week; your CRM, listings, and site are configured for property workflows. Dedicated property menus land in [date].”

### 1.5 Verification checklist

- [ ] Owner logs in; sees CRM, CMS, Finance (per modules).
- [ ] Test lead → deal → activity created.
- [ ] At least one listing visible on storefront or admin.
- [ ] `X-Tenant-Id` on API calls matches `acme-properties` tenant id.
- [ ] No cross-tenant data in spot-check (`npm run audit:tenant-isolation:strict` on backend if available).

---

## 2 · Tenant B — Logistics / courier (thin pilot)

### 2.1 Identity (example)

| Field | Example value |
|-------|----------------|
| Display name | `Swift Courier` |
| Slug | `swift-courier` |
| Industry vertical | **B2B services** (`b2b_services`) for pilot **OR** `logistics` when key exists |
| SaaS plan | `hs_growth` or future `log_starter` |
| Owner email | `ops@swiftcourier.in` |

### 2.2 Commercial module allowlist (pilot)

```text
crm, finance, team_work
```

Add `ecommerce` **only if** using Orders UI as shipment list until `Shipments` page exists.

### 2.3 Step-by-step

1. Create org as §1.3 with vertical **B2B services** (pilot).
2. Manage → modules per §2.2.
3. **CRM:** Companies = shippers; Contacts = consignees.
4. **Shipments v0 (interim):**
   - **Option 1:** Orders module — define order types as shipment; use status fields manually.  
   - **Option 2:** Spreadsheet import via backend script (coordinate with backend team).  
   - **Option 3:** Wait for `ShipmentsListPage` (LOG-1) — preferred before go-live announcement.
5. **Finance:** Invoice template for per-shipment or monthly shipper billing.
6. **Notifications:** Template “Your shipment {awb} is {status}”.
7. Document **Phase 2** exclusions in customer folder (GPS, driver app).

### 2.4 Status workflow (operator training)

Train customer ops team on manual transitions:

```text
created → picked_up → in_transit → out_for_delivery → delivered
```

Failures: set `failed` + reason; returns: `returned`.

### 2.5 Verification checklist

- [ ] 10 test shipments created and moved to `delivered`.
- [ ] POD attachment on at least one shipment (when LOG-1 live).
- [ ] Invoice generated for test shipper.
- [ ] CSV export reconciles with finance.
- [ ] Pilot SOW Phase 2 line items acknowledged in writing.

---

## 3 · Sequencing two customers

| Week | Real estate | Logistics |
|------|-------------|-----------|
| 1 | Create tenant; CRM + listings live | Contract + discovery only |
| 2 | RE-1 pack engineering | Create tenant; interim orders/import |
| 3 | Storefront + training | LOG-1 shipments UI |
| 4 | Case study | Case study; Phase 2 quote if needed |

**Do not** promise logistics GPS date in week 1.

---

## 4 · Implementation fees & handoff

| Deliverable | Owner | Artifact |
|-------------|-------|----------|
| Tenant provisioned | Ops | Slug + tenant id in password vault |
| CRM stages | Ops / customer | Screenshot in handover doc |
| Training session | Ops | 60-min recording |
| Engineering pack | Eng | PR link + deploy date |
| Support channel | Ops | Email / WhatsApp group rules |

---

## 5 · Rollback / suspend

1. **Settings → Organizations → Manage** → suspend tenant (if backend supports `status: suspended`).  
2. Disable custom domain routing.  
3. Preserve data 90 days per DPA.  
4. Do not reuse slug until deletion confirmed.

---

## 6 · CLI bootstrap (optional)

If backend ships reference script pattern from `onboard:reference-tenants`, add entries:

```bash
# Example — adjust to actual script flags in fixer-backend
cd fixer-backend
ALLOW_DESTRUCTIVE=1 npm run onboard:reference-tenants -- \
  --slug acme-properties --vertical real_estate --plan hs_growth

ALLOW_DESTRUCTIVE=1 npm run onboard:reference-tenants -- \
  --slug swift-courier --vertical b2b_services --plan hs_growth
```

Verify script supports `real_estate` and `b2b_services` in `TENANT_VERTICAL_KEYS`.

---

## 7 · Post-onboarding

- [ ] Add rows to human test plan [`docs/saas/07-human-test-plan.md`](../saas/07-human-test-plan.md).  
- [ ] Update implementation status in [`docs/verticals/README.md`](./README.md).  
- [ ] Schedule 30-day check-in against CEO metrics ([`00-CEO-strategy-expansion.md`](./00-CEO-strategy-expansion.md) §7).

---

## 8 · Template: customer-facing scope email (logistics)

Subject: ProFixer Phase 1 scope — Swift Courier

Body bullets:

- Included: shipment list, status updates, CRM shippers, invoicing, notifications, CSV export.  
- Not included in Phase 1: live GPS map, driver mobile app, route optimization, carrier API integrations.  
- Phase 2: quoted separately upon request.

---

*Replace example names/slugs with production customer values before execution.*
