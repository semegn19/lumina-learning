import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, CalendarDays, Mail, Users } from "lucide-react";

import { AdminGuard } from "@/components/admin-guard";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getEventAttendees, getEventById } from "@/lib/events-api";
import { getUserById } from "@/lib/users-api";
import { getMediaUrl } from "@/lib/utils";
import type { EventRegistration, PaginatedResponse } from "@/lib/api-types";

export const Route = createFileRoute("/manage/events/$eventId/attendees")({
  head: () => ({
    meta: [
      { title: "Event Attendees | Lumina Learning" },
      { name: "description", content: "View members registered for this event." },
      { property: "og:title", content: "Event Attendees | Lumina Learning" },
      { property: "og:description", content: "View members registered for this event." },
      { property: "og:type", content: "website" },
    ],
  }),
  component: () => (
    <AdminGuard>
      <EventAttendeesPage />
    </AdminGuard>
  ),
});

function AttendeeCard({ reg }: { reg: EventRegistration }) {
  const userId = typeof reg.user === "object"
    ? reg.user.id
    : reg.user || (reg as any).user_id || (reg as any).student_id || reg.id;

  const { data: userProfile } = useQuery({
    queryKey: ["user", userId],
    queryFn: () => getUserById(userId!),
    enabled: !!userId,
  });

  const embeddedUser = typeof reg.user === "object" ? reg.user : undefined;
  const name = userProfile
    ? `${userProfile.first_name || ""} ${userProfile.last_name || ""}`.trim() || userProfile.username || userProfile.email
    : embeddedUser
    ? `${embeddedUser.first_name || ""} ${embeddedUser.last_name || ""}`.trim() || `User #${embeddedUser.id}`
    : reg.user_name || `User #${userId}`;

  const email = userProfile?.email || embeddedUser?.email || reg.user_email;
  const avatar = getMediaUrl(userProfile?.profile_picture || embeddedUser?.profile_picture);
  const registeredDate = reg.created_at;

  const isSuccess = reg.status === "S";
  const amountStr = reg.amount !== undefined
    ? Number(reg.amount) === 0
      ? "Free"
      : `${reg.currency || "$"}${Number(reg.amount).toFixed(2)}`
    : "Registered";

  return (
    <li className="surface-card p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Link
          to="/users/$userId"
          params={{ userId: String(userId) }}
          className="flex items-center gap-4 group"
        >
          <Avatar className="size-14 border border-border shadow-sm">
            {avatar ? <AvatarImage src={avatar} alt={name} className="object-cover" /> : null}
            <AvatarFallback className="bg-primary-soft font-bold text-base text-primary">
              {name.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <h3 className="text-xl font-bold group-hover:text-primary transition-colors">{name}</h3>
            {email && (
              <p className="mt-0.5 flex items-center gap-1.5 text-sm text-muted-foreground">
                <Mail className="size-3.5 text-primary" aria-hidden /> {email}
              </p>
            )}
          </div>
        </Link>

        <div className="flex flex-wrap items-center gap-3">
          <span
            className={`rounded-full px-3.5 py-1 text-xs font-semibold ${
              isSuccess ? "bg-success-soft text-success" : "bg-warning-soft text-warning"
            }`}
          >
            {isSuccess ? "Registered" : "Pending Payment"}
          </span>
          <span className="rounded-full bg-accent px-3 py-1 text-xs font-bold text-accent-foreground">
            {amountStr}
          </span>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between border-t border-border pt-4 text-xs text-muted-foreground">
        {registeredDate && (
          <span className="flex items-center gap-1.5">
            <CalendarDays className="size-3.5 text-primary" aria-hidden /> Registered on{" "}
            {new Date(registeredDate).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </span>
        )}
        {reg.reference && (
          <span className="font-mono text-[11px]">Ref: {reg.reference}</span>
        )}
      </div>
    </li>
  );
}

function EventAttendeesPage() {
  const { eventId } = useParams({ from: "/manage/events/$eventId/attendees" });

  const { data: event } = useQuery({
    queryKey: ["event", eventId],
    queryFn: () => getEventById(eventId),
    enabled: !!eventId,
  });

  const { data: attendeesData, isLoading } = useQuery({
    queryKey: ["event-attendees", eventId],
    queryFn: () => getEventAttendees(eventId),
    enabled: !!eventId,
  });

  let attendees: EventRegistration[] = [];
  if (attendeesData) {
    if (Array.isArray(attendeesData)) {
      attendees = attendeesData;
    } else {
      const paginated = attendeesData as PaginatedResponse<EventRegistration>;
      attendees = paginated.results ?? [];
    }
  }

  return (
    <div className="min-h-screen bg-canvas">

      <main className="mx-auto max-w-[960px] px-6 py-8 md:px-8">
        <Link to="/manage/events" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" aria-hidden /> Back to my events
        </Link>

        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">Registered Attendees</h1>
        <p className="mt-2 text-muted-foreground">
          {attendees.length} {attendees.length === 1 ? "person is" : "people are"} registered for{" "}
          <span className="font-medium text-foreground">{event?.title || `Event #${eventId}`}</span>
          {event?.place ? ` · ${event.place}` : ""}
        </p>

        {isLoading ? (
          <div className="mt-12 flex justify-center">
            <div className="size-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : attendees.length === 0 ? (
          <div className="surface-card mt-10 grid place-items-center gap-3 p-16 text-center">
            <Users className="size-8 text-muted-foreground" aria-hidden />
            <p className="text-lg font-semibold">No registrations yet</p>
            <p className="text-sm text-muted-foreground">
              Members registered for this event will appear here as soon as they sign up.
            </p>
          </div>
        ) : (
          <ul className="mt-10 space-y-4">
            {attendees.map((a) => (
              <AttendeeCard key={a.id} reg={a} />
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
