# CRM team handover — Fixer Admin

This document is for **ops, support, and managers** using the CRM in Fixer Admin. It explains **environment flags**, **permissions**, **day-to-day workflow** (including WhatsApp), and **future improvements** the product does not cover yet.

---

## 1. What this CRM is

- **Data lives in MongoDB** on the backend, exposed as **`/api/crm`** (not in the browser by default in production).
- **Admin** is a React SPA: lists and forms for contacts, leads, companies, deals, activities, plus CSV export and optional Google Calendar / Gmail sync (configured on the server).
- **No embedded WhatsApp Business API** in this app: WhatsApp is modeled as **lead source** + **activity type** + **platform IDs** so reporting and handoffs stay consistent without Meta/BSP integration.

---

## 2. Environment flags (full reference)

| Variable | Required | Effect |
|----------|----------|--------|
| **`REACT_APP_API_URL`** | Yes | Base URL for all API calls (no trailing slash), e.g. `https://api.example.com/api`. CRM requests go to this host under `/crm/...`. |
| **`REACT_APP_CRM_USE_API`** | Dev: strongly recommended | If **`true`**, admin uses the **Mongo-backed CRM API** (same behaviour as production). If omitted/false in **development only**, admin can fall back to an **in-browser demo store** (localStorage) — **not** for real operations. **Production builds always use the API** regardless of this flag. |
| Auth / JWT | Yes | User must be logged in; backend enforces CRM routes. |

**Copy from template:** use repo root **`.env.example`** — CRM section is under the “CRM (fixer-backend /api/crm → MongoDB)” heading.

**Backend (not in the admin bundle):** `JWT_SECRET`, any **`CRM_GOOGLE_*`** OAuth secrets, Mongo connection string, CORS allowlist for the admin origin. Never commit real secrets; use host env or a secrets manager.

**RBAC seed (backend):** e.g. `cd fixer-backend && npm run seed:crm-permissions` (as noted in `.env.example`) so roles receive `view_crm` / `manage_crm` as intended.

---

## 3. Permissions — who can do what

| Permission | Typical role | What it enables in admin |
|------------|----------------|---------------------------|
| **`view_crm`** | Staff, managers | Open CRM nav, see dashboard, leads, contacts, companies, deals, activities, **CRM settings** (read integration status, go-live checklist). |
| **`manage_crm`** | Team leads, admins | Create/edit/delete records, bulk delete, exports, **field policies** JSON in CRM settings (when API + backend support it). |

**Tip:** Staff with **view only** should still **read** the green “WhatsApp & jobs” playbook on Dashboard, Leads, Contacts, Activities, and Settings — it describes the process they follow even if someone else enters data.

---

## 4. Where to work in the app (routes)

| Screen | Path | Use for |
|--------|------|---------|
| Overview | `/crm` | Metrics, overdue tasks, subnav |
| Leads | `/crm/leads` | Funnel stages, **New WhatsApp lead**, lead source presets |
| Contacts | `/crm/contacts` | Customer/partner records, **platform user / booking / order IDs**, drawer links |
| B2B accounts | `/crm/companies` | Society / AMC / partner org records |
| Deals | `/crm/deals` | Pipeline stages |
| Activities | `/crm/activities` | **Log WhatsApp outcome**, calls, visits, tasks |
| CRM settings | `/crm/settings` | Google sync status, field policies (`manage_crm`), pre-production checklist |

Command palette / nav labels match **`app-routes.ts`** (“CRM overview”, “Leads”, …).

---

## 5. Using the CRM efficiently (daily playbook)

### 5.1 WhatsApp and phone enquiries (no API integration)

1. **New enquiry** — On **Leads** (or **Contacts**), create the person with **Lead source = WhatsApp** (preset chip or type “WhatsApp”). Use **New WhatsApp lead** when the list is empty or from the header.
2. **After each meaningful thread** — On **Activities**, use **Log WhatsApp outcome** (or create an activity with type **WhatsApp**). Set **subject** clearly (e.g. `WhatsApp — quote sent 3k AC service`). **Link** the activity to the **contact** or **deal** so the next shift sees context.
3. **When the customer exists in the app or a job is booked** — Open the **contact**, paste **Platform user ID** (from Users), **Platform booking ID** (from Bookings), and/or **Platform order ID** (from Orders). The contact panel uses these for deep links.
4. **Keep pipeline honest** — Update **lifecycle** on contacts and **stage** on deals when reality changes (quoted → scheduled → paid, etc.).

### 5.2 Activities page shortcuts

- **Log WhatsApp outcome** — Opens the dialog with type **WhatsApp** and a `WhatsApp — ` subject prefix; dialog title reflects this; hint text reminds you to link related records and IDs on the contact.
- **Log other activity** — Generic task/call/etc.
- Empty list: primary **Log WhatsApp outcome**, secondary **Log other activity**.

### 5.3 Leads vs contacts

- **Leads** — Good for **top-of-funnel** rows and stage filters.
- **Contacts** — System of record for **identity + platform IDs + lifecycle**; open the drawer for full detail and linked activities.

### 5.4 Settings and compliance

- **CRM settings** — Integration status (Google), go-live checklist, and field policies for `manage_crm`.
- **Google sync** — Optional; requires backend OAuth and consent appropriate for your org; plan privacy wording for mail/calendar read.

### 5.5 Exports

- Use **Export CSV** where available (e.g. activities) for audits or offline reporting; confirm export scope with your security policy.

---

## 6. Production checklist (short)

Align with **CRM settings → Pre-production checklist** card in the app, plus:

- Admin **`REACT_APP_API_URL`** points at the correct API; CRM hits **`/api/crm`** only.
- HTTPS everywhere; OAuth redirect URIs match production.
- Mongo backups and restore tested.
- RBAC tested: user with **only** `view_crm` cannot mutate or change field policies.
- Smoke: create contact → deal → WhatsApp activity → attach platform IDs → export.

---

## 7. Troubleshooting

| Symptom | Things to check |
|---------|-------------------|
| CRM pages empty or errors | Network tab: `/api/crm/*` status; API up; token valid; CORS allows admin origin. |
| “No integration” / Google errors | Backend `CRM_GOOGLE_*` and redirect URI; user completed OAuth; HTTPS. |
| Field policies not loading | User needs **`manage_crm`**; backend route for admin field policies must exist and allow the role. |
| Save contact/lead: “firstName, lastName, and email are required **(and must be writable)**” | Often **fixer-backend** used legacy `hasPermission` for the field matrix while routes used `checkPermission`, so **dashboard `admin` users** passed `manage_crm` on the route but still got a **read-only matrix** and all writes were stripped — fixed by aligning `canManageCrm` with `checkPermission`. Also ensure field-policy seeds allow writes where intended; fixer-admin **omits read-only identity fields on PUT** and extends policy matrices for platform ID fields. |
| Dev data not matching prod | Set **`REACT_APP_CRM_USE_API=true`** in `.env` so dev uses Mongo, not the local demo store. |

---

## 8. Future improvements (not in scope today)

Prioritize with product/engineering; order is suggestive only.

1. **WhatsApp Business Platform (BSP / Cloud API)** — Inbound/outbound messages, templates, assignment queues, SLA; requires Meta business verification and a BSP or direct Cloud API integration **on the backend**, not only admin UI.
2. **Click-to-chat deep links** — Pre-filled `wa.me` links from a contact row using sanitized phone numbers (still keep CRM logging as today).
3. **Automations** — Rules: e.g. new booking → update deal stage; WhatsApp activity → reminder task; optional n8n/Zapier-style webhooks from backend.
4. **Duplicate detection** — Merge flow for same phone/email across leads and contacts.
5. **Reporting** — Built-in charts (conversion by source, response time), or export to BI tools.
6. **Mobile-friendly CRM** — Responsive tweaks or a slim “field tech” view for phone.
7. **Audit log** — Who changed lifecycle/stage/IDs and when (server-side event store).
8. **SLA / reminders** — Due dates on activities with admin notifications (email/push) when overdue.
9. **Two-way Google sync** — Today’s scope is import/sync patterns from backend docs; expand only after legal/security sign-off.
10. **Partner pipeline** — Further separation of partner vs customer funnels if marketplace ops scale (types already lean home-services + B2B; may need dedicated views).

---

## 9. Key files (for developers)

| Area | Location |
|------|----------|
| API vs local mode | `src/services/api/crm.service.ts` (`isCrmApiMode`) |
| Niche enums, lead sources, activity types | `src/lib/crmNiche.ts` |
| Types | `src/types/crm.types.ts` |
| Contact save + field policy payload | `src/lib/crmContactUpsertPayload.ts` |
| Staff WhatsApp playbook UI | `src/components/crm/CrmWhatsAppStaffPlaybook.tsx` |
| Routes / RBAC | `src/config/rbac.config.ts`, `src/config/app-routes.ts` |
| Env template | `.env.example` |

---

## 10. Document ownership

- Update this file when **flags**, **routes**, or **ops workflow** change.
- Version in git with the feature that changed behaviour; share the path **`docs/CRM_TEAM_HANDOVER.md`** in onboarding and Slack/wiki.

---

*Last aligned with Fixer Admin CRM: Mongo API mode, WhatsApp lead source + activities + platform IDs workflow.*
