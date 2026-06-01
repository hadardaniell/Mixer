import type {
  AuthResponse,
  GoogleLoginInput,
  LoginInput,
  PublicUser,
  RegisterInput,
<<<<<<< HEAD
=======
  UpdateOwnUserInput,
>>>>>>> 1acc038dba37cfd30d15e42a72fbe1f7ab5abfb1
} from '@mixer/contracts';

import { http } from '@/shared/lib/httpClient';

export const authApi = {
  login: (body: LoginInput) =>
    http<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(body),
      skipAuth: true,
    }),

  loginWithGoogle: (body: GoogleLoginInput) =>
    http<AuthResponse>('/auth/google', {
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
<<<<<<< HEAD
=======

  updateMe: (body: UpdateOwnUserInput) =>
    http<PublicUser>('/users/me', {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),
>>>>>>> 1acc038dba37cfd30d15e42a72fbe1f7ab5abfb1
};
