---
version: alpha
name: trade-pro-home-services
description: >-
  Default Fixer home-services storefront theme (trade-pro). Deep navy primary
  (#00142F) for trust CTAs, amber secondary (#FE9D16) for accents/badges, white
  canvas, soft 16px cards, pill interactive elements. Tenant primaryColor /
  secondaryColor override brand hues; neutrals, type scale, radius, and motion stay fixed.

colors:
  primary: "#00142F"
  secondary: "#FE9D16"
  on-primary: "#ffffff"
  on-secondary: "#00142F"
  ink: "#00142F"
  body: "#4B5563"
  mute: "#8B95A5"
  hairline: "#E2E6ED"
  hairline-mid: "#6B7280"
  canvas: "#ffffff"
  canvas-soft: "#F4F6F9"
  canvas-softer: "#EEF1F6"
  surface-pressed: "#E2E6ED"
  link: "#00142F"
  on-dark: "#ffffff"
  black-elevated: "#0A1F3D"
  primary-soft: "rgba(0, 20, 47, 0.08)"
  secondary-soft: "rgba(254, 157, 22, 0.14)"
  rating-gold: "#D97706"
  success: "#15803D"
  warning: "#B45309"
  error: "#B3262B"

typography:
  display-xxl:
    fontFamily: DM Sans, Inter, system-ui, sans-serif
    fontSize: 52px
    fontWeight: 700
    lineHeight: 64px
  display-xl:
    fontFamily: DM Sans, Inter, system-ui, sans-serif
    fontSize: 36px
    fontWeight: 700
    lineHeight: 44px
  display-lg:
    fontFamily: DM Sans, Inter, system-ui, sans-serif
    fontSize: 32px
    fontWeight: 700
    lineHeight: 40px
  display-md:
    fontFamily: DM Sans, Inter, system-ui, sans-serif
    fontSize: 24px
    fontWeight: 700
    lineHeight: 32px
  display-sm:
    fontFamily: DM Sans, Inter, system-ui, sans-serif
    fontSize: 20px
    fontWeight: 700
    lineHeight: 28px
  body-lg:
    fontFamily: Inter, system-ui, sans-serif
    fontSize: 18px
    fontWeight: 400
    lineHeight: 28px
  body-md:
    fontFamily: Inter, system-ui, sans-serif
    fontSize: 16px
    fontWeight: 400
    lineHeight: 24px
  body-md-strong:
    fontFamily: Inter, system-ui, sans-serif
    fontSize: 16px
    fontWeight: 500
    lineHeight: 24px
  body-sm:
    fontFamily: Inter, system-ui, sans-serif
    fontSize: 14px
    fontWeight: 400
    lineHeight: 20px
  body-sm-strong:
    fontFamily: Inter, system-ui, sans-serif
    fontSize: 14px
    fontWeight: 500
    lineHeight: 20px
  caption:
    fontFamily: Inter, system-ui, sans-serif
    fontSize: 12px
    fontWeight: 400
    lineHeight: 16px
  button-md:
    fontFamily: Inter, system-ui, sans-serif
    fontSize: 14px
    fontWeight: 600
    lineHeight: 20px

rounded:
  none: 0px
  md: 8px
  lg: 12px
  xl: 16px
  pill: 999px
  full: 9999px

spacing:
  xxs: 4px
  xs: 8px
  sm: 12px
  md: 16px
  lg: 20px
  xl: 24px
  xxl: 32px
  section: 80px

components:
  nav-bar:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    typography: "{typography.body-md-strong}"
    height: 64px
    padding: "0 {spacing.xl}"
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.button-md}"
    rounded: "{rounded.pill}"
    padding: "12px 24px"
    height: 44px
  button-outline:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    typography: "{typography.button-md}"
    rounded: "{rounded.pill}"
    padding: "12px 24px"
    height: 44px
  button-call:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    typography: "{typography.button-md}"
    rounded: "{rounded.pill}"
    padding: "12px 20px"
    height: 44px
  mobile-sticky-cta:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    padding: "12px 16px"
  hero-band-light:
    backgroundColor: "{colors.canvas-soft}"
    textColor: "{colors.ink}"
    typography: "{typography.display-xxl}"
    padding: "{spacing.section} {spacing.xl}"
  quote-form-card:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    rounded: "{rounded.xl}"
    padding: "{spacing.xl}"
  trust-chip:
    backgroundColor: "{colors.secondary-soft}"
    textColor: "{colors.ink}"
    typography: "{typography.body-sm-strong}"
    rounded: "{rounded.pill}"
    padding: "6px 12px"
  stat-chip:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    typography: "{typography.display-md}"
    padding: "{spacing.md}"
  service-card:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    rounded: "{rounded.xl}"
    padding: "{spacing.lg}"
  step-card:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    rounded: "{rounded.xl}"
    padding: "{spacing.xl}"
  why-card:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    rounded: "{rounded.xl}"
    padding: "{spacing.xl}"
  faq-row:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    typography: "{typography.body-md-strong}"
    rounded: "{rounded.lg}"
    padding: "{spacing.lg}"
  final-cta-band:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-dark}"
    typography: "{typography.display-lg}"
    padding: "{spacing.section} {spacing.xl}"
  footer-dark:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-dark}"
    typography: "{typography.body-sm}"
    padding: "{spacing.section} {spacing.xl}"
  text-input:
    backgroundColor: "{colors.canvas-soft}"
    textColor: "{colors.ink}"
    typography: "{typography.body-md}"
    rounded: "{rounded.lg}"
    padding: "12px 16px"
    height: 44px
---

## Overview

Trade Pro is the **default multi-tenant storefront theme** for Fixer home-services businesses (plumbing, HVAC, cleaning, electrical, pest, handyman, and adjacent trades). The surface must feel trustworthy on first paint — a stranger is about to be invited into someone’s home — while converting with a single clear lead action per viewport.

The system sits on **white / soft-gray canvas** (`{colors.canvas}` / `{colors.canvas-soft}`). **Deep navy** (`{colors.primary}` — `#00142F`) is the money color: primary CTAs, sticky quote button, footer slab, focus rings. **Amber** (`{colors.secondary}` — `#FE9D16`) is reserved for accents — trust chips, step numbers, icon wells, secondary highlights — never competing with the primary CTA. Tenants may override primary and secondary via Studio; neutrals, type scale, radius, spacing, and motion stay fixed so the theme cannot look broken.

Type uses open-source substitutes for the Fixer mobile brand faces: **DM Sans** for display, **Inter** for body and buttons. Headlines are sentence-case weight 700; buttons are sentence-case weight 600 inside **pill** shapes (`{rounded.pill}`). Cards and photo frames use `{rounded.xl}` (16px).

**Key Characteristics:**
- Light commercial body — not a dark contractor flyer or diagonal-stripe aesthetic
- One primary CTA per viewport (`Get a free quote` / `Book now`); Call is quieter outline / text
- Two tenant-editable hues only; semantic success/warning/error stay system-fixed
- Pill CTAs + soft 16px cards; line icons, photography-first imagery with branded monogram fallbacks
- Honest emptiness — sections with no data collapse; never lorem or fake “10k jobs” without real values
- Mobile-first; sticky Call + Quote bar after header scrolls away (&lt;640px)

## Colors

> **No Interaction sub-section.** Hover colors are silently filtered. Allowed sub-sections: Brand & Accent, Surface, Text, Semantic.

### Brand & Accent
- **Navy Primary** (`{colors.primary}` — `#00142F`): filled CTAs, active nav, links, footer/final-CTA slabs, focus ring. Overridable via `branding.primaryColor`.
- **Amber Secondary** (`{colors.secondary}` — `#FE9D16`): trust chips, step accents, icon wells, badge fills. Overridable via `branding.secondaryColor`.
- **On Primary / On Secondary** (`{colors.on-primary}`, `{colors.on-secondary}`): contrast-guarded label colors (auto-flip when tenant picks a light brand hue).
- **Primary Soft / Secondary Soft**: translucent wells for chips and selected states.

### Surface
- **Canvas** (`{colors.canvas}` — `#ffffff`): default page and card surface.
- **Canvas Soft / Softer** (`{colors.canvas-soft}`, `{colors.canvas-softer}`): alternating section bands and input fills.
- **Hairline** (`{colors.hairline}`): 1px borders on cards and header.

### Text
- **Ink** (`{colors.ink}`): headlines and strong UI chrome on light surfaces.
- **Body / Mute** (`{colors.body}`, `{colors.mute}`): paragraphs and metadata.
- **On Dark** (`{colors.on-dark}`): text on navy slabs.

### Semantic
- **Success / Warning / Error** — form validation and status only; never replaced by tenant brand colors.
- **Rating Gold** (`{colors.rating-gold}`) — star fill; trust signal, not brand expression.

## Typography

### Font Family

DM Sans (display) + Inter (body/UI). Tenant `fontHeading` / `fontBody` may override family names; weights and scale stay fixed.

### Hierarchy

| Token | Size | Weight | Use |
|---|---|---|---|
| `{typography.display-xxl}` | 52px | 700 | Hero H1 (desktop) |
| `{typography.display-xl}` | 36px | 700 | Section H2 |
| `{typography.display-lg}` | 32px | 700 | Sub-section / final CTA |
| `{typography.display-md}` | 24px | 700 | Card titles, stat values |
| `{typography.display-sm}` | 20px | 700 | Small card titles |
| `{typography.body-lg}` | 18px | 400 | Hero subcopy |
| `{typography.body-md}` | 16px | 400 | Default body (~65ch max) |
| `{typography.body-sm}` | 14px | 400 | Meta, form hints |
| `{typography.caption}` | 12px | 400 | Legal, micro labels |
| `{typography.button-md}` | 14px | 600 | Pill button labels (sentence case) |

## Layout

### Spacing System

- Base unit 8px (`{spacing.xs}`). Section rhythm `{spacing.section}` (80px desktop; ~48–64px mobile).
- Container max-width **1200px**; gutters 16px mobile / 24–32px desktop.
- Grid: services 1 / 2 / 3 columns; how-it-works 1 / 3; why-us 1 / 2 / 4.

### Whitespace Philosophy

Generous around hero copy and photo/form; tighter inside cards. Never invent filler blocks when Studio data is missing.

## Elevation & Depth

| Level | Treatment | Use |
|---|---|---|
| 0 — Flat | No shadow | Section bands |
| 1 — Hairline | 1px `{colors.hairline}` | Header, outlined cards |
| 2 — Soft Lift | `0 2px 12px rgba(0,20,47,0.08)` | Quote form, service cards |
| 3 — Float | `0 8px 24px rgba(0,20,47,0.12)` | Mobile sticky CTA, menus |

## Shapes

- **Pills** (`{rounded.pill}`) for every primary/secondary button and trust chip.
- **Cards / photos** (`{rounded.xl}` 16px).
- **Inputs** (`{rounded.lg}` 12px).
- No sharp contractor corners; no more than one radius scale in play for interactive elements.

## Components

### Shell

**`nav-bar`** — sticky white header, 64px, logo left, links center/left of actions, phone (`tel:`) always visible on mobile, primary pill CTA (“Get a free quote”). Hamburger &lt;1024px. Optional top utility strip collapses on mobile.

**`mobile-sticky-cta`** — mobile-only bottom bar: outline Call + primary Quote. Appears after header sentinel leaves view; hides while menu open.

**`footer-dark`** — navy slab, 4 columns (brand+socials / explore / contact / hours+credentials). Collapse empty columns. Bottom strip: copyright · Privacy · Terms · Powered by.

### Homepage

**`hero-band-light`** — soft canvas band; H1 + subcopy + trust chips; optional quiet `tel:` link. Primary conversion is **`quote-form-card`** (name, phone, email, optional service select → `submitLead`).

**`stat-chip` strip** — show only when ≥2 real stats exist; never invent “10k+ jobs”.

**`service-card` / grid** — photo or primary monogram; name; short description; starts-at price or “Free estimate”; Book link. Empty: friendly message + phone/contact CTA.

**`step-card` (How it works)** — intentional theme defaults (Request → Confirm → Arrive → Done); always shown; secondary accents on step index.

**`why-card`** — intentional differentiators; always shown.

**`faq-row` / About** — omit when CMS/config empty.

**`final-cta-band`** — navy closing band; primary Book + outline Call when phone present.

### Other routes

- `/services`, `/services/[slug]`, `/book`, `/contact`, `/about` reuse the same shell + token chrome; booking uses shared `BookingForm` → `submitLead`.

## Do's and Don'ts

### Do
- Keep one primary CTA per viewport; Call is secondary
- Collapse empty sections; use branded monogram image fallbacks
- Wire both primary and secondary brand tokens with contrast guard
- Prefer photography; line icons only for trust/process glyphs

### Don't
- Don’t revive diagonal stripes, dark-grid heroes, or uppercase contractor flyer CTAs as the default identity
- Don’t hardcode fake stats, lorem, or placeholder job photos
- Don’t put secondary amber on the primary money button
- Don’t add theme-local `fetch` / axios clients

## Responsive Behavior

| Breakpoint | Width | Notes |
|---|---|---|
| Mobile | 375 | Sticky CTA; stacked hero form; phone in header |
| Tablet | 768 | 2-col services |
| Nav | 1024 | Full nav; hamburger below |
| Desktop | 1280 | 3-col services; 1200px container |

Touch targets ≥44px. Sticky CTA uses `safe-area-inset-bottom`.

## Iteration Guide

1. One checklist component per session (`perfect-storefront-theme`)
2. Reference tokens by name (`{colors.primary}`, `{rounded.pill}`)
3. Preview on tenant host (`profixer.lvh.me:3001`), not bare localhost
4. Add Studio-backed modules (gallery, service-area list) only when API fields exist
