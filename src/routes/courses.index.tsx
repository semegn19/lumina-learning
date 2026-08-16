import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Bookmark, Clock, NotebookText, Search } from "lucide-react";
import { useState } from "react";

import courseTypography from "@/assets/course-typography.jpg";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { getCourses, getCourseLessons } from "@/lib/courses-api";
import { getUserById } from "@/lib/auth-api";
import { formatPrice, getMediaUrl } from "@/lib/utils";
import type { Course } from "@/lib/api-types";

export const Route = createFileRoute("/courses/")({
  head: () => ({
    meta: [
      { title: "Our Courses | Lumina Learning" },
      {
        name: "description",
        content:
          "Browse all Lumina Learning courses — UX design, Figma, web development and more, with lesson counts, duration and pricing.",
      },
      { property: "og:title", content: "Our Courses | Lumina Learning" },
      { property: "og:description", content: "Browse every course in the Lumina Learning catalogue." },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "canonical", href: "/courses" }],
  }),
  component: CourseListing,
});

const tabs = ["All Courses", "Beginner", "Intermediate", "Advanced"];
const ITEMS_PER_PAGE = 9;

function formatCourseLevel(level?: string): string {
  if (!level) return "Beginner";
  if (level === "B" || level.toLowerCase() === "beginner") return "Beginner";
  if (level === "I" || level.toLowerCase() === "intermediate") return "Intermediate";
  if (level === "A" || level.toLowerCase() === "advanced") return "Advanced";
  return level;
}

function CourseCard({
  course,
  saved,
  onToggleSave,
}: {
  course: Course;
  saved: boolean;
  onToggleSave: (id: number) => void;
}) {
  const navigate = useNavigate();

  // Fetch instructor name if not directly present
  const { data: instructor } = useQuery({
    queryKey: ["course-instructor", course.created_by],
    queryFn: () => getUserById(course.created_by!),
    enabled: !!course.created_by && !course.created_by_name,
  });

  // Fetch lesson count if missing from summary object
  const { data: lessons } = useQuery({
    queryKey: ["course-lessons", course.id],
    queryFn: async () => {
      const res = await getCourseLessons(course.id);
      return Array.isArray(res) ? res : res.results ?? [];
    },
    enabled: course.lesson_count === undefined,
  });

  let instructorName = course.created_by_name || "";
  if (!instructorName && instructor) {
    const fullName = `${instructor.first_name || ""} ${instructor.last_name || ""}`.trim();
    instructorName = fullName || instructor.username;
  }
  if (!instructorName) {
    instructorName = `Instructor ${course.created_by}`;
  }

  const lessonCount = course.lesson_count ?? lessons?.length ?? 0;
  const displayLevel = formatCourseLevel(course.level);

  return (
    <article
      onClick={() =>
        navigate({
          to: "/courses/$courseId",
          params: { courseId: String(course.id) },
        })
      }
      className="surface-card flex flex-col p-5 rounded-2xl border border-border/70 transition-all duration-300 hover:border-primary/40 hover:bg-accent/20 hover:shadow-xl hover:-translate-y-1.5 group cursor-pointer"
    >
      <div className="relative overflow-hidden rounded-xl">
        <img
          src={getMediaUrl(course.thumbnail) || courseTypography}
          alt={course.title}
          loading="lazy"
          width={800}
          height={512}
          className="h-48 w-full rounded-xl object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleSave(course.id);
          }}
          aria-label={`Save ${course.title}`}
          aria-pressed={saved}
          className={`absolute right-3 top-3 grid size-9 place-items-center rounded-xl transition-colors ${
            saved ? "bg-primary text-primary-foreground" : "bg-primary-soft text-primary"
          }`}
        >
          <Bookmark className="size-4" aria-hidden />
        </button>
      </div>

      <h2 className="mt-5 text-lg font-bold group-hover:text-primary transition-colors">
        {course.title}
      </h2>
      <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{course.description}</p>

      <div className="mt-4 flex items-center justify-between gap-3 border-b border-border pb-4">
        <div className="flex min-w-0 items-center gap-4 text-xs font-medium text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Clock className="size-3.5 text-primary" aria-hidden /> {displayLevel}
          </span>
          <span className="flex items-center gap-1.5">
            <NotebookText className="size-3.5 text-primary" aria-hidden /> {lessonCount} {lessonCount === 1 ? "Lesson" : "Lessons"}
          </span>
        </div>
        <span className="shrink-0 rounded-lg bg-card px-3 py-1.5 text-lg font-extrabold shadow-sm">
          {formatPrice(course.price, course.currency)}
        </span>
      </div>

      <div className="mt-4 flex items-center gap-3">
        {instructor?.profile_picture ? (
          <img
            src={getMediaUrl(instructor.profile_picture)}
            alt={instructorName}
            className="size-8 shrink-0 rounded-full border border-border object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <Avatar className="size-8 transition-transform duration-300 group-hover:scale-105">
            <AvatarFallback>{instructorName.slice(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
        )}
        <span className="text-sm font-medium">{instructorName}</span>
      </div>
    </article>
  );
}

function CourseListing() {
  const [activeTab, setActiveTab] = useState(tabs[0]);
  const [search, setSearch] = useState("");
  const [saved, setSaved] = useState<number[]>([]);
  const [page, setPage] = useState(1);

  // Map level tab to API query param
  const levelFilter =
    activeTab === "Beginner" ? "Beginner" : activeTab === "Intermediate" ? "Intermediate" : activeTab === "Advanced" ? "Advanced" : undefined;

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["courses", { search, level: levelFilter }],
    queryFn: async () => {
      const res = await getCourses({
        search: search || undefined,
        level: levelFilter,
      });
      return Array.isArray(res) ? res : res.results ?? [];
    },
  });

  const toggleSaved = (id: number) =>
    setSaved((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  const rawCourses: Course[] = data ?? [];

  // Filter client-side to ensure level matching works even if backend ignores level param
  const filteredCourses = rawCourses.filter((c) => {
    if (!activeTab || activeTab === "All Courses") return true;
    const norm = formatCourseLevel(c.level);
    return norm.toLowerCase() === activeTab.toLowerCase();
  });

  // Calculate 9 items per page pagination
  const totalPages = Math.max(1, Math.ceil(filteredCourses.length / ITEMS_PER_PAGE));
  const currentPage = Math.min(page, totalPages);
  const paginatedCourses = filteredCourses.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handlePageChange = (p: number) => {
    setPage(p);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-canvas">

      <main className="mx-auto max-w-[1280px] px-6 py-8 md:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">Our Courses</h1>
          <div className="relative w-full max-w-sm">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
            <Input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search courses…"
              className="h-10 rounded-xl pl-10"
            />
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-7 border-b border-border">
          {tabs.map((t) => (
            <button
              key={t}
              onClick={() => {
                setActiveTab(t);
                setPage(1);
              }}
              className={`-mb-px whitespace-nowrap border-b-2 pb-3 text-sm transition-colors ${
                activeTab === t
                  ? "border-primary font-semibold text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="mt-12 flex justify-center">
            <div className="size-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : isError ? (
          <div className="mt-12 text-center">
            <p className="text-destructive font-medium">Failed to load courses from server.</p>
            <p className="text-xs text-muted-foreground mt-1">{String(error)}</p>
            <button onClick={() => refetch()} className="mt-4 rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground">
              Try again
            </button>
          </div>
        ) : filteredCourses.length === 0 ? (
          <div className="mt-12 text-center text-muted-foreground">
            No courses found. Check back later or adjust your search filters.
          </div>
        ) : (
          <>
            <section className="mt-7 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {paginatedCourses.map((c) => (
                <CourseCard
                  key={c.id}
                  course={c}
                  saved={saved.includes(c.id)}
                  onToggleSave={toggleSaved}
                />
              ))}
            </section>

            {/* Pagination Controls at Bottom */}
            {totalPages > 1 && (
              <nav aria-label="Pagination" className="mt-12 flex items-center justify-center gap-2">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    onClick={() => handlePageChange(p)}
                    aria-current={currentPage === p ? "page" : undefined}
                    className={`size-10 rounded-xl text-sm font-semibold transition-colors ${
                      currentPage === p
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
