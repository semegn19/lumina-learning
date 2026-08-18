import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Award, BookOpen, CheckCircle2, RotateCcw, Search, TrendingUp } from "lucide-react";
import { useState } from "react";

import courseTypography from "@/assets/course-typography.jpg";
import { Button } from "@/components/ui/button";
import { getEnrollments } from "@/lib/enrollments-api";
import { getCourseById } from "@/lib/courses-api";
import { getMediaUrl } from "@/lib/utils";
import type { Enrollment, PaginatedResponse } from "@/lib/api-types";

export const Route = createFileRoute("/my-learning")({
  head: () => ({
    meta: [
      { title: "My Learning | Lumina Learning" },
      {
        name: "description",
        content: "Track your enrolled courses, completion stats and continue where you left off.",
      },
      { property: "og:title", content: "My Learning | Lumina Learning" },
      { property: "og:description", content: "Track your progress and continue your journey." },
    ],
  }),
  component: MyLearning,
});

function EnrollmentCard({ enrollment }: { enrollment: Enrollment }) {
  const courseId = typeof enrollment.course === "object" ? (enrollment.course as any).id : enrollment.course;

  // Fetch full course details if title/thumbnail aren't embedded in enrollment object
  const { data: course } = useQuery({
    queryKey: ["course", courseId],
    queryFn: () => getCourseById(courseId),
    enabled: !!courseId,
  });

  const title =
    course?.title ||
    enrollment.course_title ||
    (typeof enrollment.course === "object" ? (enrollment.course as any).title : undefined) ||
    `Course #${courseId}`;
  const thumbnail = getMediaUrl(course?.thumbnail) || courseTypography;

  const numericProgress =
    typeof enrollment.progress === "number"
      ? enrollment.progress
      : parseFloat(String(enrollment.progress || 0));

  const done = enrollment.status === "C" || numericProgress >= 100;

  return (
    <article className="surface-card flex flex-col overflow-hidden p-5 rounded-2xl border border-border/70 transition-all duration-300 hover:border-primary/40 hover:bg-accent/20 hover:shadow-xl hover:-translate-y-1.5 group cursor-pointer">
      <div className="relative overflow-hidden rounded-xl">
        <img
          src={thumbnail}
          alt={title}
          loading="lazy"
          width={800}
          height={512}
          className="h-48 w-full rounded-xl object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <span
          className={`absolute right-3 top-3 inline-flex items-center gap-1 rounded-lg bg-card/95 px-3 py-1.5 text-sm font-semibold shadow-sm backdrop-blur-xs ${
            done ? "text-success" : "text-foreground"
          }`}
        >
          {done ? <CheckCircle2 className="size-4" aria-hidden /> : null}
          {done ? "Completed" : "In Progress"}
        </span>
      </div>

      <h2 className="mt-5 text-lg font-bold line-clamp-2 transition-colors group-hover:text-primary">{title}</h2>

      <div className="mt-auto pt-5">
        <div className="flex items-center justify-between text-sm">
          <span className={done ? "font-medium text-success" : "text-muted-foreground"}>
            {Math.round(numericProgress)}% Complete
          </span>
        </div>
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className={`h-full rounded-full ${done ? "bg-success" : "bg-primary"}`}
            style={{ width: `${Math.min(100, Math.max(0, numericProgress))}%` }}
          />
        </div>

        {done ? (
          <div className="mt-5 grid grid-cols-2 gap-2">
            <Button variant="outline" asChild className="w-full gap-1.5 rounded-lg px-2 text-xs">
              <Link to="/certificates">
                <Award className="size-3.5" aria-hidden /> View Certificate
              </Link>
            </Button>
            <Button asChild className="w-full gap-1.5 rounded-lg px-2 text-xs">
              <Link to="/learn" search={{ courseId: String(courseId) }}>
                <RotateCcw className="size-3.5" aria-hidden /> Rewatch Course
              </Link>
            </Button>
          </div>
        ) : (
          <Button asChild className="mt-5 w-full rounded-lg">
            <Link to="/learn" search={{ courseId: String(courseId) }}>
              Continue Learning
            </Link>
          </Button>
        )}
      </div>
    </article>
  );
}

function MyLearning() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");

  const { data, isLoading, isError } = useQuery({
    queryKey: ["my-enrollments", page],
    queryFn: async () => {
      const res = await getEnrollments({ page });
      return res;
    },
  });

  let enrollments: Enrollment[] = [];
  let totalPages = 1;
  let totalItems = 0;

  if (data) {
    if (Array.isArray(data)) {
      enrollments = data;
      totalItems = data.length;
      totalPages = 1;
    } else {
      const paginated = data as PaginatedResponse<Enrollment>;
      enrollments = paginated.results ?? [];
      totalItems = paginated.meta?.total_items ?? paginated.count ?? enrollments.length;
      totalPages = paginated.meta?.total_pages ?? Math.max(1, Math.ceil(totalItems / 10));
    }
  }

  // Filter enrollments by search string if entered
  const filteredEnrollments = search.trim()
    ? enrollments.filter((e) => {
        const title = (
          e.course_title ||
          (typeof e.course === "object" ? (e.course as any).title : "") ||
          ""
        ).toLowerCase();
        return title.includes(search.trim().toLowerCase());
      })
    : enrollments;

  const completedCount = enrollments.filter(
    (e) => e.status === "C" || (typeof e.progress === "number" ? e.progress : parseFloat(String(e.progress || 0))) >= 100
  ).length;
  const inProgressCount = enrollments.length - completedCount;

  const stats = [
    { value: String(totalItems || enrollments.length), label: "Total Courses Enrolled", icon: BookOpen, tone: "bg-primary-soft text-primary" },
    { value: String(completedCount), label: "Completed (This Page)", icon: CheckCircle2, tone: "bg-success-soft text-success" },
    { value: String(inProgressCount), label: "In Progress (This Page)", icon: TrendingUp, tone: "bg-accent text-accent-foreground" },
  ];

  const handlePageChange = (p: number) => {
    setPage(p);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-canvas-rose/40">

      <main className="mx-auto max-w-[1280px] px-6 py-8 md:px-8">
        <div className="mt-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">My Learning</h1>
            <p className="mt-2 text-muted-foreground">Track your progress and continue your journey.</p>
          </div>

          {/* Search Bar for My Learning */}
          <div className="relative w-full sm:w-80">
            <Search
              className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search enrolled courses..."
              className="h-11 w-full rounded-xl border border-input bg-card pl-10 pr-4 text-sm outline-none transition-shadow focus:ring-2 focus:ring-ring/30"
            />
          </div>
        </div>

        <section className="mt-8 grid gap-6 sm:grid-cols-3">
          {stats.map((s) => (
            <div key={s.label} className="surface-card flex items-center gap-4 p-6">
              <span className={`flex size-12 items-center justify-center rounded-full ${s.tone}`}>
                <s.icon className="size-5" aria-hidden />
              </span>
              <div>
                <p className="font-display text-2xl font-bold leading-none">{s.value}</p>
                <p className="mt-1 text-sm text-muted-foreground">{s.label}</p>
              </div>
            </div>
          ))}
        </section>

        {isLoading ? (
          <div className="mt-12 flex justify-center">
            <div className="size-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : isError ? (
          <div className="mt-12 text-center text-destructive">
            Failed to load your enrolled courses. Make sure you are signed in.
          </div>
        ) : filteredEnrollments.length === 0 ? (
          <div className="mt-12 text-center surface-card p-12">
            <h2 className="text-xl font-bold">
              {search ? `No enrollments match "${search}"` : "No Enrollments Yet"}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {search ? "Try searching for another course title." : "Explore our course catalog to get started on your learning journey."}
            </p>
            {!search && (
              <Button asChild className="mt-6">
                <Link to="/courses">Explore Courses</Link>
              </Button>
            )}
          </div>
        ) : (
          <>
            <section className="mt-6 grid gap-6 lg:grid-cols-3">
              {filteredEnrollments.map((e) => (
                <EnrollmentCard key={e.id} enrollment={e} />
              ))}
            </section>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <nav aria-label="Enrollment pagination" className="mt-12 flex items-center justify-center gap-2">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    onClick={() => handlePageChange(p)}
                    aria-current={page === p ? "page" : undefined}
                    className={`size-10 rounded-xl text-sm font-semibold transition-colors ${
                      page === p
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "bg-card border border-border text-muted-foreground hover:text-foreground hover:border-primary/40"
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </nav>
            )}
          </>
        )}
      </main>
    </div>
  );
}
