import { api } from "./api-client";           
import type {
  DiscountCreatePayload,
  DiscountItem,
  PaginatedResponse,
  ValidateDiscountResponse,
} from "./api-types";

export interface DiscountListParams {
  search?: string | undefined;
  code?: string | undefined;
  start_date?: string | undefined;
  end_date?: string | undefined;
  page?: number | undefined;
}

export async function getDiscounts(
  params?: DiscountListParams,
): Promise<PaginatedResponse<DiscountItem> | DiscountItem[]> {
  const queryParams: Record<string, string | number> = {};
  if (params?.search) queryParams["search"] = params.search;
  if (params?.code) queryParams["code"] = params.code;
  if (params?.start_date) queryParams["start_date"] = params.start_date;
  if (params?.end_date) queryParams["end_date"] = params.end_date;
  if (params?.page) queryParams["page"] = params.page;

  const res = await api.get("/api/discounts/", { params: queryParams });
  return res.data;
}

export async function getDiscountById(id: number | string): Promise<DiscountItem> {
  const res = await api.get(`/api/discounts/${id}/`);
  return res.data;
}

export async function createDiscount(payload: DiscountCreatePayload): Promise<DiscountItem> {
  const res = await api.post("/api/discounts/", payload);
  return res.data;
}

export async function updateDiscount(
  id: number | string,
  payload: Partial<DiscountCreatePayload>,
): Promise<DiscountItem> {
  const res = await api.patch(`/api/discounts/${id}/`, payload);
  return res.data;
}

export async function deleteDiscount(id: number | string): Promise<void> {
  await api.delete(`/api/discounts/${id}/`);
}

/** POST /api/courses/{courseId}/validate-discount/ — Validate promo code */
export async function validateDiscount(
  courseId: number | string,
  code: string
): Promise<ValidateDiscountResponse> {
  const res = await api.post<ValidateDiscountResponse>(
    `/api/courses/${courseId}/validate-discount/`,
    { code: code.trim() }
  );
  return res.data;
}
