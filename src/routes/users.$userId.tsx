import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  Briefcase,
  CalendarDays,
  Mail,
  MapPin,
  Pencil,
  Phone,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { getUserById } from "@/lib/users-api";
import { formatRole } from "./users.index";
import { useAuth, isAdmin } from "@/lib/auth-context";
import { getMediaUrl } from "@/lib/utils";
import type { AuthUser } from "@/lib/api-types";

export const Route = createFileRoute("/users/$userId")({
  head: () => ({
    meta: [
      { title: "User Profile | Lumina Learning" },
      { name: "description", content: "View member profile details, contact information, role, and skills." },
      { property: "og:title", content: "User Profile | Lumina Learning" },
      { property: "og:description", content: "View member profile details." },
      { property: "og:type", content: "website" },
    ],
  }),
  component: UserProfilePage,
});

function UserProfilePage() {
  const { userId } = useParams({ from: "/users/$userId" });
  const { user: currentUser } = useAuth();
  const isUserAdmin = isAdmin(currentUser?.role as any);
  const isSelf = currentUser?.id === Number(userId);

  const { data: u, isLoading, isError } = useQuery({
    queryKey: ["user", userId],
    queryFn: () => getUserById(userId),
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-canvas">
        <div className="flex h-96 items-center justify-center">
          <div className="size-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </div>
    );
  }

  if (isError || !u) {
    return (
      <div className="min-h-screen bg-canvas">
        <div className="mx-auto max-w-[1100px] px-6 py-16 text-center">
          <h1 className="text-2xl font-bold">User Not Found</h1>
          <p className="mt-2 text-muted-foreground">The requested user profile does not exist.</p>
          <Button asChild className="mt-6 rounded-lg">
            <Link to="/">Back to Home</Link>
          </Button>
        </div>
      </div>
    );
  }

  const displayName = u.first_name || u.last_name
    ? `${u.first_name || ""} ${u.last_name || ""}`.trim()
    : u.username;

  const roleStr = formatRole(u.role);
  const email = u.email || "No email provided";
  const phone = u.phone || u.phone_number || u.contact_phone || "Not provided";
  const location = u.location || u.address || u.full_address || u.contact_address || "Not specified";
  const bio = u.bio || "No biography provided yet.";
  const experience = u.experience || "No background information provided.";
  const joinedDate = u.date_joined ? new Date(u.date_joined).toLocaleDateString() : "Unknown";

  const skillsList = Array.isArray(u.skills)
    ? u.skills
    : typeof u.skills === "string" && u.skills
    ? (u.skills as string).split(",").map((s) => s.trim()).filter(Boolean)
    : [];

  const profilePicUrl = getMediaUrl(u.profile_picture || u.avatar);

  const facts = [
    { label: "Date Joined", value: joinedDate, icon: CalendarDays },
    { label: "Location", value: location, icon: MapPin },
    { label: "Role Permission", value: roleStr, icon: ShieldCheck },
  ];

  const contact = [
    { label: "Email Address", value: email, icon: Mail, href: `mailto:${email}` },
    { label: "Phone Number", value: phone, icon: Phone, href: `tel:${phone}` },
    { label: "Location", value: location, icon: MapPin },
  ];

  return (
    <div className="min-h-screen bg-canvas">

      <main className="mx-auto max-w-[1100px] px-6 py-8 md:px-8">
        {isUserAdmin && (
          <Link
            to="/users"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground mb-3"
          >
            <ArrowLeft className="size-4" aria-hidden /> Back to user management
          </Link>
        )}

        <section className="surface-card p-8">
          <div className="flex flex-wrap items-center gap-6">
            {profilePicUrl ? (
              <img
                src={profilePicUrl}
                alt={displayName}
                className="size-24 shrink-0 rounded-full border-2 border-border object-cover shadow-sm"
              />
            ) : (
              <div className="flex size-24 shrink-0 items-center justify-center rounded-full border-2 border-border bg-primary-soft text-2xl font-bold text-primary shadow-sm">
                {displayName ? displayName.slice(0, 2).toUpperCase() : "??"}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">{displayName}</h1>
                <span className="rounded-full bg-success-soft px-3.5 py-1 text-xs font-semibold text-success">
                  {roleStr}
                </span>
              </div>
              <p className="mt-1 text-muted-foreground">{email}</p>
            </div>
            {(isUserAdmin || isSelf) && (
              <Button asChild className="rounded-lg px-6 gap-2">
                <Link
                  to={isSelf && !isUserAdmin ? "/settings/profile" : "/users/$userId/edit"}
                  params={{ userId }}
                >
                  <Pencil className="size-4" aria-hidden /> Edit Profile
                </Link>
              </Button>
            )}
          </div>

          <p className="mt-8 max-w-3xl text-muted-foreground">{bio}</p>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {facts.map((f) => (
              <div key={f.label} className="rounded-2xl border border-border bg-card p-5">
                <p className="flex items-center gap-2 text-sm text-muted-foreground">
                  <f.icon className="size-4 text-primary" aria-hidden /> {f.label}
                </p>
                <p className="mt-1 font-semibold">{f.value}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-[1.3fr_1fr]">
          <div className="surface-card space-y-6 p-8">
            <div>
              <h2 className="flex items-center gap-2 text-xl font-bold">
                <Sparkles className="size-5 text-primary" aria-hidden /> About & Bio
              </h2>
              <p className="mt-4 text-xl font-semibold leading-relaxed">“{bio}”</p>
            </div>

            {skillsList.length > 0 && (
              <div className="border-t border-border pt-6">
                <h3 className="text-lg font-bold">Professional Skills</h3>
                <div className="mt-3 flex flex-wrap gap-2">
                  {skillsList.map((s) => (
                    <span
                      key={s}
                      className="rounded-full bg-primary-soft px-3 py-1.5 text-xs font-semibold text-primary"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="border-t border-border pt-6">
              <h3 className="flex items-center gap-2 text-lg font-bold">
                <Briefcase className="size-4 text-primary" aria-hidden /> Background & Experience
              </h3>
              <p className="mt-2 text-muted-foreground leading-relaxed">{experience}</p>
            </div>
          </div>

          <div className="surface-card p-8">
            <h2 className="text-xl font-bold">Contact Information</h2>
            <ul className="mt-6 space-y-5">
              {contact.map((c) => (
                <li key={c.label} className="flex gap-3">
                  <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary">
                    <c.icon className="size-4" aria-hidden />
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-muted-foreground">{c.label}</p>
                    {c.href ? (
                      <a href={c.href} className="break-words font-medium text-primary underline-offset-4 hover:underline">
                        {c.value}
                      </a>
                    ) : (
                      <p className="break-words font-medium">{c.value}</p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </main>
    </div>
  );
}
