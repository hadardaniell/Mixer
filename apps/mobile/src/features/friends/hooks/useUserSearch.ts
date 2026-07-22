import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

import { friendsApi } from '@/features/friends/api/friendsApi';

const DEBOUNCE_MS = 300;
const MIN_CHARS = 2;

export const userSearchKey = (q: string) => ['users', 'search', q] as const;

/**
 * Debounced search over all users. Returns an empty result set until the query
 * is at least {@link MIN_CHARS} characters, so a single keystroke doesn't hit
 * the server.
 */
export function useUserSearch(rawQuery: string) {
  const [debounced, setDebounced] = useState(rawQuery.trim());

  useEffect(() => {
    const id = setTimeout(() => setDebounced(rawQuery.trim()), DEBOUNCE_MS);
    return () => clearTimeout(id);
  }, [rawQuery]);

  const enabled = debounced.length >= MIN_CHARS;

  const q = useQuery({
    queryKey: userSearchKey(debounced),
    queryFn: () => friendsApi.search(debounced),
    enabled,
    placeholderData: keepPreviousData,
    staleTime: 15_000,
  });

  return {
    query: debounced,
    users: q.data?.users ?? [],
    isLoading: enabled && q.isLoading,
    isFetching: q.isFetching,
    isError: q.isError,
    tooShort: debounced.length > 0 && debounced.length < MIN_CHARS,
  };
}
