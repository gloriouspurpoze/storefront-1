# @profixer/admin-mobile

Bare React Native CLI app — ops on the go (bookings, inbox, chat, approvals, live map).

Planning docs: [`docs/mobile/`](../../docs/mobile/).

## Prerequisites

- Node 20+
- Watchman (macOS): `brew install watchman`
- Ruby 3.2+ + CocoaPods (for iOS): `sudo gem install cocoapods`
- Xcode 15+ (iOS) and Android Studio + JDK 17 (Android)
- Follow the official RN CLI environment setup: <https://reactnative.dev/docs/environment-setup>

## One-time native scaffold

The `android/` and `ios/` folders are not committed yet. Generate them once with the React Native CLI, then commit the result:

```bash
cd apps/admin-mobile

# 1. Install JS dependencies (creates node_modules and the autolinking manifest)
npm install

# 2. Generate the native android/ and ios/ folders
#    Use a temp dir so the generator doesn't fight with our existing src/ tree.
npx @react-native-community/cli@15 init ProfixerAdmin \
  --version 0.76.9 \
  --skip-install \
  --pm npm \
  --directory _native_template

#    Move the generated native folders into place and clean up the template
mv _native_template/android ./android
mv _native_template/ios ./ios
rm -rf _native_template

# 3. iOS pods
cd ios && pod install && cd ..
```

> If you prefer, you can also run `npx expo prebuild --clean` once and then drop Expo — the generated folders are equivalent.

## Configure env

```bash
cp .env.example .env
```

Set at minimum:

- `API_URL` — your backend base URL (`http://10.0.2.2:5000/api` for Android emulator, `http://localhost:5000/api` for iOS simulator)
- `ONESIGNAL_APP_ID` (optional, for push)
- `GOOGLE_MAPS_API_KEY` (optional, for live map on Android)

`.env` is consumed by [`react-native-config`](https://github.com/luggit/react-native-config). After editing it you must rebuild the native app (it bakes the values into the binary).

## Native config snippets

Add these to the generated native projects after step 1.

### Android — `android/app/src/main/AndroidManifest.xml`

```xml
<application ...>
  <meta-data
    android:name="com.google.android.geo.API_KEY"
    android:value="${GOOGLE_MAPS_API_KEY}" />
</application>
```

And in `android/app/build.gradle` enable `react-native-config`:

```gradle
apply from: project(':react-native-config').projectDir.getPath() + "/dotenv.gradle"
```

### iOS — `ios/ProfixerAdmin/Info.plist`

`react-native-maps` on iOS uses Apple Maps by default, so no key is needed. `react-native-config` is auto-linked but you must `pod install` after dependency changes.

For OneSignal iOS, follow <https://documentation.onesignal.com/docs/react-native-sdk-setup#ios-setup> (Notification Service Extension target).

## Run

```bash
# From repo root
npm run mobile:start          # start Metro
npm run mobile:android        # build + run Android
npm run mobile:ios            # build + run iOS

# From this directory
npm start
npm run android
npm run ios
```

## Architecture

- **Navigation:** Role-based root (`AdminNavigator`, `ProviderNavigator`, `ProfessionalNavigator`). Admin shell is a 5-tab layout (Home, Ops, Chat, Inbox, More) gated by `@profixer/rbac` + `src/config/mobileNav.config.ts`.
- **State:** Redux Toolkit + redux-persist (AsyncStorage). Tokens live in `react-native-keychain` (secure enclave / keystore).
- **API:** `@profixer/api-client` adapter in `src/services/createMobileClient.ts` — same service surface as the web admin.
- **RTK Query:** dashboard, bookings, chat, notifications, professionals, live map, applications, disputes, support/refunds.

## Features shipped

- Login → role-aware navigation root
- RTK Query data layer for the modules listed above
- OneSignal push bootstrap + device registration
- `react-native-maps` live workforce map
- Deep links via React Navigation `linking` config (`profixer://` + `https://admin.profixer.in`)

## Troubleshooting

- **Metro can't resolve `@profixer/*`** — make sure you ran `npm install` from this directory (it symlinks `file:../../packages/*` into `node_modules`). If it still fails, delete `node_modules` and reinstall.
- **`Unable to resolve module react-native-config`** — re-run `pod install` (iOS) or rebuild from Android Studio (Android). Native modules added after the first build need a fresh native compile.
- **Android can't reach backend at `localhost`** — the emulator's `localhost` is itself. Use `10.0.2.2` for the host machine, or your LAN IP for a physical device.
