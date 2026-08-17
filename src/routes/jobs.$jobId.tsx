import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Briefcase,
  Check,
  CircleCheck,
  Clock,
  Info,
  MapPin,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { createJobApplication, getJobById, isJobStatusOpen, parseRequirements } from "@/lib/jobs-api";
import { getApiErrorMessage } from "@/lib/api-client";
import { formatJobSalary } from "@/lib/utils";

export const Route = createFileRoute("/jobs/$jobId")({
  head: () => ({
    meta: [
      { title: "Job Details | Lumina Learning" },
      {
        name: "description",
        content: "View role responsibilities, requirements, and apply directly.",
      },
    ],
  }),
  component: JobDetails,
});

function JobDetails() {
  const { jobId } = useParams({ from: "/jobs/$jobId" });
  const [applyOpen, setApplyOpen] = useState(false);
  const [coverLetter, setCoverLetter] = useState("");
  const [error, setError] = useState<string | null>(null);

  const { data: job, isLoading, isError } = useQuery({
    queryKey: ["job", jobId],
    queryFn: () => getJobById(jobId),
    enabled: !!jobId,
  });

  const applyMut = useMutation({
    mutationFn: async () => {
      if (!jobId) throw new Error("Missing job ID");
      return await createJobApplication({
        job: Number(jobId),
        cover_letter: coverLetter.trim() || undefined,
      });
    },
    onSuccess: () => {
      toast.success("Application submitted successfully!");
      setApplyOpen(false);
      setCoverLetter("");
      setError(null);
    },
    onError: (err) => {
      const msg = getApiErrorMessage(err);
      setError(msg);
      toast.error(`Application failed: ${msg}`);
    },
  });

  const submitApplication = () => {
    if (coverLetter.trim().length < 10) {
      setError("Please write a cover letter (at least 10 characters).");
      return;
    }
    setError(null);
    applyMut.mutate();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-canvas">
        <div className="mt-20 flex justify-center">
          <div className="size-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </div>
    );
  }

  if (isError || !job) {
    return (
      <div className="min-h-screen bg-canvas">
        <div className="mx-auto max-w-[1000px] px-6 pt-12 text-center">
          <h1 className="text-2xl font-bold">Job Not Found</h1>
          <p className="mt-2 text-muted-foreground">The requested job listing could not be found.</p>
          <Button asChild className="mt-6">
            <Link to="/jobs">← Back to Jobs</Link>
          </Button>
        </div>
      </div>
    );
  }

  const isOpen = isJobStatusOpen(job.status);
  const isClosed = !isOpen;

  return (
    <div className="min-h-screen bg-canvas">

      <main className="mx-auto max-w-[1000px] px-6 py-8 md:px-8">
        <Link
          to="/jobs"
          className="mt-6 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" aria-hidden /> Back to Browse Jobs
        </Link>

        <section className="surface-card mt-4 p-9">
          <div className="flex items-center gap-3">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
                isClosed
                  ? "bg-destructive/10 text-destructive"
                  : "bg-success-soft text-success"
              }`}
            >
              <CircleCheck className="size-3.5" aria-hidden />{" "}
              {isClosed ? "Applications Closed" : "Currently Hiring"}
            </span>
            {job.created_at && (
              <span className="text-sm text-muted-foreground">
                Posted {new Date(job.created_at).toLocaleDateString()}
              </span>
            )}
          </div>

          <div className="mt-4 flex flex-wrap items-start justify-between gap-6">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">{job.title}</h1>
              <p className="mt-3 flex items-center gap-2 text-xl font-semibold text-muted-foreground">
                {job.company || "Lumina Partner"} <BadgeCheck className="size-4 text-primary" aria-hidden />
              </p>
            </div>
            {!isClosed && (
              <Button className="gap-2 rounded-lg px-7" onClick={() => setApplyOpen(true)}>
                Apply Now <ArrowRight className="size-4" aria-hidden />
              </Button>
            )}
          </div>

          <div className="mt-8 grid gap-6 border-t border-border pt-6 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="text-sm text-muted-foreground">Location</p>
              <p className="mt-1 flex items-center gap-1.5 text-lg font-semibold">
                <MapPin className="size-4 text-primary" aria-hidden /> {job.location || "Remote"}
              </p>
            </div>
            {job.salary && (
              <div>
                <p className="text-sm text-muted-foreground">Salary Range</p>
                <p className="mt-1 text-lg font-semibold">{formatJobSalary(job.salary)}</p>
              </div>
            )}
            {job.type && (
              <div>
                <p className="text-sm text-muted-foreground">Job Type</p>
                <p className="mt-1 flex items-center gap-1.5 text-lg font-semibold">
                  <Briefcase className="size-4 text-primary" aria-hidden /> {job.type}
                </p>
              </div>
            )}
            {job.deadline && (
              <div>
                <p className="text-sm text-muted-foreground">Deadline</p>
                <p className="mt-1 flex items-center gap-1.5 text-lg font-semibold text-primary">
                  <Clock className="size-4" aria-hidden /> {new Date(job.deadline).toLocaleDateString()}
                </p>
              </div>
            )}
          </div>
        </section>

        <section className="mt-12">
          <h2 className="text-2xl font-bold">About the Role</h2>
          <div className="mt-4 text-lg leading-relaxed text-muted-foreground whitespace-pre-line">
            {job.description}
          </div>
        </section>

        {parseRequirements(job.requirements).length > 0 && (
          <section className="mt-12">
            <h2 className="text-2xl font-bold text-foreground">Requirements</h2>
            <ul className="mt-4 space-y-3.5 rounded-2xl border border-border/80 bg-card p-6 md:p-8">
              {parseRequirements(job.requirements).map((req, idx) => (
                <li key={idx} className="flex items-start gap-3.5 leading-relaxed">
                  <Check className="mt-1 size-4 shrink-0 text-primary" aria-hidden />
                  <span className="text-foreground/90 font-medium text-base">{req}</span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>

      <Dialog open={applyOpen} onOpenChange={setApplyOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl font-bold">Apply for this role</DialogTitle>
            <DialogDescription>
              {job.title} · {job.company || "Lumina Partner"}
            </DialogDescription>
          </DialogHeader>

          <p className="flex gap-2 rounded-xl bg-info-soft px-4 py-3 text-sm text-info">
            <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
            All contact, experience, and skill details from your profile will accompany this submission.
          </p>

          <div className="space-y-2">
            <label htmlFor="cover-letter" className="text-xs font-semibold">
              Cover Letter
            </label>
            <Textarea
              id="cover-letter"
              value={coverLetter}
              onChange={(e) => setCoverLetter(e.target.value)}
              placeholder="Tell the hiring team why you're a great fit for this position…"
              className="min-h-44 rounded-xl"
            />
            {error ? <p className="text-sm font-medium text-destructive">{error}</p> : null}
          </div>

          <DialogFooter>
            <Button variant="outline" className="rounded-lg" onClick={() => setApplyOpen(false)}>
              Cancel
            </Button>
            <Button
              className="rounded-lg px-6"
              disabled={applyMut.isPending}
              onClick={submitApplication}
            >
              {applyMut.isPending ? "Submitting..." : "Submit Application"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
