import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Briefcase, CalendarDays, MapPin, MoreVertical, Pencil, Search, Trash2 } from "lucide-react";
import { useState } from "react";             
import { toast } from "sonner";

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
import { Input } from "@/components/ui/input";
import { deleteJobApplication, getJobApplications } from "@/lib/jobs-api";
import type { JobApplication, PaginatedResponse } from "@/lib/api-types";
import { getApiErrorMessage } from "@/lib/api-client";

export const Route = createFileRoute("/applications/")({
  head: () => ({
    meta: [
      { title: "My Applications | Lumina Learning" },
      { name: "description", content: "Track the jobs you've applied to, edit your cover letters or withdraw." },
      { property: "og:title", content: "My Applications | Lumina Learning" },
      { property: "og:description", content: "Track the jobs you've applied to and manage your applications." },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "canonical", href: "/applications" }],
  }),
  component: MyApplications,
});

function MyApplications() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [query, setQuery] = useState("");
  const [pendingDelete, setPendingDelete] = useState<JobApplication | null>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["my-applications"],
    queryFn: () => getJobApplications(),
  });

  const deleteMut = useMutation({
    mutationFn: async (id: number) => {
      await deleteJobApplication(id);
    },
    onSuccess: () => {
      toast.success("Application withdrawn successfully!");
      setPendingDelete(null);
      void queryClient.invalidateQueries({ queryKey: ["my-applications"] });
    },
    onError: (err) => {
      toast.error(`Failed to withdraw application: ${getApiErrorMessage(err)}`);
    },
  });

  let rawList: JobApplication[] = [];
  if (data) {
    if (Array.isArray(data)) {
      rawList = data;
    } else {
      const paginated = data as PaginatedResponse<JobApplication>;
      rawList = paginated.results ?? [];
    }
  }

  const list = query.trim()
    ? rawList.filter((a) => {
        const jobTitle = (typeof a.job === "object" ? a.job.title : a.job_detail?.title) || "";
        const company = (typeof a.job === "object" ? a.job.company : a.job_detail?.company) || "";
        return (
          jobTitle.toLowerCase().includes(query.toLowerCase()) ||
          company.toLowerCase().includes(query.toLowerCase())
        );
      })
    : rawList;

  return (
    <div className="min-h-screen bg-canvas-rose/40">

      <main className="mx-auto max-w-[1280px] px-6 py-8 md:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">My Applications</h1>
            <p className="mt-2 text-muted-foreground">
              Every role you've applied to, with submission dates and status updates.
            </p>
          </div>
          <Button asChild variant="outline" className="rounded-lg px-6">
            <Link to="/jobs">Browse Jobs</Link>
          </Button>
        </div>

        <div className="relative mt-8 max-w-sm">
          <Search
            className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search applications"
            aria-label="Search applications"
            className="h-11 rounded-xl pl-11"
          />
        </div>

        {isLoading ? (
          <div className="mt-12 flex justify-center">
            <div className="size-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : isError ? (
          <div className="mt-12 text-center text-destructive">
            Failed to load your job applications. Make sure you are signed in.
          </div>
        ) : list.length === 0 ? (
          <div className="mt-8 surface-card p-16 text-center">
            <span className="mx-auto grid size-14 place-items-center rounded-full bg-primary-soft text-primary">
              <Briefcase className="size-6" aria-hidden />
            </span>
            <h2 className="mt-5 text-xl font-bold">
              {query ? `No applications match "${query}"` : "No applications yet"}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              When you apply to a role on Lumina Learning, it will show up here.
            </p>
            <Button asChild className="mt-6 rounded-lg px-6">
              <Link to="/jobs">Browse Jobs</Link>
            </Button>
          </div>
        ) : (
          <section className="mt-8 space-y-4">
            {list.map((a) => {
              const jobItem = typeof a.job === "object" ? a.job : a.job_detail;
              const jobTitle = jobItem?.title || `Job #${typeof a.job === "number" ? a.job : a.job}`;
              const company = jobItem?.company || "Lumina Partner";
              const location = jobItem?.location || "Remote";
              const appliedDate = a.created_at || a.applied_at;

              return (
                <article key={a.id} className="surface-card flex flex-wrap items-start gap-6 p-7">
                  <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-primary-soft text-primary">
                    <Briefcase className="size-5" aria-hidden />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="text-xl font-bold">{jobTitle}</h2>
                      <span className="rounded-full bg-info-soft px-3 py-1 text-xs font-semibold text-info">
                        {a.status || "Submitted"}
                      </span>
                    </div>
                    <p className="mt-1 text-sm font-semibold text-muted-foreground">{company}</p>
                    <div className="mt-3 flex flex-wrap gap-5 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <MapPin className="size-4 text-primary" aria-hidden /> {location}
                      </span>
                      {appliedDate && (
                        <span className="flex items-center gap-1.5">
                          <CalendarDays className="size-4 text-primary" aria-hidden /> Applied{" "}
                          {new Date(appliedDate).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    {a.cover_letter && (
                      <p className="mt-4 line-clamp-2 text-sm text-muted-foreground">{a.cover_letter}</p>
                    )}
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger
                      aria-label={`Actions for ${jobTitle} application`}
                      className="text-muted-foreground transition-colors hover:text-foreground"
                    >
                      <MoreVertical className="size-4" aria-hidden />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-52">
                      <DropdownMenuItem
                        onSelect={() =>
                          void navigate({
                            to: "/applications/$applicationId/edit",
                            params: { applicationId: String(a.id) },
                          })
                        }
                      >
                        <Pencil className="size-4" aria-hidden /> Edit cover letter
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive"
                        onSelect={() => setPendingDelete(a)}
                      >
                        <Trash2 className="size-4" aria-hidden /> Withdraw application
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </article>
              );
            })}
          </section>
        )}
      </main>

      <AlertDialog open={pendingDelete !== null} onOpenChange={(o) => !o && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to withdraw?</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingDelete
                ? `Your application for ${
                    typeof pendingDelete.job === "object"
                      ? pendingDelete.job.title
                      : pendingDelete.job_detail?.title || "this job"
                  } will be permanently removed.`
                : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={() => {
                if (pendingDelete) {
                  deleteMut.mutate(pendingDelete.id);
                }
              }}
            >
              Withdraw Application
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
