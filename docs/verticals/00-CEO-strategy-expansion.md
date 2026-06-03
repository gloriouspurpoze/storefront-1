# CEO strategy — Real estate & logistics expansion

**Status:** Approved direction for design-partner onboarding (two paying customers).  
**Audience:** Founder, board, product lead.  
**Not a spec:** For engineering detail see docs `01`–`05` in this folder.

---

## 1. Executive summary

ProFixer is a **vertical operations platform** (admin + API + optional storefront) originally built for **home services / local marketplace** workflows. The codebase already supports **multi-tenant SaaS** and a **vertical pack** system: each tenant picks one `verticalKey`; packs define sidebar, engagement statuses, dashboard KPIs, and default modules.

**Question:** Should we add a **shipment dashboard** and onboard **logistics** and **real estate** customers?

**Answer:**

| Initiative | Verdict | Why |
|------------|---------|-----|
| **Real estate vertical** | **Yes — prioritize first** | ~70–75% reuse of CRM, listings (Bazaar), documents (e-sign), CMS, finance. `real_estate` already exists as a **stub pack** — fast path to revenue. |
| **Shipment dashboard (thin logistics)** | **Yes — second, scoped** | Serve the logistics design partner with **status-based tracking** (not a full TMS). Defer GPS, routing, telematics to a **paid Phase 2**. |
| **Full logistics / TMS vertical** | **No for v1** | Low reuse; competes with Delhivery-style stacks; becomes a second company inside the company. |
| **Both at once (engineering)** | **No — sequence** | Same team: real estate pack first (proves pattern), then logistics thin MVP. **Commercial** can run both in parallel with implementation fees. |

---

## 2. Strategic fit

### 2.1 What we are selling

Buyers pay for **revenue operations**, not admin screen count:

- Pipeline and deals (CRM)
- Listings / catalog integrity (Bazaar or products)
- Money movement (payments, invoices, finance)
- Growth (CMS, SEO, marketing workspace)
- Team execution (tasks, chat, calendar)

Real estate and light logistics both map to this **if scope is controlled**.

### 2.2 What we are not becoming (v1)

- Generic ERP
- Webflow-class website builder
- Full TMS (transportation management system) with live fleet GPS
- “Any industry” horizontal SaaS

---

## 3. Market and reuse (honest scorecard)

| Vertical | India TAM (indicative) | Code reuse vs today | Sales cycle | v1 complexity |
|----------|------------------------|---------------------|-------------|---------------|
| Real estate (brokerage / developer sales desk) | Large | **High** | Medium | **Low–medium** |
| Logistics (courier / 3PL / last-mile) | Large | **Low–medium** | Medium–long | **High** if GPS/routing included |
| Salon (doc recommendation for 2nd vertical) | Large | Highest | Short | Medium |

**Design-partner override:** When **two customers are ready to pay**, TAM tables matter less than **sequenced delivery** and **written scope**.

---

## 4. Business model for these onboardings

### 4.1 Revenue lines

1. **Monthly subscription** — vertical-specific `planKey` (create `re_*` and `log_*` plans when productized; until then stub tenants may use `hs_*` plans per [`08-onboard-three-tenants-runbook`](../saas/08-onboard-three-tenants-runbook.md)).
2. **Implementation fee (mandatory for new verticals)** — onboarding, data import, training, DNS/storefront. Target **1–3× monthly MRR** for first customers.
3. **Phase 2 SOW** — logistics GPS, driver app, carrier APIs — **separate quote**, never bundled silently in v1.

### 4.2 Pilot pricing template

| Component | Real estate pilot | Logistics pilot (thin) |
|-----------|-------------------|-------------------------|
| Platform fee | ₹X / mo (TBD `re_starter`) | ₹Y / mo (TBD `log_starter`) |
| Implementation | ₹A one-time | ₹B one-time (higher if integrations) |
| Seats | N admin seats included | N dispatch seats |
| Success milestone | e.g. 50 listings + 20 deals in CRM | e.g. 500 shipments/mo tracked in dashboard |
| Phase 2 trigger | WhatsApp + portal bookings | Live GPS + driver app |

---

## 5. Operating principles

1. **One vertical proves the pack pattern** — real estate is the cleaner proof (high reuse).
2. **Logistics customer gets a pilot contract** — explicit out-of-scope list (GPS, route optimization, hardware).
3. **Charge for scope creep** — every “small ask” for live maps is Phase 2.
4. **Do not fork the codebase** — new industries = new pack under `src/verticals/`, not a second repo.
5. **Dogfood profixer.in** — marketplace metrics remain the flagship story for investors; vertical expansions are **SaaS revenue**, not a pivot away from core.

---

## 6. Risks and mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Logistics customer expects Delhivery-level product | Churn, bad reference | Written v1 scope; shipment status dashboard only |
| Stub pack confuses real estate users (home-services nav) | Support load | Fast-track `real_estate` sidebar (doc 01); communicate “early access” |
| Two verticals drain core roadmap | profixer.in stagnation | Time-box RE to 2–3 weeks; cap logistics v1 at 2 weeks |
| `verticalKey` mutable later | Data migration hell | Lock vertical at tenant create (doc 03) |
| Backend / frontend key drift | 400 errors on create | Sync `VerticalKey` with `fixer-backend` `TENANT_VERTICAL_KEYS` |

---

## 7. Success metrics (90 days)

### Real estate design partner

- [ ] Tenant live on `real_estate` with CRM pipeline adopted
- [ ] ≥ N active property listings (catalog or Bazaar)
- [ ] ≥ M deals moved through stages
- [ ] Renewal or upsell to Growth tier

### Logistics design partner

- [ ] Tenant live with shipment list + status workflow
- [ ] ≥ 80% of shipments updated within SLA (manual or webhook)
- [ ] Zero critical bugs on finance/invoicing for deliveries
- [ ] Signed Phase 2 SOW **or** explicit “v1 sufficient” sign-off

### Platform

- [ ] Dedicated `real_estate` sidebar + dashboard shipped
- [ ] `logistics` key registered (if separate vertical) **or** shipments live under `retail`/`b2b_services` + module gate
- [ ] One case study per vertical for sales

---

## 8. Decision log

| Date | Decision | Owner |
|------|----------|-------|
| 2026-06-03 | Proceed with both design partners; **sequence engineering RE → logistics thin** | CEO / product |
| TBD | One-vertical-per-tenant vs `additionalVerticals` | CEO — see [`03-tenant-vertical-policy.md`](./03-tenant-vertical-policy.md) |
| TBD | `logistics` as new `VerticalKey` vs extend `retail` orders | Eng lead — see [`02-logistics-shipment-vertical-spec.md`](./02-logistics-shipment-vertical-spec.md) |

---

## 9. What to read next

- Product / eng spec: [`01-real-estate-vertical-pack-spec.md`](./01-real-estate-vertical-pack-spec.md)
- Logistics scope: [`02-logistics-shipment-vertical-spec.md`](./02-logistics-shipment-vertical-spec.md)
- Ops runbook: [`04-onboarding-runbook-real-estate-logistics.md`](./04-onboarding-runbook-real-estate-logistics.md)
