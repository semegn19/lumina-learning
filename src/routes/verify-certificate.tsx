import { createFileRoute } from "@tanstack/react-router";
import { BadgeCheck, CalendarDays, FileText, GraduationCap, Search, ShieldAlert, User } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { verifyCertificate } from "@/lib/payments-certificates-api";
import { getUserById } from "@/lib/auth-api";
import { getCourseById } from "@/lib/courses-api";
import { getApiErrorMessage } from "@/lib/api-client";
import { getMediaUrl } from "@/lib/utils";

export const Route = createFileRoute("/verify-certificate")({
  head: () => ({
    meta: [
      { title: "Verify a Certificate | Lumina Learning" },
      {
        name: "description",
        content: "Enter a certificate UUID to confirm the recipient, course and issue date of a Lumina credential.",
      },
      { property: "og:title", content: "Verify a Certificate | Lumina Learning" },
      { property: "og:description", content: "Confirm the authenticity of any Lumina Learning credential." },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "canonical", href: "/verify-certificate" }],
  }),
  component: VerifyCertificate,
});

interface DisplayCertificate {
  recipientName: string;
  courseTitle: string;
  issuedAt: string;
  pdfUrl?: string | null | undefined;
}

function VerifyCertificate() {
  const [value, setValue] = useState("");
  const [result, setResult] = useState<DisplayCertificate | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [pending, setPending] = useState(false);

  const verify = async (e: React.FormEvent) => {
    e.preventDefault();
    const id = value.trim();
    if (!id) return;

    setPending(true);
    setNotFound(false);
    setResult(null);

    try {
      const res = await verifyCertificate(id);

      // Extract user details cleanly
      let recipientName = res.user_name || "";
      if (!recipientName && res.user !== undefined && res.user !== null) {
        const u = res.user as any;
        if (typeof u === "object") {
          recipientName = `${u.first_name || ""} ${u.last_name || ""}`.trim() || u.username;
        } else if (typeof u === "string") {
          recipientName = u.replace(/^User\s*#/i, "").trim();
        } else {
          try {
            const fetched = await getUserById(u);
            recipientName = `${fetched.first_name || ""} ${fetched.last_name || ""}`.trim() || fetched.username;
          } catch {
            recipientName = `Student ${u}`;
          }
        }
      }

      // Extract course details cleanly
      let courseTitle = res.course_title || "";
      if (!courseTitle && res.course !== undefined && res.course !== null) {
        const c = res.course as any;
        if (typeof c === "object") {
          courseTitle = c.title;
        } else if (typeof c === "string") {
          courseTitle = c.replace(/^Course\s*#/i, "").trim();
        } else {
          try {
            const fetched = await getCourseById(c);
            courseTitle = fetched.title;
          } catch {
            courseTitle = `Course ${c}`;
          }
        }
      }

      // Final cleanup of any pre-existing "User #" or "Course #" text
      recipientName = recipientName.replace(/^User\s*#/i, "").trim();
      courseTitle = courseTitle.replace(/^Course\s*#/i, "").trim();

      const pdfUrl = getMediaUrl(res.pdf_file || res.pdf_url);

      setResult({
        recipientName: recipientName || "Student",
        courseTitle: courseTitle || "Course Credential",
        issuedAt: new Date(res.issued_at).toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        }),
        pdfUrl,
      });
    } catch (err) {
      setNotFound(true);
      toast.error(`Verification failed: ${getApiErrorMessage(err)}`);
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="min-h-screen bg-canvas-rose/40">

      <main className="mx-auto max-w-[860px] px-6 py-8 md:px-8">
        <div className="text-center">
          <span className="mx-auto grid size-14 place-items-center rounded-full bg-primary-soft text-primary">
            <ShieldAlert className="size-6" aria-hidden />
          </span>
          <h1 className="mt-5 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">Certificate Verification</h1>
          <p className="mt-3 text-muted-foreground">
            Enter a certificate UUID/ID to confirm who it was awarded to, the course completed and the date it was issued.
          </p>
        </div>

        <form onSubmit={verify} className="surface-card mt-10 flex flex-col gap-3 p-6 sm:flex-row">
          <div className="relative flex-1">
            <Search
              className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <Input
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="Enter Certificate UUID (e.g. 70bbdf1b-e859-4d59-acef-9babff1ddd6f)"
              aria-label="Certificate ID"
              className="h-12 rounded-xl pl-11"
            />
          </div>
          <Button type="submit" disabled={pending} className="h-12 rounded-xl px-8">
            {pending ? "Verifying…" : "Verify"}
          </Button>
        </form>

        {result ? (
          <section className="surface-card mt-10 overflow-hidden p-0">
            <div className="flex items-center gap-3 bg-success-soft px-8 py-5 text-success">
              <BadgeCheck className="size-5" aria-hidden />
              <p className="font-semibold">Valid certificate</p>
            </div>
            <div className="p-8">
              <p className="text-2xl font-bold leading-relaxed">
                This {result.courseTitle} course certificate was awarded to {result.recipientName} for successfully completing this course.
              </p>

              <dl className="mt-8 grid gap-6 sm:grid-cols-3">
                <div>
                  <dt className="flex items-center gap-2 text-sm text-muted-foreground">
                    <User className="size-4 text-primary" aria-hidden /> Recipient
                  </dt>
                  <dd className="mt-1 font-semibold">{result.recipientName}</dd>
                </div>
                <div>
                  <dt className="flex items-center gap-2 text-sm text-muted-foreground">
                    <GraduationCap className="size-4 text-primary" aria-hidden /> Course
                  </dt>
                  <dd className="mt-1 font-semibold">{result.courseTitle}</dd>
                </div>
                <div>
                  <dt className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CalendarDays className="size-4 text-primary" aria-hidden /> Issued at
                  </dt>
                  <dd className="mt-1 font-semibold">{result.issuedAt}</dd>
                </div>
              </dl>

              {result.pdfUrl && (
                <div className="mt-8 flex flex-wrap items-center gap-3 rounded-xl bg-accent px-4 py-4">
                  <FileText className="size-4 shrink-0 text-primary" aria-hidden />
                  <a
                    href={result.pdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="min-w-0 break-all text-sm font-medium text-primary underline-offset-4 hover:underline"
                  >
                    Download Certificate PDF
                  </a>
                </div>
              )}
            </div>
          </section>
        ) : null}

        {notFound ? (
          <section className="surface-card mt-10 p-8 text-center">
            <span className="mx-auto grid size-12 place-items-center rounded-full bg-destructive/10 text-destructive">
              <ShieldAlert className="size-5" aria-hidden />
            </span>
            <h2 className="mt-4 text-xl font-bold">No certificate found</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              We couldn't find a valid certificate with that ID. Check the ID and try again.
            </p>
          </section>
        ) : null}
      </main>
    </div>
  );
}
