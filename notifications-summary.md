# Notification System — Summary

## What was built

A full in-app notification system for user inbox alerts. Branch: `feature/notifications`.

---

## How notifications work (user flow)

When something happens that affects a user (a share request, a friend request, an accepted share, etc.) the server inserts a notification document into that user's inbox. The mobile app polls `GET /notifications` to show a bell badge and notification list.

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

These **expire automatically after 30 days** via a MongoDB TTL index. They are **marked read** (not deleted) when acknowledged.

---

## Data model

One collection: `notifications`

```
{
  userId       ObjectId    ← who receives this notification
  type         enum        ← one of the 7 types listed above
  payload      object      ← type-specific data (see payload table below)
  read         boolean
  createdAt    Date
  expiresAt    Date | null ← null = actionable (never auto-deleted), Date = 30-day TTL
}
```

### Indexes
```
{ userId, read, createdAt }   main list query — user's inbox, filter by read, newest first
{ expiresAt }  TTL sparse     MongoDB auto-deletes documents when expiresAt is reached
{ userId, type }              used when dismissing a specific notification type on action
```

### DB validator
A `$jsonSchema` validator is applied at startup (in `db/validators/notifications.ts`). MongoDB rejects any write that doesn't match the shape above — protects against bugs in any future writer (API, migrations, manual shell commands).

---

## API endpoints

All routes require authentication. Users can only see and modify their own notifications.

| Method | Path | What it does |
|---|---|---|
| `GET` | `/notifications` | List your notifications. Supports `?read=true/false&limit=&skip=`. Returns `items`, `total`, `unreadCount` |
| `PUT` | `/notifications/:id/read` | Mark one as read. Actionable types → **deleted**. Informational → **marked read** |
| `PUT` | `/notifications/read-all` | Batch: deletes all actionable, marks all informational as read |
| `DELETE` | `/notifications/:id` | Explicit delete by the user |

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

---

## Where notifications are triggered today

Sending is done via `notificationService.send(userId, type, payload)` in `apps/api/src/services/notification.service.ts`.

**Share routes** (`modules/shares/shares.routes.ts`) — all wired and tested:

| Action | Notification fired | Side effect |
|---|---|---|
| `POST /shares` | `SHARE_REQUEST` → recipient | — |
| `PUT /shares/:id/accept` | `SHARE_ACCEPTED` → owner | `SHARE_REQUEST` deleted from accepter's inbox |
| `PUT /shares/:id/reject` | `SHARE_REJECTED` → owner | `SHARE_REQUEST` deleted from rejecter's inbox |
| `DELETE /shares/:id` *(owner revokes)* | `OWNER_DELETED_RESOURCE` → friend | — |

**Friend routes** (`modules/friendships/friendships.routes.ts`) — all wired and tested:

| Action | Notification fired | Side effect |
|---|---|---|
| `POST /friends/request` | `FRIEND_REQUEST` → target user | — |
| `PUT /friends/:id/accept` | `FRIEND_ACCEPTED` → requester | `FRIEND_REQUEST` deleted from accepter's inbox |
| `DELETE /friends/request/:id` | nothing | `FRIEND_REQUEST` deleted from the right inbox (reject or cancel) |
| `DELETE /friends/:id` *(unfriend)* | `FRIEND_UNFRIENDED` → the other user | — |

---

---

## What was tested

All scenarios were manually tested against a running server:

**Shares:**
- ✅ Share request creates a `SHARE_REQUEST` notification for recipient
- ✅ Accepting a share sends `SHARE_ACCEPTED` to owner and deletes `SHARE_REQUEST` from inbox
- ✅ Rejecting a share sends `SHARE_REJECTED` to owner and deletes `SHARE_REQUEST` from inbox
- ✅ Owner deleting an accepted share sends `OWNER_DELETED_RESOURCE` to friend

**Friend requests:**
- ✅ Sending a friend request creates `FRIEND_REQUEST` in recipient's inbox with sender name and friendshipId
- ✅ Accepting a friend request sends `FRIEND_ACCEPTED` to requester and deletes `FRIEND_REQUEST` from accepter's inbox
- ✅ Rejecting/cancelling a request deletes `FRIEND_REQUEST` from the correct inbox
- ✅ Unfriending sends `FRIEND_UNFRIENDED` to the other user

**Notification endpoints:**
- ✅ `GET /notifications` returns correct `unreadCount`
- ✅ `PUT /notifications/read-all` clears inbox correctly
- ✅ `PUT /notifications/:id/read` deletes actionable, marks informational as read

---

## Push notifications (future)

The `expoPushToken` field already exists on `UserDoc`. The service has a commented-out TODO block for sending Expo push notifications. Once the mobile team integrates push token registration, uncomment and implement that block in `notification.service.ts`.
