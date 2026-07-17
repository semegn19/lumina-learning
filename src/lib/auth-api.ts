// ─────────────────────────────────────────────
//  Auth API Functions     
//  Thin wrappers around the /api/auth/* endpoints.
//  These are called from the auth context and login/register pages.
// ─────────────────────────────────────────────

import { api, decodeJwtPayload } from "./api-client";
import type {
  AuthUser,
  LoginResponse,
  RegisterPayload,
  RegisterResponse,
  UserUpdatePayload,
} from "./api-types";

/** POST /api/login/ — email + password → { access, refresh } */
export async function loginRequest(email: string, password: string): Promise<LoginResponse> {
  const { data } = await api.post<LoginResponse>("/api/login/", { email, password });
  return data;
}

/**
 * Decodes the access token to get the user_id, then fetches the full
 * user profile from GET /api/users/{user_id}/.
 */
export async function fetchUserFromToken(accessToken: string): Promise<AuthUser> {
  const payload = decodeJwtPayload<{ user_id?: number; id?: number; pk?: number; sub?: number }>(accessToken);

  const userId = payload?.user_id ?? payload?.id ?? payload?.pk ?? payload?.sub;

  if (!userId) {
    throw new Error(
      "Could not extract user ID from access token. " +
      "Check that your Django Simple JWT settings include user_id in the payload.",
    );
  }

  const { data } = await api.get<AuthUser>(`/api/users/${userId}/`);
  return data;
}

/** GET /api/users/{userId}/ — fetch user profile by ID */
export async function getUserById(userId: number | string): Promise<AuthUser> {
  const { data } = await api.get<AuthUser>(`/api/users/${userId}/`);
  return data;
}

/** POST /api/register/ — create new account */
export async function registerRequest(payload: RegisterPayload): Promise<RegisterResponse> {
  const { data } = await api.post<RegisterResponse>("/api/register/", payload);
  return data;
}

/** POST /api/logout/ — blacklist the refresh token server-side */
export async function logoutRequest(refresh: string): Promise<void> {
  await api.post("/api/logout/", { refresh });
}

/** POST /api/password-reset/ — send reset email */
export async function requestPasswordReset(email: string): Promise<void> {
  await api.post("/api/password-reset/", { email });
}

/** PATCH /api/users/{id}/ — update current user's profile */
export async function updateUser(userId: number, payload: UserUpdatePayload): Promise<AuthUser> {
  // Profile picture is a file — use multipart/form-data when present
  if (payload.profile_picture instanceof File) {
    const form = new FormData();
    Object.entries(payload).forEach(([key, value]) => {
      if (value === null || value === undefined) return;
      if (value instanceof File) {
        form.append(key, value);
      } else if (Array.isArray(value)) {
        value.forEach((v) => form.append(key, String(v)));
      } else {
        form.append(key, String(value));
      }
    });
    const { data } = await api.patch<AuthUser>(`/api/users/${userId}/`, form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data;
  }

  const { data } = await api.patch<AuthUser>(`/api/users/${userId}/`, payload);
  return data;
}
