import type { AuthResponse, LoginInput, PublicUser, RegisterInput } from '@mixer/contracts';

import { http } from '@/shared/lib/httpClient';

export const authApi = {
  login: (body: LoginInput) =>
    http<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(body),
      skipAuth: true,
    }),

  register: (body: RegisterInput) =>
    http<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(body),
      skipAuth: true,
    }),

  logout: (refreshToken: string) =>
    http<void>('/auth/logout', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
      skipAuth: true,
    }),

  me: () => http<PublicUser>('/auth/me'),
};
