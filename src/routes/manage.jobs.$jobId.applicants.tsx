import { useMemo } from "react";
import { createFileRoute, Link, useNavigate, useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, CalendarDays, Mail, MapPin, Users } from "lucide-react";

import { AdminGuard } from "@/components/admin-guard";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getJobApplications, getJobById } from "@/lib/jobs-api";
import { getAllUsers, getUserById } from "@/lib/users-api";
import { buildUserLookupIndex, resolveUserDisplayName, type UserLookupIndex } from "@/lib/dashboard-audit-api";
import { getMediaUrl } from "@/lib/utils";
import type { JobApplication, PaginatedResponse } from "@/lib/api-types";

export const Route = createFileRoute("/manage/jobs/$jobId/applicants")({
  head: () => ({
    meta: [
      { title: "Job Applicants | Lumina Learning" },
      { name: "description", content: "Read cover letters and open applicant profiles to check their eligibility." },
      { property: "og:title", content: "Job Applicants | Lumina Learning" },
      { property: "og:description", content: "Read cover letters and review applicant profiles." },
      { property: "og:type", content: "website" },
    ],
  }),
  component: () => (
    <AdminGuard>
      <JobApplicants />
    </AdminGuard>
  ),
});

function ApplicantCard({
  application,
  userIndex,
}: {
  application: JobApplication;
  userIndex?: UserLookupIndex;
}) {
  const navigate = useNavigate();
  const userInfo = resolveUserDisplayName(application, userIndex);

  const rawApp = application as unknown as Record<string, unknown>;
  const numericId =
    userInfo.userId ||
    (typeof application.user === "number"
      ? application.user
      : typeof rawApp["user_id"] === "number"
      ? (rawApp["user_id"] as number)
      : typeof rawApp["applicant"] === "number"
      ? (rawApp["applicant"] as number)
      : typeof rawApp["applicant_id"] === "number"
      ? (rawApp["applicant_id"] as number)
      : undefined);

  const { data: directUserProfile } = useQuery({
    queryKey: ["user-applicant", numericId],
    queryFn: () => getUserById(numericId!),
    enabled: !!numericId,
    staleTime: 5 * 60 * 1000,
  });

  const indexedUser = numericId && userIndex ? userIndex.byId.get(numericId) : undefined;
  const embeddedUser = typeof application.user === "object" ? application.user : undefined;

  const firstName =
    directUserProfile?.first_name ||
    indexedUser?.first_name ||
    userInfo.firstName ||
    embeddedUser?.first_name ||
    (rawApp["first_name"] as string) ||
    "";

  const lastName =
    directUserProfile?.last_name ||
    indexedUser?.last_name ||
    userInfo.lastName ||
    embeddedUser?.last_name ||
    (rawApp["last_name"] as string) ||
    "";

  const fullName = `${firstName} ${lastName}`.trim();

  // Name resolution strictly prioritizing first_name + last_name
  let name = fullName;
  if (!name) {
    name = (
      directUserProfile?.username ||
      indexedUser?.username ||
      userInfo.name ||
      (embeddedUser as any)?.username ||
      (rawApp["username"] as string) ||
      ""
    )
      .replace(/\s*\([A-Za-z0-9_-]+\)\s*$/, "")
      .replace(/^applicant\s*#?/i, "")
      .replace(/^user\s*#?/i, "")
      .trim();
  }

  if (!name) {
    name = "Applicant";
  }

  const email =
    directUserProfile?.email ||
    indexedUser?.email ||
    userInfo.email ||
    embeddedUser?.email ||
    (rawApp["email"] as string);

  const rawAvatar =
    directUserProfile?.profile_picture ||
    (directUserProfile as any)?.avatar ||
    indexedUser?.profile_picture ||
    (indexedUser as any)?.avatar ||
    userInfo.avatar ||
    embeddedUser?.profile_picture ||
    (rawApp["profile_picture"] as string);

  const avatar = getMediaUrl(rawAvatar);
  const userLocation =
    directUserProfile?.location || indexedUser?.location || (typeof (embeddedUser as any)?.location === "string" ? (embeddedUser as any).location : undefined);

  const rawSkills = directUserProfile?.skills || indexedUser?.skills;
  const skills: string[] = Array.isArray(rawSkills)
    ? rawSkills
    : typeof rawSkills === "string"
    ? (rawSkills as string).split(",").map((s) => s.trim()).filter(Boolean)
    : [];

  const appliedDate = application.created_at || application.applied_at;
  const targetUserId = numericId || userInfo.userId;

  const handleCardClick = () => {
    if (targetUserId) {
      void navigate({ to: "/users/$userId", params: { userId: String(targetUserId) } });
    }
  };

  return (
    <li
      onClick={handleCardClick}
      className={`surface-card group p-7 transition-all duration-200 hover:border-primary/40 hover:bg-accent/30 hover:shadow-md ${
        targetUserId ? "cursor-pointer" : ""
      }`}
    >
      <div className="flex flex-wrap items-start gap-4">
        {targetUserId ? (
          <Link
            to="/users/$userId"
            params={{ userId: String(targetUserId) }}
            onClick={(e) => e.stopPropagation()}
            className="group/avatar shrink-0 transition-transform duration-300 group-hover:scale-105"
            title={`View ${name}'s profile`}
          >
            <Avatar className="size-14 border border-border">
              {avatar ? <AvatarImage src={avatar} alt={name} className="object-cover" /> : null}
              <AvatarFallback className="bg-primary-soft font-bold text-base text-primary">
                {name.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </Link>
        ) : (
          <Avatar className="size-14 border border-border shrink-0 transition-transform duration-300 group-hover:scale-105">
            {avatar ? <AvatarImage src={avatar} alt={name} className="object-cover" /> : null}
            <AvatarFallback className="bg-primary-soft font-bold text-base text-primary">
              {name.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        )}

        <div className="min-w-[200px] flex-1">
          {targetUserId ? (
            <Link
              to="/users/$userId"
              params={{ userId: String(targetUserId) }}
              onClick={(e) => e.stopPropagation()}
              className="text-xl font-bold group-hover:text-primary transition-colors underline-offset-2 hover:underline inline-block"
            >
              {name}
            </Link>
          ) : (
            <h3 className="text-xl font-bold group-hover:text-primary transition-colors">{name}</h3>
          )}
          <div className="mt-1 flex flex-wrap gap-4 text-sm text-muted-foreground">
            {email && (
              <span className="inline-flex items-center gap-1.5">
                <Mail className="size-4 text-primary" aria-hidden /> {email}
              </span>
            )}
            {userLocation && (
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="size-4 text-primary" aria-hidden /> {userLocation}
              </span>
            )}
            {appliedDate && (
              <span className="inline-flex items-center gap-1.5">
                <CalendarDays className="size-4 text-primary" aria-hidden /> Applied{" "}
                {new Date(appliedDate).toLocaleDateString()}
              </span>
            )}
          </div>
          {skills.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2" onClick={(e) => e.stopPropagation()}>
              {skills.map((s: string) => (
                <span key={s} className="rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold text-primary">
                  {s}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {application.cover_letter && (
        <div className="mt-5 rounded-xl bg-accent p-5" onClick={(e) => e.stopPropagation()}>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Cover letter</p>
          <p className="mt-2 text-sm leading-relaxed whitespace-pre-line text-foreground/90">{application.cover_letter}</p>
        </div>
      )}
    </li>
  );
}

function JobApplicants() {
  const { jobId } = useParams({ from: "/manage/jobs/$jobId/applicants" });

  const { data: job } = useQuery({
    queryKey: ["job", jobId],
    queryFn: () => getJobById(jobId),
    enabled: !!jobId,
  });

  const { data: appsData, isLoading } = useQuery({
    queryKey: ["job-applicants", jobId],
    queryFn: () => getJobApplications({ job: jobId }),
    enabled: !!jobId,
  });

  const { data: usersData } = useQuery({
    queryKey: ["users-all-lookup"],
    queryFn: () => getAllUsers(),
    staleTime: 5 * 60 * 1000,
  });

  const userIndex = useMemo(() => {
    return buildUserLookupIndex(usersData);
  }, [usersData]);

  let applicants: JobApplication[] = [];
  if (appsData) {
    if (Array.isArray(appsData)) {
      applicants = appsData;
    } else {
      const paginated = appsData as PaginatedResponse<JobApplication>;
      applicants = paginated.results ?? [];
    }
  }

  return (
    <div className="min-h-screen bg-canvas">
      <main className="mx-auto max-w-[960px] px-6 py-8 md:px-8">
        <Link to="/manage/jobs" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" aria-hidden /> Back to my job postings
        </Link>

        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">Applicants</h1>
        <p className="mt-2 text-muted-foreground">
          {applicants.length} {applicants.length === 1 ? "person has" : "people have"} applied to{" "}
          <span className="font-medium text-foreground">{job?.title || `Job #${jobId}`}</span>
          {job?.company ? ` · ${job.company}` : ""}
          {job?.location ? ` · ${job.location}` : ""}
        </p>

        {isLoading ? (
          <div className="mt-12 flex justify-center">
            <div className="size-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : applicants.length === 0 ? (
          <div className="surface-card mt-10 grid place-items-center gap-3 p-16 text-center">
            <Users className="size-8 text-muted-foreground" aria-hidden />
            <p className="text-lg font-semibold">No applications yet</p>
            <p className="text-sm text-muted-foreground">
              Applications will appear here as soon as candidates apply to this role.
            </p>
          </div>
        ) : (
          <ul className="mt-10 space-y-5">
            {applicants.map((a) => (
              <ApplicantCard key={a.id} application={a} userIndex={userIndex} />
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
