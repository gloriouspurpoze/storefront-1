# Content & Marketing – Market Standard Coverage

This doc maps **Content & Marketing** in fixer-admin to common market expectations (e.g. Shopify, Webflow, WordPress, SaaS dashboards).

---





## ✅ Covered (in admin)

| Area | Location | Notes |
|------|----------|--------|
| **CMS Overview** | Content & Marketing → Website Content → CMS Overview | Dashboard with links to all modules |
| **Homepage** | Website Content → Homepage | Hero, sections, layout |
| **Pages** | Website Content → Pages | Static/landing pages |
| **Menus** | Website Content → Menus | Header, footer, navigation |
| **Blog Posts** | Website Content → Blog Posts | Articles, news |
| **Blog Categories** | Website Content → Blog Categories | Organize blog by category |
| **Banners & Sliders** | Marketing → Banners & Sliders | Hero carousel (placement: home, offers, mobile app, etc.) |
| **Announcements & Pop-ups** | Marketing → Announcements & Pop-ups | Uses Banner Management with types: announcement bar, pop-up |
| **Promotions** | Marketing → Promotions | Promo codes, campaigns |
| **Coupons** | Marketing → Coupons | Discount codes |
| **Referrals** | Marketing → Referrals | Referral program |
| **Newsletter** | Marketing → Newsletter | Placeholder + integration guidance (Mailchimp, etc.) |
| **Social Links** | Marketing → Social Links | Website + social URLs (footer/header) |
| **Testimonials** | Testimonials | Customer reviews, social proof |
| **FAQs** | FAQs | FAQ + categories |
| **Media Library** | Media Library | Images, videos, files |
| **SEO Management** | SEO Management | Meta tags, per-page SEO |

---

## Optional future additions (market standard)

- **URL redirects** – 301/302 redirect rules (often under SEO).
- **Sitemap** – Generate or config for XML sitemap (can live under SEO).
- **Email templates** – If you add a sending API, manage templates in admin.
- **A/B testing** – Test headlines/CTAs (advanced; many use third-party tools).
- **Campaign analytics** – Clicks, conversions per banner/promo (backend may already track; expose in admin).

---

## Where to find things in the UI

- **Content & Marketing** sidebar group:
  - **Website Content** (submenu): CMS Overview, Homepage, Pages, Menus, Blog Posts, Blog Categories.
  - **Marketing** (submenu): Banners & Sliders, Announcements & Pop-ups, Promotions, Coupons, Referrals, Newsletter, Social Links.
  - Then: Testimonials, FAQs, Media Library, SEO Management.

- **Announcements & Pop-ups** opens the same **Banner Management** page; use **Banner Type** = “Announcement Bar” or “Pop-up” when creating/editing.
