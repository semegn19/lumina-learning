import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { FilePen, ImagePlus, Shapes, Tag, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { AdminGuard } from "@/components/admin-guard";
import { Button } from "@/components/ui/button";
import { ListOptionChooser } from "@/components/ui/list-option-chooser";
import { createCourse } from "@/lib/courses-api";
import { getApiErrorMessage } from "@/lib/api-client";
import type { CourseCurrency, CourseLevel } from "@/lib/api-types";

export const Route = createFileRoute("/courses/new")({
  head: () => ({
    meta: [
      { title: "Course Info — Create Course | Lumina Learning" },
      { name: "description", content: "Step 1 of creating a course: basic details, attributes and pricing." },
      { property: "og:title", content: "Course Info — Create Course" },
      { property: "og:description", content: "Let's start with the basics to outline your new offering." },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "canonical", href: "/courses/new" }],
  }),
  component: () => (
    <AdminGuard>
      <CourseInfo />
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

function CourseInfo() {
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

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!title.trim() || !description.trim()) {
        throw new Error("Title and description are required.");
      }
      return createCourse({
        title,
        description,
        price: parseFloat(price) || 0,
        currency,
        level,
        topics_covered: topicsCovered || undefined,
        thumbnail: thumbnailFile || undefined,
      });
    },
    onSuccess: (newCourse) => {
      toast.success("Course created successfully!");
      void queryClient.invalidateQueries({ queryKey: ["courses"] });
      void queryClient.invalidateQueries({ queryKey: ["manage-courses"] });
      void navigate({
        to: "/manage/courses/$courseId/lessons",
        params: { courseId: String(newCourse.id) },
      });
    },
    onError: (err) => {
      toast.error(`Course creation failed: ${getApiErrorMessage(err)}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate();
  };

  return (
    <div className="min-h-screen bg-canvas">

      <main className="mx-auto max-w-[900px] px-6 py-8 md:px-8">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">Course Info</h1>
        <p className="mt-2 text-muted-foreground">Let's start with the basics to outline your new offering.</p>

        <form className="surface-card mt-10 space-y-8 p-9" onSubmit={handleSubmit}>
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
                Course Title *
              </label>
              <input
                id="course-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className={`${inputClass} mt-2`}
                placeholder="e.g. Advanced Typography Principles"
              />
            </div>
            <div>
              <label htmlFor="course-desc" className={labelClass}>
                Course Description *
              </label>
              <textarea
                id="course-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                rows={4}
                className="mt-2 w-full rounded-xl border border-input bg-card p-4 text-sm outline-none transition-shadow placeholder:text-muted-foreground focus:ring-2 focus:ring-ring/30"
                placeholder="Provide a compelling overview of what students will learn…"
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
                placeholder="e.g. Wireframing, User Research, Prototyping"
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
                  placeholder="0.00"
                  aria-label="Price"
                  className={`${inputClass}`}
                />
              </div>
            </div>
          </div>

          <div className="flex flex-wrap justify-end gap-3 pt-2">
            <Button
              type="submit"
              disabled={createMutation.isPending}
              className="rounded-lg px-8"
            >
              {createMutation.isPending ? "Creating Course…" : "Create & Add Lessons"}
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}
