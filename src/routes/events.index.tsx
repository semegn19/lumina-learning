import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Calendar, CheckCircle2, MapPin, Search } from "lucide-react";
import { useState } from "react";

import courseTypography from "@/assets/course-typography.jpg";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getEvents } from "@/lib/events-api";
import { formatPrice, getMediaUrl } from "@/lib/utils";
import type { EventItem, PaginatedResponse } from "@/lib/api-types";

export const Route = createFileRoute("/events/")({
  head: () => ({
    meta: [
      { title: "Upcoming Events | Lumina Learning" },
      {
        name: "description",
        content:
          "Discover exclusive workshops, symposiums and masterclasses designed to elevate your creative journey.",
      },
      { property: "og:title", content: "Upcoming Events | Lumina Learning" },
      { property: "og:description", content: "Workshops, symposiums and masterclasses for creatives." },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "canonical", href: "/events" }],
  }),
  component: EventListing,
});

function formatBackendDateTime(isoString?: string) {
  if (!isoString) return { dateStr: "TBD", timeStr: "" };
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) {
      return { dateStr: isoString, timeStr: "" };
    }
    const dateStr = d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
    const timeStr = d.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
    return { dateStr, timeStr };
  } catch {
    return { dateStr: isoString, timeStr: "" };
  }
}

function EventListing() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "registered">("all");
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ["events", search, page],
    queryFn: async () => {
      const res = await getEvents({ search: search.trim() || undefined, page });
      return res;
    },
  });

  let rawEvents: EventItem[] = [];
  let totalPages = 1;

  if (data) {
    if (Array.isArray(data)) {
      rawEvents = data;
    } else {
      const paginated = data as PaginatedResponse<EventItem>;
      rawEvents = paginated.results ?? [];
      totalPages = paginated.meta?.total_pages ?? 1;
    }
  }

  const eventsList = rawEvents.filter((e) => {
    if (activeTab === "registered") {
      return e.is_registered === true;
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-canvas-rose/40">
      <main className="mx-auto max-w-[1280px] px-6 py-8 md:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="min-w-0 flex-1">
            <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">Upcoming Events</h1>
            <p className="mt-3 max-w-lg text-muted-foreground">
              Discover exclusive workshops, symposiums, and masterclasses designed to elevate your creative journey.
            </p>
          </div>

          {/* Search bar */}
          <div className="relative w-full sm:w-80">
            <Search
              className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <input
              type="search"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search events by title or location..."
              className="h-11 w-full rounded-xl border border-input bg-card pl-10 pr-4 text-sm outline-none transition-shadow focus:ring-2 focus:ring-ring/30"
            />
          </div>
        </div>

        {/* Catalog Filter Tabs */}
        <div className="mt-8">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "all" | "registered")}>
            <TabsList className="h-11 rounded-xl bg-card p-1 border border-border">
              <TabsTrigger value="all" className="h-9 rounded-lg px-5 text-sm font-semibold">
                All Events
              </TabsTrigger>
              <TabsTrigger value="registered" className="h-9 rounded-lg px-5 text-sm font-semibold">
                Registered Events
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {isLoading ? (
          <div className="mt-16 flex justify-center">
            <div className="size-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : eventsList.length === 0 ? (
          <div className="mt-16 text-center surface-card p-12">
            <h2 className="text-xl font-bold">No Events Found</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {activeTab === "registered"
                ? "You haven't registered for any events yet."
                : search
                ? `No events match "${search}".`
                : "Check back later for upcoming masterclasses and workshops."}
            </p>
          </div>
        ) : (
          <>
            <section className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {eventsList.map((e) => {
                const imgUrl = getMediaUrl(e.picture || e.image || e.thumbnail || e.cover_image) || courseTypography;
                const priceFormatted = formatPrice(e.price, e.currency);

                const { dateStr, timeStr } = formatBackendDateTime(e.date);

                return (
                  <article
                    key={e.id}
                    onClick={() =>
                      navigate({
                        to: "/events/$eventId",
                        params: { eventId: String(e.id) },
                      })
                    }
                    className="surface-card flex flex-col overflow-hidden rounded-2xl border border-border/70 transition-all duration-300 hover:border-primary/40 hover:bg-accent/20 hover:shadow-xl hover:-translate-y-1.5 group cursor-pointer"
                  >
                    <div className="relative overflow-hidden">
                      <img
                        src={imgUrl}
                        alt={e.title}
                        loading="lazy"
                        width={800}
                        height={512}
                        className="h-48 w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute right-4 top-4 flex items-center gap-2">
                        {e.is_registered && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-success-soft px-3 py-1.5 text-[11px] font-bold text-success shadow-sm">
                            <CheckCircle2 className="size-3.5" aria-hidden /> Registered
                          </span>
                        )}
                        <span className="rounded-full bg-card px-3 py-1.5 text-[11px] font-bold tracking-wide shadow-sm">
                          {e.place || "Online"}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-1 flex-col p-6">
                      <div className="flex flex-wrap items-center gap-3 text-xs font-semibold tracking-wide text-muted-foreground">
                        <span className="flex items-center gap-1.5">
                          <Calendar className="size-3.5" aria-hidden /> {dateStr} {timeStr ? `• ${timeStr}` : ""}
                        </span>
                        {e.place && (
                          <span className="flex items-center gap-1.5">
                            <MapPin className="size-3.5" aria-hidden /> {e.place}
                          </span>
                        )}
                      </div>

                      <h2 className="mt-3 text-2xl font-bold line-clamp-2 group-hover:text-primary transition-colors">
                        {e.title}
                      </h2>
                      <p className="mt-3 text-muted-foreground line-clamp-3">{e.description}</p>

                      <div className="mt-auto flex items-center justify-between gap-4 pt-8">
                        <div>
                          <p className="field-label">Access</p>
                          <p className="mt-1 text-xl font-bold">{priceFormatted}</p>
                        </div>
                        <Button
                          asChild
                          variant={e.is_registered ? "secondary" : "outline"}
                          className="rounded-full px-6"
                          onClick={(ev) => ev.stopPropagation()}
                        >
                          <Link to="/events/$eventId" params={{ eventId: String(e.id) }}>
                            {e.is_registered ? "View Ticket" : "View Details"}
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </section>

            {totalPages > 1 && (
              <nav aria-label="Events pagination" className="mt-12 flex items-center justify-center gap-2">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    onClick={() => {
                      setPage(p);
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    aria-current={page === p ? "page" : undefined}
                    className={`size-10 rounded-xl text-sm font-semibold transition-colors ${
                      page === p
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
