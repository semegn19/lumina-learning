import { createFileRoute, Link, useNavigate, useParams } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FilePen, ImagePlus, Shapes, Tag, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { AdminGuard } from "@/components/admin-guard";
import { Button } from "@/components/ui/button";
import { ListOptionChooser } from "@/components/ui/list-option-chooser";
import { getCourseById, updateCourse } from "@/lib/courses-api";
import { getApiErrorMessage } from "@/lib/api-client";
import { getMediaUrl } from "@/lib/utils";
import type { CourseCurrency } from "@/lib/api-types";

export const Route = createFileRoute("/manage/courses/$courseId/edit")({
  head: () => ({
    meta: [
      { title: "Edit Course | Lumina Learning" },
      { name: "description", content: "Update the details, attributes and pricing of an existing course." },
      { property: "og:title", content: "Edit Course | Lumina Learning" },
      { property: "og:description", content: "Update the details, attributes and pricing of your course." },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "canonical", href: "/manage/courses" }],
  }),
  component: () => (
    <AdminGuard>
      <EditCourse />
    </AdminGuard>
  ),
});

const inputClass =
  "h-12 w-full rounded-xl border border-input bg-card px-4 text-sm outline-none transition-shadow placeholder:text-muted-foreground focus:ring-2 focus:ring-ring/30";
const labelClass = "text-xs font-semibold text-foreground";

function SectionHeading({ icon: Icon, children }: { icon: typeof Tag; children: string }) {
  return (
    <div className="flex items-center gap-3">
      <h2 className="flex shrink-0 items-center gap-2 text-2xl font-bold">
        <Icon className="size-5 text-primary" aria-hidden />
        {children}
      </h2>
      <span className="h-px flex-1 bg-border" />
    </div>
  );
}

function EditCourse() {
  const { courseId } = useParams({ from: "/manage/courses/$courseId/edit" });
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [topicsCovered, setTopicsCovered] = useState("");
  const [level, setLevel] = useState<"Beginner" | "Intermediate" | "Advanced">("Beginner");
  const [currency, setCurrency] = useState<CourseCurrency>("USD");
  const [price, setPrice] = useState("0.00");
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);

  const { data: course, isLoading } = useQuery({
    queryKey: ["course", courseId],
    queryFn: () => getCourseById(courseId),
  });

  useEffect(() => {
    if (course) {
      setTitle(course.title || "");
      setDescription(course.description || "");
      setTopicsCovered(course.topics_covered || "");
      const lvl = course.level === "B" ? "Beginner" : course.level === "I" ? "Intermediate" : course.level === "A" ? "Advanced" : course.level;
      setLevel(lvl as "Beginner" | "Intermediate" | "Advanced");
      setCurrency(course.currency || "USD");
      setPrice(course.price || "0.00");
      if (course.thumbnail) {
        setThumbnailPreview(getMediaUrl(course.thumbnail));
      }
    }
  }, [course]);

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setThumbnailFile(file);
      setThumbnailPreview(URL.createObjectURL(file));
    }
  };

  const handleRemoveThumbnail = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setThumbnailFile(null);
    setThumbnailPreview(null);
  };

  const updateMutation = useMutation({
    mutationFn: async () => {
      return updateCourse(courseId, {
        title,
        description,
        price: parseFloat(price) || 0,
        currency,
        level,
        topics_covered: topicsCovered || undefined,
        thumbnail: thumbnailFile || undefined,
      });
    },
    onSuccess: () => {
      toast.success("Course updated successfully!");
      void queryClient.invalidateQueries({ queryKey: ["course", courseId] });
      void queryClient.invalidateQueries({ queryKey: ["manage-courses"] });
      void queryClient.invalidateQueries({ queryKey: ["courses"] });
      void navigate({ to: "/manage/courses" });
    },
    onError: (err) => {
      toast.error(`Update failed: ${getApiErrorMessage(err)}`);
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-canvas">
        <div className="mt-20 flex justify-center">
          <div className="size-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-canvas">

      <main className="mx-auto max-w-[900px] px-6 py-8 md:px-8">
        <Link to="/manage/courses" className="text-sm text-muted-foreground hover:text-foreground">
          ← Back to my courses
        </Link>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">Edit Course</h1>
        <p className="mt-2 text-muted-foreground">
          Update the information for <span className="font-medium text-foreground">{course?.title ?? courseId}</span>.
        </p>

        <form
          className="surface-card mt-10 space-y-8 p-9"
          onSubmit={(e) => {
            e.preventDefault();
            updateMutation.mutate();
          }}
        >
          <SectionHeading icon={FilePen}>Basic Details</SectionHeading>

          <div className="space-y-5">
            <div>
              <p className={labelClass}>Course Thumbnail / Cover Image</p>
              <label className="mt-2 relative flex h-52 cursor-pointer flex-col items-center justify-center gap-2 overflow-hidden rounded-2xl border border-dashed border-primary/40 text-center transition-colors hover:bg-primary-soft/40">
                {thumbnailPreview ? (
                  <>
                    <img src={thumbnailPreview} alt="Course thumbnail preview" className="h-full w-full object-cover" />
                    <div className="absolute top-3 right-3 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleRemoveThumbnail}
                        className="flex size-9 items-center justify-center rounded-xl bg-destructive text-destructive-foreground shadow-md transition-transform hover:scale-105"
                        title="Remove image"
                      >
                        <Trash2 className="size-4" aria-hidden />
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <ImagePlus className="size-8 text-muted-foreground" aria-hidden />
                    <span className="text-sm font-semibold">Click to upload course thumbnail</span>
                    <span className="text-xs font-medium text-muted-foreground">
                      1200 x 630px recommended (PNG, JPG, WEBP)
                    </span>
                  </>
                )}
                <input type="file" accept="image/*" onChange={handleThumbnailChange} className="sr-only" />
              </label>
            </div>

            <div>
              <label htmlFor="course-title" className={labelClass}>
                Course Title
              </label>
              <input
                id="course-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className={`${inputClass} mt-2`}
              />
            </div>
            <div>
              <label htmlFor="course-desc" className={labelClass}>
                Course Description
              </label>
              <textarea
                id="course-desc"
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                className="mt-2 w-full rounded-xl border border-input bg-card p-4 text-sm outline-none transition-shadow focus:ring-2 focus:ring-ring/30"
              />
            </div>
            <div>
              <label htmlFor="topics" className={labelClass}>
                Topics Covered (comma-separated)
              </label>
              <input
                id="topics"
                value={topicsCovered}
                onChange={(e) => setTopicsCovered(e.target.value)}
                className={`${inputClass} mt-2`}
              />
            </div>
          </div>

          <SectionHeading icon={Shapes}>Attributes</SectionHeading>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="level" className={labelClass}>
                Difficulty Level
              </label>
              <div className="mt-2">
                <ListOptionChooser
                  id="level"
                  value={level}
                  onChange={(val) => setLevel(val as "Beginner" | "Intermediate" | "Advanced")}
                  options={[
                    { value: "Beginner", label: "Beginner", description: "Foundational concepts for newcomers" },
                    { value: "Intermediate", label: "Intermediate", description: "Expands on foundational concepts" },
                    { value: "Advanced", label: "Advanced", description: "Deep-dive and advanced specialization" },
                  ]}
                />
              </div>
            </div>
          </div>

          <SectionHeading icon={Tag}>Pricing</SectionHeading>

          <div>
            <p className={labelClass}>Price</p>
            <div className="mt-2 flex gap-3">
              <div className="w-36">
                <ListOptionChooser
                  value={currency}
                  onChange={(val) => setCurrency(val as CourseCurrency)}
                  options={[
                    { value: "USD", label: "USD ($)" },
                    { value: "EUR", label: "EUR (€)" },
                    { value: "GBP", label: "GBP (£)" },
                    { value: "NGN", label: "NGN (₦)" },
                  ]}
                  ariaLabel="Currency"
                />
              </div>
              <div className="relative w-56">
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  aria-label="Price"
                  className={`${inputClass}`}
                />
              </div>
            </div>
          </div>

          <div className="flex flex-wrap justify-end gap-3 pt-2">
            <Button asChild variant="outline" className="rounded-lg px-6">
              <Link to="/manage/courses/$courseId/lessons" params={{ courseId }}>
                Edit Lessons
              </Link>
            </Button>
            <Button type="submit" disabled={updateMutation.isPending} className="rounded-lg px-8">
              {updateMutation.isPending ? "Saving…" : "Save Changes"}
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}
