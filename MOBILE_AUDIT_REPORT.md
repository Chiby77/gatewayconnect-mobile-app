# GatewayConnect Mobile Technical Audit

**Audit date:** 2026-09-19  
**Project:** GatewayConnect standalone Expo mobile application  
**Platforms:** Android and iOS  
**Scope:** `mobile/` implementation, local database, Bible assets, synchronization, authentication, media, backend boundaries, and general-user workflows.

## Executive Summary

The mobile project has a working Expo foundation and a substantial offline/Bible infrastructure layer. It is not yet a complete production replacement for the existing GatewayConnect web application.

```text
Expo foundation:              Implemented
SQLite foundation:            Implemented, with migration gaps
Offline KJV Bible:            Implemented
Supplied Bible DB import:     Implemented
Bible search:                 Implemented, partially wired
Sync infrastructure:          Partially implemented
General-user UI:              Mostly prototype
Full GatewayConnect features: Not complete
Production readiness:         Not ready
```

The most important distinction is between:

- A service or API existing in the source code
- A feature being connected to a screen
- A feature working end to end with Supabase, authentication, and production data

Several features currently have service foundations but no complete user workflow.

## Implemented

### Mobile Project Foundation

- Expo SDK 57 project
- React Native TypeScript project
- Android configuration
- iOS configuration
- Web Expo configuration
- General-member app scope
- Admin and developer tools excluded from the mobile app
- Standalone `mobile/.gitignore`
- Standalone `package.json`
- Standalone `package-lock.json`
- `.env.example`
- Mobile README and architecture documentation

### Build Scripts

Available commands:

```powershell
cd mobile
npm install
npm start
npm run android
npm run ios
npm run web
npm run typecheck
npm run convert:bible
```

### Local SQLite Database

Implemented in `src/db/database.ts`.

Tables currently created:

```text
app_settings
users
user_sessions
bible_versions
bible_books
bible_verses
bible_verses_fts
supplied_bible_fts
bible_bookmarks
bible_highlights
bible_notes
reading_plans
reading_plan_progress
content_items
community_comments
prayer_requests
groups
messages
notifications
media_downloads
sync_cursors
sync_tombstones
sync_outbox
```

Implemented database behavior:

- SQLite WAL mode
- Foreign-key enforcement
- Schema version number
- Sync indexes
- Bible lookup indexes
- Content indexes
- Local outbox persistence
- Local tombstone persistence
- Local media metadata persistence
- Local Bible user-data persistence

### Offline Bible

Implemented:

- Bundled KJV JSON pack
- 66 books
- 31,102 KJV verses
- Local chapter reading
- Local Bible search
- FTS5 index for the bundled pack
- Verse bookmarks
- Verse notes
- Highlight storage API
- Bible pack metadata
- Translation metadata
- Pack license metadata
- Pack checksum manifest
- JSON Bible pack conversion script

The bundled default pack is:

```text
mobile/bible-packs/generated/eng_kjv.json
```

### Supplied SQLite Bible Database

The supplied database is:

```text
mobile/bible-packs/bible.eng.db
```

Verified facts:

- SQLite integrity check: passed
- File size: 2,823,536,640 bytes
- Approximate size: 2.63 GiB
- SHA-256:

```text
8F5656D12B834B09EBAAD97E03E255BBC238D3FD51C9343B1C74EE18BB60EC52
```

Database contents:

- 51 English translations
- 2,760 books
- 48,742 chapters
- 1,289,753 verses
- `eng_kjv`: 66 books and 31,102 verses
- Psalms 23 exists with six verses

The adapter is implemented in:

```text
mobile/src/bible/suppliedBibleDatabase.ts
```

Supported operations:

- Check whether the database is installed
- Copy/import the database to the app SQLite directory
- Download the database using a resumable task
- Open the database separately from the app database
- List translations
- List books
- Read chapters
- Search verse text
- Build an app-owned FTS5 index for a selected translation

The mobile Bible screen includes a document picker action for importing the large database.

### Bible Conversion Tool

Implemented:

```text
mobile/scripts/convert-bible-db.py
```

Examples:

```powershell
python scripts/convert-bible-db.py --translation eng_kjv
python scripts/convert-bible-db.py --translation engwebp
python scripts/convert-bible-db.py --all
```

The full conversion produced:

- 51 translation JSON packs
- 52 JSON files including the manifest
- Approximately 236.7 MB total output
- SHA-256 checksums
- Book counts
- Verse counts
- License URLs and metadata

Only KJV is bundled by default. Other packs are intended for optional downloads or release assets.

### Authentication Foundation

Implemented in `src/auth/authService.ts`:

- Supabase email sign-in
- Supabase email sign-up
- Secure session persistence through `expo-secure-store`
- Cached profile storage through `expo-secure-store`
- Sign-out service
- Supabase session retrieval
- Member-only profile role model

### Supabase Client

Implemented in `src/remote/supabase.ts`:

- Supabase client creation
- Secure token storage adapter
- Automatic token refresh configuration
- Persistent session configuration
- React Native URL polyfill
- Environment-based Supabase configuration

Expected mobile variables:

```text
EXPO_PUBLIC_SUPABASE_URL
EXPO_PUBLIC_SUPABASE_ANON_KEY
EXPO_PUBLIC_API_URL
```

### Network Monitoring

Implemented in `src/network/networkStatus.ts`:

- Online/offline status
- `@react-native-community/netinfo` integration
- Network listeners
- Reconnect notification
- App-level network status indicator

### Sync Outbox Foundation

Implemented in `src/sync/outbox.ts`:

- Local mutation IDs
- Entity type
- Entity ID
- Operation type
- JSON payload
- Pending state
- Processing state
- Failed state
- Synced state
- Retry count
- Last error
- Next attempt timestamp
- Idempotency key
- Exponential retry timing
- Sync cursors
- Delete enqueue helper

### Sync Engine Foundation

Implemented in `src/sync/syncEngine.ts`:

- Pending mutation processing
- Supabase create operations
- Supabase update operations
- Supabase delete operations
- Retry and failure handling
- Notification pull synchronization
- Cursor storage
- Network reconnect synchronization
- App-resume synchronization
- Active-app interval synchronization

### Conflict Resolution Foundation

Implemented in `src/sync/conflictResolver.ts`:

- Timestamp comparison
- Local-wins policy for newer local records
- Remote-wins policy for messages/comments
- Merge policy for highlights
- Tombstone creation
- Tombstone lookup

### Native Background Sync Foundation

Implemented in `src/sync/backgroundSync.ts`:

- Expo BackgroundTask dependency
- Expo TaskManager dependency
- Native task definition
- Background sync registration
- Background sync unregistration
- Sync execution from the background task
- Restricted-platform guard

Important: OS scheduling is controlled by Android and iOS. A 15-minute minimum does not mean the OS will execute exactly every 15 minutes.

### Realtime Foundation

Implemented in `src/remote/realtimeService.ts`:

- Supabase Realtime channel
- Notification persistence
- Community post persistence
- Realtime cleanup on app shutdown

### Media Download Foundation

Implemented in `src/media/downloadManager.ts`:

- Local media directory creation
- Audio download support
- Video download support
- Image download support
- Progress callbacks
- Pause support
- Resume support
- Download metadata persistence
- Local media lookup
- Local media deletion

### Backend Boundaries

Implemented:

- Authenticated booking endpoint: `POST /api/bookings`
- Server-only Paynow credential loading
- Paynow initiate endpoint boundary
- Supabase bearer-token validation for bookings
- Booking insertion as `pending`
- Server-side Paynow environment documentation
- Supabase RLS hardening migration

Paynow credentials are expected only on the trusted server:

```text
PAYNOW_INTEGRATION_ID
PAYNOW_INTEGRATION_KEY
PAYNOW_MERCHANT_EMAIL
PAYNOW_RETURN_URL
PAYNOW_RESULT_URL
```

They must not be placed in the mobile app.

## Partially Implemented

### Bible User Experience

Currently available:

- Bible tab
- Psalms 23 default reading view
- Search field
- Search result list
- Verse tap interaction
- Bookmark action
- Note input
- Supplied Bible database import action
- Installation progress text

Still incomplete:

- No full book selector
- No full chapter selector
- No verse jump UI
- No translation picker
- No translation download manager UI
- No bookmarks library screen
- No notes library screen
- No visible highlight-color controls
- No reading-plan screen
- No reading-plan progress UI
- No Shona pack integrated into the reader
- No complete downloaded-pack management screen
- Search/index work can block the JavaScript thread for large translations

### Authentication

The authentication service exists and uses secure storage, but the complete account workflow is incomplete:

- Email authentication differs from the existing web app's phone authentication
- Successful sign-in does not reliably update the parent `profile` state immediately
- No password reset screen
- No session-expiry UI
- No account deletion
- No profile editing screen
- No avatar/profile-picture workflow
- No member profile synchronization screen

### Synchronization

The infrastructure exists, but only a small part of the data model is synchronized end to end.

Currently meaningful:

- Local outbox persistence
- Generic Supabase mutation path
- Notification pull
- Limited post/notification realtime persistence
- Reconnect and app-resume sync

Not fully wired:

- Community feed pull
- Testimony pull
- Comment pull
- Prayer pull
- Group pull
- Direct-message pull
- Group-message pull
- Sermon pull
- Devotional pull
- Event pull
- Product pull
- Order pull
- Booking pull
- User profile pull
- Complete per-table cursors
- Complete conflict application
- Remote tombstone reconciliation
- Sync retry screen
- Manual retry button
- Detailed sync error display

### Media Downloads

The download service supports progress and pause/resume APIs, but the app does not yet expose a complete user workflow:

- No sermon catalog connected to downloads
- No devotional media catalog
- No download buttons connected to the manager
- No progress bars in the UI
- No pause/resume controls in the UI
- No offline media library
- No audio player
- No video player
- No checksum validation for downloaded media
- No storage usage management
- No cleanup policy UI
- No Wi-Fi-only setting

### Paynow and Bookings

The backend boundaries exist, but the mobile UI is not connected:

- No donation screen
- No Paynow initiation screen
- No payment method selection UI
- No payment polling UI
- No payment receipt screen
- No booking form
- No booking history
- No booking status screen
- No appointment confirmation workflow

### Realtime

Realtime currently handles limited resources. It does not yet provide complete persistence for:

- Direct messages
- Group messages
- Comments
- Prayers
- Groups
- Live stream state
- Live reactions
- Presence
- User updates

## Missing General-User Features

The following complete screens and workflows are still missing:

- Home feed
- Sermon browsing
- Sermon detail page
- Sermon audio player
- Sermon video player
- Sermon download library
- Devotional list
- Devotional detail
- Events list
- Event detail
- RSVP action
- Community feed
- Testimony feed
- Comment list
- Comment composer
- Fellowship group browser
- Group detail
- Group membership
- Direct-message list
- Direct-message conversation
- Group chat
- Notifications list
- Push notifications
- Store catalog
- Product detail
- Cart
- Orders
- Donation form
- Paynow UI
- Payment status
- Receipt history
- Booking UI
- Live stream player
- Live chat
- Live reactions
- Presence list
- Full profile editor
- Settings screen
- Low-data mode controls
- Storage management
- Translation selection
- Bible pack management

The current five tabs are:

```text
Home
Bible
Community
Prayer
Me
```

These are currently contained in [App.tsx](App.tsx). Most of the non-Bible screens are prototype-level cards and forms rather than complete feature modules.

## Database and Security Risks

### SQLite migration gap

The app has a schema version number, but existing installs may not receive every newly added column because `CREATE TABLE IF NOT EXISTS` does not alter an existing table.

A production migration runner is still required, for example:

```text
migration_001_initial
migration_002_sync_indexes
migration_003_media_fields
migration_004_bible_pack_metadata
migration_005_outbox_retry_fields
```

### Supabase RLS migration not confirmed applied

The RLS migration exists, but it must still be executed and verified in the production Supabase project.

### RLS coverage incomplete until verified

The mobile client depends on authenticated access policies for:

- Users
- Posts
- Comments
- Prayers
- Messages
- Direct messages
- Groups
- Bookings

The production database must be tested with real authenticated and unauthenticated requests.

### Payment security

Paynow credentials are now restricted to the server endpoint. Production verification still requires:

- Paynow webhook deployment
- Signature verification
- Payment status reconciliation
- Receipt persistence
- Idempotent payment handling
- Mobile payment UI

### Bible licensing

The source database contains license URLs and metadata, but the project must still confirm redistribution rights for each bundled/downloadable translation.

Do not bundle copyrighted translations without valid redistribution permission.

### Large Bible import

The 2.8 GB database import requires:

- Equivalent free storage
- User-visible storage estimate
- Cancellation support
- Resume/retry support
- SHA-256 verification after download/copy
- Low-storage error handling
- Progress persistence
- A first-run import experience

### Background execution

Background task registration is implemented, but native execution has not been tested in a standalone Android or iOS development build. Expo static export only validates JavaScript bundling.

## Validation Results

Current validation commands:

```powershell
cd mobile
npm run typecheck
npx expo export --platform android --no-bytecode
npx expo export --platform ios --no-bytecode
```

Verified results:

- TypeScript check passes
- Android bundle passes
- iOS bundle passes
- Bundled KJV pack parses successfully
- KJV pack contains 66 books and 31,102 verses
- Supplied SQLite Bible database integrity check passes
- All 51 source translations converted successfully

The generated all-translation output is approximately 236.7 MB and is not bundled by default.

## Production Readiness Assessment

### Ready or near-ready

- Expo project foundation
- Android/iOS JavaScript bundling
- Local SQLite foundation
- Network monitoring
- Basic offline Bible reader
- Bundled KJV Bible pack
- Bible pack conversion tooling
- Secure token storage foundation
- Basic outbox foundation
- Server-only Paynow credential boundary
- Booking API foundation

### Not production-ready

- Complete general-user product experience
- Full Supabase synchronization
- Full realtime messaging
- Push notifications
- Complete Bible UX
- Shona Bible integration
- Media playback
- Store and ordering
- Payments UI and reconciliation
- Booking UI and status tracking
- Production RLS verification
- Robust SQLite migrations
- Native background task testing
- End-to-end automated tests

## Recommended Next Implementation Order

1. Add proper SQLite migrations.
2. Fix authentication state propagation and profile UI.
3. Complete Bible book/chapter/translation navigation.
4. Add Bible highlights, bookmarks, notes, and reading-plan screens.
5. Add translation picker and optional pack downloads.
6. Build repository interfaces for every feature table.
7. Expand pull synchronization to every required resource.
8. Add complete conflict and tombstone reconciliation.
9. Build community feed, comments, groups, and messaging.
10. Build sermon/devotional browsing and media playback.
11. Build events, bookings, donations, Paynow, and receipts.
12. Add notifications and push notifications.
13. Verify Supabase RLS against production data.
14. Test native Android/iOS background execution.
15. Add automated unit, integration, and device tests.

## Final Assessment

GatewayConnect mobile currently has a credible offline architecture foundation and a working bundled KJV Bible path. The supplied Bible database has been successfully inspected and integrated through an external SQLite import path.

However, the mobile application is still in an early product implementation stage. The general-user features, complete synchronization behavior, Bible navigation, media playback, commerce, messaging, notifications, and production backend verification remain unfinished.
