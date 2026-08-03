# Notification System — Summary

## What was built

A full in-app + push notification system. Branch: `feature/push-notifications` (extends `feature/notifications`).

---

## How notifications work (user flow)

When something happens that affects a user (a share request, a friend request, etc.) the server:
1. Inserts a notification document into that user's inbox (always)
2. Sends an Expo push notification to all of the user's registered devices (best-effort — failure does not affect the in-app notification)

The mobile app polls `GET /notifications` to show a bell badge and notification list. Push notifications also appear as system banners on the device.

There are two categories:

### Actionable notifications
The user must respond to these — they represent a pending decision.
- `SHARE_REQUEST` — someone shared a recipe/book with you → go to your shares inbox
- `FRIEND_REQUEST` — someone sent you a friend request → accept or reject

These have **no expiry** (`expiresAt = null`). They are **deleted** (not just marked read) once the user acts on them (accept/reject). This keeps the inbox clean automatically.

### Informational notifications
These are "FYI" alerts — no action needed.
- `SHARE_ACCEPTED` — your share was accepted
- `SHARE_REJECTED` — your share was rejected
- `OWNER_DELETED_RESOURCE` — owner deleted something shared with you, we auto-saved a copy
- `FRIEND_ACCEPTED` — your friend request was accepted
- `FRIEND_UNFRIENDED` — someone removed you as a friend
- `BOOK_INVITE` — you were invited to collaborate on a recipe book

These **expire automatically after 30 days** via a MongoDB TTL index. They are **marked read** (not deleted) when acknowledged.

---

## Data model

### Notifications collection

```
{
  userId       ObjectId    ← who receives this notification
  type         enum        ← one of the 8 types listed above
  payload      object      ← type-specific data (see payload table below)
  read         boolean
  createdAt    Date
  expiresAt    Date | null ← null = actionable (never auto-deleted), Date = 30-day TTL
}
```

### Push tokens collection (`push_tokens`)

One document per device per user. A user who uses the app on two phones has two rows.

```
{
  userId       ObjectId
  token        string      ← Expo push token, refreshed on every app launch
  deviceId     string      ← UUID generated on first launch, stored in MMKV
  platform     'ios' | 'android'
  createdAt    Date
  lastSeenAt   Date        ← updated on every launch so stale tokens can be identified
}
```

### Indexes
```
notifications:
  { userId, read, createdAt }   main list query — user's inbox, filter by read, newest first
  { expiresAt }  TTL sparse     MongoDB auto-deletes documents when expiresAt is reached
  { userId, type }              used when dismissing a specific notification type on action

push_tokens:
  { userId, deviceId }  unique  one row per device; upsert on app launch refreshes the token
  { token }                     fast lookup when Expo reports an invalid/expired token
```

### DB validators
`$jsonSchema` validators are applied at startup for both collections (in `db/validators/notifications.ts` and `db/validators/push-tokens.ts`). MongoDB rejects any write that doesn't match the expected shape.

---

## API endpoints

All routes require authentication. Users can only see and modify their own notifications.

| Method | Path | What it does |
|---|---|---|
| `GET` | `/notifications` | List your notifications. Supports `?read=true/false&limit=&skip=`. Returns `items`, `total`, `unreadCount` |
| `PUT` | `/notifications/:id/read` | Mark one as read. Actionable types → **deleted**. Informational → **marked read** |
| `PUT` | `/notifications/read-all` | Batch: deletes all actionable, marks all informational as read |
| `DELETE` | `/notifications/:id` | Explicit delete by the user |
| `PUT` | `/users/me/push-token` | Register or refresh a device's Expo push token. Called by the mobile app on startup after permission is granted. Upserts on `{ userId, deviceId }` |

---

## Notification payloads

| Type | Sent to | Payload fields |
|---|---|---|
| `SHARE_REQUEST` | recipient | `fromUserId, fromUserName, resourceType, resourceId, resourceName, shareId` |
| `SHARE_ACCEPTED` | owner | `fromUserId, fromUserName, resourceType, resourceId, resourceName` |
| `SHARE_REJECTED` | owner | `fromUserId, fromUserName, resourceType, resourceId, resourceName` |
| `OWNER_DELETED_RESOURCE` | friend | `fromUserId, fromUserName, resourceType, resourceName, savedCopyId` |
| `FRIEND_REQUEST` | recipient | `fromUserId, fromUserName, fromUserAvatar, friendshipId` — actionable, no TTL, deleted on accept/reject |
| `FRIEND_ACCEPTED` | requester | `fromUserId, fromUserName, fromUserAvatar` — informational, 30-day TTL |
| `FRIEND_UNFRIENDED` | the other user | `fromUserId, fromUserName, fromUserAvatar` — informational, 30-day TTL |
| `BOOK_INVITE` | new member | `fromUserId, fromUserName, bookId, bookName, role` — informational, 30-day TTL |

---

## Where notifications are triggered

Sending is done via `notificationService.send(userId, type, payload)` in `apps/api/src/services/notification.service.ts`. The service handles both DB insert and push delivery.

**Share routes** (`modules/shares/shares.routes.ts`):

| Action | Notification fired |
|---|---|
| `POST /shares` | `SHARE_REQUEST` → recipient |
| `PUT /shares/:id/accept` | `SHARE_ACCEPTED` → owner, `SHARE_REQUEST` deleted from accepter's inbox |
| `PUT /shares/:id/reject` | `SHARE_REJECTED` → owner, `SHARE_REQUEST` deleted from rejecter's inbox |
| `DELETE /shares/:id` *(owner revokes)* | `OWNER_DELETED_RESOURCE` → friend |

**Friend routes** (`modules/friendships/friendships.routes.ts`):

| Action | Notification fired |
|---|---|
| `POST /friends/request` | `FRIEND_REQUEST` → target user |
| `PUT /friends/:id/accept` | `FRIEND_ACCEPTED` → requester, `FRIEND_REQUEST` deleted from accepter's inbox |
| `DELETE /friends/request/:id` | nothing — `FRIEND_REQUEST` deleted from inbox |
| `DELETE /friends/:id` *(unfriend)* | `FRIEND_UNFRIENDED` → the other user |

**Recipe book routes** (`modules/recipe-books/recipe-books.routes.ts`):

| Action | Notification fired |
|---|---|
| `POST /recipe-books/:id/members` | `BOOK_INVITE` → each newly added member |
| `DELETE /recipe-books/:id` | `OWNER_DELETED_RESOURCE` → all members (with their saved copy ID) |

---

## Push notification architecture

### How push delivery works (API side)

`notification.service.ts` → after inserting the in-app notification:
1. Fetches the recipient user's `locale` (`he` or `en`)
2. Fetches all their registered device tokens from `push_tokens`
3. Builds the push message title + body using `push-messages.ts`
4. Sends a batch request to the Expo push API (`https://exp.host/--/api/v2/push/send`)

Push is **fire-and-forget** — failure is logged but never throws, so the in-app notification always succeeds.

### Push message text

Push text lives in `apps/api/src/services/push-messages.ts`. The strings deliberately mirror the locale files in `apps/mobile/src/locales/` (both `en.json` and `he.json`). The API uses the user's `locale` field on `UserDoc` to pick the right language.

### Mobile push token registration

`usePushTokenRegistration` hook (`features/notifications/hooks/usePushTokenRegistration.ts`):
- Called once in the authenticated tabs layout `(tabs)/_layout.tsx`
- **No-ops on web** (`Platform.OS === 'web'`) — push is native-only
- **No-ops on simulators** (`Device.isDevice === false`) — Expo push tokens only work on physical devices
- Requests system permission (iOS shows the native "Allow Notifications?" dialog on first launch; Android 13+ also requires a runtime permission)
- Gets the Expo push token using the project's EAS `projectId`
- Persists a stable `deviceId` UUID in MMKV storage (so reinstalling refreshes the token rather than creating a duplicate)
- Calls `PUT /users/me/push-token` with `{ token, deviceId, platform }`
- Any failure is silently swallowed — push registration must never crash the app

### Foreground notification display

`Notifications.setNotificationHandler` is set at module load time in the hook file. When the app is open and a push arrives, it still shows as a banner with sound.

---

## Mobile notification display (in-app)

`notificationContent.ts` (`features/notifications/lib/notificationContent.ts`) maps each notification type to:
- An icon (from `lucide-react-native`)
- A color token
- Localized title + body (via i18next, from `locales/en.json` / `locales/he.json`)
- An optional deep-link route (tapping the notification row opens the relevant screen)
- For actionable types: an accept/decline action descriptor

### Locale keys (under `notifications.items`)

| Key | Used for |
|---|---|
| `shareRequest` | `SHARE_REQUEST` |
| `shareAccepted` | `SHARE_ACCEPTED` |
| `shareRejected` | `SHARE_REJECTED` |
| `ownerDeleted` | `OWNER_DELETED_RESOURCE` |
| `friendRequest` | `FRIEND_REQUEST` |
| `friendAccepted` | `FRIEND_ACCEPTED` |
| `friendUnfriended` | `FRIEND_UNFRIENDED` |
| `bookInvite` | `BOOK_INVITE` |

---

## Files changed

| File | What changed |
|---|---|
| `apps/api/src/db/types.ts` | Added `PushTokenDoc`, added `'BOOK_INVITE'` to `NotificationDoc.type` |
| `apps/api/src/db/validators/push-tokens.ts` | New — `$jsonSchema` validator for `push_tokens` |
| `apps/api/src/db/validators/notifications.ts` | Added `'BOOK_INVITE'` to the type enum |
| `apps/api/src/db/validators/index.ts` | Registered `push_tokens` validator |
| `apps/api/src/plugins/mongo.ts` | Added `pushTokens` collection, added both `push_tokens` indexes |
| `apps/api/src/services/notification.service.ts` | Added `BOOK_INVITE` to payload map, added real Expo push delivery (replaced TODO) |
| `apps/api/src/services/push-messages.ts` | New — push title + body strings for all 8 types in `en` and `he` |
| `apps/api/src/modules/users/users.routes.ts` | Added `PUT /users/me/push-token` endpoint |
| `packages/contracts/src/index.ts` | Added `BookInvitePayloadSchema`, `'BOOK_INVITE'` to type enum and discriminated union |
| `apps/mobile/app.config.ts` | Added `expo-notifications` plugin |
| `apps/mobile/src/shared/config/storage.native.ts` | Added `deviceId` to `StorageKeys` |
| `apps/mobile/src/features/notifications/hooks/usePushTokenRegistration.ts` | New — permission request + token registration hook |
| `apps/mobile/app/(tabs)/_layout.tsx` | Wired `usePushTokenRegistration` hook |
| `apps/mobile/src/features/notifications/lib/notificationContent.ts` | Added `BOOK_INVITE` case |
| `apps/mobile/src/locales/en.json` | Added `notifications.items.bookInvite` |
| `apps/mobile/src/locales/he.json` | Added `notifications.items.bookInvite` |
