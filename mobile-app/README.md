# Fixer Mobile App

Client-facing mobile app that displays **banners and sliders** managed in the Fixer Admin (Slider Management). Supports **Home Page Hero**, **Offers & Promotions**, and **Mobile App Home** placements.

## Prerequisites

- Node 18+
- Expo CLI: `npm install -g expo-cli` (or use `npx expo`)
- iOS Simulator (Mac) or Android Emulator

## Setup

1. **Install dependencies**

   ```bash
   cd mobile-app
   npm install
   ```

2. **Configure API URL**

   Copy `.env.example` to `.env` and set your backend base URL:

   ```bash
   cp .env.example .env
   ```

   Edit `.env`:

   - **Simulator/emulator:** Use your machine IP so the device can reach the API, e.g. `EXPO_PUBLIC_API_URL=http://192.168.1.10:5000/api`
   - **Physical device:** Same – use your computer’s LAN IP and ensure the backend is reachable (no `localhost`)

3. **Run the app**

   ```bash
   npx expo start
   ```

   Then press `i` for iOS or `a` for Android, or scan the QR code with Expo Go.

## Features

- **Home screen** with banner carousel (placement: **Mobile App Home** or **Home Page Hero**).
- Uses **mobile image** when set in admin (`image_url_mobile`); otherwise falls back to desktop image.
- Backend: `GET /api/sliders/active?placement=mobile_app_home&platform=mobile` (or `home_page_hero`).

## Admin (fixer-admin)

In **Slider Management**:

1. Set **Placement** to e.g. **Home Page Hero**, **Offers & Promotions**, or **Mobile App Home**.
2. Upload **Mobile / App image** for best results on small screens.
3. Active sliders with scheduling are returned by the API for the app.

## Placements (industry-level)

| Placement           | Use case                    |
|--------------------|-----------------------------|
| Home Page Hero     | Main hero on website        |
| Offers & Promotions| Offers, deals, promos        |
| Category Banner    | Category/listing pages       |
| Mobile App Home    | Hero carousel in this app    |
| Announcement Bar   | Top/bottom notice bar        |
| Inline Promo       | In-content promo blocks      |
| Seasonal / Campaign | Time-bound campaigns         |
