import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Check, KeyRound, Lock, LogOut, Pencil, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { getMediaUrl } from "@/lib/utils";

export const Route = createFileRoute("/settings/profile")({
  head: () => ({
    meta: [
      { title: "Profile Settings | Lumina Learning" },
      { name: "description", content: "Manage your personal information, photo, bio, skills and experience." },
      { property: "og:title", content: "Profile Settings | Lumina Learning" },
      { property: "og:description", content: "Manage your personal information and preferences." },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "canonical", href: "/settings/profile" }],
  }),
  component: ProfileSettings,
});

const inputClass =
  "h-12 w-full rounded-xl border border-input bg-card px-4 text-sm outline-none transition-shadow placeholder:text-muted-foreground focus:ring-2 focus:ring-ring/30";
const lockedClass =
  "h-12 w-full rounded-xl border border-input bg-primary-soft/50 pl-11 pr-4 text-sm text-muted-foreground outline-none";
const labelClass = "text-xs font-semibold text-foreground";

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="surface-card p-8">
      <h2 className="text-xl font-bold">{title}</h2>
      <div className="mt-6">{children}</div>
    </section>
  );
}

function EditableField({
  id,
  label,
  value,
  onChange,
  multiline = false,
  rows = 5,
  maxLength,
  placeholder,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (next: string) => void;
  multiline?: boolean;
  rows?: number;
  maxLength?: number;
  placeholder?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  const start = () => {
    setDraft(value);
    setEditing(true);
  };
  const save = () => {
    onChange(draft);
    setEditing(false);
    toast.success(`${label} updated`);
  };

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <label htmlFor={id} className={labelClass}>
          {label}
        </label>
        {editing ? (
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={save}
              aria-label={`Save ${label}`}
              className="rounded-md p-1.5 text-success hover:bg-accent"
            >
              <Check className="size-4" aria-hidden />
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              aria-label={`Cancel editing ${label}`}
              className="rounded-md p-1.5 text-muted-foreground hover:bg-accent"
            >
              <X className="size-4" aria-hidden />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={start}
            aria-label={`Edit ${label}`}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-primary"
          >
            <Pencil className="size-4" aria-hidden />
          </button>
        )}
      </div>

      {editing ? (
        multiline ? (
          <textarea
            id={id}
            rows={rows}
            maxLength={maxLength}
            autoFocus
            value={draft}
            placeholder={placeholder}
            onChange={(e) => setDraft(e.target.value)}
            className="mt-2 w-full rounded-xl border border-input bg-card p-4 text-sm outline-none transition-shadow placeholder:text-muted-foreground focus:ring-2 focus:ring-ring/30"
          />
        ) : (
          <input
            id={id}
            autoFocus
            value={draft}
            placeholder={placeholder}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                save();
              }
              if (e.key === "Escape") setEditing(false);
            }}
            className={`${inputClass} mt-2`}
          />
        )
      ) : (
        <p
          className={`mt-2 whitespace-pre-line rounded-xl bg-accent/60 px-4 text-sm ${
            multiline ? "py-3 leading-relaxed" : "flex h-12 items-center"
          } ${value ? "" : "text-muted-foreground"}`}
        >
          {value || placeholder || "Not set"}
        </p>
      )}
    </div>
  );
}

function ProfileSettings() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [fullName, setFullName] = useState(
    user?.first_name ? `${user.first_name} ${user.last_name || ""}`.trim() : "Jane Doe",
  );
  const [phone, setPhone] = useState(user?.phone_number || user?.phone || "+1 (555) 123-4567");
  const [location, setLocation] = useState(user?.location || user?.address || "San Francisco, CA");
  const [bio, setBio] = useState(
    user?.bio ||
      "I am a passionate lifelong learner focusing on design and technology. Currently expanding my skill set in UI/UX through Serene Academy courses.",
  );
  const [experience, setExperience] = useState(
    user?.experience ||
      "Brand marketing associate at Northwind (2020–2023), currently freelancing on product design projects.",
  );
  const [skills, setSkills] = useState(
    Array.isArray(user?.skills)
      ? user.skills
      : typeof user?.skills === "string" && user.skills
      ? user.skills.split(",").map((s) => s.trim()).filter(Boolean)
      : ["UI Design", "UX Research"],
  );
  const [newSkill, setNewSkill] = useState("");
  const [editingSkills, setEditingSkills] = useState(false);

  const avatarUrl = getMediaUrl(user?.profile_picture || user?.avatar);
  const userInitials = user?.first_name
    ? `${user.first_name[0] || ""}${user.last_name?.[0] || ""}`.toUpperCase()
    : "JD";

  const addSkill = () => {
    const value = newSkill.trim();
    if (!value || skills.includes(value)) return;
    setSkills((s) => [...s, value]);
    setNewSkill("");
  };

  return (
    <div className="min-h-screen bg-canvas-rose/40">

      <main className="mx-auto max-w-[1000px] px-6 py-8 md:px-8">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
          <div className="min-w-0">
            <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">Profile Settings</h1>
            <p className="mt-2 text-muted-foreground">
              Tap the pencil beside a field to edit it, then save your changes.
            </p>
          </div>
          <Button className="rounded-lg px-6" onClick={() => toast.success("Profile updated")}>
            Save Changes
          </Button>
        </div>

        <div className="mt-10 space-y-8">
          <Card title="Profile Picture">
            <div className="flex flex-wrap items-center gap-6">
              <Avatar className="size-28">
                {avatarUrl ? (
                  <AvatarImage src={avatarUrl} alt="Your avatar" className="object-cover" />
                ) : (
                  <AvatarImage src="https://i.pravatar.cc/240?img=45" alt="Your avatar" />
                )}
                <AvatarFallback>{userInitials}</AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="text-sm text-muted-foreground">
                  Upload a new avatar. Larger image will be resized automatically.
                  <br />
                  Maximum upload size is 5 MB.
                </p>
                <div className="mt-4 flex items-center gap-5">
                  <Button variant="outline" className="rounded-lg px-5">
                    Change Photo
                  </Button>
                  <button className="text-sm text-muted-foreground hover:text-primary">Remove</button>
                </div>
              </div>
            </div>
          </Card>

          <Card title="Personal Information">
            <div className="grid gap-5 sm:grid-cols-2">
              <EditableField id="full-name" label="Full Name" value={fullName} onChange={setFullName} />
              <div>
                <label htmlFor="role" className={labelClass}>
                  Role
                </label>
                <div className="relative mt-2">
                  <Lock className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
                  <input id="role" value="Student" readOnly className={lockedClass} />
                </div>
              </div>
              <div>
                <label htmlFor="email" className={labelClass}>
                  Email Address
                </label>
                <div className="relative mt-2">
                  <Lock className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
                  <input id="email" value="jane.doe@example.com" readOnly className={lockedClass} />
                </div>
              </div>
              <EditableField id="phone" label="Phone Number" value={phone} onChange={setPhone} />
              <div className="sm:col-span-2">
                <EditableField id="location" label="Location" value={location} onChange={setLocation} />
              </div>
            </div>
          </Card>

          <Card title="About Me">
            <EditableField id="bio" label="Bio" value={bio} onChange={setBio} multiline maxLength={500} />
            <p className="mt-2 text-right text-xs font-semibold text-muted-foreground">{bio.length} / 500</p>
          </Card>

          <Card title="Skills">
            <div className="flex items-center justify-between gap-3">
              <p className={labelClass}>Professional Skills</p>
              <button
                type="button"
                onClick={() => setEditingSkills((v) => !v)}
                aria-label={editingSkills ? "Finish editing skills" : "Edit skills"}
                className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-primary"
              >
                {editingSkills ? <Check className="size-4" aria-hidden /> : <Pencil className="size-4" aria-hidden />}
              </button>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {skills.length === 0 ? (
                <p className="text-sm text-muted-foreground">No skills added yet.</p>
              ) : (
                skills.map((s) => (
                  <span
                    key={s}
                    className="flex items-center gap-1.5 rounded-full bg-primary-soft px-3 py-1.5 text-xs font-semibold text-primary"
                  >
                    {s}
                    {editingSkills ? (
                      <button onClick={() => setSkills((prev) => prev.filter((x) => x !== s))} aria-label={`Remove ${s}`}>
                        <X className="size-3.5" aria-hidden />
                      </button>
                    ) : null}
                  </span>
                ))
              )}
            </div>
            {editingSkills ? (
              <div className="mt-5 flex gap-3">
                <input
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSkill())}
                  placeholder="Add a skill…"
                  aria-label="Add a skill"
                  className={`${inputClass} rounded-full`}
                />
                <Button variant="outline" className="rounded-full px-7" onClick={addSkill}>
                  Add
                </Button>
              </div>
            ) : null}
          </Card>

          <Card title="Experience">
            <EditableField
              id="experience"
              label="Professional Background"
              value={experience}
              onChange={setExperience}
              multiline
              placeholder="Describe your previous roles and achievements…"
            />
          </Card>

          <Card title="Account">
            <div className="flex flex-wrap items-center gap-3">
              <Button
                variant="outline"
                className="gap-2 rounded-lg px-6"
                onClick={() => toast.success("Reset password link sent to email")}
              >
                <KeyRound className="size-4" aria-hidden /> Reset Password
              </Button>
              <Button
                variant="outline"
                className="gap-2 rounded-lg px-6 text-destructive"
                onClick={() => {
                  toast.success("You have been logged out");
                  void navigate({ to: "/auth/login" });
                }}
              >
                <LogOut className="size-4" aria-hidden /> Log Out
              </Button>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              We'll email you a secure link to choose a new password.
            </p>
          </Card>
        </div>
      </main>
    </div>
  );
}
