# Recipe Sharing Feature — Summary

## What was built

A sharing system for recipes and recipe books. Branch: `feature/share-recipes-with-friends`.

---

## How sharing works (user flow)

### Sending a share
1. User A sends a share request to User B for a recipe or book they own
2. User B gets a **notification** with the request
3. User B can **accept** or **reject** it

### After accepting — two modes
When User B accepts, they get a **live link** to User A's recipe:
- They see the recipe exactly as the owner has it
- If User A edits the recipe, User B sees the updated version automatically
- If User A deletes the recipe → User B's copy is **automatically saved** for them + they get a notification

User B can also choose to **save the recipe** — this creates their own independent copy (fork):
- They can now edit it freely
- Changes by User A no longer affect them
- They can re-share it with other users

### Re-sharing rules
- A recipe can only be re-shared if the user has saved it (owns a copy)
- You cannot re-share a live-link recipe

---

## Data model

One new collection: `shared_items`

```
{
  resourceType   'recipe' | 'book'
  resourceId     → the original recipe/book
  ownerId        → who shared it
  friendId       → who received it
  status         'pending' | 'accepted' | 'rejected'
  savedAt        null = live link  |  Date = saved a copy
  savedResourceId  null  |  ID of the forked copy
  createdAt
}
```

---

## API endpoints

All routes require authentication.

| Method | Path | Description |
|---|---|---|
| `POST` | `/shares` | Send a share request |
| `PUT` | `/shares/:id/accept` | Accept a pending share |
| `PUT` | `/shares/:id/reject` | Reject a pending share |
| `POST` | `/shares/:id/save` | Fork the recipe into your own copy |
| `DELETE` | `/shares/:id` | Remove a share (friend removes it, or owner revokes) |
| `GET` | `/shares/received` | Inbox — shares sent to you |
| `GET` | `/shares/sent` | Outbox — shares you sent |

All list endpoints support `?status=pending|accepted|rejected&limit=&skip=` query params.

---

## For the notifications team

We created a stub at `apps/api/src/services/notification.service.ts`. You need to implement the `sendNotification` function — it currently just logs to console.

The function signature:
```ts
sendNotification(userId: string, type: NotificationType, payload: NotificationPayload[T])
```

The notification types we send from sharing:

| Type | When it fires | Payload |
|---|---|---|
| `SHARE_REQUEST` | Someone shares a recipe/book with you | `fromUserId, resourceType, resourceId, resourceName, shareId` |
| `SHARE_ACCEPTED` | Your share request was accepted | `fromUserId, resourceType, resourceId, resourceName` |
| `SHARE_REJECTED` | Your share request was rejected | `fromUserId, resourceType, resourceId, resourceName` |
| `OWNER_DELETED_RESOURCE` | Owner deleted something shared with you — we auto-saved a copy | `fromUserId, resourceType, resourceName, savedCopyId` |

---

## For the mobile team

**Known pre-existing issue to be aware of:** `GET /recipes/:id` has no authentication middleware, so private recipes return `403` even to their owner. Forked recipes are created as private — this means a user can't fetch their own forked recipe by ID until this route is fixed. This is not a sharing bug — it exists across the whole recipes API.

---

## What was tested

All scenarios were manually tested against a running server:
- ✅ Send share request
- ✅ Duplicate share blocked (409)
- ✅ Inbox returns pending shares
- ✅ Accept share
- ✅ Save (fork) a live-link recipe
- ✅ Owner deletes recipe → auto-fork created for live-link friends → share records cleaned up → original deleted
