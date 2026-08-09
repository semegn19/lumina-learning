import { api } from "./api-client";   
import type { AuthUser, PaginatedResponse } from "./api-types";

export interface GetUsersParams {
  search?: string | undefined;
  role?: string | undefined;
  is_active?: boolean | string | undefined;
  start_date?: string | undefined;
  end_date?: string | undefined;
  page?: number | undefined;
}

export async function getUsers(
  params?: GetUsersParams,
): Promise<PaginatedResponse<AuthUser> | AuthUser[]> {
  const queryParams: Record<string, string | number | boolean> = {};
  if (params?.search) queryParams["search"] = params.search;
  if (params?.role) queryParams["role"] = params.role;
  if (params?.is_active !== undefined) queryParams["is_active"] = params.is_active;
  if (params?.start_date) queryParams["start_date"] = params.start_date;
  if (params?.end_date) queryParams["end_date"] = params.end_date;
  if (params?.page) queryParams["page"] = params.page;

  const res = await api.get("/api/users/", { params: queryParams });
  return res.data;
}

/** Fetch all users across pages for complete lookup indexing */
export async function getAllUsers(): Promise<AuthUser[]> {
  try {
    const res = await api.get<PaginatedResponse<AuthUser> | AuthUser[]>("/api/users/", {
      params: { page_size: 250, size: 250, limit: 250 },
    });
    if (Array.isArray(res.data)) {
      return res.data;
    }
    const results: AuthUser[] = res.data.results ? [...res.data.results] : [];
    const count = res.data.count ?? results.length;
    let page = 2;
    while (results.length < count && page <= 20) {
      try {
        const nextRes = await api.get<PaginatedResponse<AuthUser>>("/api/users/", {
          params: { page, page_size: 250, size: 250, limit: 250 },
        });
        if (nextRes.data.results?.length) {
          results.push(...nextRes.data.results);
          page++;
        } else {
          break;
        }
      } catch {
        break;
      }
    }
    return results;
  } catch {
    return [];
  }
}

export async function getUserById(id: number | string): Promise<AuthUser> {
  const res = await api.get(`/api/users/${id}/`);
  return res.data;
}

export async function updateUser(
  id: number | string,
  payload: Partial<AuthUser> | FormData,
): Promise<AuthUser> {
  const isFormData = payload instanceof FormData;
  const res = await api.patch(`/api/users/${id}/`, payload, isFormData ? { headers: { "Content-Type": "multipart/form-data" } } : undefined);
  return res.data;
}

export async function deleteUser(id: number | string): Promise<void> {
  await api.delete(`/api/users/${id}/`);
}
