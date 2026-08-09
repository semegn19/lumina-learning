// ─────────────────────────────────────────────
//  Token Storage Helpers
//  Thin wrappers around localStorage so the
//  rest of the app never touches storage keys directly.
// ─────────────────────────────────────────────

const ACCESS_KEY = "lm_access";
const REFRESH_KEY = "lm_refresh";

export const tokenStorage = {
  getAccess: (): string | null => localStorage.getItem(ACCESS_KEY),
  getRefresh: (): string | null => localStorage.getItem(REFRESH_KEY),

  set: (access: string, refresh: string) => {
    localStorage.setItem(ACCESS_KEY, access);
    localStorage.setItem(REFRESH_KEY, refresh);
  },

  clearAccess: () => localStorage.removeItem(ACCESS_KEY),

  clear: () => {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
  },
};
