import { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { ObjectId } from "mongodb";
import { z } from "zod";
import { config } from "../config.js";
import {
  SyncContactsRequestSchema,
  SyncContactsResponseSchema,
  FriendRequestSchema,
  FriendRequestResponseSchema,
  AcceptFriendRequestSchema,
  AcceptFriendResponseSchema,
  RejectFriendRequestSchema,
  RejectFriendResponseSchema,
} from "@mixer/contracts";

export const friendsRoutes: FastifyPluginAsyncZod = async (fastify) => {
  const db = fastify.mongo.db(config.mongoDbName);

  // 1. Sync contacts endpoint
  fastify.post(
    "/sync-contacts",
    {
      schema: {
        tags: ["Friends"],
        summary: "Sync contacts",
        description: "Returns matching registered users from a list of phone numbers.",
        body: SyncContactsRequestSchema,
        response: {
          200: SyncContactsResponseSchema,
        },
      },
      onRequest: [fastify.authenticate],
    },
    async (request, reply) => {
      const { contacts } = request.body;
      const currentUserId = new ObjectId(request.user.id);

      // Find users matching the contacts, excluding the current user
      const users = await db
        .collection("users")
        .find({
          phoneNumber: { $in: contacts },
          _id: { $ne: currentUserId },
        })
        .project({ displayName: 1, phoneNumber: 1, avatarUrl: 1 })
        .toArray();

      if (users.length === 0) {
        return { users: [] };
      }

      const userIds = users.map((u) => u._id);

      // Fetch existing friendships
      const friendships = await db
        .collection("friendships")
        .find({
          participants: currentUserId,
          $or: [
            { requesterId: { $in: userIds } },
            { addresseeId: { $in: userIds } },
          ],
        })
        .toArray();

      // Enrich user data with friendship status
      const results = users.map((user) => {
        const friendship = friendships.find(
          (f) =>
            f.requesterId.equals(user._id) || f.addresseeId.equals(user._id)
        );

        return {
          _id: user._id.toString(),
          displayName: user.displayName,
          phoneNumber: user.phoneNumber,
          avatarUrl: user.avatarUrl,
          friendshipStatus: friendship ? friendship.status : "none",
          isRequester: friendship
            ? friendship.requesterId.equals(currentUserId)
            : false,
        };
      });

      return { users: results };
    }
  );

  // 2. Add / Request friend endpoint
  fastify.post(
    "/request",
    {
      schema: {
        tags: ["Friends"],
        summary: "Send friend request",
        description: "Creates a pending friendship request with another user.",
        body: FriendRequestSchema,
        response: {
          200: FriendRequestResponseSchema,
          400: z.object({ message: z.string() }),
          404: z.object({ message: z.string() }),
        },
      },
      onRequest: [fastify.authenticate],
    },
    async (request, reply) => {
      const { addresseeId } = request.body;
      const requesterId = new ObjectId(request.user.id);
      const targetId = new ObjectId(addresseeId);

      if (requesterId.equals(targetId)) {
        return reply.code(400).send({ message: "Cannot send a friend request to yourself" });
      }

      const targetUser = await db.collection("users").findOne({ _id: targetId });
      if (!targetUser) {
        return reply.code(404).send({ message: "User not found" });
      }

      // Sort participants to ensure the array is always uniquely ordered (required by your DB schema for indexing)
      const participants = [requesterId, targetId].sort((a, b) =>
        a.toString().localeCompare(b.toString())
      );

      const existingFriendship = await db
        .collection("friendships")
        .findOne({ participants });

      if (existingFriendship) {
        return { status: existingFriendship.status };
      }

      const newFriendship = {
        requesterId,
        addresseeId: targetId,
        status: "pending", // Change to "accepted" if your app uses an auto-accept logic
        participants,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await db.collection("friendships").insertOne(newFriendship);

      return { status: newFriendship.status };
    }
  );

  // 3. Accept friend request endpoint
  fastify.post(
    "/accept",
    {
      schema: {
        tags: ["Friends"],
        summary: "Accept friend request",
        description: "Accepts a pending friend request from another user.",
        body: AcceptFriendRequestSchema,
        response: {
          200: AcceptFriendResponseSchema,
          400: z.object({ message: z.string() }),
          404: z.object({ message: z.string() }),
        },
      },
      onRequest: [fastify.authenticate],
    },
    async (request, reply) => {
      const { requesterId } = request.body;
      const currentUserId = new ObjectId(request.user.id);
      const fromUserId = new ObjectId(requesterId);

      const friendship = await db.collection("friendships").findOne({
        requesterId: fromUserId,
        addresseeId: currentUserId,
        status: "pending",
      });

      if (!friendship) {
        return reply.code(404).send({ message: "Pending friend request not found" });
      }

      await db.collection("friendships").updateOne(
        { _id: friendship._id },
        { $set: { status: "accepted", updatedAt: new Date() } }
      );

      return { status: "accepted" as const };
    }
  );

  // 4. Reject friend request endpoint
  fastify.post(
    "/reject",
    {
      schema: {
        tags: ["Friends"],
        summary: "Reject friend request",
        description: "Rejects a pending friend request from another user.",
        body: RejectFriendRequestSchema,
        response: {
          200: RejectFriendResponseSchema,
          400: z.object({ message: z.string() }),
          404: z.object({ message: z.string() }),
        },
      },
      onRequest: [fastify.authenticate],
    },
    async (request, reply) => {
      const { requesterId } = request.body;
      const currentUserId = new ObjectId(request.user.id);
      const fromUserId = new ObjectId(requesterId);

      const friendship = await db.collection("friendships").findOne({
        requesterId: fromUserId,
        addresseeId: currentUserId,
        status: "pending",
      });

      if (!friendship) {
        return reply.code(404).send({ message: "Pending friend request not found" });
      }

      await db.collection("friendships").updateOne(
        { _id: friendship._id },
        { $set: { status: "rejected", updatedAt: new Date() } }
      );

      return { status: "rejected" as const };
    }
  );
};