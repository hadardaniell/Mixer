import { z } from "zod";

export const SyncContactsRequestSchema = z.object({
  contacts: z.array(z.string()).describe("List of phone numbers in E.164 format"),
});

export const SyncedContactSchema = z.object({
  _id: z.string(),
  displayName: z.string().optional(),
  phoneNumber: z.string(),
  avatarUrl: z.string().optional(),
  friendshipStatus: z.enum(["pending", "accepted", "rejected", "blocked", "none"]),
  isRequester: z.boolean(),
});

export const SyncContactsResponseSchema = z.object({
  users: z.array(SyncedContactSchema),
});

export const FriendRequestSchema = z.object({
  addresseeId: z.string(),
});

export const FriendRequestResponseSchema = z.object({
  status: z.enum(["pending", "accepted", "rejected", "blocked"]),
});

export const AcceptFriendRequestSchema = z.object({
  requesterId: z.string(),
});

export const AcceptFriendResponseSchema = z.object({
  status: z.enum(["accepted"]),
});

export const RejectFriendRequestSchema = z.object({
  requesterId: z.string(),
});

export const RejectFriendResponseSchema = z.object({
  status: z.enum(["rejected"]),
});