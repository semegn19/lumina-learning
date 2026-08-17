import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Briefcase, Info, MapPin, Wallet } from "lucide-react";
import { useState } from "react";
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
import { createJob, parseRequirements } from "@/lib/jobs-api";
import { getApiErrorMessage } from "@/lib/api-client";

export const Route = createFileRoute("/jobs/new")({
  head: () => ({
    meta: [
      { title: "Create a New Opportunity | Lumina Learning" },
      {
        name: "description",
        content: "Post a role on Lumina Learning: define compensation, timeline and responsibilities.",
      },
      { property: "og:title", content: "Create a New Opportunity | Lumina Learning" },
      { property: "og:description", content: "Define the role details to attract the best talent." },
    ],
  }),
  component: () => (
    <AdminGuard>
      <JobCreate />
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

function JobCreate() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [title, setTitle] = useState("");
  const [company, setCompany] = useState("");
  const [location, setLocation] = useState("");
  const [type, setType] = useState("Full-Time");
  const [salary, setSalary] = useState("");
  const [deadline, setDeadline] = useState("");
  const [description, setDescription] = useState("");
  const [responsibilities, setResponsibilities] = useState("");
  const [requirements, setRequirements] = useState("");

  const createMut = useMutation({
    mutationFn: async () => {
      if (!title.trim()) throw new Error("Job title is required");
      if (!company.trim()) throw new Error("Company name is required");

      const fullDescription = [
        description.trim(),
        responsibilities.trim() ? `\n\nKey Responsibilities\n${responsibilities.trim()}` : "",
      ]
        .filter(Boolean)
        .join("");

      const numericSalary = salary.trim() ? parseFloat(salary) : undefined;
      const reqsArray = parseRequirements(requirements);

      return await createJob({
        title,
        company: company.trim(),
        location: location.trim() || undefined,
        type,
        salary: numericSalary,
        deadline: deadline || undefined,
        description: fullDescription || "No detailed description provided.",
        requirements: reqsArray.length > 0 ? reqsArray : undefined,
      });
    },
    onSuccess: (newJob) => {
      toast.success("Job published successfully!");
      void queryClient.invalidateQueries({ queryKey: ["jobs"] });
      void navigate({ to: "/jobs/$jobId", params: { jobId: String(newJob.id) } });
    },
    onError: (err) => {
      toast.error(`Failed to publish job: ${getApiErrorMessage(err)}`);
    },
  });

  return (
    <div className="min-h-screen bg-canvas-rose/40">

      <main className="mx-auto max-w-[880px] px-6 py-8 md:px-8">
        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">Create a New Opportunity</h1>
        <p className="mt-2 text-muted-foreground">Define the role details to attract the best talent.</p>

        <form
          className="surface-card mt-10 space-y-10 p-8"
          onSubmit={(e) => {
            e.preventDefault();
            createMut.mutate();
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
                  placeholder="e.g. Senior Frontend Developer"
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
                  placeholder="e.g. Serene Academy"
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
                    placeholder="e.g. New York, NY or Remote"
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
            <SectionTitle icon={Briefcase}>Role Details</SectionTitle>

            <div className="space-y-2">
              <Label htmlFor="about">About the Role</Label>
              <Textarea
                id="about"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the overall purpose of this role…"
                className="min-h-40 rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="responsibilities">Key Responsibilities</Label>
              <Textarea
                id="responsibilities"
                value={responsibilities}
                onChange={(e) => setResponsibilities(e.target.value)}
                placeholder="List the primary duties and responsibilities (one per line)…"
                className="min-h-32 rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="requirements">Requirements</Label>
              <Textarea
                id="requirements"
                value={requirements}
                onChange={(e) => setRequirements(e.target.value)}
                placeholder="e.g. React, NextJS, TypeScript (comma separated or one per line)"
                className="min-h-32 rounded-xl"
              />
              <p className="text-xs text-muted-foreground"> Separate by commas or newlines. </p>
            </div>
          </section>

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              className="rounded-lg"
              onClick={() => void navigate({ to: "/jobs" })}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={createMut.isPending} className="rounded-lg">
              {createMut.isPending ? "Publishing..." : "Publish Job"}
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}
