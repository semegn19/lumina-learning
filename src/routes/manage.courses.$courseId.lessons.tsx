import { createFileRoute, Link, useNavigate, useParams } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CirclePlay, FileText, GripVertical, Lightbulb, Plus, Save, Trash2, Upload } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { AdminGuard } from "@/components/admin-guard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { createLesson, deleteLesson, getCourseLessons, updateLesson } from "@/lib/courses-api";
import { getApiErrorMessage } from "@/lib/api-client";
import type { Lesson } from "@/lib/api-types";

export const Route = createFileRoute("/manage/courses/$courseId/lessons")({
  head: () => ({
    meta: [
      { title: "Edit Lessons | Lumina Learning" },
      { name: "description", content: "Edit, reorder or remove the lessons inside one of your published courses." },
      { property: "og:title", content: "Edit Lessons | Lumina Learning" },
      { property: "og:description", content: "Edit, reorder or remove lessons inside your course." },
      { property: "og:type", content: "website" },
    ],
  }),
  component: () => (
    <AdminGuard>
      <EditLessons />
    </AdminGuard>
  ),
});

interface EditableLesson extends Lesson {
  newVideoFile?: File | null;
  newPdfFile?: File | null;
}

function EditLessons() {
  const { courseId } = useParams({ from: "/manage/courses/$courseId/lessons" });
  const queryClient = useQueryClient();

  const [lessons, setLessons] = useState<EditableLesson[]>([]);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  // New Lesson form state
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newVideo, setNewVideo] = useState<File | null>(null);
  const [newPdf, setNewPdf] = useState<File | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  // 1. Fetch live course lessons
  const { data: lessonsData, isLoading, isError } = useQuery({
    queryKey: ["course-lessons", courseId],
    queryFn: async () => {
      const res = await getCourseLessons(courseId);
      const list = Array.isArray(res) ? res : res.results ?? [];
      // Sort by order ascending
      return list.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    },
  });

  useEffect(() => {
    if (lessonsData) {
      setLessons(lessonsData);
    }
  }, [lessonsData]);

  const navigate = useNavigate();

  // Bulk save all lesson reorders and field changes
  const saveAllMutation = useMutation({
    mutationFn: async () => {
      // Save all lessons sequentially or concurrently with updated order
      const promises = lessons.map((l, idx) => {
        const orderNum = idx + 1;
        return updateLesson(courseId, l.id, {
          title: l.title,
          description: l.description,
          order: orderNum,
          video_file: l.newVideoFile,
          pdf_resource: l.newPdfFile,
        });
      });
      return Promise.all(promises);
    },
    onSuccess: () => {
      toast.success("All lesson changes and reorders saved successfully!");
      void queryClient.invalidateQueries({ queryKey: ["course-lessons", courseId] });
      void navigate({ to: "/manage/courses" });
    },
    onError: (err) => {
      toast.error(`Failed to save changes: ${getApiErrorMessage(err)}`);
    },
  });

  // Single lesson delete mutation
  const deleteMut = useMutation({
    mutationFn: (lessonId: number) => deleteLesson(courseId, lessonId),
    onSuccess: (_, lessonId) => {
      toast.success("Lesson deleted");
      setLessons((prev) => prev.filter((l) => l.id !== lessonId));
      void queryClient.invalidateQueries({ queryKey: ["course-lessons", courseId] });
    },
    onError: (err) => {
      toast.error(`Delete failed: ${getApiErrorMessage(err)}`);
    },
  });

  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  // New lesson create mutation
  const createMut = useMutation({
    mutationFn: () => {
      if (!newVideo) {
        throw new Error("A video file is required when adding a lesson.");
      }
      setUploadProgress(0);
      return createLesson(
        courseId,
        {
          title: newTitle,
          description: newDesc,
          order: lessons.length + 1,
          video_file: newVideo,
          pdf_resource: newPdf,
        },
        {
          onUploadProgress: (progressEvent) => {
            if (progressEvent.total) {
              const pct = Math.round((progressEvent.loaded * 100) / progressEvent.total);
              setUploadProgress(pct);
            }
          },
        }
      );
    },
    onSuccess: () => {
      toast.success("New lesson created!");
      setNewTitle("");
      setNewDesc("");
      setNewVideo(null);
      setNewPdf(null);
      setUploadProgress(null);
      setShowAddForm(false);
      void queryClient.invalidateQueries({ queryKey: ["course-lessons", courseId] });
    },
    onError: (err) => {
      setUploadProgress(null);
      toast.error(`Failed to create lesson: ${getApiErrorMessage(err)}`);
    },
  });

  // Drag & Drop reorder handlers
  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const updated = [...lessons];
    const item = updated.splice(draggedIndex, 1)[0];
    if (item) {
      updated.splice(index, 0, item);
      // Re-assign order property based on new positions
      const reordered = updated.map((l, i) => ({ ...l, order: i + 1 }));
      setLessons(reordered);
      setDraggedIndex(index);
    }
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const updateLessonField = (id: number, patch: Partial<EditableLesson>) => {
    setLessons((prev) => prev.map((l) => (l.id === id ? { ...l, ...patch } : l)));
  };

  return (
    <div className="min-h-screen bg-canvas-rose/40">

      <main className="mx-auto max-w-[1280px] px-6 py-8 md:px-8">
        {/* Top Header Bar: Removed Cancel button, kept Save Changes */}
        <div className="mt-8 flex flex-wrap items-start justify-between gap-4">
          <div>
            <Link to="/manage/courses" className="text-sm text-muted-foreground hover:text-foreground">
              ← Back to my courses
            </Link>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">Edit Lessons</h1>
            <p className="mt-2 text-muted-foreground">
              Updating curriculum for Course ID <span className="font-medium text-foreground">{courseId}</span>. Drag using the 6 dots handle to reorder lessons.
            </p>
          </div>

          <Button
            disabled={saveAllMutation.isPending}
            onClick={() => saveAllMutation.mutate()}
            className="gap-2 rounded-lg"
          >
            {saveAllMutation.isPending ? "Saving Changes…" : "Save Changes"} <Save className="size-4" aria-hidden />
          </Button>
        </div>

        {isLoading ? (
          <div className="mt-12 flex justify-center">
            <div className="size-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : isError ? (
          <div className="mt-12 text-center text-destructive">
            Failed to load lessons. Make sure the course exists and you are authorized.
          </div>
        ) : (
          <div className="mt-10 grid gap-6 lg:grid-cols-[1fr_330px]">
            <div className="space-y-6">
              {lessons.map((lesson, i) => (
                <article
                  key={lesson.id}
                  draggable
                  onDragStart={() => handleDragStart(i)}
                  onDragOver={(e) => handleDragOver(e, i)}
                  onDragEnd={handleDragEnd}
                  className={`surface-card relative p-6 pl-12 transition-all ${
                    draggedIndex === i ? "opacity-50 border-2 border-primary scale-[0.99]" : ""
                  }`}
                >
                  {/* 6 Dots Drag Handle */}
                  <div
                    aria-label="Drag to reorder"
                    className="absolute left-3 top-1/2 -translate-y-1/2 cursor-grab active:cursor-grabbing p-2 text-muted-foreground hover:text-primary transition-colors"
                  >
                    <GripVertical className="size-5" aria-hidden />
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="rounded-full bg-accent px-3 py-1 text-xs font-semibold text-accent-foreground">
                      Lesson {i + 1} (Order: {lesson.order ?? i + 1})
                    </span>

                    <button
                      type="button"
                      aria-label={`Delete lesson ${i + 1}`}
                      disabled={deleteMut.isPending}
                      onClick={() => deleteMut.mutate(lesson.id)}
                      className="text-muted-foreground transition-colors hover:text-destructive p-1"
                    >
                      <Trash2 className="size-4" aria-hidden />
                    </button>
                  </div>

                  <Input
                    value={lesson.title}
                    onChange={(e) => updateLessonField(lesson.id, { title: e.target.value })}
                    placeholder="Lesson title"
                    aria-label="Lesson title"
                    className="mt-4 h-12 rounded-lg text-lg font-semibold"
                  />

                  <Textarea
                    value={lesson.description}
                    onChange={(e) => updateLessonField(lesson.id, { description: e.target.value })}
                    placeholder="Lesson description…"
                    aria-label="Lesson description"
                    className="mt-4 min-h-24 rounded-xl border-transparent bg-accent/50"
                  />

                  <div className="mt-5 grid gap-4 sm:grid-cols-2">
                    {/* Video Upload Field */}
                    <div className="flex flex-col items-center gap-2 rounded-xl border-2 border-dashed border-border px-4 py-6 text-center transition-colors hover:border-primary/40 hover:bg-accent/40">
                      <Upload className="size-5 text-primary" />
                      <span className="text-sm font-semibold">Video File</span>
                      {lesson.video_file && !lesson.newVideoFile ? (
                        <span className="text-xs text-primary truncate max-w-[200px]">Current: {lesson.video_file.split("/").pop()}</span>
                      ) : lesson.newVideoFile ? (
                        <span className="text-xs text-success font-medium truncate max-w-[200px]">New: {lesson.newVideoFile.name}</span>
                      ) : (
                        <span className="text-xs text-muted-foreground">MP4, MOV, MKV up to 2GB</span>
                      )}
                      <label className="mt-1 cursor-pointer rounded-lg bg-primary-soft px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/20">
                        Choose Video
                        <input
                          type="file"
                          accept="video/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0] || null;
                            updateLessonField(lesson.id, { newVideoFile: file });
                          }}
                        />
                      </label>
                    </div>

                    {/* PDF Resource Upload Field */}
                    <div className="flex flex-col items-center gap-2 rounded-xl border-2 border-dashed border-border px-4 py-6 text-center transition-colors hover:border-primary/40 hover:bg-accent/40">
                      <FileText className="size-5 text-primary" />
                      <span className="text-sm font-semibold">PDF Resource</span>
                      {lesson.pdf_resource && !lesson.newPdfFile ? (
                        <span className="text-xs text-primary truncate max-w-[200px]">Current: {lesson.pdf_resource.split("/").pop()}</span>
                      ) : lesson.newPdfFile ? (
                        <span className="text-xs text-success font-medium truncate max-w-[200px]">New: {lesson.newPdfFile.name}</span>
                      ) : (
                        <span className="text-xs text-muted-foreground">PDF document up to 50MB</span>
                      )}
                      <label className="mt-1 cursor-pointer rounded-lg bg-primary-soft px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/20">
                        Choose PDF
                        <input
                          type="file"
                          accept=".pdf,application/pdf"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0] || null;
                            updateLessonField(lesson.id, { newPdfFile: file });
                          }}
                        />
                      </label>
                    </div>
                  </div>
                </article>
              ))}

              {lessons.length === 0 && !showAddForm && (
                <p className="rounded-2xl border-2 border-dashed border-border p-10 text-center text-muted-foreground">
                  No lessons found for this course. Click below to create one.
                </p>
              )}

              {/* Add New Lesson Form with styled dropboxes & disabled Save until video_file is selected */}
              {showAddForm ? (
                <div className="surface-card p-6 border-2 border-primary/30">
                  <h3 className="text-lg font-bold">Add New Lesson</h3>
                  <div className="mt-4 space-y-4">
                    <Input
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      placeholder="Lesson title *"
                      className="h-12 rounded-xl"
                    />
                    <Textarea
                      value={newDesc}
                      onChange={(e) => setNewDesc(e.target.value)}
                      placeholder="Lesson description *"
                      className="min-h-24 rounded-xl"
                    />

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="flex flex-col items-center gap-2 rounded-xl border-2 border-dashed border-border px-4 py-6 text-center transition-colors hover:border-primary/40 hover:bg-accent/40">
                        <Upload className="size-5 text-primary" />
                        <span className="text-sm font-semibold">Video File (Required) *</span>
                        {newVideo ? (
                          <span className="text-xs text-success font-medium truncate max-w-[200px]">{newVideo.name}</span>
                        ) : (
                          <span className="text-xs text-muted-foreground">MP4, MOV, MKV up to 2GB</span>
                        )}
                        <label className="mt-1 cursor-pointer rounded-lg bg-primary-soft px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/20">
                          {newVideo ? "Change Video" : "Choose Video"}
                          <input
                            type="file"
                            accept="video/*"
                            className="hidden"
                            onChange={(e) => setNewVideo(e.target.files?.[0] || null)}
                          />
                        </label>
                      </div>

                      <div className="flex flex-col items-center gap-2 rounded-xl border-2 border-dashed border-border px-4 py-6 text-center transition-colors hover:border-primary/40 hover:bg-accent/40">
                        <FileText className="size-5 text-primary" />
                        <span className="text-sm font-semibold">PDF Resource (Optional)</span>
                        {newPdf ? (
                          <span className="text-xs text-success font-medium truncate max-w-[200px]">{newPdf.name}</span>
                        ) : (
                          <span className="text-xs text-muted-foreground">PDF document up to 50MB</span>
                        )}
                        <label className="mt-1 cursor-pointer rounded-lg bg-primary-soft px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/20">
                          {newPdf ? "Change PDF" : "Choose PDF"}
                          <input
                            type="file"
                            accept=".pdf,application/pdf"
                            className="hidden"
                            onChange={(e) => setNewPdf(e.target.files?.[0] || null)}
                          />
                        </label>
                      </div>
                    </div>

                    <div className="flex gap-3 pt-2">
                      <Button
                        type="button"
                        disabled={createMut.isPending || !newTitle.trim() || !newVideo}
                        onClick={() => createMut.mutate()}
                        className="rounded-lg"
                      >
                        {createMut.isPending
                          ? uploadProgress !== null
                            ? `Uploading ${uploadProgress}%…`
                            : "Creating…"
                          : "Save Lesson"}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowAddForm(false)}
                        className="rounded-lg"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowAddForm(true)}
                  className="flex w-full flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-border py-12 transition-colors hover:border-primary/40 hover:bg-accent/40"
                >
                  <Plus className="size-6 text-muted-foreground" aria-hidden />
                  <span className="font-display text-2xl font-bold">Add New Lesson</span>
                </button>
              )}
            </div>

            <aside className="space-y-6">
              <div className="surface-card p-6">
                <h2 className="text-xl font-bold">Course Structure</h2>
                <ul className="mt-5 space-y-3">
                  {lessons.map((l, i) => (
                    <li key={l.id} className="flex items-center gap-3 rounded-xl bg-accent/50 px-4 py-3 text-sm">
                      <CirclePlay className="size-4 text-primary" aria-hidden />
                      <span className="font-medium truncate">
                        {i + 1}. {l.title}
                      </span>
                    </li>
                  ))}
                  {lessons.length === 0 && (
                    <li className="text-sm text-muted-foreground">Your lessons will appear here.</li>
                  )}
                </ul>
              </div>

              <div className="rounded-2xl bg-accent p-6">
                <h2 className="flex items-center gap-2 text-lg font-bold">
                  <Lightbulb className="size-4 text-primary" aria-hidden /> Drag to Reorder
                </h2>
                <p className="mt-3 text-sm text-muted-foreground">
                  Hold the 6-dots handle on the left of any lesson card to drag it up or down. Click "Save Changes" at top right to commit order updates to the backend.
                </p>
              </div>
            </aside>
          </div>
        )}
      </main>
    </div>
  );
}
