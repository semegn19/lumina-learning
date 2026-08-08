// ─────────────────────────────────────────────
//  Payments, Donations & Certificates API Functions      
// ─────────────────────────────────────────────

import { api } from "./api-client";
import type {
  Certificate,
  CertificateVerification,
  DonationInitPayload,
  DonationInitResponse,
  PaginatedResponse,
  PaymentInitPayload,
  PaymentInitResponse,
  PaymentVerifyPayload,
} from "./api-types";

// ── Payments & Donations ──────────────────────

/** POST /api/payments/init/ — Initialize course or event purchase payment */
export async function initializePayment(payload: PaymentInitPayload): Promise<PaymentInitResponse> {
  const body: Record<string, unknown> = {
    provider: payload.provider,
    amount: payload.amount,
    currency: payload.currency || "USD",
  };
  if (payload.course_id !== undefined) body["course_id"] = payload.course_id;
  if (payload.event_id !== undefined) {
    body["event_id"] = payload.event_id;
    body["event"] = payload.event_id;
  }
  if (payload.promo_code) body["promo_code"] = payload.promo_code;

  const { data } = await api.post<PaymentInitResponse>("/api/payments/init/", body);
  return data;
}

/** POST /api/payments/verify/ — Verify payment status */
export async function verifyPayment(payload: PaymentVerifyPayload): Promise<{ status: string; message?: string }> {
  const { data } = await api.post<{ status: string; message?: string }>("/api/payments/verify/", payload);
  return data;
}

/** POST /api/donations/init/ — Initialize platform donation */
export async function initializeDonation(payload: DonationInitPayload): Promise<DonationInitResponse> {
  const { data } = await api.post<DonationInitResponse>("/api/donations/init/", payload);
  return data;
}

// ── Certificates ─────────────────────────────

/** GET /api/verify/{uuid}/ — Verify certificate by UUID (Public endpoint) */
export async function verifyCertificate(uuid: string): Promise<CertificateVerification> {
  const { data } = await api.get<CertificateVerification>(`/api/verify/${uuid}/`);
  return data;
}

export interface GetCertificatesParams {
  search?: string;
  course?: string | number;
  user?: string | number;
  start_date?: string;
  end_date?: string;
  page?: number;
}

/** GET /api/certificates/ — Get authenticated user's certificates */
export async function getCertificates(params?: GetCertificatesParams): Promise<PaginatedResponse<Certificate> | Certificate[]> {
  const { data } = await api.get<PaginatedResponse<Certificate> | Certificate[]>("/api/certificates/", { params });
  return data;
}

/** GET /api/certificates/{id}/ — Get certificate by ID */
export async function getCertificateById(id: string | number): Promise<Certificate> {
  const { data } = await api.get<Certificate>(`/api/certificates/${id}/`);
  return data;
}
