# Slider Management & Mobile App

## Overview

**Slider Management** lets you manage banners and sliders for both the **client website** and the **mobile app**, with industry-standard placements and optional mobile-specific images.

## Admin: Slider Management (`/sliders`)

- **Placements** (where the banner appears):
  - **Home Page Hero** – Main hero carousel on the website
  - **Offers & Promotions** – Offers, deals, promos
  - **Category Banner** – Category/listing pages
  - **Mobile App Home** – Hero carousel in the mobile app
  - **Announcement Bar** – Top/bottom notice bar
  - **Inline Promo** – In-content promo blocks
  - **Seasonal / Campaign** – Time-bound campaigns

- **Images**
  - **Desktop image** (required): Used on the website.
  - **Mobile image** (optional): Used by the mobile app and mobile web; falls back to desktop image if not set.

- **Filters**: Search, Status, Audience, **Placement**
- **Table**: Preview, Title, **Placement**, Position, Status, Audience, Schedule, Actions

## API (backend)

- **List (admin):** `GET /api/sliders?placement=...&audience=...&status=...`
- **Active (client/mobile):** `GET /api/sliders/active?placement=mobile_app_home&platform=mobile`
  - `platform=mobile` lets the backend return `image_url_mobile` when available.

Backend should support optional fields: `placement`, `image_url_mobile`, and query params `placement`, `platform` on `/sliders/active`.

## Mobile App (`mobile-app/`)

- **Expo (React Native)** app that shows a **home screen** with a banner carousel.
- Fetches: `GET /api/sliders/active?placement=mobile_app_home&platform=mobile` (fallback: `home_page_hero`).
- Uses `image_url_mobile` when present, else `image_url`.
- Run: `cd mobile-app && npm install && npx expo start`
- Configure `EXPO_PUBLIC_API_URL` in `.env` (use your machine IP for device/emulator).

See **mobile-app/README.md** for setup and usage.
