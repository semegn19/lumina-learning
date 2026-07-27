// ─────────────────────────────────────────────
//  Admin Dashboard & Audit Logs API Functions           
// ─────────────────────────────────────────────

import { api } from "./api-client";
import { getMediaUrl } from "./utils";
import type {
  AdminDashboardData,
  AuditLog,
  AuditLogUserObject,
  AuthUser,
  PaginatedResponse,
} from "./api-types";

export interface GetDashboardParams {
  start_date?: string | undefined;
  end_date?: string | undefined;
}

export interface GetAuditLogsParams {
  page?: number | undefined;
  search?: string | undefined;
  action?: string | undefined;
  start_date?: string | undefined;
  end_date?: string | undefined;
}

/** GET /api/dashboard/ — Get admin dashboard statistics & recent activity (Admin only) */
export async function getAdminDashboard(params?: GetDashboardParams): Promise<AdminDashboardData> {
  const queryParams: Record<string, string> = {};
  if (params?.start_date) queryParams["start_date"] = params.start_date;
  if (params?.end_date) queryParams["end_date"] = params.end_date;

  const { data } = await api.get<AdminDashboardData>("/api/dashboard/", {
    params: Object.keys(queryParams).length > 0 ? queryParams : undefined,
  });
  return data;
}

/** GET /api/audits/logs/ — Get audit logs (Admin only) */
export async function getAuditLogs(
  params?: GetAuditLogsParams
): Promise<PaginatedResponse<AuditLog> | AuditLog[]> {
  const queryParams: Record<string, string | number> = {};
  if (params?.page) queryParams["page"] = params.page;
  if (params?.search) queryParams["search"] = params.search;

  const { data } = await api.get<PaginatedResponse<AuditLog> | AuditLog[]>("/api/audits/logs/", {
    params: Object.keys(queryParams).length > 0 ? queryParams : undefined,
  });
  return data;
}

/**
 * Fetches all audit logs across all pages so that client-side filtering (by tag, search query, actor)
 * and pagination operate on the full dataset of total items.
 */
export async function getAllAuditLogs(): Promise<AuditLog[]> {
  const firstPageRes = await api.get<PaginatedResponse<AuditLog> | AuditLog[]>("/api/audits/logs/", {
    params: { page: 1 },
  });

  const firstData = firstPageRes.data;
  if (Array.isArray(firstData)) {
    return firstData;
  }

  const results: AuditLog[] = [...(firstData.results ?? [])];
  const totalPages =
    firstData.meta?.total_pages ??
    (firstData.count ? Math.ceil(firstData.count / (firstData.meta?.size || 9)) : 1);

  if (totalPages > 1) {
    const pagePromises: Promise<{ data: PaginatedResponse<AuditLog> | AuditLog[] }>[] = [];
    for (let p = 2; p <= totalPages; p++) {
      pagePromises.push(
        api.get<PaginatedResponse<AuditLog> | AuditLog[]>("/api/audits/logs/", {
          params: { page: p },
        })
      );
    }
    const responses = await Promise.all(pagePromises);
    responses.forEach((res) => {
      if (Array.isArray(res.data)) {
        results.push(...res.data);
      } else if (res.data?.results) {
        results.push(...res.data.results);
      }
    });
  }

  return results;
}

// ── Multi-Index User Lookup & Formatting ─────

export interface UserLookupIndex {
  byId: Map<number | string, AuthUser>;
  byUsername: Map<string, AuthUser>;
  byEmail: Map<string, AuthUser>;
  byFullName: Map<string, AuthUser>;
  byFirstName: Map<string, AuthUser>;
}

export function buildUserLookupIndex(
  users: AuthUser[] | PaginatedResponse<AuthUser> | undefined
): UserLookupIndex {
  const index: UserLookupIndex = {
    byId: new Map(),
    byUsername: new Map(),
    byEmail: new Map(),
    byFullName: new Map(),
    byFirstName: new Map(),
  };

  const list: AuthUser[] = Array.isArray(users)
    ? users
    : users?.results ?? [];

  list.forEach((u) => {
    if (u.id !== undefined && u.id !== null) {
      index.byId.set(u.id, u);
      index.byId.set(String(u.id), u);
      const num = Number(u.id);
      if (!isNaN(num)) index.byId.set(num, u);
    }
    const anyUser = u as unknown as Record<string, unknown>;
    if (anyUser["pk"] !== undefined && anyUser["pk"] !== null) {
      index.byId.set(String(anyUser["pk"]), u);
      const numPk = Number(anyUser["pk"]);
      if (!isNaN(numPk)) index.byId.set(numPk, u);
    }
    if (anyUser["user_id"] !== undefined && anyUser["user_id"] !== null) {
      index.byId.set(String(anyUser["user_id"]), u);
      const numUid = Number(anyUser["user_id"]);
      if (!isNaN(numUid)) index.byId.set(numUid, u);
    }
    if (u.username) {
      index.byUsername.set(u.username.toLowerCase().trim(), u);
    }
    if (u.email) {
      index.byEmail.set(u.email.toLowerCase().trim(), u);
    }
    if (u.first_name) {
      index.byFirstName.set(u.first_name.toLowerCase().trim(), u);
    }
    const fullName = `${u.first_name || ""} ${u.last_name || ""}`.trim().toLowerCase();
    if (fullName) {
      index.byFullName.set(fullName, u);
    }
  });

  return index;
}

export interface UserDisplayNameResult {
  name: string;
  email?: string | undefined;
  avatar?: string | undefined;
  userId?: number | undefined;
  firstName?: string | undefined;
  lastName?: string | undefined;
}

export function resolveUserDisplayName(
  logOrUserRef: unknown,
  userIndex?: UserLookupIndex | Map<number, AuthUser> | Record<number, AuthUser> | null,
  fallbackEmail?: string,
  fallbackName?: string
): UserDisplayNameResult {
  let userRef = logOrUserRef;
  let userEmail = fallbackEmail;
  let userName = fallbackName;

  // Extract from full log/application object if passed
  if (
    logOrUserRef &&
    typeof logOrUserRef === "object" &&
    ("action" in (logOrUserRef as Record<string, unknown>) ||
      "created" in (logOrUserRef as Record<string, unknown>) ||
      "created_at" in (logOrUserRef as Record<string, unknown>) ||
      "applied_at" in (logOrUserRef as Record<string, unknown>) ||
      "timestamp" in (logOrUserRef as Record<string, unknown>) ||
      "cover_letter" in (logOrUserRef as Record<string, unknown>) ||
      "applicant" in (logOrUserRef as Record<string, unknown>) ||
      "applicant_id" in (logOrUserRef as Record<string, unknown>))
  ) {
    const log = logOrUserRef as Record<string, unknown>;
    userRef =
      log["user"] ??
      log["user_id"] ??
      log["userId"] ??
      log["applicant"] ??
      log["applicant_id"] ??
      log["actor"] ??
      log["actor_id"] ??
      log["user_info"] ??
      log["account"] ??
      log["performed_by"] ??
      log["created_by"];

    userEmail = (log["user_email"] ?? log["email"] ?? log["applicant_email"] ?? log["actor_email"] ?? fallbackEmail) as
      | string
      | undefined;

    userName = (log["user_name"] ??
      log["username"] ??
      log["applicant_name"] ??
      log["name"] ??
      log["full_name"] ??
      log["actor_name"] ??
      fallbackName) as string | undefined;

    if (!userName) {
      const fName = (log["first_name"] ?? log["user_first_name"] ?? log["applicant_first_name"] ?? log["actor_first_name"]) as string | undefined;
      const lName = (log["last_name"] ?? log["user_last_name"] ?? log["applicant_last_name"] ?? log["actor_last_name"]) as string | undefined;
      if (fName || lName) {
        userName = `${fName || ""} ${lName || ""}`.trim();
      }
    }

    // Check if details contains embedded user info object
    if (log["details"] && typeof log["details"] === "object") {
      const d = log["details"] as Record<string, unknown>;
      if (!userName) {
        const dName = (d["name"] ?? d["full_name"] ?? d["user_name"] ?? d["username"]) as string | undefined;
        const dFirst = d["first_name"] as string | undefined;
        const dLast = d["last_name"] as string | undefined;
        if (dFirst || dLast) {
          userName = `${dFirst || ""} ${dLast || ""}`.trim();
        } else if (dName) {
          userName = dName;
        }
      }
      if (!userEmail) {
        userEmail = (d["email"] ?? d["user_email"]) as string | undefined;
      }
      if (!userRef && (d["user_id"] || d["userId"] || d["id"])) {
        userRef = d["user_id"] ?? d["userId"] ?? d["id"];
      }
    }
  }

  // 1. Direct user object check (e.g. log.user is a full nested user object)
  if (userRef && typeof userRef === "object") {
    const u = userRef as AuditLogUserObject & Record<string, unknown>;
    const fullName = `${u.first_name || ""} ${u.last_name || ""}`.trim();
    const explicitName = (u.username || (u as any).name || (u as any).full_name) as string | undefined;
    const email = u.email || userEmail;
    const avatar = getMediaUrl((u.profile_picture || (u as any).avatar) as string | undefined) || undefined;
    const uid = typeof u.id === "number" ? u.id : (typeof (u as any).pk === "number" ? (u as any).pk : undefined);

    if (fullName) return { name: fullName, email, avatar, userId: uid, firstName: u.first_name, lastName: u.last_name };
    if (explicitName) {
      const cleanExplicit = explicitName.replace(/\s*\([A-Za-z0-9_-]+\)\s*$/, "").replace(/^applicant\s*#?/i, "").trim();
      return { name: cleanExplicit, email, avatar, userId: uid, firstName: u.first_name, lastName: u.last_name };
    }
    if (email) return { name: email, email, avatar, userId: uid, firstName: u.first_name, lastName: u.last_name };
    if (u.id) userRef = u.id;
  }

  // Helper to sanitize candidate strings from role and applicant prefixes/suffixes
  const cleanCandidate = (str?: string) => {
    if (!str) return "";
    return str
      .replace(/\s*\([A-Za-z0-9_-]+\)\s*$/, "")
      .replace(/^applicant\s*#?/i, "")
      .trim();
  };

  const cleanUserRef = typeof userRef === "string" ? cleanCandidate(userRef) : undefined;
  const cleanUserName = userName ? cleanCandidate(userName) : undefined;

  // 2. Lookup in userIndex
  if (userIndex) {
    let matchedUser: AuthUser | undefined;

    if ("byId" in userIndex) {
      if (typeof userRef === "number" || typeof userRef === "string") {
        matchedUser =
          userIndex.byId.get(userRef) ??
          userIndex.byId.get(Number(userRef)) ??
          userIndex.byId.get(String(userRef));
      }
      if (!matchedUser && cleanUserRef) {
        matchedUser =
          userIndex.byId.get(cleanUserRef) ??
          userIndex.byId.get(Number(cleanUserRef)) ??
          userIndex.byUsername.get(cleanUserRef.toLowerCase()) ??
          userIndex.byFullName?.get(cleanUserRef.toLowerCase()) ??
          userIndex.byFirstName?.get(cleanUserRef.toLowerCase()) ??
          userIndex.byEmail.get(cleanUserRef.toLowerCase());
      }
      if (!matchedUser && userEmail) {
        matchedUser = userIndex.byEmail.get(userEmail.toLowerCase().trim());
      }
      if (!matchedUser && cleanUserName) {
        matchedUser =
          userIndex.byFullName?.get(cleanUserName.toLowerCase()) ??
          userIndex.byUsername.get(cleanUserName.toLowerCase()) ??
          userIndex.byFirstName?.get(cleanUserName.toLowerCase());
      }
    } else if (userIndex instanceof Map) {
      if (typeof userRef === "number" || typeof userRef === "string") {
        matchedUser = userIndex.get(Number(userRef)) ?? (userIndex as any).get(userRef) ?? (userIndex as any).get(String(userRef));
      }
      if (!matchedUser && cleanUserRef) {
        matchedUser = (userIndex as any).get(cleanUserRef) ?? (userIndex as any).get(Number(cleanUserRef));
      }
    } else if (typeof userIndex === "object") {
      if (typeof userRef === "number" || typeof userRef === "string") {
        matchedUser = (userIndex as Record<string, AuthUser>)[String(userRef)];
      }
      if (!matchedUser && cleanUserRef) {
        matchedUser = (userIndex as Record<string, AuthUser>)[cleanUserRef];
      }
    }

    if (matchedUser) {
      const fullName = `${matchedUser.first_name || ""} ${matchedUser.last_name || ""}`.trim();
      return {
        name: fullName || matchedUser.first_name || matchedUser.username || matchedUser.email || `User #${matchedUser.id}`,
        email: matchedUser.email,
        avatar: getMediaUrl(matchedUser.profile_picture || matchedUser.avatar) || undefined,
        userId: matchedUser.id,
        firstName: matchedUser.first_name,
        lastName: matchedUser.last_name,
      };
    }
  }

  // 3. Fallbacks
  const numId = typeof userRef === "number"
    ? userRef
    : (typeof userRef === "string" && !isNaN(Number(userRef)) && Number(userRef) > 0
        ? Number(userRef)
        : (cleanUserRef && !isNaN(Number(cleanUserRef)) && Number(cleanUserRef) > 0
            ? Number(cleanUserRef)
            : undefined));

  if (cleanUserName && !cleanUserName.startsWith("User #")) {
    return { name: cleanUserName, email: userEmail, avatar: undefined, userId: numId };
  }
  if (userEmail) {
    return { name: userEmail, email: userEmail, avatar: undefined, userId: numId };
  }

  if (cleanUserRef && cleanUserRef.toLowerCase() !== "system") {
    const num = Number(cleanUserRef);
    if (!isNaN(num) && num > 0) {
      return { name: `User #${num}`, email: userEmail, avatar: undefined, userId: num };
    }
    return { name: cleanUserRef, email: userEmail, avatar: undefined, userId: numId };
  }

  if (typeof userRef === "number" && userRef > 0) {
    return { name: `User #${userRef}`, email: userEmail, avatar: undefined, userId: userRef };
  }

  return { name: "System", email: undefined, avatar: undefined, userId: undefined };
}

export function formatAuditLogUser(
  user: unknown,
  userEmail?: string,
  userName?: string,
  userIndex?: UserLookupIndex | Map<number, AuthUser> | Record<number, AuthUser> | null
): string {
  return resolveUserDisplayName(user, userIndex, userEmail, userName).name;
}

export function formatAuditLogDate(isoDate?: string): string {
  if (!isoDate) return "Recent";
  try {
    const d = new Date(isoDate);
    if (isNaN(d.getTime())) return isoDate;
    return d.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return isoDate;
  }
}

export function formatAuditLogDetails(details: unknown): string {
  if (!details) return "";
  if (typeof details === "string") return details;
  if (typeof details === "object") {
    try {
      const entries = Object.entries(details as Record<string, unknown>);
      if (entries.length === 0) return "";
      return entries.map(([k, v]) => `${k}: ${typeof v === "object" ? JSON.stringify(v) : v}`).join(", ");
    } catch {
      return String(details);
    }
  }
  return String(details);
}

export type AuditTag = "LOGIN" | "PURCHASE" | "UPDATE" | "ENROLL" | "SIGNUP" | "DELETE" | "ACTIVITY";

export function getAuditLogTag(action?: string): {
  tag: AuditTag;
  tone: string;
} {
  const act = (action || "").toUpperCase();
  if (act.includes("LOGIN") || act.includes("AUTH") || act.includes("SIGNIN")) {
    return { tag: "LOGIN", tone: "bg-primary-soft text-primary" };
  }
  if (
    act.includes("PURCHASE") ||
    act.includes("PAYMENT") ||
    act.includes("PAID") ||
    act.includes("DONAT") ||
    act.includes("BUY")
  ) {
    return { tag: "PURCHASE", tone: "bg-success-soft text-success" };
  }
  if (act.includes("ENROLL") || act.includes("REGISTER_COURSE") || act.includes("COURSE_ENROLL")) {
    return { tag: "ENROLL", tone: "bg-tile-amber text-foreground" };
  }
  if (
    act.includes("CREATE") ||
    act.includes("NEW") ||
    act.includes("SIGNUP") ||
    act.includes("REGISTER_USER") ||
    act.includes("USER_REGISTER")
  ) {
    return { tag: "SIGNUP", tone: "bg-success-soft text-success" };
  }
  if (act.includes("DELETE") || act.includes("REMOVE") || act.includes("CANCEL")) {
    return { tag: "DELETE", tone: "bg-accent text-destructive" };
  }
  if (
    act.includes("UPDATE") ||
    act.includes("EDIT") ||
    act.includes("PATCH") ||
    act.includes("PUT") ||
    act.includes("SETTING")
  ) {
    return { tag: "UPDATE", tone: "bg-info-soft text-info" };
  }
  return { tag: "ACTIVITY", tone: "bg-muted text-muted-foreground" };
}
