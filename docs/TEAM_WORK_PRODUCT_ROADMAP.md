# Team work (internal tasks) — product & engineering roadmap

This document describes the **current** team-work capability (fixer-admin + fixer-backend), then proposes a **structured path toward Jira-class depth**: sprints/milestones, workflow per team, subtasks, attachments, and webhooks — without collapsing everything into a single bloated document.

**Audience:** product, engineering, and ops leads implementing or prioritizing internal work management.

---

## 1. What exists today (baseline)

### 1.1 Backend (`fixer-backend`)

| Area | Detail |
|------|--------|
| **Base path** | `/api/team-work` (mounted from `src/routes/index.ts`) |
| **Auth** | All routes require `authenticateToken` |
| **RBAC** | `view_team_tasks` (read, list, comments), `manage_team_tasks` (create/update/delete/status). Keys are aligned with `dashboardRolePermissions.ts` for admin JWT flows. |
| **Tenanting** | Same pattern as CRM: `crmTenantMongoFilter` / `attachTenantForCreate` so org-scoped JWTs only see their tenant’s rows. |
| **Models** | `TeamWorkItem` (work + embedded `comments[]`), `TeamWorkItemCounter` (monotonic `issueKey`, e.g. `PF-1`). |
| **Statuses** | Fixed enum: `backlog`, `todo`, `in_progress`, `in_review`, `blocked`, `done`, `cancelled`. |
| **Issue types** | `task`, `bug`, `story`, `epic` (`epicId` links a row to an epic work item). |
| **Routes** | `GET /meta`, `GET /items`, `GET /items/:id`, `POST /items`, `PUT /items/:id`, `PATCH /items/:id/status`, `DELETE /items/:id`, `POST /items/:id/comments`. |

Optional environment variable:

- **`TEAM_WORK_PROJECT_KEY`** — prefix for issue keys (default `PF`).

### 1.2 Admin (`fixer-admin`)

| Area | Detail |
|------|--------|
| **UI path** | `/team-work` |
| **Navigation** | Sidebar → Operations → **Team work**; command palette via `QUICK_NAV_ITEMS`. |
| **RBAC** | `view_team_tasks` / `manage_team_tasks` on `Permission`, `rolePermissionsMap`, `routePermissions`. |
| **Features** | KPI strip, search + assignee + “My work”, Kanban board (`@dnd-kit`), list table, create dialog, detail drawer (edit + comments). |

### 1.3 Known integration constraints

- **`GET /api/users/all`** uses `validatePagination`: **`limit` ≤ 100**. The team-work hub loads admins with `limit: 100`; paging is required if assignee lists exceed 100.
- **List payload**: list endpoint may omit heavy fields (e.g. comments stripped for list) for performance; detail endpoint returns full item.

---

## 2. Design principles (how to grow without regret)

1. **`TeamWorkItem` stays the spine of “a unit of work”** — title, assignee, status, priority, type, dates, parent/sprint links. Do not store binary blobs or arbitrary webhook payloads on the item.
2. **New concepts get their own collections** when they have their own lifecycle or cardinality (sprints, files, webhook subscriptions, delivery queue).
3. **Prefer pointers over embedding** for large or growing lists (`subtasks[]`, `attachments[]` on the parent document scale poorly and complicate partial updates).
4. **Tenant + `teamKey` are the primary partition keys** for reporting, permissions, and UI scope (future: “project” can map 1:1 to `teamKey` or sit above it).
5. **Integrations (webhooks) are async** — never block the HTTP request that updated an issue on outbound HTTP to subscribers.

---

## 3. Feature areas — detailed proposals

### 3.1 Sprints and milestones

**Problem today:** Everything is effectively one backlog; there is no time-boxed plan or sprint boundary.

**Recommendation**

- Introduce **`TeamSprint`** (name up to you: `TeamSprint`, `WorkSprint`, `Milestone`).

**Suggested fields**

| Field | Purpose |
|-------|---------|
| `tenantId` | Same as other team-work entities |
| `teamKey` | Which queue/project this sprint belongs to |
| `name` | e.g. “2026.05 Ops” |
| `goal` | Short text (optional) |
| `startAt` / `endAt` | Planning window |
| `state` | `planned` \| `active` \| `closed` (or align with Jira: future/active/closed) |
| `createdAt` / `updatedAt` | Audit |

**`TeamWorkItem` extension**

- `sprintId?: ObjectId` — nullable means **backlog** (or use explicit `backlog` virtual sprint; nullable is simpler).
- Optional: `sprintCommitted: boolean` — “in scope vs stretch” if you need it without custom fields.

**Indexes**

- `{ tenantId: 1, teamKey: 1, state: 1, endAt: -1 }` — active sprint lookup
- `{ tenantId: 1, teamKey: 1, sprintId: 1, status: 1 }` — board per sprint

**API sketch**

- `GET/POST/PUT/DELETE /api/team-work/sprints` (scoped by `teamKey`)
- `GET /api/team-work/items?sprintId=…` and/or `backlog=true`
- Optional: `POST /api/team-work/sprints/:id/close` — bulk rules (move unfinished items to backlog or next sprint — product decision)

**Admin UI**

- Sprint switcher (active sprint + backlog)
- Board and list filtered by sprint
- Simple burndown: optional phase-2 chart from `storyPoints` + status transitions

---

### 3.2 Workflow per `teamKey`

**Problem today:** Status enum is global for all `teamKey` values.

**Recommendation — two phases**

**Phase A (high value, low complexity)**

- Collection **`TeamWorkflow`** (or config document keyed by `{ tenantId, teamKey }`):
  - `statuses: string[]` — ordered columns
  - `initialStatus: string`
  - `terminalStatuses: string[]` — e.g. `done`, `cancelled`
  - Optional: `transitions: Record<string, string[]>` — from-status → allowed to-statuses; empty means “any transition allowed for `manage_team_tasks`”

**Phase B**

- Per-status **validators**: require `resolution` when entering `done`, require `blockedReason` when entering `blocked`
- **Role-based transitions** (e.g. only leads can move to `in_review`) — maps to RBAC keys or a small `requiredPermission` string per transition

**Schema impact on `TeamWorkItem`**

- Replace strict Mongoose `enum` on `status` with **string + application validation** against the workflow for that `teamKey`, **or** keep a global superset enum and restrict UI per workflow (simpler for Mongo but less flexible).

**API sketch**

- `GET /api/team-work/workflows/:teamKey`
- `PUT /api/team-work/workflows/:teamKey` — `manage_team_tasks` or a narrower `manage_team_workflow` later

**Admin UI**

- Settings tab per team: reorder columns, add/rename statuses (with migration warnings if issues use removed statuses)

---

### 3.3 Subtasks

**Problem today:** `epicId` links to an epic; there is no first-class parent for arbitrary breakdown (task → subtasks).

**Recommendation**

- Add **`parentId?: ObjectId`** referencing `TeamWorkItem` (same collection).
- Extend **`issueType`** with **`subtask`** (Jira alignment). Rule: `issueType === 'subtask'` ⇒ `parentId` required; parent must not be a subtask (max depth 1 unless you explicitly want trees).

**Avoid**

- Embedding `subtasks: [{ id, title }]` on the parent — unbounded growth and painful sync.

**Indexes**

- `{ tenantId: 1, parentId: 1, status: 1 }`
- Guard against cycles in service layer (parent chain walk).

**API / UI**

- `GET /api/team-work/items/:id/subtasks` or include `childCount` / `openChildCount` in list projection via aggregation (performance consideration).
- Drawer: nested list + “Add subtask”
- Optional rollup: block parent transition to `done` until children resolved (configurable per `teamKey`)

---

### 3.4 Attachments

**Problem today:** No files on issues.

**Recommendation**

- New collection **`TeamWorkAttachment`** (metadata only):

| Field | Purpose |
|-------|---------|
| `workItemId` | FK to `TeamWorkItem` |
| `uploadedBy` | User id |
| `filename` | Original name |
| `mimeType`, `sizeBytes` | Validation / UI |
| `storageProvider` | `s3` \| `cloudinary` \| `local` — match existing platform patterns |
| `url` or `storageKey` | Prefer signed URLs or private key + short-lived signed GET |
| `createdAt` | Audit |

**Flow**

- `POST /api/team-work/items/:id/attachments` — multipart or presigned URL pattern consistent with `/api/upload` / chat uploads.
- Enforce **max size**, **allowed MIME types**, optional **async virus scan** before marking `ready`.

**Do not** store file bytes in MongoDB.

---

### 3.5 Webhooks

**Problem today:** External systems cannot react to issue changes.

**Recommendation**

- **`TeamWorkWebhook`**: `url`, `secret` (HMAC), `teamKey` (or all teams), `events[]`, `enabled`, `failureCount`, `lastSuccessAt`
- **`WebhookDelivery`** (or generic outbox): `event`, `payload` (JSON), `status` (`pending` \| `delivered` \| `failed`), `attempts`, `nextRetryAt`, `idempotencyKey`

**Events (starter set)**

- `issue.created`, `issue.updated`, `issue.deleted`
- `issue.transitioned` (include `from`, `to`)
- `comment.created`

**Processing**

- Write path enqueues delivery rows; **worker** (cron, queue consumer, or lightweight setInterval in API only for dev) POSTs to subscriber with `X-Signature: sha256=…` of raw body.
- Exponential backoff, max attempts, disable webhook after sustained failure (with admin notification later).

**Payload contract**

- Version field `payloadVersion: 1` and stable `issue` object shape so integrators don’t break on every UI tweak.

---

## 4. Board ordering (production note)

Today **`boardRank`** is incremented per column; under concurrency, collisions and “jumping” cards are possible.

**Better long term**

- **Fractional rank** (LexoRank / string between neighbors) or
- **Explicit reorder endpoint** `PATCH /items/reorder` with server-side transaction

Document the chosen strategy when you implement multi-user drag-and-drop at scale.

---

## 5. Phased roadmap (suggested)

### Phase 1 — Structure & clarity (2–4 weeks eng, depending on depth)

| Deliverable | Acceptance criteria |
|-------------|---------------------|
| **Subtasks** | `parentId` + `subtask` type; drawer lists children; create subtask from parent; list filter `parentId` |
| **Epic rollup (light)** | Optional counts on epic row: open children / story points sum |

### Phase 2 — Planning (sprints)

| Deliverable | Acceptance criteria |
|-------------|---------------------|
| **Sprint CRUD** | Create/close sprint; assign item to sprint or backlog |
| **Board/List by sprint** | Global sprint switcher; URL query `?sprintId=` shareable |

### Phase 3 — Files

| Deliverable | Acceptance criteria |
|-------------|---------------------|
| **Attachments** | Upload, list, delete; permission aligned with `manage_team_tasks` or narrower `attach_team_files` |

### Phase 4 — Workflow config

| Deliverable | Acceptance criteria |
|-------------|---------------------|
| **Per-`teamKey` statuses** | Admin can define columns; existing items migrated or mapped |
| **Optional transition rules** | Documented; default remains permissive |

### Phase 5 — Integrations

| Deliverable | Acceptance criteria |
|-------------|---------------------|
| **Webhooks + outbox** | At least one end-to-end subscriber (e.g. Slack incoming webhook or internal test URL); retries observable |

---

## 6. Explicit non-goals (defer until proven need)

- Full **custom fields** engine (select/cascade/user-picker formulas) — very high complexity.
- **Advanced permission schemes per project** — start with `teamKey` + existing RBAC.
- **Real-time presence** on the board — polish, not MVP for internal ops.
- **Email ingest** (“reply by email creates comment”) — mail infra and abuse handling.

---

## 7. Security & compliance checklist (any iteration)

- [ ] All new routes behind `authenticateToken` + appropriate `requirePermission`
- [ ] Tenant filter on every query/mutation for org-scoped users
- [ ] Webhook URLs restricted to **HTTPS** in production; optional allowlist
- [ ] Attachment scanning / size limits; no execution of uploaded content from same origin as admin app
- [ ] Audit trail (optional collection `TeamWorkAuditLog`: who changed what, when) before regulated customers

---

## 8. File reference (implementation today)

| Repo | Path |
|------|------|
| Backend model | `fixer-backend/src/models/TeamWorkItem.ts` |
| Backend routes | `fixer-backend/src/modules/team-work/routes/teamWork.ts` |
| Backend service | `fixer-backend/src/modules/team-work/services/TeamWorkItemService.ts` |
| RBAC defaults | `fixer-backend/src/core/rbac/dashboardRolePermissions.ts` |
| Admin page | `fixer-admin/src/pages/team-work/team-work-hub.tsx` |
| Admin API client | `fixer-admin/src/services/api/teamWork.api.ts` |
| Types | `fixer-admin/src/types/teamWork.types.ts` |

---

## 9. Revision history

| Date | Author | Notes |
|------|--------|-------|
| 2026-05-04 | Engineering | Initial roadmap after v1 team-work ship |

When you implement a phase, append a short row here and link the PR or ticket id.
