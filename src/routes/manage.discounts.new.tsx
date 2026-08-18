import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarClock, Percent, Tag, Ticket } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { AdminGuard } from "@/components/admin-guard";
import { Button } from "@/components/ui/button";
import { CourseSelector } from "@/components/course-selector";
import { DatePicker } from "@/components/ui/date-picker";
import { createDiscount } from "@/lib/discounts-api";
import { getCourses } from "@/lib/courses-api";
import { getApiErrorMessage } from "@/lib/api-client";
import type { Course, PaginatedResponse } from "@/lib/api-types";

export const Route = createFileRoute("/manage/discounts/new")({
  head: () => ({
    meta: [
      { title: "Create Discount | Lumina Learning" },
      { name: "description", content: "Create a promotional course discount with a code, end date and percentage off." },
      { property: "og:title", content: "Create Discount | Lumina Learning" },
      { property: "og:description", content: "Create a promotional course discount code." },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "canonical", href: "/manage/discounts/new" }],
  }),
  component: () => (
    <AdminGuard>
      <NewDiscount />
    </AdminGuard>
  ),
});

const inputClass =
  "h-12 w-full rounded-xl border border-input bg-card px-4 text-sm outline-none transition-shadow placeholder:text-muted-foreground focus:ring-2 focus:ring-ring/30";
const labelClass = "text-xs font-semibold text-foreground";

function NewDiscount() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [code, setCode] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [discountPercentage, setDiscountPercentage] = useState("");
  const [selectedCourses, setSelectedCourses] = useState<number[]>([]);

  const { data: coursesData } = useQuery({
    queryKey: ["courses"],
    queryFn: () => getCourses(),
  });

  const allCourses: Course[] = Array.isArray(coursesData)
    ? coursesData
    : (coursesData as PaginatedResponse<Course> | null)?.results || [];

  const createMut = useMutation({
    mutationFn: async () => {
      if (!title.trim()) throw new Error("Title is required");
      if (!code.trim()) throw new Error("Discount code is required");
      if (!discountPercentage) throw new Error("Discount percentage is required");

      const pct = Number(discountPercentage);
      return await createDiscount({
        title: title.trim(),
        code: code.trim().toUpperCase(),
        percentage: pct,
        discount_percentage: pct,
        description: description.trim() || undefined,
        start_date: startDate || undefined,
        end_date: endDate || undefined,
        courses: selectedCourses.length > 0 ? selectedCourses : undefined,
      });
    },
    onSuccess: () => {
      toast.success("Discount created successfully");
      void queryClient.invalidateQueries({ queryKey: ["discounts"] });
      void navigate({ to: "/manage/discounts" });
    },
    onError: (err) => {
      toast.error(`Failed to create discount: ${getApiErrorMessage(err)}`);
    },
  });

  return (
    <div className="min-h-screen bg-canvas-rose/40">

      <main className="mx-auto max-w-[820px] px-6 py-8 md:px-8">
        <Link to="/manage/discounts" className="text-sm text-muted-foreground hover:text-foreground">
          ← Back to discounts
        </Link>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">Create Discount</h1>
        <p className="mt-2 text-muted-foreground">Set up a promotional code learners can apply at checkout.</p>

        <form
          className="surface-card mt-10 space-y-7 p-9"
          onSubmit={(e) => {
            e.preventDefault();
            createMut.mutate();
          }}
        >
          <div>
            <label htmlFor="d-title" className={labelClass}>
              Title
            </label>
            <div className="relative mt-2">
              <Tag className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
              <input
                id="d-title"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Summer Sale"
                className={`${inputClass} pl-11`}
              />
            </div>
          </div>

          <div>
            <label htmlFor="d-desc" className={labelClass}>
              Description
            </label>
            <textarea
              id="d-desc"
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What does this discount apply to?"
              className="mt-2 w-full rounded-xl border border-input bg-card p-4 text-sm outline-none transition-shadow placeholder:text-muted-foreground focus:ring-2 focus:ring-ring/30"
            />
          </div>

          <div>
            <label htmlFor="d-code" className={labelClass}>
              Code
            </label>
            <div className="relative mt-2">
              <Ticket className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
              <input
                id="d-code"
                required
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="SUMMER2024"
                className={`${inputClass} pl-11 font-mono uppercase tracking-wide`}
              />
            </div>
          </div>

          {/* Scalable Searchable Course Selector */}
          <CourseSelector
            courses={allCourses}
            selectedIds={selectedCourses}
            onChange={setSelectedCourses}
          />

          <div className="grid gap-6 sm:grid-cols-3">
            <div>
              <label htmlFor="d-start" className={labelClass}>
                Start Date
              </label>
              <div className="mt-2">
                <DatePicker
                  id="d-start"
                  value={startDate}
                  onChange={(val) => setStartDate(val)}
                  placeholder="Select start date"
                />
              </div>
            </div>
            <div>
              <label htmlFor="d-end" className={labelClass}>
                End Date
              </label>
              <div className="mt-2">
                <DatePicker
                  id="d-end"
                  value={endDate}
                  onChange={(val) => setEndDate(val)}
                  placeholder="Select end date"
                />
              </div>
            </div>
            <div>
              <label htmlFor="d-pct" className={labelClass}>
                Percentage Off
              </label>
              <div className="relative mt-2">
                <Percent className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
                <input
                  id="d-pct"
                  type="number"
                  min={1}
                  max={100}
                  required
                  value={discountPercentage}
                  onChange={(e) => setDiscountPercentage(e.target.value)}
                  placeholder="20"
                  className={`${inputClass} pl-11`}
                />
              </div>
            </div>
          </div>

          <div className="flex flex-wrap justify-end gap-3 pt-2">
            <Button asChild variant="outline" className="rounded-lg px-6">
              <Link to="/manage/discounts">Cancel</Link>
            </Button>
            <Button type="submit" disabled={createMut.isPending} className="rounded-lg px-8">
              {createMut.isPending ? "Creating..." : "Create Discount"}
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}
