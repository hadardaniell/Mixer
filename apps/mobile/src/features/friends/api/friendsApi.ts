import { http } from '@/shared/lib/httpClient';

/** Friendship state between the current user and another user. */
export type FriendshipStatus = 'none' | 'pending' | 'accepted' | 'self';

export interface UserSearchResult {
  id: string;
  displayName?: string;
  avatarUrl?: string | null;
  friendshipStatus: FriendshipStatus;
  /** When status is `pending`, true if the current user sent the request. */
  isRequester: boolean;
}

interface UserSearchResponse {
  users: UserSearchResult[];
}

export const friendsApi = {
  search: (q: string, limit = 20) =>
    http<UserSearchResponse>(
      `/friends/search?q=${encodeURIComponent(q)}&limit=${limit}`,
    ),

  sendRequest: (targetUserId: string) =>
    http<{ status: 'pending' }>('/friends/request', {
      method: 'POST',
      body: JSON.stringify({ targetUserId }),
    }),

  // Cancels an outgoing request or rejects an incoming one. Keyed by the other
  // user's id, not the friendshipId.
  cancelRequest: (userId: string) =>
    http<{ status: 'deleted' }>(`/friends/request/${userId}`, { method: 'DELETE' }),

  // Accepts an incoming request. `userId` is the requester's id.
  acceptRequest: (userId: string) =>
    http<{ status: 'accepted' }>(`/friends/${userId}/accept`, { method: 'PUT' }),
};
