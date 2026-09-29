# Chat + Community rebuild — what changed and what you still need to do

## What was actually broken (not just styling)

1. **Chat never connected in production.** `ChatScreen.tsx` used `client.devToken()`. Stream rejects
   dev tokens unless "Disable Auth Checks" is on for the app — off by default, and something you'd
   never want on for a production church app anyway. There was no server issuing real tokens.
2. **Community wasn't a feed.** `CommunityScreen.tsx` was a testimony *form* (title + textarea +
   "Save testimony") with static "Fellowship Groups" / "Upcoming Events" placeholders. There was no
   posting, liking, commenting, or following — nothing IG-style existed to restyle.
3. **The chat theme didn't apply.** The old theme used v8 keys (`messageSimple`, `messageInput`, …).
   The installed SDK is v9 (`stream-chat-expo@9.9.1`), which reads brand color from `theme.semantics.*`
   — a different shape entirely. The old object was silently ignored.
4. **Header collides with the status bar on Android** (visible in your screenshots — "89%" overlapping
   "GATEWAY CHURCH"). There was no `SafeAreaProvider` anywhere in the tree, and `App.tsx` guessed the
   status bar height with `StatusBar.currentHeight`. Expo SDK 57 always draws Android edge‑to‑edge, so
   that guess is unreliable. Fixed at the root (see below) — this also fixes the tab bar sitting under
   the gesture nav bar on some devices.
5. **`npm ci` was broken.** `package-lock.json` was out of sync with `package.json` (this is what EAS
   Build runs — `npm install` locally was masking it). Fixed; verified `npm ci` from a clean checkout.

## What was added

- **`server/api/stream/token.ts`** — a real token endpoint. Drop it into your Vercel project at
  `api/stream/token.ts`. It verifies the caller's Supabase session server-side and mints a Stream
  token for that verified user only — no user id is ever accepted from the client, so nobody can mint
  a token for someone else. Needs `STREAM_API_KEY`, `STREAM_API_SECRET`,
  `SUPABASE_SERVICE_ROLE_KEY` in Vercel, and `npm i stream-chat @supabase/supabase-js` in that repo.
- **`src/stream/`** — client setup: `StreamRoot.tsx` (mounts Chat + Feeds once, at the app root, with
  a live unread count), `theme.ts` (brand: your green/gold applied to v9 `semantics`), `overrides.tsx`
  (WhatsApp-style in-bubble timestamp + read ticks + sender name), `auth.ts`/`config.ts`.
- **`src/screens/chat/`** — chat list (search, All/Unread/Groups/Direct filters, a "Gateway Support"
  entry that opens a DM with your church's support inbox), new chat/new group sheet, and the chat room
  itself (custom header with mute/leave, thread replies disabled to keep it flat like WhatsApp).
- **`src/screens/feed/`** — the Community rebuild: Following/Explore tabs, an Instagram-style post
  card (double-tap to like, comments count, delete your own posts), a full-screen composer (caption +
  up to 4 photos), a live comments sheet, follow/unfollow, and a "Find people" screen.
- Old `ChatScreen.tsx` / `CommunityScreen.tsx` moved to `src/screens/_deprecated/*.bak` — not deleted,
  not wired in anywhere, so nothing is silently lost. Safe to delete once you've confirmed you don't
  need anything from them.

## You still need to do this before it works end-to-end

1. **Deploy the token endpoint.** Copy `server/api/stream/token.ts` into your GatewayConnect API repo,
   set its three env vars, deploy, then set `EXPO_PUBLIC_API_URL` in this app's `.env` to that domain.
2. **Set `EXPO_PUBLIC_STREAM_API_KEY`** (already read by `.env.example` — just needs a real value).
3. **In the Stream Dashboard:** enable Chat + Feeds v3 on your app, create the `foryou` feed group's
   `popular` selector (Explore tab is empty without this — it's server-side config, not app code:
   `UpdateFeedGroup --id foryou --request '{"activity_selectors":[{"type":"popular","min_popularity":1,"cutoff_window":"7d"}]}'`).
4. **Optional:** set `EXPO_PUBLIC_CHURCH_FEED_IDS` (comma-separated Stream user ids of staff/leaders)
   so a brand-new member's Community "Following" tab isn't empty on first open.
5. **Rebuild the dev client** — new native modules were added (`react-native-reanimated` upgraded to
   4.5.2, `react-native-teleport`, Feeds SDK). Expo Go won't work: run
   `npx expo prebuild --clean && npx expo run:android` (or an EAS dev build).

## Design notes

- Chat bubbles: your forest green for outgoing, dark grey incoming, gold ticks/links — matches your
  Home screen gold-on-charcoal look, not Stream's default blue.
- "Gateway Support" is a real Stream user (`gateway-support`, auto-created by the token endpoint).
  Members DM it for help; your team answers by connecting to that user id from the Stream dashboard or
  a staff-side app — there's no separate support backend to run.
- Community posting uses your existing photo-picker permission strings; `app.json` was updated with
  the iOS `NSPhotoLibraryUsageDescription` and the `expo-image-picker` plugin config it needs.
