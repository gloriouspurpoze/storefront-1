# Storefront — Vercel deployment

Single Next.js app at `storefront/`. One Vercel project serves **every tenant**
via host-based routing (`middleware.ts` resolves `Host` → `tenantId` and
rewrites into `/sites/[tenantId]/...`).

You do **not** create a Vercel project per tenant. Each new tenant slug is live
the moment the tenant exists in MongoDB. Custom domains are attached
on-demand from the admin panel.

---

## 1. Prerequisites

- Vercel account (Pro recommended for wildcard domains + region pinning).
- Domain you control, e.g. `profixer.app`, with DNS at Cloudflare/Route53.
- Backend API publicly reachable at `https://api.profixer.app`.
- Razorpay account (Live keys + webhook secret).
- Cloudinary or S3 if you keep using the existing `/upload/image` endpoint.

## 2. First-time setup (5 min)

```bash
cd profixer-admin-frontend/storefront
npm i -g vercel             # if not installed
vercel login
vercel link                 # create or link the project
```

Choose:

- **Scope:** your team
- **Link to existing project?** No (first time)
- **Project name:** `profixer-storefront`
- **Root directory:** `./` (storefront)
- **Framework preset:** Next.js (auto-detected)

## 3. Environment variables

Add in **Vercel → Project → Settings → Environment Variables** (Production + Preview):

| Key | Value | Why |
|-----|-------|-----|
| `NEXT_PUBLIC_API_BASE_URL` | `https://api.profixer.app/api` | All public storefront API calls |
| `NEXT_PUBLIC_STOREFRONT_HOST_SUFFIXES` | `profixer.app` | Strip suffix to read tenant slug |
| `STOREFRONT_REVALIDATE_SECRET` | random 32-char string | Backend hits `/api/revalidate` with this |
| `STOREFRONT_PING_SITEMAP_HOSTS` | _(optional)_ `https://nozeperfume.com,https://thebrownbutter.com` | Auto-ping Google/Bing on content changes |
| `EDGE_CONFIG` | _(optional)_ Vercel edge config token | Sub-5 ms tenant lookup |
| `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` | _(optional)_ | Multi-region cache |

Set the same `STOREFRONT_REVALIDATE_SECRET` on the **backend** so it can call
`POST https://www.profixer.app/api/revalidate`.

## 4. Deploy

```bash
vercel --prod
```

Vercel auto-detects Next.js 15. Build should finish in ~60–90 s.

Connect the GitHub repo (Project → Settings → Git) so each push to `main`
re-deploys automatically. Add a deploy gate so PRs go to Preview only.

## 5. Domains

### Wildcard platform subdomain `*.profixer.app`

1. Vercel → Project → Domains → **Add** → `*.profixer.app`
2. Vercel asks you to add a TXT record proving ownership.
3. Add it at your DNS provider (Cloudflare etc.).
4. After verification Vercel issues a wildcard cert automatically.

DNS records you need at the registrar:

```
CNAME   *.profixer.app   →   cname.vercel-dns.com.
A       profixer.app     →   76.76.21.21        (Vercel's anycast IP — or redirect to marketing site)
TXT     _vercel          →   "vc-domain-verify=…"
```

Once active: every tenant slug (`nozeperfume`, `thebrownbutter`, …) resolves
at `https://<slug>.profixer.app` with no extra setup.

### Tenant custom domain (e.g. `nozeperfume.com`)

Triggered from **Admin → Organizations → Manage → Storefront Domains**.
The panel either:

1. **Vercel mode** (recommended): if `VERCEL_TOKEN`, `VERCEL_PROJECT_ID`,
   `VERCEL_TEAM_ID` are set on the backend, it auto-calls the Vercel Domains
   API. The tenant sees the exact DNS records to add. After they add them,
   click **Refresh**.
2. **Manual mode**: shows the CNAME (`cname.vercel-dns.com`) that the tenant
   needs to add. Once they confirm, you manually attach the domain in Vercel.

DNS at the tenant's registrar:

```
CNAME   nozeperfume.com    →   cname.vercel-dns.com.
TXT     _vercel            →   (challenge value from the panel)
```

Within a few minutes the panel shows the domain as **Verified** and the
backend's `resolvePublicTenantForHost` starts routing it to the correct
tenant.

## 6. Backend env additions (one-time)

Add these to the API server (`fixer-backend`):

```bash
# Existing — already set
STOREFRONT_HOST_SUFFIXES=profixer.app

# For Vercel custom domain automation
VERCEL_TOKEN=…                # https://vercel.com/account/tokens
VERCEL_PROJECT_ID=…           # Project → Settings → General → Project ID
VERCEL_TEAM_ID=…              # required if the project is under a team

# For AI copy
OPENAI_API_KEY=sk-…

# For storefront add-on billing
RAZORPAY_KEY_ID=rzp_live_…
RAZORPAY_KEY_SECRET=…
RAZORPAY_WEBHOOK_SECRET=…     # used by /api/public/storefront/addons/webhook

# Match the storefront's STOREFRONT_REVALIDATE_SECRET
STOREFRONT_REVALIDATE_SECRET=… (same as Vercel)
```

## 7. Razorpay webhook (add-on auto-grant)

In Razorpay Dashboard → Settings → **Webhooks** → Add:

- **URL:** `https://api.profixer.app/api/public/storefront/addons/webhook`
- **Active events:** `payment.captured`
- **Secret:** same value you set as `RAZORPAY_WEBHOOK_SECRET` on the API

This is the safety net. The normal flow is:

1. Tenant clicks **Buy ₹499** in Storefront Studio → Add-ons.
2. Admin frontend calls `POST /storefront-studio/addons/order` → Razorpay order.
3. Razorpay modal opens; user pays.
4. Admin frontend posts the signature to `/storefront-studio/addons/verify` →
   backend verifies + flips the flag immediately.
5. If the user closes the tab before step 4 lands, the webhook (`/addons/webhook`)
   still fires and grants the add-on with the same idempotent code path.

Either path also writes an entry to the `audit-log` collection:

- `storefront_addon.purchase` (verify path)
- `storefront_addon.purchase.webhook` (webhook path)
- `storefront_addon.grant_free` (super-admin manual grant)
- `storefront_addon.revoke`
- `storefront_config.update` (when `customHeadScripts`, `customBodyScripts`,
  `superAdminLocks`, or `themeKey` change)

## 8. SEO ping

Set `STOREFRONT_PING_SITEMAP_HOSTS` on the storefront Vercel project to the
list of fully-qualified tenant URLs you want Google/Bing to know about.
The `/api/revalidate` route (already called by the backend when content
changes) will fan-out `GET https://www.google.com/ping?sitemap=…` for each
host.

## 9. Validation after deploy

```bash
curl -I https://nozeperfume.profixer.app
curl https://nozeperfume.profixer.app/sitemap.xml
curl https://nozeperfume.profixer.app/robots.txt
curl -s https://api.profixer.app/api/public/storefront/config \
  -H "x-tenant-id: <TENANT_ID>" | jq .
```

Tenant isolation re-audit (run on the API host):

```bash
cd homeservice_monolotic/fixer-backend
npm run audit:tenant-isolation:strict
```

## 10. Self-hosted alternative

If you cannot use Vercel, run `next start` behind nginx with a wildcard cert:

```bash
cd storefront
npm ci && npm run build
PORT=3001 npm run start
```

```nginx
server {
  listen 443 ssl http2;
  server_name *.profixer.app profixer.app;
  ssl_certificate     /etc/letsencrypt/live/profixer.app/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/profixer.app/privkey.pem;
  location / {
    proxy_pass http://127.0.0.1:3001;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Forwarded-For $remote_addr;
  }
}
```

```bash
sudo certbot certonly --dns-cloudflare \
  -d 'profixer.app' -d '*.profixer.app'
```

Everything else (env vars, Razorpay webhook URL, SEO ping) works identically.
