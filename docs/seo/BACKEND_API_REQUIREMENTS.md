# Backend API requirements — SEO CMS (admin → consumer)

The admin panel now sends fields the consumer site expects. The Mongo/API backend must accept and persist them (schemaless JSON is fine).

## 1. `GET/PUT /api/cms/admin/static-content/pricing-category-meta`

**New.** Mirror `rate-card` and `category-marketing`.

```json
{
  "ac-repair": {
    "categorySlug": "ac-repair",
    "displayName": "AC repair",
    "metaTitle": "...",
    "metaDescription": "...",
    "priceFrom": 499,
    "priceTo": 12000,
    "heroIntro": "...",
    "answerEngineSummary": "...",
    "rateCardCommentary": "...",
    "mumbaiContext": "...",
    "comparisonNarrative": "...",
    "callToActionParagraph": "...",
    "faq": [{ "question": "...", "answer": "..." }],
    "rateCardRows": [
      { "service": "...", "profixer": "₹...", "others": "₹...", "note": "..." }
    ],
    "structuredData": { "schemaPrimaryType": "Service", "knowsAbout": ["..."] },
    "isIndexable": true
  }
}
```

**Public read** (consumer Next.js):

`GET /api/cms/static-content/pricing-category-meta` — same shape, no auth.

## 2. `service-catalog-localities` — extended body

Existing routes; allow optional fields on create/update:

| Field | Type |
|-------|------|
| `parentCity` | string |
| `neighborhoods` | string[] |
| `societies` | string[] |
| `infrastructureFacts` | string[] |
| `isIndexable` | boolean |
| `qualitySignals` | object (see admin `LocalityQualitySignals`) |

Return these on `GET /cms/admin/service-catalog-localities` and `GET /cms/service-catalog-localities` (public list may omit `qualitySignals` if you prefer).

## 3. Blog posts — `index` flag

Accept on create/update:

- Top-level: `index: boolean`
- Nested: `seo.index: boolean`

When `index === false`, consumer excludes post from `/sitemaps/blog.xml`.

## Deploy checklist

1. Add static-content key `pricing-category-meta` in CMS storage (same blob store as rate-card).
2. Extend locality Mongoose schema or use `$set` on nested paths without strict validation.
3. Deploy API before editors save from admin (404 is handled gracefully in admin UI until live).
