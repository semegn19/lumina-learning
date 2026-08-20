import { api } from "./api-client";
import type { OrganizationSettings } from "./api-types";

export async function getOrganizationSettings(): Promise<OrganizationSettings> {
  const response = await api.get<OrganizationSettings>("/api/settings/");
  return response.data;
}

export async function updateOrganizationSettings(
  payload: Partial<OrganizationSettings> | FormData,
): Promise<OrganizationSettings> {
  const isFormData = payload instanceof FormData;
  const response = await api.put<OrganizationSettings>(
    "/api/settings/",
    payload,
    isFormData ? { timeout: 0 } : undefined,
  );
  return response.data;
}
