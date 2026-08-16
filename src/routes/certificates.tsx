import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { BadgeCheck, CalendarDays, Download, GraduationCap } from "lucide-react";

import { Button } from "@/components/ui/button";
import { getCertificates } from "@/lib/payments-certificates-api";
import { getCourseById } from "@/lib/courses-api";
import { getMediaUrl } from "@/lib/utils";
import type { Certificate } from "@/lib/api-types";

export const Route = createFileRoute("/certificates")({
  head: () => ({
    meta: [
      { title: "My Certificates | Lumina Learning" },
      { name: "description", content: "Manage and download the credentials you have earned on Lumina Learning." },
      { property: "og:title", content: "My Certificates | Lumina Learning" },
      { property: "og:description", content: "Manage and download your earned credentials." },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "canonical", href: "/certificates" }],
  }),
  component: Certificates,
});

function CertificateCard({ cert }: { cert: Certificate }) {
  const courseId = typeof cert.course === "object" ? cert.course.id : cert.course;
  const initialTitle = typeof cert.course === "object" ? cert.course.title : cert.course_title;

  // Fetch course details if course title is missing
  const { data: courseData, isLoading: isCourseLoading } = useQuery({
    queryKey: ["course", courseId],
    queryFn: () => getCourseById(courseId),
    enabled: !initialTitle && !!courseId,
  });

  const courseTitle = initialTitle || courseData?.title;
  const pdfUrl = getMediaUrl(cert.pdf_file || cert.pdf_url);
  const uuid = cert.certificate_id || cert.uuid || String(cert.id);

  return (
    <article className="surface-card flex flex-col p-8 py-10 justify-between rounded-2xl border border-border/70 transition-all duration-300 hover:border-primary/40 hover:bg-accent/20 hover:shadow-xl hover:-translate-y-1.5 group cursor-pointer">
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold text-primary uppercase tracking-wider">
          <BadgeCheck className="size-4 shrink-0 text-primary transition-transform duration-300 group-hover:scale-110" aria-hidden /> Official Credential
        </div>

        {!courseTitle && isCourseLoading ? (
          <div className="mt-3 h-8 w-3/4 animate-pulse rounded-lg bg-muted" />
        ) : (
          <h2 className="mt-3 text-xl font-semibold tracking-tight text-foreground sm:text-2xl transition-colors group-hover:text-primary">
            {courseTitle || `Course #${courseId}`}
          </h2>
        )}

        <p className="mt-4 flex items-center gap-2 text-xs text-muted-foreground break-all">
          <span className="font-medium text-foreground">UUID:</span> {uuid}
        </p>
        <p className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
          <CalendarDays className="size-4 shrink-0 text-primary" aria-hidden />
          <span className="font-medium text-foreground">Issued:</span> {new Date(cert.issued_at).toLocaleDateString()}
        </p>
      </div>

      <div className="mt-4 pt-3 border-t border-border/60">
        {pdfUrl ? (
          <Button asChild className="h-12 w-full gap-2.5 rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition-all">
            <a href={pdfUrl} target="_blank" rel="noopener noreferrer">
              <Download className="size-5" aria-hidden /> Download Certificate PDF
            </a>
          </Button>
        ) : (
          <Button variant="secondary" disabled className="h-12 w-full gap-2 rounded-xl text-sm font-semibold">
            <Download className="size-4" aria-hidden /> Certificate Processing
          </Button>
        )}
      </div>
    </article>
  );
}

function Certificates() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["my-certificates"],
    queryFn: async () => {
      const res = await getCertificates();
      return Array.isArray(res) ? res : res.results ?? [];
    },
  });

  const certificates: Certificate[] = data ?? [];

  return (
    <div className="min-h-screen bg-canvas-rose/40">

      <main className="mx-auto max-w-[1280px] px-6 py-8 md:px-8">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">My Certificates</h1>
        <p className="mt-2 text-muted-foreground">Manage and download your earned credentials.</p>

        {isLoading ? (
          <div className="mt-12 flex justify-center">
            <div className="size-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : isError ? (
          <div className="mt-12 text-center text-destructive">
            Failed to load your certificates. Ensure you are signed in.
          </div>
        ) : (
          <section className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {certificates.map((c) => (
              <CertificateCard key={c.id} cert={c} />
            ))}

            <article className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-primary/40 p-8 text-center min-h-[220px] transition-all duration-300 hover:border-primary hover:bg-accent/15 hover:shadow-lg hover:-translate-y-1 group">
              <span className="grid size-14 place-items-center rounded-full bg-primary-soft text-primary transition-transform duration-300 group-hover:scale-110">
                <GraduationCap className="size-6" aria-hidden />
              </span>
              <h2 className="mt-5 text-xl font-bold transition-colors group-hover:text-primary">Keep Learning</h2>
              <p className="mt-2 text-sm text-muted-foreground">Complete more courses to earn new certificates.</p>
              <Button asChild variant="outline" className="mt-6 rounded-lg px-6">
                <Link to="/courses">Browse Courses</Link>
              </Button>
            </article>
          </section>
        )}
      </main>
    </div>
  );
}
