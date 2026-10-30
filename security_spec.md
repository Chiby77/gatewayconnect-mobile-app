# Security Specification (`security_spec.md`)

## 1. Data Invariants
1. **Default-Deny Safety Net**: Every unmatched path is strictly denied (`allow read, write: if false;`).
2. **Verified Identity**: All write operations require `isSignedIn() && request.auth.token.email_verified == true`.
3. **PII Isolation**: `/users/{userId}` stores only public display fields (`uid`, `name`, `handle`, `memberId`, `badgeType`, `createdAt`, `updatedAt`). Personal contact details (`email`, `phone`, `location`) live exclusively in `/users/{userId}/private/{docId}` where `get` and `write` are restricted to `request.auth.uid == userId` and `exists(/databases/$(database)/documents/users/$(userId))`.
4. **Strict Keys & Anti-Update-Gap**: Every `create` and `update` invokes `isValid[Entity](incoming())` enforcing `hasAll`, `hasOnly`, string `.size()` bounds, regex IDs (`^[a-zA-Z0-9_\-]+$`), immutable ownership (`authorId`, `ownerId`, `uid`), immutable `createdAt`, and server timestamps (`request.time`).
5. **Query Enforcer**: `allow list` rules explicitly validate `resource.data` (e.g., `resource.data.ownerId == request.auth.uid` on `/givingReceipts`, `resource.data.status in ['active', 'answered']` on `/prayerRequests`) without any `get()` or `exists()` calls inside `list`.

## 2. The "Dirty Dozen" Payloads
1. **Unverified Email Write**: Authenticated user with `email_verified: false` creating a `/prayerRequests/{id}` doc -> `PERMISSION_DENIED`.
2. **Identity Spoofing on Create**: Creating `/prayerRequests/{id}` where `authorId != request.auth.uid` -> `PERMISSION_DENIED`.
3. **Shadow Field Injection on Create**: Creating `/users/{uid}` with extra field `isAdmin: true` -> `PERMISSION_DENIED`.
4. **Shadow Field Injection on Update**: Updating `/prayerRequests/{id}` with an unapproved field `role: 'super_admin'` -> `PERMISSION_DENIED`.
5. **PII Leak Attempt**: Authenticated user `userB` attempting `get` on `/users/userA/private/info` -> `PERMISSION_DENIED`.
6. **Orphaned Subcollection Write**: Creating `/users/userA/private/info` when parent `/users/userA` does not exist -> `PERMISSION_DENIED`.
7. **ID Poisoning Attack**: Creating `/decrees/{badId}` with non-alphanumeric characters or length > 128 -> `PERMISSION_DENIED`.
8. **Oversized String Resource Exhaustion**: Creating `/prayerRequests/{id}` with a 5,000-char `body` (max 1000) -> `PERMISSION_DENIED`.
9. **Client Timestamp Forgery**: Creating `/decrees/{id}` where `createdAt != request.time` -> `PERMISSION_DENIED`.
10. **Immutable Field Mutation**: Updating `/prayerRequests/{id}` while changing `createdAt` or `authorId` -> `PERMISSION_DENIED`.
11. **Terminal State Mutation**: Attempting to update a `/givingReceipts/{id}` document after creation (`status == 'completed'`) -> `PERMISSION_DENIED`.
12. **Unauthorized List Scraping**: Listing `/givingReceipts` without constraining `resource.data.ownerId == request.auth.uid` -> `PERMISSION_DENIED`.
