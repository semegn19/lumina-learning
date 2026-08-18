import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Briefcase, Eye, MoreVertical, Pencil, Plus, Search, Trash2, Users } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { AdminGuard } from "@/components/admin-guard";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { deleteJob, getJobs, isJobStatusOpen } from "@/lib/jobs-api";
import type { JobItem, PaginatedResponse } from "@/lib/api-types";
import { getApiErrorMessage } from "@/lib/api-client";
import { formatJobSalary } from "@/lib/utils";

export const Route = createFileRoute("/manage/jobs/")({
  head: () => ({
    meta: [
      { title: "Manage Job Postings | Lumina Learning" },
      {
        name: "description",
        content: "Review, edit and remove the roles you have posted, and open the applicant list for each one.",
      },
      { property: "og:title", content: "Manage Job Postings | Lumina Learning" },
      { property: "og:description", content: "Review, edit and remove the roles you have posted." },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "canonical", href: "/manage/jobs" }],
  }),
  component: () => (
    <AdminGuard>
      <ManageJobs />
    </AdminGuard>
  ),
});

function ManageJobs() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [query, setQuery] = useState("");
  const [pending, setPending] = useState<JobItem | null>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["manage-jobs"],
    queryFn: () => getJobs(),
  });

  const deleteMut = useMutation({
    mutationFn: async (id: number) => {
      await deleteJob(id);
    },
    onSuccess: () => {
      toast.success("Job posting deleted successfully");
      setPending(null);
      void queryClient.invalidateQueries({ queryKey: ["manage-jobs"] });
      void queryClient.invalidateQueries({ queryKey: ["jobs"] });
    },
    onError: (err) => {
      toast.error(`Failed to delete job: ${getApiErrorMessage(err)}`);
    },
  });

  let rawList: JobItem[] = [];
  if (data) {
    if (Array.isArray(data)) {
      rawList = data;
    } else {
      rawList = (data as PaginatedResponse<JobItem>).results ?? [];
    }
  }

  const visible = query.trim()
    ? rawList.filter((j) =>
        `${j.title} ${j.company || ""} ${j.location || ""} ${j.type || ""}`
          .toLowerCase()
          .includes(query.trim().toLowerCase())
      )
    : rawList;

  return (
    <div className="min-h-screen bg-canvas">

      <main className="mx-auto max-w-[1280px] px-6 py-8 md:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">My Job Postings</h1>
            <p className="mt-2 text-muted-foreground">Manage the roles you have published and review applicants.</p>
          </div>
          <Button asChild className="gap-2 rounded-lg px-6">
            <Link to="/jobs/new">
              <Plus className="size-4" aria-hidden /> New Opportunity
            </Link>
          </Button>
        </div>

        <div className="relative mt-8 max-w-md">
          <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search job postings…"
            aria-label="Search job postings"
            className="h-12 w-full rounded-xl border border-input bg-card pl-11 pr-4 text-sm outline-none focus:ring-2 focus:ring-ring/30"
          />
        </div>

        {isLoading ? (
          <div className="mt-12 flex justify-center">
            <div className="size-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : isError ? (
          <div className="mt-12 text-center text-destructive">
            Failed to load job postings. Ensure you have administrator/host permissions.
          </div>
        ) : visible.length === 0 ? (
          <div className="surface-card mt-8 grid place-items-center gap-3 p-16 text-center">
            <Briefcase className="size-8 text-muted-foreground" aria-hidden />
            <p className="text-lg font-semibold">
              {query ? `No job postings match "${query}"` : "No job postings found"}
            </p>
            <p className="text-sm text-muted-foreground">Try a different search, or publish a new opportunity.</p>
          </div>
        ) : (
          <ul className="mt-8 space-y-4">
            {visible.map((job) => {
              const isOpen = isJobStatusOpen(job.status);

              return (
                <li
                  key={job.id}
                  onClick={() =>
                    navigate({
                      to: "/jobs/$jobId",
                      params: { jobId: String(job.id) },
                    })
                  }
                  className="surface-card group flex flex-wrap items-center gap-5 p-6 transition-all duration-200 hover:border-primary/40 hover:bg-accent/30 hover:shadow-md cursor-pointer"
                >
                  <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-primary-soft text-primary transition-transform duration-300 group-hover:scale-105">
                    <Briefcase className="size-5" aria-hidden />
                  </span>
                  <div className="min-w-[200px] flex-1">
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="text-lg font-bold group-hover:text-primary transition-colors">
                        {job.title}
                      </h2>
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                          isOpen ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {isOpen ? "Open" : "Closed"}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {job.company || "Lumina Partner"} · {job.location || "Remote"} · {job.type || "Full-Time"}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {job.created_at ? `Posted ${new Date(job.created_at).toLocaleDateString()}` : ""}{" "}
                      {job.deadline ? `· Deadline ${new Date(job.deadline).toLocaleDateString()}` : ""}{" "}
                      {job.salary ? `· ${formatJobSalary(job.salary)}` : ""}
                    </p>
                  </div>

                  <div className="flex items-center gap-2" onClick={(ev) => ev.stopPropagation()}>
                    <Button asChild variant="outline" className="gap-2 rounded-lg">
                      <Link to="/manage/jobs/$jobId/applicants" params={{ jobId: String(job.id) }}>
                        <Users className="size-4" aria-hidden /> Applicants
                      </Link>
                    </Button>

                    <DropdownMenu>
                      <DropdownMenuTrigger aria-label={`Actions for ${job.title}`} className="rounded-lg p-2 hover:bg-accent text-muted-foreground hover:text-foreground transition-colors">
                        <MoreVertical className="size-5" aria-hidden />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link to="/jobs/$jobId" params={{ jobId: String(job.id) }}>
                            <Eye className="size-4" aria-hidden /> View job
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link to="/manage/jobs/$jobId/edit" params={{ jobId: String(job.id) }}>
                            <Pencil className="size-4" aria-hidden /> Edit job
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive" onSelect={() => setPending(job)}>
                          <Trash2 className="size-4" aria-hidden /> Delete job
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </main>

      <AlertDialog open={pending !== null} onOpenChange={(open) => !open && setPending(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action can't be undone. “{pending?.title}” and all of its applications will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={() => {
                if (pending) {
                  deleteMut.mutate(pending.id);
                }
              }}
            >
              Delete permanently
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
