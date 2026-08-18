import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  ArrowRight,
  Award,
  Bookmark,
  CheckCircle2,
  Download,
  FileText,
  Lock,
  Play,
  Trophy,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import lessonVideo from "@/assets/lesson-video.jpg";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getCourseById, getCourseLessons } from "@/lib/courses-api";
import {
  getEnrollmentById,
  getEnrollments,
  updateLessonProgress,
} from "@/lib/enrollments-api";
import { getApiErrorMessage } from "@/lib/api-client";
import { getMediaUrl } from "@/lib/utils";
import type { Course, Enrollment, Lesson, LessonProgress } from "@/lib/api-types";

interface LearnSearch {
  courseId?: string | undefined;
}

export const Route = createFileRoute("/learn")({
  validateSearch: (search: Record<string, unknown>): LearnSearch => {
    const cid = search["courseId"];
    return {
      courseId: typeof cid === "string" ? cid : undefined,
    };
  },
  head: () => ({
    meta: [
      { title: "Lesson Player | Lumina Learning" },
      {
        name: "description",
        content: "Watch course lessons, review materials and track your progress.",
      },
    ],
  }),
  component: LessonPlayer,
});

function LessonPlayer() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const searchParams = Route.useSearch();

  const [selectedLessonIndex, setSelectedLessonIndex] = useState(0);
  const [saved, setSaved] = useState(false);
  const [finishModalOpen, setFinishModalOpen] = useState(false);

  // Video player controls
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const targetCourseId = searchParams.courseId
    ? Number(searchParams.courseId) || searchParams.courseId
    : undefined;

  // 1. Fetch user's enrollments
  const { data: enrollmentsData } = useQuery({
    queryKey: ["my-enrollments", targetCourseId],
    queryFn: async () => {
      const res = await getEnrollments(targetCourseId ? { course: targetCourseId } : undefined);
      return Array.isArray(res) ? res : res.results ?? [];
    },
  });

  const userEnrollments = enrollmentsData ?? [];

  const getCourseIdFromEnrollment = (e: any): string | number => {
    if (!e || !e.course) return "";
    return typeof e.course === "object" ? e.course.id : e.course;
  };

  const activeEnrollment = targetCourseId
    ? userEnrollments.find((e) => String(getCourseIdFromEnrollment(e)) === String(targetCourseId)) || userEnrollments[0]
    : userEnrollments[0];

  const resolvedCourseId = targetCourseId || (activeEnrollment ? getCourseIdFromEnrollment(activeEnrollment) : 1);
  const isEnrolled = !!activeEnrollment;

  // 2. Fetch detailed enrollment object containing nested lesson_progress array
  const { data: enrollmentDetail } = useQuery({
    queryKey: ["enrollment-detail", activeEnrollment?.id],
    queryFn: async () => {
      if (!activeEnrollment?.id) return null;
      return await getEnrollmentById(activeEnrollment.id);
    },
    enabled: !!activeEnrollment?.id,
  });

  const currentEnrollment = enrollmentDetail || activeEnrollment;

  // 3. Fetch course detail
  const { data: course } = useQuery({
    queryKey: ["course", resolvedCourseId],
    queryFn: () => getCourseById(resolvedCourseId),
    enabled: !!resolvedCourseId,
  });

  // 4. Fetch course lessons
  const { data: lessonsData, isLoading: lessonsLoading } = useQuery({
    queryKey: ["course-lessons", resolvedCourseId],
    queryFn: async () => {
      const res = await getCourseLessons(resolvedCourseId);
      const list = Array.isArray(res) ? res : res.results ?? [];
      return list.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    },
    enabled: !!resolvedCourseId,
  });

  const lessons: Lesson[] = lessonsData ?? [];
  const currentLesson = lessons[selectedLessonIndex] ?? lessons[0];
  const isLastLesson = lessons.length > 0 && selectedLessonIndex === lessons.length - 1;

  // Extract nested lesson_progress array from the backend enrollment response
  const progressList: LessonProgress[] =
    currentEnrollment?.lesson_progress ||
    (currentEnrollment as any)?.progress_records ||
    (currentEnrollment as any)?.lessons_progress ||
    [];

  const getLessonIdFromProgress = (p: LessonProgress): string | number => {
    if (!p || !p.lesson) return "";
    return typeof p.lesson === "object" ? (p.lesson as any).id : p.lesson;
  };

  // Find exact LessonProgress record by matching the lesson ID
  const findProgressRecord = (targetLessonId: string | number): LessonProgress | undefined => {
    return progressList.find((p) => {
      const pLessonId = getLessonIdFromProgress(p);
      return String(pLessonId) === String(targetLessonId);
    });
  };

  // Auto-select the first uncompleted lesson when course player loads
  const [hasInitializedLesson, setHasInitializedLesson] = useState(false);

  useEffect(() => {
    if (!hasInitializedLesson && lessons.length > 0 && isEnrolled) {
      const firstUncompletedIndex = lessons.findIndex((m) => {
        const rec = findProgressRecord(m.id);
        return !rec || rec.is_completed !== true;
      });

      if (firstUncompletedIndex !== -1) {
        setSelectedLessonIndex(firstUncompletedIndex);
      } else {
        setSelectedLessonIndex(0);
      }
      setHasInitializedLesson(true);
    }
  }, [lessons, progressList, isEnrolled, hasInitializedLesson]);

  // Complete lesson mutation: calls PATCH /api/lesson-progress/{id}/ using the exact LessonProgress record ID
  const completeMut = useMutation({
    mutationFn: async (lessonId: number): Promise<void> => {
      if (!isEnrolled || !activeEnrollment?.id) {
        throw new Error("Enroll in course to record your progress");
      }

      // Step A: Look up the nested LessonProgress object by lesson ID
      const record = findProgressRecord(lessonId);

      if (!record?.id) {
        throw new Error(`LessonProgress record not found for lesson ID ${lessonId}`);
      }

      // Step B: Send update to backend for that specific LessonProgress ID
      await updateLessonProgress(record.id, { is_completed: true });
    },
    onSuccess: () => {
      toast.success("Lesson marked as completed!");
      void queryClient.invalidateQueries({ queryKey: ["enrollment-detail", activeEnrollment?.id] });
      void queryClient.invalidateQueries({ queryKey: ["my-enrollments"] });
      void queryClient.invalidateQueries({ queryKey: ["my-certificates"] });
    },
    onError: (err: unknown) => {
      toast.error(`Progress update failed: ${getApiErrorMessage(err)}`);
    },
  });

  const handleFinishCourse = async () => {
    if (currentLesson) {
      try {
        await completeMut.mutateAsync(currentLesson.id);
      } catch {
        // proceed to modal
      }
    }
    void queryClient.invalidateQueries({ queryKey: ["my-enrollments"] });
    void queryClient.invalidateQueries({ queryKey: ["my-certificates"] });
    setFinishModalOpen(true);
  };

  const togglePlay = () => {
    if (lessonVideoUrl) {
      if (isPlaying && videoRef.current) {
        videoRef.current.pause();
        setIsPlaying(false);
      } else {
        setIsPlaying(true);
        setTimeout(() => {
          if (videoRef.current) {
            void videoRef.current.play();
          }
        }, 100);
      }
    } else {
      toast.info("This is a reading lesson. No video file is attached.");
    }
  };

  const handleSelectLessonClick = (idx: number) => {
    if (idx === 0) {
      setSelectedLessonIndex(0);
      setIsPlaying(false);
      return;
    }

    if (!isEnrolled) {
      toast.info("Enroll in course to view all the lessons");
      return;
    }

    setSelectedLessonIndex(idx);
    setIsPlaying(false);
  };

  if (lessonsLoading) {
    return (
      <div className="min-h-screen bg-canvas">
        <div className="mt-20 flex justify-center">
          <div className="size-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </div>
    );
  }

  // Determine current lesson completion strictly from backend nested lesson_progress data
  const currentRecord = currentLesson ? findProgressRecord(currentLesson.id) : undefined;
  const currentIsCompleted = currentRecord?.is_completed === true;

  // Backend enrollment progress percentage
  const dbProgressPercent =
    typeof currentEnrollment?.progress === "number"
      ? currentEnrollment.progress
      : parseFloat(String(currentEnrollment?.progress || 0));

  const completedCount = progressList.filter((p) => p.is_completed).length;
  const lessonVideoUrl = currentLesson?.video_file ? getMediaUrl(currentLesson.video_file) : undefined;

  return (
    <div className="min-h-screen bg-canvas">
      <main className="mx-auto max-w-[1280px] px-6 py-8 md:px-8">
        <div className="mb-4 flex items-center justify-between">
          <Link to="/my-learning" className="text-sm font-medium text-muted-foreground hover:text-foreground">
            ← Back to My Learning
          </Link>

          {!isEnrolled && (
            <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              Course Preview Mode
            </span>
          )}
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
          <div className="space-y-6">
            {/* Video / Thumbnail Player matching course details page */}
            <div className="relative overflow-hidden rounded-2xl bg-secondary shadow-lg">
              {lessonVideoUrl && isPlaying ? (
                <video
                  ref={videoRef}
                  key={currentLesson?.id}
                  src={lessonVideoUrl}
                  controls
                  autoPlay
                  className="aspect-video w-full object-cover"
                  onEnded={() => {
                    setIsPlaying(false);
                    if (currentLesson && isEnrolled && !currentIsCompleted) completeMut.mutate(currentLesson.id);
                  }}
                />
              ) : (
                <>
                  <img
                    src={getMediaUrl(course?.thumbnail) || lessonVideo}
                    alt={`Lesson preview: ${currentLesson?.title || "Lesson"}`}
                    loading="lazy"
                    width={800}
                    height={512}
                    className="aspect-video w-full object-cover opacity-90"
                  />
                  <button
                    type="button"
                    onClick={togglePlay}
                    aria-label="Play lesson video"
                    className="absolute inset-0 flex items-center justify-center transition-colors hover:bg-foreground/10"
                  >
                    <span className="flex size-20 items-center justify-center rounded-full bg-card/80 shadow-xl backdrop-blur transition-transform hover:scale-105">
                      <Play className="size-8 translate-x-0.5 text-primary" aria-hidden />
                    </span>
                  </button>
                </>
              )}
            </div>

            <section className="surface-card p-8">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="field-label">
                    Lesson {currentLesson?.order ?? selectedLessonIndex + 1} of {lessons.length}
                  </p>
                  <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">{currentLesson?.title || "Foundations of Design"}</h1>
                </div>
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    className="gap-2 rounded-lg"
                    disabled={currentIsCompleted || completeMut.isPending}
                    onClick={() => {
                      if (!isEnrolled) {
                        toast.info("Enroll in this course to track and save your progress!");
                        return;
                      }
                      if (currentLesson) completeMut.mutate(currentLesson.id);
                    }}
                  >
                    <CheckCircle2 className="size-4 text-success" />
                    {currentIsCompleted ? "Completed" : completeMut.isPending ? "Updating…" : "Mark Complete"}
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => setSaved(!saved)}>
                    <Bookmark className={`size-4 ${saved ? "fill-primary text-primary" : ""}`} />
                  </Button>
                </div>
              </div>

              <Tabs defaultValue="overview" className="mt-6">
                <TabsList className="h-auto w-full justify-start gap-6 rounded-none border-b border-border bg-transparent p-0">
                  <TabsTrigger
                    value="overview"
                    className="rounded-none border-b-2 border-transparent bg-transparent px-0 pb-3 data-[state=active]:border-foreground data-[state=active]:shadow-none"
                  >
                    Overview
                  </TabsTrigger>
                  <TabsTrigger
                    value="resources"
                    className="rounded-none border-b-2 border-transparent bg-transparent px-0 pb-3 data-[state=active]:border-foreground data-[state=active]:shadow-none"
                  >
                    Resources ({currentLesson?.pdf_resource ? 1 : 0})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-5 pt-6 text-muted-foreground">
                  <p>{currentLesson?.description || "No overview provided for this lesson."}</p>
                </TabsContent>

                <TabsContent value="resources" className="space-y-3 pt-6">
                  {currentLesson?.pdf_resource ? (
                    <a
                      href={getMediaUrl(currentLesson.pdf_resource)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between rounded-xl border border-border px-4 py-3 text-sm transition-colors hover:border-primary/40 hover:bg-accent/50"
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="size-4 text-primary" />
                        <span className="font-medium truncate max-w-xs">{currentLesson.pdf_resource.split("/").pop()}</span>
                      </div>
                      <span className="flex items-center gap-1 text-primary font-medium text-xs">
                        <Download className="size-3.5" /> Download PDF
                      </span>
                    </a>
                  ) : (
                    <p className="text-sm text-muted-foreground">No PDF downloadable resources for this lesson.</p>
                  )}
                </TabsContent>
              </Tabs>
            </section>
          </div>

          {/* Right Sidebar Playlist */}
          <aside className="h-fit rounded-2xl bg-card border border-border p-6 shadow-sm">
            <h2 className="text-xl font-bold text-foreground">{course?.title || "Course Playlist"}</h2>
            {isEnrolled ? (
              <>
                <p className="mt-2 text-sm text-muted-foreground">
                  {completedCount} of {lessons.length} completed ({Math.round(dbProgressPercent)}%)
                </p>
                <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-accent">
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-300"
                    style={{ width: `${Math.min(100, Math.max(0, dbProgressPercent))}%` }}
                  />
                </div>
              </>
            ) : (
              <p className="mt-2 text-xs text-primary font-medium">
                Preview Mode — Lesson 1 unlocked
              </p>
            )}

            <ul className="mt-6 space-y-1">
              {lessons.map((m, idx) => {
                const isActive = idx === selectedLessonIndex;
                const rec = findProgressRecord(m.id);
                const isCompleted = rec?.is_completed === true;
                const isLocked = !isEnrolled && idx > 0;

                return (
                  <li key={m.id}>
                    <button
                      onClick={() => handleSelectLessonClick(idx)}
                      className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm transition-colors ${
                        isActive
                          ? "bg-primary-soft font-semibold text-primary"
                          : isLocked
                          ? "text-muted-foreground/60 hover:bg-accent/20 cursor-not-allowed"
                          : "text-foreground hover:bg-accent/50"
                      }`}
                    >
                      <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-semibold">
                        {m.order ?? idx + 1}
                      </span>
                      <span className="truncate flex-1">{m.title}</span>
                      {isCompleted ? (
                        <CheckCircle2 className="size-4 shrink-0 text-success" />
                      ) : isLocked ? (
                        <Lock className="size-3.5 shrink-0 text-muted-foreground/60" />
                      ) : null}
                    </button>
                  </li>
                );
              })}
            </ul>
          </aside>
        </div>

        {/* Navigation Buttons */}
        <div className="mt-10 flex items-center justify-between">
          <Button
            variant="outline"
            disabled={selectedLessonIndex === 0}
            onClick={() => handleSelectLessonClick(Math.max(0, selectedLessonIndex - 1))}
            className="gap-2 rounded-lg"
          >
            <ArrowLeft className="size-4" aria-hidden /> Previous Lesson
          </Button>

          {isLastLesson ? (
            <Button
              onClick={handleFinishCourse}
              className="gap-2 rounded-lg bg-success text-success-foreground hover:bg-success/90"
            >
              Finish Course <Trophy className="size-4" aria-hidden />
            </Button>
          ) : (
            <Button
              disabled={selectedLessonIndex >= lessons.length - 1}
              onClick={() => handleSelectLessonClick(Math.min(lessons.length - 1, selectedLessonIndex + 1))}
              className="gap-2 rounded-lg"
            >
              Next Lesson <ArrowRight className="size-4" aria-hidden />
            </Button>
          )}
        </div>
      </main>

      {/* Course Finish Congratulations Modal */}
      <Dialog open={finishModalOpen} onOpenChange={setFinishModalOpen}>
        <DialogContent className="max-w-md p-8 text-center sm:rounded-2xl">
          <div className="mx-auto flex size-20 items-center justify-center rounded-full bg-primary-soft text-primary animate-bounce">
            <Trophy className="size-10" />
          </div>

          <DialogHeader className="mt-4">
            <DialogTitle className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl text-foreground">
              Congratulations! 🎉
            </DialogTitle>
            <DialogDescription className="mt-3 text-base text-muted-foreground">
              You finished <span className="font-bold text-foreground">{course?.title || "this course"}</span>! Excellent work completing all lessons in your curriculum.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="mt-8 flex flex-col gap-3 sm:flex-col">
            <Button
              className="h-12 w-full gap-2 rounded-xl text-base font-bold"
              onClick={() => {
                setFinishModalOpen(false);
                void navigate({ to: "/certificates" });
              }}
            >
              <Award className="size-5" /> View Certificate
            </Button>

            <Button
              variant="outline"
              className="h-11 w-full rounded-xl"
              onClick={() => setFinishModalOpen(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
