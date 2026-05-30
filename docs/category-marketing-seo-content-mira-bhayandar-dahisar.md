# Category marketing — **all sections**: SEO prompts & sample content

**CMS:** `http://localhost:3000/cms/category-marketing`  
**Schema:** `CategoryMarketingConfig` in `src/types/categoryMarketing.ts` (keys must match your `cmsAdminContract` / API).



**Categories:** Electrician · **Plumber**  
**Localities:** **Mira Road** · **Mira Bhayandar** · **Dahisar**

> Replace `YOUR_BRAND`, phone numbers, URLs, addresses, lat/lng, GBP links, and OG image URLs with **real** values. Do not ship fake NAP or ratings.

---

## 1. Every CMS section (field map)

Copy maps **admin UI areas** → **config keys**. Arrays show **one row’s shape**.

### 1.1 Core SEO & hero

| Field | Type | Notes |
|--------|------|--------|
| `seoTitle` | string | ≤60 chars where possible; service + locality + brand |
| `metaDescription` | string | ≤160 chars; CTA + trust |
| `urlSlugPattern` | string | Consumer builds URLs; e.g. `/services/electrician/[locality]` |
| `primaryKeyword` | string | Main target phrase |
| `secondaryKeywords` | string[] | 5–15 variants |
| `heroTrustBadge` | string | Short pill (e.g. “Verified electricians”) |
| `heroChip` | string | Secondary chip (e.g. “Same-day slots”) |
| `heroProofPoints` | string[] | 3–5 ultra-short proof lines |
| `topicChips` | string[] | 4–8 intent chips |
| `mainHeading` | string | Visible H1-style hero heading |
| `intro` | string | 2–4 sentences HTML or plain (match your renderer) |
| `introLeadMagnetLabel` | string | CTA label (e.g. “Download safety checklist”) |
| `introLeadMagnetUrl` | string | Absolute or site path to PDF/landing |
| `image1` | string? | Hero / section image URL |
| `image2` | string? | Secondary image URL |

### 1.2 Service cards (`serviceCards[]`)

| Key | Notes |
|-----|--------|
| `title` | SKU-style name |
| `description` | 1–2 lines |
| `price` | “From ₹…” or “Quote after inspection” |
| `rating` | Only if **real** aggregate visible on site |
| `duration` | e.g. “60–90 mins visit” |
| `warranty` | Policy wording |
| `bookUrl` | Path or full URL to book |

### 1.3 Service types (`serviceTypes[]`)

| Key | Notes |
|-----|--------|
| `title` | Cluster name (e.g. “DB & MCB”) |
| `description` | Short para |
| `bullets` | string[] |

### 1.4 Trust & ways

| Field | Type |
|--------|------|
| `trustBenefits[]` | `{ heading, body }` |
| `waysHeading` | string |
| `waysBullets` | string[] |
| `experienceIncluded` | string[] |

### 1.5 Areas & booking

| Field | Type |
|--------|------|
| `areasList` | string[] |
| `areasCta` | string |
| `areasCopy` | string |
| `bookingSteps[]` | `{ stepNumber, title, description }` |
| `contactPhone` | string |
| `contactWhatsapp` | string (digits, no spaces, country code) |

### 1.6 Pricing & parts

| Field | Type |
|--------|------|
| `spareParts[]` | `{ name, priceRange }` |
| `pricingIncluded` | string[] |
| `pricingExcluded` | string[] |
| `comparisonRows[]` | `{ label, profixer, others }` — note key **`profixer`** |

### 1.7 FAQs, links, closing

| Field | Type |
|--------|------|
| `faqs[]` | `{ question, answer }` |
| `relatedLinks[]` | `{ label, url }` |
| `closingParagraph` | string |
| `leadMagnet` | `{ headline, description, ctaLabel }` |
| `jsonLdExtra` | string | Optional raw JSON-LD **or** internal notes |

### 1.8 Locality guide (`localityGuide`)

| Field | Type |
|--------|------|
| `enabled` | boolean |
| `expandDetailsByDefault` | boolean |
| `articleH2` | string |
| `leadParagraphs` | string[] |
| `sections[]` | `{ h2, paragraphs[] }` |
| `summaryLead` | string |
| `takeaways` | string[] |
| `jsonLdBrandServiceName` | string |
| `useFaqsForSchema` | boolean |
| `showInboundLinkStrip` | boolean |
| `showBookingCtaStrip` | boolean |

### 1.9 Local SEO (`localSeo`)

| Field | Type |
|--------|------|
| `enableLocalBusinessSchema` | boolean |
| `localProfileName` | string |
| `serviceAreaHeadline` | Supports `[City]`, `[Location]`, `[ServiceName]` |
| `serviceAreaPlaceNames` | string[] |
| `serviceAreaNarrative` | string |
| `localIntentKeywords` | string[] |
| `openingHoursSummary` | string |
| `googleBusinessProfileUrl` | string |
| `sameAsUrls` | string[] |
| `streetAddress`, `addressLocality`, `addressRegion`, `postalCode`, `addressCountryCode` | strings |
| `geoLatLng` | `"lat,lng"` |
| `priceRange` | e.g. `₹₹` |
| `ogImageOverride` | absolute image URL for this locality |

### 1.10 Technical SEO (`technicalSeo`)

| Field | Type |
|--------|------|
| `canonicalUrl` | absolute |
| `ogTitle`, `ogDescription`, `ogImageAlt`, `ogType` | strings |
| `twitterCard` | `summary` \| `summary_large_image` \| `""` |
| `twitterSite`, `twitterCreator` | without `@` |
| `robotsMeta` | e.g. `index, follow, max-image-preview:large` |
| `hreflangAlternates[]` | `{ hreflang, href }` |
| `knowsAbout[]` | topics / Wikidata URLs |
| `schemaPrimaryType` | e.g. `HomeAndConstructionBusiness` |
| `enableHowToSchema`, `enableBreadcrumbSchema`, `enableWebPageSchema`, `enableServiceOfferSchema` | boolean |
| `breadcrumbItems[]` | `{ name, url }` absolute URLs |
| `speakableSelectors[]` | CSS selectors |
| `answerEngineSummary` | answer-first blurb |
| `contentModifiedDate` | `YYYY-MM-DD` |
| `aggregateRating` | `{ ratingValue, reviewCount }` — **only if real** |
| `videoEmbedUrls` | string[] |

---

## 2. Mega-prompt for any AI (outputs **all sections**)

Paste and replace `BRAND`, `DOMAIN`, `CATEGORY_KEY`, `LOCALITY`, `CITY`.

```text
You are an expert SEO + conversion copywriter for Indian home services (BRAND).

OUTPUT ONE JSON OBJECT named `categoryMarketing` that matches this TypeScript shape (all keys present; use "" or [] or false where unknown; never invent ratings):

CategoryMarketingConfig {
  seoTitle, metaDescription, urlSlugPattern, primaryKeyword, secondaryKeywords[],
  heroTrustBadge, heroChip, heroProofPoints[], topicChips[],
  mainHeading, intro, introLeadMagnetLabel, introLeadMagnetUrl, image1, image2,
  serviceCards: { title, description, price, rating, duration, warranty, bookUrl }[],
  serviceTypes: { title, description, bullets[] }[],
  trustBenefits: { heading, body }[],
  waysHeading, waysBullets[],
  experienceIncluded[],
  areasList[], areasCta, areasCopy,
  bookingSteps: { stepNumber, title, description }[],
  contactPhone, contactWhatsapp,
  spareParts: { name, priceRange }[],
  pricingIncluded[], pricingExcluded[],
  comparisonRows: { label, profixer, others }[],
  faqs: { question, answer }[],
  relatedLinks: { label, url }[],
  closingParagraph,
  leadMagnet: { headline, description, ctaLabel },
  jsonLdExtra: string,
  localityGuide: {
    enabled, expandDetailsByDefault, articleH2, leadParagraphs[],
    sections: { h2, paragraphs[] }[], summaryLead, takeaways[],
    jsonLdBrandServiceName, useFaqsForSchema, showInboundLinkStrip, showBookingCtaStrip
  },
  localSeo: {
    enableLocalBusinessSchema, localProfileName, serviceAreaHeadline, serviceAreaPlaceNames[],
    serviceAreaNarrative, localIntentKeywords[], openingHoursSummary,
    googleBusinessProfileUrl, sameAsUrls[], streetAddress, addressLocality, addressRegion,
    postalCode, addressCountryCode, geoLatLng, priceRange, ogImageOverride
  },
  technicalSeo: {
    canonicalUrl, ogTitle, ogDescription, ogImageAlt, ogType, twitterCard, twitterSite, twitterCreator,
    robotsMeta, hreflangAlternates[], knowsAbout[], schemaPrimaryType,
    enableHowToSchema, enableBreadcrumbSchema, breadcrumbItems[], speakableSelectors[],
    answerEngineSummary, contentModifiedDate,
    aggregateRating: { ratingValue, reviewCount }, videoEmbedUrls[],
    enableWebPageSchema, enableServiceOfferSchema
  }
}

INPUT
- CATEGORY_KEY: (electrician|plumber)
- LOCALITY: (Mira Road|Mira Bhayandar|Dahisar)
- CITY: Mumbai / MMR
- DOMAIN: https://www.example.com (no trailing slash)
- BOOK_PATH: /book or /services/book (your real flow)

RULES
1) seoTitle ≤60 chars; metaDescription ≤160 chars (count).
2) Use British/Indian English; no “#1 in India”; no fake reviews — if no public rating, serviceCards[].rating = "".
3) Prices: use “From ₹…” or “Quote after inspection”; align spareParts priceRange with policy.
4) localityGuide.enabled = true for locality keys; unique narrative vs other localities.
5) technicalSeo.canonicalUrl = DOMAIN + real canonical path for this landing.
6) relatedLinks / breadcrumbItems: only DOMAIN paths you know exist; else use plausible /services/... slugs and label clearly as placeholders.
7) comparisonRows.profixer (exact spelling) = BRAND column; others = generic “typical marketplaces”.
8) contactPhone / WhatsApp: leave "" if not provided — do NOT invent.
9) jsonLdExtra: either "" or a SHORT note like "Generate Service + FAQPage from structured fields".

Return JSON only, no markdown fences.
```

---

## 3. Model-specific shortcuts

- **ChatGPT:** “After JSON, add a second object `charCounts` with lengths of seoTitle and metaDescription.”
- **Claude:** “Prefer concrete MMR examples; vary diction vs other localities.”
- **Gemini:** “Validate all URLs are absolute where required.”

---

## 4. Full pack — **Electrician · Mira Bhayandar** (`electrician__mira-bhayandar`)

Use as **paste reference** into CMS fields (trim phones/URLs).

### 4.1 Core SEO & hero

- **seoTitle:** `Electrician in Mira Bhayandar | DB, Wiring & Safe Installs`
- **metaDescription:** `Book verified electricians in Mira Bhayandar for MCB trips, DB checks, lighting & AC points—clear estimates, tidy work, workmanship warranty as per policy. Book online on YOUR_BRAND.`
- **urlSlugPattern:** `/services/electrician/mira-bhayandar`
- **primaryKeyword:** `electrician in Mira Bhayandar`
- **secondaryKeywords:**  
  `["electrician Mira Bhayandar","MCB repair Mira Bhayandar","DB upgrade Bhayandar","home wiring check","earthing test Mira Bhayandar","fan installation near me","LED installation Mira Bhayandar","AC point wiring","emergency electrician Mira Bhayandar"]`
- **heroTrustBadge:** `Verified electricians · Inspection-first quotes`
- **heroChip:** `Mira Bhayandar & Bhayandar East/West`
- **heroProofPoints:**  
  `["DB & MCB fault tracing","Neat routing in false ceilings","Society-time friendly slots","Photo notes for hidden work"]`
- **topicChips:**  
  `["MCB tripping","Partial power loss","DB upgrade","Lights & fans","AC point","Earthing check"]`
- **mainHeading:** `Electrician services in Mira Bhayandar`
- **intro:** `Homes in Mira Bhayandar often run higher AC load and older DBs together—so warm breakers and neutral issues show up fast. We inspect first, explain what’s unsafe, then fix with clear scope. From point repairs to planned DB upgrades, you get disciplined workmanship and transparent spare billing.`
- **introLeadMagnetLabel:** `Download: home electrical safety checklist`
- **introLeadMagnetUrl:** `https://YOUR_DOMAIN/downloads/electrical-safety-checklist-mira-bhayandar.pdf`
- **image1:** `https://YOUR_DOMAIN/cms/electrician-mira-bhayandar-hero.jpg`
- **image2:** `https://YOUR_DOMAIN/cms/electrician-db-mcb-detail.jpg`

### 4.2 `serviceCards` (3 cards)

1. **MCB tripping & DB fault** — `Tripping breaker, burning smell, or one room dead? We trace faults and replace failed accessories with load-safe sizing.` — price: `From ₹299 visit + parts` — rating: `` — duration: `60–120 mins` — warranty: `Workmanship warranty as per policy` — bookUrl: `https://YOUR_DOMAIN/book?service=electrician&type=mcb`
2. **Lights, fans & fixtures** — `Installations and replacements with alignment, anchors, and safe terminations—ideal after interior upgrades.` — `From ₹199 per point (indicative)` — `` — `45–90 mins` — same warranty — `https://YOUR_DOMAIN/book?service=electrician&type=lights`
3. **AC point & heavy load** — `16A line checks before new AC installs; we validate DB capacity and society norms before routing.` — `Quote after inspection` — `` — `90–180 mins` — same — `https://YOUR_DOMAIN/book?service=electrician&type=ac-point`

### 4.3 `serviceTypes` (2 blocks)

**A. DB & MCB** — `Distribution boards age with humidity and load creep. We map circuits, label breakers, and recommend upgrades only when needed.` — bullets:  
`["Trip trace & accessory replacement","Loose neutral / terminal heat checks","DB balancing for new AC","Documentation photos on request"]`

**B. Lighting & routing** — `False-ceiling LED profiles, dimmers, and gallery lighting—planned cuts and dust control where possible.` — bullets:  
`["LED / profile installs","Smart switch compatibility checks","Chandelier support as per ceiling","Minimal rework policy"]`

### 4.4 `trustBenefits` (3)

1. **Verified & insured partners** — `Background-verified electricians; carry ID; follow society gate rules and quiet hours where applicable.`
2. **Transparent estimates** — `Scope card before cutting chases; spares billed with MRP reference where available.`
3. **Warranty you can use** — `Workmanship warranty as per policy; repeat visit for covered defects without runaround.`

### 4.5 Ways + experience

- **waysHeading:** `How booking an electrician works`
- **waysBullets:**  
  `["Pick service & slot online","Partner arrives with standard tools & spares","Inspection + estimate before major work","Tidy closure + leak/heat test on DB work","Digital invoice & warranty note"]`
- **experienceIncluded:**  
  `["Site photos on request","Standard spares on vehicle","Cable dressing in visible areas","Society pass assistance guidance"]`

### 4.6 Areas

- **areasList:**  
  `["Bhayandar East","Bhayandar West","Mira Road","Naya Nagar","Golden Nest","Uttan Road (select pockets)"]`
- **areasCta:** `Check slot availability in Mira Bhayandar`
- **areasCopy:** `We route technicians from hubs near Bhayandar and Mira Road to reduce dead time during peak traffic. ETAs update live after dispatch.`

### 4.7 `bookingSteps` (4)

| stepNumber | title | description |
|------------|--------|-------------|
| 1 | Book online | Choose electrician, add address & photos of DB if tripping. |
| 2 | Confirmation | Slot + partner details; reschedule rules as per policy. |
| 3 | Visit & diagnosis | Inspection-first; approval before material-heavy work. |
| 4 | Pay & support | Digital invoice; warranty channel on app/WhatsApp. |

- **contactPhone:** `+9198XXXXXXXX`
- **contactWhatsapp:** `9198XXXXXXXX`

### 4.8 Spare parts + pricing lists

**spareParts:**  
`[{"name":"Single-pole MCB (common brands)","priceRange":"₹180–₹450 + labour"},{"name":"RCBO / RCCB (where applicable)","priceRange":"Quote after DB audit"},{"name":"6–10 sq.mm copper wire (per metre)","priceRange":"MRP + labour"}]`

**pricingIncluded:**  
`["Standard multimeter checks","Basic terminal tightening in scope","Site cleanup for drill dust (minor)","Digital invoice"]`

**pricingExcluded:**  
`["Civil chasing / putty (if outsourced)","OEM proprietary smart modules","Hidden slab conduit mega-rewires without approval","After-hours premium if applicable"]`

**comparisonRows:**

| label | profixer | others |
|--------|----------|--------|
| Estimates | Inspection-first scope card | Often quote on phone without DB open |
| Spares | Itemised where possible | Generic “package” unclear |
| Warranty | Policy-backed workmanship note | Varies; ask every time |
| Society rules | Quiet hours & pass guidance | Inconsistent communication |

### 4.9 `faqs` (6)

Use same Q&A style as your consumer FAQ schema.

1. **Why does my MCB trip when AC starts?** — `Often underrated MCB, loose terminal, or weak earthing. We measure load and terminations before suggesting change.`
2. **Do you upgrade full DB?** — `Yes with planned changeover window; price after audit.`
3. **Can you install chandelier in false ceiling?** — `Yes with correct support and weight check.`
4. **Do you work weekends?** — `Subject to slots and society noise rules.`
5. **What if fault returns after visit?** — `Covered defects per policy get priority revisit.`
6. **Do I need society NOC?** — `For common-area or meter-room work, yes—we guide what to ask.`

### 4.10 `relatedLinks`

`[{"label":"Plumber in Mira Bhayandar","url":"https://YOUR_DOMAIN/services/plumber/mira-bhayandar"},{"label":"AC service","url":"https://YOUR_DOMAIN/services/ac/mira-bhayandar"},{"label":"Carpenter","url":"https://YOUR_DOMAIN/services/carpenter/mira-bhayandar"},{"label":"Blog: monsoon electrical safety","url":"https://YOUR_DOMAIN/blog/monsoon-electrical-safety"}]`

### 4.11 Closing + lead magnet + jsonLdExtra

- **closingParagraph:** `Whether it’s a warm DB, a dead bedroom circuit, or a planned lighting upgrade, book an electrician in Mira Bhayandar who prioritises safety paperwork and tidy execution. If you’re unsure, start with a DB health check before monsoon peak.`
- **leadMagnet:**  
  - headline: `Free PDF: apartment electrical safety (MMR edition)`  
  - description: `Room-by-room checks you can do tonight + when to call a pro.`  
  - ctaLabel: `Send me the PDF`
- **jsonLdExtra:** `Prefer consumer-generated Service + FAQPage JSON-LD from this record; keep LocalBusiness only if NAP verified.`

### 4.12 `localityGuide`

- **enabled:** `true`
- **expandDetailsByDefault:** `false`
- **articleH2:** `Local guide: hiring an electrician in Mira Bhayandar`
- **leadParagraphs:**  
  `["Mira Bhayandar mixes older chawls, mid-rise wings, and new towers—each with different DB brands and load patterns. Coastal humidity can accelerate contact pitting in poorly torqued terminals.","This guide explains what we fix most often, how we price, and how to prepare for a smooth visit."]`
- **sections:**  
  1. `{ "h2": "Common faults we see near Bhayandar & Mira", "paragraphs": ["Partial power loss after monsoon dampness; kitchen hob trips when kettle + induction run together; geyser lines undersized for 3kW loads.","We start with DB mapping and thermal checks before suggesting rewires—so you only pay for necessary work."] }`  
  2. `{ "h2": "High-rise society rules & quiet hours", "paragraphs": ["Many societies restrict drilling after 6 pm or on Sundays. We align slots and use dust mats in lift lobbies.","For meter-room access, we coordinate with your secretary and carry ID badges as per your policy."] }`  
  3. `{ "h2": "When to upgrade vs repair", "paragraphs": ["If breakers are hot, neutrals shared across rooms, or MCBs are obsolete, upgrade paths are explained with photos.","If fault is local (one loose accessory), we repair same day when spares are available."] }`
- **summaryLead:** `Book inspection-first electrical help across Mira Bhayandar with clear estimates and tidy execution.`
- **takeaways:**  
  `["DB heat is a warning—don’t ignore","Photo your DB label before booking","Keep last invoice for warranty","Monsoon prep: check outdoor points"]`
- **jsonLdBrandServiceName:** `YOUR_BRAND Electrician — Mira Bhayandar`
- **useFaqsForSchema:** `true`
- **showInboundLinkStrip:** `true`
- **showBookingCtaStrip:** `true`

### 4.13 `localSeo`

- **enableLocalBusinessSchema:** `false` *(set `true` only with verified NAP)*  
- **localProfileName:** `YOUR_BRAND — Electricians (Mira Bhayandar)`  
- **serviceAreaHeadline:** `Areas we serve near [Location] & [City]`  
- **serviceAreaPlaceNames:** `["Mira Bhayandar","Bhayandar East","Bhayandar West","Mira Road","Naya Nagar","Golden Nest"]`  
- **serviceAreaNarrative:** `We operate mobile electrician teams across Mira Bhayandar and adjoining Mira Road sectors, prioritising DB safety and lighting installs. Coverage follows traffic-aware routing; some Uttan/Gorai pockets may need extended ETA—confirm at booking.`  
- **localIntentKeywords:**  
  `["electrician near me Mira Bhayandar","MCB repair Bhayandar East","DB upgrade Mira Road","fan installation Mira Bhayandar","AC point electrician","earthing check near me","emergency electrician Bhayandar"]`  
- **openingHoursSummary:** `Daily 8:00 am – 9:00 pm (last slot 8:00 pm); emergencies subject to partner availability`  
- **googleBusinessProfileUrl:** ``  
- **sameAsUrls:** `[]`  
- **streetAddress:** *(your ops centre or registered office — real only)*  
- **addressLocality:** `Mira Bhayandar`  
- **addressRegion:** `Maharashtra`  
- **postalCode:** `401107` *(example; verify)*  
- **addressCountryCode:** `IN`  
- **geoLatLng:** `19.2896,72.8681` *(approx centroid; verify)*  
- **priceRange:** `₹₹`  
- **ogImageOverride:** `https://YOUR_DOMAIN/og/electrician-mira-bhayandar.jpg`

### 4.14 `technicalSeo`

- **canonicalUrl:** `https://YOUR_DOMAIN/services/electrician/mira-bhayandar`
- **ogTitle:** `Electrician in Mira Bhayandar | YOUR_BRAND`
- **ogDescription:** *(same as metaDescription or shorter)*  
- **ogImageAlt:** `Electrician checking distribution board in Mira Bhayandar home`  
- **ogType:** `website`
- **twitterCard:** `summary_large_image`
- **twitterSite:** `yourbrand_in`
- **twitterCreator:** `yourbrand_in`
- **robotsMeta:** `index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1`
- **hreflangAlternates:** `[]` *(add hi-IN when you have Hindi URL)*  
- **knowsAbout:**  
  `["Electrical wiring","Distribution board","Residual current device","Mumbai Metropolitan Region home safety"]`  
- **schemaPrimaryType:** `HomeAndConstructionBusiness`
- **enableHowToSchema:** `true`
- **enableBreadcrumbSchema:** `true`
- **breadcrumbItems:**  
  `[{"name":"Home","url":"https://YOUR_DOMAIN/"},{"name":"Services","url":"https://YOUR_DOMAIN/services"},{"name":"Electrician","url":"https://YOUR_DOMAIN/services/electrician"},{"name":"Mira Bhayandar","url":"https://YOUR_DOMAIN/services/electrician/mira-bhayandar"}]`
- **speakableSelectors:**  
  `["article h1",".answer-engine-summary","#faq-section .answer"]`
- **answerEngineSummary:** `YOUR_BRAND electricians in Mira Bhayandar fix MCB trips, DB faults, and lighting installs with inspection-first pricing and policy-backed workmanship warranty.`
- **contentModifiedDate:** `2026-05-14`
- **aggregateRating:** `{ "ratingValue": "", "reviewCount": "" }` *(fill only if real)*  
- **videoEmbedUrls:** `[]`
- **enableWebPageSchema:** `true`
- **enableServiceOfferSchema:** `true`

---

## 5. Full pack — **Plumber · Dahisar** (`plumber__dahisar`)

### 5.1 Core SEO & hero

- **seoTitle:** `Plumber in Dahisar | Leaks, Drains & WC Repairs`
- **metaDescription:** `Book plumbers in Dahisar for taps, WC, kitchen blocks & concealed leaks—verified pros, inspection-first quotes, neat sites. Schedule on YOUR_BRAND today.`
- **urlSlugPattern:** `/services/plumber/dahisar`
- **primaryKeyword:** `plumber in Dahisar`
- **secondaryKeywords:**  
  `["plumber Dahisar","tap repair Dahisar","WC repair near me","kitchen drain choke","bathroom leakage Dahisar","concealed leak plumber","geyser connection leak","floor drain smell","jetting drain Dahisar"]`
- **heroTrustBadge:** `Verified plumbers · Floor-safe work`
- **heroChip:** `Dahisar East & West`
- **heroProofPoints:**  
  `["Leak test after fixes","Controlled tile cuts only with approval","Strainers & traps explained","Digital invoices"]`
- **topicChips:**  
  `["Tap leakage","WC running","Kitchen choke","Bathroom slow drain","Geyser leak","Balcony drain"]`
- **mainHeading:** `Plumber services in Dahisar`
- **intro:** `Dahisar homes see monsoon stress on balcony drains, kitchen grease chokes, and concealed flange leaks behind vanities. We diagnose before demolition, protect flooring, and give repair-vs-replace options with clear estimates.`
- **introLeadMagnetLabel:** `Checklist: stop common kitchen chokes`
- **introLeadMagnetUrl:** `https://YOUR_DOMAIN/downloads/kitchen-drain-care-dahisar.pdf`
- **image1:** `https://YOUR_DOMAIN/cms/plumber-dahisar-hero.jpg`
- **image2:** `https://YOUR_DOMAIN/cms/plumber-under-sink.jpg`

### 5.2 `serviceCards` (3)

1. **Tap & mixer repair** — `Cartridge, spindle, or full mixer swap with leak test and silicone finish.` — price: `From ₹249 visit + parts` — rating: `` — duration: `45–75 mins` — warranty: `Workmanship warranty as per policy` — bookUrl: `https://YOUR_DOMAIN/book?service=plumber&type=tap`  
2. **WC & flush faults** — `Running flush, weak syphon, angle valve weeps; western & Indian WC experience.` — `From ₹299 visit + parts` — `` — `60–120 mins` — same warranty — `https://YOUR_DOMAIN/book?service=plumber&type=wc`  
3. **Kitchen drain choke** — `P-trap cleanout, mild jetting, grease advice—escalate if line is damaged.` — `Quote after inspection` — `` — `60–150 mins` — same — `https://YOUR_DOMAIN/book?service=plumber&type=drain`  

### 5.3 `serviceTypes` (2)

**A. Leaks & flanges** — `Vanity, geyser nipple, and wall-flange weeps; we test with dry passes before handing over.` — bullets:  
`["Dye test where safe","Re-seal with mould-resistant silicone","Replace flex hoses & angles","Photo before/after hidden work"]`  

**B. Drains & blocks** — `Floor drains, kitchen lines, and balcony overflows; jetting pressure matched to pipe age.` — bullets:  
`["Manual auger first","Jetting when safe","Odour tracing (dry trap vs choke)","Prevention tips"]`

### 5.4 `trustBenefits` (3)

1. **Floor & furniture protection** — `Mats, shoe covers, and controlled cutting only after you approve scope.`  
2. **Honest scope** — `Repair-first mindset; replacements quoted with reason.`  
3. **Post-job testing** — `Leak run tests; you sign off on visible work.`  

### 5.5 Ways + experience

- **waysHeading:** `How your plumbing visit works`  
- **waysBullets:**  
  `["Book slot + share photos of leak","Partner confirms ETA","Diagnosis + estimate","Work + tests","Invoice & care tips"]`  
- **experienceIncluded:**  
  `["Basic leak test included","Strainer education","Waste segregation for removed parts","Mild cleaning of work area"]`  

### 5.6 Areas

- **areasList:** `["Dahisar East","Dahisar West","Ashokvan","Rawalpada","Anand Nagar (Dahisar)","Kandarpada"]`  
- **areasCta:** `See plumber slots in Dahisar`  
- **areasCopy:** `We stage technicians from Dahisar hubs to reduce Link Road/SV Road delays; live ETA after dispatch.`  

### 5.7 `bookingSteps` (4)

| stepNumber | title | description |
|------------|--------|-------------|
| 1 | Book online | Choose plumber, add address & a short video/photo of the leak or choke. |
| 2 | Confirmation | Slot + partner details; reschedule rules as per policy. |
| 3 | Visit & diagnosis | Inspection-first; approval before tile cuts or jetting. |
| 4 | Pay & support | Digital invoice; warranty channel on app/WhatsApp. |

- **contactPhone:** `+9198XXXXXXXX`  
- **contactWhatsapp:** `9198XXXXXXXX`  

### 5.8 Spare parts + pricing lists

**spareParts:**  
`[{"name":"Angle valve (pair) common sizes","priceRange":"₹220–₹520 + labour"},{"name":"Bottle trap + flex hose kit","priceRange":"₹350–₹900 + labour"},{"name":"Kitchen basket strainer","priceRange":"MRP + labour"}]`  

**pricingIncluded:**  
`["Leak retest after repair","Basic silicone finishing","Small choke clearing in scope","Digital invoice"]`  

**pricingExcluded:**  
`["Hidden slab leak civil opening","Camera scope in legacy lines if blocked","OEM imported cartridges not in stock","After-hours fee if applicable"]`  

**comparisonRows:**

| label | profixer | others |
|--------|----------|--------|
| Estimates | Inspection-first before cutting tiles | Often ballpark on phone |
| Repair vs replace | Explains why each option matters | Push full replacement by default |
| Odour diagnosis | Dry-trap vs choke checks | Quick pour-only fixes |
| Site care | Mats + controlled cuts with approval | Variable cleanup discipline |

### 5.9 `faqs` (6)

1. **Do you open tiles for hidden leaks?** — `Only after scope approval; we photo-mark the cut line and discuss reinstatement options.`  
2. **Is high-pressure jetting safe for old pipes?** — `We start manual; jetting only when line age and material allow safe pressure.`  
3. **I’m a tenant—can you still visit?** — `Yes with owner/landlord WhatsApp approval where society requires it.`  
4. **Why is kitchen pressure low but bathroom is fine?** — `Often choke at P-trap or PRV; we isolate section by section.`  
5. **Weekend slots?** — `Subject to availability and society noise rules for drilling.`  
6. **What if the leak returns?** — `Covered defects per policy get priority revisit with prior invoice reference.`  

### 5.10 `relatedLinks`

`[{"label":"Electrician in Dahisar","url":"https://YOUR_DOMAIN/services/electrician/dahisar"},{"label":"AC service","url":"https://YOUR_DOMAIN/services/ac/dahisar"},{"label":"Deep cleaning","url":"https://YOUR_DOMAIN/services/cleaning/dahisar"},{"label":"Blog: monsoon drain care","url":"https://YOUR_DOMAIN/blog/monsoon-drain-care-mumbai"}]`  

### 5.11 Closing + lead magnet + jsonLdExtra

- **closingParagraph:** `From a weeping angle valve to a stubborn kitchen choke, book a Dahisar plumber who tests after fixes and keeps floors protected. If monsoon is near, clear balcony drains before the first heavy spell—book a preventive check if water pools.`  
- **leadMagnet:**  
  - headline: `Free PDF: kitchen choke prevention (Dahisar edition)`  
  - description: `What not to pour down the sink + weekly 2-minute habit that saves jetting calls.`  
  - ctaLabel: `Email me the PDF`  
- **jsonLdExtra:** `Prefer consumer-generated Service + FAQPage JSON-LD from this record; enable LocalBusiness only if NAP is verified.`  

### 5.12 `localityGuide`

- **enabled:** `true`  
- **expandDetailsByDefault:** `false`  
- **articleH2:** `Local guide: plumbers in Dahisar for monsoon-ready homes`  
- **leadParagraphs:**  
  `["Dahisar mixes old chawls, mid-rise wings, and newer towers along SV Road and Link Road—each with different drain slopes and trap designs. Monsoon pushes balcony overflows and kitchen grease into the same vertical stacks.","Flange leaks behind vanities often look like ‘seepage’ until the trap weeps under load. This guide covers what we fix most, how we price, and how to prep your home for a tidy visit."]`  
- **sections:**  
  1. `{ "h2": "Monsoon drains & balcony overflows", "paragraphs": ["Floor drains with weak slopes back up first; we clear traps, check overflow pipes, and advise grill covers that don’t choke flow.","If water sheets across tile, we check door thresholds and drain gratings before suggesting civil slope fixes."] }`  
  2. `{ "h2": "High-rises vs older stock: pressure & noise", "paragraphs": ["Towers often have PRVs and common stacks—low kitchen pressure can be sectional, not building-wide.","Societies may restrict jetting noise after hours; we book daytime slots when possible and carry mats for lift lobbies."] }`  
  3. `{ "h2": "Repair vs replace (taps, WC, traps)", "paragraphs": ["Many mixer issues are cartridge-level; we replace only what’s worn and leak-test hot/cold separately.","For running WCs, we check syphon, flapper, and angle valve as a set—so you don’t pay twice for the same symptom."] }`  
- **summaryLead:** `Book inspection-first plumbing in Dahisar with leak retests, repair-first options, and clear spare billing.`  
- **takeaways:**  
  `["Grease + coffee grounds = expensive chokes","Photo under-sink before booking","Balcony overflow before first heavy rain","Keep last invoice for warranty"]`  
- **jsonLdBrandServiceName:** `YOUR_BRAND Plumber — Dahisar`  
- **useFaqsForSchema:** `true`  
- **showInboundLinkStrip:** `true`  
- **showBookingCtaStrip:** `true`  

### 5.13 `localSeo`

- **enableLocalBusinessSchema:** `false` *(set `true` only with verified NAP)*  
- **localProfileName:** `YOUR_BRAND — Plumbers (Dahisar)`  
- **serviceAreaHeadline:** `Areas we serve near [Location] & [City]`  
- **serviceAreaPlaceNames:** `["Dahisar East","Dahisar West","Ashokvan","Rawalpada","Kandarpada","Anand Nagar (Dahisar)"]`  
- **serviceAreaNarrative:** `We run mobile plumbing teams across Dahisar East and West, with routing that avoids Link Road peaks where possible. Coverage extends toward Rawalpada and Ashokvan; confirm ETA for pockets near national park edges during evening traffic.`  
- **localIntentKeywords:**  
  `["plumber near me Dahisar","tap repair Dahisar East","WC repair Dahisar West","kitchen choke plumber","balcony drain overflow","geyser leak plumber Dahisar","floor drain smell fix"]`  
- **openingHoursSummary:** `Daily 8:00 am – 9:00 pm (last slot 8:00 pm); emergencies subject to partner availability`  
- **googleBusinessProfileUrl:** ``  
- **sameAsUrls:** `[]`  
- **streetAddress:** *(real ops / registered address only)*  
- **addressLocality:** `Dahisar`  
- **addressRegion:** `Maharashtra`  
- **postalCode:** `400068` *(example; verify)*  
- **addressCountryCode:** `IN`  
- **geoLatLng:** `19.2522,72.8597` *(approx; verify)*  
- **priceRange:** `₹₹`  
- **ogImageOverride:** `https://YOUR_DOMAIN/og/plumber-dahisar.jpg`  

### 5.14 `technicalSeo`

- **canonicalUrl:** `https://YOUR_DOMAIN/services/plumber/dahisar`  
- **ogTitle:** `Plumber in Dahisar | YOUR_BRAND`  
- **ogDescription:** *(same as metaDescription or shorter)*  
- **ogImageAlt:** `Plumber fixing under-sink leak in Dahisar apartment`  
- **ogType:** `website`  
- **twitterCard:** `summary_large_image`  
- **twitterSite:** `yourbrand_in`  
- **twitterCreator:** `yourbrand_in`  
- **robotsMeta:** `index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1`  
- **hreflangAlternates:** `[]`  
- **knowsAbout:**  
  `["Plumbing","Trap primer","Drainage","Water heating","Mumbai monsoon home maintenance"]`  
- **schemaPrimaryType:** `HomeAndConstructionBusiness`  
- **enableHowToSchema:** `true`  
- **enableBreadcrumbSchema:** `true`  
- **breadcrumbItems:**  
  `[{"name":"Home","url":"https://YOUR_DOMAIN/"},{"name":"Services","url":"https://YOUR_DOMAIN/services"},{"name":"Plumber","url":"https://YOUR_DOMAIN/services/plumber"},{"name":"Dahisar","url":"https://YOUR_DOMAIN/services/plumber/dahisar"}]`  
- **speakableSelectors:**  
  `["article h1",".answer-engine-summary","#faq-section .answer"]`  
- **answerEngineSummary:** `YOUR_BRAND plumbers in Dahisar fix taps, WC faults, kitchen chokes, and balcony drain issues with inspection-first quotes, leak retests, and policy-backed workmanship warranty.`  
- **contentModifiedDate:** `2026-05-14`  
- **aggregateRating:** `{ "ratingValue": "", "reviewCount": "" }` *(fill only if real)*  
- **videoEmbedUrls:** `[]`  
- **enableWebPageSchema:** `true`  
- **enableServiceOfferSchema:** `true`

---

## 6. Other locality × category packs (same **all sections** — fill by copy-paste + swap)

Use **§4** or **§5** as a skeleton: keep array **lengths** and **field names** identical; rewrite:

| CMS key | Mira Road twist | Dahisar twist (non-plumber) | Mira Bhayandar twist (non-electrician) |
|---------|-----------------|----------------------------|----------------------------------------|
| `serviceAreaNarrative` | Mention **station / highway** routing | Salinity + **Link Road** peaks | **Bhayandar creek** humidity wording for plumber |
| `localIntentKeywords` | `… near Mira Road station` | `… Dahisar East`, `… Dahisar West` | `… Bhayandar East`, `… near Uttan` sparingly |
| `mainHeading` / `seoTitle` | Swap locality string | | |
| `comparisonRows` | Keep table; tweak “others” column slightly | | |

**Suggested keys:**  
`electrician__mira-road`, `electrician__dahisar`, `plumber__mira-road`, `plumber__mira-bhayandar`

---

## 7. Legal & QA gate

- [ ] NAP matches GBP / GST records  
- [ ] No fake **aggregateRating**  
- [ ] `canonicalUrl` matches live route  
- [ ] `bookUrl` / `relatedLinks` paths return 200  
- [ ] Hindi/Marathi pages: add `hreflangAlternates` when live  

---

*All `CategoryMarketingConfig` sections are listed in §1; §4 and §5 are full editorial packs for **electrician · Mira Bhayandar** and **plumber · Dahisar**. Use §6 to duplicate the same field coverage for your remaining catalog keys (names must match your CMS admin contract / API, e.g. `electrician__mira-road`, not inventing keys).*
