import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Circle,
  MoreHorizontal,
  Triangle,
  Calendar as CalendarIcon,
  ArrowRight,
  CheckCircle2,
  MapPin,
  Clock,
} from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import { toast } from "sonner";

import bannerStudent from "@/assets/banner-student.jpg";
import courseTypography from "@/assets/course-typography.jpg";
import courseUx from "@/assets/course-ux.jpg";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { getEnrollments } from "@/lib/enrollments-api";
import { getCourses } from "@/lib/courses-api";
import { getEvents } from "@/lib/events-api";
import { getUsers } from "@/lib/users-api";
import { buildUserLookupIndex } from "@/lib/dashboard-audit-api";
import { formatPrice, getMediaUrl } from "@/lib/utils";
import type { Course, Enrollment, EventItem } from "@/lib/api-types";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Student Dashboard | Lumina Learning" },
      {
        name: "description",
        content:
          "Continue your courses, track progress, browse upcoming events and discover new classes on Lumina Learning.",
      },
      { property: "og:title", content: "Student Dashboard | Lumina Learning" },
      {
        property: "og:description",
        content: "Continue your courses, track progress and discover new classes.",
      },
    ],
  }),
  component: StudentDashboard,
});

const PROGRESS_STYLES = [
  { tone: "bg-tile-violet", icon: Triangle },
  { tone: "bg-tile-amber", icon: Circle },
  { tone: "bg-tile-pink", icon: BookOpen },
];

function formatEventDate(isoString?: string) {
  if (!isoString) return { dateStr: "TBD", timeStr: "" };
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return { dateStr: isoString, timeStr: "" };
    const dateStr = d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
    const timeStr = d.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
    return { dateStr: dateStr.toUpperCase(), timeStr };
  } catch {
    return { dateStr: isoString, timeStr: "" };
  }
}

function StudentDashboard() {
  // 1. Fetch user's enrollments for "Your Progress"
  const { data: enrollmentsData } = useQuery({
    queryKey: ["my-enrollments-dashboard"],
    queryFn: () => getEnrollments(),
  });

  // 2. Fetch full courses list to resolve enrollment course titles & discover courses
  const { data: coursesData } = useQuery({
    queryKey: ["courses-all-lookup"],
    queryFn: () => getCourses(),
  });

  // 3. Fetch users for instructor names and avatars
  const { data: usersData } = useQuery({
    queryKey: ["users-all-lookup"],
    queryFn: () => getUsers(),
  });

  const userIndex = useMemo(() => {
    return buildUserLookupIndex(usersData);
  }, [usersData]);

  // 4. Fetch events for "Upcoming events"
  const { data: eventsData } = useQuery({
    queryKey: ["events-dashboard-upcoming"],
    queryFn: () => getEvents(),
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("enrolled") === "true") {
      toast.success("Welcome! Your course enrollment is confirmed and ready to start.");
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const rawCourses: Course[] = Array.isArray(coursesData)
    ? coursesData
    : coursesData?.results ?? [];

  // Build courses lookup map (id -> Course)
  const coursesMap = useMemo(() => {
    const map = new Map<number, Course>();
    for (const c of rawCourses) {
      map.set(Number(c.id), c);
    }
    return map;
  }, [rawCourses]);

  const rawEnrollments: Enrollment[] = Array.isArray(enrollmentsData)
    ? enrollmentsData
    : enrollmentsData?.results ?? [];

  // Process enrolled courses (top 3) with resolved titles
  const topProgress = useMemo(() => {
    if (rawEnrollments.length > 0) {
      return rawEnrollments.slice(0, 3).map((enr, idx) => {
        const style = PROGRESS_STYLES[idx % PROGRESS_STYLES.length]!;
        const courseId =
          typeof enr.course === "object" && enr.course !== null
            ? (enr.course as any).id
            : enr.course;
        const matchedCourse = coursesMap.get(Number(courseId));
        const title =
          matchedCourse?.title ||
          enr.course_title ||
          (typeof enr.course === "object" && enr.course !== null
            ? (enr.course as any).title
            : undefined) ||
          `Course #${courseId}`;

        const numericProgress = Math.round(
          typeof enr.progress === "number"
            ? enr.progress
            : parseFloat(String(enr.progress || 0))
        );
        return {
          courseId,
          title,
          value: isNaN(numericProgress) ? 0 : Math.min(100, Math.max(0, numericProgress)),
          tone: style.tone,
          icon: style.icon,
        };
      });
    }

    return [];
  }, [rawEnrollments, coursesMap]);

  // Process upcoming events (2 closest future events)
  const rawEvents: EventItem[] = Array.isArray(eventsData)
    ? eventsData
    : eventsData?.results ?? [];

  const upcomingEvents = useMemo(() => {
    if (rawEvents.length === 0) {
      return [
        {
          id: 1,
          tag: "IN-PERSON",
          dateStr: "OCT 15, 2026",
          timeStr: "9:00 AM",
          title: "Annual Design Symposium",
          description: "Join international industry leaders and visionary educators exploring creative mastery.",
          price: "$149.00",
          place: "Main Auditorium",
          image: courseTypography,
          is_registered: false,
        },
        {
          id: 2,
          tag: "ONLINE",
          dateStr: "NOV 02, 2026",
          timeStr: "2:00 PM",
          title: "Typography & Rhythm Masterclass",
          description: "Hands-on virtual workshop exploring structural hierarchy and harmonic layouts.",
          price: "$49.00",
          place: "Online Event",
          image: courseUx,
          is_registered: false,
        },
      ];
    }

    const now = Date.now() - 24 * 60 * 60 * 1000;
    // Sort upcoming events by date
    const futureEvents = rawEvents
      .filter((e) => {
        if (!e.date) return true;
        const t = new Date(e.date).getTime();
        return isNaN(t) || t >= now;
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const selectedEvents = (futureEvents.length >= 2 ? futureEvents : rawEvents).slice(0, 2);

    return selectedEvents.map((e, idx) => {
      const { dateStr, timeStr } = formatEventDate(e.date);
      return {
        id: e.id,
        tag: e.place ? e.place.toUpperCase() : "EVENT",
        dateStr,
        timeStr,
        place: e.place || "Online",
        title: e.title,
        description: e.description || "Join us for an inspiring session designed to level up your craft.",
        price: formatPrice(e.price, e.currency),
        image: getMediaUrl(e.picture || e.image || e.thumbnail || e.cover_image) || (idx % 2 === 0 ? courseTypography : courseUx),
        is_registered: Boolean(e.is_registered),
      };
    });
  }, [rawEvents]);

  // Process Discover Courses (2 courses with real instructor names & profile pictures)
  const discoverCourses = useMemo(() => {
    if (rawCourses.length === 0) {
      return [
        {
          id: "1",
          title: "English Grammar",
          price: "$50.99",
          blurb: "Basic English grammar includes learning verbs, nouns, and simple sentence structures.",
          image: courseUx,
          instructorName: "Instructor",
          instructorAvatar: null as string | null | undefined,
          instructorInitials: "IN",
        },
        {
          id: "2",
          title: "Idioms about friendship",
          price: "$25.99",
          blurb: "Friendship idioms add colorful expressions to language, like 'to be thick as thieves'.",
          image: courseTypography,
          instructorName: "Instructor",
          instructorAvatar: null as string | null | undefined,
          instructorInitials: "IN",
        },
      ];
    }

    return rawCourses.slice(0, 2).map((c, idx) => {
      const instructorUser = userIndex.byId.get(Number(c.created_by));
      const instructorName = instructorUser
        ? `${instructorUser.first_name || ""} ${instructorUser.last_name || ""}`.trim() ||
          instructorUser.username
        : c.created_by_name || "Instructor";

      const instructorAvatar = getMediaUrl(instructorUser?.profile_picture || instructorUser?.avatar);
      const instructorInitials = instructorUser?.first_name
        ? `${instructorUser.first_name[0] || ""}${instructorUser.last_name?.[0] || ""}`.toUpperCase()
        : instructorName.slice(0, 2).toUpperCase();

      return {
        id: String(c.id),
        title: c.title,
        price: formatPrice(c.price, c.currency),
        blurb:
          c.description ||
          "Explore interactive lessons and exercises designed to build real-world mastery.",
        image: getMediaUrl(c.thumbnail) || (idx % 2 === 0 ? courseUx : courseTypography),
        instructorName,
        instructorAvatar,
        instructorInitials,
      };
    });
  }, [rawCourses, userIndex]);

  // Interactive Calendar State
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedDateStr, setSelectedDateStr] = useState<string>(() => new Date().toDateString());

  // Generate days for active week
  const { weekDays, calendarHeader } = useMemo(() => {
    const today = new Date();
    const currentMonday = new Date(today);
    const dayOfWeek = (today.getDay() + 6) % 7; // 0 = Mon, 6 = Sun
    currentMonday.setDate(today.getDate() - dayOfWeek + weekOffset * 7);

    const days = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(currentMonday);
      d.setDate(currentMonday.getDate() + i);
      return d;
    });

    const first = days[0]!;
    const last = days[6]!;
    let header = "";
    if (first.getMonth() === last.getMonth()) {
      header = first.toLocaleDateString("en-US", { month: "long", year: "numeric" });
    } else {
      const m1 = first.toLocaleDateString("en-US", { month: "short" });
      const m2 = last.toLocaleDateString("en-US", { month: "short", year: "numeric" });
      header = `${m1} - ${m2}`;
    }

    return { weekDays: days, calendarHeader: header };
  }, [weekOffset]);

  const todayStr = new Date().toDateString();

  return (
    <div className="min-h-screen bg-canvas">

      <main className="mx-auto max-w-[1280px] px-6 py-8 md:px-8">
        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <div className="space-y-10">
            {/* Promo banner */}
            <section className="grid overflow-hidden rounded-2xl bg-secondary sm:grid-cols-[1fr_1fr] shadow-sm">
              <div className="flex flex-col justify-center gap-6 p-8">
                <h2 className="max-w-sm text-2xl font-bold leading-snug">
                  Have you seen the new vocabulary course that has come out yet?
                </h2>
                <Button asChild className="w-fit rounded-full bg-foreground px-6 text-background font-semibold shadow-sm transition-all duration-300 hover:bg-primary hover:text-primary-foreground hover:scale-105 hover:shadow-lg cursor-pointer">
                  <Link to="/courses">Explore Courses</Link>
                </Button>
              </div>
              <img
                src={bannerStudent}
                alt="Student reading on a tablet while sitting on a stack of books"
                width={900}
                height={512}
                className="h-full w-full object-cover min-h-[220px]"
              />
            </section>

            {/* Progress tiles */}
            {topProgress.length > 0 && (
              <section>
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-xl font-bold">Your progress</h3>
                  <Link to="/my-learning" className="text-sm font-semibold text-primary hover:underline flex items-center gap-1">
                    View all <ArrowRight className="size-3.5" aria-hidden />
                  </Link>
                </div>
                <div className="grid gap-4 sm:grid-cols-3">
                  {topProgress.map((t) => (
                    <Link
                      key={t.courseId ? `prog-${t.courseId}` : t.title}
                      to="/learn"
                      search={{ courseId: String(t.courseId) }}
                      className={`group block rounded-2xl p-5 border border-border/70 transition-all duration-300 hover:border-primary/50 hover:shadow-xl hover:-translate-y-1.5 cursor-pointer ${t.tone}`}
                    >
                      <div className="flex items-start justify-between">
                        <span className="flex size-9 items-center justify-center rounded-full bg-card shadow-xs transition-transform duration-300 group-hover:scale-110">
                          <t.icon className="size-4 text-foreground" aria-hidden />
                        </span>
                        <MoreHorizontal className="size-5 text-foreground/50 group-hover:text-foreground transition-colors" aria-hidden />
                      </div>
                      <h4 className="mt-8 text-base font-semibold text-foreground line-clamp-1" title={t.title}>
                        {t.title}
                      </h4>
                      <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-card/60">
                        <div className="h-full rounded-full bg-foreground transition-all" style={{ width: `${t.value}%` }} />
                      </div>
                      <div className="mt-2 flex justify-between text-sm text-foreground/70">
                        <span>Progress</span>
                        <span className="font-bold text-foreground">{t.value}%</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* Events */}
            <section>
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-xl font-bold">Upcoming events</h3>
                <Link to="/events" className="text-sm font-semibold text-primary hover:underline flex items-center gap-1">
                  View all <ArrowRight className="size-3.5" aria-hidden />
                </Link>
              </div>
              <div className="grid gap-6 sm:grid-cols-2">
                {upcomingEvents.map((e) => (
                  <article key={e.id} className="surface-card overflow-hidden flex flex-col justify-between rounded-2xl border border-border/70 transition-all duration-300 hover:border-primary/40 hover:bg-accent/20 hover:shadow-xl hover:-translate-y-1.5 group cursor-pointer">
                    <div>
                      <div className="relative overflow-hidden">
                        <img
                          src={e.image}
                          alt={e.title}
                          loading="lazy"
                          width={800}
                          height={512}
                          className="h-52 w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        <div className="absolute right-3 top-3 flex items-center gap-1.5">
                          {e.is_registered && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-success-soft px-2.5 py-1 text-xs font-bold text-success shadow-sm backdrop-blur-sm">
                              <CheckCircle2 className="size-3.5" aria-hidden /> Registered
                            </span>
                          )}
                          <span className="rounded-full bg-card/95 px-2.5 py-1 text-xs font-bold tracking-wide shadow-sm">
                            {e.tag}
                          </span>
                        </div>
                      </div>
                      <div className="p-5 pb-0">
                        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold tracking-wide text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="size-3.5 text-primary" aria-hidden /> {e.dateStr} {e.timeStr ? `• ${e.timeStr}` : ""}
                          </span>
                          {e.place && (
                            <span className="flex items-center gap-1">
                              <MapPin className="size-3.5 text-primary" aria-hidden /> {e.place}
                            </span>
                          )}
                        </div>
                        <h4 className="mt-2 text-lg font-bold line-clamp-2 transition-colors group-hover:text-primary">{e.title}</h4>
                        <p className="mt-2 text-xs text-muted-foreground line-clamp-2">{e.description}</p>
                      </div>
                    </div>

                    <div className="p-5 pt-4">
                      <div className="flex items-end justify-between border-t border-border/70 pt-4">
                        <div>
                          <p className="field-label text-xs text-muted-foreground">TICKETS / ADMISSION</p>
                          <p className="text-lg font-bold">{e.price}</p>
                        </div>
                        <Button
                          asChild
                          variant={e.is_registered ? "secondary" : "default"}
                          className="rounded-full px-5 font-semibold"
                        >
                          <Link to="/events/$eventId" params={{ eventId: String(e.id) }}>
                            {e.is_registered ? "View Ticket" : "Register Now"}
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          </div>

          {/* Right rail */}
          <aside className="space-y-8">
            {/* Interactive Calendar */}
            <div className="surface-card p-5">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setWeekOffset((w) => w - 1)}
                  className="flex size-8 items-center justify-center rounded-full border border-border hover:bg-muted transition-colors"
                  aria-label="Previous week"
                >
                  <ChevronLeft className="size-4" aria-hidden />
                </button>
                <div className="text-center">
                  <p className="font-display text-sm font-bold flex items-center justify-center gap-1.5">
                    <CalendarIcon className="size-3.5 text-primary" aria-hidden />
                    {calendarHeader}
                  </p>
                  {weekOffset !== 0 && (
                    <button
                      onClick={() => {
                        setWeekOffset(0);
                        setSelectedDateStr(new Date().toDateString());
                      }}
                      className="text-[11px] font-medium text-primary hover:underline mt-0.5"
                    >
                      Jump to Today
                    </button>
                  )}
                </div>
                <button
                  onClick={() => setWeekOffset((w) => w + 1)}
                  className="flex size-8 items-center justify-center rounded-full border border-border hover:bg-muted transition-colors"
                  aria-label="Next week"
                >
                  <ChevronRight className="size-4" aria-hidden />
                </button>
              </div>

              <div className="mt-5 grid grid-cols-7 gap-1 text-center text-xs font-semibold text-muted-foreground">
                {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
                  <span key={d}>{d}</span>
                ))}
              </div>

              <div className="mt-2 grid grid-cols-7 gap-1 text-center text-sm">
                {weekDays.map((d) => {
                  const dStr = d.toDateString();
                  const isToday = dStr === todayStr;
                  const isSelected = dStr === selectedDateStr;

                  let cellStyle = "mx-auto flex size-8 items-center justify-center rounded-full transition-all text-xs font-medium";

                  if (isSelected && isToday) {
                    cellStyle += " bg-primary font-bold text-primary-foreground shadow-sm scale-105";
                  } else if (isSelected) {
                    cellStyle += " bg-accent font-bold text-primary ring-1 ring-primary/40 scale-105";
                  } else if (isToday) {
                    cellStyle += " bg-primary-soft font-bold text-primary ring-1 ring-primary/30";
                  } else {
                    cellStyle += " hover:bg-muted text-foreground";
                  }

                  return (
                    <button
                      key={dStr}
                      onClick={() => setSelectedDateStr(dStr)}
                      className={cellStyle}
                      title={d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                    >
                      {d.getDate()}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Discover Courses */}
            <div>
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-xl font-bold">Discover courses</h3>
                <Link to="/courses" className="text-xs font-semibold text-primary hover:underline">
                  Browse all
                </Link>
              </div>
              <div className="space-y-4">
                {discoverCourses.map((c) => (
                  <Link
                    key={c.id}
                    to="/courses/$courseId"
                    params={{ courseId: c.id }}
                    className="group block surface-card overflow-hidden p-3.5 rounded-2xl border border-border/70 transition-all duration-300 hover:border-primary/40 hover:bg-accent/20 hover:shadow-xl hover:-translate-y-1.5 cursor-pointer"
                  >
                    <div className="relative overflow-hidden rounded-xl">
                      <img
                        src={c.image}
                        alt={c.title}
                        loading="lazy"
                        width={800}
                        height={512}
                        className="h-32 w-full rounded-xl object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <span className="absolute bottom-2 right-2 rounded-md bg-card/95 px-2 py-0.5 text-xs font-bold shadow-sm backdrop-blur-xs">
                        {c.price}
                      </span>
                    </div>
                    <div className="space-y-2 p-1.5 pt-3">
                      <h4 className="text-sm font-bold line-clamp-1 group-hover:text-primary transition-colors">
                        {c.title}
                      </h4>
                      <p className="text-xs text-muted-foreground line-clamp-2">{c.blurb}</p>
                      <div className="flex items-center justify-between border-t border-border/70 pt-2.5">
                        <div className="flex items-center gap-2">
                          <Avatar className="size-6 border border-border/60 transition-transform duration-300 group-hover:scale-105">
                            {c.instructorAvatar ? (
                              <AvatarImage src={c.instructorAvatar} alt={c.instructorName} className="object-cover" />
                            ) : null}
                            <AvatarFallback className="bg-primary/10 text-[10px] font-bold text-primary">
                              {c.instructorInitials}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-xs font-medium text-muted-foreground truncate max-w-[90px]">
                            {c.instructorName}
                          </span>
                        </div>
                        <span className="inline-flex h-7 items-center rounded-full bg-foreground px-3 text-xs font-semibold text-background transition-all duration-300 group-hover:bg-primary group-hover:text-primary-foreground">
                          View course
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
