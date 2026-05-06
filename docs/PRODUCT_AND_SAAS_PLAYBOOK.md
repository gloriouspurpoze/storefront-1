# Product & SaaS Playbook — fixer-admin / ProFixer

**Canonical doc:** This file is the single source for product narrative, SaaS strategy, and investor-facing summary.  
**Scope:** React admin SPA in this repo + assumed backend API and consumer site **profixer.in** (see full playbook for caveats).  
**Client onboarding (ops):** [`PARTNER_ONBOARDING_SOP.md`](PARTNER_ONBOARDING_SOP.md) — multi-tenant provisioning, DB/API posture, existing-website integration.

---

## Part A — Investor one-pager

### The company in one line

**Vertical operations platform** for **local services marketplaces**: one authenticated console to run **supply, bookings, payments, CMS/SEO, CRM, internal finance, and team execution**—built for **profixer.in** and reusable as **multi-tenant SaaS** with backend/platform work.

### Problem

Service marketplaces and multi-branch operators typically stitch together **spreadsheets, WhatsApp, generic CRMs, and ad-hoc CMS**—slow moderation, weak payout visibility, and no unified growth ops.

### Product

**fixer-admin** is a **role-based admin** (staff, providers, professionals) covering:

- **Marketplace ops:** professionals/providers, applications, listing review, Pro-Verify-style queues, marketplace hub  
- **Transactions:** bookings, quotes, service requests, payments, invoices (create + branding), refunds, earnings/payouts views  
- **Growth:** full **CMS** (homepage, pages, menus, blog, SEO, media, promotions) plus an internal **marketing workspace** (campaigns, calendar, social, tasks)  
- **Commercial:** **CRM** (leads, contacts, companies, deals, activities)  
- **Corporate discipline:** **finance** module (expenses, budgets, reconciliation, recurring)  
- **Execution:** team work (kanban + calendar), chat (realtime)

### Why now / moat

Depth of **workflow** in one **vertical** (home services / trades / local marketplace) beats horizontal “admin templates.” **RBAC** and modular access mirror how real teams delegate.

### Business model

- **SaaS:** tiered subscription (Operator / Growth / Enterprise) + **implementation fees**  
- **Marketplace economics** (where applicable): take rate, verification/listing fees, paid placement—requires payment rails and legal clarity  
- **Services:** onboarding and integrations (high margin early)

### Traction to demonstrate

Lead with **profixer.in**: liquidity, repeat bookings, active pros, refund/dispute rates, SEO/content growth—dogfood the CMS and marketing workspace publicly.

### SaaS readiness (honest)

Frontend supports **tenant context** (`REACT_APP_SAAS_MODE`, configurable tenant header on API calls). **Production SaaS** requires **server-side tenant isolation**, org lifecycle, **billing**, observability, DPA/support posture—not UI alone.

### Ask / use of capital (placeholder)

Use this section when fundraising: e.g. platform hardening, GTM for 5–10 pilot operators, mobile parity for supply side, integrations.

### Contact

*[Add founder email, deck link, data room.]*

---

## Part B — Full playbook (CEO / product / sales)

### Document purpose

Describe what **fixer-admin** is today, how it serves **profixer.in**, whether it can be sold as **SaaS**, where **profit and GTM** come from, and **what to build next**—including an explicit call on a **website builder**.

**Audience:** Founder / product owner evaluating positioning, packaging, and roadmap.

**Technical scope:** This repository is the **admin web application** (React SPA). It assumes a **backend API** (`REACT_APP_API_URL`) and, for marketplace operations, the consumer-facing site **profixer.in**. Feature lists reflect **routes and modules shipped in this frontend**; backend completeness must be validated separately.

---

### 1. Executive summary

**fixer-admin** is a **multi-surface operations console** for a **services + commerce + marketplace** platform: catalog and providers/professionals, bookings and quotes, payments and invoices, CMS and SEO, CRM, internal finance, team collaboration, marketing workspace, and role-based access for **staff**, **providers**, and **professionals**.

For **profixer.in**, it is the **control plane**: how you run the business, moderate supply, manage content and growth levers, and support customers—without editing code for every change.

**Strategic framing:** This is not a generic “admin template.” It is **vertical software** aligned with **home services / skilled trades / local marketplace** workflows. That positioning matters for SaaS pricing and sales motion.

---

### 2. What we built (feature inventory)

Features are grouped the same way the product organizes navigation (see `src/config/app-routes.ts` and sidebar). Use this section as **internal documentation** and as the basis for **sales collateral** (trim per buyer).

#### 2.1 Overview & analytics

- Dashboard home  
- Analytics  

#### 2.2 Company finance (internal)

- Finance overview (P&amp;L-style framing in UX copy)  
- Expenses, budgets, directory (accounts/vendors/categories)  
- Bank/cash **reconciliation** (CSV-oriented workflows)  
- Recurring transactions / subscriptions scheduling  

*Note:* This module models **your company’s** books and controls—not customer wallets alone.

#### 2.3 CRM (B2B & pipeline)

- CRM overview  
- Leads, contacts, **B2B accounts (companies)**, deals  
- Activities  
- CRM settings (field access patterns exist in code)  

#### 2.4 Operations & workforce

- **Team work:** Kanban-style hub + **team calendar** (meetings/scheduling affordances)  
- **Bookings** (detail views)  
- **Service requests**  
- **Quotes**  
- **Payments**, **invoices** (including **create invoice**, **invoice branding**)  
- **Earnings & payouts** (admin overview exists in routing)  
- **Chat** (real-time client usage via `socket.io-client`)  

#### 2.5 Catalog, marketplace, and supply

- **Categories** (product vs service taxonomy)  
- **Platform services** configuration  
- **Marketplace** administration  
- **Professionals** management + **professional command center** (deep admin hub)  
- **Provider applications** queue  
- **Bazaar:** listing chats hub, **listing review**, **Pro-Verify** moderation queue  

#### 2.6 E-commerce (if you retail SKUs)

- Store hub  
- **Products**, **inventory**, **orders**  

#### 2.7 Content, marketing, and growth

**CMS (customer-facing site content)**

- CMS dashboard  
- **Homepage** sections, **pages**, **menus**  
- **Blog** posts & categories (rich editor patterns)  
- **Banners & sliders**, **announcements/pop-ups**, **promotions**  
- **Coupons**, **referrals**  
- **Newsletter**, **email templates**  
- **Social links**, **testimonials**, **reviews (CMS)**, **FAQs**  
- **Rate card**, **industry/category marketing pages**, **cross-linking**  
- **Media library**, **SEO management**  

**Marketing workspace (internal marketing OS)**

- Campaigns  
- Content calendar  
- Social posts + **publish settings** (organic social workflow UI)  
- Planning & ideas, marketing tasks, R&amp;D / brainstorm (“lab”)  

#### 2.8 Users, communication, system

- **Customers** and **team members**  
- **Notifications**, **messages**  
- **Reports**  
- **Refund requests**  
- **System status**, **settings**, **help & support**  

#### 2.9 Role-specific experiences (same app, different nav)

- **Provider:** dashboard, bookings, earnings, profile (+ messages/support)  
- **Professional:** dashboard, bookings, earnings, services, profile, reviews, documents, chat/messages, settings  

#### 2.10 Access control (why this is “enterprise-grade” for a startup)

- **RBAC** with granular permissions (products, orders, bookings, CRM, finance, etc.) — see `src/config/rbac.config.ts`  
- **Dashboard access modules** bundle permissions for operational onboarding — see `src/config/dashboard-access-modules.ts`  
- **Team invite acceptance** flow (`accept-team-invite`) for controlled staff growth  

#### 2.11 SaaS readiness (frontend signals)

The codebase includes **multi-tenant hooks**:

- `REACT_APP_SAAS_MODE` toggles SaaS-oriented UI affordances  
- API client sends **`X-Tenant-Id`** (configurable via `REACT_APP_TENANT_HEADER`) when a tenant id is present in app state  
- Default tenant id can be set in dev via env for integration testing  

**CEO takeaway:** The UI is **aware** of tenancy; **commercial SaaS** still requires **backend enforcement** (data isolation, billing, org lifecycle) and **product decisions** (what is shared vs white-labeled).

---

### 3. Primary use: profixer.in

**profixer.in** should treat this admin as:

| Layer | What fixer-admin does |
|--------|------------------------|
| **Supply** | Onboard/moderate professionals & providers; verify listings; manage marketplace integrity |
| **Demand ops** | Bookings, quotes, service requests, refunds, support |
| **Monetization** | Payments, invoices/branding, coupons/referrals, payouts/earnings views |
| **Growth** | CMS + SEO + blog + promotions; internal marketing workspace |
| **Commercial** | CRM for partnerships and B2B; finance module for company P&amp;L discipline |
| **Execution** | Team tasks + calendar; chat for coordination |

**Positioning line (example):** *“ProFixer Admin is the operating system for running ProFixer—the marketplace, the service operations, and the growth stack—in one authenticated console.”*

---

### 4. Can you sell this as SaaS? How? To whom?

#### 4.1 Yes—with caveats

You can sell **hosted software** that bundles:

- This **admin console**  
- A **tenant-isolated API + database**  
- Optional **consumer web/app** templates  

You **should not** promise “works for any industry” on day one. Win by owning **one vertical** exceptionally well.

#### 4.2 Ideal customer profiles (ICP)

Prioritize buyers who already feel pain in **Excel + WhatsApp + fragmented tools**:

1. **Regional home-services marketplaces** (cleaning, repairs, HVAC, plumbing bundles)  
2. **Franchise / multi-branch service operators** needing catalog + bookings + payouts  
3. **B2B2C aggregators** pairing corporates with local technician networks  
4. **Vertical SaaS resellers / agencies** who implement for SMB chains (higher touch, higher ACV)  

Deprioritize until you have polish: generic SMB “any booking business” unless you narrow the workflow and onboarding ruthlessly.

#### 4.3 Packaging (simple CEO-grade tiers)

| Tier | Who | What they pay for |
|------|-----|-------------------|
| **Operator** | Single-city marketplace | Core ops: bookings, providers/pros, CMS, payments basics |
| **Growth** | Teams running paid acquisition | + CRM, marketing workspace, coupons/referrals, advanced CMS/SEO |
| **Enterprise** | Multi-city / compliance-heavy | + Finance module governance, SSO later, SLA, custom integrations |

Add **implementation fees** early. Vertical SaaS profits as much from **services + onboarding** as from ARPU at the start.

#### 4.4 How you sell it (motion)

- **Outbound:** Founder-led sales to operators you can find on LinkedIn / industry directories; sell **a pilot city**.  
- **Inbound:** SEO + case studies once **profixer.in** is the proof asset (“powered by” story).  
- **Partners:** Web agencies building marketplaces; give them **revenue share** or **certification**.  

#### 4.5 What must exist to *actually* be SaaS

Minimum viable **platform** checklist (beyond this repo):

1. **Tenant isolation** on every query (server-side, not header trust alone)  
2. **Org signup**, invites, suspension, deletion  
3. **Billing** (Stripe Billing or Paddle), usage meters if needed  
4. **Observability** per tenant (errors, jobs, queues)  
5. **Legal**: DPA, subprocessors, data residency stance  
6. **Support**: ticketing SLA discipline  

---

### 5. Should you add a “website builder” into this admin?

#### 5.1 What you already have

You already operate a **serious CMS**: homepage sections, pages, menus, blog, media library, SEO tools, banners, etc. For many marketplaces, that is **sufficient** because the site is **templated**, not arbitrary drag-and-drop art direction.

#### 5.2 CEO recommendation

- **Do not** build a full **visual page builder** (Webflow-class) inside v1 SaaS. It is a **multi-year product** on its own and dilutes your differentiation (marketplace ops).  
- **Do** invest in **templates + sections + theme tokens** (colors, typography, spacing, component presets) so tenants get **fast, on-brand** sites without layout fragility.  
- **Optional later:** “**Section library**” with reorder/add/remove blocks **within predefined schemas**—controlled flexibility, not free-form canvas.  

**Rule:** Your buyer pays for **revenue operations**, not for becoming a web designer.

---

### 6. Profit, marketing, and sales

#### 6.1 Revenue levers (aligned to this product)

1. **Subscription** (per-seat + base platform fee is easiest to justify with RBAC-heavy apps)  
2. **Take rate / GMV fee** if you host payments and marketplace flows (requires legal + reconciliation discipline—your finance module direction helps **you** operate cleanly)  
3. **Payments markup** (MSC / rails economics) where regulations allow  
4. **Professional listing fees / verification fees** (your Bazaar + Pro-Verify flows support operational enforcement)  
5. **Paid placement** in marketplace categories (monetize discovery once liquidity exists)  
6. **Implementation & priority support** (high margin early)  

#### 6.2 Marketing strategy (practical)

- **Category story:** “Marketplace OS for local services” not “another admin panel.”  
- **Proof:** Ship **profixer.in** metrics you can publish (even ranges): bookings, active pros, NPS, SEO growth.  
- **Content:** Operate your own **blog + programmatic SEO** using the CMS you built—dogfood publicly.  
- **Channels:** Founder content, operator communities, WhatsApp-heavy markets (your CRM/WhatsApp playbook components suggest real-world GTM fit).  

#### 6.3 Sales strategy (0→10 customers)

- Sell **workflows**, not screens: “listing moderation,” “payout clarity,” “CRM for BD,” “finance visibility.”  
- **Pilot pricing:** flat monthly + success milestone → converts to standard tier.  
- **Say no** to custom forks; allow **integrations** instead.  

---

### 7. Is this “complete”? What to add next

#### 7.1 Honest completeness lens

- **As an internal OS for profixer.in:** Likely **strong**, assuming API parity. The surface area is **broad** (finance + CRM + CMS + ops).  
- **As multi-tenant SaaS:** **Not complete** until tenant lifecycle, billing, enforcement, and onboarding are **productized**.  
- **As a category killer:** Completeness is **continuous**—marketplaces win on trust, liquidity, and monetization mechanics more than on admin screen count.  

#### 7.2 High-ROI additions (suggestion stack)

1. **Tenant onboarding wizard** (industry template, branding import, DNS checklist)  
2. **Audit logs & admin action history** (trust + enterprise sales)  
3. **Quality metrics dashboard** (SLAs, dispute/refund reasons, pro quality scores—tie moderation to revenue)  
4. **Integration marketplace posture** (webhooks, Zapier/Make later—even if stubbed)  
5. **Mobile parity** for providers/pros where appropriate (you have `mobile-app/` in repo—align roadmap explicitly)  
6. **AI where it reduces ops cost:** support summarization, listing QA assistants, SEO outlines—**after** core workflows are stable  

#### 7.3 Things *not* to chase early

- Generic ERP replacement  
- Fully customizable website builder  
- “Every CRM feature Salesforce has”  

---

### 8. Closing thesis (CEO stance)

**fixer-admin** is already a **wide, vertically coherent operations platform**. For **profixer.in**, it is the right backbone to scale supply, trust, content, and money movement.

For **SaaS**, your advantage is **workflow depth for service marketplaces**, not horizontal breadth. Monetize with **tiered subscriptions + implementation**, strengthen **tenant isolation and billing**, and keep **web presence** as **template + CMS**, not a second company inside the company.

---

### Appendix: Technical snapshot (for investors / eng leads)

| Item | Detail |
|------|--------|
| Stack | React 19, TypeScript, MUI + Radix/Tailwind utilities, Redux (`redux-persist`), React Router v7 |
| API | `fetch`-based client with auth bearer token + optional tenant header |
| Realtime | `socket.io-client` (chat) |
| Build | Create React App (`react-scripts`) |
| Config | `REACT_APP_API_URL`, `REACT_APP_SAAS_MODE`, `REACT_APP_TENANT_HEADER`, `REACT_APP_DEFAULT_TENANT_ID` |

*This document is descriptive of the codebase at authoring time; routes and modules may evolve—refresh when major areas ship.*
