import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { BellRing, ChevronRight, Copy, Tag } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { getDiscounts } from "@/lib/discounts-api";
import type { DiscountItem, PaginatedResponse } from "@/lib/api-types";

export const Route = createFileRoute("/discounts/")({
  head: () => ({
    meta: [
      { title: "Available Discounts | Lumina Learning" },
      {
        name: "description",
        content: "Exclusive limited-time course discount codes and seasonal passes from Lumina Learning.",
      },
      { property: "og:title", content: "Available Discounts | Lumina Learning" },
      { property: "og:description", content: "Exclusive, limited-time offers on premium courses." },
    ],
    links: [{ rel: "canonical", href: "/discounts" }],
  }),
  component: Discounts,
});

const defaultOffers = [
  {
    id: 1,
    badge: "25% OFF",
    title: "Mastering UI Design Foundations",
    description: "Get a head start on your design journey with 25% off.",
    end_date: "2025-12-31",
    code: "SERENE25",
    percentage: 25,
    discount_percentage: 25,
  },
  {
    id: 2,
    badge: "15% OFF",
    title: "Advanced Visual Systems",
    description: "Dive deep into complex design systems.",
    end_date: "2025-01-15",
    code: "VISUAL15",
    percentage: 15,
    discount_percentage: 15,
  },
  {
    id: 3,
    badge: "40% OFF",
    title: "Business of Design Masterclass",
    description: "Learn how to position yourself as a high-value consultant.",
    end_date: "2025-03-31",
    code: "BIZPRO40",
    percentage: 40,
    discount_percentage: 40,
  },
  {
    id: 4,
    badge: "20% OFF",
    title: "Psychology of User Experience",
    description: "Understand the cognitive principles that drive humans.",
    end_date: "2025-02-10",
    code: "MINDSET20",
    percentage: 20,
    discount_percentage: 20,
  },
  {
    id: 5,
    badge: "50% OFF",
    title: "The Career Launchpad",
    description: "New students get a one-time discount on their first enrollment.",
    end_date: "Ongoing",
    code: "STARTUP50",
    percentage: 50,
    discount_percentage: 50,
  },
];

function useCopy() {
  const [copied, setCopied] = useState<string | null>(null);
  const copy = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(code);
      toast.success(`Code ${code} copied to clipboard`);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      toast.error("Couldn't copy the code — please copy it manually.");
    }
  };
  return { copied, copy };
}

function Discounts() {
  const navigate = useNavigate();
  const { copied, copy } = useCopy();

  const { data, isLoading } = useQuery({
    queryKey: ["discounts"],
    queryFn: () => getDiscounts(),
  });

  let fetchedList: DiscountItem[] = [];
  if (data) {
    if (Array.isArray(data)) {
      fetchedList = data;
    } else {
      const paginated = data as PaginatedResponse<DiscountItem>;
      fetchedList = paginated.results ?? [];
    }
  }

  const offers = fetchedList.length > 0 ? fetchedList : defaultOffers;

  return (
    <div className="min-h-screen bg-canvas-rose/40">

      <main className="mx-auto max-w-[1280px] px-6 py-8 md:px-8">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">Available Discounts</h1>
        <p className="mt-3 max-w-xl text-muted-foreground">
          Elevate your professional skills with exclusive, limited-time offers. Invest in your growth with focused
          learning experiences designed for high-impact results.
        </p>

        {/* Featured pass */}
        <section className="mt-12 grid items-center gap-8 rounded-3xl bg-primary p-10 text-primary-foreground md:grid-cols-[1.2fr_1fr]">
          <div>
            <span className="inline-block rounded-full bg-primary-foreground/15 px-3 py-1 text-xs font-semibold tracking-wide">
              SEASONAL SPECIAL
            </span>
            <h2 className="mt-5 text-3xl font-bold">The Serene Winter Pass</h2>
            <p className="mt-3 max-w-md text-primary-foreground/85">
              Get full access to every masterclass in our design and strategy library for an entire year at a fraction
              of the cost.
            </p>
            <div className="mt-8 flex flex-wrap items-end gap-6">
              <div>
                <p className="text-xs font-semibold tracking-wide text-primary-foreground/70">OFFER EXPIRES</p>
                <p className="text-xl font-bold">Dec 31, 2026</p>
              </div>
              <div className="h-12 w-px bg-primary-foreground/25" />
              <div>
                <p className="text-xs font-semibold tracking-wide text-primary-foreground/70">PROMO CODE</p>
                <button
                  onClick={() => copy("WINTERPASS")}
                  className="mt-1 inline-flex items-center gap-2 rounded-lg bg-primary-foreground/20 px-3 py-1 font-mono text-sm font-semibold tracking-wider hover:bg-primary-foreground/30 transition-colors"
                >
                  WINTERPASS <Copy className="size-3.5" aria-hidden />
                </button>
              </div>
            </div>
          </div>
          <div className="rounded-2xl bg-primary-foreground/10 p-6">
            <p className="text-center font-display text-2xl font-bold">Unlock Your Potential</p>
            <p className="mt-1 text-center text-sm text-primary-foreground/80">Exclusive Course Discounts</p>
            <div className="mt-6 grid grid-cols-3 gap-3">
              {["-25% OFF", "-20% OFF", "-30% OFF"].map((t) => (
                <div key={t} className="rounded-xl bg-card p-3 text-center">
                  <p className="text-xs font-semibold text-primary">{t}</p>
                  <p className="mt-2 text-[10px] text-muted-foreground">Enroll Now</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Offer grid */}
        {isLoading ? (
          <div className="mt-16 flex justify-center">
            <div className="size-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : (
          <section className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {offers.map((o) => {
              const badgeText =
                (o as { badge?: string }).badge ||
                `${o.percentage ?? o.discount_percentage ?? 0}% OFF`;
              const endDateStr = o.end_date ? new Date(o.end_date).toLocaleDateString() : "Ongoing";
              const discountIdStr = String(o.id || 1);

              return (
                <article
                  key={o.id || o.code}
                  onClick={() =>
                    navigate({
                      to: "/discounts/$discountId",
                      params: { discountId: discountIdStr },
                    })
                  }
                  className="surface-card flex flex-col p-6 rounded-2xl border border-border/70 transition-all duration-300 hover:border-primary/40 hover:bg-accent/20 hover:shadow-xl hover:-translate-y-1.5 group cursor-pointer"
                >
                  <div className="flex items-start justify-between">
                    <span className="rounded-full bg-accent px-3 py-1 text-xs font-semibold text-accent-foreground">
                      {badgeText}
                    </span>
                    <Tag className="size-5 text-primary transition-transform duration-300 group-hover:scale-110" aria-hidden />
                  </div>

                  <h2 className="mt-5 text-xl font-bold group-hover:text-primary transition-colors">
                    {o.title}
                  </h2>

                  <p className="mt-3 text-sm text-muted-foreground line-clamp-2">
                    {o.description || "Limited time promotional code for course enrollments."}
                  </p>

                  <div className="mt-auto pt-6">
                    <div className="flex items-center justify-between border-b border-border pb-3 text-sm">
                      <span className="field-label">Valid Until</span>
                      <span className="font-semibold">{endDateStr}</span>
                    </div>

                    <div className="mt-4 flex items-center justify-between">
                      <p className="field-label">Discount Code</p>
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary group-hover:underline">
                        View Details <ChevronRight className="size-3.5" aria-hidden />
                      </span>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        copy(o.code);
                      }}
                      className="mt-2 flex w-full items-center justify-between rounded-xl bg-accent/60 px-4 py-3 font-display text-lg font-bold tracking-widest text-primary transition-colors hover:bg-accent"
                    >
                      {copied === o.code ? "COPIED!" : o.code}
                      <Copy className="size-4 opacity-60" aria-hidden />
                    </button>
                  </div>
                </article>
              );
            })}

            {/* Empty state card */}
            <article className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-primary/30 p-10 text-center">
              <span className="flex size-14 items-center justify-center rounded-full bg-accent">
                <BellRing className="size-6 text-primary" aria-hidden />
              </span>
              <h2 className="mt-5 text-xl font-bold">More Coming Soon</h2>
              <p className="mt-3 text-sm text-muted-foreground">
                Subscribe to our newsletter to receive secret flash sale codes.
              </p>
            </article>
          </section>
        )}
      </main>
    </div>
  );
}
