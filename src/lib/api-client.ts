// ─────────────────────────────────────────────
//  Axios API Client           
//  - Base URL from env (falls back to localhost)
//  - Attaches JWT access token to every request
//  - Automatically refreshes expired tokens once
//  - Clears tokens and redirects to /auth/login on 401
//    (but NOT for auth endpoints themselves)
// ─────────────────────────────────────────────

import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";
import { tokenStorage } from "./token-storage";

// ── Base URL ────────────────────────────────
// Set VITE_API_URL in your .env file to point at the real server.
// Default: Django dev server on port 8000.
const BASE_URL = import.meta.env["VITE_API_URL"] ?? "http://localhost:8000";

export const api = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
  withCredentials: false,
});

// ── Auth endpoints that should NEVER trigger the refresh interceptor ──
// A 401 on these is a legitimate credential error, not an expired token.
const AUTH_BYPASS_PATHS = [
  "/api/login/",
  "/api/register/",
  "/api/token/refresh/",
  "/api/password-reset/",
  "/api/logout/",
];

function isAuthBypassUrl(url?: string): boolean {
  if (!url) return false;
  return AUTH_BYPASS_PATHS.some((path) => url.endsWith(path));
}

// ── Request interceptor — attach token ───────
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = tokenStorage.getAccess();
  if (token && config.headers) {
    config.headers["Authorization"] = `Bearer ${token}`;
  }
  return config;
});

// ── Flag to avoid infinite refresh loops ─────
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

function processQueue(error: unknown, token: string | null = null) {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
}

// ── Response interceptor — handle 401 ────────
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // Skip refresh for auth endpoints — let the error bubble up naturally
    // so the login/register form can display the validation message.
    if (isAuthBypassUrl(originalRequest?.url)) {
      return Promise.reject(error);
    }

    // Only attempt refresh on 401s from protected endpoints
    if (error.response?.status === 401 && !originalRequest._retry) {
      const refresh = tokenStorage.getRefresh();

      // No refresh token stored — clear everything and redirect to login
      if (!refresh) {
        tokenStorage.clear();
        window.location.href = "/auth/login";
        return Promise.reject(error);
      }

      if (isRefreshing) {
        // Queue this request while the refresh is in progress
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (originalRequest.headers) {
              originalRequest.headers["Authorization"] = `Bearer ${token}`;
            }
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const { data } = await axios.post<{ access: string }>(
          `${BASE_URL}/api/token/refresh/`,
          { refresh },
        );

        const newAccess = data.access;
        tokenStorage.set(newAccess, refresh);

        api.defaults.headers.common["Authorization"] = `Bearer ${newAccess}`;
        if (originalRequest.headers) {
          originalRequest.headers["Authorization"] = `Bearer ${newAccess}`;
        }

        processQueue(null, newAccess);
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        tokenStorage.clear();
        window.location.href = "/auth/login";
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);

// ── JWT payload decoder ───────────────────────
/**
 * Decodes the payload of a JWT without verifying the signature.
 * Used client-side to extract `user_id` from the access token.
 */
export function decodeJwtPayload<T = Record<string, unknown>>(token: string): T | null {
  try {
    const base64Url = token.split(".")[1];
    if (!base64Url) return null;
    // Convert base64url → base64 → JSON
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const json = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join(""),
    );
    return JSON.parse(json) as T;
  } catch {
    return null;
  }
}

// ── Convenience error extractor ───────────────
/**
 * Pull a human-readable message from a DRF error response.
 * Tries `detail`, then field-level errors, then falls back to a generic message.
 */
export function getApiErrorMessage(error: unknown, fallback = "Something went wrong."): string {
  if (!axios.isAxiosError(error)) return fallback;
  const data = error.response?.data as Record<string, unknown> | undefined;
  if (!data) return fallback;

  if (typeof data["detail"] === "string") return data["detail"] as string;

  // Field-level validation errors: join the first error from each field
  const fieldErrors = Object.entries(data)
    .filter(([, v]) => v)
    .map(([field, msgs]) => {
      const message = Array.isArray(msgs) ? msgs[0] : msgs;
      return `${field}: ${String(message)}`;
    });

  if (fieldErrors.length > 0) return fieldErrors.join(" • ");
  return fallback;
}
