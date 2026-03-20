# Example blog seeds

Three sample posts (HTML content, SEO fields, internal links between posts) for testing **Blog Management** and the **blog editor** at `/cms/blogs`.

## What gets created

| Slug | Status | Notes |
|------|--------|--------|
| `seed-home-maintenance-checklist` | published | Featured; longest article; links to the other two |
| `seed-when-to-hire-a-plumber` | published | Plumbing / DIY |
| `seed-hvac-seasonal-care` | draft | HVAC seasonal tips |

Source: `scripts/blog-seed-posts.mjs`  
Runner: `scripts/seed-example-blogs.mjs`

## Run the seed (requires backend + JWT)

1. Start **fixer-backend** (default API `http://localhost:5000/api`).
2. Log into **fixer-admin**, then copy your JWT from **localStorage** key `token`.
3. From the **fixer-admin** repo root:

```bash
SEED_AUTH_TOKEN="paste_your_jwt_here" npm run seed:blogs
```

Optional API override:

```bash
SEED_API_URL="http://localhost:5000/api" SEED_AUTH_TOKEN="..." npm run seed:blogs
```

## Re-running

- If the API returns a duplicate slug error, that post is skipped or logged; adjust slugs in `blog-seed-posts.mjs` if you need fresh copies.
- Safe to edit posts afterward in `/cms/blogs`.

## Backend alternative

If you prefer seeds inside **fixer-backend**, copy the objects from `scripts/blog-seed-posts.mjs` into a `seed-blogs.ts` script there and insert via your Blog model—same fields as the admin `POST /cms/admin/blogs` body (plus `settings`, `scheduledFor` as your API expects).
