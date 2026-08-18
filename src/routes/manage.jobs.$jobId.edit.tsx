import { createFileRoute, Link, useNavigate, useParams } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Info, List, MapPin, Wallet } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { AdminGuard } from "@/components/admin-guard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { DatePicker } from "@/components/ui/date-picker";
import { getJobById, updateJob, parseRequirements } from "@/lib/jobs-api";
import { getApiErrorMessage } from "@/lib/api-client";
import type { JobCreatePayload } from "@/lib/api-types";

export const Route = createFileRoute("/manage/jobs/$jobId/edit")({
  head: () => ({
    meta: [
      { title: "Edit Opportunity | Lumina Learning" },
      { name: "description", content: "Update the details, compensation and requirements of a published role." },
      { property: "og:title", content: "Edit Opportunity | Lumina Learning" },
      { property: "og:description", content: "Update the details of a published role." },
      { property: "og:type", content: "website" },
    ],
  }),
  component: () => (
    <AdminGuard>
      <EditJob />
    </AdminGuard>
  ),
});

function SectionTitle({ icon: Icon, children }: { icon: typeof Info; children: string }) {
  return (
    <h2 className="flex items-center gap-2 text-2xl font-bold">
      <Icon className="size-5 text-primary" aria-hidden />
      {children}
    </h2>
  );
}

function EditJob() {
  const { jobId } = useParams({ from: "/manage/jobs/$jobId/edit" });
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: job, isLoading, isError } = useQuery({
    queryKey: ["job", jobId],
    queryFn: () => getJobById(jobId),
    enabled: !!jobId,
  });

  const [title, setTitle] = useState("");
  const [company, setCompany] = useState("");
  const [location, setLocation] = useState("");
  const [type, setType] = useState("Full-Time");
  const [salary, setSalary] = useState("");
  const [deadline, setDeadline] = useState("");
  const [description, setDescription] = useState("");
  const [requirements, setRequirements] = useState("");

  useEffect(() => {
    if (job) {
      setTitle(job.title || "");
      setCompany(job.company || "");
      setLocation(job.location || "");
      setType(job.type || "Full-Time");
      setSalary(job.salary ? String(job.salary) : "");
      setDeadline(job.deadline ? String(job.deadline).split("T")[0] || "" : "");
      setDescription(job.description || "");

      const parsedReqs = parseRequirements(job.requirements);
      setRequirements(parsedReqs.join("\n"));
    }
  }, [job]);

  const updateMut = useMutation({
    mutationFn: async () => {
      if (!jobId) throw new Error("Missing job ID");
      const reqsArray = parseRequirements(requirements);

      const payload: Partial<JobCreatePayload> = {
        title,
        type,
      };
      if (company.trim()) payload.company = company.trim();
      if (location.trim()) payload.location = location.trim();
      if (salary.trim()) payload.salary = parseFloat(salary);
      if (deadline) payload.deadline = deadline;
      if (description.trim()) payload.description = description.trim();
      if (reqsArray.length > 0) payload.requirements = reqsArray;

      return await updateJob(jobId, payload);
    },
    onSuccess: () => {
      toast.success("Job posting updated successfully");
      void queryClient.invalidateQueries({ queryKey: ["job", jobId] });
      void queryClient.invalidateQueries({ queryKey: ["jobs"] });
      void queryClient.invalidateQueries({ queryKey: ["manage-jobs"] });
      void navigate({ to: "/manage/jobs" });
    },
    onError: (err) => {
      toast.error(`Failed to update job: ${getApiErrorMessage(err)}`);
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

  if (isError || !job) {
    return (
      <div className="min-h-screen bg-canvas">
        <div className="mx-auto max-w-[880px] px-6 pt-12 text-center">
          <h1 className="text-2xl font-bold">Job Not Found</h1>
          <p className="mt-2 text-muted-foreground">The requested job posting could not be found.</p>
          <Button asChild className="mt-6">
            <Link to="/manage/jobs">← Back to My Job Postings</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-canvas-rose/40">

      <main className="mx-auto max-w-[880px] px-6 py-8 md:px-8">
        <Link to="/manage/jobs" className="text-sm text-muted-foreground hover:text-foreground">
          ← Back to my job postings
        </Link>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">Edit Opportunity</h1>
        <p className="mt-2 text-muted-foreground">
          Update the role details for <span className="font-medium text-foreground">{job.title}</span>.
        </p>

        <form
          className="surface-card mt-10 space-y-10 p-8"
          onSubmit={(e) => {
            e.preventDefault();
            updateMut.mutate();
          }}
        >
          <section className="space-y-5">
            <SectionTitle icon={Info}>Basic Information</SectionTitle>
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="title">Job Title</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  className="h-12 rounded-lg"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="company">Company Name</Label>
                <Input
                  id="company"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  required
                  className="h-12 rounded-lg"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <div className="relative">
                  <MapPin
                    className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                    aria-hidden
                  />
                  <Input
                    id="location"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="h-12 rounded-lg pl-10"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Job Type</Label>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger id="type" className="h-12 rounded-lg">
                    <SelectValue placeholder="Select Job Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Full-Time">Full-Time</SelectItem>
                    <SelectItem value="Part-Time">Part-Time</SelectItem>
                    <SelectItem value="Contract">Contract</SelectItem>
                    <SelectItem value="Internship">Internship</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </section>

          <hr className="border-border" />

          <section className="space-y-5">
            <SectionTitle icon={Wallet}>Compensation &amp; Timeline</SectionTitle>
            <div className="grid gap-5 sm:grid-cols-2 sm:items-start">
              <div className="space-y-2">
                <Label htmlFor="salary">Annual Salary ($)</Label>
                <Input
                  id="salary"
                  type="number"
                  min={0}
                  step="1000"
                  value={salary}
                  onChange={(e) => setSalary(e.target.value)}
                  placeholder="e.g. 120000"
                  className="h-12 rounded-lg"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="deadline">Application Deadline</Label>
                <DatePicker
                  id="deadline"
                  value={deadline}
                  onChange={(val) => setDeadline(val)}
                  placeholder="Select deadline"
                />
              </div>
            </div>
          </section>

          <hr className="border-border" />

          <section className="space-y-5">
            <SectionTitle icon={List}>Role Details</SectionTitle>
            <div className="space-y-2">
              <Label htmlFor="description">Job Description</Label>
              <Textarea
                id="description"
                rows={6}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="min-h-40 rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="requirements">Requirements</Label>
              <Textarea
                id="requirements"
                rows={4}
                value={requirements}
                onChange={(e) => setRequirements(e.target.value)}
                placeholder="e.g. React, NextJS, TypeScript (comma separated or one per line)"
                className="rounded-xl"
              />
              <p className="text-xs text-muted-foreground">
                Separate by commas or newlines.
              </p>
            </div>
          </section>

          <div className="flex flex-wrap justify-end gap-3">
            <Button asChild variant="outline" className="rounded-lg px-6">
              <Link to="/manage/jobs/$jobId/applicants" params={{ jobId: String(jobId) }}>
                View Applicants
              </Link>
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
