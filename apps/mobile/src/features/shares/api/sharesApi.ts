import type { CreateShareInput, ShareStatus, SharedItem } from '@mixer/contracts';

import { http } from '@/shared/lib/httpClient';

interface ShareListResponse {
  items: SharedItem[];
  total: number;
}

interface ShareListParams {
  status?: ShareStatus;
  limit?: number;
  skip?: number;
}

function toQuery({ status, limit = 100, skip = 0 }: ShareListParams = {}): string {
  const qs = new URLSearchParams({ limit: String(limit), skip: String(skip) });
  if (status) qs.set('status', status);
  return `?${qs.toString()}`;
}

export const sharesApi = {
  create: (input: CreateShareInput) =>
    http<SharedItem>('/shares', { method: 'POST', body: JSON.stringify(input) }),

  /** Shares the current user received. */
  received: (params?: ShareListParams) =>
    http<ShareListResponse>(`/shares/received${toQuery(params)}`),

  /** Shares the current user sent — used to mark friends already shared with. */
  sent: (params?: ShareListParams) => http<ShareListResponse>(`/shares/sent${toQuery(params)}`),

  accept: (shareId: string) => http<SharedItem>(`/shares/${shareId}/accept`, { method: 'PUT' }),

  reject: (shareId: string) => http<SharedItem>(`/shares/${shareId}/reject`, { method: 'PUT' }),

  /** Forks a live-link share into an independent copy owned by the recipient. */
  save: (shareId: string) => http<SharedItem>(`/shares/${shareId}/save`, { method: 'POST' }),

  remove: (shareId: string) => http<void>(`/shares/${shareId}`, { method: 'DELETE' }),
};
