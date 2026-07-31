// ─────────────────────────────────────────────
//  Enrollments API Functions          
// ─────────────────────────────────────────────

import { api } from "./api-client";
import type {
  Enrollment,
  EnrollmentCreatePayload,
  LessonProgress,
  PaginatedResponse,
} from "./api-types";

export interface GetEnrollmentsParams {
  search?: string;
  course?: string | number;
  status?: string;
  user?: string | number;
  start_date?: string;
  end_date?: string;
  page?: number;
}

/** GET /api/enrollments/ — Get authenticated user's enrollments */
export async function getEnrollments(params?: GetEnrollmentsParams): Promise<PaginatedResponse<Enrollment> | Enrollment[]> {
  const { data } = await api.get<PaginatedResponse<Enrollment> | Enrollment[]>("/api/enrollments/", { params });
  return data;
}

/** POST /api/enrollments/ — Enroll user in a course */
export async function enrollInCourse(payload: EnrollmentCreatePayload): Promise<Enrollment> {
  const { data } = await api.post<Enrollment>("/api/enrollments/", payload);
  return data;
}

/** GET /api/enrollment/{id}/ — Get enrollment detail */
export async function getEnrollmentById(id: string | number): Promise<Enrollment> {
  const { data } = await api.get<Enrollment>(`/api/enrollment/${id}/`);
  return data;
}

/** PATCH /api/enrollment/{id}/ — Update enrollment (e.g. status, progress) */
export async function updateEnrollment(
  id: string | number,
  payload: { course?: string | number; status?: string; progress?: number }
): Promise<Enrollment> {
  const { data } = await api.patch<Enrollment>(`/api/enrollment/${id}/`, payload);
  return data;
}

/** PATCH /api/lesson-progress/{id}/ — Update completion status of a lesson */
export async function updateLessonProgress(
  lessonProgressId: string | number,
  payload: { is_completed: boolean }
): Promise<LessonProgress> {
  const { data } = await api.patch<LessonProgress>(`/api/lesson-progress/${lessonProgressId}/`, payload);
  return data;
}

/** POST /api/lesson-progress/ — Create a lesson progress record in database */
export async function createLessonProgress(payload: {
  lesson: string | number;
  enrollment?: string | number;
  is_completed: boolean;
}): Promise<LessonProgress> {
  const { data } = await api.post<LessonProgress>("/api/lesson-progress/", payload);
  return data;
}

/** GET /api/lesson-progress/ — Get lesson progress records for an enrollment or lesson */
export async function getLessonProgressList(params?: {
  enrollment?: string | number;
  lesson?: string | number;
}): Promise<PaginatedResponse<LessonProgress> | LessonProgress[]> {
  const { data } = await api.get<PaginatedResponse<LessonProgress> | LessonProgress[]>("/api/lesson-progress/", { params });
  return data;
}
