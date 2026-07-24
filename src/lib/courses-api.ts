// ─────────────────────────────────────────────
//  Courses & Lessons API Functions 
// ─────────────────────────────────────────────

import { api } from "./api-client";
import type {
  Course,
  CourseCreatePayload,
  Lesson,
  LessonCreatePayload,
  PaginatedResponse,
} from "./api-types";

export interface GetCoursesParams {
  search?: string | undefined;
  currency?: string | undefined;
  level?: string | undefined;
  created_by?: string | number | undefined;
  start_date?: string | undefined;
  end_date?: string | undefined;
  page?: number | undefined;
}

/** GET /api/courses/ — List courses with optional filters */
export async function getCourses(params?: GetCoursesParams): Promise<PaginatedResponse<Course> | Course[]> {
  const { data } = await api.get<PaginatedResponse<Course> | Course[]>("/api/courses/", { params });
  return data;
}

/** GET /api/courses/{id}/ — Single course detail */
export async function getCourseById(id: string | number): Promise<Course> {
  const { data } = await api.get<Course>(`/api/courses/${id}/`);
  return data;
}

/** POST /api/courses/ — Create course (Admin only) */
export async function createCourse(payload: CourseCreatePayload): Promise<Course> {
  const formData = new FormData();
  formData.append("title", payload.title);
  formData.append("description", payload.description);
  formData.append("price", String(payload.price));
  formData.append("currency", payload.currency || "USD");
  formData.append("level", payload.level);
  if (payload.topics_covered) {
    formData.append("topics_covered", payload.topics_covered);
  }
  if (payload.thumbnail instanceof File) {
    formData.append("thumbnail", payload.thumbnail);
  }

  const { data } = await api.post<Course>("/api/courses/", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}

/** PUT/PATCH /api/courses/{id}/ — Update course (Admin only) */
export async function updateCourse(
  id: string | number,
  payload: Partial<CourseCreatePayload>
): Promise<Course> {
  const formData = new FormData();
  if (payload.title !== undefined) formData.append("title", payload.title);
  if (payload.description !== undefined) formData.append("description", payload.description);
  if (payload.price !== undefined) formData.append("price", String(payload.price));
  if (payload.currency !== undefined) formData.append("currency", payload.currency);
  if (payload.level !== undefined) formData.append("level", payload.level);
  if (payload.topics_covered !== undefined) formData.append("topics_covered", payload.topics_covered);
  if (payload.thumbnail instanceof File) {
    formData.append("thumbnail", payload.thumbnail);
  }

  const { data } = await api.patch<Course>(`/api/courses/${id}/`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}

/** DELETE /api/courses/{id}/ — Delete course (Admin only) */
export async function deleteCourse(id: string | number): Promise<void> {
  await api.delete(`/api/courses/${id}/`);
}

// ── Lessons API ─────────────────────────────

export interface GetLessonsParams {
  search?: string;
  order?: string;
  start_date?: string;
  end_date?: string;
  page?: number;
}

/** GET /api/courses/{courseId}/lessons/ */
export async function getCourseLessons(
  courseId: string | number,
  params?: GetLessonsParams
): Promise<PaginatedResponse<Lesson> | Lesson[]> {
  const { data } = await api.get<PaginatedResponse<Lesson> | Lesson[]>(`/api/courses/${courseId}/lessons/`, { params });
  return data;
}

/** GET /api/courses/{courseId}/lessons/{lessonId}/ */
export async function getLessonById(courseId: string | number, lessonId: string | number): Promise<Lesson> {
  const { data } = await api.get<Lesson>(`/api/courses/${courseId}/lessons/${lessonId}/`);
  return data;
}

/** POST /api/courses/{courseId}/lessons/ (Admin only, accepts FormData) */
export async function createLesson(courseId: string | number, payload: LessonCreatePayload): Promise<Lesson> {
  const form = new FormData();
  form.append("title", payload.title);
  form.append("description", payload.description);
  form.append("order", String(payload.order));
  if (payload.video_file) form.append("video_file", payload.video_file);
  if (payload.pdf_resource) form.append("pdf_resource", payload.pdf_resource);

  const { data } = await api.post<Lesson>(`/api/courses/${courseId}/lessons/`, form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}

/** PATCH /api/courses/{courseId}/lessons/{lessonId}/ (Admin only) */
export async function updateLesson(
  courseId: string | number,
  lessonId: string | number,
  payload: Partial<LessonCreatePayload>
): Promise<Lesson> {
  const form = new FormData();
  if (payload.title) form.append("title", payload.title);
  if (payload.description) form.append("description", payload.description);
  if (payload.order !== undefined) form.append("order", String(payload.order));
  if (payload.video_file instanceof File) form.append("video_file", payload.video_file);
  if (payload.pdf_resource instanceof File) form.append("pdf_resource", payload.pdf_resource);

  const { data } = await api.patch<Lesson>(`/api/courses/${courseId}/lessons/${lessonId}/`, form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}

/** DELETE /api/courses/{courseId}/lessons/{lessonId}/ (Admin only) */
export async function deleteLesson(courseId: string | number, lessonId: string | number): Promise<void> {
  await api.delete(`/api/courses/${courseId}/lessons/${lessonId}/`);
}
