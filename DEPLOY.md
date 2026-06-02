# Storefront — Production Deploy Checklist

One-page version. For the long-form explanation see
[`docs/saas/10-storefront-deploy-vercel.md`](../docs/saas/10-storefront-deploy-vercel.md).

The storefront is a **separate Vercel project** from `fixer-admin`. One
project serves *every* tenant via host-based routing; you never create a new
Vercel project when you onboard a tenant.

---

## TL;DR

```bash
# from repo root
npm run storefront:link        # one-time: link to a Vercel project
npm run storefront:deploy      # ship to production
```

That's it once env vars + DNS are in place. The sections below walk through
the one-time setup.

---

## 0. Decide the wildcard hostname

Pick a sub-domain of a domain you already control. Examples:

| You own | Use |
|---|---|
| `profixer.in` | `*.shop.profixer.in` |
| `profixer.app` | `*.profixer.app` |
| `acme.com` | `*.store.acme.com` |

Tenants land at `<slug>.shop.profixer.in` automatically. Per-tenant custom
domains (e.g. `nozeperfume.com`) get attached from the admin UI later.

---

## 1. Link the storefront to a Vercel project (once)

```bash
cd <repo root>
npm run storefront:link
```

Answer:
- **Scope** — same team as fixer-admin
- **Link to existing project?** No
- **Project name** — `profixer-storefront`
- **Directory** — `./` (you're already inside `storefront/`)
- **Framework** — Next.js (auto-detected)

This writes `storefront/.vercel/` (gitignored).

---

## 2. Add env vars in Vercel

Project → Settings → Environment Variables — set these for **Production + Preview**:

| Key | Value |
|---|---|
| `NEXT_PUBLIC_API_BASE_URL` | `https://api.<your-domain>/api` |
| `NEXT_PUBLIC_STOREFRONT_HOST_SUFFIXES` | the wildcard suffix from step 0, e.g. `shop.profixer.in` |
| `STOREFRONT_REVALIDATE_SECRET` | `openssl rand -hex 32` |

Optional: `EDGE_CONFIG`, `UPSTASH_REDIS_REST_*`, `STOREFRONT_PING_SITEMAP_HOSTS`.

---

## 3. Deploy

```bash
npm run storefront:deploy
```

Build takes 60–90 s. First deploy returns a `profixer-storefront-xxx.vercel.app`
URL. Visiting it shows `/unknown-host` — that's correct, the Host header has no
tenant slug yet. We fix that with DNS in the next step.

---

## 4. Wildcard DNS

Vercel → `profixer-storefront` → Domains → **Add** → `*.shop.profixer.in`
(use your actual suffix). Vercel will print a TXT challenge.

At your DNS provider:

```
CNAME   *.shop.profixer.in   →   cname.vercel-dns.com.
TXT     _vercel.shop         →   "vc-domain-verify=…"   (value from Vercel)
```

Wait ~2 min, click **Refresh** on Vercel. The wildcard cert provisions
automatically.

---

## 5. Backend env (one-time)

Add to `fixer-backend` env on whichever host runs the API:

```bash
STOREFRONT_HOST_SUFFIXES=shop.profixer.in
STOREFRONT_REVALIDATE_SECRET=<same value you set on Vercel>

# Optional but recommended — lets the admin UI auto-attach tenant custom
# domains without logging into Vercel each time.
VERCEL_TOKEN=          # https://vercel.com/account/tokens
VERCEL_PROJECT_ID=     # Vercel → Project → Settings → General → Project ID
VERCEL_TEAM_ID=        # if the project is under a team
```

Restart the API.

---

## 6. Hook up auto-deploys

Vercel → `profixer-storefront` → Settings → Git → Connect repo, then set:

- **Root directory:** `storefront`
- **Production branch:** `main` (or your default)
- **Ignored build step:** `git diff --quiet HEAD^ HEAD ./storefront` (only
  redeploy when files inside `storefront/` change)

Every push to `main` now redeploys, and PRs get preview URLs.

---

## 7. Verify

Pick an existing tenant slug from MongoDB, then:

```bash
curl -I https://<slug>.shop.profixer.in
curl  https://<slug>.shop.profixer.in/sitemap.xml
curl  https://<slug>.shop.profixer.in/robots.txt

# API still returning the tenant's public config?
curl -s "https://api.<your-domain>/api/public/storefront/config" \
  -H "x-tenant-id: <TENANT_ID>" | jq .
```

`<slug>.shop.profixer.in` should render that tenant's storefront. If it shows
`/unknown-host`, double-check `NEXT_PUBLIC_STOREFRONT_HOST_SUFFIXES` matches
what's in the URL and that the tenant slug exists in the DB.

---

## 8. Adding a tenant's custom domain (e.g. `nozeperfume.com`)

Triggered from **Admin → Organizations → Manage → Storefront Domains**.

- **Vercel mode (recommended):** if `VERCEL_TOKEN/PROJECT_ID/TEAM_ID` are set on
  the backend, the panel calls the Vercel Domains API. The tenant just adds
  the DNS records shown in the panel and clicks **Refresh**.
- **Manual mode:** the panel shows the `cname.vercel-dns.com` record the
  tenant must add; you then attach the domain manually in Vercel.

At the tenant's registrar:

```
CNAME   nozeperfume.com    →   cname.vercel-dns.com.
TXT     _vercel            →   (challenge from the panel)
```

---

## Local convenience scripts (from repo root)

```bash
npm run storefront:install        # install storefront deps
npm run storefront:dev            # next dev -p 3001
npm run storefront:build          # next build
npm run storefront:start          # next start -p 3001
npm run storefront:typecheck      # tsc --noEmit
npm run storefront:lint           # next lint

npm run storefront:link           # one-time vercel link
npm run storefront:deploy:preview # vercel (preview build)
npm run storefront:deploy         # vercel --prod
```
