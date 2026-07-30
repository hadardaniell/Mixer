# Recipe Books — Summary

## What was built

Two distinct ways to share a recipe book between friends. Branch: `feature/shared-books`.

---

## Two sharing modes

### Mode 1 — "View my book" (live link)

User A shares their book with User B. User B gets a **live link** — they see the book exactly as User A has it.

- User B can **view** the book and all its recipes
- User B **cannot** add, edit, or remove recipes (view-only)
- If User A adds or removes recipes, User B sees the change automatically (it's always live)
- User B can **save a copy** at any time → creates their own independent book they can edit freely
- If User A **deletes the book**, User B's live link is **auto-saved** as their own copy and User B gets a notification

This works through the **`shared_items` collection** — the same system used for sharing individual recipes.

---

### Mode 2 — "Cook together" (collaborative book)

User A creates a book and invites User B as a member. Both users co-own the book.

- User B is added with a role: `editor` (can add/remove recipes) or `viewer` (read-only)
- Both users see the same book in their own book lists
- Each user can only add **their own recipes** to the book — recipe ownership never changes
- If User A (owner) **deletes the book**, all members get a notification — there is **no auto-save** for members (the book was already theirs to use, not a shared link)
- Any member can **leave** the book at any time via `DELETE /recipe-books/:id/members/:userId`
- The owner cannot leave — they must delete the book instead

This works through the **`members` array** already on every `RecipeBookDoc`.

---

## How the two modes are different

| | View my book (live link) | Cook together (collaborative) |
|---|---|---|
| Who owns it | Only User A | User A (owner) + all members |
| Where it shows | User B's "Shared with me" (via shares inbox) | Both users' book lists |
| User B can add recipes | ❌ | ✅ (their own recipes only) |
| User B can edit/delete recipes | ❌ | ❌ (only their own) |
| User B can fork it | ✅ (`POST /shares/:id/save`) | ❌ (it's already in their list) |
| Owner deletes the book | User B gets auto-save + notification | All members get a notification (no auto-save) |
| Uses | `shared_items` collection | `members` array on the book |

---

## Data model

### RecipeBookDoc (`recipe_books` collection)

```
{
  ownerId       ObjectId        ← the user who created the book
  name          string
  description   string?
  type          'personal' | 'shared' | 'meal'
  members       RecipeBookMember[]   ← used for collaborative mode
  recipeIds     ObjectId[]           ← IDs of recipes in this book
  tags          string[]
  coverImageUrl string?
  coverKey      string?
  createdAt     Date
  updatedAt     Date
}
```

### RecipeBookMember (embedded in RecipeBookDoc)

```
{
  userId      ObjectId
  role        'owner' | 'editor' | 'viewer'
  addedAt     Date
  invitedBy   ObjectId?
}
```

### SharedItemDoc (`shared_items` collection) — used for Mode 1

```
{
  resourceType   'recipe' | 'book'
  resourceId     ObjectId    ← the original book
  ownerId        ObjectId    ← User A (who shared it)
  friendId       ObjectId    ← User B (who received it)
  status         'pending' | 'accepted' | 'rejected'
  savedAt        null = still a live link  |  Date = saved a copy
  savedResourceId  null  |  ObjectId of the forked copy
  createdAt      Date
}
```

---

## API endpoints

All routes require authentication.

### Book CRUD

| Method | Path | Who can call | What it does |
|---|---|---|---|
| `POST` | `/recipe-books` | any user | Create a new book |
| `GET` | `/recipe-books` | any user | List your books (owned + member of) |
| `GET` | `/recipe-books/:id` | owner, members, live-link friends | View a book |
| `PATCH` | `/recipe-books/:id` | owner, editors | Update book metadata |
| `DELETE` | `/recipe-books/:id` | owner only | Delete book, notify live-link friends (auto-save) and members |

### Recipes in a book

| Method | Path | Who can call | What it does |
|---|---|---|---|
| `POST` | `/recipe-books/:id/recipes/:recipeId` | owner, editors | Add a recipe to the book |
| `DELETE` | `/recipe-books/:id/recipes/:recipeId` | owner, editors | Remove a recipe from the book |

### Collaborative members (Mode 2)

| Method | Path | Who can call | What it does |
|---|---|---|---|
| `POST` | `/recipe-books/:id/members` | owner only | Add a user as member (editor or viewer), sends `BOOK_INVITE` |
| `PATCH` | `/recipe-books/:id/members/:userId` | owner only | Change a member's role |
| `DELETE` | `/recipe-books/:id/members/:userId` | owner (remove anyone) or member (leave) | Remove a member or leave the book |

### Sharing (Mode 1) — via the existing shares system

| Method | Path | What it does |
|---|---|---|
| `POST` | `/shares` | Send a share request (set `resourceType: "book"`) |
| `PUT` | `/shares/:id/accept` | Accept → live link is active, book becomes viewable |
| `PUT` | `/shares/:id/reject` | Reject the share request |
| `POST` | `/shares/:id/save` | Fork the book into your own independent copy |
| `DELETE` | `/shares/:id` | Remove the share (owner revokes → friend gets auto-saved copy) |
| `GET` | `/shares/received` | Your share inbox |
| `GET` | `/shares/sent` | Your sent shares |

---

## Notifications

| Type | Category | When it fires | Who receives it | Payload |
|---|---|---|---|---|
| `SHARE_REQUEST` | Actionable | User A shares a book with User B | User B | `fromUserId, fromUserName, resourceType, resourceId, resourceName, shareId` |
| `SHARE_ACCEPTED` | Informational | User B accepts the share | User A | `fromUserId, fromUserName, resourceType, resourceId, resourceName` |
| `SHARE_REJECTED` | Informational | User B rejects the share | User A | `fromUserId, fromUserName, resourceType, resourceId, resourceName` |
| `OWNER_DELETED_RESOURCE` | Informational | Owner deleted a book — live-link friend gets auto-save | live-link friend | `fromUserId, fromUserName, resourceType, resourceName, savedCopyId` |
| `OWNER_DELETED_RESOURCE` | Informational | Owner deleted a collaborative book | each member | same as above but `savedCopyId: ""` (no copy made) |
| `BOOK_INVITE` | Informational | Owner adds someone as a member | new member | `fromUserId, fromUserName, bookId, bookName, role` |

**Note on `OWNER_DELETED_RESOURCE` for members:** `savedCopyId` is an empty string `""` when sent to collaborative members (as opposed to live-link friends who get an actual copy ID). The mobile app can check `savedCopyId === ""` to know no copy was created.

---

## Access control rules

| Action | owner | editor member | viewer member | live-link friend | no relation |
|---|---|---|---|---|---|
| View book (`GET /recipe-books/:id`) | ✅ | ✅ | ✅ | ✅ | ❌ |
| Edit book metadata (`PATCH`) | ✅ | ✅ | ❌ | ❌ | ❌ |
| Add/remove recipes | ✅ | ✅ | ❌ | ❌ | ❌ |
| Manage members | ✅ | ❌ | ❌ | ❌ | ❌ |
| Delete book | ✅ | ❌ | ❌ | ❌ | ❌ |
| Leave book | N/A | ✅ | ✅ | N/A | N/A |
| Fork book (`POST /shares/:id/save`) | N/A | N/A | N/A | ✅ | ❌ |

---

## What was tested

All scenarios were manually tested against a running server:

**Mode 1 — View my book (live link):**
- ✅ User A shares a book → User B gets `SHARE_REQUEST` notification with correct `resourceType: "book"`
- ✅ User B accepts → live link active, `SHARE_ACCEPTED` sent to User A
- ✅ User B can view `GET /recipe-books/:id` via the live link
- ✅ User B cannot add a recipe to the book (403 `editor or owner only`)
- ✅ User B saves their own copy → new book appears in User B's list owned by User B
- ✅ User A deletes book while User C has a live link → User C gets auto-saved copy + `OWNER_DELETED_RESOURCE` notification → original book returns 404

**Mode 2 — Cook together (collaborative):**
- ✅ User A creates `type: "shared"` book and adds User B as `editor`
- ✅ User B receives `BOOK_INVITE` notification with `bookName` and `role`
- ✅ Book immediately appears in User B's book list
- ✅ User B (editor) creates a recipe and adds it to the book successfully
- ✅ User A deletes collaborative book → User B gets `OWNER_DELETED_RESOURCE` with `savedCopyId: ""` → book removed from User B's list

---

## Files changed

| File | What changed |
|---|---|
| `apps/api/src/modules/recipe-books/recipe-books.routes.ts` | `GET /:id` allows live-link friends; `DELETE /:id` notifies live-link friends (auto-save) and members; `POST /:id/members` sends `BOOK_INVITE` notification |
| `apps/api/src/services/notification.service.ts` | Added `BOOK_INVITE` to `NotificationPayloadMap` |
| `apps/api/src/db/types.ts` | Added `BOOK_INVITE` to `NotificationDoc.type` union |
| `apps/api/src/db/validators/notifications.ts` | Added `BOOK_INVITE` to the `$jsonSchema` enum |
| `apps/api/src/plugins/mongo.ts` | Text index on recipes: added `default_language: "none"` + `language_override` to fix Hebrew field conflict; friendships: drops stale `requesterId_1_recipientId_1` index before recreating with `addresseeId` |
