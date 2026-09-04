# Home Services — Default Storefront Theme: Design Spec

**Vertical:** `home_services` · **Status:** design spec for the default theme · **Author:** UI/UX design pass · **Related code:** `storefront/themes/home-services/`, current implementation `trade-pro/`

## 1. Purpose & scope

This is the design system for the **default storefront theme** every Home Services tenant (plumbers, electricians, HVAC, cleaning, landscaping, pest control, handyman, roofing, appliance repair, etc.) gets out of the box. It must:

- Look **modern, clean, and trustworthy** with zero design work from the tenant.
- Ship with **every section a home-services business actually needs** to convert a visitor into a lead/booking.
- Let the tenant admin **re-skin the theme by changing only two colors** (primary + secondary) — everything else (type scale, spacing, radius, elevation, motion) is fixed so the theme can never look broken, cluttered, or off-brand no matter what colors are picked.
- Degrade gracefully when a tenant has sparse data (few services, no testimonials, no gallery photos) — never show placeholder/lorem content or broken layout gaps (per `storefront-theme-gate`).

This spec documents the **target design** for the theme that renders via `homeServicesLayoutRouter.tsx`. The current `trade-pro/` implementation covers most of §5 already; gaps against this spec are called out inline as **[gap]**.

---

## 2. Design principles

1. **Trust first.** A home-services visitor is inviting a stranger into their home — every screen should answer "are these people licensed, reviewed, and going to show up?" before it asks for anything.
2. **One job: get the lead.** Every page has exactly one primary CTA visible per viewport (`Request a quote` / `Book now` / `Call now`). Secondary actions (browse services, read more) are visually quieter.
3. **Calm, not corporate.** Modern SaaS-clean (generous whitespace, soft shadows, rounded corners, restrained type) — not the "loud contractor flyer" aesthetic. Tenants that want bold/high-contrast can still get there via strong color choices; the *structure* stays calm.
4. **Two-color tenant, infinite tenants.** All tenant expression funnels through **primary** and **secondary**. No other hue appears anywhere in the UI except semantic system colors (success/error/warning) and neutrals.
5. **Mobile is the primary device.** Home-services leads convert heavily on mobile, often from a Google search while standing in front of a leaking pipe. Design mobile-first; the "call now" action must be reachable with one thumb at all times.
6. **Honest emptiness.** A section with no data collapses. Never render "Coming soon," `undefined`, or empty cards.

---

## 3. Design tokens

### 3.1 Color system (tenant-editable: primary + secondary)

Source of truth: `StorefrontConfig.branding.primaryColor` / `.secondaryColor` (fallbacks in `PublicSiteThemeTokens`). The theme must consume **both**, unlike the current `trade-pro.css`, which only wires `--site-brand` (primary) and hardcodes a fixed amber `--tp-accent`. **[gap: wire secondaryColor as a real, distinct role, not a fixed accent.]**

| Token | Source | Role |
|---|---|---|
| `--brand-primary` | `branding.primaryColor` (default `#0e3191`) | Primary CTAs, active nav state, links, focus ring, price emphasis |
| `--brand-secondary` | `branding.secondaryColor` (default a warm amber `#f59e0b`) | Secondary CTAs/badges, highlight chips, "Why choose us" icon accents, stat numbers |
| `--brand-primary-contrast` | derived | `#fff` or `#111` — computed at render time from primary's relative luminance so CTA label text always passes 4.5:1 |
| `--brand-secondary-contrast` | derived | same, computed from secondary |
| `--brand-primary-50/100/600/700` | derived tint/shade ramp | hover/active states, subtle tinted backgrounds (e.g. selected filter chip, active tab underline) |
| `--ink-900 / -700 / -500 / -300` | fixed neutrals | headings / body / muted / borders — never tenant-editable |
| `--surface / --surface-raised` | fixed neutrals | page background (`#fafafa`) vs card background (`#ffffff`) |
| `--success / --warning / --danger` | fixed system colors | form validation, "open now" badge, error states — **never** replaced by tenant colors, so status is always legible regardless of brand palette |

**Rules the theme enforces (not up to the tenant to get right):**

- **Contrast guard:** if the admin picks a primary/secondary too light for white text (e.g. pale yellow), the theme auto-flips CTA text to `--ink-900` instead of white. Never let a tenant pick a color combo that produces unreadable buttons.
- **Primary vs secondary must be visually distinct.** If the tenant sets secondary within a small hue/lightness delta of primary, fall back secondary to a neutral (`--ink-700`) for outline/ghost buttons so the UI doesn't read as monochrome-and-confusing.
- **One color does the CTA job.** Primary = the "do the money action" color (Book now, Request quote, Call). Secondary = everything that supports but doesn't compete (badges, icon backgrounds, the "How it works" step numbers, star-rating fill can stay a fixed neutral gold — ratings are a trust signal, not brand expression).
- **Dark surfaces (hero, footer) still resolve from the same two tokens** — no separate "dark theme palette" to keep in sync. Hero background is `--ink-900` fixed (photography-first hero, see §5.2), with primary/secondary only appearing in the CTA button and badge chips on top of it.

### 3.2 Typography

- `fontHeading` / `fontBody` from `branding.fontHeading` / `branding.fontBody` (fallback `"DM Sans"` / `"Inter"`, per `PublicSiteThemeTokens`). Fonts are the one other tenant-editable token; weight/scale below stay fixed.
- Scale (mobile → desktop): `display` 32/40px → 56/64px (Hero H1 only), `h2` 26/32 → 36/44, `h3` 20/28 → 24/32, `body` 16/26, `small` 14/20, `micro` 12/16 (badges, meta text).
- Heading weight 700, body 400–500. Line length capped at ~65ch for body copy blocks (About, FAQ answers).

### 3.3 Spacing, radius, elevation

- 8px base spacing unit. Section vertical rhythm: 64px mobile / 96px desktop between sections (`sectionSpacing: comfortable` default; tenants can pick `compact | comfortable | spacious` per `PublicSiteThemeTokens.sectionSpacing`).
- Radius: `md` default (12px cards, 999px pill buttons) — matches `SiteRadiusPreset`. No sharp corners; no more than one radius scale in play at once.
- Elevation: two levels only — `shadow-sm` resting cards, `shadow-lg` on hover/modal. No heavy drop shadows, no gradients on cards.
- Container max-width 1200px, 16/24px gutters mobile, 24/32px desktop. 12-col grid desktop, 4-col mobile.

### 3.4 Iconography & imagery

- Line icons, 1.5–2px stroke, rounded caps — never filled/glyph icons (keeps the "modern SaaS" read rather than "clip-art contractor site").
- Photography over illustration: real technician/job photos > stock > icon-only fallback. Every image slot has a defined fallback (branded initials/monogram tile in primary color) — never a broken `<img>` or gray box.
- Badges (licensed, insured, background-checked, years-in-business) render as small pill chips with icon + label, not large graphics — they're trust signals, not decoration.

---

## 4. Layout shell

### 4.1 Header (`shell-header`)

- Logo (or site name if no `logoUrl`) — left. Nav links — center/left-of-actions, collapses to hamburger < 1024px. Right side: phone number (`tel:` link, click-to-call, always visible even on mobile — this is the single most important element in a home-services header) + primary CTA button ("Get a free quote").
- Sticky on scroll, compact height (64px) after scroll past hero.
- Optional thin **top bar** above header for hours/service-area/emergency line ("Serving Greater Boston · 24/7 Emergency Service") — collapses on mobile.

### 4.2 Mobile sticky CTA bar **[gap — not in trade-pro today]**

- Persistent bottom bar on mobile only, two buttons: `Call now` (secondary/outline) and `Get a quote` (primary, filled). Appears once the header CTA scrolls out of view. This is the single highest-leverage conversion element for a mobile home-services visitor and should be in the default theme, not left to a premium tier.

### 4.3 Footer (`shell-footer`)

- 4-column desktop / stacked mobile: (1) logo + tagline + socials, (2) quick links (Services, About, FAQ, Contact), (3) contact block (phone, email, address, map link), (4) hours + license/insurance numbers if provided.
- Bottom strip: copyright, privacy/terms links, "Powered by" platform credit.

---

## 5. Section inventory (home page)

Ordered as the default `sections` array (tenant can reorder/toggle via Storefront Studio, `StorefrontConfig.sections`, respecting `featureFlags.respectSections`). Each row: purpose, data source, and behavior when data is sparse/empty.

| # | Section | Purpose | Data source | Empty/sparse behavior |
|---|---|---|---|---|
| 1 | **Hero** | Headline, subcopy, primary CTA, trust micro-proof (rating + review count), optional quick-quote mini-form or service-area input | `content.heroHeadline/heroSubcopy/heroCtaLabel`, computed avg rating from `services[].rating` | Falls back to `"{tenant.name}, done right the first time."` template copy; hides rating chip if no reviews |
| 2 | **Trust/stats bar** | Quick-scan credibility: years in business, jobs completed, avg rating, response time | tenant-entered stats (Studio) or computed from services/reviews | Hides entirely if fewer than 2 stats have real values — never shows "0 jobs completed" |
| 3 | **Services grid** (`catalog-grid`) | The core catalog — cards with icon/photo, name, short description, starting price, "Book" link | `fetchServices` → `PublicService[]` | `catalog-empty`: friendly "Services coming soon — call us to ask what we offer" + phone CTA, not a blank grid |
| 4 | **How it works** | 3–4 step process (Request → Confirm → We arrive → Job done) to reduce booking anxiety | fixed theme copy (documented `intentionalThemeDefault`, not tenant data) | always shown — process is universal, not tenant-specific |
| 5 | **Service area** **[gap]** | Map or list of neighborhoods/cities/zip codes served | `branding.address` + tenant-entered service-area list (Studio) | collapses if no service-area data configured |
| 6 | **Why choose us** | 3–4 differentiators (licensed & insured, upfront pricing, satisfaction guarantee, background-checked techs) with icon + short copy | fixed theme copy w/ tenant-editable icons/labels via Studio if available | always shown |
| 7 | **Gallery / before-after** **[gap]** | Photo proof of work quality — grid or before/after slider | tenant-uploaded photos (Studio media) | collapses entirely if no photos uploaded — never shows placeholder job photos |
| 8 | **Pricing / packages** **[gap, optional]** | Transparent starting prices or service tiers (e.g. Basic/Standard/Premium cleaning) | `services[].basePrice`, or tenant-defined packages | shown only if `basePrice` present on ≥1 service; falls back to "Free estimate" messaging otherwise |
| 9 | **Testimonials/reviews** | Social proof carousel/grid | CMS testimonials (`StorefrontCmsTestimonial[]`) | section omitted if `testimonials.length === 0` (current `trade-pro` behavior — correct, keep) |
| 10 | **Certifications & guarantees** **[gap]** | License #, insurance, association badges (BBB, EPA, manufacturer-certified), money-back/satisfaction guarantee | tenant-entered in Studio | omit badges with no value entered rather than showing a generic placeholder badge |
| 11 | **About** | Founder/team story, local roots, photo | `content.aboutTitle/aboutBody` | omitted if both fields empty (current behavior) |
| 12 | **FAQ** | Objection-handling (pricing, scheduling, service area, warranty) | `content.faqItems` + CMS faqs | omitted if empty array |
| 13 | **Blog / tips** **[gap, optional, off by default]** | SEO content, maintenance tips — drives organic search traffic for "how to fix X" queries | CMS blog index, if the tenant's plan includes it | fully optional module, off unless tenant has published posts |
| 14 | **Lead / quote form** (`system-lead-form`) | The conversion point — name, contact, service picker, message | `BookingForm` → `submitLead` | service `<select>` hides if `services` empty; success/error/submitting states already handled |
| 15 | **Emergency CTA banner** **[gap, optional]** | For trades with 24/7 emergency service (plumbing, HVAC, locksmith, pest) — sticky or inline "Emergency? Call now" strip | `featureFlags.emergencyService` | rendered only when the flag is on |
| 16 | **Final CTA** | Last-chance conversion block before footer, phone + quote button | `branding.contactPhone` | always shown if phone present, else CTA-only (form) |

**States per component** (per theme-gate bar): default (rich data), empty (zero items), partial (missing image/description on some cards), busy (long tenant names, 50+ services needing pagination/"View all"), blocked (component requires data that hasn't loaded — show skeleton, not spinner-forever).

---

## 6. Other pages

- **Service detail** (`/services/[slug]`): hero w/ service photo, full description, price, embedded `BookingForm` pre-filled via `initialServiceSlug`, related services.
- **Book/Contact** (`/book`, `/contact`): full-width `BookingForm`, map/address, hours.
- **About**: expanded version of home `about` section — team photos, timeline/milestones.
- **Track/Account** (if tenant enables customer accounts): booking status, past requests — reuse shared `account` shell components, not theme-local.

---

## 7. Responsive breakpoints

`375` (mobile baseline) · `768` (tablet) · `1024` (nav collapse threshold) · `1280` (desktop) — matches existing theme-gate verify viewports (375/768/1280); 1024 added as the internal nav breakpoint.

---

## 8. Accessibility

- WCAG **AA** minimum (per `THEME_BRIEF` default). 4.5:1 text contrast enforced via the primary/secondary contrast-guard in §3.1.
- Visible focus ring using `--brand-primary` on all interactive elements.
- `tel:` and `mailto:` links throughout use real anchor tags, not JS-only click handlers, so they work with keyboard/AT and native "call" affordances.
- Form fields (`BookingForm`) keep explicit `<label>` associations and inline error text tied via `aria-describedby` — verify this is wired, not just visually adjacent.
- Carousels (testimonials, gallery) must be keyboard-navigable and pausable, not autoplay-only.

---

## 9. Motion

`subtle` only (per brief default): 150–200ms ease-out on hover/focus, fade+slide-up on scroll-into-view for section headers (max 8px translate), no parallax, no autoplaying video hero without a mute/pause control.

---

## 10. Tenant customization surface

**What the tenant admin can change:** `primaryColor`, `secondaryColor`, `fontHeading`, `fontBody`, `logoUrl`, section on/off + reorder (`sections`), hero/about/FAQ copy (`content`), service catalog, testimonials/gallery media, service-area list, feature flags (emergency banner, pricing section, blog).

**What stays fixed (theme identity, not tenant-editable):** type scale, spacing rhythm, radius, shadow levels, icon style, section internal layout, motion timing, system colors (success/warning/danger), the process/"how it works" copy.

This split is what lets one theme serve every home-services tenant without ever looking broken: color and content are the only variables; structure is guaranteed.

---

## 11. Open gaps vs. current `trade-pro/` implementation

For whoever picks this up next, in priority order:

1. Wire `branding.secondaryColor` as a real second token (`--brand-secondary`) instead of the hardcoded `--tp-accent: #f59e0b` in `trade-pro.css`.
2. Add mobile sticky CTA bar (§4.2) — biggest conversion lever missing today.
3. Add Service Area section (§5, row 5).
4. Add Gallery/before-after section (§5, row 7), Studio-driven, collapses when empty.
5. Add Certifications & Guarantees section (§5, row 10).
6. Add optional Emergency CTA banner behind a feature flag (§5, row 15).
7. Add contrast-guard logic (§3.1) so tenant-picked colors can never produce unreadable buttons — this is a shared concern, likely belongs in `theme-kit`, not per-theme CSS.

Each of the above should go through `perfect-storefront-theme` as its own component-order.yaml key/session, not one large diff.
