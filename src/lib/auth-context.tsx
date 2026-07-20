// ─────────────────────────────────────────────
//  Auth Context         
//  Provides: user, role, isAuthenticated,
//            login(), register(), logout()
//  Stores JWT tokens in localStorage.
//  On first mount, decodes the stored token to
//  get user_id, then fetches the full profile
//  from GET /api/users/{user_id}/.
// ─────────────────────────────────────────────

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { fetchUserFromToken, loginRequest, logoutRequest, registerRequest } from "./auth-api";
import { getApiErrorMessage } from "./api-client";
import { tokenStorage } from "./token-storage";
import type { AuthUser, RegisterPayload, UserRole } from "./api-types";

// ── Helpers ─────────────────────────────────

/** Map the backend role codes to friendly labels used in the UI */
export const ROLE_LABELS: Record<UserRole, string> = {
  MA: "Master Admin",
  SA: "Secondary Admin",
  ST: "Student",
};

export function isMasterAdmin(role?: UserRole | null) {
  return role === "MA";
}

export function isAdmin(role?: UserRole | null) {
  return role === "MA" || role === "SA";
}

// ── Context type ─────────────────────────────

interface AuthContextValue {
  /** The authenticated user, or null if not logged in */
  user: AuthUser | null;
  /** Whether the initial auth check has finished */
  isLoading: boolean;
  /** True when a valid user is present */
  isAuthenticated: boolean;
  /**
   * Sign in with email + password.
   * Throws an Error on failure — catch it in the form to show the message.
   */
  login: (email: string, password: string) => Promise<void>;
  /**
   * Create a new account, then auto-login.
   * Throws an Error on failure.
   */
  register: (payload: RegisterPayload) => Promise<void>;
  /** Sign out: clears tokens locally and blacklists the refresh token */
  logout: () => Promise<void>;
  /** Replace the in-memory user (e.g. after a profile update) */
  setUser: (user: AuthUser) => void;
}

// ── Context ──────────────────────────────────

const AuthContext = createContext<AuthContextValue | null>(null);

// ── Provider ─────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  // Prevent double-fetching in React strict mode
  const didMount = useRef(false);

  // On mount: if there's a stored access token, rehydrate the user profile
  useEffect(() => {
    if (didMount.current) return;
    didMount.current = true;

    const token = tokenStorage.getAccess();
    if (!token) {
      setIsLoading(false);
      return;
    }

    fetchUserFromToken(token)
      .then((me) => setUser(me))
      .catch(() => {
        // Token invalid / expired beyond refresh — clear it quietly
        tokenStorage.clear();
      })
      .finally(() => setIsLoading(false));
  }, []);

  // ── login ──────────────────────────────────
  const login = useCallback(async (email: string, password: string) => {
    try {
      // Step 1: Get tokens
      const { access, refresh } = await loginRequest(email, password);
      tokenStorage.set(access, refresh);

      // Step 2: Decode the access token → user_id → full user profile
      const profile = await fetchUserFromToken(access);
      setUser(profile);
    } catch (err) {
      // Re-throw as a plain Error so the form can display the message
      throw new Error(getApiErrorMessage(err, "Invalid email or password."));
    }
  }, []);

  // ── register ────────────────────────────────
  const register = useCallback(async (payload: RegisterPayload) => {
    try {
      // Create the account, then log in automatically
      await registerRequest(payload);
      // Use the login flow to get tokens + user profile
      await loginRequest(payload.email, payload.password).then(async ({ access, refresh }) => {
        tokenStorage.set(access, refresh);
        const profile = await fetchUserFromToken(access);
        setUser(profile);
      });
    } catch (err) {
      throw new Error(getApiErrorMessage(err, "Registration failed. Please try again."));
    }
  }, []);

  // ── logout ──────────────────────────────────
  const logout = useCallback(async () => {
    const refresh = tokenStorage.getRefresh();
    // Optimistically clear local state first so the UI reacts immediately
    tokenStorage.clear();
    setUser(null);
    // Blacklist the token server-side (fire-and-forget, non-critical)
    if (refresh) {
      logoutRequest(refresh).catch(() => undefined);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        setUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ── Hook ─────────────────────────────────────

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used inside <AuthProvider>");
  }
  return ctx;
}
