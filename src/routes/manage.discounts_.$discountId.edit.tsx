import { createFileRoute, Link, useNavigate, useParams } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarClock, Percent, Tag, Ticket } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { AdminGuard } from "@/components/admin-guard";
import { Button } from "@/components/ui/button";
import { CourseSelector } from "@/components/course-selector";
import { DatePicker } from "@/components/ui/date-picker";
import { getDiscountById, updateDiscount } from "@/lib/discounts-api";
import { getCourses } from "@/lib/courses-api";
import { getApiErrorMessage } from "@/lib/api-client";
import type { Course, DiscountCreatePayload, PaginatedResponse } from "@/lib/api-types";

export const Route = createFileRoute("/manage/discounts_/$discountId/edit")({
  head: () => ({
    meta: [
      { title: "Edit Discount | Lumina Learning" },
      { name: "description", content: "Update the code, end date and percentage of an existing course discount." },
      { property: "og:title", content: "Edit Discount | Lumina Learning" },
      { property: "og:description", content: "Update an existing course discount." },
      { property: "og:type", content: "website" },
    ],
  }),
  component: () => (
    <AdminGuard>
      <EditDiscount />
    </AdminGuard>
  ),
});

const inputClass =
  "h-12 w-full rounded-xl border border-input bg-card px-4 text-sm outline-none transition-shadow placeholder:text-muted-foreground focus:ring-2 focus:ring-ring/30";
const labelClass = "text-xs font-semibold text-foreground";

function EditDiscount() {
  const { discountId } = useParams({ from: "/manage/discounts_/$discountId/edit" });
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: discount, isLoading, isError } = useQuery({
    queryKey: ["discount", discountId],
    queryFn: () => getDiscountById(discountId),
    enabled: !!discountId,
  });

  const { data: coursesData } = useQuery({
    queryKey: ["courses"],
    queryFn: () => getCourses(),
  });

  const allCourses: Course[] = Array.isArray(coursesData)
    ? coursesData
    : (coursesData as PaginatedResponse<Course> | null)?.results || [];

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [code, setCode] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [discountPercentage, setDiscountPercentage] = useState("");
  const [selectedCourses, setSelectedCourses] = useState<number[]>([]);

  useEffect(() => {
    if (discount) {
      setTitle(discount.title || "");
      setDescription(discount.description || "");
      setCode(discount.code || "");
      setStartDate(discount.start_date ? String(discount.start_date).split("T")[0] || "" : "");
      setEndDate(discount.end_date ? String(discount.end_date).split("T")[0] || "" : "");
      const pctVal = discount.percentage ?? discount.discount_percentage;
      setDiscountPercentage(pctVal ? String(pctVal) : "");

      if (Array.isArray(discount.courses)) {
        setSelectedCourses(discount.courses);
      } else if (Array.isArray(discount.course_details)) {
        setSelectedCourses(discount.course_details.map((c) => c.id));
      }
    }
  }, [discount]);

  const updateMut = useMutation({
    mutationFn: async () => {
      if (!discountId) throw new Error("Missing discount ID");
      const pct = Number(discountPercentage);
      const payload: Partial<DiscountCreatePayload> = {
        title,
        code: code.trim().toUpperCase(),
        percentage: pct,
        discount_percentage: pct,
        courses: selectedCourses,
      };
      if (description.trim()) payload.description = description.trim();
      if (startDate) payload.start_date = startDate;
      if (endDate) payload.end_date = endDate;

      return await updateDiscount(discountId, payload);
    },
    onSuccess: () => {
      toast.success("Discount updated successfully");
      void queryClient.invalidateQueries({ queryKey: ["discount", discountId] });
      void queryClient.invalidateQueries({ queryKey: ["discounts"] });
      void navigate({ to: "/manage/discounts" });
    },
    onError: (err) => {
      toast.error(`Failed to update discount: ${getApiErrorMessage(err)}`);
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

  if (isError || !discount) {
    return (
      <div className="min-h-screen bg-canvas">
        <div className="mx-auto max-w-[820px] px-6 pt-12 text-center">
          <h1 className="text-2xl font-bold">Discount Not Found</h1>
          <p className="mt-2 text-muted-foreground">The requested discount could not be found.</p>
          <Button asChild className="mt-6">
            <Link to="/manage/discounts">← Back to Discounts</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-canvas-rose/40">

      <main className="mx-auto max-w-[820px] px-6 py-8 md:px-8">
        <Link to="/manage/discounts" className="text-sm text-muted-foreground hover:text-foreground">
          ← Back to discounts
        </Link>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">Edit Discount</h1>
        <p className="mt-2 text-muted-foreground">
          Update the details for <span className="font-medium text-foreground">{discount.title}</span>.
        </p>

        <form
          className="surface-card mt-10 space-y-7 p-9"
          onSubmit={(e) => {
            e.preventDefault();
            updateMut.mutate();
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
              className="mt-2 w-full rounded-xl border border-input bg-card p-4 text-sm outline-none transition-shadow focus:ring-2 focus:ring-ring/30"
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
                  className={`${inputClass} pl-11`}
                />
              </div>
            </div>
          </div>

          <div className="flex flex-wrap justify-end gap-3 pt-2">
            <Button asChild variant="outline" className="rounded-lg px-6">
              <Link to="/manage/discounts">Cancel</Link>
            </Button>
            <Button type="submit" disabled={updateMut.isPending} className="rounded-lg px-8">
              {updateMut.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}
