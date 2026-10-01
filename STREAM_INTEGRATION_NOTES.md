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

---

## Round 2 — real color theme, "unavailable" bug, sermons, auth

### Color theme — pulled from the actual live site, not guessed
Found the GitHub repo behind gatewayconnect.joedaniels.org and read its `src/index.css` directly.
`src/theme/colors.ts` now matches it exactly: navy background (`#0b0f19`/`#131d31`), IG-blue `#0095f6`
for interactive/social elements (Follow, links, active tabs), church gold `#f59e0b` kept for brand
elements (Give, badges) exactly as before, and — notably — the site's chat UI hardcodes **real
WhatsApp dark-mode hex values** (`#005c4b` outgoing / `#202c33` incoming / `#e9edef` text), which is
now applied pixel-for-pixel in `src/stream/theme.ts`. Every existing `Colors.*` token name was kept
(31 files reference them), only values changed, so nothing else needed touching.

### "Chat/Community unavailable sometimes" — found and fixed the actual cause
This traced to `src/remote/supabase.ts`: the Supabase client was missing React Native's required
`AppState`-driven `startAutoRefresh()`/`stopAutoRefresh()` wiring (this is Supabase's own documented
RN requirement, not optional). Without it, a session's access token can sit expired in storage after
any normal background/foreground cycle — not an edge case, normal phone usage — and every Supabase
call after that (chat token issuance, posts, sermons, prayer requests) silently fails auth until the
app is force-quit. Fixed in `supabase.ts`, plus an `onAuthStateChange` listener in `authService.ts`
(`initAuthListener`, wired into `App.tsx`) so a genuinely dead session clears the stale cached profile
instead of the app showing "logged in" while nothing actually works.

On top of that root-cause fix, `StreamRoot.tsx` now retries quietly with backoff before showing an
error, and auto-retries the moment the device reports back online — so a single network blip (very
real on the connections most members are on) no longer stalls chat until someone taps "Try again".
Chat offline caching is also now on (`enableOfflineSupport` + `@op-engineering/op-sqlite`) — chat
history is available from cache before a connection even lands.

### Sermons not showing — root cause was the sync engine, not the Sermon screen
`SermonScreen` was fine. The bug was in `src/sync/syncEngine.ts`: it queried every Supabase table with
`.order('updated_at', ...)`, but checking the actual schema (`supabase/migrations/`), only `users` and
`group_members` have an `updated_at` column — `sermons`, `devotionals`, `events`, `products`, and
**`prayer_requests`** only have `created_at`. Ordering by a column that doesn't exist makes Postgres
error, and the sync loop swallowed that error silently — so sermons (and devotionals/events/products/
prayer requests) have never actually synced from Supabase into the app, on any device, since day one.
Fixed to use the right column per table. Also removed four pulls (`notifications`, `groups`,
`community_comments`, `content_items`) that queried tables which don't exist in your schema at all —
Community doesn't need them any more now that it runs on Stream Feeds directly.

### Still open for the next pass
- Sermon screen redesign to the new theme (data now actually arrives — the display itself hasn't been
  restyled yet).
- Repost, IG-style profile (editable avatar/username, suggested follows, post grid), and Reels —
  designed but not yet built. Reels/Stories/unified-search are also things eonchat.online's own
  marketing copy names as their feature set, useful as a target list for scoping that work.

---

## Round 3 — Repost, IG-style profile, Reels, sermon screen redesign

### Repost
Real Stream Feeds primitive, not a manual copy: `client.addActivityReaction({ activity_id, type: 'repost', target_feeds: [ownFeed.feed] })` creates a reference activity in the reposter's own feed whose `parent` field embeds the original - tracked via `share_count` / `queryActivityShares`. `PostCard.tsx` renders a "Reposted by X" strip and delegates every interaction (like, comment, re-repost) to the embedded original, exactly like a Twitter retweet. Undo looks up the created share via `queryActivityShares` and deletes both it and the reaction. Also added the double-tap heart-burst animation (Reanimated spring) matching your reference site's motion.

### IG-style profile (`src/screens/feed/ProfileFeedScreen.tsx`)
- Editable avatar: uploads to your existing Supabase `avatars` storage bucket (confirmed against its real
  RLS policy in your migrations), then goes through the same `updateProfile()` your app already had -
  so it updates Supabase, the local cache, and (on next Stream connect) the Stream user's image too.
- Editable name/username/bio/website via `EditProfileSheet.tsx`.
- Live follower/following counts pulled from Stream's real follow graph (`useFollowers`/`useFollowing`),
  not a manually-maintained counter.
- "Suggested for you" horizontal strip, 3-column post grid (`PostGrid.tsx`) with a full post view on tap.
- Every avatar tap across Community now opens the tapped person's profile (`onOpenProfile` wired through
  `App.tsx`); your own existing Settings screen (sign out, badges, downloads, password, legal - all real,
  untouched) is one tap away behind a gear icon rather than being replaced.

### Reels
Vertical swipe video feed (`ReelsScreen.tsx` + `ReelItem.tsx`), added as a third segment (Following /
Explore / Reels) inside Community. Uses `expo-video`'s `useVideoPlayer`; only the on-screen reel plays
(tracked via `onViewableItemsChanged`), autoplay pauses off-screen, tap to mute/unmute, like/comment/
delete overlaid IG-Reels-style. `Composer.tsx` now supports picking a short video (90s cap) instead of
photos - it uploads via `client.uploadFile` and posts are then just filtered client-side by attachment
type to populate Reels. **Known scope gap:** no thumbnail/poster image is generated for video posts yet
(would need `expo-video`'s native thumbnail extraction + a second upload) - `PostGrid` shows a video icon
placeholder for these instead of a frame preview.

### Sermon screen — redesign
Found the actual bug: `SermonScreen.tsx` already imported the shared `Colors` tokens but large parts of
its `StyleSheet` hardcoded an old, disconnected palette instead of using them (`#dfa732`, `#10141e`,
`#0e121a`, `#161a24`, `#18181b`, `#09090b`, and others) - so even after the app-wide theme was corrected
in earlier rounds, this screen kept rendering the stale look. Every one of those is now mapped to the
real theme tokens (`Colors.gold`, `Colors.bgCard`, `Colors.bgSecondary`, `Colors.border`,
`Colors.textInverse`), including inside the raw HTML strings used for the audio-sermon loading screen.
Left as intentional: video player frames stay pure black (correct for any video player), and the
"Watch on YouTube" buttons keep YouTube's own red rather than the app's rose danger color, since that's
brand recognition for an external link, not an error state.
