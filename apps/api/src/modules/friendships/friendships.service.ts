import { ObjectId, type Db } from 'mongodb';

export async function syncContacts(db: Db, currentUserId: ObjectId, contacts: string[]) {
  const users = await db.collection('users').find({
    phoneNumber: { $in: contacts },
    _id: { $ne: currentUserId },
  }).project({ displayName: 1, phoneNumber: 1, avatarUrl: 1 }).toArray();

  if (users.length === 0) return { users: [] };

  const userIds = users.map((u: any) => u._id);

  const friendships = await db.collection('friendships').find({
    participants: currentUserId,
    $or: [
      { requesterId: { $in: userIds } },
      { addresseeId: { $in: userIds } },
    ],
  }).toArray();

  const results = users.map((user: any) => {
    const friendship = friendships.find(
      (f: any) => f.requesterId.equals(user._id) || f.addresseeId.equals(user._id)
    );

    return {
      id: user._id.toString(),
      displayName: user.displayName,
      phoneNumber: user.phoneNumber,
      avatarUrl: user.avatarUrl,
      friendshipStatus: friendship ? friendship.status : 'none',
      isRequester: friendship ? friendship.requesterId.equals(currentUserId) : false,
    };
  });

  return { users: results };
}

export async function sendFriendRequest(db: Db, currentUserId: ObjectId, targetUserId: ObjectId) {
  if (currentUserId.equals(targetUserId)) {
    return { error: 'Cannot add yourself as a friend', code: 400 };
  }

  const existing = await db.collection('friendships').findOne({
    $or: [
      { requesterId: currentUserId, addresseeId: targetUserId },
      { requesterId: targetUserId, addresseeId: currentUserId },
    ],
  });

  if (existing) {
    return { error: 'Friendship or request already exists', code: 400 };
  }

  const participants = [currentUserId, targetUserId].sort((a, b) =>
    a.toString().localeCompare(b.toString())
  );

  await db.collection('friendships').insertOne({
    requesterId: currentUserId,
    addresseeId: targetUserId,
    participants,
    status: 'pending',
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  return { status: 'pending' };
}

export async function acceptFriendRequest(db: Db, currentUserId: ObjectId, requesterId: ObjectId) {
  const result = await db.collection('friendships').updateOne(
    { requesterId, addresseeId: currentUserId, status: 'pending' },
    { $set: { status: 'accepted', updatedAt: new Date() } }
  );

  if (result.matchedCount === 0) {
    return { error: 'Pending request not found', code: 404 };
  }

  return { status: 'accepted' };
}

export async function rejectOrCancelFriendRequest(db: Db, currentUserId: ObjectId, targetId: ObjectId) {
  const result = await db.collection('friendships').deleteOne({
    $or: [
      { requesterId: targetId, addresseeId: currentUserId, status: 'pending' },
      { requesterId: currentUserId, addresseeId: targetId, status: 'pending' },
    ],
  });

  if (result.deletedCount === 0) {
    return { error: 'Pending request not found', code: 404 };
  }

  return { status: 'deleted' };
}

export async function getAcceptedFriends(db: Db, currentUserId: ObjectId) {
  const friendships = await db.collection('friendships').find({
    participants: currentUserId,
    status: 'accepted',
  }).toArray();

  const friendIds = friendships.map((f: any) =>
    f.requesterId.equals(currentUserId) ? f.addresseeId : f.requesterId
  );

  if (friendIds.length === 0) return { friends: [] };

  const users = await db.collection('users').find(
    { _id: { $in: friendIds } },
    { projection: { displayName: 1, avatarUrl: 1 } }
  ).toArray();

  return {
    friends: users.map((u: any) => ({
      id: u._id.toString(),
      displayName: u.displayName,
      avatarUrl: u.avatarUrl,
    })),
  };
}

export async function getIncomingRequests(db: Db, currentUserId: ObjectId) {
  const requests = await db.collection('friendships').find({
    addresseeId: currentUserId,
    status: 'pending',
  }).toArray();

  if (requests.length === 0) return { requests: [] };

  const requesterIds = requests.map((r: any) => r.requesterId);
  const requesters = await db.collection('users').find(
    { _id: { $in: requesterIds } },
    { projection: { displayName: 1, avatarUrl: 1 } }
  ).toArray();

  return {
    requests: requests.map((r: any) => {
      const u = requesters.find((reqU: any) => reqU._id.equals(r.requesterId));
      return {
        id: r._id.toString(),
        requester: {
          id: u?._id.toString() || r.requesterId.toString(),
          displayName: u?.displayName,
          avatarUrl: u?.avatarUrl,
        },
        createdAt: r.createdAt.toISOString(),
      };
    }),
  };
}

export async function unfriendUser(db: Db, currentUserId: ObjectId, friendId: ObjectId) {
  const participants = [currentUserId, friendId].sort((a, b) =>
    a.toString().localeCompare(b.toString())
  );

  const result = await db.collection('friendships').deleteOne({
    participants,
    status: 'accepted',
  });

  if (result.deletedCount === 0) {
    return { error: 'Friendship not found', code: 404 };
  }

  // Auto-fork live-link shares you favored
  const myFavorites = await db.collection('favorites').find({
    userId: currentUserId,
  }).toArray();

  const favoritedRecipeIds = myFavorites
    .filter((f: any) => !f.kind || f.kind === 'recipe')
    .map((f: any) => f.targetId || f.recipeId)
    .filter(Boolean);

  let forkedCount = 0;

  if (favoritedRecipeIds.length > 0) {
    const recipesToFork = await db.collection('recipes').find({
      _id: { $in: favoritedRecipeIds },
      ownerId: friendId,
    }).toArray();

    for (const recipe of recipesToFork) {
      const newRecipeId = new ObjectId();
      const newRecipe = {
        ...recipe,
        _id: newRecipeId,
        ownerId: currentUserId,
        forkedFrom: recipe._id,
        forkedAt: new Date(),
        visibility: 'private',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await db.collection('recipes').insertOne(newRecipe);

      const favoriteEntry = myFavorites.find(
        (f: any) => f.targetId?.equals(recipe._id) || f.recipeId?.equals(recipe._id)
      );

      if (favoriteEntry) {
        await db.collection('favorites').updateOne(
          { _id: favoriteEntry._id },
          { $set: { targetId: newRecipeId, recipeId: newRecipeId } }
        );
      }
      forkedCount++;
    }
  }

  return { status: 'unfriended', forkedCount };
}

export async function getFriendshipStatus(db: Db, currentUserId: ObjectId, targetUserId: ObjectId) {
  if (currentUserId.equals(targetUserId)) {
    return { friendshipStatus: 'self', isRequester: false };
  }
  const friendship = await db.collection('friendships').findOne({
    $or: [
      { requesterId: currentUserId, addresseeId: targetUserId },
      { requesterId: targetUserId, addresseeId: currentUserId },
    ],
  });

  if (!friendship) return { friendshipStatus: 'none', isRequester: false };

  return {
    friendshipStatus: friendship.status,
    isRequester: friendship.requesterId.equals(currentUserId),
  };
}