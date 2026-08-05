import { api } from "./api-client";         
import type {
  JobItem,
  JobCreatePayload,
  JobApplication,
  JobApplicationCreatePayload,
  PaginatedResponse,
} from "./api-types";

// ── Jobs Service ──────────────────────────────

export function isJobStatusOpen(status?: string | null): boolean {
  if (!status) return true;
  const s = String(status).trim().toLowerCase();
  if (s === "c" || s === "closed" || s === "inactive") return false;
  return true;
}

/**
 * Parses and cleans a job's requirements field (which can be a JSON array, JSON object, JSON string,
 * or comma/newline separated string) into clean, individual requirement strings (one per line).
 * Strips any colons (":") and leading "Requirement:"/"Requirements:" prefixes.
 */
export function parseRequirements(raw: unknown): string[] {
  if (!raw) return [];

  const items: string[] = [];

  const extractItems = (val: unknown) => {
    if (Array.isArray(val)) {
      val.forEach(extractItems);
    } else if (typeof val === "object" && val !== null) {
      Object.values(val as Record<string, unknown>).forEach(extractItems);
    } else if (typeof val === "string") {
      const trimmed = val.trim();
      if (
        (trimmed.startsWith("[") && trimmed.endsWith("]")) ||
        (trimmed.startsWith("{") && trimmed.endsWith("}"))
      ) {
        try {
          const parsed = JSON.parse(trimmed);
          extractItems(parsed);
          return;
        } catch {
          // not JSON, fallback to splitting
        }
      }
      // Split by commas or newlines
      const split = trimmed.split(/[\n,]+/);
      split.forEach((s) => {
        if (s.trim()) items.push(s.trim());
      });
    } else if (val !== undefined && val !== null) {
      items.push(String(val).trim());
    }
  };

  extractItems(raw);

  return items
    .map((item) => {
      let cleaned = String(item).trim();
      // Remove any leading "Requirements:" or "Requirement:" or "Req:"
      cleaned = cleaned.replace(/^requirements?\s*[:\s]*/i, "");
      // Remove all ":" colons from requirement string
      cleaned = cleaned.replace(/:+/g, " ").trim();
      // Remove leading bullet/number prefixes like "1.", "-", "*", "•"
      cleaned = cleaned.replace(/^[-*•\d.]+\s*/, "").trim();
      return cleaned;
    })
    .filter(
      (req) =>
        req.length > 0 &&
        req.toLowerCase() !== "requirements" &&
        req.toLowerCase() !== "requirement"
    );
}

export interface GetJobsParams {
  search?: string | undefined;
  status?: string | undefined;
  location?: string | undefined;
  page?: number | undefined;
}

export async function getJobs(
  params?: GetJobsParams
): Promise<PaginatedResponse<JobItem> | JobItem[]> {
  const response = await api.get<PaginatedResponse<JobItem> | JobItem[]>(
    "/api/jobs/",
    { params }
  );
  return response.data;
}

export async function getJobById(id: number | string): Promise<JobItem> {
  const response = await api.get<JobItem>(`/api/jobs/${id}/`);
  return response.data;
}

export async function createJob(payload: JobCreatePayload): Promise<JobItem> {
  const response = await api.post<JobItem>("/api/jobs/", payload);
  return response.data;
}

export async function updateJob(
  id: number | string,
  payload: Partial<JobCreatePayload>
): Promise<JobItem> {
  const response = await api.patch<JobItem>(`/api/jobs/${id}/`, payload);
  return response.data;
}

export async function deleteJob(id: number | string): Promise<void> {
  await api.delete(`/api/jobs/${id}/`);
}

// ── Job Applications Service ──────────────────

export interface GetJobApplicationsParams {
  search?: string | undefined;
  job?: number | string | undefined;
  user?: number | string | undefined;
  page?: number | undefined;
}

export async function getJobApplications(
  params?: GetJobApplicationsParams
): Promise<PaginatedResponse<JobApplication> | JobApplication[]> {
  const response = await api.get<
    PaginatedResponse<JobApplication> | JobApplication[]
  >("/api/job-applications/", { params });
  return response.data;
}

export async function getJobApplicationById(
  id: number | string
): Promise<JobApplication> {
  const response = await api.get<JobApplication>(
    `/api/job-applications/${id}/`
  );
  return response.data;
}

export async function createJobApplication(
  payload: JobApplicationCreatePayload
): Promise<JobApplication> {
  const response = await api.post<JobApplication>(
    "/api/job-applications/",
    payload
  );
  return response.data;
}

export async function updateJobApplication(
  id: number | string,
  payload: Partial<{ cover_letter: string; status: string }>
): Promise<JobApplication> {
  const response = await api.patch<JobApplication>(
    `/api/job-applications/${id}/`,
    payload
  );
  return response.data;
}

export async function deleteJobApplication(
  id: number | string
): Promise<void> {
  await api.delete(`/api/job-applications/${id}/`);
}
