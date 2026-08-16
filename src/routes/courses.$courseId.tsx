import { createFileRoute, Link, useNavigate, useParams } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Award,
  BarChart3,
  CalendarDays,
  Check,
  ChevronRight,
  Globe,
  Lock,
  MonitorPlay,
  Play,
  RefreshCcw,
} from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

import courseTypography from "@/assets/course-typography.jpg";
import { PaymentDialog } from "@/components/payment-dialog";
import { Button } from "@/components/ui/button";
import { getCourseById, getCourseLessons } from "@/lib/courses-api";
import { getUserById } from "@/lib/auth-api";
import { enrollInCourse, getEnrollments } from "@/lib/enrollments-api";
import { getApiErrorMessage } from "@/lib/api-client";
import { formatPrice, getMediaUrl } from "@/lib/utils";
import type { Enrollment, Lesson } from "@/lib/api-types";

export const Route = createFileRoute("/courses/$courseId")({
  head: () => ({
    meta: [
      { title: "Course Details | Lumina Learning" },
      {
        name: "description",
        content:
          "Master the fundamentals of your chosen discipline with hands-on projects, comprehensive lessons, and a certificate of completion.",
      },
      { property: "og:title", content: "Course Details | Lumina Learning" },
      { property: "og:description", content: "Master fundamentals with hands-on lessons, projects, and insights." },
      { property: "og:type", content: "website" },
    ],
  }),
  component: CourseDetails,
});

function formatCourseLevel(level?: string): string {
  if (!level) return "Beginner Level";
  const l = level.toLowerCase();
  if (l === "b" || l === "beginner") return "Beginner Level";
  if (l === "i" || l === "intermediate") return "Intermediate Level";
  if (l === "a" || l === "advanced") return "Advanced Level";
  return `${level} Level`;
}

function CourseDetails() {
  const { courseId } = useParams({ from: "/courses/$courseId" });
  const [payOpen, setPayOpen] = useState(false);
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const previewSectionRef = useRef<HTMLDivElement>(null);

  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // 1. Fetch course details
  const { data: course, isLoading: courseLoading, isError: courseError } = useQuery({
    queryKey: ["course", courseId],
    queryFn: () => getCourseById(courseId),
    enabled: !!courseId,
  });

  // 2. Fetch instructor profile by created_by ID
  const { data: instructor } = useQuery({
    queryKey: ["user", course?.created_by],
    queryFn: () => (course?.created_by ? getUserById(course.created_by) : Promise.resolve(null)),
    enabled: !!course?.created_by,
  });

  // 3. Fetch lessons
  const { data: lessonsData } = useQuery({
    queryKey: ["course-lessons", courseId],
    queryFn: async () => {
      const res = await getCourseLessons(courseId);
      return Array.isArray(res) ? res : res.results ?? [];
    },
    enabled: !!courseId,
  });

  // 4. Fetch user enrollments to check if already enrolled
  const { data: enrollmentsData } = useQuery({
    queryKey: ["my-enrollments"],
    queryFn: () => getEnrollments(),
  });

  const rawEnrollments: Enrollment[] = Array.isArray(enrollmentsData)
    ? enrollmentsData
    : enrollmentsData?.results ?? [];

  const isEnrolled = rawEnrollments.some((enr) => {
    const cId =
      typeof enr.course === "object" && enr.course !== null
        ? (enr.course as any).id
        : enr.course;
    return Number(cId) === Number(courseId);
  });

  const enrollMut = useMutation({
    mutationFn: () => {
      if (isEnrolled) {
        return Promise.reject(new Error("You are already enrolled in this course."));
      }
      return enrollInCourse({ course: Number(courseId) });
    },
    onSuccess: () => {
      toast.success(`Successfully enrolled in "${course?.title || "course"}"!`);
      void queryClient.invalidateQueries({ queryKey: ["my-enrollments"] });
      void queryClient.invalidateQueries({ queryKey: ["enrollments"] });
      void navigate({ to: "/learn", search: { courseId: String(courseId) } });
    },
    onError: (err) => {
      toast.error(`Enrollment failed: ${getApiErrorMessage(err)}`);
    },
  });

  if (courseLoading) {
    return (
      <div className="min-h-screen bg-canvas">
        <div className="mt-20 flex justify-center">
          <div className="size-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </div>
    );
  }

  if (courseError || !course) {
    return (
      <div className="min-h-screen bg-canvas">
        <main className="mx-auto max-w-[1000px] px-6 py-20 text-center">
          <h1 className="text-2xl font-bold text-destructive">Course not found</h1>
          <p className="mt-2 text-muted-foreground">The requested course could not be loaded.</p>
          <Button asChild className="mt-6 rounded-lg">
            <Link to="/courses">Back to Courses</Link>
          </Button>
        </main>
      </div>
    );
  }

  const lessons: Lesson[] = lessonsData ?? [];
  const firstLesson = lessons[0];
  const previewVideoUrl = getMediaUrl(firstLesson?.video_file) || undefined;

  // Instructor metadata
  let instructorName = course.created_by_name || "";
  if (!instructorName && instructor) {
    const fullName = `${instructor.first_name || ""} ${instructor.last_name || ""}`.trim();
    instructorName = fullName || instructor.username;
  }
  if (!instructorName) {
    instructorName = `Instructor #${course.created_by}`;
  }
  const instructorAvatar = getMediaUrl(instructor?.profile_picture || instructor?.avatar) || undefined;
  const instructorInitials = instructorName.slice(0, 2).toUpperCase();

  // Topics
  const rawTopics = course.topics_covered ? course.topics_covered.split(/,|\n/).map((t) => t.trim()).filter(Boolean) : [];
  const topics = rawTopics.length > 0
    ? rawTopics
    : [
        "Prototyping high-fidelity interactive models",
        "User Research methodologies and execution",
        "Wireframing complex interfaces efficiently",
        "Accessibility standards and inclusive design",
      ];

  // Pricing
  const numericPrice = parseFloat(course.price || "0");
  const isFree = numericPrice <= 0;
  const displayPrice = formatPrice(course.price, course.currency);

  // Updated date string
  let updatedDateStr = "Recent";
  if (course.updated_at) {
    try {
      const d = new Date(course.updated_at);
      if (!isNaN(d.getTime())) {
        updatedDateStr = d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
      }
    } catch {
      updatedDateStr = "Recent";
    }
  }

  const features = [
    { icon: Award, label: "Certificate" },
    { icon: BarChart3, label: formatCourseLevel(course.level) },
    { icon: MonitorPlay, label: `${lessons.length} ${lessons.length === 1 ? "Lesson" : "Lessons"}` },
    { icon: RefreshCcw, label: `Updated ${updatedDateStr}` },
    { icon: Globe, label: "English" },
    { icon: CalendarDays, label: "Self-Paced" },
  ];

  const handleEnrollClick = () => {
    if (isEnrolled) {
      void navigate({ to: "/learn", search: { courseId: String(courseId) } });
      return;
    }
    if (isFree) {
      enrollMut.mutate();
    } else {
      setPayOpen(true);
    }
  };

  const togglePreviewPlay = () => {
    if (previewVideoUrl) {
      if (isPlayingPreview && videoRef.current) {
        videoRef.current.pause();
        setIsPlayingPreview(false);
      } else {
        setIsPlayingPreview(true);
        setTimeout(() => {
          if (videoRef.current) {
            void videoRef.current.play();
          }
        }, 100);
      }
    } else {
      toast.info("No video preview available for this course yet.");
    }
  };

  const handleFirstLessonClick = () => {
    if (previewVideoUrl) {
      setIsPlayingPreview(true);
      previewSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      setTimeout(() => {
        if (videoRef.current) {
          void videoRef.current.play();
        }
      }, 300);
    } else {
      toast.info(`Previewing: ${firstLesson?.title || "Lesson 1"}`);
    }
  };

  const handleLockedLessonClick = (lessonTitle: string) => {
    toast.info(`"${lessonTitle}" is locked. Please enroll in the course to unlock all lessons.`);
    handleEnrollClick();
  };

  return (
    <div className="min-h-screen bg-canvas">

      <main className="mx-auto max-w-[1000px] px-6 py-8 md:px-8">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 pt-4 text-sm text-muted-foreground">
          <Link to="/courses" className="hover:text-foreground">
            Courses
          </Link>
          <ChevronRight className="size-3.5" aria-hidden />
          <span className="font-medium text-foreground line-clamp-1">{course.title}</span>
        </nav>

        {/* Hero Header */}
        <header className="mt-4 grid gap-6 md:grid-cols-[1fr_auto] md:items-start">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">{course.title}</h1>
            <p className="mt-3 text-base text-muted-foreground leading-relaxed">
              {course.description}
            </p>
            <div className="mt-5 flex items-center gap-3">
              {instructorAvatar ? (
                <img
                  src={instructorAvatar}
                  alt={instructorName}
                  className="size-8 shrink-0 rounded-full border border-border object-cover shadow-sm"
                />
              ) : (
                <div className="flex size-8 shrink-0 items-center justify-center rounded-full border border-border bg-primary-soft text-xs font-bold text-primary shadow-sm">
                  {instructorInitials}
                </div>
              )}
              <span className="text-sm font-medium text-muted-foreground">Created by {instructorName}</span>
            </div>
          </div>

          <div className="flex flex-col items-start gap-4 md:items-end">
            <Button
              className="rounded-lg px-8 text-base font-semibold shadow-md gap-2"
              onClick={handleEnrollClick}
              disabled={enrollMut.isPending}
            >
              {isEnrolled ? (
                <>
                  <MonitorPlay className="size-4" aria-hidden /> Continue Learning
                </>
              ) : enrollMut.isPending ? (
                "Enrolling..."
              ) : isFree ? (
                "Enroll for Free"
              ) : (
                "Enroll Now"
              )}
            </Button>
            {!isEnrolled && (
              <PaymentDialog
                open={payOpen}
                onOpenChange={setPayOpen}
                title={`Enroll in ${course.title}`}
                description="Choose how you'd like to pay for this course."
                amount={displayPrice}
                courseId={course.id}
                currency={course.currency}
              />
            )}
            <p className="font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              {isEnrolled ? "Enrolled" : displayPrice}
            </p>
          </div>
        </header>

        {/* Video / Thumbnail Preview */}
        <div ref={previewSectionRef} className="relative mt-8 overflow-hidden rounded-2xl bg-secondary shadow-lg">
          {previewVideoUrl && isPlayingPreview ? (
            <video
              ref={videoRef}
              src={previewVideoUrl}
              controls
              autoPlay
              className="aspect-video w-full object-cover"
              onEnded={() => setIsPlayingPreview(false)}
            />
          ) : (
            <>
              <img
                src={getMediaUrl(course.thumbnail) || courseTypography}
                alt={`Course preview: ${course.title}`}
                loading="lazy"
                width={800}
                height={512}
                className="aspect-video w-full object-cover opacity-90"
              />
              <button
                type="button"
                onClick={togglePreviewPlay}
                aria-label="Play course preview"
                className="absolute inset-0 flex items-center justify-center transition-colors hover:bg-foreground/10"
              >
                <span className="flex size-20 items-center justify-center rounded-full bg-card/80 shadow-xl backdrop-blur transition-transform hover:scale-105">
                  <Play className="size-8 translate-x-0.5 text-primary" aria-hidden />
                </span>
              </button>
            </>
          )}
        </div>

        {/* Topics Covered & Features */}
        <section className="mt-8 grid gap-6 md:grid-cols-2">
          <div className="surface-card p-7">
            <h2 className="text-xl font-bold">Topics Covered</h2>
            <ul className="mt-5 space-y-3">
              {topics.map((t, idx) => (
                <li key={`${t}-${idx}`} className="flex gap-3 text-sm text-muted-foreground">
                  <Check className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                  <span>{t}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="surface-card p-7">
            <h2 className="text-xl font-bold">Course Features</h2>
            <div className="mt-5 grid grid-cols-2 gap-y-5">
              {features.map((f) => (
                <div key={f.label} className="flex items-center gap-3 text-sm">
                  <span className="flex size-9 items-center justify-center rounded-full bg-accent">
                    <f.icon className="size-4 text-primary" aria-hidden />
                  </span>
                  <span className="font-medium text-foreground">{f.label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Modules / Lessons */}
        <section className="mt-12">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Modules & Lessons</h2>
            <span className="rounded-full bg-primary-soft px-3 py-1 text-xs font-bold text-primary">
              {lessons.length} {lessons.length === 1 ? "Lesson" : "Lessons"}
            </span>
          </div>

          <div className="mt-4 overflow-hidden rounded-2xl bg-card border border-border shadow-[var(--shadow-card)]">
            {lessons.length === 0 ? (
              <div className="px-6 py-12 text-center text-muted-foreground">
                <p>No lessons have been published for this course yet.</p>
              </div>
            ) : (
              lessons.map((lesson, idx) => {
                const isFirstLesson = idx === 0;
                const isUnlocked = isEnrolled || isFirstLesson;

                return (
                  <div
                    key={lesson.id}
                    onClick={() => {
                      if (isEnrolled) {
                        void navigate({ to: "/learn", search: { courseId: String(courseId) } });
                      } else if (isFirstLesson) {
                        handleFirstLessonClick();
                      } else {
                        handleLockedLessonClick(lesson.title);
                      }
                    }}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        if (isEnrolled) {
                          void navigate({ to: "/learn", search: { courseId: String(courseId) } });
                        } else if (isFirstLesson) {
                          handleFirstLessonClick();
                        } else {
                          handleLockedLessonClick(lesson.title);
                        }
                      }
                    }}
                    className={`flex items-center justify-between gap-4 border-b border-border px-6 py-5 last:border-0 transition-colors cursor-pointer ${
                      isUnlocked
                        ? "hover:bg-primary-soft/30"
                        : "hover:bg-muted/30 opacity-90"
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <span
                        className={`flex size-9 items-center justify-center rounded-full ${
                          isUnlocked ? "bg-primary text-primary-foreground" : "bg-accent text-primary/70"
                        }`}
                      >
                        {isUnlocked ? (
                          <Play className="size-4 fill-current" aria-hidden />
                        ) : (
                          <Lock className="size-4 text-muted-foreground" aria-hidden />
                        )}
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-foreground">
                            {idx + 1}. {lesson.title}
                          </p>
                          {!isEnrolled && isFirstLesson && (
                            <span className="rounded-full bg-success-soft px-2.5 py-0.5 text-xs font-bold text-success">
                              Free Preview
                            </span>
                          )}
                          {isEnrolled && (
                            <span className="rounded-full bg-primary-soft px-2.5 py-0.5 text-xs font-bold text-primary">
                              Unlocked
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-1">
                          {lesson.video_file ? "Video Lesson" : "Reading Material"}
                          {lesson.description ? ` • ${lesson.description}` : ""}
                        </p>
                      </div>
                    </div>

                    {!isUnlocked && (
                      <span className="flex items-center gap-1 text-xs font-semibold text-muted-foreground">
                        <Lock className="size-3.5" aria-hidden /> Locked
                      </span>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
