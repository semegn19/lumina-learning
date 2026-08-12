import { createFileRoute, Link, notFound, useNavigate, useParams } from "@tanstack/react-router";
import { ArrowLeft, CalendarDays, Info, MapPin } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";  

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { findApplication } from "@/lib/data";

export const Route = createFileRoute("/applications/$applicationId/edit")({
  head: () => ({
    meta: [
      { title: "Edit Application | Lumina Learning" },
      { name: "description", content: "Update the cover letter attached to one of your job applications." },
      { property: "og:title", content: "Edit Application | Lumina Learning" },
      { property: "og:description", content: "Update your cover letter for this role." },
      { property: "og:type", content: "website" },
    ],
  }),
  component: EditApplication,
  notFoundComponent: () => (
    <div className="grid min-h-screen place-items-center px-6 text-center">
      <div>
        <h1 className="text-3xl font-bold">Application not found</h1>
        <Button asChild className="mt-6 rounded-lg">
          <Link to="/applications">Back to my applications</Link>
        </Button>
      </div>
    </div>
  ),
  errorComponent: () => (
    <div className="grid min-h-screen place-items-center px-6 text-center">
      <p className="text-muted-foreground">Something went wrong loading this application.</p>
    </div>
  ),
});

function EditApplication() {
  const { applicationId } = useParams({ from: "/applications/$applicationId/edit" });
  const navigate = useNavigate();
  const application = findApplication(applicationId);
  if (!application) throw notFound();

  const [coverLetter, setCoverLetter] = useState(application.coverLetter);
  const [error, setError] = useState<string | null>(null);

  const save = () => {
    if (coverLetter.trim().length < 30) {
      setError("Please write at least 30 characters.");
      return;
    }
    setError(null);
    toast.success("Application updated");
    void navigate({ to: "/applications" });
  };

  return (
    <div className="min-h-screen bg-canvas-rose/40">

      <main className="mx-auto max-w-[860px] px-6 py-8 md:px-8">
        <Link
          to="/applications"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" aria-hidden /> Back to my applications
        </Link>

        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">Edit Application</h1>
        <p className="mt-2 text-muted-foreground">
          {application.jobTitle} · {application.company}
        </p>

        <div className="mt-6 flex flex-wrap gap-5 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <MapPin className="size-4 text-primary" aria-hidden /> {application.location}
          </span>
          <span className="flex items-center gap-1.5">
            <CalendarDays className="size-4 text-primary" aria-hidden /> Applied {application.appliedAt}
          </span>
        </div>

        <section className="surface-card mt-8 p-8">
          <p className="flex gap-2 rounded-xl bg-info-soft px-4 py-3 text-sm text-info">
            <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
            All contact, experience and skill information is sent directly from your profile, so make sure it's updated
            before re-submitting.
          </p>

          <div className="mt-6 space-y-2">
            <label htmlFor="cover-letter" className="text-xs font-semibold">
              Cover Letter
            </label>
            <Textarea
              id="cover-letter"
              value={coverLetter}
              onChange={(e) => setCoverLetter(e.target.value)}
              className="min-h-56 rounded-xl"
            />
            {error ? <p className="text-sm font-medium text-destructive">{error}</p> : null}
          </div>

          <div className="mt-8 flex justify-end gap-3 border-t border-border pt-6">
            <Button asChild variant="outline" className="rounded-lg px-6">
              <Link to="/applications">Cancel</Link>
            </Button>
            <Button className="rounded-lg px-6" onClick={save}>
              Save Changes
            </Button>
          </div>
        </section>
      </main>
    </div>
  );
}
