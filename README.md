# GatewayConnect Mobile

This is the separate Expo mobile application for general Gateway Church members.
The existing Vite web app remains in the parent repository and contains the admin/developer tools.

The mobile app is intended for ordinary Android and iOS users. It does not include admin panels,
developer consoles, moderation dashboards, or server credentials.

## Run The Mobile App

From this directory:

```powershell
npm install
npm start
```

Then press `a` for Android, `i` for iOS on macOS, or scan the QR code with Expo Go.

Useful commands:

```powershell
npm run android
npm run ios
npm run web
npm run typecheck
npx expo export --platform android --no-bytecode
```

The `--no-bytecode` option is currently needed for static Android export in this Windows environment because Hermes bytecode generation fails locally. Normal Expo development remains the primary workflow.

## Product Scope

The mobile product is being built around these general-user features:

- Offline Bible reading, Shona support, search, bookmarks, highlights, notes, and reading plans
- Downloaded sermons and devotionals for low-connectivity use
- Community posts, testimonies, comments, groups, prayers, and direct messages
- Events, notifications, profile, follows, and church updates
- Live streams and presence when connected
- Store browsing, bookings, donations, and Paynow payments through trusted online APIs

Admin and developer features remain excluded from this mobile client.

## Current Foundation

- Expo SDK 57 TypeScript app
- SQLite database with WAL mode and local feature tables
- KJV core Bible pack, chapter reader, FTS5 search, bookmarks, notes, and highlights
- Checksum-verified Bible pack import/download contract
- Offline mutation outbox with retries, backoff, cursors, and tombstones
- Secure Supabase session storage and member authentication
- Supabase write synchronization and realtime persistence adapters
- Network-aware media download manager
- General-member navigation for Home, Bible, Community, Prayer, and Profile
- Online-only Paynow and booking service boundary
- Native OS background sync through Expo BackgroundTask

## Environment

Configure these values in the mobile build environment when connecting to the backend:

```text
EXPO_PUBLIC_SUPABASE_URL
EXPO_PUBLIC_SUPABASE_ANON_KEY
EXPO_PUBLIC_API_URL
```

Do not put Paynow integration keys in the mobile app. Payment initiation and verification remain on the trusted API. Configure `PAYNOW_INTEGRATION_ID` and `PAYNOW_INTEGRATION_KEY` only in the server/Vercel environment used by the parent API.

The booking endpoint is `POST /api/bookings` and requires `Authorization: Bearer <Supabase access token>`. It writes authenticated pending bookings to Supabase through RLS.

The bundled KJV core pack is public-domain sample content for the reader foundation. Complete translations, including Shona packs, must be supplied as licensed JSON packs through `downloadBiblePack` or `importBiblePackFile`.
