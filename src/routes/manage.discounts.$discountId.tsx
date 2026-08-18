import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, BookOpen, CalendarClock, Copy, Percent, Tag, Ticket } from "lucide-react";
import { toast } from "sonner";

import { AdminGuard } from "@/components/admin-guard";
import { Button } from "@/components/ui/button";
import { getDiscountById } from "@/lib/discounts-api";
import { formatPrice } from "@/lib/utils";

export const Route = createFileRoute("/manage/discounts/$discountId")({
  head: () => ({
    meta: [
      { title: "Discount Details | Lumina Learning" },
      { name: "description", content: "View promotional code details and eligible courses." },
      { property: "og:title", content: "Discount Details | Lumina Learning" },
      { property: "og:description", content: "View promo code details and eligible courses." },
      { property: "og:type", content: "website" },
    ],
  }),
  component: () => (
    <AdminGuard>
      <DiscountDetailPage />
    </AdminGuard>
  ),
});

function DiscountDetailPage() {
  const { discountId } = useParams({ from: "/manage/discounts/$discountId" });

  const { data: discount, isLoading, isError } = useQuery({
    queryKey: ["discount", discountId],
    queryFn: () => getDiscountById(discountId),
    enabled: !!discountId,
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
        <main className="mx-auto max-w-[960px] px-6 pt-12 text-center">
          <h1 className="text-3xl font-bold">Discount Not Found</h1>
          <p className="mt-2 text-muted-foreground">The requested discount promotion could not be found.</p>
          <Button asChild className="mt-6 rounded-lg">
            <Link to="/manage/discounts">← Back to Discounts</Link>
          </Button>
        </main>
      </div>
    );
  }

  const pct = discount.percentage ?? discount.discount_percentage ?? 0;
  const courseDetails = discount.course_details ?? [];

  return (
    <div className="min-h-screen bg-canvas-rose/40">

      <main className="mx-auto max-w-[960px] px-6 py-8 md:px-8">
        <Link to="/manage/discounts" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" aria-hidden /> Back to discounts
        </Link>

        <div className="mt-4">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">{discount.title}</h1>
            <span className="rounded-full bg-success-soft px-3.5 py-1 text-sm font-bold text-success">
              {pct}% OFF
            </span>
          </div>
          {discount.description && (
            <p className="mt-2 max-w-2xl text-muted-foreground">{discount.description}</p>
          )}
        </div>

        <section className="surface-card mt-8 p-8 space-y-6">
          <div className="grid gap-6 sm:grid-cols-3">
            <div className="rounded-2xl border border-border bg-card p-5">
              <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <Ticket className="size-4 text-primary" aria-hidden /> Promo Code
              </p>
              <div className="mt-2 flex items-center justify-between gap-2">
                <span className="font-mono text-xl font-bold tracking-wider">{discount.code}</span>
                <button
                  type="button"
                  onClick={() => {
                    void navigator.clipboard.writeText(discount.code);
                    toast.success(`Promo code "${discount.code}" copied!`);
                  }}
                  className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                  aria-label="Copy promo code"
                >
                  <Copy className="size-4" aria-hidden />
                </button>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-5">
              <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <Percent className="size-4 text-primary" aria-hidden /> Discount Amount
              </p>
              <p className="mt-2 font-display text-xl font-bold">{pct}% Savings</p>
            </div>

            <div className="rounded-2xl border border-border bg-card p-5">
              <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <CalendarClock className="size-4 text-primary" aria-hidden /> Expiration Date
              </p>
              <p className="mt-2 font-semibold">
                {discount.end_date ? new Date(discount.end_date).toLocaleDateString() : "No expiration"}
              </p>
            </div>
          </div>
        </section>

        {/* Eligible Courses Section */}
        <section className="surface-card mt-8 p-8">
          <div className="flex items-center justify-between border-b border-border pb-4">
            <h2 className="flex items-center gap-2 text-2xl font-bold">
              <BookOpen className="size-5 text-primary" aria-hidden /> Eligible Courses
            </h2>
            <span className="rounded-full bg-primary-soft px-3 py-1 text-xs font-bold text-primary">
              {courseDetails.length} {courseDetails.length === 1 ? "Course" : "Courses"}
            </span>
          </div>

          {courseDetails.length === 0 ? (
            <p className="mt-6 text-center text-sm text-muted-foreground py-8">
              This discount code is currently available for all courses across the platform.
            </p>
          ) : (
            <ul className="mt-6 grid gap-4 sm:grid-cols-2">
              {courseDetails.map((c) => (
                <li key={c.id} className="rounded-2xl border border-border bg-card p-5 flex items-center justify-between gap-4">
                  <div>
                    <h3 className="font-bold text-base line-clamp-1">{c.title}</h3>
                    {c.price !== undefined && (
                      <p className="mt-1 text-sm font-semibold text-muted-foreground">
                        Price: {formatPrice(c.price, c.currency)}
                      </p>
                    )}
                  </div>
                  <Button asChild variant="outline" size="sm" className="rounded-lg shrink-0">
                    <Link to="/courses/$courseId" params={{ courseId: String(c.id) }}>
                      View Course
                    </Link>
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}
