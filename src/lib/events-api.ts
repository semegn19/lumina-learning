import { api } from "@/lib/api-client";    
import type { EventCreatePayload, EventItem, EventRegistration, PaginatedResponse } from "@/lib/api-types";

export interface GetEventsParams {
  search?: string | undefined;
  currency?: string | undefined;
  start_date?: string | undefined;
  end_date?: string | undefined;
  page?: number | undefined;
}

/** GET /api/events/ — List all events */
export async function getEvents(
  params?: GetEventsParams
): Promise<PaginatedResponse<EventItem> | EventItem[]> {
  const { data } = await api.get<PaginatedResponse<EventItem> | EventItem[]>("/api/events/", {
    params,
  });
  return data;
}

/** GET /api/events/{id}/ — Get event detail by ID */
export async function getEventById(id: string | number): Promise<EventItem> {
  const { data } = await api.get<EventItem>(`/api/events/${id}/`);
  return data;
}

/** POST /api/events/ — Create a new event (Admin only) */
export async function createEvent(payload: EventCreatePayload): Promise<EventItem> {
  const formData = new FormData();
  formData.append("title", payload.title);
  formData.append("description", payload.description);
  formData.append("date", payload.date);
  formData.append("place", payload.place);
  formData.append("price", String(payload.price));
  formData.append("currency", payload.currency || "USD");
  if (payload.featured_guest) {
    formData.append("featured_guest", payload.featured_guest);
  }

  if (payload.image) {
    formData.append("image", payload.image);
  }

  const { data } = await api.post<EventItem>("/api/events/", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}

/** PUT /api/events/{id}/ or PATCH /api/events/{id}/ — Update an event (Admin only) */
export async function updateEvent(
  id: string | number,
  payload: Partial<EventCreatePayload>
): Promise<EventItem> {
  const formData = new FormData();
  if (payload.title !== undefined) formData.append("title", payload.title);
  if (payload.description !== undefined) formData.append("description", payload.description);
  if (payload.date !== undefined) formData.append("date", payload.date);
  if (payload.place !== undefined) formData.append("place", payload.place);
  if (payload.price !== undefined) formData.append("price", String(payload.price));
  if (payload.currency !== undefined) formData.append("currency", payload.currency);
  if (payload.featured_guest !== undefined) formData.append("featured_guest", payload.featured_guest);
  if (payload.image instanceof File) formData.append("image", payload.image);

  const { data } = await api.patch<EventItem>(`/api/events/${id}/`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}

/** DELETE /api/events/{id}/ — Delete an event (Admin only) */
export async function deleteEvent(id: string | number): Promise<void> {
  await api.delete(`/api/events/${id}/`);
}

/** POST /api/event-registrations/ — Register for an event (Student) */
export async function registerForEvent(eventId: number | string): Promise<EventRegistration> {
  const { data } = await api.post<EventRegistration>("/api/event-registrations/", {
    event: Number(eventId),
  });
  return data;
}

/** GET /api/event-registrations/?event={eventId} — List attendees for an event (Admin only) */
export async function getEventAttendees(
  eventId: number | string
): Promise<PaginatedResponse<EventRegistration> | EventRegistration[]> {
  const { data } = await api.get<PaginatedResponse<EventRegistration> | EventRegistration[]>(
    "/api/event-registrations/",
    { params: { event: eventId } }
  );
  return data;
}
