import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Bookmark, MapPin, Search } from "lucide-react";
import { useState } from "react";

import { getJobs } from "@/lib/jobs-api";
import { formatJobSalary } from "@/lib/utils";
import type { JobItem, PaginatedResponse } from "@/lib/api-types";

export const Route = createFileRoute("/jobs/")({
  head: () => ({
    meta: [
      { title: "Job Opportunities | Lumina Learning" },
      {
        name: "description",
        content:
          "Find your next role in education and design — explore open positions on Lumina Learning.",
      },
      { property: "og:title", content: "Job Opportunities | Lumina Learning" },
      { property: "og:description", content: "Find your next role in education and design." },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "canonical", href: "/jobs" }],
  }),
  component: JobListings,
});

const defaultFallbackJobs: JobItem[] = [
  {
    id: 1,
    title: "Senior UX Designer",
    company: "Serene Academy",
    description: "We are looking for an experienced UX Designer to lead the redesign of our core learning platform.",
    location: "New York, NY",
    salary: "$120k - $150k",
    type: "Full-Time",
  },
  {
    id: 2,
    title: "Frontend Developer",
    company: "Creative Minds",
    description: "Join our frontend team to build responsive, performant, and accessible learning interfaces.",
    location: "Remote",
    salary: "$130k - $160k",
    type: "Full-Time",
  },
  {
    id: 3,
    title: "Product Manager",
    company: "EduTech Solutions",
    description: "Drive the vision and execution for our mobile learning app. Work closely with engineering and design.",
    location: "Remote",
    salary: "$110k - $140k",
    type: "Full-Time",
  },
];

function JobListings() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [saved, setSaved] = useState<number[]>([]);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["jobs", search, page],
    queryFn: () => getJobs({ search: search.trim() || undefined, page }),
  });

  let jobsList: JobItem[] = [];
  let totalPages = 1;

  if (data) {
    if (Array.isArray(data)) {
      jobsList = data;
    } else {
      const paginated = data as PaginatedResponse<JobItem>;
      jobsList = paginated.results ?? [];
      totalPages = paginated.meta?.total_pages ?? 1;
    }
  }

  const displayJobs =
    jobsList.length > 0
      ? jobsList
      : !search && page === 1
      ? defaultFallbackJobs
      : [];

  return (
    <div className="min-h-screen bg-canvas">
      <main className="mx-auto max-w-[1280px] px-6 py-8 md:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="min-w-0 flex-1">
            <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">Job Opportunities</h1>
            <p className="mt-2 text-muted-foreground">Find your next role in education and tech.</p>
          </div>

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
              placeholder="Search jobs by title, company, location..."
              className="h-11 w-full rounded-xl border border-input bg-card pl-10 pr-4 text-sm outline-none transition-shadow focus:ring-2 focus:ring-ring/30"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="mt-16 flex justify-center">
            <div className="size-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : isError && displayJobs.length === 0 ? (
          <div className="mt-16 text-center surface-card p-12 text-destructive">
            Failed to load job listings. Please check your connection.
          </div>
        ) : displayJobs.length === 0 ? (
          <div className="mt-16 text-center surface-card p-12">
            <h2 className="text-xl font-bold">No Jobs Found</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {search ? `No open positions match "${search}".` : "Check back later for new career opportunities."}
            </p>
          </div>
        ) : (
          <>
            <section className="mt-10 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {displayJobs.map((j) => {
                const isSaved = saved.includes(j.id);
                return (
                  <article
                    key={j.id}
                    onClick={() =>
                      navigate({
                        to: "/jobs/$jobId",
                        params: { jobId: String(j.id) },
                      })
                    }
                    className="surface-card flex flex-col justify-between p-7 rounded-2xl border border-border/70 transition-all duration-300 hover:border-primary/40 hover:bg-accent/20 hover:shadow-xl hover:-translate-y-1.5 group cursor-pointer"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h2 className="text-xl font-semibold tracking-tight text-foreground group-hover:text-primary transition-colors">
                            {j.title}
                          </h2>
                          <p className="mt-1 text-sm font-medium text-muted-foreground">
                            {j.company || "Lumina Partner"}
                          </p>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSaved((s) => (s.includes(j.id) ? s.filter((x) => x !== j.id) : [...s, j.id]));
                          }}
                          aria-label={`Save ${j.title}`}
                          aria-pressed={isSaved}
                          className={`grid size-10 shrink-0 place-items-center rounded-xl transition-colors ${
                            isSaved ? "bg-primary text-primary-foreground" : "bg-primary-soft text-primary"
                          }`}
                        >
                          <Bookmark className="size-4" aria-hidden />
                        </button>
                      </div>

                      <p className="mt-5 line-clamp-3 text-muted-foreground">{j.description}</p>
                    </div>

                    <div className="mt-6 flex items-center justify-between gap-3 border-t border-border pt-4">
                      <span className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
                        <MapPin className="size-4 text-primary" aria-hidden /> {j.location || "Remote"}
                      </span>
                      {j.salary && <span className="text-base font-semibold">{formatJobSalary(j.salary)}</span>}
                    </div>
                  </article>
                );
              })}
            </section>

            {totalPages > 1 && (
              <nav aria-label="Jobs pagination" className="mt-12 flex items-center justify-center gap-2">
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
