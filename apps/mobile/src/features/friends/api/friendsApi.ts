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

/** A matched contact carries the same fields the row needs, plus the phone that
 *  matched (unused by the UI today but handy for de-duping / display). */
export interface MatchedContact extends UserSearchResult {
  phoneNumber?: string;
}

export interface Friend {
  id: string;
  displayName?: string;
  avatarUrl?: string | null;
}

interface FriendsListResponse {
  friends: Friend[];
}

export const friendsApi = {
  list: () => http<FriendsListResponse>('/friends'),

  search: (q: string, limit = 20) =>
    http<UserSearchResponse>(
      `/friends/search?q=${encodeURIComponent(q)}&limit=${limit}`,
    ),

  // Matches the user's device contacts (E.164 phone numbers) against registered
  // users. The response rows are shaped exactly like a user-search result, so
  // `AddFriendRow` renders them unchanged.
  syncContacts: (contacts: string[]) =>
    http<{ users: MatchedContact[] }>('/friends/sync-contacts', {
      method: 'POST',
      body: JSON.stringify({ contacts }),
    }),

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

  // Removes an accepted friend. The server also auto-forks their live-link
  // recipes the current user had favorited (`forkedCount`).
  unfriend: (userId: string) =>
    http<{ status: 'unfriended'; forkedCount: number }>(`/friends/${userId}`, {
      method: 'DELETE',
    }),
};
